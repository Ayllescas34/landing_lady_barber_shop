import { cache } from 'react'
import { getPayloadClient } from './payload'
import type { Gallery, Media, Product, Service, SiteInfo, Team, Testimonial } from '../payload-types'

export type ImageRef = { url: string; alt: string; width?: number | null; height?: number | null }

/** Convierte un campo upload de Payload en algo seguro para <img>. */
export function img(m: unknown, size: 'thumbnail' | 'card' | 'hero' | 'original' = 'card'): ImageRef | null {
  if (!m || typeof m !== 'object' || !('url' in m)) return null
  const media = m as Media | Gallery
  const sized = size === 'original' ? null : media.sizes?.[size]
  const url = sized?.url || media.url
  if (!url) return null
  return {
    url,
    alt: media.alt || '',
    width: sized?.width ?? media.width,
    height: sized?.height ?? media.height,
  }
}

export const getSite = cache(async (): Promise<SiteInfo | null> => {
  try {
    const payload = await getPayloadClient()
    return await payload.findGlobal({ slug: 'site-info', depth: 1 })
  } catch {
    return null
  }
})

export const getBookingSettings = cache(async () => {
  try {
    const payload = await getPayloadClient()
    return await payload.findGlobal({ slug: 'booking-settings', depth: 0 })
  } catch {
    return null
  }
})

export const getServices = cache(async (): Promise<Service[]> => {
  try {
    const payload = await getPayloadClient()
    const r = await payload.find({
      collection: 'services',
      depth: 1,
      limit: 100,
      sort: 'order',
      where: { active: { equals: true } },
    })
    return r.docs
  } catch {
    return []
  }
})

export const getGallery = cache(async (onlyFeatured = false): Promise<Gallery[]> => {
  try {
    const payload = await getPayloadClient()
    const r = await payload.find({
      collection: 'gallery',
      limit: onlyFeatured ? 12 : 300,
      sort: 'order',
      where: onlyFeatured ? { featured: { equals: true } } : undefined,
    })
    return r.docs
  } catch {
    return []
  }
})

export const getProducts = cache(async (onlyFeatured = false): Promise<Product[]> => {
  try {
    const payload = await getPayloadClient()
    const r = await payload.find({
      collection: 'products',
      depth: 1,
      limit: onlyFeatured ? 8 : 200,
      sort: 'order',
      where: onlyFeatured
        ? { and: [{ active: { equals: true } }, { featured: { equals: true } }] }
        : { active: { equals: true } },
    })
    return r.docs
  } catch {
    return []
  }
})

export const getTeam = cache(async (): Promise<Team[]> => {
  try {
    const payload = await getPayloadClient()
    const r = await payload.find({
      collection: 'team',
      depth: 1,
      limit: 20,
      sort: 'order',
      where: { active: { equals: true } },
    })
    return r.docs
  } catch {
    return []
  }
})

export const getTestimonials = cache(async (): Promise<Testimonial[]> => {
  try {
    const payload = await getPayloadClient()
    const r = await payload.find({
      collection: 'testimonials',
      limit: 12,
      sort: '-createdAt',
      where: { active: { equals: true } },
    })
    return r.docs
  } catch {
    return []
  }
})

export { waLink, formatPrice } from './format'

export function toGalleryItems(docs: Gallery[]) {
  return docs
    .map((g) => {
      const thumb = img(g, 'card')
      const full = img(g, 'original')
      if (!thumb || !full) return null
      return { id: String(g.id), thumb: thumb.url, full: full.url, alt: g.alt || '', category: g.category }
    })
    .filter(Boolean) as { id: string; thumb: string; full: string; alt: string; category: string }[]
}

export function toProductItems(docs: Product[]) {
  return docs.map((p) => ({
    id: String(p.id),
    name: p.name,
    brand: p.brand,
    category: p.category,
    description: p.description,
    price: p.price,
    comparePrice: p.comparePrice,
    inStock: p.inStock !== false,
    images: (p.images || [])
      .map((m) => img(m, 'card'))
      .filter((x): x is ImageRef => Boolean(x))
      .map((x) => ({ url: x.url, alt: x.alt })),
  }))
}
