import { Star } from 'lucide-react'
import type { Testimonial } from '@/payload-types'

const SOURCE: Record<string, string> = {
  google: 'Google',
  instagram: 'Instagram',
  facebook: 'Facebook',
  presencial: 'Cliente',
}

export default function Testimonials({ items }: { items: Testimonial[] }) {
  if (!items.length) return null
  return (
    <section className="relative overflow-hidden bg-navy py-20 text-paper sm:py-24">
      <div className="absolute inset-0 opacity-10 stripes-red" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="eyebrow !text-barber-light">Reseñas</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl">Lo que dicen nuestros clientes</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.slice(0, 6).map((t) => (
            <figure key={t.id} className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
              <div className="flex gap-0.5 text-[#E8B74A]" aria-label={`${t.rating || 5} de 5 estrellas`}>
                {Array.from({ length: t.rating || 5 }).map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <blockquote className="mt-4 leading-relaxed text-paper/85">“{t.text}”</blockquote>
              <figcaption className="mt-5 font-heading text-sm uppercase tracking-widest">
                {t.name}
                {t.source && <span className="ml-2 text-paper/50">· {SOURCE[t.source] || t.source}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
