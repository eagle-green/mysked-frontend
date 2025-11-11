import * as z from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useForm } from 'react-hook-form';
import timezone from 'dayjs/plugin/timezone';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

import type { TimeOffRequest } from 'src/types/timeOff';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import AlertTitle from '@mui/material/AlertTitle';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { generateDisabledDates } from 'src/utils/time-off-utils';

import { useGetUserJobDates } from 'src/actions/job';
import {
  useGetTimeOffRequests,
  useUpdateTimeOffRequest,
  useCheckTimeOffConflict,
} from 'src/actions/timeOff';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';

import { TIME_OFF_TYPES } from 'src/types/timeOff';

// ----------------------------------------------------------------------

const TimeOffQuickEditSchema = z
  .object({
    type: z.enum(['vacation', 'day_off', 'sick_leave', 'personal_leave']),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
    reason: z
      .string()
      .min(1, 'Reason is required')
      .max(500, 'Reason must be less than 500 characters'),
  })
  .refine(
    (data) => {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if start date is at least 2 weeks in the future
      const twoWeeksFromNow = new Date(today);
      twoWeeksFromNow.setDate(today.getDate() + 14);

      if (startDate < twoWeeksFromNow) {
        return false;
      }

      // Check if end date is not before start date
      return endDate >= startDate;
    },
    {
      message:
        'Start date must be at least 2 weeks in advance and end date must be on or after start date',
      path: ['start_date'],
    }
  );

type TimeOffQuickEditFormData = z.infer<typeof TimeOffQuickEditSchema>;

type Props = {
  currentTimeOff: any;
  open: boolean;
  onClose: () => void;
  onUpdateSuccess: () => void;
};

