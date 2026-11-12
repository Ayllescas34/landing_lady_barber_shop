import type { CollectionConfig } from 'payload'
import { notifyAdmins } from '../lib/push'

export const Inquiries: CollectionConfig = {
  slug: 'inquiries',
  labels: { singular: 'Mensaje', plural: 'Mensajes recibidos' },
  admin: {
    useAsTitle: 'name',
    group: '📅 Agenda',
    description: 'Mensajes enviados desde el formulario de contacto y del catálogo.',
    defaultColumns: ['name', 'subject', 'phone', 'status', 'createdAt'],
  },
  defaultSort: '-createdAt',
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation === 'create' && !req.user) {
          await notifyAdmins(req.payload, {
            title: '💬 Nuevo mensaje',
            body: `${doc.name}: ${String(doc.message || '').slice(0, 90)}`,
            url: '/panel?tab=mensajes',
            tag: `msg-${doc.id}`,
          })
        }
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', label: 'Nombre', required: true },
        { name: 'phone', type: 'text', label: 'Teléfono / WhatsApp' },
        { name: 'email', type: 'email', label: 'Correo' },
      ],
    },
    {
      name: 'subject',
      type: 'select',
      label: 'Asunto',
      defaultValue: 'general',
      options: [
        { label: 'Información general', value: 'general' },
        { label: 'Servicios / precios', value: 'servicios' },
        { label: 'Producto del catálogo', value: 'producto' },
        { label: 'Eventos / grupos', value: 'eventos' },
        { label: 'Otro', value: 'otro' },
      ],
    },
    { name: 'product', type: 'relationship', relationTo: 'products', label: 'Producto' },
    { name: 'message', type: 'textarea', label: 'Mensaje', required: true },
    { name: 'adminNotes', type: 'textarea', label: 'Notas internas' },
    {
      name: 'status',
      type: 'select',
      label: 'Estado',
      defaultValue: 'new',
      options: [
        { label: '🔵 Nueva', value: 'new' },
        { label: '🟡 En proceso', value: 'progress' },
        { label: '✅ Respondida', value: 'done' },
        { label: '⚪ Archivada', value: 'archived' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
