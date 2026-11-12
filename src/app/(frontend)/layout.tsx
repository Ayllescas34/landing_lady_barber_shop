import type { Metadata } from 'next'
import { Inter, Oswald, Rye } from 'next/font/google'
import Header from '@/components/site/Header'
import Footer from '@/components/site/Footer'
import FloatingWhatsApp from '@/components/site/FloatingWhatsApp'
import { getBookingSettings, getSite, img } from '@/lib/data'
import '../globals.css'

const display = Rye({ weight: '400', subsets: ['latin'], variable: '--font-display' })
const heading = Oswald({ subsets: ['latin'], variable: '--font-heading' })
const body = Inter({ subsets: ['latin'], variable: '--font-body' })

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite()
  const title = site?.seoTitle || 'Lady Barbershop | Barbería en Antigua Guatemala'
  const description =
    site?.seoDescription ||
    'Barbería en Antigua Guatemala. Cortes, fades, barba y productos profesionales. Reserva tu cita en línea.'
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    title,
    description,
    openGraph: { title, description, type: 'website', images: ['/logo.webp'], locale: 'es_GT' },
    icons: { icon: '/logo.webp' },
  }
}

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const [site, booking] = await Promise.all([getSite(), getBookingSettings()])
  const logo = img(site?.logo, 'thumbnail')?.url || '/logo.webp'
  const bookingEnabled = booking?.bookingEnabled !== false

  return (
    <html lang="es" className={`${display.variable} ${heading.variable} ${body.variable}`}>
      <body>
        {site?.announcement?.active && site.announcement.text && (
          <div className="bg-barber px-4 py-2 text-center font-heading text-sm uppercase tracking-widest text-white">
            {site.announcement.text}
          </div>
        )}
        <Header logo={logo} name={site?.businessName || 'Lady Barbershop'} bookingEnabled={bookingEnabled} />
        <main>{children}</main>
        <Footer site={site} logo={logo} />
        <FloatingWhatsApp number={site?.whatsapp} />
      </body>
    </html>
  )
}
