import type { CollectionConfig } from 'payload'
import { revalidateHooks } from '../lib/revalidate'
import { SERVICE_CATEGORIES } from '../lib/categories'

export const Services: CollectionConfig = {
  slug: 'services',
  labels: { singular: 'Servicio', plural: 'Servicios y precios' },
  admin: {
    useAsTitle: 'name',
    group: '✂️ Mi barbería',
    description: 'Servicios, precios y duración. La duración define cuánto tiempo bloquea en la agenda.',
    defaultColumns: ['name', 'category', 'price', 'duration', 'active'],
  },
  access: { read: () => true },
  hooks: revalidateHooks,
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', label: 'Nombre del servicio', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          type: 'select',
          label: 'Categoría',
          required: true,
          defaultValue: 'cortes',
          options: SERVICE_CATEGORIES,
        },
        {
          name: 'price',
          type: 'number',
          label: 'Precio (Q)',
          min: 0,
        },
        {
          name: 'duration',
          type: 'number',
          label: 'Duración (minutos)',
          required: true,
          defaultValue: 30,
          min: 5,
        },
      ],
    },
    {
      name: 'priceFrom',
      type: 'checkbox',
      label: 'Mostrar como "desde" (precio variable)',
      defaultValue: false,
    },
    { name: 'description', type: 'textarea', label: 'Descripción corta' },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Foto (opcional)' },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Visible en el sitio',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'bookable',
      type: 'checkbox',
      label: 'Se puede reservar en línea',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Destacado',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Orden',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
  ],
}
