import type { TextFieldProps } from '@mui/material/TextField';
import type { AutocompleteProps } from '@mui/material/Autocomplete';

import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

// ----------------------------------------------------------------------

type PaletteColor = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'grey';

const colorByName = (name?: string): PaletteColor => {
  const charAt = name?.charAt(0).toLowerCase();

  if (['a', 'c', 'f'].includes(charAt!)) return 'primary';
  if (['e', 'd', 'h'].includes(charAt!)) return 'secondary';
  if (['i', 'k', 'l'].includes(charAt!)) return 'info';
  if (['m', 'n', 'p'].includes(charAt!)) return 'success';
  if (['q', 's', 't'].includes(charAt!)) return 'warning';
  if (['v', 'x', 'y'].includes(charAt!)) return 'error';

  return 'grey';
};

type AutocompleteWithLicenseStatusOption = {
  label: string;
  value: string;
  photo_url: string | null;
  first_name: string;
  last_name: string;
  licenseStatus: {
    isValid: boolean;
    isExpiringSoon: boolean;
    daysRemaining: number;
    hasLicense: boolean;
  };
};

type AutocompleteWithLicenseStatusBaseProps = Omit<
  AutocompleteProps<AutocompleteWithLicenseStatusOption, boolean, boolean, boolean>,
  'renderInput' | 'options'
> & {
  options: AutocompleteWithLicenseStatusOption[];
  slotProps?: {
    textfield?: TextFieldProps;
  };
};

export type RHFAutocompleteWithLicenseStatusProps = AutocompleteWithLicenseStatusBaseProps & {
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: React.ReactNode;
  options: AutocompleteWithLicenseStatusOption[];
  disabled?: boolean;
  multiple?: boolean;
  slotProps?: AutocompleteWithLicenseStatusBaseProps['slotProps'] & {
    textfield?: TextFieldProps;
  };
};

export function RHFAutocompleteWithLicenseStatus({
  name,
  label,
  options,
  disabled,
  slotProps,
  helperText,
  placeholder,
  multiple = false,
  ...other
}: RHFAutocompleteWithLicenseStatusProps) {
  const { control, setValue, getValues } = useFormContext();

  const { textfield, ...otherSlotProps } = slotProps ?? {};

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const selectedValues = getValues(name);
        const selected = multiple
          ? options.filter((opt) => (selectedValues as string[])?.includes(opt.value))
          : options.find((opt) => opt.value === selectedValues);

        const getFallbackLetter = (option: AutocompleteWithLicenseStatusOption) =>
          option.first_name?.charAt(0).toUpperCase() ||
          option.last_name?.charAt(0).toUpperCase() ||
          '?';

        const getAvatarColor = (option: AutocompleteWithLicenseStatusOption) => {
          const displayName = option.first_name || option.last_name || '';
          return colorByName(displayName);
        };

        return (
          <Autocomplete<AutocompleteWithLicenseStatusOption, boolean, boolean, boolean>
            {...field}
            id={`rhf-autocomplete-with-license-status-${name}`}
            options={options}
            disabled={disabled}
            multiple={multiple}
            getOptionLabel={(option) => {
              if (typeof option === 'string') {
                const foundOption = options.find((opt) => opt.value === option);
                return foundOption ? foundOption.label : option;
              }
              return (
                option?.label ||
                [option?.first_name, option?.last_name].filter(Boolean).join(' ') ||
                ''
              );
            }}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            onChange={(_, newValue) => {
              if (multiple) {
                setValue(
                  name,
                  (newValue as AutocompleteWithLicenseStatusOption[]).map((item) => item.value),
                  { shouldValidate: true }
                );
              } else {
                setValue(name, (newValue as AutocompleteWithLicenseStatusOption)?.value || '', {
                  shouldValidate: true,
                });
              }
            }}
            renderOption={(props, option) => {
              const { id, key, ...rest } = props;
              const licenseStatus = option.licenseStatus;
              
              let backgroundColor = 'transparent';
              if (!licenseStatus.hasLicense) {
                backgroundColor = 'rgba(var(--palette-error-mainChannel) / 0.08)';
              } else if (licenseStatus.isExpiringSoon) {
                // Show light warning color for expiring licenses
                backgroundColor = 'rgba(var(--palette-warning-mainChannel) / 0.08)';
              } else if (licenseStatus.isValid) {
                backgroundColor = 'rgba(var(--palette-success-mainChannel) / 0.08)';
              }

              return (
                <li 
                  key={key || id} 
                  {...rest} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    backgroundColor,
                    borderRadius: '4px',
                    margin: '2px 0',
                  }}
                >
                  <Avatar
                    src={option.photo_url || undefined}
                    sx={{
                      width: 26,
                      height: 26,
                      fontSize: 15,
                      mr: 1.5,
                      ...(option.photo_url
                        ? {}
                        : {
                            bgcolor: (theme) => {
                              const paletteColor = (theme.palette as any)[getAvatarColor(option)];
                              return paletteColor?.main || theme.palette.grey[500];
                            },
                          }),
                    }}
                  >
                    {!option.photo_url && getFallbackLetter(option)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    {option.label}
                    {licenseStatus.hasLicense && licenseStatus.isExpiringSoon && (
                      <Box sx={{ fontSize: '12px', color: 'text.secondary' }}>
                        License expires in {licenseStatus.daysRemaining} {licenseStatus.daysRemaining === 1 ? 'day' : 'days'}
                      </Box>
                    )}
                    {!licenseStatus.hasLicense && (
                      <Box sx={{ fontSize: '12px', color: 'error.main' }}>
                        No driver license
                      </Box>
                    )}
                  </Box>
                </li>
              );
            }}
            renderTags={(tagValue, getTagProps) =>
              tagValue.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.value}
                  label={option.label}
                                      avatar={
                      <Avatar
                        src={option.photo_url || undefined}
                        sx={{
                          ...(option.photo_url
                            ? {}
                            : {
                                bgcolor: (theme) => {
                                  const paletteColor = (theme.palette as any)[getAvatarColor(option)];
                                  return paletteColor?.main || theme.palette.grey[500];
                                },
                              }),
                        }}
                      >
                        {!option.photo_url && getFallbackLetter(option)}
                      </Avatar>
                    }
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                {...textfield}
                label={label}
                placeholder={placeholder}
                error={!!error}
                helperText={error?.message ?? helperText}
                FormHelperTextProps={{ sx: { minHeight: 24 } }}
                InputProps={{
                  ...params.InputProps,
                  startAdornment:
                    !multiple && selected ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          src={(selected as AutocompleteWithLicenseStatusOption).photo_url || undefined}
                          sx={{
                            width: 26,
                            height: 26,
                            fontSize: 15,
                            mr: 0.5,
                            ...(!(selected as AutocompleteWithLicenseStatusOption).photo_url
                              ? {
                                  bgcolor: (theme) => {
                                    const paletteColor = (theme.palette as any)[getAvatarColor(selected as AutocompleteWithLicenseStatusOption)];
                                    return paletteColor?.main || theme.palette.grey[500];
                                  },
                                }
                              : {}),
                          }}
                        >
                          {!(selected as AutocompleteWithLicenseStatusOption).photo_url &&
                            getFallbackLetter(selected as AutocompleteWithLicenseStatusOption)}
                        </Avatar>
                      </Box>
                    ) : null,
                  ...textfield?.InputProps,
                }}
              />
            )}
            {...other}
            {...otherSlotProps}
          />
        );
      }}
    />
  );
} 