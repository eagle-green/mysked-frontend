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
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <>
          {this.inputGlobalStyles()}
          <div className={errorBoundaryClasses.root}>
            <div className={errorBoundaryClasses.container}>
              <h1 className={errorBoundaryClasses.title}>Unexpected Application Error!</h1>
              <p className={errorBoundaryClasses.message}>
                {this.state.error?.name}: {this.state.error?.message}
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
                    }
                  }}
                >
                  Refresh Page
                </Button>
                <Button 
                  variant="contained" 
                  onClick={this.handleGoHome}
                  color="primary"
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
