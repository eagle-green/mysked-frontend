import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { Field } from 'src/components/hook-form/fields';
import { Iconify } from 'src/components/iconify/iconify';

export const CHECKLIST = [
  {
    title: 'Pre-Access Drug & Alcohol Test Completed and Passed',
    field_name: 'drug_alcohol_test',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Offer of Employment – Hiring Manager to complete',
    field_name: 'employment_offer',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Offer Letter – Non Union',
    field_name: 'employment_offer_non_union',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'New Hire – Rehire Employee Form',
    field_name: 'new_employee_rehire',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Employee Emergency/Consent Information Sheet',
    field_name: 'consent_information',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Equipment Form',
    field_name: 'equipment_form',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Direct Deposit Authorization',
    field_name: 'deposit_authorization',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Federal TD1',
    field_name: 'tax_credit_td1',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Provincial TD1',
    field_name: 'tax_credit_td1_bc',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Social Fund',
    field_name: 'social_fund',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'EG Health and Safety Manual',
    field_name: 'health_safety_manual',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Celebrate Diversity at - EG',
    field_name: 'celebrate_diversity',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Vacation – Non-Union – Employee to Keep',
    field_name: 'vacation',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Handbook – Acknowledgment of Receipt',
    field_name: 'handbook',
    icon: 'solar:inbox-in-bold',
  },
];

export const FLEET_CHECKLIST = [
  {
    title: "Copy of Current Driver's License (NSC) ",
    field_name: 'current_driver_license',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Provincial Abstract Consent Form',
    field_name: 'consent_form',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: "Copy of 5 Yr. Commercial Driver's Abstract",
    field_name: 'commercial_driver_abstract',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Employee Resume',
    field_name: 'employee_resume',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Drug & Alcohol Policy',
    field_name: 'drug_alcohol_test',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Pre-Trip & Post-Trip Policy',
    field_name: 'trip_policy',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'EG Driver Identification Policy (Vehicle Fobs)',
    field_name: 'identification_policy',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Use of Company Vehicle UNION Policy',
    field_name: 'company_vehicle_union',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Use of Company Vehicle NON UNION Policy ',
    field_name: 'company_vehicle_non_union',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Company Fuel Cards Policy',
    field_name: 'fuel_cards',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'GPS Usage Policy',
    field_name: 'usage_policy',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Conduct & Behavior Policy',
    field_name: 'behavior_policy',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Additional Certifications (*Not Required, N/A if none provided)',
    field_name: 'addtional_certification',
    icon: 'solar:inbox-in-bold',
  },
];

export const NEW_EMPLOYEE_CHECKLIST = [
  {
    title: 'Introductions: Management Supervisor and other EG Staff Members',
    field_name: 'instructions',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'EG Health, Safety and Environment Policy: Review and Understanding',
    field_name: 'safety_environment',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'EG Management Contact Information Sheet: Provide employee with a completed form',
    field_name: 'contact_info',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Working Alone or in Isolation Policy: Review, Understanding',
    field_name: 'isolation_policy',
    icon: 'solar:inbox-in-bold',
  },
  {
    title:
      'EG Hazard Identification and Risk Management, and its guidelines: Review and Understanding',
    field_name: 'risk_management',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Disciplinary Action Policy: Review and Understanding',
    field_name: 'action_policy',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'EG Company Rules: Review, Understanding and Sign off',
    field_name: 'company_rules',
    icon: 'solar:inbox-in-bold',
  },
  {
    title:
      'Job Specific Hazard Assessment and Control Documents: Review, Understanding and sign off',
    field_name: 'hazard_assessment',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'EG Responsibilities: Review, Understanding and Sign off',
    field_name: 'responsibilities',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'New and Young Worker: Review and Understanding',
    field_name: 'young_worker',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'EG Health & Safety Rules: Review, Understanding and sign off',
    field_name: 'safety_rules',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Company Fleet Rules / Policy: Review, Understanding and Sign off',
    field_name: 'fleet_rules',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Workers Rights and Responsibilities: Review, Understanding and Sign off',
    field_name: 'worker_rights',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Preventative Measures and Maintenance: Review and Understanding',
    field_name: 'preventative_measure',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Substance Abuse Policy: Review, Understanding and Sign off',
    field_name: 'abuse_policy',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Training and Communication: Review, Understanding and sign off',
    field_name: 'training_communication',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Personal Protective Equipment Policy: Review, Understanding and Sign off',
    field_name: 'personal_protective',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Inspections: Review and Understanding',
    field_name: 'inspections',
    icon: 'solar:inbox-in-bold',
  },
  {
    title:
      'Accidents, Incidents, Near Misses and Investigation Reporting Policy: Review, Understanding and Sign off',
    field_name: 'reporting_policy',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Emergency Preparedness: Review, Understanding and sign off',
    field_name: 'emergency_preparedness',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Meeting Policy: Review and Understanding',
    field_name: 'meeting_policy',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Records and Statistics: Review, Understanding and sign off',
    field_name: 'records_statistics',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Joint Health and Safety Committee: Review and Understanding',
    field_name: 'safety_committee',
    icon: 'solar:inbox-in-bold',
  },
  {
    title: 'Legislation: Review, Understanding andsign off',
    field_name: 'legislation',
    icon: 'solar:inbox-in-bold',
  },
  {
    title:
      'Field Level Hazard Assessment, Safe Work Practices and Safe Job Procedures Policy: Review, Understanding and sign off',
    field_name: 'field_level_assessment',
    icon: 'solar:inbox-in-bold',
  },
];

