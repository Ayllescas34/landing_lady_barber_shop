import type { CollectionConfig } from 'payload'
import { revalidateHooks } from '../lib/revalidate'
import { PRODUCT_CATEGORIES } from '../lib/categories'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Producto', plural: 'Catálogo de productos' },
  admin: {
    useAsTitle: 'name',
    group: '✂️ Mi barbería',
    description: 'Productos a la venta. Los clientes pueden pedir información desde el sitio.',
    defaultColumns: ['name', 'category', 'price', 'inStock', 'active'],
  },
  access: { read: () => true },
  hooks: revalidateHooks,
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', label: 'Nombre', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          type: 'select',
          label: 'Categoría',
          required: true,
          defaultValue: 'styling',
          options: PRODUCT_CATEGORIES,
        },
        { name: 'brand', type: 'text', label: 'Marca' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'price', type: 'number', label: 'Precio (Q)', min: 0 },
        {
          name: 'comparePrice',
          type: 'number',
          label: 'Precio antes (Q)',
          min: 0,
          admin: { description: 'Si lo llenas, se muestra tachado como oferta' },
        },
      ],
    },
    { name: 'description', type: 'textarea', label: 'Descripción' },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: 'Fotos',
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Visible en el sitio',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'inStock',
      type: 'checkbox',
      label: 'Disponible',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Mostrar en la página principal',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    { name: 'order', type: 'number', label: 'Orden', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
