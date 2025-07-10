import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import CardContent from '@mui/material/CardContent';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { fDate, fTime } from 'src/utils/format-time';

import { fetcher, endpoints } from 'src/lib/axios';
import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  jobId: string;
  workerId: string;
};

// Helper function to get full address
const getFullAddress = (site: any) => {
  if (!site) return '';

  const parts = [
    site.unit_number,
    site.street_number,
    site.street_name,
    site.city,
    site.province,
    site.postal_code,
    site.country,
  ].filter(Boolean);

  return parts.join(', ');
};

// Helper function to check if address is complete for Google Maps
const hasCompleteAddress = (site: any) => !!(
    site?.street_number &&
    site?.street_name &&
    site?.city &&
    site?.province &&
    site?.postal_code &&
    site?.country
  );

export function WorkResponseDialog({ open, onClose, jobId, workerId }: Props) {
  const queryClient = useQueryClient();

  // Fetch job details
  const {
    data: job,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.work.job}/${jobId}`);
      return response.data.job; // Access the nested job object
    },
    enabled: open && !!jobId,
  });

  const handleAccept = useCallback(async () => {
    try {
      await fetcher([
        `${endpoints.work.job}/${jobId}/worker/${workerId}/response`,
        {
          method: 'PUT',
          data: { status: 'accepted' },
        },
      ]);

      // Invalidate all job-related queries to refresh the table
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['work'] });

      toast.success('Job accepted successfully!');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to accept the job.');
    }
  }, [jobId, workerId, onClose, queryClient]);

  const handleReject = useCallback(async () => {
    try {
      await fetcher([
        `${endpoints.work.job}/${jobId}/worker/${workerId}/response`,
        {
          method: 'PUT',
          data: { status: 'rejected' },
        },
      ]);

      // Invalidate all job-related queries to refresh the table
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['work'] });

      toast.success('Job rejected successfully!');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to reject the job.');
    }
  }, [jobId, workerId, onClose, queryClient]);

  const renderJobDetails = () => {
    if (isLoading) {
      return (
        <Box sx={{ mt: 2 }}>
          <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={80} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={60} />
        </Box>
      );
    }

    if (queryError) {
      return (
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          Error loading job details. Please try again.
        </Typography>
      );
    }

    if (!job) {
      return (
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          Job details not found.
        </Typography>
      );
    }

    // Find current worker details
    const currentWorker = job.workers?.find((worker: any) => worker.id === workerId);
    const positionLabel =
      JOB_POSITION_OPTIONS.find((option) => option.value === currentWorker?.position)?.label ||
      currentWorker?.position ||
      'Unknown Position';

    // Format address
    const siteAddress = getFullAddress(job.site);
    const hasCompleteAddr = hasCompleteAddress(job.site);
    const googleMapsUrl = hasCompleteAddr
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteAddress)}`
      : null;

    return (
      <Box sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Job #{job.job_number}
          </Typography>

          <Chip label={positionLabel} size="small" sx={{ mb: 3 }} />

          <Stack spacing={2}>
            {/* Client & Site Info */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Location Details
              </Typography>

              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Client:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {job.client?.name || 'N/A'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Site:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {job.site?.name || 'N/A'}
                  </Typography>
                </Box>

                {siteAddress && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      Address:
                    </Typography>
                    {googleMapsUrl ? (
                      <Link
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="body2"
                        sx={{ display: 'block' }}
                      >
                        {siteAddress}
                      </Link>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {siteAddress}
                      </Typography>
                    )}
                  </Box>
                )}
              </Stack>
            </Box>

            <Divider />

            {/* Schedule */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Schedule
              </Typography>

              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Date:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {currentWorker?.start_time ? fDate(currentWorker.start_time) : 'N/A'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Start Time:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {currentWorker?.start_time ? fTime(currentWorker.start_time) : 'N/A'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">End Time:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {currentWorker?.end_time ? fTime(currentWorker.end_time) : 'N/A'}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Notes */}
            {job.notes && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Notes
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {job.notes}
                  </Typography>
                </Box>
              </>
            )}
          </Stack>
        </CardContent>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Job Assignment</DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Please review the job details and choose your response.
        </Typography>

        {renderJobDetails()}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleReject} variant="contained" color="error">
          Reject
        </Button>
        <Button onClick={handleAccept} variant="contained" color="primary">
          Accept
        </Button>
      </DialogActions>
    </Dialog>
  );
}
