import type { MouseEvent } from 'react';
import type { FieldPath } from 'react-hook-form';
import type { Theme } from '@mui/material/styles';
import type { NewHire } from 'src/types/new-hire';

import { useCallback } from 'react';
import { useBoolean } from 'minimal-shared/hooks';
import { Controller, useFormState, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';

import { Field } from 'src/components/hook-form/fields';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { SignatureDialog } from './signature';

function accountDisplayName(user: { displayName?: string; name?: string; email?: string } | null) {
  if (!user) return '';
  return (
    (typeof user.displayName === 'string' && user.displayName.trim()) ||
    (typeof (user as { name?: string }).name === 'string' &&
      String((user as { name: string }).name).trim()) ||
    (typeof user.email === 'string' && user.email.trim()) ||
    ''
  );
}

/** Success styling follows the checkbox (checked) value so multiple rows can stay highlighted. */
function getChecklistRowSx(checked: boolean) {
  return (theme: Theme) => ({
    borderRadius: 1,
    p: 2,
    width: 1,
    cursor: 'pointer' as const,
    transition: theme.transitions.create(['background-color', 'border-color'], {
      duration: theme.transitions.duration.shorter,
    }),
    border: '1px solid',
    borderColor: checked ? theme.palette.success.main : 'divider',
    bgcolor: checked ? alpha(theme.palette.success.main, 0.12) : theme.palette.grey[100],
    '&:hover': {
      bgcolor: checked
        ? alpha(theme.palette.success.main, 0.16)
        : alpha(theme.palette.action.active, 0.06),
    },
  });
}

function isClickFromCheckboxOrLabel(target: EventTarget | null) {
  return Boolean((target as HTMLElement | null)?.closest('.MuiFormControlLabel-root'));
}

export const CHECKLIST = [
  {
    title: 'Pre-Access Drug & Alcohol Test Completed and Passed',
    field_name: 'drug_alcohol_test'  },
  {
    title: 'Offer of Employment – Hiring Manager to complete',
    field_name: 'employment_offer'  },
  {
    title: 'Offer Letter – Non Union',
    field_name: 'employment_offer_non_union'  },
  {
    title: 'New Hire – Rehire Employee Form',
    field_name: 'new_employee_rehire'  },
  {
    title: 'Employee Emergency/Consent Information Sheet',
    field_name: 'consent_information'  },
  {
    title: 'Equipment Form',
    field_name: 'equipment_form'  },
  {
    title: 'Direct Deposit Authorization',
    field_name: 'deposit_authorization'  },
  {
    title: 'Federal TD1',
    field_name: 'tax_credit_td1'  },
  {
    title: 'Provincial TD1',
    field_name: 'tax_credit_td1_bc'  },
  {
    title: 'Social Fund',
    field_name: 'social_fund'  },
  {
    title: 'EG Health and Safety Manual',
    field_name: 'health_safety_manual'  },
  {
    title: 'Celebrate Diversity at - EG',
    field_name: 'celebrate_diversity'  },
  {
    title: 'Vacation – Non-Union – Employee to Keep',
    field_name: 'vacation'  },
  {
    title: 'Handbook – Acknowledgment of Receipt',
    field_name: 'handbook'  },
];

export const FLEET_CHECKLIST = [
  {
    title: "Copy of Current Driver's License (NSC) ",
    field_name: 'current_driver_license'  },
  {
    title: 'Provincial Abstract Consent Form',
    field_name: 'consent_form'  },
  {
    title: "Copy of 5 Yr. Commercial Driver's Abstract",
    field_name: 'commercial_driver_abstract'  },
  {
    title: 'Employee Resume',
    field_name: 'employee_resume'  },
  {
    title: 'Drug & Alcohol Policy',
    field_name: 'drug_alcohol_test'  },
  {
    title: 'Pre-Trip & Post-Trip Policy',
    field_name: 'trip_policy'  },
  {
    title: 'EG Driver Identification Policy (Vehicle Fobs)',
    field_name: 'identification_policy'  },
  {
    title: 'Use of Company Vehicle UNION Policy',
    field_name: 'company_vehicle_union'  },
  {
    title: 'Use of Company Vehicle NON UNION Policy ',
    field_name: 'company_vehicle_non_union'  },
  {
    title: 'Company Fuel Cards Policy',
    field_name: 'fuel_cards'  },
  {
    title: 'GPS Usage Policy',
    field_name: 'usage_policy'  },
  {
    title: 'Conduct & Behavior Policy',
    field_name: 'behavior_policy'  },
  {
    title: 'Additional Certifications (*Not Required, N/A if none provided)',
    field_name: 'addtional_certification'  },
];

export const NEW_EMPLOYEE_CHECKLIST = [
  {
    title: 'Introductions: Management Supervisor and other EG Staff Members',
    field_name: 'instructions'  },
  {
    title: 'EG Health, Safety and Environment Policy: Review and Understanding',
    field_name: 'safety_environment'  },
  {
    title: 'EG Management Contact Information Sheet: Provide employee with a completed form',
    field_name: 'contact_info'  },
  {
    title: 'Working Alone or in Isolation Policy: Review, Understanding',
    field_name: 'isolation_policy'  },
  {
    title:
      'EG Hazard Identification and Risk Management, and its guidelines: Review and Understanding',
    field_name: 'risk_management'  },
  {
    title: 'Disciplinary Action Policy: Review and Understanding',
    field_name: 'action_policy'  },
  {
    title: 'EG Company Rules: Review, Understanding and Sign off',
    field_name: 'company_rules'  },
  {
    title:
      'Job Specific Hazard Assessment and Control Documents: Review, Understanding and sign off',
    field_name: 'hazard_assessment'  },
  {
    title: 'EG Responsibilities: Review, Understanding and Sign off',
    field_name: 'responsibilities'  },
  {
    title: 'New and Young Worker: Review and Understanding',
    field_name: 'young_worker'  },
  {
    title: 'EG Health & Safety Rules: Review, Understanding and sign off',
    field_name: 'safety_rules'  },
  {
    title: 'Company Fleet Rules / Policy: Review, Understanding and Sign off',
    field_name: 'fleet_rules'  },
  {
    title: 'Workers Rights and Responsibilities: Review, Understanding and Sign off',
    field_name: 'worker_rights'  },
  {
    title: 'Preventative Measures and Maintenance: Review and Understanding',
    field_name: 'preventative_measure'  },
  {
    title: 'Substance Abuse Policy: Review, Understanding and Sign off',
    field_name: 'abuse_policy'  },
  {
    title: 'Training and Communication: Review, Understanding and sign off',
    field_name: 'training_communication'  },
  {
    title: 'Personal Protective Equipment Policy: Review, Understanding and Sign off',
    field_name: 'personal_protective'  },
  {
    title: 'Inspections: Review and Understanding',
    field_name: 'inspections'  },
  {
    title:
      'Accidents, Incidents, Near Misses and Investigation Reporting Policy: Review, Understanding and Sign off',
    field_name: 'reporting_policy'  },
  {
    title: 'Emergency Preparedness: Review, Understanding and sign off',
    field_name: 'emergency_preparedness'  },
  {
    title: 'Meeting Policy: Review and Understanding',
    field_name: 'meeting_policy'  },
  {
    title: 'Records and Statistics: Review, Understanding and sign off',
    field_name: 'records_statistics'  },
  {
    title: 'Joint Health and Safety Committee: Review and Understanding',
    field_name: 'safety_committee'  },
  {
    title: 'Legislation: Review, Understanding andsign off',
    field_name: 'legislation'  },
  {
    title:
      'Field Level Hazard Assessment, Safe Work Practices and Safe Job Procedures Policy: Review, Understanding and sign off',
    field_name: 'field_level_assessment'  },
];

export function AdminPreHireOnboardingDocumentationBcForm() {
  const { control, watch, setValue, clearErrors } = useFormContext<NewHire>();
  /** Subscribes to `errors` so manual `setError` from Preview & Submit re-renders this step (useFormContext alone does not). */
  const { errors } = useFormState({ control });
  const { user } = useAuthContext();
  const bcSigDialog = useBoolean();
  const fleetSigDialog = useBoolean();

  const bcSignature = watch('admin_checklist_hm_signature');
  const fleetSignature = watch('fleet_checklist_hm_signature');
  const bcSignedAt = watch('admin_checklist_hm_signed_at');
  const fleetSignedAt = watch('fleet_checklist_hm_signed_at');
  const bcSignerName = watch('admin_checklist_hm_signer_name');
  const fleetSignerName = watch('fleet_checklist_hm_signer_name');

  const clearBcAttestation = useCallback(() => {
    setValue('admin_checklist_hm_signature', '', { shouldDirty: true });
    setValue('admin_checklist_hm_signed_at', '', { shouldDirty: true });
    setValue('admin_checklist_hm_signer_name', '', { shouldDirty: true });
  }, [setValue]);

  const clearFleetAttestation = useCallback(() => {
    setValue('fleet_checklist_hm_signature', '', { shouldDirty: true });
    setValue('fleet_checklist_hm_signed_at', '', { shouldDirty: true });
    setValue('fleet_checklist_hm_signer_name', '', { shouldDirty: true });
  }, [setValue]);

  return (
    <>
        <Stack spacing={2}>
          <Typography variant="h5">
            Admin Pre-Hire & Onboarding Documentation for British Columbia
          </Typography>
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
            <Controller
              key={`admin_checklist.${option.field_name}`}
              name={`admin_checklist.${option.field_name}` as FieldPath<NewHire>}
              control={control}
              render={({ field }) => (
                <Stack
                  direction="row"
                  alignItems="flex-start"
                  sx={getChecklistRowSx(!!field.value)}
                  onClick={(e: MouseEvent<HTMLElement>) => {
                    if (isClickFromCheckboxOrLabel(e.target)) return;
                    field.onChange(!field.value);
                    clearBcAttestation();
                  }}
                >
                  <Field.Checkbox
                    name={`admin_checklist.${option.field_name}` as FieldPath<NewHire>}
                    label={option.title}
                    slotProps={{
                      checkbox: {
                        onClick: (ev) => {
                          ev.stopPropagation();
                        },
                        onChange: async (_e, checked) => {
                          field.onChange(checked);
                          clearBcAttestation();
                        },
                      },
                    }}
                  />
                </Stack>
              )}
            />
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
          <Controller
            name={'admin_checklist.fleet_form' as FieldPath<NewHire>}
            control={control}
            render={({ field }) => (
              <Stack
                direction="row"
                alignItems="flex-start"
                sx={getChecklistRowSx(!!field.value)}
                onClick={(e: MouseEvent<HTMLElement>) => {
                  if (isClickFromCheckboxOrLabel(e.target)) return;
                  field.onChange(!field.value);
                  clearBcAttestation();
                }}
              >
                <Field.Checkbox
                  name={'admin_checklist.fleet_form' as FieldPath<NewHire>}
                  label="Fleet Forms – See required fleet documentation checklist"
                  slotProps={{
                    checkbox: {
                      onClick: (ev) => {
                        ev.stopPropagation();
                      },
                      onChange: async (_e, checked) => {
                        field.onChange(checked);
                        clearBcAttestation();
                      },
                    },
                  }}
                />
              </Stack>
            )}
          />
        </Box>

        <Stack
          spacing={1.5}
          sx={{
            mt: 2,
            p: 2,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            width: 1,
          }}
        >
          <Typography variant="subtitle2">Hiring manager - BC admin checklist</Typography>
          <Typography variant="caption" color="text.secondary">
            Changing any item in this BC checklist clears this signature. Sign to confirm the checklist
            matches your selections (shown on the PDF).
          </Typography>
          {bcSignature ? (
            <Box sx={{ maxHeight: 100, '& img': { maxHeight: 100, objectFit: 'contain' } }}>
              <Box component="img" src={bcSignature} alt="BC checklist signature" />
            </Box>
          ) : null}
          <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
            <Button
              variant="contained"
              size="small"
              onClick={() => bcSigDialog.onTrue()}
              sx={{
                minHeight: { xs: 48, md: 32 },
                px: { xs: 2.5, md: 1.75 },
                fontSize: { xs: '1rem', md: '0.8125rem' },
              }}
            >
              {bcSignature ? 'Re-sign' : 'Sign'}
            </Button>
            {bcSignerName ? (
              <Typography variant="caption">Name: {bcSignerName}</Typography>
            ) : null}
            {bcSignedAt ? (
              <Typography variant="caption">Signed: {fDate(bcSignedAt)}</Typography>
            ) : null}
          </Stack>
          {errors.admin_checklist_hm_signature ? (
            <Alert id="hm-attestation-bc-error" severity="error" sx={{ mt: 1 }}>
              {errors.admin_checklist_hm_signature.message ??
                'Sign the BC admin checklist before preview.'}
            </Alert>
          ) : null}
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Stack spacing={2} sx={{ mt: 3 }}>
          <Typography variant="h5">Admin Checklist Fleet Onboarding Documentation</Typography>
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
            <Controller
              key={`fleet_checklist.${option.field_name}`}
              name={`fleet_checklist.${option.field_name}` as FieldPath<NewHire>}
              control={control}
              render={({ field }) => (
                <Stack
                  direction="row"
                  alignItems="flex-start"
                  sx={getChecklistRowSx(!!field.value)}
                  onClick={(e: MouseEvent<HTMLElement>) => {
                    if (isClickFromCheckboxOrLabel(e.target)) return;
                    field.onChange(!field.value);
                    clearFleetAttestation();
                  }}
                >
                  <Field.Checkbox
                    name={`fleet_checklist.${option.field_name}` as FieldPath<NewHire>}
                    label={option.title}
                    slotProps={{
                      checkbox: {
                        onClick: (ev) => {
                          ev.stopPropagation();
                        },
                        onChange: async (_e, checked) => {
                          field.onChange(checked);
                          clearFleetAttestation();
                        },
                      },
                    }}
                  />
                </Stack>
              )}
            />
          ))}
        </Box>

        <Stack
          spacing={1.5}
          sx={{
            mt: 2,
            p: 2,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            width: 1,
          }}
        >
          <Typography variant="subtitle2">Hiring manager - fleet onboarding checklist</Typography>
          <Typography variant="caption" color="text.secondary">
            Changing any fleet checklist item clears this signature. Sign to confirm the fleet checklist
            matches your selections (shown on the PDF).
          </Typography>
          {fleetSignature ? (
            <Box sx={{ maxHeight: 100, '& img': { maxHeight: 100, objectFit: 'contain' } }}>
              <Box component="img" src={fleetSignature} alt="Fleet checklist signature" />
            </Box>
          ) : null}
          <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
            <Button
              variant="contained"
              size="small"
              onClick={() => fleetSigDialog.onTrue()}
              sx={{
                minHeight: { xs: 48, md: 32 },
                px: { xs: 2.5, md: 1.75 },
                fontSize: { xs: '1rem', md: '0.8125rem' },
              }}
            >
              {fleetSignature ? 'Re-sign' : 'Sign'}
            </Button>
            {fleetSignerName ? (
              <Typography variant="caption">Name: {fleetSignerName}</Typography>
            ) : null}
            {fleetSignedAt ? (
              <Typography variant="caption">Signed: {fDate(fleetSignedAt)}</Typography>
            ) : null}
          </Stack>
          {errors.fleet_checklist_hm_signature ? (
            <Alert id="hm-attestation-fleet-error" severity="error" sx={{ mt: 1 }}>
              {errors.fleet_checklist_hm_signature.message ??
                'Sign the fleet onboarding checklist before preview.'}
            </Alert>
          ) : null}
        </Stack>

        <Stack spacing={2} sx={{ mt: 3 }}>
          <Typography variant="h5">New Employee Orientation Checklist</Typography>
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
            <Controller
              key={`employee_checklist.${option.field_name}`}
              name={`employee_checklist.${option.field_name}` as FieldPath<NewHire>}
              control={control}
              render={({ field }) => (
                <Stack
                  direction="row"
                  alignItems="flex-start"
                  sx={getChecklistRowSx(!!field.value)}
                  onClick={(e: MouseEvent<HTMLElement>) => {
                    if (isClickFromCheckboxOrLabel(e.target)) return;
                    field.onChange(!field.value);
                  }}
                >
                  <Field.Checkbox
                    name={`employee_checklist.${option.field_name}` as FieldPath<NewHire>}
                    label={option.title}
                    slotProps={{
                      checkbox: {
                        onClick: (ev) => {
                          ev.stopPropagation();
                        },
                        onChange: async (_e, checked) => {
                          field.onChange(checked);
                        },
                      },
                    }}
                  />
                </Stack>
              )}
            />
          ))}
        </Box>

        <SignatureDialog
          dialog={bcSigDialog}
          type="admin_checklist_bc"
          title="Sign to confirm the BC admin checklist"
          freshSignatureOnOpen
          onSave={(signature) => {
            bcSigDialog.onFalse();
            if (signature) {
              setValue('admin_checklist_hm_signature', signature, { shouldDirty: true });
              setValue('admin_checklist_hm_signed_at', new Date().toISOString(), { shouldDirty: true });
              setValue('admin_checklist_hm_signer_name', accountDisplayName(user), {
                shouldDirty: true,
              });
              clearErrors('admin_checklist_hm_signature');
            }
          }}
          onCancel={() => bcSigDialog.onFalse()}
        />
        <SignatureDialog
          dialog={fleetSigDialog}
          type="fleet_checklist_hm"
          title="Sign to confirm the fleet onboarding checklist"
          freshSignatureOnOpen
          onSave={(signature) => {
            fleetSigDialog.onFalse();
            if (signature) {
              setValue('fleet_checklist_hm_signature', signature, { shouldDirty: true });
              setValue('fleet_checklist_hm_signed_at', new Date().toISOString(), { shouldDirty: true });
              setValue('fleet_checklist_hm_signer_name', accountDisplayName(user), {
                shouldDirty: true,
              });
              clearErrors('fleet_checklist_hm_signature');
            }
          }}
          onCancel={() => fleetSigDialog.onFalse()}
        />
      </>
  );
}
