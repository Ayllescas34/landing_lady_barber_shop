import Link from 'next/link'
import type { SiteInfo } from '@/payload-types'
import { waLink } from '@/lib/data'
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from './icons'

export default function Footer({ site, logo }: { site: SiteInfo | null; logo: string }) {
  const name = site?.businessName || 'Lady Barbershop'
  const wa = waLink(site?.whatsapp, 'Hola, me gustaría información.')
  const year = new Date().getFullYear()

  return (
    <footer className="bg-navy-deep text-paper/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="" className="h-14 w-14 rounded-full bg-white object-cover" />
            <span className="font-display text-xl text-paper">{name}</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            {site?.address || 'Antigua Guatemala'} · Desde 2023
          </p>
          <div className="mt-5 flex gap-3">
            {site?.instagram && (
              <a
                href={`https://instagram.com/${site.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="rounded-full bg-white/10 p-2.5 transition hover:bg-white/20"
              >
                <InstagramIcon className="h-5 w-5" />
              </a>
            )}
            {site?.facebook && (
              <a href={site.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="rounded-full bg-white/10 p-2.5 transition hover:bg-white/20">
                <FacebookIcon className="h-5 w-5" />
              </a>
            )}
            {site?.tiktok && (
              <a
                href={`https://tiktok.com/@${site.tiktok.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="rounded-full bg-white/10 p-2.5 transition hover:bg-white/20"
              >
                <TikTokIcon className="h-5 w-5" />
              </a>
            )}
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="rounded-full bg-white/10 p-2.5 transition hover:bg-white/20">
                <WhatsAppIcon className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-heading text-sm uppercase tracking-[0.25em] text-paper">Horario</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {(site?.hours || []).map((h) => (
              <li key={h.id || h.days} className="flex justify-between gap-4 border-b border-white/10 pb-2">
                <span>{h.days}</span>
                <span className="text-right text-paper">
                  {h.time}
                  {h.note && <span className="block text-xs text-barber-light">{h.note}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-sm uppercase tracking-[0.25em] text-paper">Enlaces</h3>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <li><Link href="/reservar" className="hover:text-white">Reservar cita</Link></li>
            <li><Link href="/#servicios" className="hover:text-white">Servicios</Link></li>
            <li><Link href="/galeria" className="hover:text-white">Galería</Link></li>
            <li><Link href="/catalogo" className="hover:text-white">Catálogo</Link></li>
            <li><Link href="/#visitanos" className="hover:text-white">Cómo llegar</Link></li>
            <li><Link href="/#contacto" className="hover:text-white">Contacto</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-paper/50">
        © {year} {name} · Antigua Guatemala
      </div>
    </footer>
  )
}
