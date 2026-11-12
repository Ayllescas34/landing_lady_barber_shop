import type { Payload } from 'payload'
import type { Appointment } from '../payload-types'
import { loadSettings, loadSpecialDays, windowFor } from './availability'
import { addDays } from './time'

export type DayInfo = {
  key: string
  state: 'open' | 'closed' | 'blocked' | 'special-open'
  hours: { start: string; end: string } | null
  special: { id: number; startKey: string; endKey: string; note: string | null } | null
  count: number
  pending: number
}

/** Estado de cada día de un mes (abierto, cerrado, bloqueado…) y sus citas. */
export async function getMonthData(payload: Payload, month: string) {
  const [y, m] = month.split('-').map(Number)
  const first = `${month}-01`
  const last = `${month}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0')}`

  const [settings, specials, apptsRes] = await Promise.all([
    loadSettings(payload),
    loadSpecialDays(payload, first, last),
    payload.find({
      collection: 'appointments',
      depth: 1,
      limit: 2000,
      pagination: false,
      where: { and: [{ dateKey: { greater_than_equal: first } }, { dateKey: { less_than_equal: last } }] },
    }),
  ])
  const appts = apptsRes.docs as Appointment[]

  const days: DayInfo[] = []
  for (let key = first; key <= last; key = addDays(key, 1)) {
    const covering = specials.filter((d) => d.startKey && d.startKey <= key && (d.endKey || d.startKey) >= key)
    const blocked = covering.find((d) => d.type === 'closed')
    const opened = covering.find((d) => d.type === 'open')
    const special = blocked || opened
    const active = appts.filter((a) => a.dateKey === key && a.status !== 'cancelled' && a.status !== 'noshow')
    const win = windowFor(key, settings, specials)
    days.push({
      key,
      state: blocked ? 'blocked' : opened ? 'special-open' : win ? 'open' : 'closed',
      hours: win,
      special: special
        ? {
            id: special.id as number,
            startKey: special.startKey || key,
            endKey: special.endKey || special.startKey || key,
            note: special.note || null,
          }
        : null,
      count: active.length,
      pending: active.filter((a) => a.status === 'pending').length,
    })
  }
  return { settings, days, appts }
}
