import type { DialogProps } from '@mui/material/Dialog';

import { toast } from 'sonner';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { fetcher } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = DialogProps & {
  jobId: string;
  worker: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url?: string;
    position?: string;
  };
  onSuccess?: () => void;
};

export function AcceptOnBehalfDialog({ jobId, worker, onSuccess, open, onClose, ...other }: Props) {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await fetcher([
        `/api/works/jobs/${jobId}/worker/${worker.id}/accept-on-behalf`,
        { method: 'POST' },
      ]);

      toast.success(`Successfully accepted job for ${worker.first_name} ${worker.last_name}`);
      onSuccess?.();
      if (onClose) onClose({}, 'backdropClick');
    } catch (error) {
      console.error('Error accepting on behalf:', error);
      toast.error('Failed to accept job on behalf of worker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth {...other}>
      <DialogTitle>Accept Job on Behalf of Worker</DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Worker Info */}
          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: 'background.neutral',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Avatar
              src={worker.photo_url}
              alt={`${worker.first_name} ${worker.last_name}`}
              sx={{ width: 56, height: 56 }}
            >
              {worker.first_name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle1">
                {worker.first_name} {worker.last_name}
              </Typography>
              {worker.position && (
                <Typography variant="body2" color="text.secondary">
                  {worker.position}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Warning Message */}
          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: 'warning.lighter',
              border: (theme) => `1px solid ${theme.palette.warning.main}`,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Iconify
                icon="solar:danger-triangle-bold"
                width={24}
                sx={{ color: 'warning.main', mt: 0.25 }}
              />
              <Box>
                <Typography variant="subtitle2" color="warning.darker" gutterBottom>
                  Important Confirmation Required
                </Typography>
                <Typography variant="body2" color="warning.darker">
                  By accepting this job on behalf of the worker, you confirm that:
                </Typography>
                <Box component="ul" sx={{ mt: 1, pl: 2, mb: 0 }}>
                  <Typography component="li" variant="body2" color="warning.darker">
                    The worker is aware of this job assignment
                  </Typography>
                  <Typography component="li" variant="body2" color="warning.darker">
                    The worker has verbally confirmed their availability
                  </Typography>
                  <Typography component="li" variant="body2" color="warning.darker">
                    You have discussed the job details with the worker
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                This action will mark the worker as &quot;Accepted&quot; and the system will track that you
            accepted on their behalf.
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={(e) => onClose?.(e, 'backdropClick')}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          color="primary"
          loading={loading}
          onClick={handleAccept}
        >
          Confirm & Accept
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

