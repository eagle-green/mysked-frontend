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

export function EmploymentEquityQuestionForm() {
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
        <Typography variant="h4">Employment Equity Questions</Typography>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Typography variant="body1">
        For the purpose of employment equity, please answer the following questions:
      </Typography>
      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(1, 1fr)' },
        }}
      >
        <Stack>
          <Typography variant="subtitle1">
            <strong>1. GENDER</strong>
          </Typography>
          <Typography variant="body1" sx={{ p: 1 }}>
            What is your Gender?
          </Typography>
          <Stack
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: 1,
              py: 1,
              px: 1,
            }}
          >
            <Controller
              control={control}
              name="gender"
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
                      { label: 'Prefer not to say', value: 'other' },
                    ]}
                  />
                </Box>
              )}
            />
          </Stack>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">
            <strong>2. ABORIGINAL PERSONS</strong>
          </Typography>
          <Typography variant="body1" sx={{ p: 1 }}>
            Aboriginal peoples are those who identify as First Nations (Status, non-Status, Treaty),
            Metis, Inuit, or North American Indian. Do you consider yourself an Aboriginal person?
          </Typography>
          <Stack
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: 1,
              py: 1,
              px: 1,
            }}
          >
            <Controller
              control={control}
              name="aboriginal"
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

        <Stack>
          <Typography variant="subtitle1">
            <strong>3. VISIBLE MINORITY</strong>
          </Typography>
          <Typography variant="body1" sx={{ p: 1 }}>
            Members of visible minorities are persons in Canada (other than Aboriginal peoples) who
            are non white, regardless of place of birth or citizenship. Do you self-identify as a{' '}
            <strong>{`"visible minority"`}</strong> ?
          </Typography>
          <Stack
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: 1,
              py: 1,
              px: 1,
            }}
          >
            <Controller
              control={control}
              name="aboriginal"
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

        <Stack>
          <Typography variant="subtitle1">
            <strong>
              4. EG is dedicated to supporting social well-being in the communities in which we
              work. Would you be willing to participate in events that will help EG strengthen its
              commitment to diversity?
            </strong>
          </Typography>
          <Typography variant="body1" sx={{ p: 1 }}>
            If you choose to participate in certain events, Employee Services may ask you to attend
            and help. Your participation is voluntary
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">
            <strong>
              5. Some projects require members/ employees from a specific aboriginal nation to work
              on the project. Would you be interested in being considered for these opportunities?
            </strong>
          </Typography>
          <Stack
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: 1,
              py: 1,
              px: 1,
            }}
          >
            <Controller
              control={control}
              name="opportunities"
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

      <Field.Text
        name="nation"
        label="If yes, please tell us your Nation?"
        multiline
        rows={2}
        fullWidth
      />
    </>
  );
}
