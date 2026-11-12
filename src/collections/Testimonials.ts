import type { CollectionConfig } from 'payload'
import { revalidateHooks } from '../lib/revalidate'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  labels: { singular: 'Reseña', plural: 'Reseñas' },
  admin: {
    useAsTitle: 'name',
    group: '🌐 Mi página web',
    description: 'Opiniones reales de clientes (copiadas de Google, Instagram, etc.)',
    defaultColumns: ['name', 'rating', 'source', 'active'],
  },
  access: { read: () => true },
  hooks: revalidateHooks,
  fields: [
    { name: 'name', type: 'text', label: 'Nombre del cliente', required: true },
    { name: 'text', type: 'textarea', label: 'Reseña', required: true },
    {
      type: 'row',
      fields: [
        { name: 'rating', type: 'number', label: 'Estrellas (1–5)', min: 1, max: 5, defaultValue: 5 },
        {
          name: 'source',
          type: 'select',
          label: 'Fuente',
          defaultValue: 'google',
          options: [
            { label: 'Google', value: 'google' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'En persona', value: 'presencial' },
          ],
        },
      ],
    },
    { name: 'active', type: 'checkbox', label: 'Visible', defaultValue: true, admin: { position: 'sidebar' } },
  ],
}
