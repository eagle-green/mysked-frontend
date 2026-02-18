import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';

import { Field } from 'src/components/hook-form/fields';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

export function EmployeeOrientationChecklistForm() {
  const { user } = useAuthContext();
  const {
    control,
    watch,
    formState: { errors },
    trigger,
    clearErrors,
  } = useFormContext();

  const AGREEMENT = [
    {
      value: 'staff_member',
      label: `Introductions: Management Supervisor and other EG Staff Members`,
    },
    {
      value: 'policy_review',
      label: 'EG Health, Safety and Environment Policy: Review and Understanding',
    },
    {
      value: 'management_contract',
      label: 'EG Management Contact Information Sheet: Provide employee with a completed form',
    },
    {
      value: 'working_alone',
      label: 'Working Alone or in Isolation Policy: Review, Understanding',
    },
    {
      value: 'identification_risk_management',
      label:
        'EG Hazard Identification and Risk Management, and its guidelines: Review and Understanding',
    },
    {
      value: 'disciplinary_action',
      label: 'Disciplinary Action Policy: Review and Understanding',
    },
    {
      value: 'company_rules',
      label: 'EG Company Rules: Review, Understanding and Sign off',
    },
    {
      value: 'hazard_assessment',
      label:
        'Job Specific Hazard Assessment and Control Documents: Review, Understanding and sign off',
    },
    {
      value: 'responsibilities',
      label: 'EG Responsibilities: Review, Understanding and Sign off ',
    },
    {
      value: 'young_worker',
      label: 'New and Young Worker: Review and Understanding',
    },
    {
      value: 'safety_rules',
      label: 'EG Health & Safety Rules: Review, Understanding and sign off',
    },
    {
      value: 'company_fleet_rules',
      label: 'Company Fleet Rules / Policy: Review, Understanding and Sign off',
    },
    {
      value: 'worker_rights',
      label: 'Workers Rights and Responsibilities: Review, Understanding and Sign off',
    },
    {
      value: 'preventative',
      label: 'Preventative Measures and Maintenance: Review and Understanding',
    },
    {
      value: 'substance',
      label: 'Substance Abuse Policy: Review, Understanding and Sign off',
    },
    {
      value: 'training_communication',
      label: 'Training and Communication: Review, Understanding and sign off',
    },
    {
      value: 'personal_protective',
      label: 'Personal Protective Equipment Policy: Review, Understanding and Sign off',
    },
    {
      value: 'inspections',
      label: 'Inspections: Review and Understanding',
    },
    {
      value: 'accidents',
      label:
        'Accidents, Incidents, Near Misses and Investigation Reporting Policy: Review, Understanding and Sign off',
    },
    {
      value: 'emergency',
      label: 'Emergency Preparedness: Review, Understanding and sign off',
    },
    {
      value: 'policy',
      label: 'Meeting Policy: Review and Understanding',
    },
    {
      value: 'record_statistics',
      label: 'Records and Statistics: Review, Understanding and sign off',
    },
    {
      value: 'joint_health',
      label: 'Joint Health and Safety Committee: Review and Understanding',
    },
    {
      value: 'legislation',
      label: 'Legislation: Review, Understanding and sign off',
    },
    {
      value: 'field_hazard_assessment',
      label:
        'Field Level Hazard Assessment, Safe Work Practices and Safe Job Procedures Policy: Review, Understanding and sign off',
    },
  ];

  return (
    <>
      <Stack>
        <Typography variant="h4">New Employee Orientation Checklist Form</Typography>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />

      <Card
        sx={{
          p: 2,
          mb: 3,
          bgcolor: 'primary.lighter',
          borderLeft: 5,
          borderColor: 'primary.dark',
        }}
      >
        <Typography variant="body1" color="primary.dark">
          Eagle Green requires all employees entering our workforce to know and understand their
          responsibilities for health and safety prior to commencing employment. The company values
          its employees and makes every effort to create a safe and enjoyable work environment by
          providing the tools, guidelines, training and support required to achieve and maintain
          that goal.
        </Typography>
      </Card>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
        }}
      >
        <Field.Text name="full_name" label="Employee Name" required />
        <Field.DatePicker
          name="employee_checklist_date"
          label="Date"
          slotProps={{
            textField: {
              fullWidth: true,
              required: true,
            },
          }}
        />
      </Box>

      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
        }}
      >
        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
          }}
        >
          {AGREEMENT.filter((opt) => opt.value).map((option) => (
            <Box
              key={option.value}
              sx={{
                bgcolor: 'divider',
                py: 2,
                px: 1,
                borderRadius: 1,
              }}
            >
              <Controller
                name={`checklist.test.${option.value}`}
                control={control}
                render={({ field }) => (
                  <Field.Checkbox
                    name={`checklist.test.${option.value}`}
                    label={option.label}
                    slotProps={{
                      checkbox: {
                        onChange: async (e, checked) => {
                          field.onChange(checked);
                          setTimeout(async () => {
                            const isValid = await trigger('checklist.test');
                            if (isValid) {
                              clearErrors('checklist.test');
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
      </Box>
    </>
  );
}
