import type { ReactNode } from 'react';
import type { CSSObject } from '@mui/material/styles';

import React, { Component } from 'react';

import Button from '@mui/material/Button';
import GlobalStyles from '@mui/material/GlobalStyles';

// ----------------------------------------------------------------------

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ReactErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('💥 Error caught by boundary - auto-refreshing...', error, errorInfo);

    // Check if we recently refreshed to prevent infinite loops
    const lastRefresh = sessionStorage.getItem('last_error_boundary_refresh');
    const now = Date.now();

    if (!lastRefresh || now - parseInt(lastRefresh, 10) > 10000) {
      // Haven't refreshed in the last 10 seconds - safe to auto-refresh
      sessionStorage.setItem('last_error_boundary_refresh', now.toString());

      // Clear version check storage to force fresh check
      sessionStorage.removeItem('app_initial_version');
      sessionStorage.removeItem('last_chunk_error_refresh');

      // Auto-refresh immediately (no countdown, no error page)
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      // Already refreshed recently - show error page to prevent infinite loop
      console.error('⚠️ Multiple errors detected - showing error page to prevent loop');
    }
  }

  handleRefresh = () => {
    sessionStorage.removeItem('last_error_boundary_refresh');
    sessionStorage.removeItem('last_chunk_error_refresh');
    sessionStorage.removeItem('app_initial_version');
    window.location.reload();
  };

  handleGoHome = () => {
    sessionStorage.removeItem('last_error_boundary_refresh');
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Check if we're in the refresh prevention state (multiple errors)
      const lastRefresh = sessionStorage.getItem('last_error_boundary_refresh');
      const now = Date.now();
      const recentlyRefreshed = lastRefresh && now - parseInt(lastRefresh, 10) <= 10000;

      // If we just caught an error and haven't refreshed recently, show loading state
      // (the componentDidCatch will trigger refresh in 100ms)
      if (!recentlyRefreshed) {
        return (
          <>
            {this.inputGlobalStyles()}
            <div className={errorBoundaryClasses.root}>
              <div className={errorBoundaryClasses.container}>
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div
                    style={{
                      fontSize: '48px',
                      marginBottom: '20px',
                      animation: 'pulse 1s ease-in-out infinite',
                    }}
                  >
                    🔄
                  </div>
                  <h2
                    style={{
                      color: '#00A76F',
                      margin: '0 0 10px 0',
                      fontSize: '24px',
                    }}
                  >
                    Refreshing...
                  </h2>
                  <p style={{ color: '#888', margin: 0 }}>Loading latest version</p>
                </div>
              </div>
            </div>
          </>
        );
      }

      // Only show full error page if we've refreshed recently (infinite loop prevention)
      return (
        <>
          {this.inputGlobalStyles()}
          <div className={errorBoundaryClasses.root}>
            <div className={errorBoundaryClasses.container}>
              <h1 className={errorBoundaryClasses.title}>Something went wrong</h1>
              <p className={errorBoundaryClasses.message}>
                {this.state.error?.name}: {this.state.error?.message}
              </p>
              <p
                style={{
                  fontSize: '16px',
                  color: '#ff9800',
                  margin: '20px 0',
                  padding: '12px',
                  backgroundColor: 'rgba(255, 152, 0, 0.1)',
                  borderLeft: '3px solid #ff9800',
                  borderRadius: '4px',
                }}
              >
                ⚠️ Multiple errors detected. Auto-refresh disabled to prevent loop.
              </p>
              <div style={{ margin: '20px 0' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={this.handleRefresh}
                  sx={{
                    marginRight: '10px',
                    backgroundColor: '#00A76F',
                    '&:hover': {
                      backgroundColor: '#007867',
                    },
                  }}
                >
                  Try Refresh Again
                </Button>
                <Button
                  variant="outlined"
                  onClick={this.handleGoHome}
                  sx={{
                    borderColor: '#00A76F',
                    color: '#00A76F',
                    '&:hover': {
                      borderColor: '#007867',
                      backgroundColor: 'rgba(0, 167, 111, 0.04)',
                    },
                  }}
                >
                  Go to Home
                </Button>
              </div>
              {this.state.error?.stack && (
                <pre className={errorBoundaryClasses.details}>{this.state.error.stack}</pre>
              )}
            </div>
          </div>
        </>
      );
    }

    return this.props.children;
  }

  private inputGlobalStyles = () => (
    <GlobalStyles
      styles={{
        body: {
          ...cssVars,
          margin: 0,
          color: 'white',
          backgroundColor: 'var(--root-background)',
          [`& .${errorBoundaryClasses.root}`]: rootStyles(),
          [`& .${errorBoundaryClasses.container}`]: contentStyles(),
          [`& .${errorBoundaryClasses.title}`]: titleStyles(),
          [`& .${errorBoundaryClasses.message}`]: messageStyles(),
          [`& .${errorBoundaryClasses.filePath}`]: filePathStyles(),
          [`& .${errorBoundaryClasses.details}`]: detailsStyles(),
        },
        '@keyframes pulse': {
          '0%, 100%': {
            opacity: 1,
          },
          '50%': {
            opacity: 0.5,
          },
        },
      }}
    />
  );
}

// ----------------------------------------------------------------------

const errorBoundaryClasses = {
  root: 'error-boundary-root',
  container: 'error-boundary-container',
  title: 'error-boundary-title',
  details: 'error-boundary-details',
  message: 'error-boundary-message',
  filePath: 'error-boundary-file-path',
};

const cssVars: CSSObject = {
  '--info-color': '#2dd9da',
  '--warning-color': '#e2aa53',
  '--error-color': '#ff5555',
  '--error-background': '#2a1e1e',
  '--details-background': '#111111',
  '--root-background': '#2c2c2e',
  '--container-background': '#1c1c1e',
  '--font-stack-monospace':
    '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
  '--font-stack-sans':
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
};

const rootStyles = (): CSSObject => ({
  display: 'flex',
  flex: '1 1 auto',
  alignItems: 'center',
  padding: '10vh 15px 0',
  flexDirection: 'column',
  fontFamily: 'var(--font-stack-sans)',
});

const contentStyles = (): CSSObject => ({
  gap: 24,
  padding: 20,
  width: '100%',
  maxWidth: 960,
  display: 'flex',
  borderRadius: 8,
  flexDirection: 'column',
  backgroundColor: 'var(--container-background)',
});

const titleStyles = (): CSSObject => ({
  margin: 0,
  lineHeight: 1.2,
  fontSize: '20px',
  fontWeight: 'bold',
});

const messageStyles = (): CSSObject => ({
  margin: 0,
  lineHeight: 1.5,
  padding: '12px 16px',
  whiteSpace: 'pre-wrap',
  color: 'var(--error-color)',
  fontSize: '14px',
  fontFamily: 'var(--font-stack-monospace)',
  backgroundColor: 'var(--error-background)',
  borderLeft: '2px solid var(--error-color)',
  fontWeight: 'bold',
});

const detailsStyles = (): CSSObject => ({
  margin: 0,
  padding: 16,
  lineHeight: 1.5,
  overflow: 'auto',
  borderRadius: 'inherit',
  color: 'var(--warning-color)',
  backgroundColor: 'var(--details-background)',
});

const filePathStyles = (): CSSObject => ({
  marginTop: 0,
  color: 'var(--info-color)',
});
