'use server'

import crypto from 'crypto'
import { headers } from 'next/headers'
import { getPayloadClient } from '@/lib/payload'
import { getCalendar, getSlots, loadSettings } from '@/lib/availability'
import { dateKeyToISO, todayKey } from '@/lib/time'

// --- Protección básica contra abuso (por IP, en memoria) -------------------
const hits = new Map<string, number[]>()
async function rateLimited(bucket: string, max: number, windowMs: number) {
  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0].trim() || h.get('x-real-ip') || 'local'
  const key = `${bucket}:${ip}`
  const now = Date.now()
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs)
  list.push(now)
  hits.set(key, list)
  return list.length > max
}

const clean = (v: unknown, max = 200) => String(v ?? '').trim().slice(0, max)
const phoneOk = (p: string) => p.replace(/\D/g, '').length >= 8
const emailOk = (e: string) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
const dateOk = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d)
const timeOk = (t: string) => /^\d{2}:\d{2}$/.test(t)

async function serviceDuration(serviceId: string) {
  const payload = await getPayloadClient()
  const svc = await payload.findByID({ collection: 'services', id: serviceId, depth: 0 }).catch(() => null)
  if (!svc || !svc.active || svc.bookable === false) return null
  return { payload, svc, duration: svc.duration || 30 }
}

export async function fetchCalendar(serviceId: string, barberId: string | null) {
  const found = await serviceDuration(serviceId)
  if (!found) return { enabled: false, from: '', to: '', days: [] as string[] }
  return getCalendar(found.payload, found.duration, barberId || null)
}

export async function fetchSlots(serviceId: string, date: string, barberId: string | null) {
  if (!dateOk(date)) return []
  const found = await serviceDuration(serviceId)
  if (!found) return []
  return getSlots(found.payload, date, found.duration, barberId || null)
}

export type BookingResult =
  | { ok: true; code: string; message: string }
  | { ok: false; error: string }

export async function bookAppointment(input: {
  serviceId: string
  barberId?: string | null
  date: string
  time: string
  name: string
  phone: string
  email?: string
  notes?: string
  website?: string // honeypot
}): Promise<BookingResult> {
  // Si un bot llenó el campo oculto, fingimos éxito y no guardamos nada.
  if (input.website) return { ok: true, code: '------', message: '¡Gracias!' }
  if (await rateLimited('book', 5, 10 * 60_000))
    return { ok: false, error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' }

  const name = clean(input.name, 80)
  const phone = clean(input.phone, 30)
  const email = clean(input.email, 120)
  const notes = clean(input.notes, 500)
  const date = clean(input.date, 10)
  const time = clean(input.time, 5)
  const barberId = input.barberId ? clean(input.barberId, 40) : null

  if (name.length < 2) return { ok: false, error: 'Escribe tu nombre.' }
  if (!phoneOk(phone)) return { ok: false, error: 'Escribe un número de teléfono válido.' }
  if (!email) return { ok: false, error: 'Escribe tu correo para enviarte la confirmación.' }
  if (!emailOk(email)) return { ok: false, error: 'El correo no es válido.' }
  if (!dateOk(date) || !timeOk(time)) return { ok: false, error: 'Elige fecha y hora.' }

  const found = await serviceDuration(clean(input.serviceId, 40))
  if (!found) return { ok: false, error: 'Ese servicio ya no está disponible.' }
  const { payload, svc, duration } = found

  // Volvemos a validar el horario en el servidor (evita choques de última hora)
  const slots = await getSlots(payload, date, duration, barberId)
  if (!slots.includes(time))
    return { ok: false, error: 'Ese horario acaba de ocuparse. Por favor elige otro.' }

  // Límite de citas activas por teléfono
  const digits = phone.replace(/\D/g, '')
  const existing = await payload.find({
    collection: 'appointments',
    depth: 0,
    limit: 10,
    where: {
      and: [
        { phone: { contains: digits.slice(-8) } },
        { dateKey: { greater_than_equal: todayKey() } },
        { status: { in: ['pending', 'confirmed'] } },
      ],
    },
  })
  if (existing.totalDocs >= 3)
    return { ok: false, error: 'Ya tienes varias citas pendientes. Escríbenos para ayudarte.' }

  const doc = await payload.create({
    collection: 'appointments',
    data: {
      customerName: name,
      phone,
      email,
      notes: notes || undefined,
      service: svc.id,
      barber: barberId ? Number(barberId) : undefined,
      date: dateKeyToISO(date),
      time: time as never,
      duration,
      status: 'pending',
      source: 'web',
    },
  })

  const settings = await loadSettings(payload)
  return {
    ok: true,
    code: doc.code || '',
    message:
      settings.successMessage ||
      '¡Gracias! Recibimos tu solicitud de cita. Te confirmaremos por WhatsApp a la brevedad.',
  }
}

export async function sendInquiry(input: {
  name: string
  phone?: string
  email?: string
  subject?: string
  productId?: string | null
  message: string
  website?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.website) return { ok: true }
  if (await rateLimited('inquiry', 5, 10 * 60_000))
    return { ok: false, error: 'Demasiados mensajes. Intenta más tarde.' }

  const name = clean(input.name, 80)
  const phone = clean(input.phone, 30)
  const email = clean(input.email, 120)
  const message = clean(input.message, 2000)
  const subjects = ['general', 'servicios', 'producto', 'eventos', 'otro'] as const
  const subject = subjects.find((s) => s === input.subject) || 'general'

  if (name.length < 2) return { ok: false, error: 'Escribe tu nombre.' }
  if (!phone && !email) return { ok: false, error: 'Déjanos un teléfono o correo para responderte.' }
  if (phone && !phoneOk(phone)) return { ok: false, error: 'El teléfono no es válido.' }
  if (!emailOk(email)) return { ok: false, error: 'El correo no es válido.' }
  if (message.length < 3) return { ok: false, error: 'Escribe tu mensaje.' }

  const payload = await getPayloadClient()
  const productId = input.productId ? Number(input.productId) : undefined
  await payload.create({
    collection: 'inquiries',
    data: {
      name,
      phone: phone || undefined,
      email: email || undefined,
      subject,
      product: productId && !Number.isNaN(productId) ? productId : undefined,
      message,
      status: 'new',
    },
  })
  return { ok: true }
}

/* ---------- El cliente cancela desde el enlace del correo ---------- */

function sameToken(a: string, b: string) {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb)
}

export async function cancelByCustomer(id: string, token: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (await rateLimited('cancel', 10, 10 * 60_000)) return { ok: false, error: 'Demasiados intentos. Intenta más tarde.' }
  const payload = await getPayloadClient()
  const appt = await payload.findByID({ collection: 'appointments', id: Number(id), depth: 0 }).catch(() => null)
  if (!appt || !appt.manageToken || !sameToken(String(token || ''), appt.manageToken))
    return { ok: false, error: 'El enlace no es válido.' }
  if (appt.status !== 'pending' && appt.status !== 'confirmed')
    return { ok: false, error: 'Esta cita ya no se puede cancelar.' }
  if ((appt.dateKey || '') < todayKey()) return { ok: false, error: 'Esta cita ya pasó.' }
  await payload.update({
    collection: 'appointments',
    id: appt.id,
    data: { status: 'cancelled', cancelledBy: 'client' },
  })
  return { ok: true }
}
