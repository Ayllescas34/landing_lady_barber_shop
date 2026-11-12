import { Clock, MapPin, Navigation, Phone } from 'lucide-react'
import type { SiteInfo } from '@/payload-types'
import { waLink } from '@/lib/format'
import InquiryForm from './InquiryForm'
import { InstagramIcon, WhatsAppIcon } from './icons'

export default function Visit({ site }: { site: SiteInfo | null }) {
  const wa = waLink(site?.whatsapp, 'Hola, me gustaría información sobre Lady Barbershop.')
  const mapsQuery = encodeURIComponent(`Lady Barbershop ${site?.address || 'Antigua Guatemala'}`)
  const embed = site?.mapEmbedUrl || `https://www.google.com/maps?q=${mapsQuery}&output=embed`
  const mapsUrl = site?.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`

  return (
    <>
      <section id="visitanos" className="bg-white py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="eyebrow">Visítanos</p>
            <h2 className="section-title mt-3">Horario y ubicación</h2>

            <div className="mt-8 flex gap-3 text-ink/80">
              <MapPin className="mt-0.5 shrink-0 text-barber" size={20} />
              <span>{site?.address || 'Antigua Guatemala, Sacatepéquez'}</span>
            </div>

            <div className="mt-6 flex gap-3">
              <Clock className="mt-0.5 shrink-0 text-barber" size={20} />
              <ul className="w-full space-y-2">
                {(site?.hours || []).map((h) => (
                  <li key={h.id || h.days} className="flex justify-between gap-4 border-b border-navy/10 pb-2">
                    <span className="font-medium text-navy">{h.days}</span>
                    <span className="text-right text-ink/75">
                      {h.time}
                      {h.note && <span className="ml-2 rounded-full bg-barber/10 px-2 py-0.5 text-xs text-barber">{h.note}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {site?.phone && (
              <a href={`tel:${site.phone.replace(/[^\d+]/g, '')}`} className="mt-6 flex items-center gap-3 text-navy hover:text-barber">
                <Phone size={20} className="text-barber" /> {site.phone}
              </a>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {site?.wazeUrl && (
                <a href={site.wazeUrl} target="_blank" rel="noopener noreferrer" className="btn-navy">
                  <Navigation size={16} /> Waze
                </a>
              )}
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn border-2 border-navy text-navy hover:bg-navy/5">
                <MapPin size={16} /> Google Maps
              </a>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl shadow-lg ring-1 ring-navy/10">
            <iframe
              src={embed}
              title="Mapa de ubicación"
              className="h-[380px] w-full lg:h-full lg:min-h-[440px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      <section id="contacto" className="paper-texture py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow">Contacto</p>
            <h2 className="section-title mt-3">¿Tienes preguntas?</h2>
            <p className="mt-5 leading-relaxed text-ink/75">
              Escríbenos para precios, servicios especiales, grupos o productos. Te responderemos lo antes posible.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn w-fit bg-[#25D366] text-white hover:brightness-95">
                  <WhatsAppIcon className="h-5 w-5" /> Escribir por WhatsApp
                </a>
              )}
              {site?.instagram && (
                <a
                  href={`https://instagram.com/${site.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-navy hover:text-barber"
                >
                  <InstagramIcon className="h-5 w-5" /> @{site.instagram.replace('@', '')}
                </a>
              )}
            </div>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-navy/10 sm:p-8">
            <InquiryForm />
          </div>
        </div>
      </section>
    </>
  )
}
