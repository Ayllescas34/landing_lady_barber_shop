import type { Payload } from 'payload'
import { addDays, formatDateLong, formatTime12, minutesToTime, timeToMinutes } from './time'

/** Tipos de correo que recibe el cliente sobre su cita. */
export type AppointmentEmailKind =
  | 'received' // reservó en la web (pendiente)
  | 'confirmed' // la barbería confirmó
  | 'cancelled' // la barbería canceló / rechazó
  | 'cancelledByClient' // el cliente canceló desde el enlace
  | 'rescheduled' // cambió el día o la hora
  | 'reminder' // recordatorio del día anterior

export type EmailAppointment = {
  id: number | string
  customerName: string
  email?: string | null
  dateKey?: string | null
  time: string
  duration?: number | null
  code?: string | null
  manageToken?: string | null
  service?: unknown
}

const SITE = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function manageUrl(a: Pick<EmailAppointment, 'id' | 'manageToken'>) {
  return `${SITE()}/cita/${a.id}?t=${a.manageToken}`
}

function googleCalendarUrl(a: EmailAppointment, serviceName: string, business: string, address: string) {
  const [y, m, d] = (a.dateKey || '').split('-')
  const start = timeToMinutes(a.time)
  const endMin = start + (a.duration || 30)
  const fmt = (min: number) => `${y}${m}${d}T${minutesToTime(min).replace(':', '')}00`
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${serviceName || 'Cita'} · ${business}`,
    dates: `${fmt(start)}/${fmt(endMin)}`,
    ctz: 'America/Guatemala',
    details: `Código de reserva: ${a.code || ''}\nVer o cancelar: ${manageUrl(a)}`,
    location: address,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function waUrl(number: string | null | undefined, text: string) {
  const d = (number || '').replace(/\D/g, '')
  return d ? `https://wa.me/${d}?text=${encodeURIComponent(text)}` : null
}

const COPY: Record<
  AppointmentEmailKind,
  { subject: (date: string) => string; title: string; intro: string; badge: { text: string; color: string; bg: string } }
> = {
  received: {
    subject: (d) => `Recibimos tu solicitud de cita · ${d}`,
    title: '¡Recibimos tu solicitud!',
    intro: 'Tu horario ya está apartado. Te avisaremos por este medio cuando la cita quede confirmada.',
    badge: { text: 'Por confirmar', color: '#8a5d00', bg: '#fbf0d6' },
  },
  confirmed: {
    subject: (d) => `Tu cita está confirmada · ${d}`,
    title: '¡Tu cita está confirmada!',
    intro: 'Te esperamos. Llega 5 minutos antes, por favor.',
    badge: { text: 'Confirmada', color: '#1f6b65', bg: '#e0f1ef' },
  },
  cancelled: {
    subject: (d) => `Tu cita fue cancelada · ${d}`,
    title: 'Tu cita fue cancelada',
    intro: 'Lo sentimos, no podremos atenderte en este horario. Puedes elegir otro día cuando quieras.',
    badge: { text: 'Cancelada', color: '#6b6b6b', bg: '#eceae4' },
  },
  cancelledByClient: {
    subject: (d) => `Cancelaste tu cita · ${d}`,
    title: 'Tu cita quedó cancelada',
    intro: 'Gracias por avisarnos. Ese horario ya quedó libre. Cuando quieras, reserva otro día.',
    badge: { text: 'Cancelada', color: '#6b6b6b', bg: '#eceae4' },
  },
  rescheduled: {
    subject: (d) => `Tu cita cambió · ${d}`,
    title: 'Tu cita tiene un nuevo horario',
    intro: 'La barbería actualizó tu cita. Estos son los datos nuevos:',
    badge: { text: 'Actualizada', color: '#1f6b65', bg: '#e0f1ef' },
  },
  reminder: {
    subject: (d) => `Recordatorio: tu cita es mañana · ${d}`,
    title: 'Te esperamos mañana',
    intro: 'Te recordamos tu cita. Si no puedes asistir, cancélala con el botón de abajo para liberar el espacio.',
    badge: { text: 'Mañana', color: '#a63a3f', bg: '#f6e7e7' },
  },
}

