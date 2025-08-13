import * as z from 'zod';
import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { fDate } from 'src/utils/format-time';
import { generateDisabledDates } from 'src/utils/time-off-utils';

import { useGetUserJobDates } from 'src/actions/job';
import { useGetUserTimeOffDates, useUpdateTimeOffRequest, useCheckTimeOffConflict } from 'src/actions/timeOff';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

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
      message: 'Start date must be at least 2 weeks in advance and end date must be on or after start date',
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
  const updateTimeOffRequest = useUpdateTimeOffRequest();
  const checkTimeOffConflict = useCheckTimeOffConflict();
  const { data: timeOffRequests = [] } = useGetUserTimeOffDates();
  const { data: jobAssignments = [] } = useGetUserJobDates();



  const [hasManuallyChangedEndDate, setHasManuallyChangedEndDate] = useState(false);
  const [prevStartDate, setPrevStartDate] = useState<string | null>(null);

  const methods = useForm<TimeOffQuickEditFormData>({
    mode: 'all',
    resolver: zodResolver(TimeOffQuickEditSchema),
    defaultValues: {
      type: currentTimeOff?.type || 'vacation',
      start_date: currentTimeOff?.start_date || fDate(dayjs().add(14, 'day').toDate()),
      end_date: currentTimeOff?.end_date || fDate(dayjs().add(14, 'day').toDate()),
      reason: currentTimeOff?.reason || '',
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
        toast.error('You already have a time-off request for this date range. Please choose different dates.');
        return;
      }

      await updateTimeOffRequest.mutateAsync({
        id: currentTimeOff.id,
        data,
      });
      toast.dismiss(toastId);
      toast.success('Time-off request updated successfully!');
      onUpdateSuccess();
    } catch (error: any) {
      toast.dismiss(toastId);
      console.error(error);
      
      // Handle conflict error specifically
      if (error?.response?.data?.error?.includes('time-off request for this date range')) {
        toast.error('You already have a time-off request for this date range. Please choose different dates.');
      } else {
        toast.error('Failed to update time-off request. Please try again.');
      }
    }
  });

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: { maxWidth: 720 },
        },
      }}
    >
      <DialogTitle>Quick update</DialogTitle>

      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          <Stack spacing={3}>
            <Typography variant="h6">Request Details</Typography>

            <Field.Select name="type" label="Type of Request" InputLabelProps={{ shrink: true }}>
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
                  const disabledDates = generateDisabledDates(timeOffRequests, jobAssignments, currentTimeOff?.id);
                  return disabledDates.some(disabledDate => date.isSame(disabledDate, 'day'));
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
                  const disabledDates = generateDisabledDates(timeOffRequests, jobAssignments, currentTimeOff?.id);
                  return disabledDates.some(disabledDate => date.isSame(disabledDate, 'day'));
                }}
              />
            </Box>

            <Field.Text
              name="reason"
              label="Reason"
              multiline
              rows={4}
              placeholder="Please provide a reason for your time-off request..."
              helperText={`${values.reason?.length || 0}/500 characters`}
            />

            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mb: 3 }}>
              <Button variant="outlined" color="inherit" onClick={onClose}>
                Cancel
              </Button>

                        <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Request'}
          </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Form>
    </Dialog>
  );
}
