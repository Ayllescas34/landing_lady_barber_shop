import type { Metadata, Viewport } from 'next'
import { Inter, Oswald } from 'next/font/google'
import '../../globals.css'

const heading = Oswald({ subsets: ['latin'], variable: '--font-heading' })
const body = Inter({ subsets: ['latin'], variable: '--font-body' })

export const metadata: Metadata = {
  title: 'Mi agenda · Lady Barbershop',
  manifest: '/panel.webmanifest',
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: 'Mi agenda', statusBarStyle: 'black-translucent' },
  icons: {
    icon: '/panel-icons/icon-192.png',
    apple: '/panel-icons/apple-touch-icon.png',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#1E2B45',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${heading.variable} ${body.variable}`}>
      <body className="bg-paper text-ink antialiased">{children}</body>
    </html>
  )
}
