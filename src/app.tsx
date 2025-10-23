import 'src/global.css';

import { useEffect } from 'react';

import { usePathname } from 'src/routes/hooks';

import { useVersionCheck } from 'src/hooks/use-version-check';

import 'src/utils/cloudinary-cleanup'; // Make cleanup utilities available globally

import { LocalizationProvider } from 'src/locales';
import { themeConfig, ThemeProvider } from 'src/theme';

import { Snackbar } from 'src/components/snackbar';
import { ProgressBar } from 'src/components/progress-bar';
import { MotionLazy } from 'src/components/animate/motion-lazy';
import { ReactErrorBoundary } from 'src/components/error-boundary';
import { SettingsDrawer, defaultSettings, SettingsProvider } from 'src/components/settings';

import { AuthProvider } from 'src/auth/context/jwt';

// ----------------------------------------------------------------------

type AppProps = {
  children: React.ReactNode;
};

export default function App({ children }: AppProps) {
  useScrollToTop();

  // Check for new app versions and auto-refresh
  useVersionCheck();

  // Global error handler for chunk loading failures
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const isChunkError = 
        event.message.includes('Failed to fetch dynamically imported module') ||
        event.message.includes('Importing a module script failed') ||
        event.message.includes('error loading dynamically imported module');

      if (isChunkError) {
        console.error('🔄 Chunk loading error detected, auto-refreshing...');
        event.preventDefault();
        
        // Add a small delay to prevent infinite loops
        const lastRefresh = sessionStorage.getItem('last_chunk_error_refresh');
        const now = Date.now();
        
        if (!lastRefresh || now - parseInt(lastRefresh, 10) > 10000) {
          sessionStorage.setItem('last_chunk_error_refresh', now.toString());
          window.location.reload();
        } else {
          console.error('⚠️ Multiple chunk errors detected, not auto-refreshing to prevent loop');
        }
      }
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <ReactErrorBoundary>
      <AuthProvider>
        <SettingsProvider defaultSettings={defaultSettings}>
          <LocalizationProvider>
            <ThemeProvider
              modeStorageKey={themeConfig.modeStorageKey}
              defaultMode={themeConfig.enableSystemMode ? 'system' : themeConfig.defaultMode}
            >
              <MotionLazy>
                <Snackbar />
                <ProgressBar />
                <SettingsDrawer defaultSettings={defaultSettings} />
                {children}
              </MotionLazy>
            </ThemeProvider>
          </LocalizationProvider>
        </SettingsProvider>
      </AuthProvider>
    </ReactErrorBoundary>
  );
}

// ----------------------------------------------------------------------

function useScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
