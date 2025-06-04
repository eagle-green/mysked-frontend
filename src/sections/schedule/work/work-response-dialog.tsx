import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Job Response</DialogTitle>

      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Would you like to accept or reject this job assignment?
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleReject} color="error">
          Reject
        </Button>
        <Button onClick={handleAccept} variant="contained" color="primary">
          Accept
        </Button>
      </DialogActions>
    </Dialog>
  );
} 