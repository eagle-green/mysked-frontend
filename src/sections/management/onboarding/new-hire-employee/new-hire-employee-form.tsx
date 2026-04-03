import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { PDFViewer } from '@react-pdf/renderer';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { use, useCallback, useMemo, useRef } from 'react';

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

import { NewHire } from 'src/types/new-hire';

import { EquipmentReturnPolicyForm } from './equipment-return-policy-form';
import { EmployeeTaxCreditReturnBcForm } from './employee-tax-credit-bc-form';
import { EmployeeSocialCommitteeForm } from './social-committee-diversity-form';
import { EmployeeTaxCreditReturnForm } from './employee-tax-credit-return-form';
import { NewEmployeePersonalInformation } from './new-employee-personal-information';
import { SafetyPolicyAcknowledgementForm } from './safety-policy-acknowledgement-form';
import HiringPackagePdfTemplate from '../../hiring-package/template/hiring-package-template';

// Common validators
const requiredString = z.string().min(1, 'This field is required.');
const optionalString = z.string().optional();
const optionalNumber = z
  .number({
    invalid_type_error: 'This field must be a number',
  })
  .optional();
const optionalBolean = z.boolean().optional();

// Employee Information
export const EmployeeInformationSchema = z.object({
  last_name: requiredString,
  first_name: requiredString,
  middle_initial: optionalString,
  sin: requiredString,
  date_of_birth: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  gender: requiredString,
  address: requiredString,
  city: requiredString,
  province: requiredString,
  postal_code: requiredString,
  home_phone_no: optionalString,
  cell_no: requiredString,
  email_address: z.string().email('Invalid email'),
  signature: requiredString,
  medical_allergies: optionalString,
  country: requiredString,
  employee_number: requiredString,
});

// Emergency Contact
export const EmergencyContactSchema = z.object({
  last_name: optionalString,
  first_name: optionalString,
  middle_initial: optionalString,
  address: optionalString,
  city: optionalString,
  postal_code: optionalString,
  phone_no: optionalString,
  cell_no: optionalString,
  relationship: optionalString,
});

// Contract Details
export const ContractDetailsSchema = z.object({
  date: optionalString,
  hire_date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  start_date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  employee_name: optionalString,
  position: requiredString,
  rate: z.number().min(0, 'Must be positive'),
  employee_signature: optionalString,
  area: optionalString,
  department: requiredString,
  home_cost_centre: optionalString,
  job_number: optionalString,
  is_union: requiredString,
  work_schedule: requiredString,
  is_refered: requiredString,
  hrsp: requiredString,
  salary_wage: requiredString,
  comments: optionalString,
  supper_intendent_signature: optionalString,
  area_manager_signature: optionalString,
  president_signature: optionalString,
  refered_by: optionalString,
  employee_number: optionalString,
  social_insurance_number: optionalString,
});

// Social Agreement
export const SocialAgreementSchema = z
  .object({
    is_join_social_committee: optionalBolean,
    authorize_deduction: optionalBolean,
    not_agree_deduction: optionalBolean,
  })
  .superRefine((data, ctx) => {
    if (data.authorize_deduction && data.not_agree_deduction) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cannot select both',
        path: ['authorize_deduction'],
      });

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cannot select both',
        path: ['not_agree_deduction'],
      });
    }
  });

// Equity Question
export const EquityQuestionSchema = z
  .object({
    is_aboriginal_person: requiredString,
    is_visible_minority: requiredString,
    is_participation_voluntary: optionalString,
    participation_voluntary_text: optionalString,
  })
  .superRefine((data, ctx) => {
    if (data.is_participation_voluntary === 'yes' && !data.participation_voluntary_text) {
      ctx.addIssue({
        path: ['participation_voluntary_text'],
        code: z.ZodIssueCode.custom,
        message: 'Required',
      });
    }
  });

// Important Personnel
export const ImportantPersonnelSchema = z.object({
  id: requiredString,
  display_name: requiredString,
  email: z.string().email(),
  signed_at: requiredString,
  signature: requiredString,
});

