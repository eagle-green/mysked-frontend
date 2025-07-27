import type { IJobWorker } from 'src/types/job';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { fDate, fTime } from 'src/utils/format-time';

import { fetcher, endpoints } from 'src/lib/axios';
import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';
import { VEHICLE_TYPE_OPTIONS } from 'src/assets/data/vehicle';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  jobId: string;
  workerId: string;
  data: any;
};

const formatVehicleType = (type: string) => {
  const option = VEHICLE_TYPE_OPTIONS.find((opt) => opt.value === type);
  return option?.label || type;
};

export function JobNotifyDialog({ open, onClose, jobId, workerId, data }: Props) {
  const queryClient = useQueryClient();
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSMS, setSendSMS] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleNotify = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Find the specific worker
      const worker = data.workers.find((w: IJobWorker) => w.id === workerId);
      if (!worker) {
        throw new Error('Worker not found');
      }

      // Check if at least one notification method is selected
      if (!sendEmail && !sendSMS) {
        toast.error('Please select at least one notification method (Email or SMS).');
        return;
      }

      // Update worker status to pending and send notifications
      const response = await fetcher([
        `${endpoints.work.job}/${jobId}/worker/${workerId}/response`,
        {
          method: 'PUT',
          data: { 
            status: 'pending',
            sendEmail,
            sendSMS
          },
        },
      ]);

      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['user-job-dates'] }); // Add this line
      
      // Handle response based on notification results
      const { notifications } = response;
      
      if (notifications && notifications.errors && notifications.errors.length > 0) {
        // Some or all notifications failed
        const attemptedMethods = [];
        const successfulMethods = [];
        const failedMethods = [];
        
        if (sendEmail) {
          attemptedMethods.push('email');
          if (notifications.emailSent) {
            successfulMethods.push('email');
          } else {
            failedMethods.push('email');
          }
        }
        
        if (sendSMS) {
          attemptedMethods.push('SMS');
          if (notifications.smsSent) {
            successfulMethods.push('SMS');
          } else {
            failedMethods.push('SMS');
          }
        }
        
        if (successfulMethods.length > 0 && failedMethods.length > 0) {
          // Partial success
          toast.warning(
            `Job status updated! ${successfulMethods.join(' and ')} sent successfully, but ${failedMethods.join(' and ')} failed.`
          );
        } else if (failedMethods.length === attemptedMethods.length) {
          // All notifications failed
          toast.error(
            `Job status updated, but all notifications failed. Please contact the worker manually.`
          );
        } else {
          // All succeeded (shouldn't reach here if errors exist, but just in case)
          const methods = successfulMethods.join(' and ');
          toast.success(`Job notification sent successfully via ${methods}!`);
        }
      } else {
        // All notifications succeeded
        const notificationMethods = [];
        if (sendEmail && notifications?.emailSent) notificationMethods.push('email');
        if (sendSMS && notifications?.smsSent) notificationMethods.push('SMS');
        
        if (notificationMethods.length > 0) {
          toast.success(`Job notification sent successfully via ${notificationMethods.join(' and ')}!`);
        } else {
          toast.success('Job status updated successfully!');
        }
      }
      
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update job status.');
    } finally {
      setIsLoading(false);
    }
  }, [jobId, workerId, data.workers, onClose, queryClient, sendEmail, sendSMS]);

  // Find the specific worker
  const worker = data?.workers?.find((w: IJobWorker) => w.id === workerId);
  const vehicle = data?.vehicles?.find((v: any) => v?.operator?.id === workerId);

  if (!worker) {
    return null;
  }

  const positionLabel =
    JOB_POSITION_OPTIONS.find((opt) => opt.value === worker?.position)?.label || worker?.position;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Job Notification</DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Worker Details
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2">Position: {positionLabel}</Typography>
              <Typography variant="body2">
                Employee: {worker?.first_name} {worker?.last_name}
              </Typography>
              {vehicle && (
                <>
                  <Typography variant="body2">
                    Vehicle Type: {formatVehicleType(vehicle?.type)}
                  </Typography>
                  <Typography variant="body2">
                    Vehicle: {vehicle?.license_plate} - {vehicle?.unit_number}
                  </Typography>
                </>
              )}
              <Typography variant="body2">
                Start Time: {fDate(worker?.start_time)} {fTime(worker?.start_time)}
              </Typography>
              <Typography variant="body2">
                End Time: {fDate(worker?.end_time)} {fTime(worker?.end_time)}
              </Typography>
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Notification Methods
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select how you want to notify the employee about this job assignment:
            </Typography>
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    color="primary"
                    disabled={isLoading}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      📧 Email Notification
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Send detailed job information via email
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={sendSMS}
                    onChange={(e) => setSendSMS(e.target.checked)}
                    color="primary"
                    disabled={isLoading}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      📱 SMS Notification
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Send quick job summary via text message
                    </Typography>
                  </Box>
                }
              />
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined" color="inherit" disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleNotify}
          disabled={isLoading || (!sendEmail && !sendSMS)}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isLoading ? 'Sending...' : 'Send Notification'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
