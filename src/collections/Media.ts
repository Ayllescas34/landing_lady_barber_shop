import type { CollectionConfig } from 'payload'
import { revalidateHooks } from '../lib/revalidate'

export const imageSizes = [
  { name: 'thumbnail', width: 400, height: 400, position: 'centre' as const },
  { name: 'card', width: 900, height: 900, position: 'centre' as const },
  { name: 'hero', width: 1920, height: 1080, position: 'centre' as const },
]

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Imagen', plural: 'Todas las imágenes' },
  admin: {
    group: '⚙️ Avanzado',
    description: 'Fotos generales del sitio: portada, servicios, productos, equipo…',
  },
  access: { read: () => true },
  hooks: revalidateHooks,
  upload: {
    staticDir: 'public/media',
    imageSizes,
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
  },
  fields: [{ name: 'alt', type: 'text', label: 'Descripción de la foto (SEO)' }],
}
