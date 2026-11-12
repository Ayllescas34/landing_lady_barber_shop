'use client'

import { useEffect, useMemo, useState } from 'react'
import { ShoppingBag, X } from 'lucide-react'
import { PRODUCT_CATEGORIES } from '@/lib/categories'
import { formatPrice, waLink } from '@/lib/format'
import InquiryForm from './InquiryForm'
import { WhatsAppIcon } from './icons'

export type ProductItem = {
  id: string
  name: string
  brand?: string | null
  category: string
  description?: string | null
  price?: number | null
  comparePrice?: number | null
  inStock: boolean
  images: { url: string; alt: string }[]
}

export default function ProductGrid({
  products,
  whatsapp,
  showFilters = false,
}: {
  products: ProductItem[]
  whatsapp?: string | null
  showFilters?: boolean
}) {
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState<ProductItem | null>(null)
  const [photo, setPhoto] = useState(0)

  const cats = PRODUCT_CATEGORIES.filter((c) => products.some((p) => p.category === c.value))
  const visible = useMemo(
    () => (filter === 'all' ? products : products.filter((p) => p.category === filter)),
    [filter, products],
  )

  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSelected(null)
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [selected])

  return (
    <>
      {showFilters && cats.length > 1 && (
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {[{ label: 'Todo', value: 'all' }, ...cats].map((c) => (
            <button
              key={c.value}
              type="button"
              aria-pressed={filter === c.value}
              onClick={() => setFilter(c.value)}
              className={`rounded-full px-4 py-2 font-heading text-xs uppercase tracking-widest transition ${
                filter === c.value ? 'bg-navy text-paper' : 'bg-white text-navy hover:bg-navy/10'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {visible.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setSelected(p)
              setPhoto(0)
            }}
            className="group flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-navy/10 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="relative aspect-square bg-paper-dark">
              {p.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.images[0].url} alt={p.images[0].alt || p.name} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-navy/25">
                  <ShoppingBag size={48} />
                </div>
              )}
              {!p.inStock && (
                <span className="absolute left-2 top-2 rounded-full bg-ink/80 px-3 py-1 text-xs text-white">Agotado</span>
              )}
              {p.comparePrice && p.price != null && p.comparePrice > p.price && (
                <span className="absolute right-2 top-2 rounded-full bg-barber px-3 py-1 text-xs font-semibold text-white">Oferta</span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-4">
              {p.brand && <span className="text-xs uppercase tracking-widest text-ink/50">{p.brand}</span>}
              <span className="mt-0.5 font-heading text-base uppercase tracking-wide text-navy">{p.name}</span>
              <span className="mt-auto pt-2">
                {p.comparePrice && p.price != null && p.comparePrice > p.price && (
                  <span className="mr-2 text-sm text-ink/40 line-through">{formatPrice(p.comparePrice)}</span>
                )}
                <span className="font-semibold text-barber">{formatPrice(p.price)}</span>
              </span>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-0 sm:items-center sm:p-4"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-label={selected.name}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-paper sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-navy shadow"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
            <div className="grid md:grid-cols-2">
              <div className="bg-paper-dark">
                {selected.images[photo] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.images[photo].url} alt={selected.images[photo].alt || selected.name} className="aspect-square w-full object-cover" />
                ) : (
                  <div className="flex aspect-square items-center justify-center text-navy/25">
                    <ShoppingBag size={64} />
                  </div>
                )}
                {selected.images.length > 1 && (
                  <div className="flex gap-2 p-3">
                    {selected.images.map((im, i) => (
                      <button key={im.url} type="button" onClick={() => setPhoto(i)} aria-label={`Foto ${i + 1}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={im.url} alt="" className={`h-14 w-14 rounded-lg object-cover ${i === photo ? 'ring-2 ring-barber' : 'opacity-70'}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-6">
                {selected.brand && <p className="text-xs uppercase tracking-widest text-ink/50">{selected.brand}</p>}
                <h3 className="font-heading text-2xl uppercase tracking-wide text-navy">{selected.name}</h3>
                <p className="mt-2 text-xl font-semibold text-barber">
                  {formatPrice(selected.price)}
                  {!selected.inStock && <span className="ml-3 text-sm font-normal text-ink/60">(Agotado)</span>}
                </p>
                {selected.description && (
                  <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink/75">{selected.description}</p>
                )}
                {waLink(whatsapp, `Hola, me interesa el producto "${selected.name}". ¿Está disponible?`) && (
                  <a
                    href={waLink(whatsapp, `Hola, me interesa el producto "${selected.name}". ¿Está disponible?`)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn mt-5 w-full bg-[#25D366] text-white hover:brightness-95"
                  >
                    <WhatsAppIcon className="h-5 w-5" /> Pedir por WhatsApp
                  </a>
                )}
                <div className="mt-6 border-t border-navy/10 pt-5">
                  <p className="mb-3 font-heading text-sm uppercase tracking-widest text-navy">Solicitar información</p>
                  <InquiryForm compact productId={selected.id} productName={selected.name} defaultSubject="producto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
