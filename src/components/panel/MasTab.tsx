'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { Bell, BellOff, ExternalLink, LogOut, MessageCircle, Share, SquarePlus } from 'lucide-react'
import {
  removePushSubscription,
  sendTestPush,
  setBookingEnabled,
  setInquiryStatus,
} from '@/app/(panel)/panel/actions'
import { currentSubscription, deniedHelp, enablePush, isAndroid, isIOS, isStandalone, pushSupported, useInstallPrompt } from './push'
import { waTo } from './types'

type Msg = {
  id: number
  name: string
  phone: string
  email: string
  message: string
  status: string
  product: string | null
  createdAt: string
}

const card = 'rounded-2xl bg-white p-4 shadow-sm'
const big = 'flex w-full items-center justify-center gap-2 rounded-2xl p-4 text-[17px] font-bold'

export default function MasTab({
  showMessages,
  messages,
  bookingEnabled,
  devices,
  vapidKey,
  businessName,
}: {
  showMessages: boolean
  messages: Msg[]
  bookingEnabled: boolean
  devices: number
  vapidKey: string
  businessName: string
}) {
  const router = useRouter()

  useEffect(() => {
    if (showMessages) document.getElementById('mensajes')?.scrollIntoView({ behavior: 'smooth' })
  }, [showMessages])

  async function logout() {
    await fetch('/api/users/logout', { method: 'POST', credentials: 'include' }).catch(() => null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <Notifications vapidKey={vapidKey} devices={devices} />
      <Booking enabled={bookingEnabled} />
      <Messages messages={messages} businessName={businessName} />
      <Install />

      <section className={`${card} space-y-2`}>
        <a href="/" target="_blank" rel="noopener noreferrer" className={`${big} bg-gray-100 text-navy`}>
          <ExternalLink size={20} /> Ver mi página web
        </a>
        <button type="button" onClick={logout} className={`${big} bg-gray-100 text-gray-600`}>
          <LogOut size={20} /> Cerrar sesión
        </button>
      </section>
    </div>
  )
}

/* ---------- Avisos ---------- */

function Notifications({ vapidKey, devices }: { vapidKey: string; devices: number }) {
  const router = useRouter()
  const [state, setState] = useState<'loading' | 'on' | 'off' | 'install' | 'unsupported' | 'denied'>('loading')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    ;(async () => {
      if (!pushSupported()) return setState(isIOS() && !isStandalone() ? 'install' : 'unsupported')
      if (Notification.permission === 'denied') return setState('denied')
      const sub = await currentSubscription()
      setState(sub && Notification.permission === 'granted' ? 'on' : 'off')
    })()
  }, [])

  async function on() {
    setBusy(true)
    setMsg(null)
    const r = await enablePush(vapidKey)
    setBusy(false)
    if (r.ok) {
      setState('on')
      setMsg('🔔 ¡Avisos activados en este teléfono!')
      router.refresh()
    } else setMsg(r.error)
  }

  async function test() {
    setBusy(true)
    setMsg(null)
    const r = await sendTestPush()
    setBusy(false)
    setMsg(r.ok ? 'Enviado. Debe llegarte en unos segundos.' : r.error)
  }

  async function off() {
    setBusy(true)
    const sub = await currentSubscription()
    if (sub) {
      await removePushSubscription(sub.endpoint)
      await sub.unsubscribe().catch(() => null)
    }
    setBusy(false)
    setState('off')
    router.refresh()
  }

  return (
    <section className={card}>
      <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-navy">
        <Bell size={20} /> Avisos de reservas
      </h2>
      <p className="mb-4 text-[15px] text-gray-600">
        Te llega una notificación cada vez que alguien reserva o te escribe desde la página.
      </p>

      {state === 'on' && (
        <div className="space-y-2">
          <p className="rounded-xl bg-green-50 p-3 text-[16px] font-semibold text-green-800">✅ Activados en este teléfono</p>
          <button type="button" disabled={busy} onClick={test} className={`${big} bg-navy text-white`}>
            Enviarme un aviso de prueba
          </button>
          <button type="button" disabled={busy} onClick={off} className={`${big} bg-gray-100 text-gray-600`}>
            <BellOff size={18} /> Desactivar
          </button>
        </div>
      )}
      {state === 'off' && (
        <button type="button" disabled={busy} onClick={on} className={`${big} bg-barber text-white`}>
          <Bell size={20} /> Activar avisos
        </button>
      )}
      {state === 'install' && (
        <a href="#instalar" className={`${big} bg-amber-100 text-amber-900`}>
          Primero instala la app (ver pasos abajo)
        </a>
      )}
      {state === 'denied' && (
        <p className="rounded-xl bg-amber-50 p-3 text-[15px] text-amber-900">Los avisos están bloqueados. {deniedHelp()}</p>
      )}
      {state === 'unsupported' && (
        <p className="rounded-xl bg-amber-50 p-3 text-[15px] text-amber-900">
          Este navegador no permite avisos. En iPhone, abre la app desde el ícono de la pantalla de inicio (iOS 16.4 o más nuevo).
          En Android, ábrela en Google Chrome.
        </p>
      )}
      {msg && <p className="mt-3 rounded-xl bg-paper p-3 text-[15px]">{msg}</p>}
      <p className="mt-3 text-[13px] text-gray-400">Teléfonos con avisos: {devices}</p>
    </section>
  )
}

/* ---------- Pausar reservas ---------- */

