import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { Field } from 'src/components/hook-form/fields';

export function RiskAssessmentForm() {
  const { control } = useFormContext();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4">Risk Assessment Form</Typography>
      <Divider sx={{ my: 3, borderStyle: 'dashed' }} />
      <Stack direction="column" spacing={1}>
        <Controller
          control={control}
          name="riskAssessment.visibility"
          render={({ field, fieldState: { error } }) => (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                width: 1,
                py: 1,
                px: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ minWidth: '200px', fontWeight: 500 }}>
                VISIBILITY
              </Typography>
              <Field.RadioGroup
                {...field}
                row
                options={[
                  { label: 'HIGH', value: 'high' },
                  { label: 'MEDIUM', value: 'medium' },
                  { label: 'LOW', value: 'low' },
                ]}
              />
            </Box>
          )}
        />
        <Controller
          control={control}
          name="riskAssessment.lineOfSight"
          render={({ field, fieldState: { error } }) => (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                width: 1,
                py: 1,
                px: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ minWidth: '200px', fontWeight: 500 }}>
                LINE OF SIGHT
              </Typography>
              <Field.RadioGroup
                {...field}
                row
                options={[
                  { label: 'HIGH', value: 'high' },
                  { label: 'MEDIUM', value: 'medium' },
                  { label: 'LOW', value: 'low' },
                ]}
              />
            </Box>
          )}
        />

        <Controller
          control={control}
          name="riskAssessment.slipAndStrip"
          render={({ field, fieldState: { error } }) => (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                width: 1,
                py: 1,
                px: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ minWidth: '200px', fontWeight: 500 }}>
                SLIPS AND TRIPS
              </Typography>
              <Field.RadioGroup
                {...field}
                row
                options={[
                  { label: 'HIGH', value: 'high' },
                  { label: 'MEDIUM', value: 'medium' },
                  { label: 'LOW', value: 'low' },
                ]}
              />
            </Box>
          )}
        />

        <Controller
          control={control}
          name="riskAssessment.holes"
          render={({ field, fieldState: { error } }) => (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                width: 1,
                py: 1,
                px: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ minWidth: '200px', fontWeight: 500 }}>
                FALL/OPEN HOLES
              </Typography>
              <Field.RadioGroup
                {...field}
                row
                options={[
                  { label: 'HIGH', value: 'high' },
                  { label: 'MEDIUM', value: 'medium' },
                  { label: 'LOW', value: 'low' },
                ]}
              />
            </Box>
          )}
        />

        <Controller
          control={control}
          name="riskAssessment.weather"
          render={({ field, fieldState: { error } }) => (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                width: 1,
                py: 1,
                px: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ minWidth: '200px', fontWeight: 500 }}>
                WEATHER
              </Typography>
              <Field.RadioGroup
                {...field}
                row
                options={[
                  { label: 'HIGH', value: 'high' },
                  { label: 'MEDIUM', value: 'medium' },
                  { label: 'LOW', value: 'low' },
                ]}
              />
            </Box>
          )}
        />

        <Controller
          control={control}
          name="riskAssessment.dust"
          render={({ field, fieldState: { error } }) => (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                width: 1,
                py: 1,
                px: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ minWidth: '200px', fontWeight: 500 }}>
                DUST
              </Typography>
              <Field.RadioGroup
                {...field}
                row
                options={[
                  { label: 'HIGH', value: 'high' },
                  { label: 'MEDIUM', value: 'medium' },
                  { label: 'LOW', value: 'low' },
                ]}
              />
            </Box>
          )}
        />

        <Controller
          control={control}
          name="riskAssessment.fumes"
          render={({ field, fieldState: { error } }) => (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                width: 1,
                py: 1,
                px: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ minWidth: '200px', fontWeight: 500 }}>
                FUMES
              </Typography>
              <Field.RadioGroup
                {...field}
                row
                options={[
                  { label: 'HIGH', value: 'high' },
                  { label: 'MEDIUM', value: 'medium' },
                  { label: 'LOW', value: 'low' },
                ]}
              />
            </Box>
          )}
        />

        <Controller
          control={control}
          name="riskAssessment.noise"
          render={({ field, fieldState: { error } }) => (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                width: 1,
                py: 1,
                px: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ minWidth: '200px', fontWeight: 500 }}>
                EXCESSIVE NOISE
              </Typography>
              <Field.RadioGroup
                {...field}
                row
                options={[
                  { label: 'HIGH', value: 'high' },
                  { label: 'MEDIUM', value: 'medium' },
                  { label: 'LOW', value: 'low' },
                ]}
              />
            </Box>
          )}
        />

        <Controller
          control={control}
          name="riskAssessment.blindSpot"
          render={({ field, fieldState: { error } }) => (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                width: 1,
                py: 1,
                px: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ minWidth: '200px', fontWeight: 500 }}>
                BLIND SPOTS
              </Typography>
              <Field.RadioGroup
                {...field}
                row
                options={[
                  { label: 'HIGH', value: 'high' },
                  { label: 'MEDIUM', value: 'medium' },
                  { label: 'LOW', value: 'low' },
                ]}
              />
            </Box>
          )}
        />

        <Controller
          control={control}
          name="riskAssessment.overHeadLines"
          render={({ field, fieldState: { error } }) => (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                width: 1,
                py: 1,
                px: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ minWidth: '200px', fontWeight: 500 }}>
                OVERHEAD LINES
              </Typography>
              <Field.RadioGroup
                {...field}
                row
                options={[
                  { label: 'HIGH', value: 'high' },
                  { label: 'MEDIUM', value: 'medium' },
                  { label: 'LOW', value: 'low' },
                ]}
              />
            </Box>
          )}
        />

        <Controller
          control={control}
          name="riskAssessment.workingAlone"
          render={({ field, fieldState: { error } }) => (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                width: 1,
                py: 1,
                px: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ minWidth: '200px', fontWeight: 500 }}>
                WORKING ALONE
              </Typography>
              <Field.RadioGroup
                {...field}
                row
                options={[
                  { label: 'HIGH', value: 'high' },
                  { label: 'MEDIUM', value: 'medium' },
                  { label: 'LOW', value: 'low' },
                ]}
              />
            </Box>
          )}
        />

        <Controller
          control={control}
          name="riskAssessment.mobileEquipment"
          render={({ field, fieldState: { error } }) => (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                width: 1,
                py: 1,
                px: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ minWidth: '200px', fontWeight: 500 }}>
                MOBILE EQUIPEMENT
              </Typography>
              <Field.RadioGroup
                {...field}
                row
                options={[
                  { label: 'HIGH', value: 'high' },
                  { label: 'MEDIUM', value: 'medium' },
                  { label: 'LOW', value: 'low' },
                ]}
              />
            </Box>
          )}
        />

        <Controller
          control={control}
          name="riskAssessment.trafficVolume"
          render={({ field, fieldState: { error } }) => (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                width: 1,
                py: 1,
                px: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ minWidth: '200px', fontWeight: 500 }}>
                TRAFFIC VOLUMES
              </Typography>
              <Field.RadioGroup
                {...field}
                row
                options={[
                  { label: 'HIGH', value: 'high' },
                  { label: 'MEDIUM', value: 'medium' },
                  { label: 'LOW', value: 'low' },
                ]}
              />
            </Box>
          )}
        />

        <Controller
          control={control}
          name="riskAssessment.conditions"
          render={({ field, fieldState: { error } }) => (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                width: 1,
                py: 1,
                px: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ minWidth: '200px', fontWeight: 500 }}>
                LIGHTING CONDITIONS
              </Typography>
              <Field.RadioGroup
                {...field}
                row
                options={[
                  { label: 'HIGH', value: 'high' },
                  { label: 'MEDIUM', value: 'medium' },
                  { label: 'LOW', value: 'low' },
                ]}
              />
            </Box>
          )}
        />

        <Controller
          control={control}
          name="riskAssessment.utilities"
          render={({ field, fieldState: { error } }) => (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                width: 1,
                py: 1,
                px: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ minWidth: '200px', fontWeight: 500 }}>
                UNDERGROUND UTILITIES
              </Typography>
              <Field.RadioGroup
                {...field}
                row
                options={[
                  { label: 'HIGH', value: 'high' },
                  { label: 'MEDIUM', value: 'medium' },
                  { label: 'LOW', value: 'low' },
                ]}
              />
            </Box>
          )}
        />

        <Controller
          control={control}
          name="riskAssessment.fatigue"
          render={({ field, fieldState: { error } }) => (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                width: 1,
                py: 1,
                px: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ minWidth: '200px', fontWeight: 500 }}>
                FATIGUE
              </Typography>
              <Field.RadioGroup
                {...field}
                row
                options={[
                  { label: 'HIGH', value: 'high' },
                  { label: 'MEDIUM', value: 'medium' },
                  { label: 'LOW', value: 'low' },
                ]}
              />
            </Box>
          )}
        />

        <Controller
          control={control}
          name="riskAssessment.controlMeasure"
          render={({ field, fieldState: { error } }) => (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                width: 1,
                py: 1,
                px: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ minWidth: '200px', fontWeight: 500 }}>
                CONTROL MEASURE
              </Typography>
              <Field.RadioGroup
                {...field}
                row
                options={[
                  { label: 'HIGH', value: 'high' },
                  { label: 'MEDIUM', value: 'medium' },
                  { label: 'LOW', value: 'low' },
                ]}
              />
            </Box>
          )}
        />

        <Controller
          control={control}
          name="riskAssessment.other"
          render={({ field, fieldState: { error } }) => (
            <Box sx={{ width: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  width: 1,
                  py: 1,
                  px: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" sx={{ minWidth: '200px', fontWeight: 500 }}>
                  OTHER
                </Typography>
                <Field.RadioGroup
                  {...field}
                  row
                  options={[
                    { label: 'HIGH', value: 'high' },
                    { label: 'MEDIUM', value: 'medium' },
                    { label: 'LOW', value: 'low' },
                  ]}
                />
              </Box>
              {field.value && (
                <Box 
                  sx={{ 
                    px: 2, 
                    py: 2, 
                    backgroundColor: 'grey.50',
                    borderBottom: 1,
                    borderColor: 'divider',
                    borderLeft: 3,
                    borderLeftColor: 'primary.main',
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                    Please specify the other risk:
                  </Typography>
                  <Field.Text
                    name="riskAssessment.otherDescription"
                    placeholder="Describe the specific risk..."
                    fullWidth
                    multiline
                    rows={2}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'background.paper',
                      }
                    }}
                  />
                </Box>
              )}
            </Box>
          )}
        />
      </Stack>
    </Box>
  );
}
