import type { IJobWorker } from 'src/types/job';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

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
  const handleNotify = useCallback(async () => {
    try {
      // Find the specific worker
      const worker = data.workers.find((w: IJobWorker) => w.id === workerId);
      if (!worker) {
        throw new Error('Worker not found');
      }

      // Update worker status to pending - this will automatically update job status
      await fetcher([
        `${endpoints.work.job}/${jobId}/worker/${workerId}/response`,
        {
          method: 'PUT',
          data: { status: 'pending' },
        },
      ]);

      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job notification sent successfully!');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to send job notification.');
    }
  }, [jobId, workerId, data.workers, onClose, queryClient]);

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
        <Stack spacing={2}>
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
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Cancel
        </Button>
        <Button variant="contained" onClick={handleNotify}>
          Send Notification
        </Button>
      </DialogActions>
    </Dialog>
  );
}
