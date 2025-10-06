import { useState, useEffect } from 'react';
import { Navigate, useParams } from 'react-router';

import { Box, Typography, CircularProgress } from '@mui/material';

import { CONFIG } from 'src/global-config';

export default function ShortRedirectPage() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolveShortUrl = async () => {
      if (!shortCode) {
        setError('Invalid short code');
        setLoading(false);
        return;
      }

      try {
        // Call the backend to resolve the short URL
        const apiUrl = `${CONFIG.serverUrl}/api/short/${shortCode}`;

        const response = await fetch(apiUrl, {
          method: 'GET',
          redirect: 'manual', // Don't follow redirects automatically
        });

        if (response.status === 301 || response.status === 302) {
          // Get the redirect URL from the Location header
          const redirectUrl = response.headers.get('Location');
          if (redirectUrl) {
            setOriginalUrl(redirectUrl);
          } else {
            setError('Redirect URL not found');
          }
        } else if (response.status === 404) {
          setError('Short URL not found or expired');
        } else {
          const errorText = await response.text();
          console.error('Unexpected response:', response.status, errorText);
          setError(`Failed to resolve short URL (Status: ${response.status})`);
        }
      } catch (err) {
        console.error('Error resolving short URL:', err);
        setError(`Network error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    resolveShortUrl();
  }, [shortCode]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body1">Resolving short URL...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
          p: 3,
        }}
      >
        <Typography variant="h6" color="error">
          Error
        </Typography>
        <Typography variant="body1" textAlign="center">
          {error}
        </Typography>
      </Box>
    );
  }

  if (originalUrl) {
    // Redirect to the original URL
    return <Navigate to={originalUrl} replace />;
  }

  return null;
}
