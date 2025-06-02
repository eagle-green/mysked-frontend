import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';

import { JOB_STATUS_OPTIONS } from 'src/assets/data/job';

import { Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export function JobNewEditStatusDate() {
  const { watch, setValue } = useFormContext();
  const startTime = watch('start_time');
  const endTime = watch('end_time');

  const [shiftHour, setShiftHour] = useState<number | string>('');

  // ✅ Set default start_time and end_time on initial load
  useEffect(() => {
    if (!startTime) {
      const startAt8AM = dayjs().hour(8).minute(0).second(0).millisecond(0).toISOString();
      setValue('start_time', startAt8AM);
      setValue('end_time', dayjs(startAt8AM).add(8, 'hour').toISOString());
    }
  }, [startTime, setValue]);

  // Only set end_time to 8 hours after start_time if end_time is not set yet
  useEffect(() => {
    if (startTime && !endTime) {
      const newEndTime = dayjs(startTime).add(8, 'hour').toISOString();
      setValue('end_time', newEndTime);
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
      <Field.Select
        fullWidth
        name="status"
        label="Status"
        slotProps={{ inputLabel: { shrink: true } }}
        disabled
      >
        {JOB_STATUS_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value} sx={{ textTransform: 'capitalize' }}>
            {option.label}
          </MenuItem>
        ))}
      </Field.Select>

      <Field.MobileDateTimePicker name="start_time" label="Start Date/Time" />
      <Field.MobileDateTimePicker name="end_time" label="End Date/Time" />

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
