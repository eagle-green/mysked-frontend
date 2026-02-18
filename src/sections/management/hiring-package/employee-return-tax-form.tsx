import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';

import { Field } from 'src/components/hook-form/fields';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

export function EmployeeReturnTaxForm() {
  const { user } = useAuthContext();
  const {
    control,
    watch,
    formState: { errors },
    trigger,
    clearErrors,
  } = useFormContext();

  const NEW_HIRE_FORMS = [
    { value: 'employment_offer', label: 'Offer of Employment – Hiring Manager to complete' },
    { value: 'offer_letter', label: 'Offer Letter – Non Union' },
    { value: 'rehire_form', label: 'New Hire – Rehire Employee Form' },
    { value: 'emergency_consent', label: 'Employee Emergency/Consent Information Sheet' },
    { value: 'equipement_form', label: 'Equipment Form' },
    { value: 'direct_deposit', label: 'Direct Deposit Authorization' },
    { value: 'federal_td1', label: 'Federal TD1' },
    { value: 'provincial_td1', label: 'Provincial TD1 ' },
    { value: 'safety_manual', label: 'EG Health and Safety Manual' },
    { value: 'diversity_eg', label: 'Celebrate Diversity at - EG' },
    { value: 'vacation_non_union', label: 'Vacation – Non-Union – Employee to Keep' },
    { value: 'handbook', label: 'Handbook – Acknowledgment of Receipt ' },
    { value: 'fleet_form', label: 'Fleet Forms – See requiredfleet documentation checklist' },
  ];
  return (
    <>
      <Stack>
        <Typography variant="h4">2026 Personal Tax Credit Return</Typography>
      </Stack>
      <Stack>
        <Typography variant="body1" color="text.disabled">
          Complete this form and give it to your employeer or payer so they can determine how much
          income tax to deduct from your pay.
        </Typography>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />

      <Stack>
        <Typography variant="h4">Personal Information</Typography>
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
        <Field.Text name="social_insurance_number" label="Social Insurance Number*" />

        <Field.DatePicker
          name="birth_date"
          label="Birthday"
          slotProps={{
            textField: {
              fullWidth: true,
              required: true,
            },
          }}
        />

        <Field.Text name="employee_number" label="Employee Number*" />
        <Field.Text name="country_residence" label="Country Of Residence*" />

        <Field.Text name="address" label="Address*" />
        <Field.Text name="postal_code" label="Postal Code*" />
      </Box>

      <Stack>
        <Typography variant="h4">Claim Amounts</Typography>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
    </>
  );
}
