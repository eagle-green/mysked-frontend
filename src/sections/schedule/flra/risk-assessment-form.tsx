
import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Radio from '@mui/material/Radio';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';

export function RiskAssessmentForm() {
  const { control } = useFormContext();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4">Risk Assessment Form</Typography>
      <Divider sx={{ my: 3, borderStyle: 'dashed' }} />
      <Stack direction="row" alignItems="center" flexWrap="wrap" spacing={2}>
        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
          <Controller
           control={control}
           name='riskAssessment'
           render={() => (
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
              <RadioGroup
                row
                aria-labelledby="demo-row-radio-buttons-group-label"
                name="row-radio-buttons-group"
                sx={{ justifyContent: 'flex-start', width: 1 }}
              >
                <FormControlLabel value={1} control={<Radio size="small" />} label="LOW" />
                <FormControlLabel value={2} control={<Radio size="small" />} label="MEDIUM" />
                <FormControlLabel value={3} control={<Radio size="small" />} label="HIGH" />
              </RadioGroup>
          </FormControl>
           )}
            />
        </Stack>
        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
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
            <RadioGroup
              row
              aria-labelledby="demo-row-radio-buttons-group-label"
              name="row-radio-buttons-group"
              sx={{ justifyContent: 'flex-start', width: 1 }}
            >
              <FormControlLabel value={1} control={<Radio />} label="LOW" />
              <FormControlLabel value={2} control={<Radio />} label="MEDIUM" />
              <FormControlLabel value={3} control={<Radio />} label="HIGH" />
            </RadioGroup>
          </FormControl>
        </Stack>
        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
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
            <RadioGroup
              row
              aria-labelledby="demo-row-radio-buttons-group-label"
              name="row-radio-buttons-group"
              sx={{ justifyContent: 'flex-start', width: 1 }}
            >
              <FormControlLabel value={1} control={<Radio />} label="LOW" />
              <FormControlLabel value={2} control={<Radio />} label="MEDIUM" />
              <FormControlLabel value={3} control={<Radio />} label="HIGH" />
            </RadioGroup>
          </FormControl>
        </Stack>
        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
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
            <RadioGroup
              row
              aria-labelledby="demo-row-radio-buttons-group-label"
              name="row-radio-buttons-group"
              sx={{ justifyContent: 'flex-start', width: 1 }}
            >
              <FormControlLabel value={1} control={<Radio />} label="LOW" />
              <FormControlLabel value={2} control={<Radio />} label="MEDIUM" />
              <FormControlLabel value={3} control={<Radio />} label="HIGH" />
            </RadioGroup>
          </FormControl>
        </Stack>
        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
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
            <RadioGroup
              row
              aria-labelledby="demo-row-radio-buttons-group-label"
              name="row-radio-buttons-group"
              sx={{ justifyContent: 'flex-start', width: 1 }}
            >
              <FormControlLabel value={1} control={<Radio />} label="LOW" />
              <FormControlLabel value={2} control={<Radio />} label="MEDIUM" />
              <FormControlLabel value={3} control={<Radio />} label="HIGH" />
            </RadioGroup>
          </FormControl>
        </Stack>
        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
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
            <RadioGroup
              row
              aria-labelledby="demo-row-radio-buttons-group-label"
              name="row-radio-buttons-group"
              sx={{ justifyContent: 'flex-start', width: 1 }}
            >
              <FormControlLabel value={1} control={<Radio />} label="LOW" />
              <FormControlLabel value={2} control={<Radio />} label="MEDIUM" />
              <FormControlLabel value={3} control={<Radio />} label="HIGH" />
            </RadioGroup>
          </FormControl>
        </Stack>
        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
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
            <RadioGroup
              row
              aria-labelledby="demo-row-radio-buttons-group-label"
              name="row-radio-buttons-group"
              sx={{ justifyContent: 'flex-start', width: 1 }}
            >
              <FormControlLabel value={1} control={<Radio />} label="LOW" />
              <FormControlLabel value={2} control={<Radio />} label="MEDIUM" />
              <FormControlLabel value={3} control={<Radio />} label="HIGH" />
            </RadioGroup>
          </FormControl>
        </Stack>
        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
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
            <RadioGroup
              row
              aria-labelledby="demo-row-radio-buttons-group-label"
              name="row-radio-buttons-group"
              sx={{ justifyContent: 'flex-start', width: 1 }}
            >
              <FormControlLabel value={1} control={<Radio />} label="LOW" />
              <FormControlLabel value={2} control={<Radio />} label="MEDIUM" />
              <FormControlLabel value={3} control={<Radio />} label="HIGH" />
            </RadioGroup>
          </FormControl>
        </Stack>
        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
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
            <RadioGroup
              row
              aria-labelledby="demo-row-radio-buttons-group-label"
              name="row-radio-buttons-group"
              sx={{ justifyContent: 'flex-start', width: 1 }}
            >
              <FormControlLabel value={1} control={<Radio />} label="LOW" />
              <FormControlLabel value={2} control={<Radio />} label="MEDIUM" />
              <FormControlLabel value={3} control={<Radio />} label="HIGH" />
            </RadioGroup>
          </FormControl>
        </Stack>
        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
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
            <RadioGroup
              row
              aria-labelledby="demo-row-radio-buttons-group-label"
              name="row-radio-buttons-group"
              sx={{ justifyContent: 'flex-start', width: 1 }}
            >
              <FormControlLabel value={1} control={<Radio />} label="LOW" />
              <FormControlLabel value={2} control={<Radio />} label="MEDIUM" />
              <FormControlLabel value={3} control={<Radio />} label="HIGH" />
            </RadioGroup>
          </FormControl>
        </Stack>
        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
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
            <RadioGroup
              row
              aria-labelledby="demo-row-radio-buttons-group-label"
              name="row-radio-buttons-group"
              sx={{ justifyContent: 'flex-start', width: 1 }}
            >
              <FormControlLabel value={1} control={<Radio />} label="LOW" />
              <FormControlLabel value={2} control={<Radio />} label="MEDIUM" />
              <FormControlLabel value={3} control={<Radio />} label="HIGH" />
            </RadioGroup>
          </FormControl>
        </Stack>
        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
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
            <RadioGroup
              row
              aria-labelledby="demo-row-radio-buttons-group-label"
              name="row-radio-buttons-group"
              sx={{ justifyContent: 'flex-start', width: 1 }}
            >
              <FormControlLabel value={1} control={<Radio />} label="LOW" />
              <FormControlLabel value={2} control={<Radio />} label="MEDIUM" />
              <FormControlLabel value={3} control={<Radio />} label="HIGH" />
            </RadioGroup>
          </FormControl>
        </Stack>
        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
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
            <RadioGroup
              row
              aria-labelledby="demo-row-radio-buttons-group-label"
              name="row-radio-buttons-group"
              sx={{ justifyContent: 'flex-start', width: 1 }}
            >
              <FormControlLabel value={1} control={<Radio />} label="LOW" />
              <FormControlLabel value={2} control={<Radio />} label="MEDIUM" />
              <FormControlLabel value={3} control={<Radio />} label="HIGH" />
            </RadioGroup>
          </FormControl>
        </Stack>
        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
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
            <RadioGroup
              row
              aria-labelledby="demo-row-radio-buttons-group-label"
              name="row-radio-buttons-group"
              sx={{ justifyContent: 'flex-start', width: 1 }}
            >
              <FormControlLabel value={1} control={<Radio />} label="LOW" />
              <FormControlLabel value={2} control={<Radio />} label="MEDIUM" />
              <FormControlLabel value={3} control={<Radio />} label="HIGH" />
            </RadioGroup>
          </FormControl>
        </Stack>
        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
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
            <RadioGroup
              row
              aria-labelledby="demo-row-radio-buttons-group-label"
              name="row-radio-buttons-group"
              sx={{ justifyContent: 'flex-start', width: 1 }}
            >
              <FormControlLabel value={1} control={<Radio />} label="LOW" />
              <FormControlLabel value={2} control={<Radio />} label="MEDIUM" />
              <FormControlLabel value={3} control={<Radio />} label="HIGH" />
            </RadioGroup>
          </FormControl>
        </Stack>
        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
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
            <RadioGroup
              row
              aria-labelledby="demo-row-radio-buttons-group-label"
              name="row-radio-buttons-group"
              sx={{ justifyContent: 'flex-start', width: 1 }}
            >
              <FormControlLabel value={1} control={<Radio />} label="LOW" />
              <FormControlLabel value={2} control={<Radio />} label="MEDIUM" />
              <FormControlLabel value={3} control={<Radio />} label="HIGH" />
            </RadioGroup>
          </FormControl>
        </Stack>
        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
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
            <RadioGroup
              row
              aria-labelledby="demo-row-radio-buttons-group-label"
              name="row-radio-buttons-group"
              sx={{ justifyContent: 'flex-start', width: 1 }}
            >
              <FormControlLabel value={1} control={<Radio />} label="LOW" />
              <FormControlLabel value={2} control={<Radio />} label="MEDIUM" />
              <FormControlLabel value={3} control={<Radio />} label="HIGH" />
            </RadioGroup>
          </FormControl>
        </Stack>
        <Stack sx={{ width: 1, boxShadow: 3, p: 2 }} flex="1 1 30%">
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
            <RadioGroup
              row
              aria-labelledby="demo-row-radio-buttons-group-label"
              name="row-radio-buttons-group"
              sx={{ justifyContent: 'flex-start', width: 1 }}
            >
              <FormControlLabel value={1} control={<Radio />} label="LOW" />
              <FormControlLabel value={2} control={<Radio />} label="MEDIUM" />
              <FormControlLabel value={3} control={<Radio />} label="HIGH" />
            </RadioGroup>
          </FormControl>
        </Stack>
      </Stack>
    </Box>
  );
}
