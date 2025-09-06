import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Radio from '@mui/material/Radio';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';

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
        <Field.Phone name="contact_number" label="Contact number" country="CA" />
        <Field.Text name="site_location" label="Site Location*" />
        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
          }}
        >
          <Field.TimePicker
            name="start_time"
            label="Start Time"
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
              },
            }}
          />
          <Field.TimePicker
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

      <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Stack>
          <Typography variant="h4">TCP/LCP Scope of Work</Typography>
        </Stack>
        <Stack>
          <ScopeOfWork />
        </Stack>
      </Stack>

      <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Stack>
          <Typography variant="h4">TCPs/LCTs Present</Typography>
        </Stack>
        <Stack>
          <TcpLctPresent />
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
  return (
    <Stack
      sx={{
        display: 'flex',
        flexDirection: { xs: 'row', sm: 'column' },
        gap: { xs: 2, sm: 1 },
        boxShadow: 3,
        p: 2,
      }}
    >
      <FormControl
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          width: 1,
        }}
        component="fieldset"
        variant="standard"
      >
        <Typography variant="body2" sx={{ width: { xs: 90, sm: 150 } }}>
          Road:
        </Typography>

        <FormGroup
          sx={{
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
          }}
        >
          <FormControlLabel sx={{ flex: 1 }} control={<Checkbox name="city" />} label="City" />
          <FormControlLabel sx={{ flex: 1 }} control={<Checkbox name="rural" />} label="Rural" />
          <FormControlLabel sx={{ flex: 1 }} control={<Checkbox name="hwy" />} label="Hwy" />
          <FormControlLabel sx={{ flex: 1 }} control={<Checkbox name="other" />} label="Other" />
        </FormGroup>
      </FormControl>

      <FormControl
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          width: 1,
        }}
        component="fieldset"
        variant="standard"
      >
        <Typography variant="body2" sx={{ width: { xs: 90, sm: 150 } }}>
          Sight Distance:
        </Typography>

        <FormGroup
          sx={{
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
          }}
        >
          <FormControlLabel sx={{ flex: 1 }} control={<Checkbox name="hill" />} label="Hill" />
          <FormControlLabel sx={{ flex: 1 }} control={<Checkbox name="curve" />} label="Curve" />
          <FormControlLabel
            sx={{ flex: 1 }}
            control={<Checkbox name="obstacle" />}
            label="Obstacle"
          />
          <FormControlLabel sx={{ flex: 1 }} control={<Checkbox name="other" />} label="Other" />
        </FormGroup>
      </FormControl>

      <FormControl
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          width: 1,
        }}
        component="fieldset"
        variant="standard"
      >
        <Typography variant="body2" sx={{ width: { xs: 90, sm: 150 } }}>
          Weather:
        </Typography>

        <FormGroup
          sx={{
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
          }}
        >
          <FormControlLabel sx={{ flex: 1 }} control={<Checkbox name="sunny" />} label="Sunny" />
          <FormControlLabel sx={{ flex: 1 }} control={<Checkbox name="cloudy" />} label="Cloudy" />
          <FormControlLabel sx={{ flex: 1 }} control={<Checkbox name="snow" />} label="Snow" />
          <FormControlLabel sx={{ flex: 1 }} control={<Checkbox name="fog" />} label="Fog" />
          <FormControlLabel sx={{ flex: 1 }} control={<Checkbox name="windy" />} label="Windy" />
          <FormControlLabel sx={{ flex: 1 }} control={<Checkbox name="hot" />} label="Hot" />
          <FormControlLabel sx={{ flex: 1 }} control={<Checkbox name="cold" />} label="Cold" />
          <FormControlLabel sx={{ flex: 1 }} control={<></>} label="" />
        </FormGroup>
      </FormControl>
    </Stack>
  );
};

