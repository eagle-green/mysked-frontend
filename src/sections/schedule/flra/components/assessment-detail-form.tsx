import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';

import { Field } from 'src/components/hook-form/fields';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

type Props = {
  jobData?: any;
};

export function AssessmentDetailForm({ jobData }: Props) {
  const { user } = useAuthContext();
  const SCOPE_OF_WORK_OPTIONS = [
    { label: 'Single Lane Alternating', value: 'single_lane_alternating' },
    { label: 'Lane Closure', value: 'lane_closure' },
    { label: 'Road Closed', value: 'road_closed' },
    { label: 'Shoulder Work', value: 'shoulder_work' },
    { label: 'Turn Lane Closure', value: 'turn_lane_closure' },
    { label: 'Showing Traffic', value: 'showing_traffic' },
    { label: 'Other', value: 'other' },
  ];
  const WEATHER_OPTIONS = [
    { label: 'Select Weather', value: '' },
    { label: 'Sunny', value: 'sunny' },
    { label: 'Cloudy', value: 'cloudy' },
    { label: 'Snow', value: 'snow' },
    { label: 'Fog', value: 'fog' },
    { label: 'Windy', value: 'windy' },
    { label: 'Hot', value: 'hot' },
    { label: 'Cold', value: 'cold' },
  ];
  const ROAD_OPTIONS = [
    { value: '', label: 'Select Road' },
    { value: 'city', label: 'City' },
    { value: 'rural', label: 'Rural' },
    { value: 'hwy', label: 'Highway' },
    { value: 'other', label: 'Other' },
  ];
  const DISTANCE_OPTIONS = [
    { value: '', label: 'Select Sight Distance' },
    { value: 'hill', label: 'Hill' },
    { value: 'curve', label: 'Curve' },
    { value: 'obstacle', label: 'Obstacle' },
    { value: 'other', label: 'Other' },
  ];
  const { control, setValue, watch, formState: { errors }, trigger, clearErrors } = useFormContext();
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [showRoadOtherInput, setShowRoadOtherInput] = useState(false);
  const [showDistanceOtherInput, setShowDistanceOtherInput] = useState(false);

  // Watch the "other" checkbox values
  const otherChecked = watch('scopeOfWork.roadType.other');
  const roadOtherChecked = watch('descriptionOfWork.road.other');
  const distanceOtherChecked = watch('descriptionOfWork.distance.other');
  
  // Show/hide other input based on checkbox state
  useEffect(() => {
    setShowOtherInput(otherChecked);
  }, [otherChecked]);

  // Show/hide road other input based on checkbox value
  useEffect(() => {
    setShowRoadOtherInput(roadOtherChecked);
  }, [roadOtherChecked]);

  // Show/hide distance other input based on checkbox value
  useEffect(() => {
    setShowDistanceOtherInput(distanceOtherChecked);
  }, [distanceOtherChecked]);

  // Set form values from jobData when component mounts (only once)
  useEffect(() => {
    if (jobData) {
      // Set date to job start date
      if (jobData.start_time) {
        setValue('date', dayjs(jobData.start_time).format('YYYY-MM-DD'));
      }

      // Pre-populate site foreman name with client name (editable)
      if (jobData.client?.name) {
        setValue('site_foreman_name', jobData.client.name);
      }

      // Pre-populate contact number with client contact number (editable)
      if (jobData.client?.contact_number) {
        setValue('contact_number', jobData.client.contact_number);
      }

      if (jobData.site?.display_address) {
        setValue('site_location', jobData.site.display_address);
      }

      // Set start time and end time to job start time and end time
      if (jobData.start_time) {
        setValue('start_time', dayjs(jobData.start_time).toISOString());
      }
      if (jobData.end_time) {
        setValue('end_time', dayjs(jobData.end_time).toISOString());
      }
    }
  }, [jobData, setValue]); // Include jobData and setValue dependencies
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
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Name
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar src={user?.photoURL} alt={user?.displayName} sx={{ width: 32, height: 32 }}>
              {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            <Typography variant="body1">{user?.displayName}</Typography>
          </Box>
        </Box>
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
        <Field.Text name="site_foreman_name" label="Site Foreman Name" />
        <Field.Phone name="contact_number" label="Contact number" country="CA" />
        <Field.Text name="site_location" label="Site Location*" />
        <Field.Text name="company_contract" label="Company Contracted To*" />
        <Field.Text name="closest_hospital" label="Closest Hospital*" />
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
          <Typography variant="h4">Road Conditions</Typography>
        </Stack>
        <Divider sx={{ borderStyle: 'dashed' }} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3,
          }}
        >
          {/* Road - Multiple Checkboxes */}
          <Box sx={{ width: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Road*</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {ROAD_OPTIONS.filter(opt => opt.value).map((option) => (
                <Box key={option.value}>
                  <Field.Checkbox
                    name={`descriptionOfWork.road.${option.value}`}
                    label={option.label}
                    onChange={async (e) => {
                      // Wait for checkbox value to be set, then trigger validation
                      setTimeout(async () => {
                        const isValid = await trigger('descriptionOfWork.road');
                        if (isValid) {
                          clearErrors('descriptionOfWork.road');
                        }
                      }, 50);
                    }}
                  />
                  {/* Show input field right below "Other" checkbox when checked */}
                  {option.value === 'other' && showRoadOtherInput && (
                    <Box sx={{ ml: 4, mt: 1 }}>
                      <Field.Text
                        name="descriptionOfWork.roadOther"
                        label="Please Specify"
                        placeholder="Enter road type"
                        size="small"
                      />
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
            {errors.descriptionOfWork && (errors.descriptionOfWork as any)?.road && (
              <FormHelperText error sx={{ mt: 1 }}>
                {(errors.descriptionOfWork as any).road?.message}
              </FormHelperText>
            )}
          </Box>

          {/* Sight Distance - Multiple Checkboxes */}
          <Box sx={{ width: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Sight Distance*</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {DISTANCE_OPTIONS.filter(opt => opt.value).map((option) => (
                <Box key={option.value}>
                  <Field.Checkbox
                    name={`descriptionOfWork.distance.${option.value}`}
                    label={option.label}
                    onChange={async (e) => {
                      // Wait for checkbox value to be set, then trigger validation
                      setTimeout(async () => {
                        const isValid = await trigger('descriptionOfWork.distance');
                        if (isValid) {
                          clearErrors('descriptionOfWork.distance');
                        }
                      }, 50);
                    }}
                  />
                  {/* Show input field right below "Other" checkbox when checked */}
                  {option.value === 'other' && showDistanceOtherInput && (
                    <Box sx={{ ml: 4, mt: 1 }}>
                      <Field.Text
                        name="descriptionOfWork.distanceOther"
                        label="Please Specify"
                        placeholder="Enter sight distance"
                        size="small"
                      />
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
            {errors.descriptionOfWork && (errors.descriptionOfWork as any)?.distance && (
              <FormHelperText error sx={{ mt: 1 }}>
                {(errors.descriptionOfWork as any).distance?.message}
              </FormHelperText>
            )}
          </Box>

          {/* Weather - Multiple Checkboxes */}
          <Box sx={{ width: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Weather*</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {WEATHER_OPTIONS.filter(opt => opt.value).map((option) => (
                <Field.Checkbox
                  key={option.value}
                  name={`descriptionOfWork.weather.${option.value}`}
                  label={option.label}
                  onChange={async (e) => {
                    // Wait for checkbox value to be set, then trigger validation
                    setTimeout(async () => {
                      const isValid = await trigger('descriptionOfWork.weather');
                      if (isValid) {
                        clearErrors('descriptionOfWork.weather');
                      }
                    }, 50);
                  }}
                />
              ))}
            </Box>
            {errors.descriptionOfWork && (errors.descriptionOfWork as any)?.weather && (
              <FormHelperText error sx={{ mt: 1 }}>
                {(errors.descriptionOfWork as any).weather?.message}
              </FormHelperText>
            )}
          </Box>
        </Box>
      </Stack>

      <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Stack>
          <Typography variant="h4">TCP/LCP Scope of Work</Typography>
        </Stack>
        <Divider sx={{ borderStyle: 'dashed' }} />
        <Stack spacing={2}>
          <Box
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 2,
            }}
          >
            {SCOPE_OF_WORK_OPTIONS.map((option, index) => (
              <Box key={index}>
                <Field.Checkbox
                  name={`scopeOfWork.roadType.${option.value}`}
                  label={option.label}
                  onChange={async (e) => {
                    // Wait for checkbox value to be set, then trigger validation
                    setTimeout(async () => {
                      const isValid = await trigger('scopeOfWork.roadType');
                      if (isValid) {
                        clearErrors('scopeOfWork.roadType');
                      }
                      if (option.value === 'other') {
                        trigger('scopeOfWork.otherDescription');
                      }
                    }, 50);
                  }}
                />
                {/* Show input field right below "Other" checkbox when checked */}
                {option.value === 'other' && showOtherInput && (
                  <Box sx={{ ml: 4, mt: 1 }}>
                    <Field.Text
                      name="scopeOfWork.otherDescription"
                      label="Please specify other scope of work"
                      placeholder="Enter other scope of work details..."
                      size="small"
                    />
                  </Box>
                )}
              </Box>
            ))}
            {/* Error message for scope of work selection - inside container */}
            {errors.scopeOfWork && (errors.scopeOfWork as any)?.roadType && (
              <Box sx={{ gridColumn: '1 / -1', mt: 1 }}>
                <FormHelperText error>
                  {(errors.scopeOfWork as any).roadType?.message}
                </FormHelperText>
              </Box>
            )}
          </Box>
          <Stack>
            <Field.Text
              name="scopeOfWork.contractToolBox"
              label="SCOPE OF WORK/CONTRACTOR*"
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
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                width: 1,
                py: 1,
                px: 2,
              }}
            >
              <Controller
                control={control}
                name="present.identified"
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
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                width: 1,
                py: 1,
                px: 2,
              }}
            >
              <Controller
                control={control}
                name="present.reduce"
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
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                width: 1,
                py: 1,
                px: 2,
              }}
            >
              <Controller
                control={control}
                name="present.experienced"
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
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                width: 1,
                py: 1,
                px: 2,
              }}
            >
              <Controller
                control={control}
                name="present.complete"
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
