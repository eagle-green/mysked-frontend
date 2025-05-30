import { Controller, useFormContext } from 'react-hook-form';

import { CountrySelect } from '../country-select';

import type { CountrySelectProps } from '../country-select';

// ----------------------------------------------------------------------

export type RHFCountrySelectProps = CountrySelectProps & {
  name: string;
};

export function RHFCountrySelect({ name, helperText, ...other }: RHFCountrySelectProps) {
  const { control, setValue } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <CountrySelect
          id={`${name}-rhf-country-select`}
          value={field.value}
          onChange={(event, newValue) => setValue(name, newValue, { shouldValidate: true })}
          error={!!error}
          helperText={error?.message ?? helperText}
          {...other}
        />
      )}
    />
  );
}

// export function RHFCountrySelect({ name, helperText, ...other }: RHFCountrySelectProps) {
//   const { control, setValue } = useFormContext();

//   return (
//     <Controller
//       name={name}
//       control={control}
//       render={({ field, fieldState: { error } }) => {
//         const value = field.value || 'Canada'; // Default to 'Canada' if no value
//         // Force-set default if undefined
//         if (!field.value) {
//           setValue(name, 'Canada', { shouldValidate: true });
//         }

//         return (
//           <CountrySelect
//             id={`${name}-rhf-country-select`}
//             value={value}
//             onChange={(event, newValue) => setValue(name, newValue, { shouldValidate: true })}
//             error={!!error}
//             helperText={error?.message ?? helperText}
//             {...other}
//           />
//         );
//       }}
//     />
//   );
// }
