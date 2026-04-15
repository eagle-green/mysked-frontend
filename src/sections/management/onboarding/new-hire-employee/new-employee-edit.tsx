import { useForm } from 'react-hook-form';
import { PDFViewer } from '@react-pdf/renderer';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { use, useCallback, useMemo, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Step from '@mui/material/Step';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';

import { useMultiStepForm } from 'src/hooks/use-multistep-form';

import { Form } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify/iconify';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { NewHire, WorkSchedule } from 'src/types/new-hire';

import { NewHireSchema } from './new-hire-employee-form';
import { EmployeeInformationEditForm } from './new-employee-edit-form';
import { NewEmployeeAcknowledgement } from './new-employee-acknowledgement';
import { EmployeeContractDetailForm } from './employee-contract-detail-form';
import HiringPackagePdfTemplate from '../../hiring-package/template/hiring-package-template';
import { AdminPreHireOnboardingDocumentationBcForm } from './admin-pre-hire-onboarding-bc-form';

export function NewEmployeeEditForm() {
  const { user } = useAuthContext();
  const previewDialog = useBoolean();
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
      employee_name: 'Fortillano, Jerwin',
      position: 'Software Engineer',
      rate: 9,
      employee_signature: '',
      area: '',
      department: 'IT Dept',
      home_cost_centre: 'PH',
      job_number: 'JO-00001',
      is_union: '',
      is_refered: '',
      hrsp: '',
      comments: '',
      supper_intendent_signature: '',
      area_manager_signature: '',
      president_signature: '',
      salary_wage: '',
      work_schedule: '',
    },
    employee: {
      last_name: 'Fortillano',
      first_name: 'Jerwin',
      middle_initial: 'Tosil',
      sin: 'SN-001',
      gender: 'male',
      date_of_birth: new Date().toISOString(),
      address: 'Antilla Subd., Zone 1, Barangay 2',
      city: 'Silay City',
      province: 'Negros Occidental',
      postal_code: '6116',
      home_phone_no: '09205643021',
      cell_no: '09205643021',
      email_address: 'jerwin.fortillano22@gmail.com',
      signature:
        'data:image/png;base64,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',
      medical_allergies: '',
      country: 'Philippines',
      employee_number: '2026-0001',
    },
    emergency_contact: {
      last_name: 'Fortillano',
      first_name: 'Sarah',
      middle_initial: 'Tosil',
      address: 'Antilla Subd., Zone 1, Barangay 2',
      city: 'Silay City',
      postal_code: '6116',
      phone_no: '09205643021',
      cell_no: '09205643021',
      relationship: 'Mother',
    },
    equipments: [
      {
        equipment_name: '',
        quantity: 0,
      },
    ],
    information_consent: true,
    payroll_consent: true,
    return_policy_consent: false,
    socialAgreement: {
      is_join_social_committee: false,
      authorize_deduction: false,
      not_agree_deduction: false,
    },
    celebrate_diversity_consent: false,
    equity_question: {
      is_aboriginal_person: 'yes',
      is_visible_minority: 'yes',
      is_participation_voluntary: 'yes',
    },
    hr_manager: {
      id: '',
      display_name: 'Sample Hiring Manager',
      email: '',
      signed_at: '',
      signature:
        'data:image/png;base64,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',
    },
    area_manager: {
      id: '',
      display_name: 'Sample Area Manager',
      email: '',
      signed_at: '',
      signature:
        'data:image/png;base64,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',
    },
    president: {
      id: '',
      display_name: 'Sample President',
      email: '',
      signed_at: '',
      signature:
        'data:image/png;base64,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',
    },
    policy_agreement: {
      safety_company_protocols: true,
      company_hr_policies_703: true,
      company_hr_policies_704: true,
      company_fleet_policies_gen_002: true,
      company_fleet_policies_gen_003: true,
      company_fleet_policies_ncs_001: true,
      company_fleet_policies_ncs_003u: true,
      company_fire_extiguisher: true,
      company_rules: true,
      motive_cameras: true,
    },
    claims: {
      basic_claim_amount: 0,
      parent_claim_amount: 0,
      age_claim_amount: 0,
      pension_claim_amount: 0,
      tuition_claim_amount: 0,
      disability_claim_amount: 0,
      spouse_claim_amount: 0,
      dependant_claim_amount: 0,
      dependent_common_claim_amount: 0,
      infirm_dependent_claim_amount: 0,
      transfer_common_claim_amount: 0,
      transfer_partner_claim_amount: 0,
      has_two_employeer: false,
      not_eligible: false,
      is_non_resident: '',
      certified: false,
    },
    supervisor_agreement: {
      safety_company_protocols: false,
      company_rules: false,
      motive_cameras: false,
      company_fire_extiguisher: false,
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
      basic_claim_amount: 0,
      age_claim_amount: 0,
      pension_claim_amount: 0,
      tuition_claim_amount: 0,
      disability_claim_amount: 0,
      spouse_claim_amount: 0,
      dependant_claim_amount: 0,
      bc_caregiver_amount: 0,
      transfer_common_claim_amount: 0,
      transfer_dependant_claim_amount: 0,
      has_two_employeer: false,
      not_eligible: false,
      certified: false,
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

  const scroll = (direction: string) => {
    if (!scrollSectionRef.current) return;
    const amount = 200;
    scrollSectionRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  const methods = useForm<NewHire>({
    mode: 'onChange',
    resolver: zodResolver(NewHireSchema),
    defaultValues: formDefaulvalues,
  });

  const {
    getValues,
    trigger,
    formState: { errors },
  } = methods;

  const onSubmit = async () => {};

  const { supervisor, safety_manager } = getValues();

  const isSupervisor = supervisor.id === user?.id;
  const isSafetyManger = safety_manager.id === user?.id;

  const renderPreviewDialog = () => {
    // Transform data for preview FIRST (before using it)
    const values = getValues();
    return (
      <Dialog
        fullWidth
        maxWidth="lg"
        open={previewDialog.value}
        onClose={previewDialog.onFalse}
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ pb: 2 }}>Hiring Package Preview</DialogTitle>
        <DialogContent
          sx={{
            typography: 'body2',
            height: isMobile ? 'calc(100vh - 200px)' : '80vh',
            p: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <PDFViewer width="100%" height="100%" showToolbar>
            <HiringPackagePdfTemplate data={values} />
          </PDFViewer>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => {
              previewDialog.onFalse();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => {}}
            startIcon={<Iconify icon="solar:check-circle-bold" />}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

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
          <Stack
            direction="row"
            spacing={2}
            justifyContent="space-between"
            alignItems="center"
            mt={{ xs: 3, md: 5 }}
          >
            {currentStepIndex !== 0 ? (
              <Button
                type="button"
                variant="contained"
                size="large"
                sx={{ minWidth: { xs: '80px', md: '100px' } }}
                onClick={() => {
                  prev();
                  // Scroll to step section after a brief delay to allow step to update
                  setTimeout(() => {
                    scrollToStepSection();
                  }, 100);
                }}
              >
                {isMobile ? 'Back' : 'Previous'}
              </Button>
            ) : (
              <Stack />
            )}
            {!isMobile && (
              <Stack>
                <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                  Page {`${currentStepIndex + 1} of ${steps.length}`}
                </Typography>
              </Stack>
            )}

            {currentStepIndex < steps.length - 1 ? (
              <Stack direction="row" spacing={2}>
                {/* Update button - show on all steps except the last one */}
                <Button
                  type="button"
                  variant="outlined"
                  size="large"
                  sx={{ minWidth: { xs: '80px', md: '100px' } }}
                  disabled={false}
                >
                  {/* {isSubmitting ? 'Saving...' : 'Update'} */} Update
                </Button>

                <Button
                  type="button"
                  variant="contained"
                  size="large"
                  sx={{ minWidth: { xs: '80px', md: '100px' } }}
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Validate current step fields based on step index
                    let fieldsToValidate: string[] = [];

                    switch (currentStepIndex) {
                      case 0: // Optional for employee information (MANAGEMENT FLOW)
                        fieldsToValidate = [];
                        break;
                      case 1: // contract details
                        fieldsToValidate = ['contract_detail'];
                        break;
                      case 2: // acknowlegement
                        fieldsToValidate = [
                          isSupervisor
                            ? 'supervisor_agreement'
                            : isSafetyManger
                              ? 'safety_manager_agreement'
                              : '',
                        ];
                        break;
                      default:
                        break;
                    }

                    const isValid =
                      fieldsToValidate.length > 0 ? await trigger(fieldsToValidate as any) : true;

                    if (!isValid) {
                      // Find the first error field and scroll to it

                      if (errors.supervisor_agreement || errors.safety_manager_agreement) {
                        scrollToStepSection();
                      }

                      setTimeout(() => {
                        // Try to find the first error element in the DOM
                        const firstErrorElement =
                          document.querySelector('[aria-invalid="true"]') ||
                          document.querySelector('.Mui-error') ||
                          document.querySelector('[role="alert"]');

                        if (firstErrorElement) {
                          // Scroll to the first error with some offset
                          firstErrorElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                          });
                        } else {
                          // Fallback to scroll to step section
                          scrollToStepSection();
                        }
                      }, 100);
                      return;
                    }

                    next();
                    // Scroll to step section after a brief delay to allow step to update
                    setTimeout(() => {
                      scrollToStepSection();
                    }, 100);
                  }}
                >
                  {isMobile ? 'Next' : 'Next'}
                </Button>
              </Stack>
            ) : (
              <Button
                type="button"
                variant="contained"
                color="success"
                size={isMobile ? 'medium' : 'large'}
                sx={{ minWidth: { xs: '120px', md: '140px' } }}
                onClick={async () => {
                  const fieldsToValidate = [
                    isSupervisor
                      ? 'supervisor_agreement'
                      : isSafetyManger
                        ? 'safety_manager_agreement'
                        : '',
                  ];
                  await trigger(fieldsToValidate as any);

                  if (errors.supervisor_agreement || errors.safety_manager_agreement) {
                    scrollToStepSection();
                    return;
                  }

                  const values = getValues();
                  console.log(values);
                  console.log(errors);
                  previewDialog.onTrue();
                }}
                startIcon={<Iconify icon="solar:eye-bold" />}
              >
                Preview & Submit
              </Button>
            )}
          </Stack>
        </Card>
      </Form>
      {renderPreviewDialog()}
    </>
  );
}
