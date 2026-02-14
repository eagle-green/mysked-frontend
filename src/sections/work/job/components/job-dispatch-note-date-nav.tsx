import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  selectedDate: Dayjs;
  onDateChange: (date: Dayjs) => void;
};

export function JobDispatchNoteDateNav({ selectedDate, onDateChange }: Props) {
  const handlePreviousDay = () => {
    onDateChange(selectedDate.subtract(1, 'day'));
  };

  const handleNextDay = () => {
    onDateChange(selectedDate.add(1, 'day'));
  };

  const handleToday = () => {
    onDateChange(dayjs());
  };

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <IconButton onClick={handlePreviousDay} size="small">
        <Iconify icon="eva:arrow-ios-back-fill" />
      </IconButton>

      <DatePicker
        value={selectedDate}
        onChange={(newValue) => newValue && onDateChange(newValue)}
        format="YYYY-MM-DD (dddd)"
        slotProps={{
          textField: {
            size: 'small',
            sx: { minWidth: 260 },
          },
        }}
      />

      <IconButton onClick={handleNextDay} size="small">
        <Iconify icon="eva:arrow-ios-forward-fill" />
      </IconButton>

      <Button
        size="small"
        variant="contained"
        onClick={handleToday}
        sx={{ ml: 1 }}
      >
        Today
      </Button>
    </Stack>
  );
}
