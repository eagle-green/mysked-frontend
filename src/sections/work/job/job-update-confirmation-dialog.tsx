import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useMemo, useState } from 'react';
import timezone from 'dayjs/plugin/timezone';
import { useQueryClient } from '@tanstack/react-query';

dayjs.extend(utc);
dayjs.extend(timezone);

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

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

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
      [key: string]: { workerName: string; photo_url?: string; changes: ChangeItem[]; willBeNotified: boolean };
    } = {};

    // Determine which workers will be notified
    const affectedWorkers = new Set<string>();
    const notifyAllWorkers = changes.some(
      (change) => change.field === 'site_id' || change.field === 'job_date'
    );

    if (notifyAllWorkers) {
      // If site or date changed, all workers will be notified
      changes.forEach((change) => {
        if (change.workerName) {
          affectedWorkers.add(change.workerName);
        }
        const workerName = change.fieldName.includes(' - ')
          ? change.fieldName.split(' - ')[0]
          : null;
        if (workerName && workerName !== 'Job Details') {
          affectedWorkers.add(workerName);
        }
      });
    } else {
      // Only workers with specific changes will be notified
      changes.forEach((change) => {
        if (change.field === 'worker_added') {
          // For worker_added, the newValue is the worker name
          if (change.newValue && typeof change.newValue === 'string') {
            affectedWorkers.add(change.newValue);
          }
        } else if (
          change.field === 'worker_removed' ||
          change.field === 'worker_start_time' ||
          change.field === 'worker_end_time'
        ) {
          if (change.workerName) {
            affectedWorkers.add(change.workerName);
          }
          const workerName = change.fieldName.includes(' - ')
            ? change.fieldName.split(' - ')[0]
            : null;
          if (workerName) {
            affectedWorkers.add(workerName);
          }
        }
      });
    }

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
          willBeNotified: notifyAllWorkers || affectedWorkers.has(workerName),
        };
      }

      // Add the change with cleaned field name
      groups[workerName].changes.push({
        ...change,
        fieldName: cleanFieldName,
      });
    });

    return { groups: Object.values(groups), affectedWorkers };
  }, [changes]);

  const { groups, affectedWorkers } = groupedChanges;

  // Check if there are any worker removals
  const hasWorkerRemovals = useMemo(
    () => changes.some((change) => change.field === 'worker_removed'),
    [changes]
  );

  // Check if there are any worker additions
  const hasWorkerAdditions = useMemo(
    () => changes.some((change) => change.field === 'worker_added'),
    [changes]
  );

  const formatValue = (field: string, value: any) => {
    if (!value) return 'N/A';

    if (field === 'job_date') {
      // Format in Pacific timezone to match company operations
      return dayjs(value).tz('America/Vancouver').format('ddd, MMM D, YYYY');
    }

    if (field === 'worker_start_time' || field === 'worker_end_time') {
      // Handle time values with proper timezone conversion
      if (typeof value === 'string' && value.includes('T')) {
        // If it's an ISO string, convert to Pacific time
        return dayjs(value).tz('America/Vancouver').format('h:mm A');
      }
      // If it's already a time string, return as is
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
      // First save the job changes
      await fetcher([
        `${endpoints.work.job}/${jobId}/save-without-notifications`,
        { method: 'PUT', data: jobData || {} },
      ]);

      // Then send update notifications to existing workers
      const notificationResponse = await fetcher([
        `${endpoints.work.job}/${jobId}/send-update-notifications`,
        { 
          method: 'POST', 
          data: { changes: changes.map(change => ({
            field: change.field,
            oldValue: change.oldValue,
            newValue: change.newValue
          })) }
        },
      ]);

      // Invalidate job queries to refresh cached data
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['job-details-dialog'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] }); // This will invalidate all job list queries
      queryClient.invalidateQueries({ queryKey: ['open-jobs'] }); // Invalidate open jobs too
      queryClient.invalidateQueries({ queryKey: ['calendar-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['worker-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['job-workers', jobId] });
      queryClient.invalidateQueries({ queryKey: ['user-job-dates'] });

      // Handle notification results
      if (notificationResponse.success) {
        const { smsSent, emailSent, errors } = notificationResponse;
        const notificationMethods = [];
        if (emailSent > 0) notificationMethods.push('email');
        if (smsSent > 0) notificationMethods.push('SMS');
        
        if (notificationMethods.length > 0) {
          toast.success(`Job updated and notifications sent successfully via ${notificationMethods.join(' and ')}!`);
        } else {
          toast.success('Job updated successfully!');
        }
        
        if (errors && errors.length > 0) {
          console.warn('Some notifications failed:', errors);
        }
      } else {
        toast.success('Job updated successfully!');
        toast.warning('Some notifications may have failed to send.');
      }

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
        {/* Summary of affected workers */}
        {affectedWorkers.size > 0 && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              bgcolor: 'primary.lighter',
              borderRadius: 1.5,
              border: (theme) => `1px dashed ${theme.palette.primary.main}`,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Iconify icon="solar:user-rounded-bold" width={24} color="primary.main" />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {affectedWorkers.size}{' '}
                  Worker{affectedWorkers.size !== 1 ? 's' : ''} Will Be Notified
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {Array.from(affectedWorkers).join(', ')}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          The following changes have been made to this job. Click &quot;Send Notifications&quot; to notify
          affected workers about these updates.
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Changes Made:
          </Typography>

          <Stack spacing={3}>
            {groups.map((workerGroup, groupIndex) => (
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
                        {workerGroup.willBeNotified && (
                          <Chip
                            label="Will be notified"
                            size="small"
                            color="success"
                            sx={{ height: 20, fontSize: '0.75rem' }}
                          />
                        )}
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
                  {workerGroup.changes.map((change, changeIndex) => {
                    // Special handling for worker additions and removals
                    if (change.field === 'worker_added') {
                      return (
                        <Box
                          key={changeIndex}
                          sx={{ pl: workerGroup.workerName === 'Job Details' ? 0 : 6 }}
                        >
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Iconify
                              icon="solar:user-plus-bold"
                              width={24}
                              sx={{ color: 'success.main' }}
                            />
                            <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                              <strong>{change.newValue}</strong> has been added to this job
                            </Typography>
                          </Stack>
                        </Box>
                      );
                    }

                    if (change.field === 'worker_removed') {
                      return (
                        <Box
                          key={changeIndex}
                          sx={{ pl: workerGroup.workerName === 'Job Details' ? 0 : 6 }}
                        >
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Iconify
                              icon="solar:user-id-bold"
                              width={24}
                              sx={{ color: 'error.main' }}
                            />
                            <Typography variant="body2" color="error.main" sx={{ fontWeight: 500 }}>
                              <strong>{change.oldValue}</strong> has been removed from this job
                            </Typography>
                          </Stack>
                        </Box>
                      );
                    }

                    // Regular changes (time changes, site changes, etc.)
                    return (
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
                    );
                  })}
                </Stack>

                {groupIndex < groups.length - 1 && <Divider sx={{ mt: 3 }} />}
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
            <Iconify icon="solar:info-circle-bold" width={20} color="#000000" />
            <Box>
              <Typography variant="body2" color="info.darker" sx={{ fontWeight: 500, mb: 0.5 }}>
                What happens next?
              </Typography>
              <Typography variant="caption" color="info.dark">
                {hasWorkerRemovals && (
                  <>
                    • <strong>Removed workers</strong> who accepted this job will receive a
                    cancellation notification
                    <br />
                  </>
                )}
                {hasWorkerAdditions && (
                  <>
                    • <strong>New workers</strong> will receive job assignment notifications via SMS
                    and email
                    <br />
                  </>
                )}
                • <strong>Existing workers</strong> who accepted this job will be notified of any
                changes
                <br />
                • Their status will change to &quot;Pending&quot; until they confirm
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
