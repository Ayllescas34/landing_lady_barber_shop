import type { CollectionConfig } from 'payload'
import { TIME_OPTIONS, dateKeyFromISO, formatDateLong, formatTime12 } from '../lib/time'
import { notifyAdmins } from '../lib/push'
import { sendAppointmentEmail } from '../lib/emails'
import crypto from 'crypto'

export const APPOINTMENT_STATUS = [
  { label: '🟡 Pendiente', value: 'pending' },
  { label: '🟢 Confirmada', value: 'confirmed' },
  { label: '✅ Atendida', value: 'completed' },
  { label: '⚪ Cancelada', value: 'cancelled' },
  { label: '🔴 No se presentó', value: 'noshow' },
]

/** Estados que NO ocupan espacio en la agenda. */
export const FREE_STATUSES = ['cancelled', 'noshow']

function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export const Appointments: CollectionConfig = {
  slug: 'appointments',
  labels: { singular: 'Cita', plural: 'Citas' },
  admin: {
    useAsTitle: 'label',
    group: '📅 Agenda',
    description:
      'Citas reservadas desde el sitio o agregadas manualmente. Cambia el estado para confirmar o cancelar.',
    defaultColumns: ['customerName', 'dateKey', 'time', 'service', 'status', 'phone'],
    listSearchableFields: ['customerName', 'phone', 'code'],
    components: { beforeList: ['/components/admin/CalendarBanner'] },
  },
  // Sin acceso público: las citas del sitio se crean desde el servidor (acciones).
  defaultSort: '-dateKey',
  hooks: {
    beforeChange: [
      async ({ data, req, originalDoc }) => {
        const iso = data.date ?? originalDoc?.date
        const key = dateKeyFromISO(iso)
        if (key) data.dateKey = key

        const serviceId =
          typeof data.service === 'object' && data.service ? data.service.id : data.service
        if (!data.duration && serviceId) {
          try {
            const svc = await req.payload.findByID({ collection: 'services', id: serviceId, req })
            data.duration = svc?.duration || 30
          } catch {
            data.duration = 30
          }
        }
        if (!data.code && !originalDoc?.code) data.code = makeCode()
        // Clave secreta para el enlace "Ver o cancelar mi cita" del correo
        if (!data.manageToken && !originalDoc?.manageToken) data.manageToken = crypto.randomBytes(16).toString('hex')
        // Quién canceló (para el correo correcto)
        if (data.status === 'cancelled' && originalDoc?.status !== 'cancelled' && !data.cancelledBy) {
          data.cancelledBy = 'business'
        }
        if (data.status && data.status !== 'cancelled') data.cancelledBy = null
        // Si cambia el día o la hora, el recordatorio se vuelve a enviar
        if (originalDoc && (data.dateKey !== originalDoc.dateKey || (data.time && data.time !== originalDoc.time))) {
          data.reminderSent = false
        }

        const name = data.customerName ?? originalDoc?.customerName ?? ''
        const time = data.time ?? originalDoc?.time
        data.label = `${name} — ${data.dateKey ?? originalDoc?.dateKey ?? ''} ${time ? formatTime12(time) : ''}`.trim()
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req, context }) => {
        const payload = req.payload
        const when = `${formatDateLong(doc.dateKey)} a las ${formatTime12(doc.time)}`

        if (operation === 'create') {
          if (doc.source === 'web') {
            // Aviso al teléfono de la administradora
            let serviceName = ''
            try {
              const id = typeof doc.service === 'object' ? doc.service?.id : doc.service
              if (id) serviceName = (await payload.findByID({ collection: 'services', id, depth: 0 })).name
            } catch {}
            await notifyAdmins(payload, {
              title: '💈 ¡Nueva reserva!',
              body: `${doc.customerName} · ${when}${serviceName ? ` · ${serviceName}` : ''}. Toca para revisar.`,
              url: '/panel',
              tag: `cita-${doc.id}`,
            })
          }
          // Correo al cliente (si dejó correo)
          if (doc.status === 'pending') await sendAppointmentEmail(payload, 'received', doc)
          else if (doc.status === 'confirmed') await sendAppointmentEmail(payload, 'confirmed', doc)
          return doc
        }

        if (operation !== 'update' || !previousDoc || context?.skipEmail) return doc
        const active = (st: string) => st === 'pending' || st === 'confirmed'

        if (doc.status !== previousDoc.status) {
          if (doc.status === 'confirmed' && previousDoc.status === 'pending') {
            await sendAppointmentEmail(payload, 'confirmed', doc)
          } else if (doc.status === 'confirmed' && !active(previousDoc.status)) {
            // Reactivada después de cancelarla
            await sendAppointmentEmail(payload, 'confirmed', doc)
          } else if (doc.status === 'cancelled' && active(previousDoc.status)) {
            if (doc.cancelledBy === 'client') {
              await sendAppointmentEmail(payload, 'cancelledByClient', doc)
              await notifyAdmins(payload, {
                title: '❌ Cita cancelada por el cliente',
                body: `${doc.customerName} canceló su cita del ${when}. El horario quedó libre.`,
                url: '/panel',
                tag: `cancel-${doc.id}`,
              })
            } else {
              await sendAppointmentEmail(payload, 'cancelled', doc)
            }
          }
          return doc
        }

        // Mismo estado pero cambió el día o la hora
        if (active(doc.status) && (doc.dateKey !== previousDoc.dateKey || doc.time !== previousDoc.time)) {
          await sendAppointmentEmail(payload, 'rescheduled', doc)
        }
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'customerName', type: 'text', label: 'Cliente', required: true },
        { name: 'phone', type: 'text', label: 'Teléfono / WhatsApp', required: true },
        {
          name: 'email',
          type: 'email',
          label: 'Correo',
          admin: { description: 'Si tiene correo, se le avisa al confirmar, cancelar o cambiar la cita.' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'date',
          type: 'date',
          label: 'Fecha',
          required: true,
          admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } },
        },
        { name: 'time', type: 'select', label: 'Hora', required: true, options: TIME_OPTIONS },
        {
          name: 'duration',
          type: 'number',
          label: 'Duración (min)',
          admin: { description: 'Si lo dejas vacío se usa la del servicio' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'service', type: 'relationship', relationTo: 'services', label: 'Servicio' },
        {
          name: 'barber',
          type: 'relationship',
          relationTo: 'team',
          label: 'Barbero(a)',
          admin: { description: 'Vacío = cualquiera' },
        },
      ],
    },
    { name: 'notes', type: 'textarea', label: 'Comentarios del cliente' },
    { name: 'adminNotes', type: 'textarea', label: 'Notas internas (solo panel)' },
    {
      name: 'status',
      type: 'select',
      label: 'Estado',
      required: true,
      defaultValue: 'pending',
      options: APPOINTMENT_STATUS,
      admin: { position: 'sidebar' },
    },
    {
      name: 'source',
      type: 'select',
      label: 'Origen',
      defaultValue: 'admin',
      options: [
        { label: 'Sitio web', value: 'web' },
        { label: 'Panel / manual', value: 'admin' },
        { label: 'WhatsApp', value: 'whatsapp' },
        { label: 'En persona', value: 'walkin' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'code',
      type: 'text',
      label: 'Código de reserva',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'dateKey',
      type: 'text',
      label: 'Día',
      index: true,
      admin: { position: 'sidebar', readOnly: true, description: 'Se calcula automáticamente' },
    },
    {
      name: 'cancelledBy',
      type: 'select',
      label: 'Cancelada por',
      options: [
        { label: 'La barbería', value: 'business' },
        { label: 'El cliente', value: 'client' },
      ],
      admin: { position: 'sidebar', readOnly: true, condition: (d) => d?.status === 'cancelled' },
    },
    { name: 'label', type: 'text', admin: { hidden: true } },
    { name: 'manageToken', type: 'text', admin: { hidden: true } },
    { name: 'reminderSent', type: 'checkbox', defaultValue: false, admin: { hidden: true } },
  ],
}
