import { useForm } from 'react-hook-form';
import { PDFViewer } from '@react-pdf/renderer';
import { useBoolean } from 'minimal-shared/hooks';
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

import { EmployeeInformationEditForm } from './new-employee-edit-form';
import { NewEmployeeAcknowledgement } from './new-employee-acknowledgement';
import { EmployeeContractDetailForm } from './employee-contract-detail-form';
import HiringPackagePdfTemplate from '../../hiring-package/template/hiring-package-template';

export function NewEmployeeEditForm() {
  const { user } = useAuthContext();
  const previewDialog = useBoolean();
  const formSections = ['Employee Information', 'Contract Details', 'Review & Acknowledgement'];
  const steps = useMemo(
    () => [
      <EmployeeInformationEditForm key="employee-information" />,
      <EmployeeContractDetailForm key="contract-detail" />,
      <NewEmployeeAcknowledgement key="review-acknowledgement" />,
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
      signature: null,
      medical_allergies: 'N/A',
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
      signed_at: null,
      signature: '',
    },
    area_manager: {
      id: '',
      display_name: '',
      email: '',
      signed_at: null,
      signature: '',
    },
    president: {
      id: '',
      display_name: '',
      email: '',
      signed_at: null,
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
    claims: {
      basic_claim_amount: 0,
      parent_claim_amount: 0,
      age_claim_amount: 0,
      pension_claim_amount: 0,
      tuition_claim_amount: 0,
      disability_claim_amount: 0,
      spouse_claim_amount: 0,
      dependant_claim_amount: 0,
      infirm_dependent_claim_amount: 0,
      transfer_common_claim_amount: 0,
      transfer_partner_claim_amount: 0,
      total_claim_amount: 0,
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
    mode: 'onSubmit',
    // resolver: zodResolver(FlraSchema),
    defaultValues: formDefaulvalues,
  });

  const { getValues } = methods;

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
                      case 0: // Assessment Details
                        fieldsToValidate = [];
                        break;
                      case 1:
                        fieldsToValidate = [];
                        break;
                      case 2:
                        fieldsToValidate = [];
                        break;
                      case 3:
                        fieldsToValidate = [''];
                        break;
                      case 4:
                        fieldsToValidate = [''];
                        break;
                      default:
                        break;
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