export function AdminPreHireOnboardingDocumentationBcForm() {
  const { control, getValues, reset, watch } = useFormContext();
  const values = getValues();
  const admin_checklist = watch('admin_checklist');
  const fleet_checklist = watch('fleet_checklist');
  const employee_checklist = watch('employee_checklist');

  return (
    <>
      <>
        <Stack spacing={2} direction="row" justifyContent="space-between">
          <Typography variant="h5">
            Admin Pre-Hire & Onboarding Documentation for British Columbia
          </Typography>
          <Button
            variant="contained"
            type="button"
            color="success"
            onClick={() => {
              const checklist = getValues('admin_checklist');
              reset({
                ...values,
                admin_checklist: Object.fromEntries(
                  Object.keys(checklist).map((key) => [key, true])
                ),
              });
            }}
            disabled={Object.values(admin_checklist).every((value) => !!value)}
          >
            Mark Completed
          </Button>
        </Stack>
        <Divider sx={{ borderStyle: 'dashed' }} />

        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
            width: 1,
          }}
        >
          {CHECKLIST.map((option) => (
            <Stack
              sx={{
                bgcolor: 'divider',
                borderRadius: 1,
                p: 2,
              }}
              key={`admin_checklist.${option.field_name}`}
              direction="row"
              justifyContent="space-between"
            >
              <Controller
                name={`admin_checklist.${option.field_name}`}
                control={control}
                render={({ field }) => (
                  <>
                    <Field.Checkbox
                      name={`admin_checklist.${option.field_name}`}
                      label={option.title}
                      slotProps={{
                        checkbox: {
                          onChange: async (e, checked) => {
                            field.onChange(checked);
                          },
                        },
                      }}
                    />
                  </>
                )}
              />
              <Stack alignItems="center" direction="row">
                <Iconify icon={option.icon as any} />
              </Stack>
            </Stack>
          ))}
        </Box>

        <Stack>
          <Typography variant="subtitle1" color="text.disabled">
            Only To Be Completed If Employee Is Required To Use Company Vehicle
          </Typography>
        </Stack>

        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: 'repeat(1, 1fr)',
            width: 1,
          }}
        >
          <Stack
            sx={{
              bgcolor: 'divider',
              borderRadius: 1,
              p: 2,
            }}
            direction="row"
            justifyContent="space-between"
          >
            <Controller
              name="admin_checklist.fleet_form"
              control={control}
              render={({ field }) => (
                <>
                  <Field.Checkbox
                    name="admin_checklist.fleet_form"
                    label="Fleet Forms – See required fleet documentation checklist"
                    slotProps={{
                      checkbox: {
                        onChange: async (e, checked) => {
                          field.onChange(checked);
                        },
                      },
                    }}
                  />
                </>
              )}
            />
            <Stack alignItems="center" direction="row">
              <Iconify icon="solar:inbox-in-bold" />
            </Stack>
          </Stack>
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Stack spacing={2} direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
          <Typography variant="h5">Admin Checklist Fleet Onboarding Documentation</Typography>
          <Button
            variant="contained"
            type="button"
            color="success"
            onClick={() => {
              const cur_checklist = getValues('fleet_checklist');
              reset({
                ...values,
                fleet_checklist: Object.fromEntries(
                  Object.keys(cur_checklist).map((key) => [key, true])
                ),
              });
            }}
            disabled={Object.values(fleet_checklist).every((value) => !!value)}
          >
            Mark Completed
          </Button>
        </Stack>
        <Divider sx={{ borderStyle: 'dashed' }} />

        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
            width: 1,
          }}
        >
          {FLEET_CHECKLIST.map((option) => (
            <Stack
              sx={{
                bgcolor: 'divider',
                borderRadius: 1,
                p: 2,
              }}
              key={`fleet_checklist.${option.field_name}`}
              direction="row"
              justifyContent="space-between"
            >
              <Controller
                name={`fleet_checklist.${option.field_name}`}
                control={control}
                render={({ field }) => (
                  <>
                    <Field.Checkbox
                      name={`fleet_checklist.${option.field_name}`}
                      label={option.title}
                      slotProps={{
                        checkbox: {
                          onChange: async (e, checked) => {
                            field.onChange(checked);
                          },
                        },
                      }}
                    />
                  </>
                )}
              />
              <Stack alignItems="center" direction="row">
                <Iconify icon={option.icon as any} />
              </Stack>
            </Stack>
          ))}
        </Box>

        <Stack spacing={2} direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
          <Typography variant="h5">New Employee Orientation Checklist</Typography>
          <Button
            variant="contained"
            type="button"
            color="success"
            onClick={() => {
              const emp_checklist = getValues('employee_checklist');
              reset({
                ...values,
                employee_checklist: Object.fromEntries(
                  Object.keys(emp_checklist).map((key) => [key, true])
                ),
              });
            }}
            disabled={Object.values(employee_checklist).every((value) => !!value)}
          >
            Mark Completed
          </Button>
        </Stack>
        <Divider sx={{ borderStyle: 'dashed' }} />

        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
            width: 1,
          }}
        >
          {NEW_EMPLOYEE_CHECKLIST.map((option) => (
            <Stack
              sx={{
                bgcolor: 'divider',
                borderRadius: 1,
                p: 2,
              }}
              key={`employee_checklist.${option.field_name}`}
              direction="row"
              justifyContent="space-between"
            >
              <Controller
                name={`employee_checklist.${option.field_name}`}
                control={control}
                render={({ field }) => (
                  <>
                    <Field.Checkbox
                      name={`employee_checklist.${option.field_name}`}
                      label={option.title}
                      slotProps={{
                        checkbox: {
                          onChange: async (e, checked) => {
                            field.onChange(checked);
                          },
                        },
                      }}
                    />
                  </>
                )}
              />
              <Stack alignItems="center" direction="row">
                <Iconify icon={option.icon as any} />
              </Stack>
            </Stack>
          ))}
        </Box>
      </>
    </>
  );
}
