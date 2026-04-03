import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { Field } from 'src/components/hook-form/fields';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

export function EmployeeInformationEditForm() {
  const { user } = useAuthContext();
  const {
    control,
    watch,
    formState: { errors },
    trigger,
    clearErrors,
    setValue,
  } = useFormContext();

  return (
    <>
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
          <Field.Text name="employee.last_name" label="Last Name*" />
          <Field.Text name="employee.first_name" label="First Name*" />
          <Field.Text name="employee.middle_initial" label="Initial*" />
          <Field.Text name="employee.sin" label="SIN*" />
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
          <Stack
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: 1,
              px: 2,
            }}
          >
            <Typography variant="body2">Gender</Typography>
            <Controller
              control={control}
              name="employee.gender"
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
                      { label: 'Male', value: 'male' },
                      { label: 'Female', value: 'female' },
                      { label: 'Other', value: 'N/A' },
                    ]}
                  />
                </Box>
              )}
            />
          </Stack>
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
          <Field.Text name="employee.city" label="Town/City*" />
          <Field.Text name="employee.province" label="Province*" />
          <Field.Text name="employee.postal_code" label="Postal Code*" />

          <Field.Text name="employee.home_phone_no" label="Home Phone#*" />
          <Field.Text name="employee.cell_no" label="Cellphone#*" />
          <Field.Text name="employee.email_address" label="Personal Email Address*" />
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
          <Field.Text name="emergency_contact.last_name" label="Last Name*" />
          <Field.Text name="emergency_contact.first_name" label="First Name*" />
          <Field.Text name="emergency_contact.middle_initial" label="Middle Initial*" />

          <Field.Text name="emergency_contact.address" label="Address*" />
          <Field.Text name="emergency_contact.city" label="City/Province*" />
          <Field.Text name="emergency_contact.postal_code" label="Postal Code*" />

          <Field.Text name="emergency_contact.phone_no" label="Home Phone*" />
          <Field.Text name="emergency_contact.cell_no" label="Cell phone*" />
        </Box>
      </>
    </>
  );
}
