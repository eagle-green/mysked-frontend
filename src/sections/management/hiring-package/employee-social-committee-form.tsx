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

export function EmployeeSocialCommitteeForm() {
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
      value: 'join',
      label: `I would like to join the (EG) Employee Social Committee. My contact informationis as follows`,
    },
    {
      value: 'authorize',
      label: 'Pre-Access Drug & Alcohol Test Completed and Passed ',
    },
    {
      value: 'agree',
      label: 'Pre-Access Drug & Alcohol Test Completed and Passed ',
    },
  ];

  return (
    <>
      <Stack>
        <Typography variant="h4">Employee Social Committee Enrollment Form</Typography>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
        }}
      >
        <Stack>
          <Typography variant="subtitle1">Re: Employee Social Committee</Typography>
        </Stack>
        <Stack>
          <Typography variant="body1">
            Welcome to Eagle Green LLP The Company has formed a committee of employees to manage
            social events that employees can enjoy throughout the year. This committee arranges and
            pays for all kinds of functions and fundraisers, such as barbeques, picnics, adopting a
            family at Christmas and the annual Christmas Party. This committee operates separately
            from the Company.
          </Typography>
        </Stack>
      </Box>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
        }}
      >
        <Stack>
          <Typography variant="subtitle1">How does it works ?</Typography>
        </Stack>
        <Card
          sx={{
            p: 2,
            mb: 3,
            bgcolor: 'primary.lighter',
            borderLeft: 5,
            borderColor: 'primary.dark',
          }}
        >
          <Typography variant="body1" color="primary.dark">
            Employees contribute <strong>$1.00 per pay period</strong>, which is deducted from their
            weekly paycheque. The Company then matches that dollar amount each pay period. The
            committee meets and decides what functions will be organized and how the money in the
            social fund will be spent.
          </Typography>
        </Card>
      </Box>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
