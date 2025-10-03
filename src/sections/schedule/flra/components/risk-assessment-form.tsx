import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { Field } from 'src/components/hook-form/fields';

// Risk assessment field configuration
const RISK_FIELDS = [
  { name: 'visibility', label: 'VISIBILITY', required: true },
  { name: 'lineOfSight', label: 'LINE OF SIGHT', required: true },
  { name: 'slipAndStrip', label: 'SLIPS AND TRIPS', required: true },
  { name: 'holes', label: 'FALL/OPEN HOLES', required: true },
  { name: 'weather', label: 'WEATHER', required: true },
  { name: 'dust', label: 'DUST', required: true },
  { name: 'fumes', label: 'FUMES', required: true },
  { name: 'noise', label: 'EXCESSIVE NOISE', required: true },
  { name: 'blindSpot', label: 'BLIND SPOTS', required: true },
  { name: 'overHeadLines', label: 'OVERHEAD LINES', required: true },
  { name: 'workingAlone', label: 'WORKING ALONE', required: true },
  { name: 'mobileEquipment', label: 'MOBILE EQUIPEMENT', required: true },
  { name: 'trafficVolume', label: 'TRAFFIC VOLUMES', required: true },
  { name: 'conditions', label: 'LIGHTING CONDITIONS', required: true },
  { name: 'utilities', label: 'UNDERGROUND UTILITIES', required: true },
  { name: 'fatigue', label: 'FATIGUE', required: true },
  { name: 'controlMeasure', label: 'CONTROL MEASURE', required: true },
];

const RISK_OPTIONS = [
  { label: 'HIGH', value: 'high' },
  { label: 'MEDIUM', value: 'medium' },
  { label: 'LOW', value: 'low' },
];

export function RiskAssessmentForm() {
  const { control } = useFormContext();
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4">Risk Assessment Form</Typography>
      <Divider sx={{ my: 3, borderStyle: 'dashed' }} />
      <Stack direction="column" spacing={1}>
        {/* Render all required risk fields */}
        {RISK_FIELDS.map((field) => (
          <Box
            key={field.name}
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: { xs: 1, sm: 2 },
              width: 1,
              py: 1,
              px: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" sx={{ minWidth: { xs: 'auto', sm: '200px' }, fontWeight: 500 }}>
              {field.label}
            </Typography>
            <Field.RadioGroup
              name={`riskAssessment.${field.name}`}
              row
              options={RISK_OPTIONS}
            />
          </Box>
        ))}

        {/* OTHER field - optional, no validation */}
        <Controller
          control={control}
          name="riskAssessment.other"
          render={({ field, fieldState: { error } }) => (
            <Box sx={{ width: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: { xs: 1, sm: 2 },
                  width: 1,
                  py: 1,
                  px: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" sx={{ minWidth: { xs: 'auto', sm: '200px' }, fontWeight: 500 }}>
                  OTHER
                </Typography>
                <Field.RadioGroup
                  {...field}
                  row
                  options={RISK_OPTIONS}
                />
              </Box>
              {field.value && (
                <Box 
                  sx={{ 
                    px: 2, 
                    py: 2, 
                    backgroundColor: 'background.paper',
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
