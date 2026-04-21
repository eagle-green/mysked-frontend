import type { InputHTMLAttributes } from 'react';
import type { TextFieldProps } from '@mui/material/TextField';

import { Controller, useFormContext } from 'react-hook-form';
import { transformValue, transformValueOnBlur, transformValueOnChange } from 'minimal-shared/utils';

import TextField from '@mui/material/TextField';

import { formatCanadianPostalCodeInput } from 'src/utils/format-canadian-postal-code';

// ----------------------------------------------------------------------

/** Hourly rate style: digits and at most one decimal point (e.g. 21.5). */
function sanitizeHourlyDecimalInput(raw: string): string {
  let out = '';
  let hasDot = false;
  for (const ch of raw) {
    if (ch >= '0' && ch <= '9') {
      out += ch;
    } else if (ch === '.' && !hasDot) {
      hasDot = true;
      out += '.';
    }
  }
  return out;
}

function finalizeHourlyDecimalOnBlur(raw: string): string {
  if (raw === '' || raw === '.') return '';
  if (raw.endsWith('.')) return raw.slice(0, -1);
  return raw;
}

export type RHFTextFieldProps = TextFieldProps & {
  name: string;
  /** Canadian postal code: uppercase, auto `A1A 1A1` spacing, max length once complete. */
  canadianPostalCode?: boolean;
  /** Only allow digits 0–9; use with `slotProps.htmlInput.maxLength` for transit/account etc. */
  digitsOnly?: boolean;
  /** Hourly rate: only `0-9` and one `.` (e.g. 21.5). */
  hourlyDecimal?: boolean;
};

export function RHFTextField({
  name,
  helperText,
  slotProps,
  type = 'text',
  canadianPostalCode,
  digitsOnly,
  hourlyDecimal,
  ...other
}: RHFTextFieldProps) {
  const { control } = useFormContext();

  const isNumberType = type === 'number' && !canadianPostalCode && !hourlyDecimal;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const htmlInputProps = slotProps?.htmlInput as InputHTMLAttributes<HTMLInputElement> | undefined;
        const digitsMaxLength =
          digitsOnly && typeof htmlInputProps?.maxLength === 'number'
            ? htmlInputProps.maxLength
            : undefined;

        const displayValue = (() => {
          if (canadianPostalCode) return field.value ?? '';
          if (hourlyDecimal) {
            const v = field.value;
            if (v === null || v === undefined || v === '') return '';
            return String(v);
          }
          if (isNumberType) return transformValue(field.value ?? '');
          return field.value ?? '';
        })();

        return (
        <TextField
          {...field}
          fullWidth
          value={displayValue}
          onChange={(event) => {
            if (canadianPostalCode) {
              field.onChange(formatCanadianPostalCodeInput(event.target.value));
              return;
            }
            if (hourlyDecimal) {
              field.onChange(sanitizeHourlyDecimalInput(event.target.value));
              return;
            }
            if (digitsOnly) {
              let v = event.target.value.replace(/\D/g, '');
              if (digitsMaxLength != null) v = v.slice(0, digitsMaxLength);
              field.onChange(v);
              return;
            }
            const transformedValue = isNumberType
              ? transformValueOnChange(event.target.value)
              : event.target.value;

            field.onChange(transformedValue);
          }}
          onBlur={(event) => {
            if (canadianPostalCode) {
              field.onChange(formatCanadianPostalCodeInput(event.target.value));
              field.onBlur();
              return;
            }
            if (hourlyDecimal) {
              field.onChange(finalizeHourlyDecimalOnBlur(sanitizeHourlyDecimalInput(event.target.value)));
              field.onBlur();
              return;
            }
            if (digitsOnly) {
              let v = event.target.value.replace(/\D/g, '');
              if (digitsMaxLength != null) v = v.slice(0, digitsMaxLength);
              field.onChange(v);
              field.onBlur();
              return;
            }
            const transformedValue = isNumberType
              ? transformValueOnBlur(event.target.value)
              : event.target.value;

            field.onChange(transformedValue);
            field.onBlur();
          }}
          type={isNumberType ? 'text' : type}
          error={!!error}
          helperText={error?.message ?? helperText}
          slotProps={{
            ...slotProps,
            htmlInput: {
              autoComplete: 'off',
              ...slotProps?.htmlInput,
              ...(canadianPostalCode && { maxLength: 7 }),
              ...(isNumberType && { inputMode: 'decimal', pattern: '[0-9]*\\.?[0-9]*' }),
              ...(hourlyDecimal && { inputMode: 'decimal', pattern: '[0-9]*\\.?[0-9]*' }),
              ...(digitsOnly && {
                inputMode: 'numeric',
                pattern: '[0-9]*',
              }),
            },
          }}
          {...other}
        />
        );
      }}
    />
  );
}
