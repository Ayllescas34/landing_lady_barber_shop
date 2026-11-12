import Link from 'next/link'
import { Clock } from 'lucide-react'
import type { Service } from '@/payload-types'
import { SERVICE_CATEGORIES } from '@/lib/categories'
import { formatPrice } from '@/lib/format'

export default function ServicesMenu({
  services,
  bookingEnabled,
}: {
  services: Service[]
  bookingEnabled: boolean
}) {
  const groups = SERVICE_CATEGORIES.map((c) => ({
    ...c,
    items: services.filter((s) => s.category === c.value),
  })).filter((g) => g.items.length)

  return (
    <section id="servicios" className="paper-texture py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="eyebrow">Menú de servicios</p>
          <h2 className="section-title mt-3">Servicios y precios</h2>
          <p className="mx-auto mt-4 max-w-xl text-ink/70">
            Elige tu servicio y reserva tu horario en línea. Precios en quetzales.
          </p>
        </div>

        <div className="mt-14 grid gap-x-14 gap-y-12 md:grid-cols-2">
          {groups.map((g) => (
            <div key={g.value}>
              <h3 className="flex items-center gap-3 font-heading text-xl uppercase tracking-[0.2em] text-barber">
                {g.label}
                <span className="h-px flex-1 bg-barber/30" />
              </h3>
              <ul className="mt-5 space-y-6">
                {g.items.map((s) => (
                  <li key={s.id} className="group">
                    <div className="flex items-end gap-3">
                      <span className="font-heading text-lg font-medium uppercase tracking-wide text-navy">
                        {s.name}
                      </span>
                      <span className="dot-leader" aria-hidden />
                      <span className="font-heading text-lg font-semibold text-navy">
                        {formatPrice(s.price, s.priceFrom)}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/65">
                      {s.description && <span>{s.description}</span>}
                      <span className="inline-flex items-center gap-1 text-ink/50">
                        <Clock size={14} /> {s.duration} min
                      </span>
                      {bookingEnabled && s.bookable !== false && (
                        <Link
                          href={`/reservar?servicio=${s.id}`}
                          className="font-heading text-xs uppercase tracking-widest text-barber underline-offset-4 hover:underline"
                        >
                          Reservar →
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {bookingEnabled && (
          <div className="mt-14 text-center">
            <Link href="/reservar" className="btn-navy">
              Reservar mi cita
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
