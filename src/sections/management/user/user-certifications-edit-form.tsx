import type { IUser } from 'src/types/user';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useQuery } from '@tanstack/react-query';
import { lazy, useRef, Suspense, useState, useEffect } from 'react';

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { listUserFilesViaBackend } from 'src/utils/backend-storage';

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
    hiring_package?: any[];
  }>({
    tcp_certification: [],
    driver_license: [],
    other_documents: [],
    hiring_package: [],
  });

  // Fetch current user assets with optimized settings
  const {
    data: userAssets,
    error: fetchError,
    isLoading,
  } = useQuery({
    queryKey: ['user-assets', currentUser.id],
    queryFn: async () => {
      if (!currentUser.id) return null;
      try {
        const response = await fetcher(`${endpoints.cloudinary.userAssets}/${currentUser.id}`);
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

  // Helper function to parse document type and fileId from Cloudinary URL
  const parseCloudinaryMetadata = (url: string): { documentType?: string; fileId?: string } => {
    try {
      // Extract filename from URL
      // Format: .../other_documents_userId_fileId___documentType.ext
      // or: .../other_documents_userId_fileId.ext (old format)
      const urlParts = url.split('/');
      const filenameWithExt = urlParts[urlParts.length - 1];
      const filename = filenameWithExt.split('.')[0];

      // Parse format: other_documents_userId_fileId[___documentType]
      const parts = filename.split('_');
      if (parts.length >= 3) {
        // Find where ___documentType starts (if exists)
        const docTypeIndex = filename.indexOf('___');

        if (docTypeIndex !== -1) {
          // New format with document type
          const beforeDocType = filename.substring(0, docTypeIndex);
          const docTypePart = filename.substring(docTypeIndex + 3); // Skip ___

          // Extract fileId (last segment before ___)
          const beforeParts = beforeDocType.split('_');
          const fileId = beforeParts[beforeParts.length - 1];
          const docType = docTypePart.replace(/_/g, ' ');

          return { fileId: `${fileId}___${docTypePart}`, documentType: docType };
        } else {
          // Old format without document type
          // Extract fileId (last segment)
          const fileId = parts[parts.length - 1];
          return { fileId };
        }
      }
    } catch (error) {
      console.error('Error parsing Cloudinary metadata from URL:', error);
    }
    return {};
  };

  // Track if we've already loaded assets to prevent re-runs
  const hasLoadedAssets = useRef(false);

  // Initialize assets when userAssets is loaded (only once)
  useEffect(() => {
    const loadAssets = async () => {
      if (userAssets && !hasLoadedAssets.current) {
        hasLoadedAssets.current = true; // Mark as loaded
        
        // Fetch Supabase files via backend API
        let supabaseFiles: { hiring_package: any[]; other_documents: any[] } = {
          hiring_package: [],
          other_documents: [],
        };
        try {
          const result = await listUserFilesViaBackend(currentUser.id);
          supabaseFiles = {
            hiring_package: result.hiring_package,
            other_documents: result.other_documents,
          };
        } catch (error) {
          console.error('Error fetching Supabase files:', error);
        }

        // Parse document types and fileIds from Cloudinary other_documents URLs
        const cloudinaryOtherDocs = (userAssets.other_documents || []).map((doc: any) => {
          if (doc.url && doc.url.includes('cloudinary')) {
            const { documentType, fileId } = parseCloudinaryMetadata(doc.url);
            return {
              ...doc,
              documentType,
              id: fileId || doc.id, // Use extracted fileId for proper deletion
            };
          }
          return doc;
        });

        // Merge backend assets (Cloudinary) with Supabase files
        setAssets({
          ...userAssets,
          // Merge Supabase PDFs with any existing files, with parsed document types
          hiring_package: [
            ...(supabaseFiles.hiring_package || []),
            ...(userAssets.hiring_package || []),
          ],
          other_documents: [...(supabaseFiles.other_documents || []), ...cloudinaryOtherDocs],
        });
      }
    };

    loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAssets]); // Run when userAssets is loaded, but only once due to hasLoadedAssets flag

  const handleAssetsUpdate = (updatedAssets: {
    tcp_certification?: any[];
    driver_license?: any[];
    other_documents?: any[];
    hiring_package?: any[];
  }) => {
    // Update state immediately - no delays, no refetching
    setAssets(updatedAssets);
    
    // Only refetch user for badge updates (not assets)
    if (refetchUser) {
      setTimeout(() => {
        refetchUser();
      }, 1000); // Small delay for badge update
    }
  };

  // Use local assets state which includes both Cloudinary and Supabase files
  // Always prioritize local state once it's been set (after merging Cloudinary + Supabase)
  // Only fall back to userAssets on initial load before useEffect runs
  const currentAssets = assets;

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
                <strong>Note:</strong> Supported formats: JPEG, JPG, PNG for certifications and
                licenses; PDF for hiring packages; JPEG, JPG, PNG, or PDF for other documents.
                Maximum file size varies by document type.
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
                  userName={`${currentUser.first_name} ${currentUser.last_name}`}
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
                      {dayjs((currentUser as any).tcp_certification_expiry).tz('America/Los_Angeles').format('MMM D, YYYY')}
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
                      {dayjs((currentUser as any).driver_license_expiry).tz('America/Los_Angeles').format('MMM D, YYYY')}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="primary.main">
                    Hiring Package
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Complete hiring package containing employment agreements, onboarding documents,
                    and other required paperwork. Must be in PDF format.
                  </Typography>
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