function Booking({ enabled }: { enabled: boolean }) {
  const router = useRouter()
  const [busy, start] = useTransition()
  const toggle = () => {
    if (enabled && !window.confirm('¿Pausar las reservas en línea? Los clientes solo podrán escribirte por WhatsApp.')) return
    start(async () => {
      await setBookingEnabled(!enabled)
      router.refresh()
    })
  }
  return (
    <section className={card}>
      <h2 className="mb-1 text-lg font-bold text-navy">Reservas en la página</h2>
      <p className="mb-4 text-[15px] text-gray-600">
        {enabled ? '🟢 Los clientes pueden reservar en línea.' : '🔴 Pausadas: nadie puede reservar en línea.'}
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={toggle}
        className={`${big} ${enabled ? 'bg-gray-100 text-gray-700' : 'bg-green-600 text-white'}`}
      >
        {enabled ? '⏸️ Pausar reservas' : '▶️ Activar reservas'}
      </button>
    </section>
  )
}

/* ---------- Mensajes ---------- */

function Messages({ messages, businessName }: { messages: Msg[]; businessName: string }) {
  const router = useRouter()
  const [busy, start] = useTransition()
  const [showOld, setShowOld] = useState(false)
  const list = messages.filter((m) => showOld || m.status === 'new' || m.status === 'progress')
  const old = messages.length - messages.filter((m) => m.status === 'new' || m.status === 'progress').length

  const set = (id: number, status: 'done' | 'archived' | 'progress') =>
    start(async () => {
      await setInquiryStatus(id, status)
      router.refresh()
    })

  return (
    <section id="mensajes" className={`${card} scroll-mt-24`}>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-navy">
        <MessageCircle size={20} /> Mensajes de la página
      </h2>
      {list.length === 0 && <p className="text-[15px] text-gray-500">No tienes mensajes pendientes.</p>}
      <div className="space-y-3">
        {list.map((m) => (
          <article key={m.id} className={`rounded-xl border p-3 ${m.status === 'new' ? 'border-barber/40 bg-red-50/40' : 'border-gray-200'}`}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-[17px] font-semibold">
                {m.status === 'new' && <span className="mr-1">🔵</span>}
                {m.name}
              </p>
              <span className="shrink-0 text-[13px] text-gray-500">
                {new Date(m.createdAt).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            {m.product && <p className="text-[14px] text-gray-500">Producto: {m.product}</p>}
            <p className="mt-1 whitespace-pre-line text-[16px]">{m.message}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {m.phone ? (
                <a
                  href={waTo(m.phone, `Hola ${m.name}, te escribimos de ${businessName} por tu mensaje: `)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => m.status === 'new' && set(m.id, 'progress')}
                  className="rounded-xl bg-[#25D366] py-3 text-center text-[15px] font-bold text-white"
                >
                  Responder
                </a>
              ) : m.email ? (
                <a href={`mailto:${m.email}`} className="rounded-xl bg-navy py-3 text-center text-[15px] font-bold text-white">
                  Responder correo
                </a>
              ) : (
                <span />
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => set(m.id, 'done')}
                className="rounded-xl bg-gray-100 py-3 text-[15px] font-bold text-navy"
              >
                ✓ Ya respondí
              </button>
            </div>
          </article>
        ))}
      </div>
      {old > 0 && (
        <button type="button" onClick={() => setShowOld((v) => !v)} className="mt-3 w-full text-center text-[15px] font-semibold text-gray-500 underline">
          {showOld ? 'Ocultar respondidos' : `Ver respondidos (${old})`}
        </button>
      )}
    </section>
  )
}

/* ---------- Instalar en el teléfono (iPhone y Android) ---------- */

const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <li className="flex gap-3">
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy font-bold text-white">{n}</span>
    <span>{children}</span>
  </li>
)

function Install() {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other' | 'installed'>('other')
  const { canInstall, install } = useInstallPrompt()
  useEffect(() => {
    setPlatform(isStandalone() ? 'installed' : isIOS() ? 'ios' : isAndroid() ? 'android' : 'other')
  }, [])
  if (platform === 'installed') return null

  const ios = (
    <ol className="space-y-4 text-[16px]">
      <Step n={1}>Abre esta página en <b>Safari</b>.</Step>
      <Step n={2}>
        Toca <b>Compartir</b> <Share size={18} className="-mt-1 inline text-blue-600" /> (abajo en el centro).
      </Step>
      <Step n={3}>
        Baja y toca <b>“Agregar a inicio”</b> <SquarePlus size={18} className="-mt-1 inline" />, luego <b>Agregar</b>.
      </Step>
      <Step n={4}>
        Abre <b>“Mi agenda”</b> desde el ícono nuevo, entra con tu correo y toca <b>Activar avisos</b>.
      </Step>
    </ol>
  )

  const android = (
    <>
      {canInstall && (
        <button type="button" onClick={install} className={`${big} mb-4 bg-navy text-white`}>
          📲 Instalar “Mi agenda”
        </button>
      )}
      <ol className="space-y-4 text-[16px]">
        <Step n={1}>Abre esta página en <b>Google Chrome</b>.</Step>
        <Step n={2}>
          Toca el menú <b>⋮</b> (arriba a la derecha) y elige <b>“Instalar app”</b> o <b>“Agregar a pantalla principal”</b>.
        </Step>
        <Step n={3}>
          Abre <b>“Mi agenda”</b> desde el ícono nuevo y toca <b>Activar avisos</b> → <b>Permitir</b>.
        </Step>
      </ol>
    </>
  )

  return (
    <section id="instalar" className={`${card} scroll-mt-24`}>
      <h2 className="mb-3 text-lg font-bold text-navy">📲 Instalar en tu teléfono</h2>
      {platform === 'ios' && ios}
      {platform === 'android' && android}
      {platform === 'other' && (
        <div className="space-y-5">
          <div>
            <p className="mb-2 font-semibold">iPhone</p>
            {ios}
          </div>
          <div>
            <p className="mb-2 font-semibold">Android</p>
            {android}
          </div>
        </div>
      )}
    </section>
  )
}
