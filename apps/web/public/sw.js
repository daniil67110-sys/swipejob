// SwipeJob Service Worker — Web Push (Story 4.4).
// Garde-fou : code volontairement minimal. Pas de cache offline ni de logique métier ici.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = { title: 'SwipeJob', body: 'Tu as une nouvelle activité.', url: '/deck' };
  try {
    if (event.data) payload = Object.assign(payload, event.data.json());
  } catch (_) {
    // ignore
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      data: { url: payload.url || '/deck' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/deck';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(targetUrl) && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return undefined;
    }),
  );
});
