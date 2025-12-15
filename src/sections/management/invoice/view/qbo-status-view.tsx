import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

export function QboStatusView() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: qboStatus, isLoading, refetch: _refetch } = useQuery({
    queryKey: ['qbo-status'],
    queryFn: () => fetcher(endpoints.invoice.qboStatus),
    refetchOnWindowFocus: true,
  });

  const handleConnect = async () => {
    try {
      const response = await fetcher(endpoints.invoice.qboConnect);
      if (response?.authUrl) {
        window.location.href = response.authUrl;
      } else {
        console.error('No authUrl in response:', response);
      }
    } catch (error) {
      console.error('Error initiating QBO connection:', error);
    }
  };

  const connected = qboStatus?.connected || false;
  const companyName = qboStatus?.companyName || null;
  const lastConnected = qboStatus?.lastConnected || qboStatus?.lastSync || null;
  const lastTokenRefresh = qboStatus?.lastTokenRefresh || null;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="QBO Status"
        links={[
          { name: 'Management', href: paths.management.root },
          { name: 'Invoice', href: paths.management.invoice.root },
          { name: 'QBO Status' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Card sx={{ p: 4 }}>
          <Stack spacing={4}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h5" sx={{ mb: 1 }}>
                  QuickBooks Online Integration
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Label
                    variant="soft"
                    color={connected ? 'success' : 'default'}
                    sx={{ px: 2, py: 1, fontSize: '0.875rem' }}
                  >
                    {connected ? 'Connected' : 'Disconnected'}
                  </Label>
                  {connected && companyName && (
                    <Typography variant="body1" color="text.secondary">
                      {companyName}
                    </Typography>
                  )}
                </Box>
              </Box>
              {!connected && (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Iconify icon={"eva:link-fill" as any} />}
                  onClick={handleConnect}
                >
                  Connect to QuickBooks
                </Button>
              )}
            </Box>

            {/* Divider */}
            {connected && <Box sx={{ borderTop: 1, borderColor: 'divider' }} />}

            {/* Connection Details */}
            {connected && (
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
                {lastConnected && (
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      Last Connected
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {new Date(lastConnected).toLocaleString()}
                    </Typography>
                  </Box>
                )}
                {lastTokenRefresh && (
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      Last Token Refresh
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {new Date(lastTokenRefresh).toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Not Connected Message */}
            {!connected && (
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: 'background.neutral',
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Connect your QuickBooks Online account to enable invoice features. Once connected, you&apos;ll be able to sync products, services, and customers.
                </Typography>
              </Box>
            )}
          </Stack>
        </Card>
      )}
    </DashboardContent>
  );
}
