import type { Appointment } from '../../payload-types'
import type { AdminAppt } from './AppointmentCard'

export function toAdminAppt(a: Appointment): AdminAppt {
  return {
    id: a.id,
    customerName: a.customerName,
    phone: a.phone,
    time: a.time,
    dateKey: a.dateKey || '',
    duration: a.duration,
    status: a.status,
    notes: a.notes,
    code: a.code,
    serviceName: typeof a.service === 'object' && a.service ? a.service.name : null,
    barberName: typeof a.barber === 'object' && a.barber ? a.barber.name : null,
  }
}

export function sortAppts(list: AdminAppt[]) {
  return list.sort((a, b) =>
    a.dateKey === b.dateKey ? a.time.localeCompare(b.time) : a.dateKey.localeCompare(b.dateKey),
  )
}