export function WorkerTimeOffQuickEditForm({
  currentTimeOff,
  open,
  onClose,
  onUpdateSuccess,
}: Props) {
  const { user } = useAuthContext();
  const updateTimeOffRequest = useUpdateTimeOffRequest();
  const checkTimeOffConflict = useCheckTimeOffConflict();
  const { timeOffRequests = [] } = useGetTimeOffRequests();
  const { data: jobAssignments = [] } = useGetUserJobDates();
  const userTimeOffRequests = useMemo(
    () =>
      timeOffRequests.filter(
        (request: TimeOffRequest) => request.user_id === user?.id
      ),
    [timeOffRequests, user?.id]
  );

  const [hasManuallyChangedEndDate, setHasManuallyChangedEndDate] = useState(false);
  const [prevStartDate, setPrevStartDate] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState<{
    open: boolean;
    title: string;
    message: string;
    overlapPercentage?: number;
  }>({
    open: false,
    title: '',
    message: '',
  });

  const methods = useForm<TimeOffQuickEditFormData>({
    mode: 'all',
    resolver: zodResolver(TimeOffQuickEditSchema),
    defaultValues: {
      type: currentTimeOff?.type || 'vacation',
      start_date: currentTimeOff?.start_date || dayjs().add(14, 'day').format('YYYY-MM-DD'),
      end_date: currentTimeOff?.end_date || dayjs().add(14, 'day').format('YYYY-MM-DD'),
      reason: currentTimeOff?.reason || '',
    },
  });

  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting, errors },
  } = methods;

  const values = watch();

  // Reset form values when currentTimeOff changes
  useEffect(() => {
    if (currentTimeOff) {
      reset({
        type: currentTimeOff.type,
        start_date: currentTimeOff.start_date,
        end_date: currentTimeOff.end_date,
        reason: currentTimeOff.reason,
      });
    }
  }, [currentTimeOff, reset]);

  // Auto-sync end date when start date changes (but only if user hasn't manually changed end date)
  useEffect(() => {
    if (
      values.start_date &&
      values.end_date &&
      !hasManuallyChangedEndDate &&
      prevStartDate &&
      prevStartDate !== values.start_date
    ) {
      const startDate = dayjs(values.start_date);
      const endDate = dayjs(values.end_date);
      const prevStart = dayjs(prevStartDate);

      // Only sync if the date part changed
      const startDateStr = startDate.format('YYYY-MM-DD');
      const endDateStr = endDate.format('YYYY-MM-DD');
      const prevStartDateStr = prevStart.format('YYYY-MM-DD');

      // Only sync if the start date actually changed from the previous value
      if (startDateStr !== prevStartDateStr && startDateStr !== endDateStr) {
        // Set end date to match start date
        setValue('end_date', values.start_date);
      }
    }
  }, [values.start_date, values.end_date, setValue, hasManuallyChangedEndDate, prevStartDate]);

  // Update previous start date when start date changes
  useEffect(() => {
    if (values.start_date) {
      setPrevStartDate(values.start_date);
    }
  }, [values.start_date]);

  const onSubmit = handleSubmit(async (data) => {
    if (!currentTimeOff?.id) return;

    const toastId = toast.loading('Updating time-off request...');
    try {
      // Check for conflicts before submitting
      const conflictResult = await checkTimeOffConflict.mutateAsync({
        startDate: data.start_date,
        endDate: data.end_date,
        excludeId: currentTimeOff.id,
      });

      if (conflictResult.hasConflict) {
        toast.dismiss(toastId);
        // Show error dialog instead of toast
        setConflictError({
          open: true,
          title: 'Time-Off Request Conflict',
          message: 'This date is full for time-off requests. Please choose a different date.',
          overlapPercentage: conflictResult.overlapPercentage,
        });
        return;
      }

      await updateTimeOffRequest.mutateAsync({
        id: currentTimeOff.id,
        data,
      });
      toast.dismiss(toastId);
      toast.success('Time-off request updated successfully!');
      onUpdateSuccess();
      onClose();
    } catch (error: any) {
      toast.dismiss(toastId);
      console.error(error);

      // Handle conflict error specifically
      if (error?.response?.data?.error?.includes('time-off request for this date range')) {
        toast.error(
          'You already have a time-off request for this date range. Please choose different dates.'
        );
      } else {
        toast.error('Failed to update time-off request. Please try again.');
      }
    }
  });

  const handleCloseErrorDialog = useCallback(() => {
    setConflictError((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <>
      <Dialog
        fullWidth
        maxWidth={false}
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            maxWidth: 800,
          },
        }}
      >
        <DialogTitle>Quick Edit Time-Off Request</DialogTitle>

        <Form methods={methods} onSubmit={onSubmit}>
          <DialogContent>
            <Stack spacing={3}>
              <Field.Select
                name="type"
                label="Type of Request"
                InputLabelProps={{ shrink: true }}
                sx={{ marginTop: 3 }}
              >
                {TIME_OFF_TYPES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: option.color,
                        }}
                      />
                      {option.label}
                    </Box>
                  </MenuItem>
                ))}
              </Field.Select>

              {/* Role-Based Overlap Information */}
              {/* <Box
                sx={{
                  p: 2,
                  bgcolor: 'background.neutral',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  <strong>Note:</strong> You can have up to 10% overlap with other employees who have
                  the same role as you.
                </Typography>
              </Box> */}

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Field.DatePicker
                  name="start_date"
                  label="Start Date"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!errors.start_date,
                      helperText: errors.start_date?.message,
                    },
                  }}
                  onChange={(date) => {
                    if (date) {
                      // Format as UTC to get pure calendar date (not timezone-dependent)
                      setValue('start_date', date.utc().format('YYYY-MM-DD'));
                    }
                  }}
                  minDate={dayjs.tz(dayjs(), 'America/Vancouver').add(14, 'day').startOf('day')}
                  disablePast
                  shouldDisableDate={(date) => {
                    // Only handle conflicts with existing requests/jobs
                    // The minDate and disablePast should handle the 2-week restriction
                  const disabledDates = generateDisabledDates(
                    userTimeOffRequests,
                      jobAssignments,
                      currentTimeOff?.id
                    );
                    return disabledDates.some((disabledDate) => date.isSame(disabledDate, 'day'));
                  }}
                />

                <Field.DatePicker
                  name="end_date"
                  label="End Date"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!errors.end_date,
                      helperText: errors.end_date?.message,
                    },
                  }}
                  minDate={
                    values.start_date
                      ? dayjs(values.start_date)
                      : dayjs.tz(dayjs(), 'America/Vancouver').add(14, 'day').startOf('day')
                  }
                  disablePast
                  onChange={(date) => {
                    if (date) {
                      // Format as UTC to get pure calendar date (not timezone-dependent)
                      setValue('end_date', date.utc().format('YYYY-MM-DD'));
                      // Mark that user has manually changed end date
                      setHasManuallyChangedEndDate(true);
                    }
                  }}
                  shouldDisableDate={(date) => {
                    // Only handle conflicts with existing requests/jobs
                    // The minDate and disablePast should handle the 2-week restriction
                  const disabledDates = generateDisabledDates(
                    userTimeOffRequests,
                      jobAssignments,
                      currentTimeOff?.id
                    );
                    return disabledDates.some((disabledDate) => date.isSame(disabledDate, 'day'));
                  }}
                />
              </Box>

              <Field.Text
                name="reason"
                label="Reason"
                multiline
                rows={4}
                placeholder="Please provide a reason for your time-off request..."
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 3 }}>
            <Button variant="outlined" color="inherit" onClick={onClose}>
              Cancel
            </Button>

            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Request'}
            </Button>
          </DialogActions>
        </Form>
      </Dialog>

      {/* Conflict Error Dialog */}
      <Dialog open={conflictError.open} onClose={handleCloseErrorDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Alert severity="error" sx={{ mb: 0 }}>
            <AlertTitle>{conflictError.title}</AlertTitle>
          </Alert>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {conflictError.message}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Please adjust your time-off request dates to reduce the overlap or choose different
            dates.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button variant="contained" onClick={handleCloseErrorDialog}>
            OK, I Understand
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