// Policy Agreement
export const PolicyAgreementSchema = z
  .object({
    safety_company_protocols: z.boolean(),
    company_rules: z.boolean(),
    motive_cameras: z.boolean(),
    company_hr_policies_703: z.boolean(),
    company_hr_policies_704: z.boolean(),
    company_fleet_policies_gen_002: z.boolean(),
    company_fleet_policies_gen_003: z.boolean(),
    company_fleet_policies_ncs_001: z.boolean(),
    company_fleet_policies_ncs_003u: z.boolean(),
    company_fire_extiguisher: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!Object.values(data).every((val) => !!val)) {
      ctx.addIssue({
        path: ['policy_agreement'],
        code: z.ZodIssueCode.custom,
        message: 'You must review & accept all policies before proceeding.',
      });
    }
  });

export const ManagementAgreementSchema = z
  .object({
    safety_company_protocols: z.boolean(),
    company_rules: z.boolean(),
    motive_cameras: z.boolean(),
    company_fire_extiguisher: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!Object.values(data).every((val) => !!val)) {
      ctx.addIssue({
        path: ['supervisor_agreement', 'supervisor_agreement'],
        code: z.ZodIssueCode.custom,
        message: 'You must review & accept all policies before proceeding.',
      });
    }
  });

// Tax Credit Return
export const EmployeeTaxCreditReturnSchema = z.object({
  basic_claim_amount: z.number(),
  parent_claim_amount: z.number(),
  age_claim_amount: z.number(),
  pension_claim_amount: z.number(),
  tuition_claim_amount: z.number(),
  disability_claim_amount: z.number(),
  spouse_claim_amount: z.number(),
  dependant_claim_amount: z.number(),
  dependent_common_claim_amount: z.number(),
  infirm_dependent_claim_amount: z.number(),
  transfer_common_claim_amount: z.number(),
  transfer_partner_claim_amount: z.number(),
  has_two_employeer: z.boolean(),
  not_eligible: z.boolean(),
  is_non_resident: z.string(),
  certified: z.boolean().refine((value) => !!value, {
    message: 'Please confirm or ceritify before proceeding.',
  }),
});

// Tax Credit Return BC
export const EmployeeTaxCreditReturnBcSchema = z.object({
  basic_claim_amount: z.number(),
  age_claim_amount: z.number(),
  pension_claim_amount: z.number(),
  tuition_claim_amount: z.number(),
  disability_claim_amount: z.number(),
  spouse_claim_amount: z.number(),
  dependant_claim_amount: z.number(),
  bc_caregiver_amount: z.number(),
  transfer_common_claim_amount: z.number(),
  transfer_dependant_claim_amount: z.number(),
  has_two_employeer: z.boolean(),
  not_eligible: z.boolean(),
  certified: z.boolean().refine((value) => !!value, {
    message: 'Please confirm or ceritify before proceeding.',
  }),
});

// Equipment
const EquipmentSchema = z.object({
  equipment_name: requiredString,
  quantity: z
    .number({
      invalid_type_error: 'Quantity must be a number',
    })
    .min(1, {
      message: 'Quantity cannot be negative and minimum 1',
    }),
});

export const PayrollDepositSchema = z
  .object({
    account_number: z.string().optional(),
    payroll_deposit_letter: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.account_number && !data.payroll_deposit_letter) {
      ctx.addIssue({
        path: ['account_number'],
        code: z.ZodIssueCode.custom,
        message: 'Account number or bank letter is required',
      });
    }
  });

export const FuelCardSchema = z.object({
  company_name: requiredString,
  card_number: requiredString,
});

// Main Schema
export const NewHireSchema = z.object({
  contract_detail: ContractDetailsSchema,
  employee: EmployeeInformationSchema,
  emergency_contact: EmergencyContactSchema,
  equipments: z.array(EquipmentSchema).superRefine((items, ctx) => {
    const seen = new Set<string>();

    items.forEach((item, index) => {
      if (seen.has(item.equipment_name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Duplicate equipment name is not allowed',
          path: [index, 'equipment_name'], // points to the exact field
        });
      } else {
        seen.add(item.equipment_name);
      }
    });
  }),
  information_consent: z.boolean().refine((val) => !!val, { message: '' }),
  payroll_consent: optionalBolean,
  return_policy_consent: z.boolean().refine((val) => !!val, { message: '' }),
  socialAgreement: SocialAgreementSchema,
  celebrate_diversity_consent: optionalBolean,
  equity_question: EquityQuestionSchema,
  hr_manager: ImportantPersonnelSchema,
  area_manager: ImportantPersonnelSchema,
  president: ImportantPersonnelSchema,
  supervisor: ImportantPersonnelSchema,
  safety_manager: ImportantPersonnelSchema,
  policy_agreement: PolicyAgreementSchema,
  supervisor_agreement: ManagementAgreementSchema,
  safety_manager_agreement: ManagementAgreementSchema,
  claims: EmployeeTaxCreditReturnSchema,
  payroll_deposit: PayrollDepositSchema,
  fuel_card: FuelCardSchema,
  claims_bc: EmployeeTaxCreditReturnBcSchema,
});

