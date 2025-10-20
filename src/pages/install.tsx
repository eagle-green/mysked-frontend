import { useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useRouter } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function InstallPage() {
  const router = useRouter();

  useEffect(() => {
    // Add noindex meta tag to prevent search engines from indexing this page
    let noindexMeta = document.querySelector('meta[name="robots"]');
    if (!noindexMeta) {
      noindexMeta = document.createElement('meta');
      noindexMeta.setAttribute('name', 'robots');
      document.head.appendChild(noindexMeta);
    }
    noindexMeta.setAttribute('content', 'noindex, nofollow');
  }, []);

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom>
            Install MySked App
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Get the best experience by installing MySked on your device. Access it like a native
            app!
          </Typography>
        </Box>

        {/* Benefits */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Why Install?
          </Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Iconify
                icon="solar:check-circle-bold"
                width={24}
                sx={{ color: 'success.main', mt: 0.5 }}
              />
              <Box>
                <Typography variant="subtitle2">Faster Access</Typography>
                <Typography variant="body2" color="text.secondary">
                  Launch directly from your home screen without opening a browser
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Iconify
                icon="solar:check-circle-bold"
                width={24}
                sx={{ color: 'success.main', mt: 0.5 }}
              />
              <Box>
                <Typography variant="subtitle2">Offline Mode</Typography>
                <Typography variant="body2" color="text.secondary">
                  View previously loaded pages even when you&apos;re offline
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Iconify
                icon="solar:check-circle-bold"
                width={24}
                sx={{ color: 'success.main', mt: 0.5 }}
              />
              <Box>
                <Typography variant="subtitle2">Native Experience</Typography>
                <Typography variant="body2" color="text.secondary">
                  Full screen mode without browser bars for a cleaner interface
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Iconify
                icon="solar:check-circle-bold"
                width={24}
                sx={{ color: 'success.main', mt: 0.5 }}
              />
              <Box>
                <Typography variant="subtitle2">Notifications Ready</Typography>
                <Typography variant="body2" color="text.secondary">
                  Get instant updates about job assignments and schedule changes
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Card>

        {/* iOS Instructions */}
        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Iconify icon={'eva:smartphone-outline' as any} width={32} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              iPhone / iPad (Safari)
            </Typography>
          </Box>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="h6" sx={{ minWidth: 30, color: 'primary.main' }}>
                1.
              </Typography>
              <Box>
                <Typography variant="body1">
                  Open <strong>mysked.ca</strong> in Safari browser
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="h6" sx={{ minWidth: 30, color: 'primary.main' }}>
                2.
              </Typography>
              <Box>
                <Typography variant="body1">
                  Tap the{' '}
                  <Iconify
                    icon={'mi:share' as any}
                    width={20}
                    sx={{ verticalAlign: 'middle', mx: 0.5 }}
                  />
                  <strong>Share</strong> button at the bottom of the screen
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="h6" sx={{ minWidth: 30, color: 'primary.main' }}>
                3.
              </Typography>
              <Box>
                <Typography variant="body1">
                  Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="h6" sx={{ minWidth: 30, color: 'primary.main' }}>
                4.
              </Typography>
              <Box>
                <Typography variant="body1">
                  Tap <strong>&quot;Add&quot;</strong> in the top right corner
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="h6" sx={{ minWidth: 30, color: 'primary.main' }}>
                5.
              </Typography>
              <Box>
                <Typography variant="body1">
                  The MySked icon will appear on your home screen. Tap it to launch!
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Card>

        {/* Android Instructions */}
        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Iconify icon={'eva:smartphone-outline' as any} width={32} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Android (Chrome)
            </Typography>
          </Box>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="h6" sx={{ minWidth: 30, color: 'primary.main' }}>
                1.
              </Typography>
              <Box>
                <Typography variant="body1">
                  Open <strong>mysked.ca</strong> in Chrome browser
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="h6" sx={{ minWidth: 30, color: 'primary.main' }}>
                2.
              </Typography>
              <Box>
                <Typography variant="body1">
                  A banner will appear at the bottom asking to install the app
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Or tap the <strong>⋮</strong> menu button in the top right
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="h6" sx={{ minWidth: 30, color: 'primary.main' }}>
                3.
              </Typography>
              <Box>
                <Typography variant="body1">
                  Tap <strong>&quot;Add to Home screen&quot;</strong> or{' '}
                  <strong>&quot;Install app&quot;</strong>
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="h6" sx={{ minWidth: 30, color: 'primary.main' }}>
                4.
              </Typography>
              <Box>
                <Typography variant="body1">
                  Tap <strong>&quot;Add&quot;</strong> or <strong>&quot;Install&quot;</strong> to
                  confirm
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="h6" sx={{ minWidth: 30, color: 'primary.main' }}>
                5.
              </Typography>
              <Box>
                <Typography variant="body1">
                  The MySked icon will appear on your home screen or app drawer!
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Card>

        {/* Desktop Instructions */}
        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Iconify icon="solar:monitor-bold" width={32} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Desktop (Chrome)
            </Typography>
          </Box>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="h6" sx={{ minWidth: 30, color: 'primary.main' }}>
                1.
              </Typography>
              <Box>
                <Typography variant="body1">
                  Open <strong>mysked.ca</strong> in Chrome
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="h6" sx={{ minWidth: 30, color: 'primary.main' }}>
                2.
              </Typography>
              <Box>
                <Typography variant="body1">
                  Click the{' '}
                  <Iconify
                    icon={'eva:plus-circle-outline' as any}
                    width={20}
                    sx={{ verticalAlign: 'middle', mx: 0.5 }}
                  />
                  <strong>install icon</strong> in the address bar (right side)
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="h6" sx={{ minWidth: 30, color: 'primary.main' }}>
                3.
              </Typography>
              <Box>
                <Typography variant="body1">
                  Click <strong>&quot;Install&quot;</strong> in the popup
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="h6" sx={{ minWidth: 30, color: 'primary.main' }}>
                4.
              </Typography>
              <Box>
                <Typography variant="body1">
                  The app will open in its own window and appear in your applications!
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Card>

        {/* Troubleshooting */}
        <Card sx={{ p: 3, bgcolor: 'background.neutral' }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Don&apos;t see the install option?
          </Typography>
          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                •
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Make sure you&apos;re using a supported browser (Chrome, Safari)
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                •
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The app might already be installed - check your home screen or app drawer
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                •
              </Typography>
              <Typography variant="body2" color="text.secondary">
                On iPhone, you must use Safari browser (not Chrome or other browsers)
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                •
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try refreshing the page or clearing your browser cache
              </Typography>
            </Box>
          </Stack>
        </Card>

        {/* Back Button */}
        <Box sx={{ textAlign: 'center', pt: 2 }}>
          <Button
            variant="outlined"
            size="large"
            onClick={() => router.back()}
            startIcon={<Iconify icon={'eva:arrow-back-fill' as any} />}
          >
            Back to App
          </Button>
        </Box>
      </Stack>
    </Container>
  );
}
