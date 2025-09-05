import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';

import { Field } from 'src/components/hook-form/fields';

export function AssessmentDetailForm() {
  return (
    <>
      <Stack>
        <Typography variant="h4">Assessment Detail Form</Typography>
      </Stack>
      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
        }}
      >
        <Field.Text name="name" label="Name*" />
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
        <Field.Text name="site_foreman_name" label="SITE FOREMAN NAME*" />
        <Field.Text name="contact_number" label="Contact Number*" />
        <Field.Text name="site_location" label="Contact Number*" />
        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
          }}
        >
          <Field.DatePicker
            name="start_time"
            label="Start Time"
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
              },
            }}
          />
          <Field.DatePicker
            name="end_time"
            label="End Time"
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
              },
            }}
          />
        </Box>
        <Field.Text name="first_aid_on_site" label="First Aid On Site*" />
        <Field.Text name="first_aid_kit" label="First Aid Kit*" />
      </Box>
      <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Stack>
          <Typography variant="h4"> Description of Work</Typography>
        </Stack>
        <Stack>
          <DescriptionOfWorkForm />
        </Stack>
      </Stack>
    </>
  );
}

//-----------------------------------

const DescriptionOfWorkForm = () => {
  const [road, setRoad] = useState(null);
  const [sight, setSight] = useState(null);
  const [weather, setWeather] = useState(null);
  const handleRoadChange = (value: any) => {
    setRoad(value === road ? null : value); // toggle off if clicked again
  };
  const handleSightChange = (value: any) => {
    setSight(value === sight ? null : value); // toggle off if clicked again
  };
  const handleWeatherChange = (value: any) => {
    setWeather(value === weather ? null : value); // toggle off if clicked again
  };
  return (
    <>
      <Stack
        sx={{
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
        }}
      >
        <Typography variant="caption" sx={{ flex: 1 }}>
          Road:
        </Typography>

        <Stack sx={{ flex: 5, flexDirection: 'row', alignItems: 'center', width: '100%' }}>
          {['city', 'rural', 'hwy', 'other'].map((val) => (
            <Stack key={val} sx={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <Checkbox
                size="small"
                checked={road === val}
                onChange={() => handleRoadChange(val)}
              />
              <Typography variant="caption">
                {val.charAt(0).toUpperCase() + val.slice(1)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
      <Stack
        sx={{
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
        }}
      >
        <Typography variant="caption" sx={{ flex: 1 }}>
          Sight Distance:
        </Typography>

        <Stack sx={{ flex: 5, flexDirection: 'row', alignItems: 'center', width: '100%' }}>
          {['hill', 'curve', 'obstacle', 'other'].map((val) => (
            <Stack key={val} sx={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <Checkbox
                size="small"
                checked={sight === val}
                onChange={() => handleSightChange(val)}
              />
              <Typography variant="caption">
                {val.charAt(0).toUpperCase() + val.slice(1)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
      <Stack
        sx={{
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
        }}
      >
        <Typography variant="caption" sx={{ flex: 1 }}>
          Weather:
        </Typography>

        <Stack sx={{ flex: 5, flexDirection: 'row', alignItems: 'center', width: '100%' }}>
          {['sunny', 'cloudy', 'snow', 'fog'].map((val) => (
            <Stack key={val} sx={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <Checkbox
                size="small"
                checked={weather === val}
                onChange={() => handleWeatherChange(val)}
              />
              <Typography variant="caption">
                {val.charAt(0).toUpperCase() + val.slice(1)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
      <Stack
        sx={{
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
        }}
      >
        <Typography variant="caption" sx={{ flex: 1 }} />
        <Stack sx={{ flex: 5, flexDirection: 'row', alignItems: 'center', width: '100%' }}>
          {['windy', 'hot', 'cold', ''].map((val) => (
            <Stack key={val} sx={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              {val && (
                <>
                  <Checkbox
                    size="small"
                    checked={weather === val}
                    onChange={() => handleWeatherChange(val)}
                  />
                  <Typography variant="caption">
                    {val.charAt(0).toUpperCase() + val.slice(1)}
                  </Typography>
                </>
              )}
            </Stack>
          ))}
        </Stack>
      </Stack>
    </>
  );
};
