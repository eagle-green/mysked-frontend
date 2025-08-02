// src/components/date-range-picker/DateRangePicker.tsx
import React from 'react';
import { Stack, TextField } from '@mui/material';

type DateRangeValue = [string, string]; // force both to be strings
type Props = {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
};

export default function DateRangePicker({ value, onChange }: Props) {
  const handleChange = (index: number, val: string) => {
    const newRange: DateRangeValue = [...value] as DateRangeValue;
    newRange[index] = val;
    onChange(newRange);
  };

  return (
    <Stack direction="row" spacing={2}>
      <TextField
        type="date"
        label="Start Date"
        InputLabelProps={{ shrink: true }}
        value={value[0]}
        onChange={(e) => handleChange(0, e.target.value)}
      />
      <TextField
        type="date"
        label="End Date"
        InputLabelProps={{ shrink: true }}
        value={value[1]}
        onChange={(e) => handleChange(1, e.target.value)}
      />
    </Stack>
  );
}
