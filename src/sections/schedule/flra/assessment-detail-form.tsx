import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Radio from '@mui/material/Radio';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import FormGroup from '@mui/material/FormGroup';
import InputLabel from '@mui/material/InputLabel';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';

import { Field } from 'src/components/hook-form/fields';

import { useAuthContext } from 'src/auth/hooks';

export function AssessmentDetailForm() {
  const { user } = useAuthContext();
  return (
    <>
      <Stack>
        <Typography variant="h4">Assessment Detail Form</Typography>
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
        <Field.Text name="full_name" label="Name*" value={user?.displayName ?? null} disabled />
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
        <Divider sx={{ borderStyle: 'dashed' }} />
        <Stack>
          <DescriptionOfWorkForm />
        </Stack>
      </Stack>

      <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Stack>
          <Typography variant="h4">TCP/LCP Scope of Work</Typography>
        </Stack>
        <Divider sx={{ borderStyle: 'dashed' }} />
        <Stack>
          <ScopeOfWork />
        </Stack>
      </Stack>

      <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Stack>
          <Typography variant="h4">TCPs/LCTs Present</Typography>
        </Stack>
        <Divider sx={{ borderStyle: 'dashed' }} />
        <Stack>
          <TcpLctPresent />
        </Stack>
      </Stack>
    </>
  );
}

//-----------------------------------

