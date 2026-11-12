import type { Appointment } from '../../payload-types'

export type PanelAppt = {
  id: number
  name: string
  phone: string
  dateKey: string
  time: string
  duration: number
  status: string
  service: string | null
  notes: string | null
  source: string | null
}

export function toPanelAppt(a: Appointment): PanelAppt {
  return {
    id: a.id,
    name: a.customerName,
    phone: a.phone,
    dateKey: a.dateKey || '',
    time: a.time,
    duration: a.duration || 30,
    status: a.status,
    service: typeof a.service === 'object' && a.service ? a.service.name : null,
    notes: a.notes || null,
    source: a.source || null,
  }
}

export const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Por confirmar', cls: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'Confirmada', cls: 'bg-teal-100 text-teal-800' },
  completed: { label: 'Atendida', cls: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelada', cls: 'bg-gray-200 text-gray-600' },
  noshow: { label: 'No vino', cls: 'bg-red-100 text-red-700' },
}

/** wa.me con número de Guatemala por defecto */
export function waTo(phone: string, text: string) {
  let d = phone.replace(/\D/g, '')
  if (d.length === 8) d = `502${d}`
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`
}
