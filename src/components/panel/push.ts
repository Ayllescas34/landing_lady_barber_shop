'use client'

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
        : 'Este navegador no permite avisos.',
    }
  }
  if (!vapidKey) return { ok: false, error: 'Faltan las claves de avisos en el servidor.' }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return {
      ok: false,
      error: 'No diste permiso. Ve a Ajustes del iPhone → Notificaciones → Mi agenda y actívalas.',
    }
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
