import type { TextFieldProps } from '@mui/material/TextField';
import type { AutocompleteProps } from '@mui/material/Autocomplete';

import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

import { getRoleSoftChipSx, getRoleDisplayInfo } from 'src/utils/format-role';

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

export type AutocompleteWithAvatarOption = {
  label: string;
  value: string;
  photo_url?: string;
  first_name?: string;
  last_name?: string;
  /** Optional metadata (e.g. job worker role) for consumers via onAfterSelect */
  assignedRole?: string;
  /** Raw job_workers.position (for getRoleDisplayInfo / colors) */
  jobPosition?: string;
  [key: string]: any;
};

export type AutocompleteWithAvatarBaseProps = Omit<
  AutocompleteProps<AutocompleteWithAvatarOption, boolean, boolean, boolean>,
  'renderInput' | 'options'
>;

export type RHFAutocompleteWithAvatarProps = AutocompleteWithAvatarBaseProps & {
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: React.ReactNode;
  options: AutocompleteWithAvatarOption[];
  disabled?: boolean;
  multiple?: boolean;
  /** Called after the selected option is written to the form (single-select only). */
  onAfterSelect?: (option: AutocompleteWithAvatarOption | null) => void;
  /** Rendered inside the input row before the clear/dropdown controls (e.g. role label + chip). */
  inputEndSlot?: React.ReactNode;
  slotProps?: AutocompleteWithAvatarBaseProps['slotProps'] & {
    textfield?: TextFieldProps;
  };
};

export function RHFAutocompleteWithAvatar({
  name,
  label,
  options,
  disabled,
  slotProps,
  helperText,
  placeholder,
  multiple = false,
  onAfterSelect,
  inputEndSlot,
  ...other
}: RHFAutocompleteWithAvatarProps) {
  const theme = useTheme();
  const { control, setValue, getValues } = useFormContext();

  const { textfield, ...otherSlotProps } = slotProps ?? {};
  const { InputProps: textfieldInputProps, ...textfieldRest } = textfield ?? {};
  const { endAdornment: textfieldEndAdornment, ...textfieldInputRest } = textfieldInputProps ?? {};

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const selectedValues = getValues(name);
        const selected = multiple
          ? options.filter((opt) => (selectedValues as string[])?.includes(opt.value))
          : options.find((opt) => opt.value === selectedValues);

        const getFallbackLetter = (option: AutocompleteWithAvatarOption) =>
          option.first_name?.charAt(0).toUpperCase() ||
          option.last_name?.charAt(0).toUpperCase() ||
          '?';

        const getAvatarColor = (option: AutocompleteWithAvatarOption) => {
          const displayName = option.first_name || option.last_name || '';
          return colorByName(displayName);
        };

        return (
          <Autocomplete<AutocompleteWithAvatarOption, boolean, boolean, boolean>
            {...field}
            id={`rhf-autocomplete-with-avatar-${name}`}
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
                  (newValue as AutocompleteWithAvatarOption[]).map((item) => item.value),
                  { shouldValidate: true }
                );
              } else {
                const opt = (newValue as AutocompleteWithAvatarOption) || null;
                setValue(name, opt?.value || '', {
                  shouldValidate: true,
                });
                onAfterSelect?.(opt);
              }
            }}
            renderOption={(props, option) => {
              const { id, key, ...rest } = props;

              const optionFallbackLetter = getFallbackLetter(option);
              return (
                <li key={key || id} {...rest} style={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    src={option.photo_url}
                    sx={{
                      width: 26,
                      height: 26,
                      fontSize: 15,
                      mr: 1.5,
                      ...(option.photo_url
                        ? {}
                        : {
                            bgcolor: (muiTheme) => {
                              const paletteColor = (muiTheme.palette as any)[getAvatarColor(option)];
                              return paletteColor?.main || muiTheme.palette.grey[500];
                            },
                          }),
                    }}
                  >
                    {!option.photo_url && optionFallbackLetter}
                  </Avatar>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', minWidth: 0 }}>
                    <span>{option.label}</span>
                    {(() => {
                      const { label: roleLabel, color } = getRoleDisplayInfo(
                        option.jobPosition || option.assignedRole
                      );
                      if (!roleLabel) return null;
                      return (
                        <Chip
                          label={roleLabel}
                          size="small"
                          variant="soft"
                          color={color}
                          sx={getRoleSoftChipSx(theme, color)}
                        />
                      );
                    })()}
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
                      src={option.photo_url}
                      sx={{
                        ...(option.photo_url
                          ? {}
                          : {
                              bgcolor: (muiTheme) => {
                                const paletteColor = (muiTheme.palette as any)[getAvatarColor(option)];
                                return paletteColor?.main || muiTheme.palette.grey[500];
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
                {...textfieldRest}
                label={label}
                placeholder={placeholder}
                error={!!error}
                helperText={error?.message ?? helperText}
                FormHelperTextProps={{ sx: { minHeight: 24 } }}
                InputProps={{
                  ...params.InputProps,
                  ...textfieldInputRest,
                  startAdornment:
                    !multiple && selected ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          src={(selected as AutocompleteWithAvatarOption).photo_url}
                          sx={{
                            width: 26,
                            height: 26,
                            fontSize: 15,
                            mr: 0.5,
                            ...(!(selected as AutocompleteWithAvatarOption).photo_url
                              ? {
                                  bgcolor: (muiTheme) => {
                                    const paletteColor = (muiTheme.palette as any)[
                                      getAvatarColor(selected as AutocompleteWithAvatarOption)
                                    ];
                                    return paletteColor?.main || muiTheme.palette.grey[500];
                                  },
                                }
                              : {}),
                          }}
                        >
                          {!(selected as AutocompleteWithAvatarOption).photo_url &&
                            getFallbackLetter(selected as AutocompleteWithAvatarOption)}
                        </Avatar>
                      </Box>
                    ) : (
                      textfieldInputRest?.startAdornment ?? params.InputProps.startAdornment
                    ),
                  endAdornment: (
                    <>
                      {inputEndSlot}
                      {textfieldEndAdornment}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                slotProps={{
                  ...textfield?.slotProps,
                  htmlInput: {
                    ...params.inputProps,
                    autoComplete: 'new-password',
                    ...textfield?.slotProps?.htmlInput,
                  },
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
