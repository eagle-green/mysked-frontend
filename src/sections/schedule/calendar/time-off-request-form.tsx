import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useEffect, useCallback } from 'react';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

import type { TimeOffRequest } from 'src/types/timeOff';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import AlertTitle from '@mui/material/AlertTitle';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { generateDisabledDates } from 'src/utils/time-off-utils';

import { useGetUserJobDates } from 'src/actions/job';
import {
  useGetTimeOffRequests,
  useCreateTimeOffRequest,
  useCheckTimeOffConflict,
} from 'src/actions/timeOff';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';

import { TIME_OFF_TYPES } from 'src/types/timeOff';

// ----------------------------------------------------------------------

const TimeOffRequestSchema = z
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
      path: ['start_date'], // This will show the error on the start_date field
    }
  );

type TimeOffRequestSchemaType = z.infer<typeof TimeOffRequestSchema>;

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  selectedDate?: string;
  selectedDateRange?: { start: string; end: string } | null;
};

export function TimeOffRequestForm({ open, onClose, selectedDate, selectedDateRange }: Props) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const createTimeOffRequest = useCreateTimeOffRequest();
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

  const methods = useForm<TimeOffRequestSchemaType>({
    mode: 'all',
    resolver: zodResolver(TimeOffRequestSchema),
    defaultValues: {
      type: 'day_off',
      start_date:
        selectedDateRange?.start || selectedDate || dayjs().add(14, 'day').format('YYYY-MM-DD'),
      end_date: selectedDateRange?.end || selectedDate || dayjs().add(14, 'day').format('YYYY-MM-DD'),
      reason: '',
    },
  });

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = methods;

  const values = watch();

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
        // Keep the same end date but change it to match start date
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
    try {
      // Check for conflicts before submitting
      const conflictResult = await checkTimeOffConflict.mutateAsync({
        startDate: data.start_date,
        endDate: data.end_date,
      });

      if (conflictResult.hasConflict) {
        // Show error dialog instead of toast
        setConflictError({
          open: true,
          title: 'Time-Off Request Conflict',
          message: 'This date is full for time-off requests. Please choose a different date.',
          overlapPercentage: conflictResult.overlapPercentage,
        });
        return;
      }

      await createTimeOffRequest.mutateAsync(data);
      toast.success('Time-off request submitted successfully!');
      // Invalidate calendar queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['worker-calendar-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      onClose();
      methods.reset();
      setHasManuallyChangedEndDate(false);
      setPrevStartDate(null);
    } catch (error: any) {
      console.error('Error submitting time-off request:', error);

      // Handle conflict error specifically
      if (error?.response?.data?.error?.includes('time-off request for this date range')) {
        toast.error(
          'You already have a time-off request for this date range. Please choose different dates.'
        );
      } else {
        toast.error('Failed to submit time-off request. Please try again.');
      }
    }
  });

  const handleClose = useCallback(() => {
    onClose();
    methods.reset();
    setHasManuallyChangedEndDate(false);
    setPrevStartDate(null);
  }, [onClose, methods]);

  const handleCloseErrorDialog = useCallback(() => {
    setConflictError((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <>
      <Dialog
        fullWidth
        maxWidth="sm"
        open={open}
        onClose={handleClose}
        transitionDuration={{
          enter: theme.transitions.duration.shortest,
          exit: theme.transitions.duration.shortest - 80,
        }}
      >
        <DialogTitle>Request Time Off</DialogTitle>

        <Form methods={methods} onSubmit={onSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={3}>
              <Controller
                name="type"
                control={methods.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Type of Request"
                    error={!!errors.type}
                    helperText={errors.type?.message}
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
                  </TextField>
                )}
              />

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
                  inputAdornment: {
                    position: 'end',
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
                  const disabledDates = generateDisabledDates(userTimeOffRequests, jobAssignments);
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
                  inputAdornment: {
                    position: 'end',
                  },
                }}
                minDate={values.start_date ? dayjs(values.start_date) : dayjs.tz(dayjs(), 'America/Vancouver').add(14, 'day').startOf('day')}
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
                  const disabledDates = generateDisabledDates(userTimeOffRequests, jobAssignments);
                  return disabledDates.some((disabledDate) => date.isSame(disabledDate, 'day'));
                }}
              />

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
            <Button variant="outlined" color="inherit" onClick={handleClose}>
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Submit Request
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