export function NewHireEmployeeInformationForm() {
  const { user } = useAuthContext();
  const previewDialog = useBoolean();
  const formSections = [
    'Personal Information',
    'Equipment Return',
    'Social & EG Diversity',
    'Safety Guidelines & Rules',
    'Personal Tax Credit Return (TD1)',
    'British Columbia Personal Tax Credit Return (TD1 BC)',
  ];
  const steps = useMemo(
    () => [
      <NewEmployeePersonalInformation key="personal-information" />,
      <EquipmentReturnPolicyForm key="equipment-return-policy" />,
      <EmployeeSocialCommitteeForm key="social-committee" />,
      <SafetyPolicyAcknowledgementForm key="safety-protocls-company-rules" />,
      <EmployeeTaxCreditReturnForm key="employee-tax-credit-return" />,
      <EmployeeTaxCreditReturnBcForm key="employee-tax-credit-return-bc" />,
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
      area: 'N/A',
      department: 'IT Dept',
      home_cost_centre: 'PH',
      job_number: 'JO-00001',
      is_union: '',
      is_refered: '',
      hrsp: '',
      comments: 'N/A',
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
      signature: '',
      medical_allergies: 'N/A',
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
    information_consent: false,
    payroll_consent: false,
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
      safety_company_protocols: true,
      company_hr_policies_703: true,
      company_hr_policies_704: true,
      company_fleet_policies_gen_002: false,
      company_fleet_policies_gen_003: true,
      company_fleet_policies_ncs_001: true,
      company_fleet_policies_ncs_003u: true,
      company_fire_extiguisher: false,
      company_rules: true,
      motive_cameras: true,
    },
    claims: {
      basic_claim_amount: 16129.0,
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
      id: '',
      display_name: '',
      email: '',
      signed_at: '',
      signature: '',
    },
    safety_manager: {
      id: '',
      display_name: '',
      email: '',
      signed_at: '',
      signature: '',
    },
    payroll_deposit: {
      account_number: '',
      payroll_deposit_letter: '',
    },
    fuel_card: {
      company_name: '',
      card_number: '',
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
    resolver: zodResolver(NewHireSchema),
    defaultValues: formDefaulvalues,
  });

  const {
    getValues,
    trigger,
    setError,
    formState: { errors },
  } = methods;

  const onSubmit = async () => {};

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
                <Step key={index} sx={{ flexShrink: 0, width: '150px' }}>
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
                      case 0: // Employee Personal Information
                        fieldsToValidate = [
                          'information_consent',
                          'employee',
                          'equity_question',
                          'payroll_deposit',
                        ];
                        break;
                      case 1: // Return Equipments
                        fieldsToValidate = ['return_policy_consent', 'equipments'];
                        break;
                      case 2: // Social Committee (optional)
                        fieldsToValidate = ['socialAgreement'];
                        break;
                      case 3: // Review Policies
                        fieldsToValidate = ['policy_agreement'];
                        break;
                      case 4:
                        fieldsToValidate = ['claims'];
                        break;
                      default:
                        break;
                    }

                    const isValid =
                      fieldsToValidate.length > 0 ? await trigger(fieldsToValidate as any) : true;

                    if (!isValid) {
                      if (errors.policy_agreement) {
                        scrollToStepSection();
                      }
                      // Find the first error field and scroll to it
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
                  const isValid = await trigger(['claims_bc']);

                  if (!isValid) {
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

                    return;
                  }

                  const values = getValues();
                  console.log(values);
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
