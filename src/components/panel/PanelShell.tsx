'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Bell, CalendarDays, Camera, ClipboardList, Menu, Tag } from 'lucide-react'
import { enablePush, isIOS, isStandalone, pushSupported, registerSW, useInstallPrompt } from './push'

export type Tab = 'citas' | 'dias' | 'fotos' | 'precios' | 'mas' | 'mensajes'

const NAV: { tab: Tab; label: string; icon: typeof Bell }[] = [
  { tab: 'citas', label: 'Citas', icon: ClipboardList },
  { tab: 'dias', label: 'Días', icon: CalendarDays },
  { tab: 'fotos', label: 'Fotos', icon: Camera },
  { tab: 'precios', label: 'Precios', icon: Tag },
  { tab: 'mas', label: 'Más', icon: Menu },
]

export default function PanelShell({
  tab,
  pendingCount,
  newMessages,
  userName,
  vapidKey,
  children,
}: {
  tab: Tab
  pendingCount: number
  newMessages: number
  userName: string
  vapidKey: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const [banner, setBanner] = useState<'install' | 'notify' | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const { canInstall, install } = useInstallPrompt()

  // Registrar service worker, numerito del ícono y avisos pendientes
  useEffect(() => {
    registerSW()
    const nav = navigator as Navigator & { setAppBadge?: (n: number) => Promise<void>; clearAppBadge?: () => Promise<void> }
    try {
      if (pendingCount > 0) nav.setAppBadge?.(pendingCount)
      else nav.clearAppBadge?.()
    } catch {}

    // iPhone: los avisos solo funcionan con la app instalada
    if (isIOS() && !isStandalone()) setBanner('install')
    else if (pushSupported() && Notification.permission === 'default') setBanner('notify')
    else setBanner(null)
  }, [pendingCount])

  // Al volver a la app, actualizar datos
  useEffect(() => {
    const onVis = () => document.visibilityState === 'visible' && router.refresh()
    document.addEventListener('visibilitychange', onVis)
    const t = setInterval(() => document.visibilityState === 'visible' && router.refresh(), 60_000)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      clearInterval(t)
    }
  }, [router])

  async function activate() {
    setMsg(null)
    const r = await enablePush(vapidKey)
    if (r.ok) {
      setBanner(null)
      setMsg('🔔 ¡Listo! Te avisaremos de cada reserva nueva.')
    } else setMsg(r.error)
  }

  return (
    <div className="min-h-screen pb-28">
      <header
        className="sticky top-0 z-30 bg-navy text-paper shadow"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/panel-icons/icon-192.png" alt="" className="h-10 w-10 rounded-full bg-white" />
          <div className="min-w-0 flex-1">
            <p className="font-heading text-lg uppercase leading-tight tracking-wide">Mi agenda</p>
            <p className="truncate text-sm text-paper/70">Hola{userName ? `, ${userName}` : ''} 👋</p>
          </div>
        </div>
      </header>

      {banner === 'install' && (
        <Link href="/panel?tab=mas#instalar" className="mx-4 mt-4 flex items-center gap-3 rounded-2xl bg-amber-100 p-4 text-amber-900">
          <Bell className="shrink-0" />
          <span className="text-[15px] leading-snug">
            <b>Instala la app</b> para recibir avisos de reservas nuevas. Toca aquí para ver cómo.
          </span>
        </Link>
      )}
      {canInstall && !isStandalone() && banner !== 'install' && (
        <button
          type="button"
          onClick={async () => {
            if (await install()) setMsg('📲 ¡Listo! Ya tienes "Mi agenda" en tu pantalla de inicio.')
          }}
          className="mx-4 mt-4 flex w-[calc(100%-2rem)] items-center gap-3 rounded-2xl bg-navy p-4 text-left text-white"
        >
          <span className="text-2xl">📲</span>
          <span className="text-[15px] leading-snug">
            <b>Instalar la app</b> en tu teléfono para abrirla con un toque. Toca aquí.
          </span>
        </button>
      )}
      {banner === 'notify' && (
        <button
          type="button"
          onClick={activate}
          className="mx-4 mt-4 flex w-[calc(100%-2rem)] items-center gap-3 rounded-2xl bg-amber-100 p-4 text-left text-amber-900"
        >
          <Bell className="shrink-0" />
          <span className="text-[15px] leading-snug">
            <b>Activa los avisos</b> para saber al momento cuando alguien reserve. Toca aquí.
          </span>
        </button>
      )}
      {msg && <p className="mx-4 mt-3 rounded-xl bg-white p-3 text-[15px] shadow-sm">{msg}</p>}

      <main className="px-4 pt-4">{children}</main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Secciones"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map(({ tab: t, label, icon: Icon }) => {
            const active = t === tab
            const badge = t === 'citas' ? pendingCount : t === 'mas' ? newMessages : 0
            return (
              <li key={t}>
                <Link
                  href={`/panel?tab=${t}`}
                  className={`relative flex flex-col items-center gap-1 py-2.5 text-[12px] font-semibold ${
                    active ? 'text-barber' : 'text-gray-500'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                  {label}
                  {badge > 0 && (
                    <span className="absolute right-[calc(50%-22px)] top-1 min-w-[20px] rounded-full bg-barber px-1.5 text-center text-[11px] leading-5 text-white">
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
