import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import Select, { SelectChangeEvent } from '@mui/material/Select';

import { Field } from 'src/components/hook-form/fields';

export function AssessmentDetailForm() {
  const SCOPE_OF_WORK_OPTIONS = [
    { label: 'Single Lane Alternating', value: 'alternating' },
    { label: 'Lane Closure', value: 'closure' },
    { label: 'Road Closed', value: 'close' },
    { label: 'Shoulder Work', value: 'work' },
    { label: 'Turn Lane Closure', value: 'turn' },
    { label: 'Showing Traffic', value: 'traffic' },
    { label: 'Other', value: 'other' },
  ];
  const WEATHER_OPTIONS = [
    { label: 'Sunny', value: 'sunny' },
    { label: 'Cloudy', value: 'cloudy' },
    { label: 'Snow', value: 'snow' },
    { label: 'Fog', value: 'fog' },
    { label: 'Windy', value: 'windy' },
    { label: 'Hot', value: 'hot' },
    { label: 'Cold', value: 'cold' },
  ];
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
  const [scopeOfWork, setScopeOfWork] = useState<string[]>([]);
  const { control, setValue } = useFormContext();

  const handleChange = (event: SelectChangeEvent<typeof scopeOfWork>) => {
    const {
      target: { value, name },
    } = event;
    setScopeOfWork(typeof value === 'string' ? value.split(',') : value);
    setValue(name, value);
  };
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
        <Field.Text name="full_name" label="Name" disabled />
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
          <Typography variant="h4">TCPs/LCTs Present</Typography>
        </Stack>
        <Divider sx={{ borderStyle: 'dashed' }} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box sx={{ width: 1 }}>
            <Field.Select name="descriptionOfWork.road" label="Road">
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
            <Field.Select name="descriptionOfWork.distance" label="Sight Distance">
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
            <Field.Select name="descriptionOfWork.weather" label="Weather">
              {WEATHER_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box>
                    <Typography variant="body2">{option.label}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Field.Select>
          </Box>
        </Box>
      </Stack>

      <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Stack>
          <Typography variant="h4">TCP/LCP Scope of Work</Typography>
        </Stack>
        <Divider sx={{ borderStyle: 'dashed' }} />
        <Stack spacing={2}>
          <Box sx={{ width: { xs: 1, md: '50%' } }}>
            <Controller
              name="scopeOfWork.roadType"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <FormControl sx={{ width: 1 }}>
                  <InputLabel id="multiple-checkbox-label">Weather</InputLabel>
                  <Select
                    {...field}
                    multiple
                    onChange={handleChange}
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
                    {SCOPE_OF_WORK_OPTIONS.map((w, index) => (
                      <MenuItem key={index} value={w.value}>
                        <Checkbox checked={scopeOfWork.includes(w.value)} />
                        <ListItemText primary={w.label} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Box>
          <Stack>
            <Field.Text
              name="scopeOfWork.contractToolBox"
              label="SCOPE OF WORK/CONTRACTOR"
              multiline
              rows={4}
              fullWidth
            />
          </Stack>
        </Stack>
      </Stack>

      <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Stack>
          <Typography variant="h4">TCPs/LCTs Present</Typography>
        </Stack>
        <Divider sx={{ borderStyle: 'dashed' }} />
        <Stack>
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
              <Controller
                control={control}
                name="present.identified"
                render={({ field, fieldState: { error } }) => (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      justifyContent: 'space-between',
                      width: 1,
                    }}
                  >
                    <Typography variant="body2">Is the escape route identified ?</Typography>
                    <Field.RadioGroup
                      {...field}
                      row
                      sx={{ width: 1 }}
                      options={[
                        { label: 'Yes', value: 'yes' },
                        { label: 'No', value: 'no' },
                      ]}
                    />
                  </Box>
                )}
              />
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
              <Controller
                control={control}
                name="present.reduce"
                render={({ field, fieldState: { error } }) => (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      justifyContent: 'space-between',
                      width: 1,
                    }}
                  >
                    <Typography variant="body2">Does the speed need be reduce ?</Typography>
                    <Field.RadioGroup
                      {...field}
                      row
                      sx={{ width: 1 }}
                      options={[
                        { label: 'Yes', value: 'yes' },
                        { label: 'No', value: 'no' },
                      ]}
                    />
                  </Box>
                )}
              />
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
              <Controller
                control={control}
                name="present.new"
                render={({ field, fieldState: { error } }) => (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      justifyContent: 'space-between',
                      width: 1,
                    }}
                  >
                    <Typography variant="body2">
                      New LCT/TCP (Less than 2 years of exp) ?
                    </Typography>
                    <Field.RadioGroup
                      {...field}
                      row
                      sx={{ width: 1 }}
                      options={[
                        { label: 'Yes', value: 'yes' },
                        { label: 'No', value: 'no' },
                      ]}
                    />
                  </Box>
                )}
              />
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
              <Controller
                control={control}
                name="present.complete"
                render={({ field, fieldState: { error } }) => (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      justifyContent: 'space-between',
                      width: 1,
                    }}
                  >
                    <Typography variant="body2">
                      Do you need to complete a young/new worker form ?
                    </Typography>
                    <Field.RadioGroup
                      {...field}
                      row
                      sx={{ width: 1 }}
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
        </Stack>
      </Stack>
    </>
  );
}