const ScopeOfWork = () => (
  <Stack
    spacing={2}
    sx={{
      boxShadow: 3,
      p: 2,
    }}
  >
    <FormControl
      sx={{
        display: 'flex',
        flexDirection: { xs: 'row', sm: 'column' },
        alignItems: 'center',
        width: 1,
      }}
      component="fieldset"
      variant="standard"
    >
      <FormGroup
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          width: '100%',
        }}
      >
        <FormControlLabel
          sx={{ flex: 1 }}
          control={<Checkbox name="single_lane" />}
          label="Single Lane Alternating"
        />
        <FormControlLabel
          sx={{ flex: 1 }}
          control={<Checkbox name="lane_closure" />}
          label="Lane Closure"
        />
        <FormControlLabel
          sx={{ flex: 1 }}
          control={<Checkbox name="road_close" />}
          label="Road Closed"
        />
        <FormControlLabel sx={{ flex: 1 }} control={<Checkbox name="other" />} label="Other" />
      </FormGroup>

      <FormGroup
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          width: '100%',
        }}
      >
        <FormControlLabel sx={{ flex: 1 }} control={<Checkbox name="hill" />} label="Hill" />
        <FormControlLabel sx={{ flex: 1 }} control={<Checkbox name="curve" />} label="Curve" />
        <FormControlLabel
          sx={{ flex: 1 }}
          control={<Checkbox name="obstacle" />}
          label="Obstacle"
        />
        <FormControlLabel sx={{ flex: 1 }} control={<Checkbox name="other" />} label="Other" />
      </FormGroup>
    </FormControl>
    <Stack>
      <Field.Text
        name="scope_of_work_contracts"
        label="SCOPE OF WORK/CONTRACTOR"
        multiline
        rows={4}
        fullWidth
      />
    </Stack>
  </Stack>
);

const TcpLctPresent = () => (
  <Stack direction="column" spacing={2}>
    <Stack
      sx={{
        display: 'flex',
        flexDirection: 'row',
        boxShadow: 2,
        width: 1,
        py: 1,
        px: 2,
      }}
    >
      <FormControl
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          width: 1,
        }}
      >
        <Typography variant="body2">Is the escape route identified ?</Typography>
        <RadioGroup
          row
          aria-labelledby="demo-row-radio-buttons-group-label"
          name="row-radio-buttons-group"
          sx={{ justifyContent: 'flex-end', width: 1 }}
        >
          <FormControlLabel value={1} control={<Radio />} label="Yes" />
          <FormControlLabel value={0} control={<Radio />} label="No" />
        </RadioGroup>
      </FormControl>
    </Stack>

    <Stack
      sx={{
        display: 'flex',
        flexDirection: 'row',
        boxShadow: 2,
        width: 1,
        py: 1,
        px: 2,
      }}
    >
      <FormControl
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          width: 1,
        }}
      >
        <Typography variant="body2">Does the speed need be reduce ?</Typography>
        <RadioGroup
          row
          aria-labelledby="demo-row-radio-buttons-group-label"
          name="row-radio-buttons-group"
          sx={{ justifyContent: 'flex-end', width: 1 }}
        >
          <FormControlLabel value={1} control={<Radio />} label="Yes" />
          <FormControlLabel value={0} control={<Radio />} label="No" />
        </RadioGroup>
      </FormControl>
    </Stack>

    <Stack
      sx={{
        display: 'flex',
        flexDirection: 'row',
        boxShadow: 2,
        width: 1,
        py: 1,
        px: 2,
      }}
    >
      <FormControl
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          width: 1,
        }}
      >
        <Typography variant="body2">New LCT/TCP (Less than 2 years of exp) ?</Typography>
        <RadioGroup
          row
          aria-labelledby="demo-row-radio-buttons-group-label"
          name="row-radio-buttons-group"
          sx={{ justifyContent: 'flex-end', width: 1 }}
        >
          <FormControlLabel value={1} control={<Radio />} label="Yes" />
          <FormControlLabel value={0} control={<Radio />} label="No" />
        </RadioGroup>
      </FormControl>
    </Stack>

    <Stack
      sx={{
        display: 'flex',
        flexDirection: 'row',
        boxShadow: 2,
        width: 1,
        py: 1,
        px: 2,
      }}
    >
      <FormControl
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          width: 1,
        }}
      >
        <Typography variant="body2">Do you need to complete a young/new worker form ?</Typography>
        <RadioGroup
          row
          aria-labelledby="demo-row-radio-buttons-group-label"
          name="row-radio-buttons-group"
          sx={{ justifyContent: 'flex-end', width: 1 }}
        >
          <FormControlLabel value={1} control={<Radio />} label="Yes" />
          <FormControlLabel value={0} control={<Radio />} label="No" />
        </RadioGroup>
      </FormControl>
    </Stack>
  </Stack>
);
