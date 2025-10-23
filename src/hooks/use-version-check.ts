import { useRef, useEffect } from 'react';

// ----------------------------------------------------------------------

const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
const INITIAL_VERSION_KEY = 'app_initial_version';

interface AppMeta {
  version: string;
  buildTime: string;
}

export function useVersionCheck() {
  const initialVersionRef = useRef<string | null>(null);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Get the initial version when the app first loads
    const getInitialVersion = async () => {
      try {
        const response = await fetch('/meta.json?_=' + Date.now(), {
          cache: 'no-cache',
        });
        const meta: AppMeta = await response.json();

        // Store in session storage so it persists across navigation but not browser restarts
        sessionStorage.setItem(INITIAL_VERSION_KEY, meta.buildTime);
        initialVersionRef.current = meta.buildTime;
        console.log('📦 App version loaded:', meta.version, 'Build time:', meta.buildTime);
      } catch (error) {
        console.error('❌ Failed to fetch initial version:', error);
      }
    };

    // Check for new version
    const checkVersion = async () => {
      try {
        // Get the stored initial version
        const storedVersion =
          sessionStorage.getItem(INITIAL_VERSION_KEY) || initialVersionRef.current;

        if (!storedVersion) {
          // First check, just store the version
          await getInitialVersion();
          return;
        }

        // Fetch current version from server
        const response = await fetch('/meta.json?_=' + Date.now(), {
          cache: 'no-cache',
        });
        const meta: AppMeta = await response.json();

        // Compare build times
        if (meta.buildTime !== storedVersion) {
          console.log('🔄 New version detected! Auto-refreshing...');
          console.log('  Old build time:', storedVersion);
          console.log('  New build time:', meta.buildTime);
          
          // Clear ALL storage before reload (helps with iOS PWA caching issues)
          sessionStorage.removeItem(INITIAL_VERSION_KEY);
          sessionStorage.removeItem('last_chunk_error_refresh');
          
          // For iOS PWAs: Try to clear service worker cache
          if ('serviceWorker' in navigator && 'caches' in window) {
            caches.keys().then((cacheNames) => {
              cacheNames.forEach((cacheName) => {
                if (cacheName.includes('mysked')) {
                  console.log('🗑️ Clearing cache:', cacheName);
                  caches.delete(cacheName);
                }
              });
            }).catch(err => console.error('Cache clear error:', err));
          }

          // Hard reload to get new chunks (true = force reload from server, not cache)
          setTimeout(() => {
            window.location.reload();
          }, 100);
        } else {
          console.log('✅ Version check: App is up to date');
        }
      } catch (error) {
        console.error('Version check failed:', error);
      }
    };

    // Set initial version on mount if not already set
    if (!hasCheckedRef.current) {
      hasCheckedRef.current = true;
      const storedVersion = sessionStorage.getItem(INITIAL_VERSION_KEY);
      if (!storedVersion) {
        getInitialVersion();
      } else {
        initialVersionRef.current = storedVersion;
      }
    }

    // Set up periodic version checking
    const intervalId = setInterval(checkVersion, CHECK_INTERVAL);

    // Check when app becomes visible (better for mobile/PWA than focus event)
    // iOS PWAs don't always fire focus events reliably
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('📱 App visible, checking version...');
        checkVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also check on focus as backup (works better on desktop)
    const handleFocus = () => {
      checkVersion();
    };
    window.addEventListener('focus', handleFocus);

    // Check on page show event (iOS Safari/PWA specific)
    const handlePageShow = (event: PageTransitionEvent) => {
      // If page is restored from cache (bfcache), check version
      if (event.persisted) {
        console.log('📱 Page restored from cache, checking version...');
        checkVersion();
      }
    };
    window.addEventListener('pageshow', handlePageShow as EventListener);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow as EventListener);
    };
  }, []);
}
