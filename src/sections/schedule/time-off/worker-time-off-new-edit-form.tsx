import { z } from 'zod';
import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDate } from 'src/utils/format-time';
import { generateDisabledDates } from 'src/utils/time-off-utils';

import { useGetUserJobDates } from 'src/actions/job';
import { useGetUserTimeOffDates, useCreateTimeOffRequest, useUpdateTimeOffRequest, useCheckTimeOffConflict } from 'src/actions/timeOff';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

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

      // Check if start date is not in the past
      if (startDate < today) {
        return false;
      }

      // Check if end date is not before start date
      return endDate >= startDate;
    },
    {
      message: 'Start date cannot be in the past and end date must be on or after start date',
      path: ['start_date'],
    }
  );

type TimeOffRequestSchemaType = z.infer<typeof TimeOffRequestSchema>;

// ----------------------------------------------------------------------

type Props = {
  currentTimeOff?: any;
  isEdit?: boolean;
};

export function WorkerTimeOffNewEditForm({ currentTimeOff, isEdit = false }: Props) {
  const router = useRouter();
  const createTimeOffRequest = useCreateTimeOffRequest();
  const updateTimeOffRequest = useUpdateTimeOffRequest();
  const checkTimeOffConflict = useCheckTimeOffConflict();
  const { data: timeOffRequests = [] } = useGetUserTimeOffDates();
  const { data: jobAssignments = [] } = useGetUserJobDates();

  const [hasManuallyChangedEndDate, setHasManuallyChangedEndDate] = useState(false);
  const [prevStartDate, setPrevStartDate] = useState<string | null>(null);

  const methods = useForm<TimeOffRequestSchemaType>({
    mode: 'all',
    resolver: zodResolver(TimeOffRequestSchema),
    defaultValues: {
      type: 'day_off',
      start_date: fDate(new Date()),
      end_date: fDate(new Date()),
      reason: '',
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

  // Load data into form when editing
  useEffect(() => {
    if (isEdit && currentTimeOff) {
      reset({
        type: currentTimeOff.type,
        start_date: fDate(currentTimeOff.start_date),
        end_date: fDate(currentTimeOff.end_date),
        reason: currentTimeOff.reason,
      });
    }
  }, [isEdit, currentTimeOff, reset]);

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
    try {
      // Check for conflicts before submitting
      const conflictResult = await checkTimeOffConflict.mutateAsync({
        startDate: data.start_date,
        endDate: data.end_date,
        excludeId: isEdit ? currentTimeOff?.id : undefined,
      });

      if (conflictResult.hasConflict) {
        toast.error('You already have a time-off request for this date range. Please choose different dates.');
        return;
      }

      if (isEdit && currentTimeOff?.id) {
        await updateTimeOffRequest.mutateAsync({ id: currentTimeOff.id, data });
        toast.success('Time-off request updated successfully!');
      } else {
        await createTimeOffRequest.mutateAsync(data);
        toast.success('Time-off request submitted successfully!');
      }
      router.push(paths.schedule.timeOff.list);
    } catch (error: any) {
      console.error('Error submitting time-off request:', error);
      
      // Handle conflict error specifically
      if (error?.response?.data?.error?.includes('time-off request for this date range')) {
        toast.error('You already have a time-off request for this date range. Please choose different dates.');
      } else {
        toast.error(
          isEdit
            ? 'Failed to update time-off request. Please try again.'
            : 'Failed to submit time-off request. Please try again.'
        );
      }
    }
  });

  const handleCancel = useCallback(() => {
    router.push(paths.schedule.timeOff.list);
  }, [router]);

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3 }}>
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
              minDate={dayjs()}
              shouldDisableDate={(date) => {
                const disabledDates = generateDisabledDates(timeOffRequests, jobAssignments, isEdit ? currentTimeOff?.id : undefined);
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
              minDate={values.start_date ? dayjs(values.start_date) : dayjs()}
              onChange={(date) => {
                if (date) {
                  setValue('end_date', fDate(date));
                  // Mark that user has manually changed end date
                  setHasManuallyChangedEndDate(true);
                }
              }}
              shouldDisableDate={(date) => {
                const disabledDates = generateDisabledDates(timeOffRequests, jobAssignments, isEdit ? currentTimeOff?.id : undefined);
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

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="outlined" color="inherit" onClick={handleCancel}>
              Cancel
            </Button>

            <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
              {isEdit ? 'Update Request' : 'Submit Request'}
            </LoadingButton>
          </Stack>
        </Stack>
      </Card>
    </Form>
  );
}