// Service Worker registration utility

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('[SW] Service Worker registered:', registration.scope);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('[SW] New service worker found');

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW] New service worker available');
                // Notify user about update
                if (window.confirm('A new version is available. Reload to update?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          });
        })
        .catch((error) => {
          console.error('[SW] Service Worker registration failed:', error);
        });

      // Handle controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] Controller changed, reloading page');
        window.location.reload();
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[SW] Message from service worker:', event.data);

        if (event.data && event.data.type === 'SYNC_STARTED') {
          // Dispatch custom event for app to handle
          window.dispatchEvent(new CustomEvent('sw-sync-started'));
        }
      });
    });
  } else {
    console.log('[SW] Service Worker not supported');
  }
}

// Request background sync (if supported)
export async function requestBackgroundSync(tag = 'sync-offline-requests') {
  if ('serviceWorker' in navigator && 'sync' in navigator.serviceWorker) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log('[SW] Background sync registered:', tag);
      return true;
    } catch (error) {
      console.error('[SW] Background sync failed:', error);
      return false;
    }
  }
  return false;
}

// Unregister service worker (for debugging)
export async function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('[SW] Service Worker unregistered');
    }
  }
}
