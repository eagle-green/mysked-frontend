import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
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

import { fDateTime } from 'src/utils/format-time';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  jobId: string;
  workerId: string;
};

export function WorkResponseDialog({ open, onClose, jobId, workerId }: Props) {
  const queryClient = useQueryClient();

  // Fetch job details
  const { data: job, isLoading, error: queryError } = useQuery({
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
          <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={40} />
        </Box>
      );
    }

    if (queryError) {
      return (
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          Error loading job details: {queryError.message || 'Unknown error'}
        </Typography>
      );
    }

    if (!job) {
      return (
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          Unable to load job details.
        </Typography>
      );
    }



    return (
      <Card variant="outlined" sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Job #{job.job_number}
          </Typography>

          <Stack spacing={2}>
            {/* Client & Site */}
            <Box>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Client:
                </Typography>
                <Typography variant="body2">
                  {job.client?.name || 'N/A'}
                </Typography>
              </Stack>
              
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="subtitle2" color="text.secondary">
                  Site:
                </Typography>
                <Typography variant="body2">
                  {job.site?.name || 'N/A'}
                </Typography>
              </Stack>
            </Box>

            {/* Date & Time */}
            <Box>
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Start:
                </Typography>
                <Typography variant="body2">
                  {job.start_time ? fDateTime(job.start_time) : 'N/A'}
                </Typography>
              </Stack>
              
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="subtitle2" color="text.secondary">
                  End:
                </Typography>
                <Typography variant="body2">
                  {job.end_time ? fDateTime(job.end_time) : 'N/A'}
                </Typography>
              </Stack>
            </Box>



            {/* Notes */}
            {job.notes && (
              <Box>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Notes:
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  {job.notes}
                </Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Job Assignment</DialogTitle>

      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Would you like to accept or reject this job assignment?
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
