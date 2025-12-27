import type { Dayjs } from 'dayjs';
import type { TextFieldProps } from '@mui/material/TextField';
import type { DatePickerProps } from '@mui/x-date-pickers/DatePicker';
import type { TimePickerProps } from '@mui/x-date-pickers/TimePicker';
import type { DateTimePickerProps } from '@mui/x-date-pickers/DateTimePicker';
import type { MobileDateTimePickerProps } from '@mui/x-date-pickers/MobileDateTimePicker';

import dayjs from 'dayjs';
import { Controller, useFormContext } from 'react-hook-form';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker';

import { formatPatterns } from 'src/utils/format-time';

// ----------------------------------------------------------------------

type RHFDatePickerProps = DatePickerProps<Dayjs> & {
  name: string;
};

export function RHFDatePicker({ name, slotProps, ...other }: RHFDatePickerProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        // Parse date value - handle various formats
        const parseValue = (value: any): Dayjs | null => {
          if (!value) return null;
          
          // If it's already a dayjs object, return as-is
          if (dayjs.isDayjs(value)) return value;
          
          // If it's a string in YYYY-MM-DD format, parse it as local date
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
            const [year, month, day] = value.trim().split('-').map(Number);
            // Create date in local timezone (month is 0-indexed)
            return dayjs(new Date(year, month - 1, day));
          }
          
          // Handle date strings like "Sun Nov 30 2025 00:00:00 GM" or "Sun Nov 30 2025 00:00:00 GMT"
          if (typeof value === 'string' && /^[A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{1,2}\s+\d{4}/.test(value.trim())) {
            const dateMatch = value.trim().match(/^([A-Za-z]{3})\s+([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})/);
            if (dateMatch) {
              const [, , monthName, day, year] = dateMatch;
              const monthMap: Record<string, number> = {
                'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
              };
              const month = monthMap[monthName] ?? 0;
              return dayjs(new Date(Number(year), month, Number(day)));
            }
          }
          
          // For Date objects or other formats, parse normally
          const parsed = dayjs(value);
          return parsed.isValid() ? parsed : null;
        };

        return (
          <DatePicker
            {...field}
            value={parseValue(field.value)}
            onChange={(newValue) => {
              if (!newValue) {
                field.onChange(null);
              } else {
                // Extract date components directly from the picker value
                // This bypasses any timezone offset issues
                const year = newValue.year();
                const month = newValue.month() + 1; // dayjs month is 0-indexed
                const day = newValue.date();
                
                // Format as YYYY-MM-DD
                const formatted = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                field.onChange(formatted);
              }
            }}
            format={formatPatterns.split.date}
            slotProps={{
              ...slotProps,
              textField: {
                fullWidth: true,
                error: !!error,
                helperText: error?.message ?? (slotProps?.textField as TextFieldProps)?.helperText,
                ...slotProps?.textField,
              },
            }}
            {...other}
          />
        );
      }}
    />
  );
}

// ----------------------------------------------------------------------

type RHFDateTimePickerProps = DateTimePickerProps<Dayjs> & {
  name: string;
};

export function RHFDateTimePicker({ name, slotProps, ...other }: RHFDateTimePickerProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <DateTimePicker
          {...field}
          value={dayjs(field.value)}
          onChange={(newValue) => field.onChange(dayjs(newValue).format())}
          format={formatPatterns.split.dateTime}
          slotProps={{
            ...slotProps,
            textField: {
              fullWidth: true,
              error: !!error,
              helperText: error?.message ?? (slotProps?.textField as TextFieldProps)?.helperText,
              ...slotProps?.textField,
            },
          }}
          {...other}
        />
      )}
    />
  );
}

// ----------------------------------------------------------------------

type RHFMobileDateTimePickerProps = MobileDateTimePickerProps<Dayjs> & {
  name: string;
};

export function RHFMobileDateTimePicker({
  name,
  slotProps,
  ...other
}: RHFMobileDateTimePickerProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <MobileDateTimePicker
          {...field}
          value={dayjs(field.value)}
          onChange={(newValue) => field.onChange(dayjs(newValue).format())}
          format={formatPatterns.split.dateTime}
          slotProps={{
            textField: {
              fullWidth: true,
              error: !!error,
              helperText: error?.message ?? (slotProps?.textField as TextFieldProps)?.helperText,
              ...slotProps?.textField,
            },
            ...slotProps,
          }}
          {...other}
        />
      )}
    />
  );
}

// ----------------------------------------------------------------------

type RHFTimePickerProps = TimePickerProps<Dayjs> & {
  name: string;
};

export function RHFTimePicker({ name, slotProps, ...other }: RHFTimePickerProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TimePicker
          {...field}
          value={dayjs(field.value)}
          onChange={(newValue) => field.onChange(dayjs(newValue).format())}
          format="hh:mm A"
          slotProps={{
            textField: {
              fullWidth: true,
              error: !!error,
              helperText: error?.message ?? (slotProps?.textField as TextFieldProps)?.helperText,
              ...slotProps?.textField,
            },
            ...slotProps,
          }}
          {...other}
        />
      )}
    />
  );
}
