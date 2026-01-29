import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  jobId: string;
  jobNumber: string;
  jobData: any;
};

export function JobDraftWorkersDialog({
  open,
  onClose,
  onSuccess,
  jobId,
  jobNumber,
  jobData,
}: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const handleAddWorkerOnly = async () => {
    setIsSaving(true);
    try {
      await fetcher([
        `${endpoints.work.job}/${jobId}/save-without-notifications`,
        { method: 'PUT', data: jobData || {} },
      ]);

      queryClient.removeQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['job-details-dialog'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['worker-schedules'] });
      await queryClient.refetchQueries({ queryKey: ['job', jobId] });

      toast.success('Workers added successfully (no notifications sent)!');
      onSuccess();
      onClose();
      router.push(paths.work.job.list);
    } catch (error) {
      console.error('❌ Error in handleAddWorkerOnly:', error);
      toast.error('Failed to add workers. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddWorkerAndNotify = async () => {
    setIsSaving(true);
    try {
      await fetcher([
        `${endpoints.work.job}/${jobId}/save-with-notifications`,
        { method: 'PUT', data: jobData || {} },
      ]);

      queryClient.removeQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['job-details-dialog'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['worker-schedules'] });
      await queryClient.refetchQueries({ queryKey: ['job', jobId] });

      toast.success('Workers added and notifications sent successfully!');
      onSuccess();
      onClose();
      router.push(paths.work.job.list);
    } catch (error) {
      console.error('❌ Error in handleAddWorkerAndNotify:', error);
      toast.error('Failed to add workers and send notifications. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">Workers Not Notified Yet</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Job #{jobNumber}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            The workers you&apos;re adding haven&apos;t been notified about this job yet.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Would you like to:
          </Typography>
          <Box sx={{ mt: 2, pl: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • <strong>Add workers only:</strong> Workers will be added to the job but won&apos;t
              receive any notifications yet. You can send notifications later.
            </Typography>
            <Typography variant="body2">
              • <strong>Add workers and send notifications:</strong> Workers will be added and will
              immediately receive SMS/email notifications about this job.
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleAddWorkerOnly}
          variant="outlined"
          disabled={isSaving}
          sx={{ ml: 1 }}
        >
          Add Workers Only
        </Button>
        <Button
          onClick={handleAddWorkerAndNotify}
          variant="contained"
          disabled={isSaving}
          sx={{ ml: 1 }}
        >
          Add Workers & Send Notifications
        </Button>
      </DialogActions>
    </Dialog>
  );
}

