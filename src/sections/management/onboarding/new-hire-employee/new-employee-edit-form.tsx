import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { formatSinForDisplay, normalizeCanadianSin } from 'src/utils/format-canadian-sin';

import { provinceList } from 'src/assets/data';

import { Field } from 'src/components/hook-form/fields';

export function EmployeeInformationEditForm() {
  const { control } = useFormContext();

  return (
    <>
        <Stack>
          <Typography variant="h4">Employee Personal Information</Typography>
        </Stack>
        <Divider sx={{ borderStyle: 'dashed' }} />
        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' },
          }}
        >
          <Field.Text name="employee.first_name" label="First Name*" />
          <Field.Text name="employee.last_name" label="Last Name*" />
          <Field.Text name="employee.middle_initial" label="Middle Initial" />
          <Controller
            name="employee.sin"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                label="SIN*"
                fullWidth
                value={formatSinForDisplay(field.value)}
                onChange={(e) => field.onChange(normalizeCanadianSin(e.target.value))}
                onBlur={field.onBlur}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                inputProps={{
                  inputMode: 'numeric',
                  autoComplete: 'off',
                  maxLength: 11,
                }}
              />
            )}
          />
          <Field.DatePicker
            name="employee.date_of_birth"
            label="Date of Birth"
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
              },
            }}
          />
          <Field.Select name="employee.gender" label="Gender*">
            <MenuItem value="">Select...</MenuItem>
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
            <MenuItem value="prefer_not_to_say">Prefer Not to Say</MenuItem>
          </Field.Select>
        </Box>
        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(1, 1fr)' },
          }}
        >
          <Field.Text name="employee.address" label="Address*" multiline rows={2} fullWidth />
        </Box>
        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' },
          }}
        >
          <Field.Text name="employee.city" label="City*" />
          <Field.Select name="employee.province" label="Province*">
            {provinceList.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.value}
              </MenuItem>
            ))}
          </Field.Select>
          <Field.Text
            name="employee.postal_code"
            label="Postal Code*"
            placeholder="A1A 1B1"
            canadianPostalCode
          />

          <Field.Phone name="employee.home_phone_no" label="Home Phone #" country="CA" />
          <Field.Phone name="employee.cell_no" label="Cellphone #*" country="CA" />
          <Field.Text
            name="employee.email_address"
            label="Personal Email Address*"
            type="email"
            slotProps={{
              htmlInput: { readOnly: true, autoComplete: 'email' },
            }}
            sx={{
              '& .MuiOutlinedInput-root': { bgcolor: 'action.hover' },
              '& .MuiInputBase-input': { cursor: 'default' },
            }}
          />
        </Box>

        <Field.Text
          name="employee.medical_allergies"
          label="Allergies / Medical Allerts"
          multiline
          rows={2}
          fullWidth
        />

        <Stack>
          <Typography variant="h4">Emergency Contact Information </Typography>
        </Stack>
        <Divider sx={{ borderStyle: 'dashed' }} />

        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' },
          }}
        >
          <Field.Text name="emergency_contact.first_name" label="First Name*" />
          <Field.Text name="emergency_contact.last_name" label="Last Name*" />
          <Field.Text name="emergency_contact.middle_initial" label="Middle Initial" />

          <Field.Text name="emergency_contact.address" label="Address" />
          <Field.Text name="emergency_contact.city" label="City" />
          <Field.Select name="emergency_contact.province" label="Province">
            <MenuItem value="">Select...</MenuItem>
            {provinceList.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.value}
              </MenuItem>
            ))}
          </Field.Select>
          <Field.Text
            name="emergency_contact.postal_code"
            label="Postal Code"
            canadianPostalCode
          />

          <Field.Phone
            name="emergency_contact.phone_no"
            label="Home Phone #"
            country="CA"
            international={false}
            useNationalFormatForDefaultCountryValue
          />
          <Field.Phone
            name="emergency_contact.cell_no"
            label="Cellphone #*"
            country="CA"
            international={false}
            useNationalFormatForDefaultCountryValue
          />
          <Field.Text name="emergency_contact.relationship" label="Relationship" />
        </Box>
      </>
  );
}
