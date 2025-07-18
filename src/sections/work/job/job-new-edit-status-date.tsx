import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';

import { Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export function JobNewEditStatusDate() {
  const { watch, setValue, getValues } = useFormContext();
  const startTime = watch('start_date_time');
  const endTime = watch('end_date_time');

  const [shiftHour, setShiftHour] = useState<number | string>('');
  const [hasManuallyChangedEndDate, setHasManuallyChangedEndDate] = useState(false);
  const [prevStartTime, setPrevStartTime] = useState<string | null>(null);

  // ✅ Set default start_time and end_time only if they don't exist
  useEffect(() => {
    const currentStartTime = getValues('start_date_time');

    if (!currentStartTime) {
      const startAt8AM = dayjs()
        .add(1, 'day')
        .hour(8)
        .minute(0)
        .second(0)
        .millisecond(0)
        .toISOString();
      setValue('start_date_time', startAt8AM);
      setValue('end_date_time', dayjs(startAt8AM).add(8, 'hour').toISOString());
    }
  }, [getValues, setValue]);

  // Auto-sync end date when start date changes (keep same time) - but only if user hasn't manually changed end date
  // AND only if this is an actual user change (not form reset)
  useEffect(() => {
    if (
      startTime &&
      endTime &&
      !hasManuallyChangedEndDate &&
      prevStartTime &&
      prevStartTime !== startTime
    ) {
      const start = dayjs(startTime);
      const end = dayjs(endTime);
      const prevStart = dayjs(prevStartTime);

      // Only sync if the date part changed (not the time)
      const startDate = start.format('YYYY-MM-DD');
      const endDate = end.format('YYYY-MM-DD');
      const prevStartDate = prevStart.format('YYYY-MM-DD');
      const endTimeOnly = end.format('HH:mm:ss');

      // Only sync if the start date actually changed from the previous value
      if (startDate !== prevStartDate && startDate !== endDate) {
        // Keep the same end time but change the date to match start date
        const newEndDateTime = dayjs(startDate + ' ' + endTimeOnly);
        setValue('end_date_time', newEndDateTime.toISOString());
      }
    }
  }, [startTime, endTime, setValue, hasManuallyChangedEndDate, prevStartTime]);

  // Only set end_time to 8 hours after start_time if end_time is not set yet
  useEffect(() => {
    if (startTime && !endTime) {
      const newEndTime = dayjs(startTime).add(8, 'hour').toISOString();
      setValue('end_date_time', newEndTime);
    }
  }, [startTime, endTime, setValue]);

  // ✅ Calculate shift duration
  useEffect(() => {
    if (startTime && endTime) {
      const start = dayjs(startTime);
      const end = dayjs(endTime);
      const hours = end.diff(start, 'minute') / 60;
      setShiftHour(hours.toFixed(2));
    } else {
      setShiftHour('');
    }
  }, [startTime, endTime]);

  useEffect(() => {
    const startDate = getValues('start_date_time');
    const endDate = getValues('end_date_time');

    if (startDate && endDate) {
      setValue('start_date_time', startDate);
      setValue('end_date_time', endDate);
    }
  }, [getValues, setValue]);

  // Update previous start time when start time changes
  useEffect(() => {
    if (startTime) {
      setPrevStartTime(startTime);
    }
  }, [startTime]);

  // Reset manual change flag only for completely new jobs
  useEffect(() => {
    const currentStartTime = getValues('start_date_time');
    const currentEndTime = getValues('end_date_time');

    // Only reset the flag if both times are empty (new job)
    if (!currentStartTime && !currentEndTime) {
      setHasManuallyChangedEndDate(false);
      setPrevStartTime(null);
    }
  }, [getValues]);

  return (
    <Box
      sx={{
        p: 3,
        gap: 2,
        display: 'flex',
        bgcolor: 'background.neutral',
        flexDirection: { xs: 'column', sm: 'row' },
      }}
    >
      <Field.Text
        fullWidth
        name="po_number"
        label="PO #"
        placeholder="Enter Purchase Order Number"
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Field.MobileDateTimePicker
        name="start_date_time"
        label="Start Date/Time"
        value={startTime ? dayjs(startTime) : null}
      />
      <Field.MobileDateTimePicker
        name="end_date_time"
        label="End Date/Time"
        value={endTime ? dayjs(endTime) : null}
        shouldDisableDate={(date) => {
          // Disable dates before the start date
          if (startTime) {
            const startDate = dayjs(startTime).startOf('day');
            return date.isBefore(startDate);
          }
          return false;
        }}
        shouldDisableTime={(value, view) => {
          if (view === 'hours' || view === 'minutes') {
            // Disable times on the start date that are before the start time
            if (startTime) {
              const startDateTime = dayjs(startTime);
              const selectedDate = dayjs(value).startOf('day');
              const startDate = startDateTime.startOf('day');

              // If it's the same day as start date, disable times before start time
              if (selectedDate.isSame(startDate)) {
                const startTimeOnly = startDateTime.format('HH:mm');
                const selectedTimeOnly = dayjs(value).format('HH:mm');
                return selectedTimeOnly < startTimeOnly;
              }
            }
          }
          return false;
        }}
                onChange={(newValue) => {
          if (newValue) {
            const startTimeValue = getValues('start_date_time');
            if (startTimeValue) {
              const startDateTime = dayjs(startTimeValue);
              const endDateTime = dayjs(newValue);
              
              // Check if this would result in a negative duration (overnight shift)
              const duration = endDateTime.diff(startDateTime, 'hour');
              
              if (duration < 0) {
                // This is an overnight shift, add one day to the end time
                const adjustedEndTime = endDateTime.add(1, 'day');
                setValue('end_date_time', adjustedEndTime.toISOString());
              } else {
                setValue('end_date_time', newValue.toISOString());
              }
            } else {
              setValue('end_date_time', newValue.toISOString());
            }
            
            // Mark that user has manually changed the end date
            setHasManuallyChangedEndDate(true);
          }
        }}
      />

      <Field.Text
        disabled
        name="shift_hour"
        label="Shift Duration (Hours)"
        value={shiftHour}
        sx={{
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
          },
        }}
      />
    </Box>
  );
}
