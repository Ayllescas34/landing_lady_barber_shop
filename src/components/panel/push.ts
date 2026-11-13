'use client'

import { useEffect, useState } from 'react'
import { savePushSubscription } from '@/app/(panel)/panel/actions'

export function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function isAndroid() {
  if (typeof navigator === 'undefined') return false
  return /android/i.test(navigator.userAgent)
}

/** Texto para cuando el permiso de avisos está bloqueado, según el teléfono. */
export function deniedHelp() {
  if (isIOS()) return 'Ve a Ajustes del iPhone → Notificaciones → Mi agenda y activa "Permitir notificaciones".'
  if (isAndroid())
    return isStandalone()
      ? 'Mantén presionado el ícono de "Mi agenda" → Información de la app → Notificaciones → Activar.'
      : 'Toca el candado 🔒 junto a la dirección (arriba) → Permisos → Notificaciones → Permitir.'
  return 'Permite las notificaciones de este sitio en la configuración del navegador.'
}

/* ---------- Instalar en Android (Chrome) ---------- */

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
declare global {
  interface Window {
    __lbInstallPrompt?: InstallEvent | null
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    window.__lbInstallPrompt = e as InstallEvent
    window.dispatchEvent(new Event('lb-install-ready'))
  })
  window.addEventListener('appinstalled', () => {
    window.__lbInstallPrompt = null
    window.dispatchEvent(new Event('lb-install-ready'))
  })
}

/** En Android/Chrome permite mostrar un botón "Instalar app" propio. */
export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false)
  useEffect(() => {
    const update = () => setCanInstall(Boolean(window.__lbInstallPrompt))
    update()
    window.addEventListener('lb-install-ready', update)
    return () => window.removeEventListener('lb-install-ready', update)
  }, [])
  async function install() {
    const ev = window.__lbInstallPrompt
    if (!ev) return false
    await ev.prompt()
    const { outcome } = await ev.userChoice
    window.__lbInstallPrompt = null
    setCanInstall(false)
    return outcome === 'accepted'
  }
  return { canInstall, install }
}

export function pushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function registerSW() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register('/panel-sw.js', { scope: '/panel' })
  } catch {
    return null
  }
}

function deviceName() {
  const ua = navigator.userAgent
  const kind = /iphone/i.test(ua)
    ? 'iPhone'
    : /ipad/i.test(ua)
      ? 'iPad'
      : /android/i.test(ua)
        ? 'Android'
        : /mac/i.test(ua)
          ? 'Mac'
          : /windows/i.test(ua)
            ? 'Windows'
            : 'Dispositivo'
  return `${kind} · ${new Date().toLocaleDateString('es-GT')}`
}

function keyToBytes(base64: string) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

/** Pide permiso y registra este teléfono para recibir avisos. Debe llamarse desde un toque. */
export async function enablePush(vapidKey: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!pushSupported()) {
    return {
      ok: false,
      error: isIOS()
        ? 'Primero instala la app: toca Compartir ⬆️ y luego "Agregar a inicio". Ábrela desde el ícono e intenta otra vez.'
        : isAndroid()
          ? 'Abre esta página en Google Chrome para poder recibir avisos.'
          : 'Este navegador no permite avisos.',
    }
  }
  if (!vapidKey) return { ok: false, error: 'Faltan las claves de avisos en el servidor.' }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { ok: false, error: `No diste permiso. ${deniedHelp()}` }
  }
  const reg = (await registerSW()) || (await navigator.serviceWorker.ready)
  await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(vapidKey) })
  }
  const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
  const res = await savePushSubscription(json, deviceName())
  return res.ok ? { ok: true } : res
}

export async function currentSubscription() {
  if (!pushSupported()) return null
  const reg = await navigator.serviceWorker.getRegistration('/panel')
  return (await reg?.pushManager.getSubscription()) || null
}

/**
 * Si este teléfono ya dio permiso, se asegura de que su registro de avisos
 * exista y esté guardado en el servidor. Se llama cada vez que se abre la app,
 * así los avisos se "reparan" solos si el registro cambió o se borró.
 */
export async function syncPush(vapidKey: string) {
  try {
    if (!pushSupported() || !vapidKey || Notification.permission !== 'granted') return
    try {
      if (sessionStorage.getItem('lb-push-synced')) return
    } catch {}
    await registerSW()
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(vapidKey) })
    const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
    const res = await savePushSubscription(json, deviceName())
    if (res.ok) {
      try {
        sessionStorage.setItem('lb-push-synced', '1')
      } catch {}
    }
  } catch {
    // Sin conexión o permiso cambiado: se reintenta la próxima vez que abra la app
  }
}
