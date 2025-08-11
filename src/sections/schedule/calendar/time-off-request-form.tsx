import { z } from 'zod';
import dayjs from 'dayjs';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { fDate } from 'src/utils/format-time';
import { generateDisabledDates } from 'src/utils/time-off-utils';

import { useGetUserJobDates } from 'src/actions/job';
import { useGetUserTimeOffDates, useCreateTimeOffRequest, useCheckTimeOffConflict } from 'src/actions/timeOff';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { TIME_OFF_TYPES } from 'src/types/timeOff';

// ----------------------------------------------------------------------

const TimeOffRequestSchema = z.object({
  type: z.enum(['vacation', 'day_off', 'sick_leave', 'personal_leave']),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  reason: z
    .string()
    .min(1, 'Reason is required')
    .max(500, 'Reason must be less than 500 characters'),
}).refine((data) => {
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
}, {
  message: "Start date must be at least 2 weeks in advance and end date must be on or after start date",
  path: ["start_date"], // This will show the error on the start_date field
});

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
  const createTimeOffRequest = useCreateTimeOffRequest();
  const checkTimeOffConflict = useCheckTimeOffConflict();
  const { data: timeOffRequests = [] } = useGetUserTimeOffDates();
  const { data: jobAssignments = [] } = useGetUserJobDates();

  const methods = useForm<TimeOffRequestSchemaType>({
    mode: 'all',
    resolver: zodResolver(TimeOffRequestSchema),
    defaultValues: {
      type: 'day_off',
      start_date: selectedDateRange?.start || selectedDate || fDate(dayjs().add(14, 'day').toDate()),
      end_date: selectedDateRange?.end || selectedDate || fDate(dayjs().add(14, 'day').toDate()),
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
  const [hasManuallyChangedEndDate, setHasManuallyChangedEndDate] = useState(false);
  const [prevStartDate, setPrevStartDate] = useState<string | null>(null);

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
        toast.error('You already have a time-off request for this date range. Please choose different dates.');
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
        toast.error('You already have a time-off request for this date range. Please choose different dates.');
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

  return (
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
                  setValue('start_date', fDate(date));
                }
              }}
              minDate={dayjs().add(14, 'day')}
              shouldDisableDate={(date) => {
                // Disable dates that are less than 2 weeks from today
                const twoWeeksFromNow = dayjs().add(14, 'day');
                if (date.isBefore(twoWeeksFromNow, 'day')) {
                  return true;
                }
                
                // Also disable dates from existing time-off requests and job assignments
                const disabledDates = generateDisabledDates(timeOffRequests, jobAssignments);
                const isDisabled = disabledDates.some(disabledDate => date.isSame(disabledDate, 'day'));
                
                return isDisabled;
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
              minDate={values.start_date ? dayjs(values.start_date) : dayjs().add(14, 'day')}
              onChange={(date) => {
                if (date) {
                  setValue('end_date', fDate(date));
                  // Mark that user has manually changed end date
                  setHasManuallyChangedEndDate(true);
                }
              }}
              shouldDisableDate={(date) => {
                // Disable dates that are less than 2 weeks from today
                const twoWeeksFromNow = dayjs().add(14, 'day');
                if (date.isBefore(twoWeeksFromNow, 'day')) {
                  return true;
                }
                
                // Also disable dates from existing time-off requests and job assignments
                const disabledDates = generateDisabledDates(timeOffRequests, jobAssignments);
                const isDisabled = disabledDates.some(disabledDate => date.isSame(disabledDate, 'day'));
                
                return isDisabled;
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

          <Button type="submit" variant="contained" loading={isSubmitting} disabled={isSubmitting}>
            Submit Request
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
