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

export function EmploymentEquitySurveyForm() {
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
      value: 'yes',
      label: `I have reviewed the content of the Employment Equity Survey and do not wish to participate.`,
    },
  ];

  return (
    <>
      <Stack>
        <Typography variant="h4">Employment Equity Survey</Typography>
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
        <Field.Text name="full_name" label="Full Name*" />
        <Field.Text name="position" label="Position*" />
      </Box>

      <Field.Text name="area" label="Area*" multiline rows={2} fullWidth />

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
        }}
      >
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
          <Typography variant="subtitle1">Confidentiality</Typography>
        </Stack>
        <Card
          sx={{
            p: 5,
            mb: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            bgcolor: 'primary.lighter',
            color: 'primary.dark',
          }}
        >
          <li>
            <Typography variant="body1">
              Informationyou provide is collected in accordance with the Employment Equity Act and
              the Freedom of Information and Protection of Privacy Act, and will betreated with the
              strictest confidence
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              Surveys will not be shared with supervisors or managers
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              Paper surveys are returned in a sealed envelopetoEmployee Services for entry
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
          <Typography variant="subtitle1">
            If you do not wish to participate in the survey, please check the box below
          </Typography>
        </Stack>
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
                name={`survey.test.${option.value}`}
                control={control}
                render={({ field }) => (
                  <Field.Checkbox
                    name={`survey.test.${option.value}`}
                    label={option.label}
                    slotProps={{
                      checkbox: {
                        onChange: async (e, checked) => {
                          field.onChange(checked);
                          setTimeout(async () => {
                            const isValid = await trigger('survey.test');
                            if (isValid) {
                              clearErrors('survey.test');
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
    </>
  );
}
