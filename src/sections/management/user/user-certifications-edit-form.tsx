import type { IUser } from 'src/types/user';

import { useQuery } from '@tanstack/react-query';
import { lazy, Suspense, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { fetcher, endpoints } from 'src/lib/axios';

// Lazy load the UserAssetsUpload component
const UserAssetsUpload = lazy(() =>
  import('./user-assets-upload').then((module) => ({ default: module.UserAssetsUpload }))
);

// ----------------------------------------------------------------------

type Props = {
  currentUser: IUser;
  refetchUser?: () => void;
};

export function UserCertificationsEditForm({ currentUser, refetchUser }: Props) {
  const [assets, setAssets] = useState<{
    tcp_certification?: any[];
    driver_license?: any[];
    other_documents?: any[];
  }>({});

  // Fetch current user assets with optimized settings
  const {
    data: userAssets,
    refetch,
    error: fetchError,
    isLoading,
  } = useQuery({
    queryKey: ['user-assets', currentUser.id],
    queryFn: async () => {
      if (!currentUser.id) return null;
      try {
        const response = await fetcher(`${endpoints.cloudinaryUserAssets}/${currentUser.id}`);
        return response;
      } catch (error) {
        console.error('Error fetching user assets:', error);
        throw error;
      }
    },
    enabled: !!currentUser.id,
    retry: 1,
    retryDelay: 500,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (replaces cacheTime in newer versions)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Update local state when data changes
  useEffect(() => {
    if (userAssets) {
      setAssets(userAssets);
    }
  }, [userAssets]);

  const handleAssetsUpdate = (updatedAssets: {
    tcp_certification?: any[];
    driver_license?: any[];
    other_documents?: any[];
  }) => {
    setAssets(updatedAssets);
    // Refetch to get the latest data
    refetch();
    // Also refetch user data if provided
    if (refetchUser) {
      refetchUser();
    }
  };

  const currentAssets = userAssets || assets;

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" sx={{ mb: 1 }}>
                Certifications & Documents
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage employee certifications and important documents. Only administrators can
                upload and manage these files.
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> Supported formats: JPEG, JPG, PNG. Maximum file size varies
                by document type.
              </Typography>
            </Alert>

            {fetchError && (
              <Alert severity="error">
                <Typography variant="body2">
                  Error loading assets:{' '}
                  {fetchError instanceof Error ? fetchError.message : 'Unknown error'}
                </Typography>
              </Alert>
            )}

            {currentUser.id && (
              <Suspense
                fallback={
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Loading upload component...
                    </Typography>
                  </Box>
                }
              >
                <UserAssetsUpload
                  userId={currentUser.id}
                  currentAssets={currentAssets}
                  onAssetsUpdate={handleAssetsUpdate}
                  isLoading={isLoading}
                />
              </Suspense>
            )}

            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Document Requirements & Expiration Dates
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="primary.main">
                    TCP Certification
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Traffic Control Person certification required for directing traffic at work
                    sites. Must be current and valid.
                  </Typography>
                  {(currentUser as any).tcp_certification_expiry && (
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      Expires:{' '}
                      {new Date((currentUser as any).tcp_certification_expiry).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="primary.main">
                    Driver License
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Valid driver&apos;s license or commercial driver&apos;s license (CDL) as
                    required for the position. Must be current and not expired.
                  </Typography>
                  {(currentUser as any).driver_license_expiry && (
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      Expires:{' '}
                      {new Date((currentUser as any).driver_license_expiry).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="primary.main">
                    Other Documents
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Additional certifications, training records, or other relevant documents as
                    required by company policy.
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Card>
      </Grid>
    </Grid>
  );
}
