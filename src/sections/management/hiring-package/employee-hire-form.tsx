import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';

import { Field } from 'src/components/hook-form/fields';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

export function EmployeeHireForm() {
  const { user } = useAuthContext();
  const {
    control,
    watch,
    formState: { errors },
    trigger,
    clearErrors,
  } = useFormContext();

  const SHIFT_TYPE = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'casual', label: 'Casual' },
    { value: 'seasonal', label: 'Seasonal' },
  ];

  const HRS_P = [
    { value: 'non_union', label: 'Area Overhead (Non-Union)' },
    { value: 'home_office', label: 'part of OPS Support (Home Office)' },
  ];

  return (
    <>
      <Stack>
        <Typography variant="h4">Employee Personal Information</Typography>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' },
        }}
      >
        <Field.Text name="last_name" label="Last Name*" />
        <Field.Text name="first_name" label="First Name*" />
        <Field.Text name="middle_initial" label="Initial*" />
        <Field.Text name="sin" label="SIN*" />
        <Field.DatePicker
          name="date_of_birth"
          label="Date of Birth"
          slotProps={{
            textField: {
              fullWidth: true,
              required: true,
            },
          }}
        />
        <Field.Text name="gender" label="Gender*" />
      </Box>
      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(1, 1fr)' },
        }}
      >
        <Field.Text name="address" label="Address*" multiline rows={2} fullWidth />
      </Box>
      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' },
        }}
      >
        <Field.Text name="city" label="Town/City*" />
        <Field.Text name="province" label="Province*" />
        <Field.Text name="postal_code" label="Postal Code*" />

        <Field.Text name="home_phone_no" label="Home Phone#*" />
        <Field.Text name="phone_no" label="Cellphone#*" />
        <Field.Text name="email_address" label="Personal Email Address*" />
      </Box>

      <Stack>
        <Typography variant="h4">Employment Details</Typography>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' },
        }}
      >
        <Field.Text name="department" label="Department*" />
        <Field.Text name="home_cost_centre" label="Home Cost Centre*" />
        <Field.Text name="job_number" label="Job Number*" />
      </Box>

      <Box
        sx={{
          backgroundColor: 'divider',
          p: 1,
          borderRadius: 1,
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(1, 1fr)' },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'flex-start',
          }}
        >
          <Stack sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ px: 2 }}>
              Status
            </Typography>
            <Stack
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
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
                    <Field.RadioGroup
                      {...field}
                      row
                      sx={{ width: 1, display: 'flex', justifyContent: 'space-between' }}
                      options={[
                        { label: 'Union', value: 'union' },
                        { label: 'Non-Union', value: 'non_union' },
                      ]}
                    />
                  </Box>
                )}
              />
            </Stack>
          </Stack>

          <Stack sx={{ flex: 2 }}>
            <Typography variant="subtitle1" sx={{ px: 2 }}>
              Shift Type
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                gap: { xs: 1, sm: 5 },
                width: 1,
                py: 1,
                px: 1,
              }}
            >
              {SHIFT_TYPE.filter((opt) => opt.value).map((option) => (
                <Box key={option.value}>
                  <Controller
                    name={`shift_type.test.${option.value}`}
                    control={control}
                    render={({ field }) => (
                      <Field.Checkbox
                        name={`shift_type.test.${option.value}`}
                        label={option.label}
                        slotProps={{
                          checkbox: {
                            onChange: async (e, checked) => {
                              field.onChange(checked);
                              setTimeout(async () => {
                                const isValid = await trigger('shift_type.test');
                                if (isValid) {
                                  clearErrors('shift_type.test');
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
            {errors.onboarding && (errors.onboarding as any)?.road && (
              <FormHelperText error sx={{ mt: 1 }}>
                {(errors.onboarding as any).road?.message}
              </FormHelperText>
            )}
          </Stack>

          <Stack sx={{ flex: 2 }}>
            <Typography variant="subtitle1" sx={{ px: 2 }}>
              Direct Labor Allocation (HRS P)
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                gap: { xs: 1, sm: 5 },
                width: 1,
                py: 1,
                px: 1,
              }}
            >
              {HRS_P.filter((opt) => opt.value).map((option) => (
                <Box key={option.value}>
                  <Controller
                    name={`shift_type.test.${option.value}`}
                    control={control}
                    render={({ field }) => (
                      <Field.Checkbox
                        name={`shift_type.test.${option.value}`}
                        label={option.label}
                        slotProps={{
                          checkbox: {
                            onChange: async (e, checked) => {
                              field.onChange(checked);
                              setTimeout(async () => {
                                const isValid = await trigger('shift_type.test');
                                if (isValid) {
                                  clearErrors('shift_type.test');
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
            {errors.onboarding && (errors.onboarding as any)?.road && (
              <FormHelperText error sx={{ mt: 1 }}>
                {(errors.onboarding as any).road?.message}
              </FormHelperText>
            )}
          </Stack>
        </Box>
      </Box>

      <Box
        sx={{
          p: 1,
          borderRadius: 1,
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(1, 1fr)' },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'flex-start',
          }}
        >
          <Stack>
            <Typography variant="subtitle1" sx={{ px: 2 }}>
              $ Salary/Wage
            </Typography>
            <Stack
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
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
                    <Field.RadioGroup
                      {...field}
                      row
                      sx={{ width: 1, display: 'flex', justifyContent: 'space-between' }}
                      options={[
                        { label: 'HR', value: 'hr' },
                        { label: 'WK', value: 'wk' },
                      ]}
                    />
                  </Box>
                )}
              />
            </Stack>
          </Stack>

          <Stack sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ px: 2 }}>
              Referral Information
            </Typography>
            <Stack
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
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
                    <Typography variant="body1">Was the new hired referred ?</Typography>
                    <Field.RadioGroup
                      {...field}
                      row
                      sx={{ width: 1, display: 'flex', justifyContent: 'space-between' }}
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

          <Stack sx={{ flex: 2 }}>
            <Typography variant="subtitle1" sx={{ px: 2, pb: 1 }}>
              Referred By
            </Typography>
            <Field.Text name="referred_by" label="Full Name" />
          </Stack>
        </Box>
      </Box>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(1, 1fr)' },
        }}
      >
        <Field.Text
          name="comment"
          label="Hiring Manager/HR Comments"
          multiline
          rows={2}
          fullWidth
        />
      </Box>

      <Stack>
        <Typography variant="h4">Approvals & Signatures</Typography>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' },
          justifyContent: 'space-evenly',
          alignItems: 'center',
        }}
      >
        <Box>
          <Box>Signature Area</Box>
          <Typography variant="subtitle1">SUPERINTENDENT</Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
            (Signature Over Printed Name)
          </Typography>
        </Box>
        <Box>
          <Box>Signature Area</Box>
          <Typography variant="subtitle1">AREA MANAGER</Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
            (Signature Over Printed Name)
          </Typography>
        </Box>
        <Box>
          <Box>Signature Area</Box>
          <Typography variant="subtitle1">VP OPERATIONS/PRESIDENT</Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
            (Signature Over Printed Name)
          </Typography>
        </Box>
      </Box>

      <Stack>
        <Typography variant="h4">Payroll Office Use Only</Typography>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />

      <Box
        sx={{
          backgroundColor: 'divider',
          p: 1,
          borderRadius: 1,
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(1, 1fr)' },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'flex-start',
            gap: 2,
          }}
        >
          <Stack sx={{ flex: 2, py: 2 }}>
            <Field.Text name="employee_number" label="Employee Number" />
          </Stack>

          <Stack sx={{ flex: 2 }}>
            <Typography variant="body1" sx={{ px: 2 }}>
              Tax Slip On
            </Typography>
            <Stack
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: 1,
                py: 1,
                px: 2,
              }}
            >
              <Controller
                control={control}
                name="taxSlipOn"
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
                    <Field.RadioGroup
                      {...field}
                      row
                      sx={{ width: 1, display: 'flex', justifyContent: 'space-between' }}
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

          <Stack sx={{ flex: 2 }}>
            <Typography variant="body1" sx={{ px: 2 }}>
              Social
            </Typography>
            <Stack
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: 1,
                py: 1,
                px: 2,
              }}
            >
              <Controller
                control={control}
                name="social"
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
                    <Field.RadioGroup
                      {...field}
                      row
                      sx={{ width: 1, display: 'flex', justifyContent: 'space-between' }}
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
        </Box>
      </Box>
    </>
  );
}
