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
          
          // Clear session storage before reload
          sessionStorage.removeItem(INITIAL_VERSION_KEY);

          // Hard reload to get new chunks
          window.location.reload();
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

    // Also check when window gains focus (user comes back to tab)
    // This provides immediate updates when user returns to app
    const handleFocus = () => {
      checkVersion();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
}
