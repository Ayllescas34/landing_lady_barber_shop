import Link from 'next/link'
import Hero from '@/components/site/Hero'
import ServicesMenu from '@/components/site/ServicesMenu'
import About from '@/components/site/About'
import GalleryGrid from '@/components/site/GalleryGrid'
import ProductGrid from '@/components/site/ProductGrid'
import Testimonials from '@/components/site/Testimonials'
import Visit from '@/components/site/Visit'
import {
  getBookingSettings,
  getGallery,
  getProducts,
  getServices,
  getSite,
  getTeam,
  getTestimonials,
  img,
  toGalleryItems,
  toProductItems,
} from '@/lib/data'

export const revalidate = 300

export default async function HomePage() {
  const [site, booking, services, gallery, products, team, testimonials] = await Promise.all([
    getSite(),
    getBookingSettings(),
    getServices(),
    getGallery(true),
    getProducts(true),
    getTeam(),
    getTestimonials(),
  ])

  const show = site?.sections || {}
  const bookingEnabled = booking?.bookingEnabled !== false
  const logo = img(site?.logo, 'card')?.url || '/logo.webp'
  const galleryItems = toGalleryItems(gallery)
  const productItems = toProductItems(products)

  return (
    <>
      <Hero
        eyebrow={site?.heroEyebrow || 'Barbería en Antigua Guatemala · Desde 2023'}
        title={site?.heroTitle || 'Estilo con mano de mujer'}
        text={site?.heroText || ''}
        image={img(site?.heroImage, 'hero')?.url || null}
        logo={logo}
        bookingEnabled={bookingEnabled}
      />

      {show.services !== false && services.length > 0 && (
        <ServicesMenu services={services} bookingEnabled={bookingEnabled} />
      )}

      <About site={site} team={team} logo={logo} showTeam={show.team !== false} />

      {show.gallery !== false && galleryItems.length > 0 && (
        <section id="galeria" className="paper-texture py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 text-center">
              <p className="eyebrow">Galería</p>
              <h2 className="section-title mt-3">Nuestro trabajo</h2>
            </div>
            <GalleryGrid items={galleryItems} />
            <div className="mt-10 text-center">
              <Link href="/galeria" className="btn-navy">Ver toda la galería</Link>
            </div>
          </div>
        </section>
      )}

      {show.products !== false && productItems.length > 0 && (
        <section id="catalogo" className="bg-paper-dark py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 text-center">
              <p className="eyebrow">Catálogo</p>
              <h2 className="section-title mt-3">Productos para tu estilo</h2>
              <p className="mx-auto mt-4 max-w-xl text-ink/70">
                Lleva a casa los mismos productos que usamos en la barbería.
              </p>
            </div>
            <ProductGrid products={productItems} whatsapp={site?.whatsapp} />
            <div className="mt-10 text-center">
              <Link href="/catalogo" className="btn-navy">Ver catálogo completo</Link>
            </div>
          </div>
        </section>
      )}

      {show.testimonials !== false && <Testimonials items={testimonials} />}

      <Visit site={site} />
    </>
  )
}
