import Link from 'next/link'
import { CalendarCheck, MapPin } from 'lucide-react'
import { Hummingbird } from './icons'

export default function Hero({
  eyebrow,
  title,
  text,
  image,
  logo,
  bookingEnabled,
}: {
  eyebrow: string
  title: string
  text: string
  image: string | null
  logo: string
  bookingEnabled: boolean
}) {
  return (
    <section className="relative overflow-hidden bg-navy text-paper">
      {image ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy/85 to-navy/40" />
        </>
      ) : (
        <div className="absolute inset-0 opacity-20 stripes-red" aria-hidden />
      )}

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-[1.2fr_1fr] md:py-28">
        <div>
          <p className="flex items-center gap-3 font-heading text-sm uppercase tracking-[0.3em] text-barber-light">
            <Hummingbird className="h-5 w-8 text-hummingbird" />
            {eyebrow}
          </p>
          <h1 className="mt-5 font-display text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">{title}</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper/80">{text}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            {bookingEnabled && (
              <Link href="/reservar" className="btn-primary">
                <CalendarCheck size={18} /> Reservar cita
              </Link>
            )}
            <Link href="/#servicios" className="btn-outline text-paper">
              Ver servicios y precios
            </Link>
          </div>
          <p className="mt-8 flex items-center gap-2 text-sm text-paper/60">
            <MapPin size={16} /> Antigua Guatemala
          </p>
        </div>

        {!image && (
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-4 rounded-full border-2 border-dashed border-paper/20" aria-hidden />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo}
              alt="Logo de Lady Barbershop"
              className="relative aspect-square w-full rounded-full bg-white object-cover shadow-2xl ring-8 ring-white/10"
            />
          </div>
        )}
      </div>
    </section>
  )
}
