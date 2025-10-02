import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
  Box,
  Chip,
  Stack,
  Dialog,
  Button,
  Avatar,
  Divider,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface ChangeItem {
  field: string;
  fieldName: string;
  oldValue: any;
  newValue: any;
  workerName?: string;
  photo_url?: string;
}

interface JobUpdateConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  jobId: string;
  changes: ChangeItem[];
  jobNumber: string;
  jobData?: any; // The job data to save
}

export function JobUpdateConfirmationDialog({
  open,
  onClose,
  onSuccess,
  jobId,
  changes,
  jobNumber,
  jobData,
}: JobUpdateConfirmationDialogProps) {
  const [isSending, setIsSending] = useState(false);
  const queryClient = useQueryClient();

  // Group changes by worker
  const groupedChanges = useMemo(() => {
    const groups: {
      [key: string]: { workerName: string; photo_url?: string; changes: ChangeItem[] };
    } = {};

    changes.forEach((change) => {
      // Extract worker name from fieldName (e.g., "Jason Jung - Start Time" -> "Jason Jung")
      // If it doesn't contain " - ", it's a general job change (like Site, Notes, etc.)
      const workerName = change.fieldName.includes(' - ')
        ? change.fieldName.split(' - ')[0]
        : 'Job Details';

      // Clean up the field name by removing worker name prefix
      const cleanFieldName = change.fieldName.includes(' - ')
        ? change.fieldName.split(' - ')[1]
        : change.fieldName;

      if (!groups[workerName]) {
        groups[workerName] = {
          workerName,
          photo_url: change.photo_url,
          changes: [],
        };
      }

      // Add the change with cleaned field name
      groups[workerName].changes.push({
        ...change,
        fieldName: cleanFieldName,
      });
    });

    return Object.values(groups);
  }, [changes]);

  const formatValue = (field: string, value: any) => {
    if (!value) return 'N/A';

    if (field === 'job_date') {
      return new Date(value).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    if (field === 'worker_start_time' || field === 'worker_end_time') {
      // These are already formatted as time strings from the backend
      return String(value);
    }

    if (field === 'site_id') {
      // For site_id, we expect the backend to send the site name in the newValue
      return value.name || value;
    }

    return String(value);
  };

  const handleSendNotifications = async () => {
    setIsSending(true);
    try {
      await fetcher([
        `${endpoints.work.job}/${jobId}/save-with-notifications`,
        { method: 'PUT', data: jobData || {} },
      ]);

      // Invalidate job queries to refresh cached data
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['job-details-dialog'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['worker-schedules'] });

      toast.success('Job updated and notifications sent successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('❌ Error in handleSendNotifications:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      toast.error('Failed to save job and send notifications. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <Iconify icon="solar:bell-bing-bold" width={20} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Job Updated Successfully
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose how to proceed with Job #{jobNumber} changes
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          The following changes have been made to this job. Click &quot;Send Notifications&quot; to notify
          workers about these updates.
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Changes Made:
          </Typography>

          <Stack spacing={3}>
            {groupedChanges.map((workerGroup, groupIndex) => (
              <Box key={groupIndex}>
                {/* Worker/Job Header */}
                <Box sx={{ mb: 2 }}>
                  {workerGroup.workerName === 'Job Details' ? (
                    // Job Details header (no avatar)
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {workerGroup.workerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {workerGroup.changes.length} change
                        {workerGroup.changes.length > 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  ) : (
                    // Worker header (with avatar)
                    <>
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 0.5 }}>
                        <Avatar
                          src={workerGroup.photo_url}
                          alt={workerGroup.workerName}
                          sx={{ width: 32, height: 32 }}
                        >
                          {workerGroup.workerName.split(' ')[0][0]}
                        </Avatar>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {workerGroup.workerName}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ pl: 5 }}>
                        {workerGroup.changes.length} change
                        {workerGroup.changes.length > 1 ? 's' : ''}
                      </Typography>
                    </>
                  )}
                </Box>

                {/* Changes */}
                <Stack spacing={2}>
                  {workerGroup.changes.map((change, changeIndex) => (
                    <Box
                      key={changeIndex}
                      sx={{ pl: workerGroup.workerName === 'Job Details' ? 0 : 6 }}
                    >
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                        <Chip
                          label={change.fieldName}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Typography variant="body2" color="text.secondary">
                          Updated
                        </Typography>
                      </Stack>

                      <Box sx={{ pl: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                          <Typography
                            variant="body2"
                            color="error.main"
                            sx={{ textDecoration: 'line-through' }}
                          >
                            {formatValue(change.field, change.oldValue)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>
                            →
                          </Typography>
                          <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                            {formatValue(change.field, change.newValue)}
                          </Typography>
                        </Stack>
                      </Box>
                    </Box>
                  ))}
                </Stack>

                {groupIndex < groupedChanges.length - 1 && <Divider sx={{ mt: 3 }} />}
              </Box>
            ))}
          </Stack>
        </Box>

        <Box
          sx={{
            bgcolor: 'info.lighter',
            p: 2,
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'info.light',
          }}
        >
          <Stack direction="row" alignItems="flex-start" spacing={1}>
            <Iconify icon="solar:info-circle-bold" width={20} color="info.main" />
            <Box>
              <Typography variant="body2" color="info.darker" sx={{ fontWeight: 500, mb: 0.5 }}>
                What happens next?
              </Typography>
              <Typography variant="caption" color="info.dark">
                • Workers who previously accepted this job will be notified via SMS and email
                <br />
                • Their status will change to &quot;Pending Update&quot; until they confirm
                <br />• They can view the updated job details and confirm or decline the changes
              </Typography>
            </Box>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button variant="outlined" onClick={onClose} disabled={isSending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            handleSendNotifications();
          }}
          disabled={isSending}
          startIcon={
            isSending ? <CircularProgress size={16} /> : <Iconify icon="solar:bell-bing-bold" />
          }
        >
          {isSending ? 'Sending...' : 'Send Notifications'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
