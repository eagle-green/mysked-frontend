import { Controller, useFormContext } from 'react-hook-form';

import TextField from '@mui/material/TextField';

import { formatIntegerWithCommasDisplay } from 'src/utils/format-claim-amount-input';

type Props = {
  name: string;
  label: string;
  disabled?: boolean;
};

export function ClaimAmountField({ name, label, disabled }: Props) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name as any}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          label={label}
          fullWidth
          disabled={disabled}
          value={formatIntegerWithCommasDisplay(field.value)}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '');
            field.onChange(digits === '' ? '' : digits);
          }}
          onBlur={field.onBlur}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          inputProps={{ inputMode: 'numeric', autoComplete: 'off' }}
        />
      )}
    />
  );
}
