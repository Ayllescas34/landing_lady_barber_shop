import type { Metadata } from 'next'
import Link from 'next/link'
import BookingWizard from '@/components/site/BookingWizard'
import PageHeader from '@/components/site/PageHeader'
import { getBookingSettings, getServices, getSite, getTeam } from '@/lib/data'
import { waLink } from '@/lib/format'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Reservar cita | Lady Barbershop',
  description: 'Reserva tu cita en Lady Barbershop, Antigua Guatemala.',
}

export default async function ReservarPage({
  searchParams,
}: {
  searchParams: Promise<{ servicio?: string }>
}) {
  const [{ servicio }, services, team, booking, site] = await Promise.all([
    searchParams,
    getServices(),
    getTeam(),
    getBookingSettings(),
    getSite(),
  ])

  const enabled = booking?.bookingEnabled !== false
  const wa = waLink(site?.whatsapp, 'Hola, me gustaría agendar una cita.')

  return (
    <>
      <PageHeader eyebrow="Reservas en línea" title="Reserva tu cita" text="Elige servicio, día y hora. ¡Toma menos de un minuto!" />
      <section className="paper-texture py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {enabled ? (
            <BookingWizard
              initialServiceId={servicio}
              services={services
                .filter((s) => s.bookable !== false)
                .map((s) => ({
                  id: String(s.id),
                  name: s.name,
                  category: s.category,
                  price: s.price,
                  priceFrom: s.priceFrom,
                  duration: s.duration || 30,
                  description: s.description,
                }))}
              barbers={team
                .filter((t) => t.acceptsBookings !== false)
                .map((t) => ({ id: String(t.id), name: t.name, role: t.role }))}
              notice={booking?.bookingNotice || ''}
              whatsapp={site?.whatsapp || null}
              businessName={site?.businessName || 'Lady Barbershop'}
            />
          ) : (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-navy/10">
              <p className="font-heading text-xl uppercase tracking-wide text-navy">
                Las reservas en línea están pausadas por el momento
              </p>
              <p className="mt-3 text-ink/70">Escríbenos y con gusto te ayudamos a agendar.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {wa && (
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-primary">
                    Agendar por WhatsApp
                  </a>
                )}
                <Link href="/#contacto" className="btn-navy">Enviar mensaje</Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
