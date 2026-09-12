self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : {}
  const notification = payload.notification || payload.data || {}
  event.waitUntil(self.registration.showNotification(notification.title || 'OmaniHub', {
    body: notification.body || '', icon: '/favicon.ico', badge: '/favicon.ico',
    data: { url: payload.data?.url || '/' }
  }))
})
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    const client = clients.find((item) => item.url === target)
    return client ? client.focus() : self.clients.openWindow(target)
  }))
})
