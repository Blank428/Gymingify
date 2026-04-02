// Gymingify Service Worker
// Handles background push notifications for rest timer

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Listen for messages from the app
self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE_TIMER') {
    const { seconds, label } = e.data;
    const delay = seconds * 1000;

    // Store the timeout ID so we can cancel it
    self._timerTimeout = setTimeout(async () => {
      // Try to show notification
      if (self.Notification?.permission === 'granted' || Notification.permission === 'granted') {
        try {
          await self.registration.showNotification('Rest complete ✓', {
            body: label || 'Time for your next set!',
            icon: '/logo192.png',
            badge: '/logo192.png',
            vibrate: [200, 100, 200, 100, 300],
            tag: 'rest-timer',
            renotify: true,
          });
        } catch (err) {
          console.log('SW notification error:', err);
        }
      }

      // Wake up the app if it's in the background
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(client => client.postMessage({ type: 'TIMER_DONE' }));
    }, delay);
  }

  if (e.data?.type === 'CANCEL_TIMER') {
    if (self._timerTimeout) {
      clearTimeout(self._timerTimeout);
      self._timerTimeout = null;
    }
  }
});

// Handle notification click — bring app to foreground
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      const appClient = clients.find(c => c.url.includes(self.location.origin));
      if (appClient) return appClient.focus();
      return self.clients.openWindow('/');
    })
  );
});