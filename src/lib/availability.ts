import type { Payload } from 'payload'
import { FREE_STATUSES } from '../collections/Appointments'
import {
  WEEKDAYS,
  addDays,
  minutesToTime,
  nowMinutes,
  timeToMinutes,
  todayKey,
  weekdayIndex,
} from './time'

type DayHours = { open?: boolean | null; start?: string | null; end?: string | null }

export type BookingSettingsData = {
  bookingEnabled?: boolean | null
  mode?: 'weekly' | 'manual' | null
  weekly?: Record<string, DayHours | undefined> | null
  lunchBreak?: { enabled?: boolean | null; start?: string | null; end?: string | null } | null
  slotMinutes?: string | null
  capacity?: number | null
  minNoticeHours?: number | null
  maxDaysAhead?: number | null
  bookingNotice?: string | null
  successMessage?: string | null
}

export type SpecialDay = {
  id?: number | string
  note?: string | null
  type: 'open' | 'closed'
  startKey?: string | null
  endKey?: string | null
  start?: string | null
  end?: string | null
}

type Busy = { start: number; end: number; barber: string | null }

export async function loadSettings(payload: Payload): Promise<BookingSettingsData> {
  return (await payload.findGlobal({ slug: 'booking-settings', depth: 0 })) as BookingSettingsData
}

export async function loadSpecialDays(payload: Payload, from: string, to: string): Promise<SpecialDay[]> {
  const res = await payload.find({
    collection: 'special-days',
    depth: 0,
    limit: 500,
    pagination: false,
    where: { and: [{ startKey: { less_than_equal: to } }, { endKey: { greater_than_equal: from } }] },
  })
  return res.docs as unknown as SpecialDay[]
}

async function loadBusy(payload: Payload, from: string, to: string): Promise<Map<string, Busy[]>> {
  const res = await payload.find({
    collection: 'appointments',
    depth: 0,
    limit: 2000,
    pagination: false,
    where: {
      and: [
        { dateKey: { greater_than_equal: from } },
        { dateKey: { less_than_equal: to } },
        { status: { not_in: FREE_STATUSES } },
      ],
    },
  })
  const map = new Map<string, Busy[]>()
  for (const a of res.docs as unknown as Array<Record<string, unknown>>) {
    const key = a.dateKey as string
    if (!key || !a.time) continue
    const start = timeToMinutes(a.time as string)
    const end = start + (Number(a.duration) || 30)
    const barber = a.barber ? String(a.barber) : null
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push({ start, end, barber })
  }
  return map
}

/** Horario de atención de un día concreto, o null si no se puede reservar. */
export function windowFor(key: string, s: BookingSettingsData, specials: SpecialDay[]) {
  const matches = specials.filter((d) => d.startKey && d.startKey <= key && (d.endKey || d.startKey) >= key)
  if (matches.some((d) => d.type === 'closed')) return null
  const open = matches.find((d) => d.type === 'open')
  if (open) return { start: open.start || '10:00', end: open.end || '18:00' }
  if (s.mode === 'manual') return null
  const day = s.weekly?.[WEEKDAYS[weekdayIndex(key)].key]
  if (!day?.open || !day.start || !day.end) return null
  return { start: day.start, end: day.end }
}

function slotsForDay(
  key: string,
  win: { start: string; end: string },
  s: BookingSettingsData,
  busy: Busy[],
  duration: number,
  barberId: string | null,
): string[] {
  const step = Number(s.slotMinutes) || 30
  const capacity = Math.max(1, Number(s.capacity) || 1)
  const open = timeToMinutes(win.start)
  const close = timeToMinutes(win.end)
  const lunch = s.lunchBreak?.enabled && s.lunchBreak.start && s.lunchBreak.end
    ? { start: timeToMinutes(s.lunchBreak.start), end: timeToMinutes(s.lunchBreak.end) }
    : null

  let earliest = 0
  if (key === todayKey()) earliest = nowMinutes() + (Number(s.minNoticeHours) || 0) * 60

  const out: string[] = []
  for (let t = open; t + duration <= close; t += step) {
    if (t < earliest) continue
    const end = t + duration
    if (lunch && t < lunch.end && end > lunch.start) continue

    // Mismo barbero no puede tener dos citas que se crucen
    if (barberId && busy.some((b) => b.barber === barberId && b.start < end && b.end > t)) continue

    // Capacidad total: revisar cada tramo del servicio
    let ok = true
    for (let m = t; m < end; m += 5) {
      const concurrent = busy.filter((b) => b.start <= m && b.end > m).length
      if (concurrent >= capacity) {
        ok = false
        break
      }
    }
    if (ok) out.push(minutesToTime(t))
  }
  return out
}

function rangeLimits(s: BookingSettingsData) {
  const from = todayKey()
  const to = addDays(from, Math.max(1, Number(s.maxDaysAhead) || 30))
  return { from, to }
}

/** Días del calendario con disponibilidad (para pintar el calendario). */
export async function getCalendar(payload: Payload, duration: number, barberId: string | null) {
  const s = await loadSettings(payload)
  if (s.bookingEnabled === false) return { enabled: false, from: '', to: '', days: [] as string[] }
  const { from, to } = rangeLimits(s)
  const [specials, busy] = await Promise.all([loadSpecialDays(payload, from, to), loadBusy(payload, from, to)])

  const days: string[] = []
  for (let key = from; key <= to; key = addDays(key, 1)) {
    const win = windowFor(key, s, specials)
    if (!win) continue
    if (slotsForDay(key, win, s, busy.get(key) || [], duration, barberId).length) days.push(key)
  }
  return { enabled: true, from, to, days }
}

/** Horarios libres de un día. */
export async function getSlots(payload: Payload, key: string, duration: number, barberId: string | null) {
  const s = await loadSettings(payload)
  if (s.bookingEnabled === false) return []
  const { from, to } = rangeLimits(s)
  if (key < from || key > to) return []
  const [specials, busy] = await Promise.all([loadSpecialDays(payload, key, key), loadBusy(payload, key, key)])
  const win = windowFor(key, s, specials)
  if (!win) return []
  return slotsForDay(key, win, s, busy.get(key) || [], duration, barberId)
}
