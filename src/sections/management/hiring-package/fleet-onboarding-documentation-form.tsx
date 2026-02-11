import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';

import { Field } from 'src/components/hook-form/fields';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

export function FleetOnboardingDocumentationForm() {
  const { user } = useAuthContext();
  const {
    control,
    watch,
    formState: { errors },
    trigger,
    clearErrors,
  } = useFormContext();

  const AGREEMENT = [
    {
      value: 'driver_license',
      label: `Copy of Current Driver's License (NSC)`,
    },
    {
      value: 'consent_form',
      label: 'Provincial Abstract Consent Form',
    },
    {
      value: 'commercial_driver',
      label: 'Copy of 5 Yr. Commercial Driver`s Abstract',
    },
    {
      value: 'employee_resume',
      label: 'Employee Resume',
    },
    {
      value: 'alcohol_policy',
      label: 'Drug & Alcohol Policy',
    },
    {
      value: 'post_trip',
      label: 'Pre-Trip & Post-Trip Policy',
    },
    {
      value: 'identification_policy',
      label: 'EG Driver Identification Policy (Vehicle Fobs)',
    },
    {
      value: 'company_vehicle_union',
      label: 'Use of Company Vehicle UNION Policy',
    },
    {
      value: 'company_vehicle_non_union',
      label: 'Use of Company Vehicle NON UNION Policy ',
    },
    {
      value: 'fuel_card',
      label: 'Company Fuel Cards Policy',
    },
    {
      value: 'gos_usage',
      label: 'GPS Usage Policy',
    },
    {
      value: 'behavior_policy',
      label: 'Conduct & Behavior Policy',
    },
    {
      value: 'additional_cert',
      label: 'Additional Certifications (*Not Required, N/A if none provided)',
    },
  ];

  return (
    <>
      <Stack>
        <Typography variant="h4">Flee Onboarding Documentation Form</Typography>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />

      <Card
        sx={{
          p: 2,
          mb: 3,
          bgcolor: 'error.lighter',
          borderLeft: 5,
          borderColor: 'error.dark',
        }}
      >
        <Typography variant="body1" color="error.dark">
          ONLY TO BE COMPLETED IF EMPLOYEE IS REQUIRED TO USE A COMPANY VEHICLE
        </Typography>
      </Card>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
        }}
      >
        <Field.Text name="full_name" label="Employee Name" required />
        <Field.Text name="operating_area" label="Operation Area" required />
        <Field.DatePicker
          name="hire_date"
          label="Hired Date"
          slotProps={{
            textField: {
              fullWidth: true,
              required: true,
            },
          }}
        />
        <Field.Text name="position" label="Position" required />
      </Box>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Stack>
        <Typography variant="subtitle1">Required Document</Typography>
      </Stack>
      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
        }}
      >
        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
          }}
        >
          {AGREEMENT.filter((opt) => opt.value).map((option) => (
            <Box
              key={option.value}
              sx={{
                bgcolor: 'divider',
                py: 2,
                px: 1,
                borderRadius: 1,
              }}
            >
              <Controller
                name={`social.test.${option.value}`}
                control={control}
                render={({ field }) => (
                  <Field.Checkbox
                    name={`social.test.${option.value}`}
                    label={option.label}
                    slotProps={{
                      checkbox: {
                        onChange: async (e, checked) => {
                          field.onChange(checked);
                          setTimeout(async () => {
                            const isValid = await trigger('social.test');
                            if (isValid) {
                              clearErrors('social.test');
                            }
                          }, 50);
                        },
                      },
                    }}
                  />
                )}
              />
            </Box>
          ))}
        </Box>
      </Box>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 5,
          mt: 2,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Box>Signature Area</Box>
          <Typography variant="subtitle1">EMPLOYEE’S SIGNATURE</Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
            (Signature Over Printed Name)
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Field.DatePicker
            name="payroll_deposit_signed_date"
            label="Date"
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
