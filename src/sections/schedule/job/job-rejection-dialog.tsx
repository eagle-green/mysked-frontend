import { useState } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AlertTitle from '@mui/material/AlertTitle';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type JobRejectionDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  jobNumber: string;
  rejectionStats?: {
    last3Months: number;
    thisYear: number;
  };
};

export function JobRejectionDialog({
  open,
  onClose,
  onConfirm,
  jobNumber,
  rejectionStats = { last3Months: 0, thisYear: 0 },
}: JobRejectionDialogProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isReasonValid = reason.trim().length >= 20;
  const isApproachingLimit = rejectionStats.last3Months >= 1 || rejectionStats.thisYear >= 4;
  const hasExceededLimit = rejectionStats.last3Months > 1 || rejectionStats.thisYear >= 5;

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      setError('');
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!isReasonValid) {
      setError('Rejection reason must be at least 20 characters');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onConfirm(reason);
      setReason('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="solar:danger-triangle-bold" width={24} color="error.main" />
          <Typography variant="h6">Reject Job #{jobNumber}?</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        {/* Rejection Policy Warning */}
        <Alert
          severity={hasExceededLimit ? 'error' : isApproachingLimit ? 'warning' : 'info'}
          sx={{ mb: 3 }}
        >
          <AlertTitle sx={{ fontWeight: 600 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon={"solar:shield-warning-bold" as any} width={20} />
              <span>Rejection Policy</span>
            </Stack>
          </AlertTitle>

          <Typography variant="body2" sx={{ mb: 1.5 }}>
            Please be advised that employees are permitted to reject no more than:
          </Typography>

          <Box component="ul" sx={{ pl: 2, mb: 1.5, '& li': { mb: 0.5 } }}>
            <li>
              <Typography variant="body2">
                <strong>1 shift every 3 months</strong>, OR
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>5 shifts per calendar year</strong>
              </Typography>
            </li>
          </Box>

          {/* Current Status */}
          <Box
            sx={{
              p: 1.5,
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              mb: 1.5,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
              Your Current Status:
            </Typography>
            <Stack direction="row" spacing={2}>
              <Typography variant="body2">
                • Last 3 months:{' '}
                <strong>
                  {rejectionStats.last3Months}/1
                  {rejectionStats.last3Months >= 1 && ' ⚠️'}
                </strong>
              </Typography>
              <Typography variant="body2">
                • This year:{' '}
                <strong>
                  {rejectionStats.thisYear}/5
                  {rejectionStats.thisYear >= 4 && ' ⚠️'}
                </strong>
              </Typography>
            </Stack>
          </Box>

          <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.6 }}>
            Additional rejections beyond this limit will be:
            <br />
            ✓ Recorded and reviewed by management
            <br />
            ✓ May result in further action
            <br />✓ Negatively impact team operations and scheduling
            <br />
            <br />
            We appreciate your cooperation and commitment to maintaining a reliable team.
          </Typography>
        </Alert>

        {/* Rejection Reason Input */}
        <TextField
          autoFocus
          fullWidth
          multiline
          rows={4}
          label="Rejection Reason *"
          placeholder="Please provide a detailed reason for rejecting this job (minimum 20 characters)..."
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError('');
          }}
          error={!!error}
          helperText={
            error || (
              <span>
                {reason.trim().length}/500 characters
                {reason.trim().length < 20 && ` (minimum 20 required)`}
              </span>
            )
          }
          inputProps={{ maxLength: 500 }}
          disabled={isSubmitting}
          sx={{ mb: 2 }}
        />

        {hasExceededLimit && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Warning:</strong> You have exceeded the rejection limit. This rejection will be
              flagged for management review.
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={isSubmitting} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleSubmit}
          disabled={!isReasonValid || isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
        >
          {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

