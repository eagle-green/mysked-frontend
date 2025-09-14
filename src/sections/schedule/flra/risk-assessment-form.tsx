import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Radio from '@mui/material/Radio';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';

import { Field } from 'src/components/hook-form/fields';

export function RiskAssessmentForm() {
  const { control } = useFormContext();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4">Risk Assessment Form</Typography>
      <Divider sx={{ my: 3, borderStyle: 'dashed' }} />
      <Stack direction="row" alignItems="center" flexWrap="wrap" spacing={2}>
        <Box sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
          <Controller
            control={control}
            name="riskAssessment.visibility"
            render={({ field, fieldState: { error } }) => (
              <FormControl
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  width: 1,
                }}
              >
                <Typography variant="body2" sx={{ width: 1 }}>
                  VISIBILITY
                </Typography>
                <Box sx={{ width: 1 }}>
                  <Field.RadioGroup
                    {...field}
                    row
                    options={[
                      { label: 'LOW', value: 'low' },
                      { label: 'MEDIUM', value: 'medium' },
                      { label: 'HIGH', value: 'high' },
                    ]}
                  />
                </Box>
              </FormControl>
            )}
          />
        </Box>
        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
          <Controller
            control={control}
            name="riskAssessment.lineOfSight"
            render={({ field, fieldState: { error } }) => (
              <FormControl
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  width: 1,
                }}
              >
                <Typography variant="body2" sx={{ width: 1 }}>
                  LINE OF SIGHT
                </Typography>
                <Box sx={{ width: 1 }}>
                  <Field.RadioGroup
                    {...field}
                    row
                    options={[
                      { label: 'LOW', value: 'low' },
                      { label: 'MEDIUM', value: 'medium' },
                      { label: 'HIGH', value: 'high' },
                    ]}
                  />
                </Box>
              </FormControl>
            )}
          />
        </Stack>

        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
          <Controller
            control={control}
            name="riskAssessment.slipAndStrip"
            render={({ field, fieldState: { error } }) => (
              <FormControl
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  width: 1,
                }}
              >
                <Typography variant="body2" sx={{ width: 1 }}>
                  SLIPS AND TRIPS
                </Typography>
                <Box sx={{ width: 1 }}>
                  <Field.RadioGroup
                    {...field}
                    row
                    options={[
                      { label: 'LOW', value: 'low' },
                      { label: 'MEDIUM', value: 'medium' },
                      { label: 'HIGH', value: 'high' },
                    ]}
                  />
                </Box>
              </FormControl>
            )}
          />
        </Stack>

        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
          <Controller
            control={control}
            name="riskAssessment.holes"
            render={({ field, fieldState: { error } }) => (
              <FormControl
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  width: 1,
                }}
              >
                <Typography variant="body2" sx={{ width: 1 }}>
                  FALL/OPEN HOLES
                </Typography>
                <Box sx={{ width: 1 }}>
                  <Field.RadioGroup
                    {...field}
                    row
                    options={[
                      { label: 'LOW', value: 'low' },
                      { label: 'MEDIUM', value: 'medium' },
                      { label: 'HIGH', value: 'high' },
                    ]}
                  />
                </Box>
              </FormControl>
            )}
          />
        </Stack>

        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
          <Controller
            control={control}
            name="riskAssessment.weather"
            render={({ field, fieldState: { error } }) => (
              <FormControl
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  width: 1,
                }}
              >
                <Typography variant="body2" sx={{ width: 1 }}>
                  WEATHER
                </Typography>
                <Box sx={{ width: 1 }}>
                  <Field.RadioGroup
                    {...field}
                    row
                    options={[
                      { label: 'LOW', value: 'low' },
                      { label: 'MEDIUM', value: 'medium' },
                      { label: 'HIGH', value: 'high' },
                    ]}
                  />
                </Box>
              </FormControl>
            )}
          />
        </Stack>

        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
          <Controller
            control={control}
            name="riskAssessment.dust"
            render={({ field, fieldState: { error } }) => (
              <FormControl
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  width: 1,
                }}
              >
                <Typography variant="body2" sx={{ width: 1 }}>
                  DUST
                </Typography>
                <Box sx={{ width: 1 }}>
                  <Field.RadioGroup
                    {...field}
                    row
                    options={[
                      { label: 'LOW', value: 'low' },
                      { label: 'MEDIUM', value: 'medium' },
                      { label: 'HIGH', value: 'high' },
                    ]}
                  />
                </Box>
              </FormControl>
            )}
          />
        </Stack>

        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
          <Controller
            control={control}
            name="riskAssessment.fumes"
            render={({ field, fieldState: { error } }) => (
              <FormControl
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  width: 1,
                }}
              >
                <Typography variant="body2" sx={{ width: 1 }}>
                  FUMES
                </Typography>
                <Box sx={{ width: 1 }}>
                  <Field.RadioGroup
                    {...field}
                    row
                    options={[
                      { label: 'LOW', value: 'low' },
                      { label: 'MEDIUM', value: 'medium' },
                      { label: 'HIGH', value: 'high' },
                    ]}
                  />
                </Box>
              </FormControl>
            )}
          />
        </Stack>

        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
          <Controller
            control={control}
            name="riskAssessment.noise"
            render={({ field, fieldState: { error } }) => (
              <FormControl
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  width: 1,
                }}
              >
                <Typography variant="body2" sx={{ width: 1 }}>
                  EXCESSIVE NOISE
                </Typography>
                <Box sx={{ width: 1 }}>
                  <Field.RadioGroup
                    {...field}
                    row
                    options={[
                      { label: 'LOW', value: 'low' },
                      { label: 'MEDIUM', value: 'medium' },
                      { label: 'HIGH', value: 'high' },
                    ]}
                  />
                </Box>
              </FormControl>
            )}
          />
        </Stack>

        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
          <Controller
            control={control}
            name="riskAssessment.blindSpot"
            render={({ field, fieldState: { error } }) => (
              <FormControl
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  width: 1,
                }}
              >
                <Typography variant="body2" sx={{ width: 1 }}>
                  BLIND SPOTS
                </Typography>
                <Box sx={{ width: 1 }}>
                  <Field.RadioGroup
                    {...field}
                    row
                    options={[
                      { label: 'LOW', value: 'low' },
                      { label: 'MEDIUM', value: 'medium' },
                      { label: 'HIGH', value: 'high' },
                    ]}
                  />
                </Box>
              </FormControl>
            )}
          />
        </Stack>

        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
          <Controller
            control={control}
            name="riskAssessment.overHeadLines"
            render={({ field, fieldState: { error } }) => (
              <FormControl
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  width: 1,
                }}
              >
                <Typography variant="body2" sx={{ width: 1 }}>
                  OVERHEAD LINES
                </Typography>
                <Box sx={{ width: 1 }}>
                  <Field.RadioGroup
                    {...field}
                    row
                    options={[
                      { label: 'LOW', value: 'low' },
                      { label: 'MEDIUM', value: 'medium' },
                      { label: 'HIGH', value: 'high' },
                    ]}
                  />
                </Box>
              </FormControl>
            )}
          />
        </Stack>

        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
          <Controller
            control={control}
            name="riskAssessment.workingAlone"
            render={({ field, fieldState: { error } }) => (
              <FormControl
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  width: 1,
                }}
              >
                <Typography variant="body2" sx={{ width: 1 }}>
                  WORKING ALONE
                </Typography>
                <Box sx={{ width: 1 }}>
                  <Field.RadioGroup
                    {...field}
                    row
                    options={[
                      { label: 'LOW', value: 'low' },
                      { label: 'MEDIUM', value: 'medium' },
                      { label: 'HIGH', value: 'high' },
                    ]}
                  />
                </Box>
              </FormControl>
            )}
          />
        </Stack>

        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
          <Controller
            control={control}
            name="riskAssessment.mobileEquipment"
            render={({ field, fieldState: { error } }) => (
              <FormControl
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  width: 1,
                }}
              >
                <Typography variant="body2" sx={{ width: 1 }}>
                  MOBILE EQUIPEMENT
                </Typography>
                <Box sx={{ width: 1 }}>
                  <Field.RadioGroup
                    {...field}
                    row
                    options={[
                      { label: 'LOW', value: 'low' },
                      { label: 'MEDIUM', value: 'medium' },
                      { label: 'HIGH', value: 'high' },
                    ]}
                  />
                </Box>
              </FormControl>
            )}
          />
        </Stack>

        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
          <Controller
            control={control}
            name="riskAssessment.trafficVolume"
            render={({ field, fieldState: { error } }) => (
              <FormControl
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  width: 1,
                }}
              >
                <Typography variant="body2" sx={{ width: 1 }}>
                  TRAFFIC VOLUMES
                </Typography>
                <Box sx={{ width: 1 }}>
                  <Field.RadioGroup
                    {...field}
                    row
                    options={[
                      { label: 'LOW', value: 'low' },
                      { label: 'MEDIUM', value: 'medium' },
                      { label: 'HIGH', value: 'high' },
                    ]}
                  />
                </Box>
              </FormControl>
            )}
          />
        </Stack>

        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
          <Controller
            control={control}
            name="riskAssessment.conditions"
            render={({ field, fieldState: { error } }) => (
              <FormControl
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  width: 1,
                }}
              >
                <Typography variant="body2" sx={{ width: 1 }}>
                  LIGHTING CONDITIONS
                </Typography>
                <Box sx={{ width: 1 }}>
                  <Field.RadioGroup
                    {...field}
                    row
                    options={[
                      { label: 'LOW', value: 'low' },
                      { label: 'MEDIUM', value: 'medium' },
                      { label: 'HIGH', value: 'high' },
                    ]}
                  />
                </Box>
              </FormControl>
            )}
          />
        </Stack>

        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
          <Controller
            control={control}
            name="riskAssessment.utilities"
            render={({ field, fieldState: { error } }) => (
              <FormControl
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  width: 1,
                }}
              >
                <Typography variant="body2" sx={{ width: 1 }}>
                  UNDERGROUND UTILITIES
                </Typography>
                <Box sx={{ width: 1 }}>
                  <Field.RadioGroup
                    {...field}
                    row
                    options={[
                      { label: 'LOW', value: 'low' },
                      { label: 'MEDIUM', value: 'medium' },
                      { label: 'HIGH', value: 'high' },
                    ]}
                  />
                </Box>
              </FormControl>
            )}
          />
        </Stack>

        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
          <Controller
            control={control}
            name="riskAssessment.fatigue"
            render={({ field, fieldState: { error } }) => (
              <FormControl
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  width: 1,
                }}
              >
                <Typography variant="body2" sx={{ width: 1 }}>
                  FATIGUE
                </Typography>
                <Box sx={{ width: 1 }}>
                  <Field.RadioGroup
                    {...field}
                    row
                    options={[
                      { label: 'LOW', value: 'low' },
                      { label: 'MEDIUM', value: 'medium' },
                      { label: 'HIGH', value: 'high' },
                    ]}
                  />
                </Box>
              </FormControl>
            )}
          />
        </Stack>

        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
          <Controller
            control={control}
            name="riskAssessment.controlMeasure"
            render={({ field, fieldState: { error } }) => (
              <FormControl
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  width: 1,
                }}
              >
                <Typography variant="body2" sx={{ width: 1 }}>
                  CONTROL MEASURE
                </Typography>
                <Box sx={{ width: 1 }}>
                  <Field.RadioGroup
                    {...field}
                    row
                    options={[
                      { label: 'LOW', value: 'low' },
                      { label: 'MEDIUM', value: 'medium' },
                      { label: 'HIGH', value: 'high' },
                    ]}
                  />
                </Box>
              </FormControl>
            )}
          />
        </Stack>

        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
          <Controller
            control={control}
            name="riskAssessment.other"
            render={({ field, fieldState: { error } }) => (
              <FormControl
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  width: 1,
                }}
              >
                <Typography variant="body2" sx={{ width: 1 }}>
                  OTHER
                </Typography>
                <Box sx={{ width: 1 }}>
                  <Field.RadioGroup
                    {...field}
                    row
                    options={[
                      { label: 'LOW', value: 'low' },
                      { label: 'MEDIUM', value: 'medium' },
                      { label: 'HIGH', value: 'high' },
                    ]}
                  />
                </Box>
              </FormControl>
            )}
          />
        </Stack>
      </Stack>
    </Box>
  );
}
