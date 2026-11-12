import type { CollectionConfig } from 'payload'
import { TIME_OPTIONS, dateKeyFromISO, formatDateLong, formatTime12 } from '../lib/time'
import { notifyAdmins } from '../lib/push'

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

        const name = data.customerName ?? originalDoc?.customerName ?? ''
        const time = data.time ?? originalDoc?.time
        data.label = `${name} — ${data.dateKey ?? originalDoc?.dateKey ?? ''} ${time ? formatTime12(time) : ''}`.trim()
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        // Aviso al teléfono de la administradora cuando un cliente reserva desde la web
        if (operation !== 'create' || doc.source !== 'web') return doc
        let serviceName = ''
        try {
          const id = typeof doc.service === 'object' ? doc.service?.id : doc.service
          if (id) serviceName = (await req.payload.findByID({ collection: 'services', id, depth: 0 })).name
        } catch {}
        await notifyAdmins(req.payload, {
          title: '💈 ¡Nueva reserva!',
          body: `${doc.customerName} · ${formatDateLong(doc.dateKey)} a las ${formatTime12(doc.time)}${serviceName ? ` · ${serviceName}` : ''}. Toca para revisar.`,
          url: '/panel',
          tag: `cita-${doc.id}`,
        })
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
        { name: 'email', type: 'email', label: 'Correo' },
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
    { name: 'label', type: 'text', admin: { hidden: true } },
  ],
}
