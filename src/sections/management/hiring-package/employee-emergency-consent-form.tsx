import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';

import { Field } from 'src/components/hook-form/fields';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

export function EmployeeEmergencyConsentForm() {
  const { user } = useAuthContext();
  const {
    control,
    watch,
    formState: { errors },
    trigger,
    clearErrors,
  } = useFormContext();

  const SHIFT_TYPE = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'casual', label: 'Casual' },
    { value: 'seasonal', label: 'Seasonal' },
  ];

  const HRS_P = [
    { value: 'non_union', label: 'Area Overhead (Non-Union)' },
    { value: 'home_office', label: 'part of OPS Support (Home Office)' },
  ];

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
        <Field.Text name="last_name" label="Last Name*" />
        <Field.Text name="first_name" label="First Name*" />
        <Field.Text name="middle_initial" label="Initial" />
        <Field.Text name="home_phone_no" label="Home Phone#*" />
        <Field.Text name="phone_no" label="Cellphone#*" />
        <Field.Text name="email_address" label="Personal Email Address*" />
      </Box>
      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: '1fr 2fr' },
        }}
      >
        <Field.DatePicker
          name="date_of_birth"
          label="Date of Birth"
          slotProps={{
            textField: {
              fullWidth: true,
              required: true,
            },
          }}
        />
        <Field.Text name="medical_alert" label="Medical Alert" />
      </Box>

      <Stack>
        <Typography variant="h4">Emergency Contact Information</Typography>
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
        <Field.Text name="last_name" label="Last Name*" />
        <Field.Text name="first_name" label="First Name*" />
        <Field.Text name="middle_initial" label="Initial" />

        <Field.Text name="address" label="Address*" />
        <Field.Text name="province" label="City/Province*" />
        <Field.Text name="postal_code" label="Postal Code*" />

        <Field.Text name="home_phone_no" label="Home Phone#*" />
        <Field.Text name="phone_no" label="Cellphone#*" />
        <Field.Text name="relationship" label="Relationship*" />
      </Box>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Box
        sx={{
          backgroundColor: 'divider',
          p: 1,
          borderRadius: 1,
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
          }}
        >
          <Stack sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ p: 2 }}>
              I hereby authorize Eagle Green (EG) to use my name and/or picture on EG media
              material, including the EG website, newsletter, and other media.
            </Typography>
            <Stack
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: 1,
                py: 1,
                px: 2,
              }}
            >
              <Controller
                control={control}
                name="isConsent"
                render={({ field }) => (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      justifyContent: 'space-between',
                      width: 1,
                    }}
                  >
                    <Field.RadioGroup
                      {...field}
                      row
                      sx={{ width: 1, display: 'flex', justifyContent: 'space-between' }}
                      options={[
                        { label: 'Yes', value: 'yes' },
                        { label: 'No', value: 'no' },
                      ]}
                    />
                  </Box>
                )}
              />
            </Stack>
          </Stack>

          <Stack sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ p: 2 }}>
              I hereby authorize Eagle Green (EG) to use my name and/or picture on EG media
              material, including the EG website, newsletter, and other media.
            </Typography>
            <Stack
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: 1,
                py: 1,
                px: 2,
              }}
            >
              <Controller
                control={control}
                name="isConsent"
                render={({ field }) => (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      justifyContent: 'space-between',
                      width: 1,
                    }}
                  >
                    <Field.RadioGroup
                      {...field}
                      row
                      sx={{ width: 1, display: 'flex', justifyContent: 'space-between' }}
                      options={[
                        { label: 'Yes', value: 'yes' },
                        { label: 'No', value: 'no' },
                      ]}
                    />
                  </Box>
                )}
              />
            </Stack>
          </Stack>
        </Box>
      </Box>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: '2fr 1fr' },
          justifyContent: 'space-evenly',
          alignItems: 'center',
        }}
      >
        <Box>
          <Box>Signature Area</Box>
          <Typography variant="subtitle1">EMPLOYEE SIGNATURE</Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
            (Signature Over Printed Name)
          </Typography>
        </Box>

        <Box>
          <Field.DatePicker
            name="date_of_birth"
            label="Date of Birth"
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
              },
            }}
          />
        </Box>
      </Box>
    </>
  );
}
