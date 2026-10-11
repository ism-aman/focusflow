// FocusFlow service worker: network-first, so new uploads show up right away.
// Har baar HTML update upload karo to VERSION badal do (v13, v14 ...)
const VERSION = 'v14';

self.addEventListener('install', e => { self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network first; cache is only a fallback when offline.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request, { cache: 'no-store' })
      .then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// "Mark done" button on a reminder notification
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const id = e.notification.data && e.notification.data.id;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (e.action === 'done' && id) {
        if (list.length) { list.forEach(c => c.postMessage({ done: id })); return; }
        return self.clients.openWindow('./?v=rem&done=' + encodeURIComponent(id));
      }
      if (list.length) return list[0].focus();
      return self.clients.openWindow('./');
    })
  );
});
