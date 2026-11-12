'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getPayloadClient } from '@/lib/payload'
import { notifyAdmins } from '@/lib/push'
import { revalidateSite } from '@/lib/revalidate'
import { dateKeyToISO, timeToMinutes } from '@/lib/time'

type Result = { ok: true } | { ok: false; error: string }

async function requireUser() {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) throw new Error('Tu sesión terminó. Vuelve a iniciar sesión.')
  return { payload, user }
}

async function run(fn: () => Promise<unknown>): Promise<Result> {
  try {
    await fn()
    revalidatePath('/panel')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message || 'No se pudo guardar. Intenta de nuevo.' }
  }
}

const KEY = /^\d{4}-\d{2}-\d{2}$/
const TIME = /^\d{2}:\d{2}$/
const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'noshow'] as const

/* ---------- Citas ---------- */

export async function setAppointmentStatus(id: number, status: string) {
  return run(async () => {
    const { payload } = await requireUser()
    const s = STATUSES.find((x) => x === status)
    if (!s) throw new Error('Estado no válido')
    await payload.update({ collection: 'appointments', id, data: { status: s } })
  })
}

export async function addAppointment(input: {
  name: string
  phone: string
  serviceId: number | null
  date: string
  time: string
  source: string
}) {
  return run(async () => {
    const { payload } = await requireUser()
    const name = input.name.trim().slice(0, 80)
    if (name.length < 2) throw new Error('Escribe el nombre del cliente.')
    if (!KEY.test(input.date) || !TIME.test(input.time)) throw new Error('Elige el día y la hora.')
    const source = (['whatsapp', 'walkin', 'admin'] as const).find((s) => s === input.source) || 'admin'
    await payload.create({
      collection: 'appointments',
      data: {
        customerName: name,
        phone: input.phone.trim().slice(0, 30) || '—',
        service: input.serviceId || undefined,
        date: dateKeyToISO(input.date),
        time: input.time as never,
        status: 'confirmed',
        source,
      },
    })
  })
}

/* ---------- Días ---------- */

export async function closeDays(start: string, end: string | null, note: string) {
  return run(async () => {
    const { payload } = await requireUser()
    if (!KEY.test(start) || (end && !KEY.test(end))) throw new Error('Fecha no válida')
    const until = end && end > start ? end : null
    await payload.create({
      collection: 'special-days',
      data: {
        type: 'closed',
        startDate: dateKeyToISO(start),
        endDate: until ? dateKeyToISO(until) : null,
        note: note.trim().slice(0, 60) || (until ? 'Vacaciones' : 'Cerrado'),
      },
    })
  })
}

export async function openDay(key: string, start: string, end: string) {
  return run(async () => {
    const { payload } = await requireUser()
    if (!KEY.test(key) || !TIME.test(start) || !TIME.test(end)) throw new Error('Datos no válidos')
    if (timeToMinutes(end) <= timeToMinutes(start)) throw new Error('La hora de cierre debe ser después de la de apertura.')
    await payload.create({
      collection: 'special-days',
      data: { type: 'open', startDate: dateKeyToISO(key), start: start as never, end: end as never },
    })
  })
}

export async function removeSpecialDay(id: number) {
  return run(async () => {
    const { payload } = await requireUser()
    await payload.delete({ collection: 'special-days', id })
  })
}

export async function setBookingEnabled(enabled: boolean) {
  return run(async () => {
    const { payload } = await requireUser()
    await payload.updateGlobal({ slug: 'booking-settings', data: { bookingEnabled: enabled } })
    revalidateSite()
  })
}

/* ---------- Precios ---------- */

export async function saveService(id: number, price: number | null, active: boolean) {
  return run(async () => {
    const { payload } = await requireUser()
    if (price !== null && (Number.isNaN(price) || price < 0 || price > 100000)) throw new Error('Precio no válido')
    await payload.update({ collection: 'services', id, data: { price, active } })
  })
}

/* ---------- Fotos ---------- */

export async function setPhotoFeatured(id: number, featured: boolean) {
  return run(async () => {
    const { payload } = await requireUser()
    await payload.update({ collection: 'gallery', id, data: { featured } })
  })
}

export async function deletePhoto(id: number) {
  return run(async () => {
    const { payload } = await requireUser()
    await payload.delete({ collection: 'gallery', id })
  })
}

/* ---------- Mensajes ---------- */

export async function setInquiryStatus(id: number, status: 'new' | 'progress' | 'done' | 'archived') {
  return run(async () => {
    const { payload } = await requireUser()
    await payload.update({ collection: 'inquiries', id, data: { status } })
  })
}

/* ---------- Avisos ---------- */

export async function savePushSubscription(sub: { endpoint: string; keys: { p256dh: string; auth: string } }, device: string) {
  return run(async () => {
    const { payload, user } = await requireUser()
    if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) throw new Error('Suscripción no válida')
    const existing = await payload.find({
      collection: 'push-subscriptions',
      where: { endpoint: { equals: sub.endpoint } },
      limit: 1,
    })
    const data = {
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      device: device.slice(0, 80),
      user: user.id as number,
    }
    if (existing.docs[0]) await payload.update({ collection: 'push-subscriptions', id: existing.docs[0].id, data })
    else await payload.create({ collection: 'push-subscriptions', data })
  })
}

export async function removePushSubscription(endpoint: string) {
  return run(async () => {
    const { payload } = await requireUser()
    await payload.delete({ collection: 'push-subscriptions', where: { endpoint: { equals: endpoint } } })
  })
}

export async function sendTestPush(): Promise<Result & { sent?: number }> {
  try {
    const { payload } = await requireUser()
    const r = await notifyAdmins(payload, {
      title: '💈 Aviso de prueba',
      body: '¡Listo! Así te avisaremos cuando llegue una reserva nueva.',
      url: '/panel',
      tag: 'prueba',
    })
    if (!r.sent) return { ok: false, error: 'No se pudo enviar. Revisa que los avisos estén activados.' }
    return { ok: true, sent: r.sent }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
