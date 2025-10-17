/**
 * Register service worker for PWA functionality with auto-update
 */
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available, show update notification
                showUpdateNotification();
              }
            });
          });

          // Check for updates immediately
          registration.update();

          // Check for updates every 5 minutes (more frequent than 1 hour)
          setInterval(
            () => {
              registration.update();
            },
            5 * 60 * 1000
          ); // Check every 5 minutes
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });

      // Listen for controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Automatically reload the page when new SW takes over
        window.location.reload();
      });
    });
  }
}

/**
 * Show update notification to user
 */
function showUpdateNotification() {
  // Create a custom snackbar/toast notification
  const notification = document.createElement('div');
  notification.id = 'update-notification';
  notification.innerHTML = `
    <div style="
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: slideUp 0.3s ease-out;
      max-width: 90%;
    ">
      <div style="font-size: 24px;">🎉</div>
      <div style="flex: 1;">
        <div style="font-weight: 600; margin-bottom: 4px;">New Version Available!</div>
        <div style="font-size: 13px; opacity: 0.9;">Click to update and get the latest features</div>
      </div>
      <button id="update-btn" style="
        background: white;
        color: #667eea;
        border: none;
        padding: 8px 20px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        Update Now
      </button>
      <button id="dismiss-update" style="
        background: transparent;
        color: white;
        border: 1px solid rgba(255,255,255,0.3);
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        font-size: 13px;
      ">
        Later
      </button>
    </div>
    <style>
      @keyframes slideUp {
        from {
          transform: translate(-50%, 100px);
          opacity: 0;
        }
        to {
          transform: translate(-50%, 0);
          opacity: 1;
        }
      }
    </style>
  `;

  document.body.appendChild(notification);

  // Update button click handler
  document.getElementById('update-btn')?.addEventListener('click', () => {
    // Tell the waiting service worker to activate
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
  });

  // Dismiss button click handler
  document.getElementById('dismiss-update')?.addEventListener('click', () => {
    notification.remove();
    // Show again in 10 minutes if user dismissed
    setTimeout(showUpdateNotification, 10 * 60 * 1000);
  });
}

/**
 * Unregister service worker
 */
export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

/**
 * Check if the app is running as PWA
 */
export function isPWA() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Prompt user to install PWA
 */
export function setupInstallPrompt() {
  let deferredPrompt: any = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;

    // Optionally, show your own install button here
  });

  return {
    showInstallPrompt: async () => {
      if (!deferredPrompt) {
        return false;
      }

      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      // Clear the deferredPrompt
      deferredPrompt = null;

      return outcome === 'accepted';
    },
    isInstallable: () => !!deferredPrompt,
  };
}
