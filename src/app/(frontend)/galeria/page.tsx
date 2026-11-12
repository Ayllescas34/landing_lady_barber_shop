import type { Metadata } from 'next'
import GalleryGrid from '@/components/site/GalleryGrid'
import PageHeader from '@/components/site/PageHeader'
import { getGallery, toGalleryItems } from '@/lib/data'

export const revalidate = 300
export const metadata: Metadata = { title: 'Galería | Lady Barbershop' }

export default async function GaleriaPage() {
  const items = toGalleryItems(await getGallery())
  return (
    <>
      <PageHeader eyebrow="Galería" title="Nuestro trabajo" text="Cortes, fades, barbas y el ambiente de la barbería." />
      <section className="paper-texture py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {items.length ? (
            <GalleryGrid items={items} />
          ) : (
            <p className="py-16 text-center text-ink/60">Pronto compartiremos fotos de nuestro trabajo.</p>
          )}
        </div>
      </section>
    </>
  )
}
