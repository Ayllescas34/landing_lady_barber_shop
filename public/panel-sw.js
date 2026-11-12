/* Service worker de la app "Mi agenda" (solo /panel). Recibe los avisos push. */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = { body: event.data ? event.data.text() : '' }
  }

  const title = data.title || 'Lady Barbershop'
  const options = {
    body: data.body || 'Tienes una novedad, revisa tu agenda.',
    icon: '/panel-icons/icon-192.png',
    badge: '/panel-icons/badge-96.png',
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
    data: { url: data.url || '/panel' },
  }

  event.waitUntil(
    (async () => {
      // iPhone exige mostrar siempre una notificación al recibir un push
      await self.registration.showNotification(title, options)
      if (typeof data.badge === 'number' && self.navigator && 'setAppBadge' in self.navigator) {
        try {
          if (data.badge > 0) await self.navigator.setAppBadge(data.badge)
          else await self.navigator.clearAppBadge()
        } catch (e) {}
      }
    })(),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/panel'
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of all) {
        if (client.url.includes('/panel')) {
          try {
            await client.navigate(url)
          } catch (e) {}
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })(),
  )
})
