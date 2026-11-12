import { waLink } from '@/lib/data'
import { WhatsAppIcon } from './icons'

export default function FloatingWhatsApp({ number }: { number?: string | null }) {
  const href = waLink(number, 'Hola, me gustaría información sobre Lady Barbershop.')
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition hover:scale-105"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  )
}
