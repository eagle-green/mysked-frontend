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

  // ✅ Set default start_time and end_time only if they don't exist
  useEffect(() => {
    const currentStartTime = getValues('start_date_time');

    if (!currentStartTime) {
      const startAt8AM = dayjs().add(1, 'day').hour(8).minute(0).second(0).millisecond(0).toISOString();
      setValue('start_date_time', startAt8AM);
      setValue('end_date_time', dayjs(startAt8AM).add(8, 'hour').toISOString());
    }
  }, [getValues, setValue]);

  // Auto-sync end date when start date changes (keep same time)
  useEffect(() => {
    if (startTime && endTime) {
      const start = dayjs(startTime);
      const end = dayjs(endTime);
      
      // If only the date part changed (not the time), update end date to match
      const startDate = start.format('YYYY-MM-DD');
      const endDate = end.format('YYYY-MM-DD');
      const endTimeOnly = end.format('HH:mm:ss');
      
      if (startDate !== endDate) {
        // Keep the same end time but change the date to match start date
        const newEndDateTime = dayjs(startDate + ' ' + endTimeOnly);
        setValue('end_date_time', newEndDateTime.toISOString());
      }
    }
  }, [startTime, endTime, setValue]);

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
