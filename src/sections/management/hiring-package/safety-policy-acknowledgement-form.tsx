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

export function SafetyPolicyAcknowledgementForm() {
  const { user } = useAuthContext();
  const {
    control,
    watch,
    formState: { errors },
    trigger,
    clearErrors,
    getValues,
  } = useFormContext();

  const { full_name } = watch();

  return (
    <>
      <Stack>
        <Typography variant="h4">Safety Protocols</Typography>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />

      <Field.Text name="full_name" label="Employee Name" required />

      <Card
        sx={{
          p: 2,
          mb: 3,
          bgcolor: 'primary.lighter',
          borderLeft: 5,
          borderColor: 'primary.dark',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <Typography variant="body1" color="primary.dark">
          I, {full_name}, acknowledge receipt of the following package provided by Eagle Green to
          ensure that safe work practices are implemented and adhered to.
        </Typography>
        <Typography variant="body1" color="primary.dark">
          I understand that safe work practices are detailed methods outlining how to perform tasks
          with minimal risk to people, equipment, materials, the environment, and processes. I
          recognize that these protocols are established to ensure my safety and well-being while on
          the job.
        </Typography>

        <Typography variant="body1" color="primary.dark">
          Additionally, I acknowledge that I have received and reviewed a copy of the Eagle Green
          Safety Manual. I understand and agree to abide by the policies and procedures outlined
          therein to maintain a safe working environment.
        </Typography>

        <Typography variant="body1" color="primary.dark">
          I further acknowledge that Eagle Green is officially COR-certified, and it is my
          responsibility to ensure that daily operations comply with COR standards.
        </Typography>
      </Card>

      <Stack>
        <Typography variant="h4">Company Rules</Typography>
      </Stack>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Stack>
        <Typography variant="subtitle1">
          Eaglegreen employees are required to familiarize themselves with the Health and Safety
          rules and Company rules and procedures.
        </Typography>
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
            Employees working on the road must ensure PPE (personal protective equipment) is worn at
            all times. Failure to do so will result in a verbal written warning.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">PPE consists of :</Typography>
          <Box sx={{ px: 2 }}>
            <li>
              <Typography>Hard Hat (Orange/Yellow)</Typography>
            </li>
            <li>
              <Typography>Ankle Bands</Typography>
            </li>
            <li>
              <Typography>Wrist Bands</Typography>
            </li>
            <li>
              <Typography>Vest</Typography>
            </li>
            <li>
              <Typography>Paddle</Typography>
            </li>
            <li>
              <Typography>Safety Steel Boots</Typography>
            </li>
          </Box>
        </li>
        <li>
          <Typography variant="body1">
            Bullying and Harassment are strongly prohibited at Eaglegreen.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Employees are not permitted to use any electronic devices or headsets while working on
            the road. In cases of emergency, speak to LCT & Foremen and step aside, where you or
            others are not in danger.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            LCTs are responsible for the tidiness of their trucks.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Any unauthorized driving and fuel charges are subject to verbal warnings and deductions.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            LCTs are to understand other Eaglegreen employees may use their company trucks for
            breaks or a place to store personal belongings in times where needed. Working on the
            road has its challenges and working together, and ensuring each other`s wellbeing is
            important.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            LCTs need to ensure all set-ups are as per MOT Manual set-ups as it`s a government
            requirement.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Employees are responsible for reporting all incidents or near-miss incidents to the
            office and supervisors.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Keep their work areas clean and tidy, free of hazards that could cause slips, trips, or
            falls.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Co-operate fully with any investigations regarding Health & Safety carried out by EG
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Immediately address all identified or potential hazards. Where this is not possible,
            they must report the situation to their field supervisor or dispatch.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Right to refuse work - stop any work activity where an unsafe working condition is
            identified and ensure that this is corrected before work is allowed to restart. Any such
            action shall be reported to the office and supervisors.
          </Typography>
        </li>
      </Card>

      <Stack>
        <Typography variant="h4">Motive Cameras</Typography>
      </Stack>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Stack spacing={2} direction="column">
        <Typography variant="body1">
          Eaglegreen has installed new MotiveCameras to ensure the safety of all of our staff.
        </Typography>
        <Typography variant="body1">
          Motivecameras is to protect our business with accurate, real-time driver coaching and
          accident detection, on-the-spot exoneration evidence, and privacy protection.
        </Typography>

        <Typography variant="body1">
          Motive’s AI detects unsafe behaviors like cell phone use and close following with fewer
          false positives, alerting drivers in real-time. That means fewer accidents for the safety
          of our staff.
        </Typography>

        <Typography variant="body1">
          Advanced collision detection alerts managers of accidents with leading accuracy and speed.
          Motive’s latest model excels at catching severe collisions, such as jack-knifes and
          rollovers, enabling managers to quickly help drivers and kick off the insurance process.
        </Typography>

        <Typography variant="body1">
          As stated in the hiring package, the purpose of this policy is to ensure all employees
          understand the acceptable usage of GPS and the information provided by it.
        </Typography>

        <Typography variant="body1">
          While GPS information will be used on a daily basis and reviewed on a continuous basis it
          will not be used for the following reasons:
        </Typography>
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
            Employees working on the road must ensure PPE (personal protective equipment) is worn at
            all times. Failure to do so will result in a verbal written warning.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Bullying and Harassment are strongly prohibited at Eaglegreen.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Employees are not permitted to use any electronic devices or headsets while working on
            the road. In cases of emergency, speak to LCT & Foremen and step aside, where you or
            others are not in danger.
          </Typography>
        </li>
      </Card>

      <Card
        sx={{
          p: 2,
          mb: 3,
          bgcolor: 'warning.lighter',
          borderLeft: 5,
          borderColor: 'warning.dark',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <Typography variant="body1" color="warning.dark">
          As per new company rules, Motive cameras are not to be covered for any reason. HD video
          footage may be your only eyewitness when in an accident. Eaglegreen will use dashcam video
          to prove innocence and defend against litigation. Eaglegreen only has access to video
          footage when requested for safety purposes.
        </Typography>
      </Card>

      <Stack>
        <Typography variant="body1" color="text.disabled">
          By signing below, you acknowledge understanding and agreement to all the policies listed
          aboved.
        </Typography>
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
            gridTemplateColumns: 'repeat(1, 1fr)',
          }}
        >
          {[
            {
              value: 'yes',
              label:
                'I acknowledge and agree that my electric signature is the legally binding equivalent of my handwritten signature on this document',
            },
          ]
            .filter((opt) => opt.value)
            .map((option) => (
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
                  name={`acknowledgment.test.${option.value}`}
                  control={control}
                  render={({ field }) => (
                    <Field.Checkbox
                      name={`acknowledgment.test.${option.value}`}
                      label={option.label}
                      slotProps={{
                        checkbox: {
                          onChange: async (e, checked) => {
                            field.onChange(checked);
                            setTimeout(async () => {
                              const isValid = await trigger('acknowledgment.test');
                              if (isValid) {
                                clearErrors('acknowledgment.test');
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
