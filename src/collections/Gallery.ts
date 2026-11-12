import type { CollectionConfig } from 'payload'
import { revalidateHooks } from '../lib/revalidate'
import { GALLERY_CATEGORIES } from '../lib/categories'
import { imageSizes } from './Media'

/**
 * La galería es una colección de subida directa: la administradora arrastra
 * una o varias fotos (subida masiva) y les asigna categoría.
 */
export const Gallery: CollectionConfig = {
  slug: 'gallery',
  labels: { singular: 'Foto de galería', plural: 'Galería de fotos' },
  admin: {
    group: '🌐 Mi página web',
    description:
      'Fotos de trabajos y del local. Puedes subir varias a la vez con "Crear nuevo" → arrastrar archivos.',
    defaultColumns: ['filename', 'category', 'featured', 'order'],
  },
  access: { read: () => true },
  hooks: revalidateHooks,
  defaultSort: 'order',
  upload: {
    staticDir: 'public/media/gallery',
    imageSizes,
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
  },
  fields: [
    { name: 'alt', type: 'text', label: 'Descripción (ej. "Fade con diseño")' },
    {
      name: 'category',
      type: 'select',
      label: 'Categoría',
      required: true,
      defaultValue: 'cortes',
      options: GALLERY_CATEGORIES,
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Mostrar en la página principal',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Orden',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Menor número = aparece primero' },
    },
  ],
}
