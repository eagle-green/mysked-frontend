import type { z } from 'zod';
import type { NewHire} from 'src/types/new-hire';

import { merge } from 'es-toolkit';
import { useBoolean } from 'minimal-shared/hooks';
import { BlobProvider } from '@react-pdf/renderer';
import { useParams, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, type FieldPath } from 'react-hook-form';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Step from '@mui/material/Step';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useMultiStepForm } from 'src/hooks/use-multistep-form';

import axiosInstance, { endpoints } from 'src/lib/axios';

import { Form } from 'src/components/hook-form';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify/iconify';

import { SalaryType, EmployeeType } from 'src/types/new-hire';

import { EmployeeInformationEditForm } from './new-employee-edit-form';
import { NewEmployeeAcknowledgement } from './new-employee-acknowledgement';
import { EmployeeContractDetailForm } from './employee-contract-detail-form';
import HiringPackagePdfTemplate from '../../hiring-package/template/hiring-package-template';
import { AdminPreHireOnboardingDocumentationBcForm } from './admin-pre-hire-onboarding-bc-form';
import {
  POLICY_AGREEMENT_KEYS,
  NewHireEditStep0Schema,
  NewHireEditStep1Schema,
  NewHireEditStep2Schema,
  TD1BC_2026_BASIC_PERSONAL_AMOUNT,
} from './new-hire-employee-form';

