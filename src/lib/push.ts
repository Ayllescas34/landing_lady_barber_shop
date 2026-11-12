import type { Payload } from 'payload'
import webpush from 'web-push'
import { todayKey } from './time'

let configured = false
function configure() {
  if (configured) return true
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return false
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:avisos@ladybarbershop.com', pub, priv)
  configured = true
  return true
}

export type PushMessage = { title: string; body: string; url?: string; tag?: string }

/** Cantidad de citas por confirmar (se muestra como numerito en el ícono de la app). */
async function pendingCount(payload: Payload) {
  const r = await payload.count({
    collection: 'appointments',
    where: { and: [{ status: { equals: 'pending' } }, { dateKey: { greater_than_equal: todayKey() } }] },
  })
  return r.totalDocs
}

/** Envía un aviso a todos los teléfonos registrados. Nunca lanza error. */
export async function notifyAdmins(payload: Payload, msg: PushMessage) {
  try {
    if (!configure()) {
      payload.logger.warn('Avisos push sin configurar (faltan claves VAPID en .env)')
      return { sent: 0, failed: 0 }
    }
    const [subs, badge] = await Promise.all([
      payload.find({ collection: 'push-subscriptions', limit: 100, pagination: false, depth: 0 }),
      pendingCount(payload).catch(() => undefined),
    ])
    const body = JSON.stringify({ ...msg, badge })
    let sent = 0
    let failed = 0
    await Promise.allSettled(
      subs.docs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            body,
            { TTL: 60 * 60 * 24, urgency: 'high' },
          )
          sent++
        } catch (err) {
          failed++
          const code = (err as { statusCode?: number }).statusCode
          // El teléfono ya no acepta avisos (app borrada o permiso quitado)
          if (code === 404 || code === 410) {
            await payload.delete({ collection: 'push-subscriptions', id: s.id }).catch(() => null)
          } else {
            payload.logger.error({ err }, 'No se pudo enviar aviso push')
          }
        }
      }),
    )
    return { sent, failed }
  } catch (err) {
    payload.logger.error({ err }, 'Error enviando avisos push')
    return { sent: 0, failed: 0 }
  }
}
