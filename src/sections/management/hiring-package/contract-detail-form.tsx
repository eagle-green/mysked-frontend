import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';

import { Field } from 'src/components/hook-form/fields';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

export function ContractDetailForm() {
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
        <Typography variant="h4">Contract Detail Form</Typography>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
        }}
      >
        <Field.DatePicker
          name="date"
          label="Date"
          slotProps={{
            textField: {
              fullWidth: true,
              required: true,
            },
          }}
        />
        <Field.DatePicker
          name="start_date"
          label="Start Date"
          slotProps={{
            textField: {
              fullWidth: true,
              required: true,
            },
          }}
        />
        <Field.Text name="first_name" label="First Name*" />
        <Field.Text name="last_name" label="Last Name*" />

        {/* <Field.Phone name="contact_number" label="Contact number" country="CA" /> */}
        <Field.Text name="position" label="Postion*" />
        <Field.Text name="hourly_rate" label="Hourly Rate*" />
      </Box>
      <Stack>
        <Typography variant="h4">
          Admin Pre-Hire & Onboarding Documentation for British Columbia
        </Typography>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
        }}
      >
        <Field.Text name="full_name" label="Name*" />
        <Field.Text name="onboarding_position" label="Position*" />

        <Box sx={{ width: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[
              {
                value: 'drug_alcohol_test',
                label: 'Pre-Access Drug & Alcohol Test Completed and Passed ',
              },
            ]
              .filter((opt) => opt.value)
              .map((option) => (
                <Box key={option.value}>
                  <Controller
                    name={`onboarding.test.${option.value}`}
                    control={control}
                    render={({ field }) => (
                      <Field.Checkbox
                        name={`onboarding.test.${option.value}`}
                        label={option.label}
                        slotProps={{
                          checkbox: {
                            onChange: async (e, checked) => {
                              field.onChange(checked);
                              setTimeout(async () => {
                                const isValid = await trigger('onboarding.test');
                                if (isValid) {
                                  clearErrors('onboarding.test');
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
          {errors.onboarding && (errors.onboarding as any)?.road && (
            <FormHelperText error sx={{ mt: 1 }}>
              {(errors.onboarding as any).road?.message}
            </FormHelperText>
          )}
        </Box>
      </Box>

      <Box sx={{ width: 1 }}>
        <Typography variant="body2" sx={{ mb: 1.5, px: 1.5 }}>
          All new hires must complete the following forms:
        </Typography>
        <Box
          sx={{
            rowGap: 1,
            columnGap: 1,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
          }}
        >
          {NEW_HIRE_FORMS.filter((opt) => opt.value).map((option) => (
            <Box key={option.value}>
              <Controller
                name={`onboarding.forms.${option.value}`}
                control={control}
                render={({ field }) => (
                  <Field.Checkbox
                    name={`onboarding.forms.${option.value}`}
                    label={option.label}
                    slotProps={{
                      checkbox: {
                        onChange: async (e, checked) => {
                          field.onChange(checked);
                          setTimeout(async () => {
                            const isValid = await trigger('onboarding.forms');
                            if (isValid) {
                              clearErrors('onboarding.forms');
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
        {errors.descriptionOfWork && (errors.descriptionOfWork as any)?.road && (
          <FormHelperText error sx={{ mt: 1 }}>
            {(errors.descriptionOfWork as any).road?.message}
          </FormHelperText>
        )}
      </Box>
    </>
  );
}
