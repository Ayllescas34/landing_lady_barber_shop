'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'

const LINKS = [
  { href: '/#servicios', label: 'Servicios' },
  { href: '/galeria', label: 'Galería' },
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/#nosotros', label: 'Nosotros' },
  { href: '/#visitanos', label: 'Visítanos' },
  { href: '/#contacto', label: 'Contacto' },
]

export default function Header({
  logo,
  name,
  bookingEnabled,
}: {
  logo: string
  name: string
  bookingEnabled: boolean
}) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  return (
    <header
      className={`sticky top-0 z-40 transition-all ${
        scrolled ? 'bg-navy/95 shadow-lg backdrop-blur' : 'bg-navy'
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3" aria-label={`${name} — inicio`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="" className="h-12 w-12 rounded-full bg-white object-cover ring-2 ring-white/30" />
          <span className="hidden font-display text-lg leading-none text-paper sm:block">{name}</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Principal">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-heading text-sm uppercase tracking-widest text-paper/80 transition hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {bookingEnabled && (
            <Link href="/reservar" className="btn-primary !px-4 !py-2.5 sm:!px-6">
              Reservar
            </Link>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-full p-2 text-paper lg:hidden"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
          >
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-white/10 bg-navy px-4 pb-6 pt-2 lg:hidden" aria-label="Móvil">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block border-b border-white/10 py-3 font-heading uppercase tracking-widest text-paper/90"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
      <div className="h-1.5 bg-barber-pole bg-[length:79px_79px] animate-pole" aria-hidden />
    </header>
  )
}
