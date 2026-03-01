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
      value: 'is_join_social_committee',
      label: `I would like to join the (EG) Employee Social Committee.`,
    },
    {
      value: 'authorize_deduction',
      label:
        'I authorize a deduction of $1.00 per pay period to go towards the Social Fund and become a member of the Social Club.',
    },
    {
      value: 'not_agree_deduction',
      label:
        'I do not agree to have money deducted from my paycheque and do not want to become a member of the Social Club.',
    },
  ];

  const currentEmployeeSignature = watch('employee.signature');
  const authorized = watch('celebrate_diversity_consent');

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
                name={`socialAgreement.${option.value}`}
                control={control}
                render={({ field }) => (
                  <Field.Checkbox
                    name={`socialAgreement.${option.value}`}
                    label={option.label}
                    slotProps={{
                      checkbox: {
                        onChange: async (e, checked) => {
                          field.onChange(checked);
                          setTimeout(async () => {
                            const isValid = await trigger('socialAgreement');
                            if (isValid) {
                              clearErrors('socialAgreement');
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

      <Stack>
        <Typography variant="h4">Celebrate Diversity at Eagle Green LLP</Typography>
      </Stack>
      <Stack>
        <Typography variant="body1">
          Eagle Green hires on the basis of merit and is committed to diversity and employment
          equity within the community.
        </Typography>
      </Stack>
      <Stack>
        <Typography variant="body1">
          To ensure that we are doing our part, we collect information in accordance with the
          Employment Equity Act and the Freedom of Information and Protection ofPrivacy Act,
          regarding the employment equity status of employees.
        </Typography>
      </Stack>

      <Stack>
        <Typography variant="h4">Confidentiality</Typography>
      </Stack>

      <Card
        sx={{
          px: 4,
          py: 2,
          mb: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <li>
          <Typography variant="body1">
            Informationyou provide is collected in accordance with the Employment Equity Act and the
            Freedom of Information and Protection of Privacy Act, and will betreated with the
            strictest confidence
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Surveys will not be shared with supervisors or managers.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Paper surveys are returned in a sealed envelopetoEmployee Services for entry.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Responses to this survey will be analyzed only in summary form and will be kept
            separately fiom employee files
          </Typography>
        </li>
      </Card>

      <Stack>
        <Typography variant="body1">
          If you do not wish to participate in the survey, please check the box below:
        </Typography>
      </Stack>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr',
        }}
      >
        <Box
          sx={{
            bgcolor: 'divider',
            py: 2,
            px: 1,
            borderRadius: 1,
          }}
        >
          <Controller
            name="celebrate_diversity_consent"
            control={control}
            render={({ field }) => (
              <Field.Checkbox
                name="celebrate_diversity_consent"
                label="I have reviewed the content of the Employment Equity Survey and do not wish to participate."
                slotProps={{
                  checkbox: {
                    onChange: async (e, checked) => {
                      field.onChange(checked);
                      setTimeout(async () => {
                        const isValid = await trigger('celebrate_diversity_consent');
                        if (isValid) {
                          clearErrors('celebrate_diversity_consent');
                        }
                      }, 50);
                    },
                  },
                }}
              />
            )}
          />
        </Box>
      </Box>
      <Divider sx={{ borderStyle: 'dashed' }} />
      {currentEmployeeSignature && authorized && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: { xs: 'center', md: 'flex-end' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 5,
            mt: 2,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Box>
              <img src={currentEmployeeSignature} alt="Employee Signature" />
            </Box>
            <Typography variant="subtitle1">EMPLOYEE’S SIGNATURE</Typography>
            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
              (Signature Over Printed Name)
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="subtitle1">09/20/2023</Typography>
            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
              (Date Signed)
            </Typography>
          </Box>
        </Box>
      )}
    </>
  );
}