function render(
  kind: AppointmentEmailKind,
  a: EmailAppointment,
  ctx: { serviceName: string; business: string; address: string; whatsapp?: string | null; wazeUrl?: string | null },
) {
  const c = COPY[kind]
  const site = SITE()
  const date = cap(formatDateLong(a.dateKey || ''))
  const time = formatTime12(a.time)
  const active = kind !== 'cancelled' && kind !== 'cancelledByClient'
  const wa = waUrl(ctx.whatsapp, `Hola, tengo una pregunta sobre mi cita del ${formatDateLong(a.dateKey || '')} (código ${a.code}).`)

  const btn = (href: string, label: string, primary = false) =>
    `<a href="${esc(href)}" style="display:inline-block;margin:4px 6px 4px 0;padding:12px 18px;border-radius:999px;font-weight:600;font-size:15px;text-decoration:none;${
      primary ? 'background:#a63a3f;color:#ffffff;' : 'background:#eef0f4;color:#1e2b45;'
    }">${esc(label)}</a>`

  const row = (label: string, value: string) =>
    `<tr><td style="padding:8px 0;color:#6b7080;font-size:14px;width:110px;vertical-align:top">${esc(label)}</td><td style="padding:8px 0;font-size:15px;color:#1f2433;font-weight:600">${value}</td></tr>`

  const buttons: string[] = []
  if (kind === 'confirmed' || kind === 'rescheduled' || kind === 'reminder')
    buttons.push(btn(googleCalendarUrl(a, ctx.serviceName, ctx.business, ctx.address), 'Agregar a mi calendario', true))
  if (active) buttons.push(btn(manageUrl(a), 'Ver o cancelar mi cita', kind === 'received'))
  if (!active) buttons.push(btn(`${site}/reservar`, 'Reservar otra cita', true))
  if (wa) buttons.push(btn(wa, 'Escribir por WhatsApp'))

  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#f4f1ea;font-family:Arial,Helvetica,sans-serif;color:#1f2433">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f1ea;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#1e2b45;padding:22px 24px" align="left">
  <img src="${site}/panel-icons/icon-192.png" width="52" height="52" alt="" style="border-radius:50%;background:#fff;vertical-align:middle">
  <span style="color:#f6f1e7;font-size:20px;font-weight:700;margin-left:12px;vertical-align:middle">${esc(ctx.business)}</span>
</td></tr>
<tr><td style="height:6px;background:repeating-linear-gradient(45deg,#a63a3f 0 10px,#f6f1e7 10px 20px,#1e2b45 20px 30px,#f6f1e7 30px 40px)"></td></tr>
<tr><td style="padding:28px 24px 8px">
  <span style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:700;color:${c.badge.color};background:${c.badge.bg}">${c.badge.text}</span>
  <h1 style="margin:14px 0 8px;font-size:24px;line-height:1.25;color:#1e2b45">${esc(c.title)}</h1>
  <p style="margin:0 0 8px;font-size:15px;line-height:1.55">Hola ${esc(a.customerName.split(' ')[0])},</p>
  <p style="margin:0 0 6px;font-size:15px;line-height:1.55">${esc(c.intro)}</p>
</td></tr>
<tr><td style="padding:8px 24px">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #ece8df;border-bottom:1px solid #ece8df">
    ${row('Servicio', esc(ctx.serviceName || 'Cita'))}
    ${row('Día', esc(date))}
    ${row('Hora', esc(time))}
    ${row('Dirección', esc(ctx.address) + (ctx.wazeUrl ? ` · <a href="${esc(ctx.wazeUrl)}" style="color:#a63a3f">Waze</a>` : ''))}
    ${row('Código', `<span style="font-family:Consolas,monospace;letter-spacing:2px;color:#a63a3f">${esc(a.code || '')}</span>`)}
  </table>
</td></tr>
<tr><td style="padding:18px 24px 26px">${buttons.join('')}</td></tr>
</table>
<p style="max-width:560px;margin:14px auto 0;font-size:12px;color:#8a8f9c;line-height:1.5">Recibes este correo porque reservaste una cita en ${esc(ctx.business)} (${esc(site.replace(/^https?:\/\//, ''))}).</p>
</td></tr></table></body></html>`

  const text = [
    c.title,
    '',
    `Hola ${a.customerName.split(' ')[0]},`,
    c.intro,
    '',
    `Servicio: ${ctx.serviceName || 'Cita'}`,
    `Día: ${date}`,
    `Hora: ${time}`,
    `Dirección: ${ctx.address}`,
    `Código: ${a.code || ''}`,
    '',
    active ? `Ver o cancelar tu cita: ${manageUrl(a)}` : `Reservar otra cita: ${site}/reservar`,
  ].join('\n')

  return { subject: `${c.subject(date)} — ${ctx.business}`, html, text }
}

/** Envía el correo al cliente. Nunca lanza error (no debe frenar la reserva). */
export async function sendAppointmentEmail(payload: Payload, kind: AppointmentEmailKind, a: EmailAppointment) {
  if (!a.email || !a.dateKey) return false
  try {
    const [site, serviceName] = await Promise.all([
      payload.findGlobal({ slug: 'site-info', depth: 0 }).catch(() => null),
      (async () => {
        if (a.service && typeof a.service === 'object' && 'name' in a.service) return String(a.service.name)
        if (a.service) {
          const s = await payload.findByID({ collection: 'services', id: a.service as number, depth: 0 }).catch(() => null)
          return s?.name || ''
        }
        return ''
      })(),
    ])
    const { subject, html, text } = render(kind, a, {
      serviceName,
      business: site?.businessName || 'Lady Barbershop',
      address: site?.address || 'Antigua Guatemala',
      whatsapp: site?.whatsapp,
      wazeUrl: site?.wazeUrl,
    })
    await payload.sendEmail({ to: a.email, subject, html, text })
    return true
  } catch (err) {
    payload.logger.error({ err }, `No se pudo enviar el correo "${kind}" de la cita ${a.id}`)
    return false
  }
}

/** Para el recordatorio: la fecha de mañana en Guatemala. */
export const tomorrowKey = (today: string) => addDays(today, 1)
