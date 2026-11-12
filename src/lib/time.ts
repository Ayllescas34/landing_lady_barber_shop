// Utilidades de fecha/hora. Todo se calcula en la zona horaria de Guatemala
// (UTC-6, sin horario de verano) para que el servidor y el panel coincidan.

export const TIMEZONE = 'America/Guatemala'

export const WEEKDAYS = [
  { key: 'sunday', label: 'Domingo', short: 'Dom' },
  { key: 'monday', label: 'Lunes', short: 'Lun' },
  { key: 'tuesday', label: 'Martes', short: 'Mar' },
  { key: 'wednesday', label: 'Miércoles', short: 'Mié' },
  { key: 'thursday', label: 'Jueves', short: 'Jue' },
  { key: 'friday', label: 'Viernes', short: 'Vie' },
  { key: 'saturday', label: 'Sábado', short: 'Sáb' },
] as const

export type WeekdayKey = (typeof WEEKDAYS)[number]['key']

export const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

/** Opciones de hora cada 15 min (06:00 – 22:00) para los selects del panel. */
export const TIME_OPTIONS = (() => {
  const out: { label: string; value: string }[] = []
  for (let m = 6 * 60; m <= 22 * 60; m += 15) {
    const v = minutesToTime(m)
    out.push({ label: formatTime12(v), value: v })
  }
  return out
})()

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** "14:30" -> "2:30 p. m." */
export function formatTime12(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'p. m.' : 'a. m.'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

/** Fecha (YYYY-MM-DD) de un instante en la zona horaria del negocio. */
export function dateKeyFromDate(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function dateKeyFromISO(iso?: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return dateKeyFromDate(d)
}

/** Minutos transcurridos del día actual en la zona del negocio. */
export function nowMinutes(): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const h = Number(parts.find((p) => p.type === 'hour')?.value)
  const m = Number(parts.find((p) => p.type === 'minute')?.value)
  return h * 60 + m
}

export function todayKey(): string {
  return dateKeyFromDate(new Date())
}

export function addDays(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}

export function weekdayIndex(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

/** Valor ISO para guardar un día en un campo `date` de Payload (mediodía en Guatemala). */
export function dateKeyToISO(key: string): string {
  return new Date(`${key}T12:00:00-06:00`).toISOString()
}

/** "2026-11-14" -> "sábado 14 de noviembre" */
export function formatDateLong(key: string): string {
  const [, m, d] = key.split('-').map(Number)
  return `${WEEKDAYS[weekdayIndex(key)].label.toLowerCase()} ${d} de ${MONTHS[m - 1]}`
}
