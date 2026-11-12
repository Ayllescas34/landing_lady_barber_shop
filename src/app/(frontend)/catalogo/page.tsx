import type { Metadata } from 'next'
import PageHeader from '@/components/site/PageHeader'
import ProductGrid from '@/components/site/ProductGrid'
import { getProducts, getSite, toProductItems } from '@/lib/data'

export const revalidate = 300
export const metadata: Metadata = { title: 'Catálogo | Lady Barbershop' }

export default async function CatalogoPage() {
  const [products, site] = await Promise.all([getProducts(), getSite()])
  const items = toProductItems(products)
  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Productos"
        text="Ceras, pomadas, aceites y más. Pide información o resérvalo por WhatsApp y recógelo en tu próxima visita."
      />
      <section className="paper-texture py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {items.length ? (
            <ProductGrid products={items} whatsapp={site?.whatsapp} showFilters />
          ) : (
            <p className="py-16 text-center text-ink/60">Muy pronto publicaremos nuestro catálogo.</p>
          )}
        </div>
      </section>
    </>
  )
}