export function NewEmployeeEditForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id: hiringPackageId } = useParams();
  const previewDialog = useBoolean();
  const [packageReady, setPackageReady] = useState(!hiringPackageId);
  const [packageLoadError, setPackageLoadError] = useState<string | null>(null);
  const [previewPayload, setPreviewPayload] = useState<NewHire | null>(null);
  const [packageStatus, setPackageStatus] = useState<string | null>(null);
  const [packageEmployeeUserId, setPackageEmployeeUserId] = useState<string | null>(null);
  const formSections = [
    'Employee Information',
    'Contract Details',
    'Review & Acknowledgement',
    'Admin Pre Hire Documentation',
  ];
  const steps = useMemo(
    () => [
      <EmployeeInformationEditForm key="employee-information" />,
      <EmployeeContractDetailForm key="contract-detail" />,
      <NewEmployeeAcknowledgement key="review-acknowledgement" />,
      <AdminPreHireOnboardingDocumentationBcForm key="admin-pre-hire-documentation" />,
    ],
    []
  );
  const stepSectionRef = useRef<HTMLDivElement>(null);
  const scrollSectionRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width:768px)');

  const { currentStepIndex, step, prev, next } = useMultiStepForm(steps);

  const formDefaulvalues: NewHire = {
    contract_detail: {
      date: new Date().toISOString(),
      start_date: new Date().toISOString(),
      hire_date: new Date().toISOString(),
      employee_name: '',
      position: '',
      rate: null,
      employee_signature: '',
      area: '',
      department: '',
      home_cost_centre: '',
      job_number: '',
      is_union: EmployeeType.NON_UNION,
      is_refered: '',
      hrsp: '',
      comments: '',
      supper_intendent_signature: '',
      area_manager_signature: '',
      president_signature: '',
      salary_wage: SalaryType.WK,
      work_schedule: '',
    },
    employee: {
      last_name: '',
      first_name: '',
      middle_initial: '',
      sin: '',
      gender: '',
      date_of_birth: '',
      address: '',
      city: '',
      province: '',
      postal_code: '',
      home_phone_no: '',
      cell_no: '',
      email_address: '',
      signature: '',
      signature_signed_at: '',
      medical_allergies: '',
      employee_number: '',
    },
    emergency_contact: {
      last_name: '',
      first_name: '',
      middle_initial: '',
      address: '',
      city: '',
      province: '',
      postal_code: '',
      phone_no: '',
      cell_no: '',
      relationship: '',
    },
    equipments: [],
    information_consent: true,
    payroll_consent: true,
    return_policy_consent: false,
    return_policy_signature: '',
    socialAgreement: {
      is_join_social_committee: false,
      authorize_deduction: false,
      not_agree_deduction: false,
    },
    social_committee_signature: '',
    celebrate_diversity_consent: false,
    equity_question: {
      is_aboriginal_person: '',
      is_visible_minority: '',
      is_participation_voluntary: '',
    },
    hr_manager: {
      id: '',
      display_name: '',
      email: '',
      signed_at: '',
      signature: '',
    },
    area_manager: {
      id: '',
      display_name: '',
      email: '',
      signed_at: '',
      signature: '',
    },
    president: {
      id: '',
      display_name: '',
      email: '',
      signed_at: '',
      signature: '',
    },
    policy_agreement: {
      safety_company_protocols: false,
      company_hr_policies_703: false,
      company_hr_policies_704: false,
      company_fleet_policies_gen_002: false,
      company_fleet_policies_gen_003: false,
      company_fleet_policies_ncs_001: false,
      company_fleet_policies_ncs_003u: false,
      company_fire_extiguisher: false,
      company_rules: false,
      motive_cameras: false,
    },
    policy_agreement_signatures: {
      safety_company_protocols: '',
      company_rules: '',
      motive_cameras: '',
      company_hr_policies_703: '',
      company_hr_policies_704: '',
      company_fleet_policies_gen_002: '',
      company_fleet_policies_gen_003: '',
      company_fleet_policies_ncs_001: '',
      company_fleet_policies_ncs_003u: '',
      company_fire_extiguisher: '',
    },
    policy_agreement_signed_at: {
      safety_company_protocols: '',
      company_rules: '',
      motive_cameras: '',
      company_hr_policies_703: '',
      company_hr_policies_704: '',
      company_fleet_policies_gen_002: '',
      company_fleet_policies_gen_003: '',
      company_fleet_policies_ncs_001: '',
      company_fleet_policies_ncs_003u: '',
      company_fire_extiguisher: '',
    },
    claims: {
      basic_claim_amount: '' as any,
      parent_claim_amount: '' as any,
      age_claim_amount: '' as any,
      pension_claim_amount: '' as any,
      tuition_claim_amount: '' as any,
      disability_claim_amount: '' as any,
      spouse_claim_amount: '' as any,
      dependant_claim_amount: '' as any,
      dependent_common_claim_amount: '' as any,
      infirm_dependent_claim_amount: '' as any,
      transfer_common_claim_amount: '' as any,
      transfer_partner_claim_amount: '' as any,
      deduction_living_prescribed_zone: '' as any,
      addition_tax_deducted: '' as any,
      has_two_employeer: false,
      not_eligible: false,
      is_non_resident: '',
      certified: false,
      td1_form_signature: '',
    },
    supervisor_agreement: {
      safety_company_protocols: false,
      company_rules: false,
      motive_cameras: false,
      company_fire_extiguisher: false,
    },
    supervisor_agreement_signer_names: {
      safety_company_protocols: '',
      company_rules: '',
      motive_cameras: '',
      company_fire_extiguisher: '',
    },
    supervisor_agreement_signatures: {
      safety_company_protocols: '',
      company_rules: '',
      motive_cameras: '',
      company_fire_extiguisher: '',
    },
    supervisor_agreement_signed_at: {
      safety_company_protocols: '',
      company_rules: '',
      motive_cameras: '',
      company_fire_extiguisher: '',
    },
    safety_manager_agreement: {
      safety_company_protocols: false,
      company_rules: false,
      motive_cameras: false,
      company_fire_extiguisher: false,
    },
    supervisor: {
      id: '79979cdd-18c0-4072-a5da-caf8a74f3147',
      display_name: 'Kesia',
      email: '',
      signed_at: '',
      signature: '',
    },
    safety_manager: {
      id: 'a52fba35-93af-4f3f-b6a7-d7c7efbf340f',
      display_name: 'Kiwoon',
      email: '',
      signed_at: '',
      signature: '',
    },
    payroll_deposit: {
      account_number: '',
      payroll_deposit_letter: '',
    },
    fuel_card: {
      company_name: 'Eagle Green',
      card_number: '010111001',
    },
    claims_bc: {
      basic_claim_amount: TD1BC_2026_BASIC_PERSONAL_AMOUNT,
      age_claim_amount: '' as any,
      pension_claim_amount: '' as any,
      tuition_claim_amount: '' as any,
      disability_claim_amount: '' as any,
      spouse_claim_amount: '' as any,
      dependant_claim_amount: '' as any,
      bc_caregiver_amount: '' as any,
      transfer_common_claim_amount: '' as any,
      transfer_dependant_claim_amount: '' as any,
      has_two_employeer: false,
      not_eligible: false,
      certified: false,
      td1bc_form_signature: '',
    },
    admin_checklist: {
      drug_alcohol_test: false,
      employment_offer: false,
      employment_offer_non_union: false,
      new_employee_rehire: false,
      consent_information: false,
      equipment_form: false,
      deposit_authorization: false,
      tax_credit_td1: false,
      tax_credit_td1_bc: false,
      social_fund: false,
      health_safety_manual: false,
      celebrate_diversity: false,
      vacation: false,
      handbook: false,
      fleet_form: false,
    },
    fleet_checklist: {
      current_driver_license: false,
      consent_form: false,
      commercial_driver_abstract: false,
      employee_resume: false,
      drug_alcohol_test: false,
      trip_policy: false,
      identification_policy: false,
      company_vehicle_union: false,
      company_vehicle_non_union: false,
      fuel_cards: false,
      usage_policy: false,
      behavior_policy: false,
      addtional_certification: false,
    },
    employee_checklist: {
      instructions: false,
      safety_environment: false,
      contact_info: false,
      isolation_policy: false,
      risk_management: false,
      action_policy: false,
      company_rules: false,
      hazard_assessment: false,
      responsibilities: false,
      young_worker: false,
      safety_rules: false,
      fleet_rules: false,
      worker_rights: false,
      preventative_measure: false,
      abuse_policy: false,
      training_communication: false,
      personal_protective: false,
      inspections: false,
      reporting_policy: false,
      emergency_preparedness: false,
      meeting_policy: false,
      records_statistics: false,
      safety_committee: false,
      legislation: false,
      field_level_assessment: false,
    },
    admin_checklist_hm_signature: '',
    admin_checklist_hm_signed_at: '',
    admin_checklist_hm_signer_name: '',
    fleet_checklist_hm_signature: '',
    fleet_checklist_hm_signed_at: '',
    fleet_checklist_hm_signer_name: '',
  };

  // Function to scroll to step section
  const scrollToStepSection = useCallback(() => {
    if (stepSectionRef.current) {
      stepSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, []);

  const methods = useForm<NewHire>({
    mode: 'onSubmit',
    defaultValues: formDefaulvalues,
  });

  const {
    getValues,
    setError,
    clearErrors,
    watch,
    reset,
  } = methods;

  useEffect(() => {
    if (!hiringPackageId) {
      setPackageReady(true);
      setPackageLoadError(null);
      return () => {};
    }

    let cancelled = false;
    setPackageReady(false);
    setPackageLoadError(null);

    (async () => {
      try {
        const res = await axiosInstance.get(endpoints.hiringPackages.detail(hiringPackageId));
        const row = res.data?.data;
        const fd = row?.form_data as Record<string, unknown> | undefined;
        const invitedEmail =
          typeof row?.invited_email === 'string' ? row.invited_email.trim() : '';
        const merged = merge(structuredClone(formDefaulvalues), fd ?? {}) as NewHire;
        if (!merged.contract_detail.salary_wage) {
          merged.contract_detail.salary_wage = SalaryType.WK;
        }
        if (invitedEmail) {
          merged.employee.email_address = invitedEmail;
        }
        if (!cancelled) {
          setPackageStatus(typeof row?.status === 'string' ? row.status : null);
          setPackageEmployeeUserId(
            row?.employee_user_id != null ? String(row.employee_user_id) : null
          );
          reset(merged);
          setPackageReady(true);
        }
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Could not load hiring package';
        if (!cancelled) {
          setPackageLoadError(typeof msg === 'string' ? msg : 'Could not load hiring package');
          setPackageReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // formDefaulvalues is the merge baseline; reload when the route id changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- formDefaulvalues is stable shape for this form
  }, [hiringPackageId, reset]);

  /** Prevents watch() from clearing errors in the same tick as setError() after Next / Preview validation. */
  const skipClearErrorsAfterValidationRef = useRef(false);

  // Without zodResolver, manual setError() does not clear when the user edits. Only clear on real input
  // events — clearing on every watch emission was wiping errors immediately after validation.
  useEffect(() => {
    const subscription = watch((_, info) => {
      if (skipClearErrorsAfterValidationRef.current) return;
      const t = info?.type;
      if (info?.name && (t === 'change' || t === 'changeText')) {
        clearErrors(info.name);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, clearErrors]);

  const applyZodIssuesToForm = useCallback((zodError: z.ZodError) => {
    skipClearErrorsAfterValidationRef.current = true;
    for (const issue of zodError.issues) {
      const p = issue.path;
      if (p.length === 2 && p[0] === 'supervisor_agreement' && p[1] === 'supervisor_agreement') {
        setError('supervisor_agreement', { type: 'custom', message: issue.message });
        continue;
      }
      if (
        p.length === 2 &&
        p[0] === 'safety_manager_agreement' &&
        p[1] === 'safety_manager_agreement'
      ) {
        setError('safety_manager_agreement', { type: 'custom', message: issue.message });
        continue;
      }
      const path = p.join('.') as FieldPath<NewHire>;
      if (path) {
        setError(path, { type: 'custom', message: issue.message });
      }
    }
    window.setTimeout(() => {
      skipClearErrorsAfterValidationRef.current = false;
    }, 300);
  }, [setError]);

  const onSubmit = async () => {};

  const [saving, setSaving] = useState(false);
  const [submittingHiringPackage, setSubmittingHiringPackage] = useState(false);

  const isPackageFinalized =
    packageStatus === 'completed' || Boolean(packageEmployeeUserId);

  const savePackageToServer = useCallback(async (opts?: { silent?: boolean }) => {
    if (!hiringPackageId) {
      if (!opts?.silent) {
        toast.error('Missing hiring package id');
      }
      return false;
    }
    if (!opts?.silent) {
      setSaving(true);
    }
    try {
      await axiosInstance.patch(endpoints.hiringPackages.patch(hiringPackageId), {
        form_data: getValues(),
      });
      if (!opts?.silent) {
        toast.success('Saved');
      }
      return true;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Could not save';
      toast.error(typeof msg === 'string' ? msg : 'Could not save');
      return false;
    } finally {
      if (!opts?.silent) {
        setSaving(false);
      }
    }
  }, [getValues, hiringPackageId]);

  const renderPreviewDialog = () => (
    <Dialog
      fullWidth
      maxWidth="lg"
      open={previewDialog.value}
      onClose={() => {
        previewDialog.onFalse();
        setPreviewPayload(null);
      }}
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ pb: 2 }}>Hiring Package Preview</DialogTitle>
      {previewPayload ? (
        <BlobProvider document={<HiringPackagePdfTemplate data={previewPayload} />}>
          {({ url, loading, error }) => (
            <DialogContent
              sx={{
                typography: 'body2',
                position: 'relative',
                flex: 1,
                minHeight: isMobile ? 'calc(100vh - 200px)' : '80vh',
                p: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                bgcolor: 'grey.100',
              }}
            >
              {loading && (
                <Box
                  sx={{
                    display: 'flex',
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: isMobile ? 360 : 480,
                  }}
                >
                  <CircularProgress />
                </Box>
              )}
              {error ? (
                <Box sx={{ p: 2 }}>
                  <Typography color="error">
                    {error.message ||
                      'Could not generate the PDF preview. Try again or check the console for details.'}
                  </Typography>
                </Box>
              ) : null}
              {url && !loading ? (
                <Box
                  component="iframe"
                  title="Hiring package preview"
                  src={url}
                  sx={{
                    width: '100%',
                    flex: 1,
                    minHeight: isMobile ? 'calc(100vh - 200px)' : '80vh',
                    border: 'none',
                    bgcolor: 'grey.100',
                  }}
                />
              ) : null}
            </DialogContent>
          )}
        </BlobProvider>
      ) : (
        <DialogContent
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 200,
          }}
        >
          <CircularProgress />
        </DialogContent>
      )}
      <DialogActions>
        <Button
          variant="outlined"
          color="inherit"
          disabled={submittingHiringPackage}
          onClick={() => {
            previewDialog.onFalse();
            setPreviewPayload(null);
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="success"
          disabled={submittingHiringPackage}
          onClick={async () => {
            if (!hiringPackageId) {
              toast.error('Missing hiring package id');
              return;
            }
            setSubmittingHiringPackage(true);
            try {
              const res = await axiosInstance.post(endpoints.hiringPackages.submit(hiringPackageId), {
                form_data: getValues() ?? {},
              });
              const payload = (res.data as {
                data?: {
                  welcome_email_sent?: boolean;
                  linked_existing_worker_account?: boolean;
                  linked_account?: {
                    id: string;
                    email?: string;
                    first_name?: string | null;
                    last_name?: string | null;
                    role?: string | null;
                  } | null;
                };
              })?.data;
              const welcome = payload?.welcome_email_sent;
              const linkedExisting = payload?.linked_existing_worker_account;
              const linkedAcct = payload?.linked_account;
              const linkedToastOpts =
                linkedExisting && linkedAcct?.id
                  ? {
                      description:
                        linkedAcct.role != null && String(linkedAcct.role).length > 0
                          ? `Existing account role: ${linkedAcct.role}. The employee list can hide rows that do not match the role filter.`
                          : 'The employee list can hide rows that do not match the role filter.',
                      action: {
                        label: 'Open profile',
                        onClick: () => {
                          navigate(paths.management.user.edit(linkedAcct.id));
                        },
                      },
                    }
                  : undefined;
              toast.success(
                linkedExisting
                  ? 'Submitted. This email already had a MySked account — the hiring package is linked to that employee (no new password email).'
                  : welcome
                    ? 'Submitted. The worker was emailed MySked sign-in details.'
                    : 'Submitted. Welcome email could not be sent — set up login with the worker manually.',
                linkedToastOpts
              );
              void queryClient.invalidateQueries({ queryKey: ['hiring-packages', 'list'] });
              previewDialog.onFalse();
              setPreviewPayload(null);
              navigate(paths.management.user.onboarding.list);
            } catch (err: unknown) {
              const ax = err as {
                error?: string;
                _httpStatus?: number;
                response?: { data?: { error?: string }; status?: number };
                message?: string;
              };
              const status = ax._httpStatus ?? ax.response?.status;
              const serverMsg =
                typeof ax.error === 'string' && ax.error.length > 0
                  ? ax.error
                  : ax.response?.data?.error;
              const msg =
                typeof serverMsg === 'string' && serverMsg.length > 0
                  ? serverMsg
                  : status === 403
                    ? 'You need admin access to submit a hiring package.'
                    : status === 401
                      ? 'Session expired. Sign in again.'
                      : typeof ax.message === 'string'
                        ? ax.message
                        : 'Could not submit';
              toast.error(msg);
            } finally {
              setSubmittingHiringPackage(false);
            }
          }}
          startIcon={
            submittingHiringPackage ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <Iconify icon="solar:check-circle-bold" />
            )
          }
        >
          {submittingHiringPackage ? 'Submitting…' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (hiringPackageId && !packageReady) {
    return (
      <Box
        sx={{
          minHeight: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (packageLoadError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {packageLoadError}
      </Alert>
    );
  }

  return (
    <>
      <Card ref={stepSectionRef} sx={{ p: { xs: 1, md: 2 }, mb: 2 }}>
        {isMobile ? (
          // Mobile: Vertical stepper with compact design
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ textAlign: 'center', mb: 1 }}>
              Step {currentStepIndex + 1} of {formSections.length}
            </Typography>
            <Stepper
              activeStep={currentStepIndex}
              orientation="vertical"
              sx={{ '& .MuiStepLabel-label': { fontSize: '0.875rem' } }}
            >
              {formSections.map((label, index) => (
                <Step key={index}>
                  <StepLabel
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontSize: '0.875rem',
                        fontWeight: index === currentStepIndex ? 600 : 400,
                      },
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Stack>
        ) : (
          // Desktop: Horizontal stepper with alternative label
          <Box
            ref={scrollSectionRef}
            sx={{
              overflowX: 'auto',
              flex: 1,
              scrollBehavior: 'smooth',
              /* Hide scrollbar */
              scrollbarWidth: 'none', // Firefox
              '&::-webkit-scrollbar': {
                display: 'none', // Chrome, Safari
              },
            }}
          >
            <Stepper
              ref={stepSectionRef}
              sx={{
                minWidth: 'max-content',
              }}
              activeStep={currentStepIndex}
              alternativeLabel
            >
              {formSections.map((label, index) => (
                <Step key={index} sx={{ flexShrink: 0, width: '250px' }}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}
      </Card>
      <Form methods={methods} onSubmit={onSubmit}>
        <Card sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 5 } }}>
          <Stack spacing={3}>{step}</Stack>
          <Stack spacing={2} sx={{ mt: { xs: 3, md: 5 }, width: 1 }}>
            {currentStepIndex < steps.length - 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: 1 }}>
                <Button
                  type="button"
                  variant="outlined"
                  size="large"
                  sx={{
                    minHeight: 48,
                    py: 1.25,
                    boxSizing: 'border-box',
                  }}
                  disabled={!hiringPackageId || saving}
                  onClick={() => {
                    savePackageToServer();
                  }}
                >
                  {saving ? 'Saving…' : 'Update'}
                </Button>
              </Box>
            )}

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: 1,
                gap: 1,
                flexWrap: 'nowrap',
              }}
            >
              <Box
                sx={{
                  flex: '0 0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  minWidth: { xs: 88, md: 100 },
                }}
              >
                {currentStepIndex !== 0 ? (
                  <Button
                    type="button"
                    variant="contained"
                    size="large"
                    sx={{
                      minWidth: { xs: 88, md: '100px' },
                      minHeight: 48,
                      py: 1.25,
                      boxSizing: 'border-box',
                    }}
                    onClick={() => {
                      prev();
                      setTimeout(() => {
                        scrollToStepSection();
                      }, 100);
                    }}
                  >
                    {isMobile ? 'Back' : 'Previous'}
                  </Button>
                ) : (
                  <Box
                    aria-hidden
                    sx={{ minWidth: { xs: 88, md: '100px' }, height: 1, flexShrink: 0 }}
                  />
                )}
              </Box>
              {!isMobile && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.disabled',
                    flex: '1 1 auto',
                    textAlign: 'center',
                    px: 1,
                    minWidth: 0,
                  }}
                >
                  Page {`${currentStepIndex + 1} of ${steps.length}`}
                </Typography>
              )}
              <Box
                sx={{
                  flex: '0 0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  minWidth: { xs: 88, md: 100 },
                }}
              >
                {currentStepIndex < steps.length - 1 ? (
                  <Button
                    type="button"
                    variant="contained"
                    size="large"
                    sx={{
                      minWidth: { xs: 88, md: '100px' },
                      minHeight: 48,
                      py: 1.25,
                      boxSizing: 'border-box',
                    }}
                    onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const scrollToFirstError = () => {
                      setTimeout(() => {
                        const firstErrorElement =
                          document.querySelector('[aria-invalid="true"]') ||
                          document.querySelector('.Mui-error') ||
                          document.querySelector('[role="alert"]');

                        if (firstErrorElement) {
                          firstErrorElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                          });
                        } else {
                          scrollToStepSection();
                        }
                      }, 100);
                    };

                    // Full NewHireSchema runs on every resolver trigger(), so we validate each step
                    // with a partial schema instead (social / policies / signature are not on these steps).
                    switch (currentStepIndex) {
                      case 0: {
                        clearErrors(['employee', 'emergency_contact']);
                        const step0 = NewHireEditStep0Schema.safeParse({
                          employee: getValues('employee'),
                          emergency_contact: getValues('emergency_contact'),
                        });
                        if (!step0.success) {
                          applyZodIssuesToForm(step0.error);
                          scrollToFirstError();
                          return;
                        }
                        break;
                      }
                      case 1: {
                        clearErrors(['contract_detail']);
                        const step1 = NewHireEditStep1Schema.safeParse({
                          contract_detail: getValues('contract_detail'),
                        });
                        if (!step1.success) {
                          applyZodIssuesToForm(step1.error);
                          scrollToFirstError();
                          return;
                        }
                        break;
                      }
                      case 2: {
                        clearErrors([
                          'policy_agreement',
                          'policy_agreement_signatures',
                          'supervisor_agreement',
                        ]);
                        const step2 = NewHireEditStep2Schema.safeParse({
                          policy_agreement: getValues('policy_agreement'),
                          policy_agreement_signatures: getValues('policy_agreement_signatures'),
                          supervisor_agreement: getValues('supervisor_agreement'),
                        });
                        if (!step2.success) {
                          applyZodIssuesToForm(step2.error);
                          setTimeout(() => {
                            for (const key of POLICY_AGREEMENT_KEYS) {
                              const el = document.getElementById(`policy-section-${key}`);
                              if (el?.querySelector('[role="alert"]')) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                return;
                              }
                            }
                            const firstErrorElement =
                              document.querySelector('[aria-invalid="true"]') ||
                              document.querySelector('.Mui-error') ||
                              document.querySelector('[role="alert"]');
                            if (firstErrorElement) {
                              firstErrorElement.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center',
                              });
                            } else {
                              scrollToStepSection();
                            }
                          }, 100);
                          return;
                        }
                        break;
                      }
                      default:
                        break;
                    }

                    if (hiringPackageId) {
                      const saved = await savePackageToServer({ silent: true });
                      if (!saved) return;
                    }
                    next();
                    setTimeout(() => {
                      scrollToStepSection();
                    }, 100);
                  }}
                >
                  {isMobile ? 'Next' : 'Next'}
                </Button>
              ) : isPackageFinalized ? (
              <Button
                type="button"
                variant="contained"
                color="primary"
                size="large"
                sx={{
                  minWidth: { xs: '120px', md: '140px' },
                  minHeight: 48,
                  py: 1.25,
                  px: { xs: 2.5, md: 2 },
                  boxSizing: 'border-box',
                }}
                disabled={!hiringPackageId || saving}
                onClick={() => {
                  void savePackageToServer();
                }}
              >
                {saving ? 'Saving…' : 'Update'}
              </Button>
            ) : (
              <Button
                type="button"
                variant="contained"
                color="success"
                size="large"
                sx={{
                  minWidth: { xs: '120px', md: '140px' },
                  minHeight: 48,
                  py: 1.25,
                  px: { xs: 2.5, md: 2 },
                  boxSizing: 'border-box',
                }}
                onClick={async () => {
                  skipClearErrorsAfterValidationRef.current = true;
                  clearErrors([
                    'admin_checklist_hm_signature',
                    'fleet_checklist_hm_signature',
                  ] as const);
                  const vals = getValues();
                  const bcSig = String(vals.admin_checklist_hm_signature ?? '').trim();
                  const fleetSig = String(vals.fleet_checklist_hm_signature ?? '').trim();
                  const missingBc = !bcSig;
                  const missingFleet = !fleetSig;

                  if (missingBc) {
                    setError('admin_checklist_hm_signature', {
                      type: 'manual',
                      message: 'Sign the BC admin checklist before preview.',
                    });
                  }
                  if (missingFleet) {
                    setError('fleet_checklist_hm_signature', {
                      type: 'manual',
                      message: 'Sign the fleet onboarding checklist before preview.',
                    });
                  }

                  if (missingBc || missingFleet) {
                    scrollToStepSection();
                    window.setTimeout(() => {
                      const firstId = missingBc
                        ? 'hm-attestation-bc-error'
                        : 'hm-attestation-fleet-error';
                      document.getElementById(firstId)?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                      });
                      skipClearErrorsAfterValidationRef.current = false;
                    }, 150);
                    return;
                  }

                  skipClearErrorsAfterValidationRef.current = false;
                  clearErrors();
                  if (hiringPackageId) {
                    const saved = await savePackageToServer({ silent: true });
                    if (!saved) return;
                  }
                  setPreviewPayload(getValues());
                  previewDialog.onTrue();
                }}
                startIcon={<Iconify icon="solar:eye-bold" />}
              >
                Preview & Submit
              </Button>
              )}
              </Box>
            </Box>
          </Stack>
        </Card>
      </Form>
      {!isPackageFinalized && renderPreviewDialog()}
    </>
  );
}
