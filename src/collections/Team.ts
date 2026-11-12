import type { CollectionConfig } from 'payload'
import { revalidateHooks } from '../lib/revalidate'

export const Team: CollectionConfig = {
  slug: 'team',
  labels: { singular: 'Barbero(a)', plural: 'Equipo' },
  admin: {
    useAsTitle: 'name',
    group: '✂️ Mi barbería',
    description:
      'Equipo de la barbería. Si hay más de una persona que acepta citas, el cliente podrá elegir con quién.',
    defaultColumns: ['name', 'role', 'acceptsBookings', 'active'],
  },
  access: { read: () => true },
  hooks: revalidateHooks,
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', label: 'Nombre', required: true },
    { name: 'role', type: 'text', label: 'Cargo', defaultValue: 'Barbera' },
    { name: 'photo', type: 'upload', relationTo: 'media', label: 'Foto' },
    { name: 'bio', type: 'textarea', label: 'Descripción breve' },
    { name: 'instagram', type: 'text', label: 'Instagram (usuario, sin @)' },
    { name: 'active', type: 'checkbox', label: 'Visible', defaultValue: true, admin: { position: 'sidebar' } },
    {
      name: 'acceptsBookings',
      type: 'checkbox',
      label: 'Acepta citas en línea',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    { name: 'order', type: 'number', label: 'Orden', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
