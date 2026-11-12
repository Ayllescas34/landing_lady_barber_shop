import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { sendAppointmentEmail } from '@/lib/emails'
import { addDays, todayKey } from '@/lib/time'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Recordatorio por correo de las citas de mañana.
 * Vercel Cron lo llama cada mañana (ver vercel.json) con el encabezado
 * "Authorization: Bearer <CRON_SECRET>".
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const payload = await getPayloadClient()
  const tomorrow = addDays(todayKey(), 1)
  const res = await payload.find({
    collection: 'appointments',
    depth: 1,
    limit: 500,
    pagination: false,
    where: {
      and: [
        { dateKey: { equals: tomorrow } },
        { status: { in: ['pending', 'confirmed'] } },
        { email: { exists: true } },
        { reminderSent: { not_equals: true } },
      ],
    },
  })

  let sent = 0
  for (const appt of res.docs) {
    if (!appt.email) continue
    const ok = await sendAppointmentEmail(payload, 'reminder', appt)
    if (ok) {
      sent++
      await payload.update({
        collection: 'appointments',
        id: appt.id,
        data: { reminderSent: true },
        context: { skipEmail: true },
      })
    }
  }

  return NextResponse.json({ date: tomorrow, found: res.docs.length, sent })
}