const DescriptionOfWorkForm = () => {
  const WEATHER_OPTIONS = [
    { label: 'Sunny', value: 'sunny' },
    { label: 'Cloudy', value: 'cloudy' },
    { label: 'Snow', value: 'snow' },
    { label: 'Fog', value: 'fog' },
    { label: 'Windy', value: 'windy' },
    { label: 'Hot', value: 'hot' },
    { label: 'Cold', value: 'cold' },
  ];
  const [weather, setWeather] = useState<string[]>([]);
  const ROAD_OPTIONS = [
    { value: 'city', label: 'City' },
    { value: 'rural', label: 'Rura' },
    { value: 'hwy', label: 'Hwy' },
    { value: 'other', label: 'Other' },
  ];
  const DISTANCE_OPTIONS = [
    { value: 'hill', label: 'Hill' },
    { value: 'curve', label: 'Curve' },
    { value: 'obstacle', label: 'Obstacle' },
    { value: 'other', label: 'Other' },
  ];
  const handleChange = (event: SelectChangeEvent<typeof weather>) => {
    const {
      target: { value },
    } = event;
    setWeather(typeof value === 'string' ? value.split(',') : value);
  };
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <Box sx={{ width: 1 }}>
        <Field.Select name="descriptionOfWork.road" label="Road" placeholder="Select rating">
          {ROAD_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              <Box>
                <Typography variant="body2">{option.label}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Field.Select>
      </Box>
      <Box sx={{ width: 1 }}>
        <Field.Select name="punctuality" label="Punctuality" placeholder="Select rating">
          {DISTANCE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              <Box>
                <Typography variant="body2">{option.label}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Field.Select>
      </Box>
      <Box sx={{ width: 1 }}>
        <FormControl sx={{ width: 1 }}>
          <InputLabel id="demo-multiple-checkbox-label">Tag</InputLabel>
          <Select
            labelId="demo-multiple-checkbox-label"
            id="demo-multiple-checkbox"
            multiple
            value={weather}
            onChange={handleChange}
            input={<OutlinedInput label="Tag" />}
            renderValue={(selected) => selected.join(', ')}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 250,
                  width: 250,
                },
              },
            }}
          >
            {WEATHER_OPTIONS.map((w) => (
              <MenuItem key={w.value} value={w.value}>
                <Checkbox checked={weather.includes(w.value)} />
                <ListItemText primary={w.label} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
    // <Stack
    //   sx={{
    //     display: 'flex',
    //     flexDirection: { xs: 'row', sm: 'column' },
    //     gap: { xs: 2, sm: 1 },
    //     boxShadow: 3,
    //     p: 2,
    //   }}
    // >
    //   <Box>
    //     <Controller
    //       name="descriptionOfWork.road"
    //       control={control}
    //       render={({ field, fieldState: { error } }) => (
    //         <FormControl
    //           sx={{
    //             display: 'flex',
    //             flexDirection: { xs: 'column', sm: 'row' },
    //             alignItems: { xs: 'flex-start', sm: 'center' },
    //             width: 1,
    //           }}
    //         >
    //           <Typography variant="body2" sx={{ width: { xs: 90, sm: 150 } }}>
    //             Road:
    //           </Typography>
    //           <RadioGroup
    //             {...field}
    //             row
    //             aria-labelledby="demo-row-radio-buttons-group-label"
    //             sx={{ justifyContent: 'flex-start', width: 1 }}
    //           >
    //             <FormControlLabel sx={{ flex: 1 }} value="city" control={<Radio />} label="City" />
    //             <FormControlLabel
    //               sx={{ flex: 1 }}
    //               value="rural"
    //               control={<Radio />}
    //               label="Rural"
    //             />
    //             <FormControlLabel sx={{ flex: 1 }} value="hwy" control={<Radio />} label="Hwy" />
    //             <FormControlLabel
    //               sx={{ flex: 1 }}
    //               value="other"
    //               control={<Radio />}
    //               label="Other"
    //             />
    //           </RadioGroup>
    //         </FormControl>
    //       )}
    //     />
    //   </Box>

    //   <Box>
    //     <Controller
    //       name="descriptionOfWork.distance"
    //       control={control}
    //       render={({ field, fieldState: { error } }) => (
    //         <FormControl
    //           sx={{
    //             display: 'flex',
    //             flexDirection: { xs: 'column', sm: 'row' },
    //             alignItems: { xs: 'flex-start', sm: 'center' },
    //             width: 1,
    //           }}
    //         >
    //           <Typography variant="body2" sx={{ width: { xs: 90, sm: 150 } }}>
    //             Sight Distance:
    //           </Typography>
    //           <RadioGroup
    //             {...field}
    //             row
    //             aria-labelledby="demo-row-radio-buttons-group-label"
    //             sx={{ justifyContent: 'flex-start', width: 1 }}
    //           >
    //             <FormControlLabel sx={{ flex: 1 }} value="hill" control={<Radio />} label="Hill" />
    //             <FormControlLabel
    //               sx={{ flex: 1 }}
    //               value="curve"
    //               control={<Radio />}
    //               label="Curve"
    //             />
    //             <FormControlLabel
    //               sx={{ flex: 1 }}
    //               value="obstacle"
    //               control={<Radio />}
    //               label="Obstacle"
    //             />
    //             <FormControlLabel
    //               sx={{ flex: 1 }}
    //               value="other"
    //               control={<Radio />}
    //               label="Other"
    //             />
    //           </RadioGroup>
    //         </FormControl>
    //       )}
    //     />
    //   </Box>

    //   <Box
    //     sx={{
    //       display: 'flex',
    //       flexDirection: { xs: 'column', sm: 'row' },
    //       alignItems: { xs: 'flex-start', sm: 'center' },
    //       width: 1,
    //     }}
    //   >
    //     <Typography variant="body2" sx={{ width: { xs: 90, sm: 150 } }}>
    //       Weather:
    //     </Typography>
    //     <FormControl
    //       sx={{
    //         display: 'flex',
    //         flexDirection: { xs: 'column', sm: 'row' },
    //         alignItems: { xs: 'flex-start', sm: 'center' },
    //         justifyContent: 'flex-start',
    //         width: 1,
    //       }}
    //     >
    //       <Stack flex={1}>
    //         <Field.Checkbox name="descriptionOfWork.weather.sunny" label="Sunny" />
    //       </Stack>
    //       <Stack flex={1}>
    //         <Field.Checkbox name="descriptionOfWork.weather.cloudy" label="Cloudy" />
    //       </Stack>
    //       <Stack flex={1}>
    //         <Field.Checkbox name="descriptionOfWork.weather.snow" label="Snow" />
    //       </Stack>
    //       <Stack flex={1}>
    //         <Field.Checkbox name="descriptionOfWork.weather.fog" label="Fog" />
    //       </Stack>
    //       <Stack flex={1}>
    //         <Field.Checkbox name="descriptionOfWork.weather.windy" label="Windy" />
    //       </Stack>
    //       <Stack flex={1}>
    //         <Field.Checkbox name="descriptionOfWork.weather.hot" label="Hot" />
    //       </Stack>
    //       <Stack flex={1}>
    //         <Field.Checkbox name="descriptionOfWork.weather.cold" label="Sunny" />
    //       </Stack>
    //     </FormControl>
    //   </Box>
    // </Stack>
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
        <Typography variant="body2" sx={{ width: 1 }}>
          Is the escape route identified ?
        </Typography>
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
        <Typography variant="body2" sx={{ width: 1 }}>
          Does the speed need be reduce ?
        </Typography>
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
        <Typography variant="body2" sx={{ width: 1 }}>
          New LCT/TCP (Less than 2 years of exp) ?
        </Typography>
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
        <Typography variant="body2" sx={{ width: 1 }}>
          Do you need to complete a young/new worker form ?
        </Typography>
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
