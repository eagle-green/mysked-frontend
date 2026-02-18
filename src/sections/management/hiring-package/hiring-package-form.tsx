import { useForm } from 'react-hook-form';
import { use, useCallback, useMemo, useRef } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Step from '@mui/material/Step';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import useMediaQuery from '@mui/material/useMediaQuery';

import { useMultiStepForm } from 'src/hooks/use-multistep-form';

import { Form } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify/iconify';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { EmployeeHireForm } from './employee-hire-form';
import { ContractDetailForm } from './contract-detail-form';
import { EmployeeReturnTaxForm } from './employee-return-tax-form';
import { PayrollDirectDepositForm } from './payroll-direct-deposit';
import { EquipmentReturnPolicyForm } from './equipment-return-policy';
import { EmploymentEquitySurveyForm } from './employment-equity-survey-form';
import { EmployeeSocialCommitteeForm } from './employee-social-committee-form';
import { EmployeeEmergencyConsentForm } from './employee-emergency-consent-form';
import { EmploymentEquityQuestionForm } from './employment-equity-question-form';
import { SafetyPolicyAcknowledgementForm } from './safety-policy-acknowledgement-form';
import { EmployeeOrientationChecklistForm } from './employee-checklist-orientation-form';
import { FleetOnboardingDocumentationForm } from './fleet-onboarding-documentation-form';

export function HiringPackageForm() {
  const { user } = useAuthContext();
  const formSections = [
    'Contract Information & Onboarding Documentation',
    'Employee Hire Form',
    'Employee Emergency/Consent Information Form',
    'Equipment Return Policy Form',
    'Payroll Direct Deposit Form',
    'Employee Social Committee Form',
    'Employment Equity Survey Form',
    'Employment Equity Question Form',
    'Fleet Onboarding Documentation Form',
    'Safety & Policy Acknowledgement Form',
    'Employee Return Tax Form',
  ];
  const steps = useMemo(
    () => [
      <ContractDetailForm key="contract-detail-form" />,
      <EmployeeHireForm key="employee-hire-form" />,
      <EmployeeEmergencyConsentForm key="emergency-consent-form" />,
      <EquipmentReturnPolicyForm key="equipement-return-policy" />,
      <PayrollDirectDepositForm key="payroll-direct-deposit" />,
      <EmployeeSocialCommitteeForm key="employee-social-committee" />,
      <EmploymentEquitySurveyForm key="employment-equity-survey" />,
      <EmploymentEquityQuestionForm key="employment-equity-question" />,
      <FleetOnboardingDocumentationForm key="fleet-onboarding-documentation" />,
      <EmployeeOrientationChecklistForm key="employee-orientation-checklist" />,
      <SafetyPolicyAcknowledgementForm key="safety-policy-acknowledgement" />,
      <EmployeeReturnTaxForm key="employee-return-tax-from" />,
    ],
    []
  );
  const stepSectionRef = useRef<HTMLDivElement>(null);
  const scrollSectionRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width:768px)');

  const { currentStepIndex, step, prev, next } = useMultiStepForm(steps);

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
    console.log(scrollSectionRef);
    if (!scrollSectionRef.current) return;
    const amount = 200;
    scrollSectionRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  const methods = useForm<any>({
    mode: 'onChange',
    // resolver: zodResolver(FlraSchema),
    defaultValues: {
      full_name: user?.displayName || '',
      email: user?.email || '',
    },
  });

  const onSubmit = async () => {};

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
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <IconButton onClick={() => scroll('left')}>
              <Iconify icon="carbon:chevron-left" />
            </IconButton>

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

            <IconButton onClick={() => scroll('right')}>
              <Iconify icon="carbon:chevron-right" />
            </IconButton>
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
                  // onClick={async () => {
                  //   try {
                  //     setIsSubmitting(true);
                  //     const values = getValues();
                  //     await saveDraft(values);
                  //     toast.success('Form data saved successfully');
                  //   } catch (error) {
                  //     console.error('Error saving form data:', error);
                  //     toast.error('Failed to save form data');
                  //   } finally {
                  //     setIsSubmitting(false);
                  //   }
                  // }}
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

                    // // Save current form data before proceeding to next step
                    // try {
                    //   const values = getValues();
                    //   await saveDraft(values);
                    // } catch (error) {
                    //   console.error('Error saving form data:', error);
                    //   // Continue to next step even if save fails
                    // }

                    // Validate current step fields based on step index
                    let fieldsToValidate: string[] = [];

                    switch (currentStepIndex) {
                      case 0: // Assessment Details
                        fieldsToValidate = [
                          'full_name',
                          'date',
                          'site_foreman_name',
                          'contact_number',
                          'site_location',
                          'company_contract',
                          'closest_hospital',
                          'start_time',
                          'end_time',
                          'first_aid_on_site',
                          'first_aid_kit',
                          'descriptionOfWork.road',
                          'descriptionOfWork.distance',
                          'descriptionOfWork.weather',
                          'scopeOfWork.roadType',
                          'scopeOfWork.contractToolBox',
                          'scopeOfWork.otherDescription',
                          'present.identified',
                          'present.reduce',
                          'present.experienced',
                          'present.complete',
                        ];
                        break;
                      case 1: // Risk Assessments
                        fieldsToValidate = [
                          'riskAssessment.visibility',
                          'riskAssessment.lineOfSight',
                          'riskAssessment.slipAndStrip',
                          'riskAssessment.holes',
                          'riskAssessment.weather',
                          'riskAssessment.dust',
                          'riskAssessment.fumes',
                          'riskAssessment.noise',
                          'riskAssessment.blindSpot',
                          'riskAssessment.overHeadLines',
                          'riskAssessment.workingAlone',
                          'riskAssessment.mobileEquipment',
                          'riskAssessment.trafficVolume',
                          'riskAssessment.conditions',
                          'riskAssessment.utilities',
                          'riskAssessment.fatigue',
                          'riskAssessment.controlMeasure',
                        ];
                        break;
                      case 2: // Traffic Control Plan
                        fieldsToValidate = [
                          'supervisionLevel',
                          'responsibilities',
                          'updates',
                          'authorizations',
                        ];
                        break;
                      case 3: // FLRA Diagram
                        fieldsToValidate = ['flraDiagram'];
                        break;
                      case 4: // Signature
                        fieldsToValidate = ['signature'];
                        break;
                      default:
                        break;
                    }

                    // Trigger validation for the current step
                    // const isValid =
                    //   fieldsToValidate.length > 0 ? await trigger(fieldsToValidate as any) : true;

                    // if (!isValid) {
                    //   // Find the first error field and scroll to it
                    //   setTimeout(() => {
                    //     // Try to find the first error element in the DOM
                    //     const firstErrorElement =
                    //       document.querySelector('[aria-invalid="true"]') ||
                    //       document.querySelector('.Mui-error') ||
                    //       document.querySelector('[role="alert"]');

                    //     if (firstErrorElement) {
                    //       // Scroll to the first error with some offset
                    //       firstErrorElement.scrollIntoView({
                    //         behavior: 'smooth',
                    //         block: 'center',
                    //       });
                    //     } else {
                    //       // Fallback to scroll to step section
                    //       scrollToStepSection();
                    //     }
                    //   }, 100);
                    //   return;
                    // }

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
                // onClick={async () => {
                //   const values = getValues();

                //   // Trigger validation for signature field
                //   const isValid = await methods.trigger('signature');
                //   if (!isValid) {
                //     return; // Zod error will be displayed automatically
                //   }

                //   setPreviewData(values);
                //   previewDialog.onTrue();
                // }}
                startIcon={<Iconify icon="solar:eye-bold" />}
              >
                Preview & Submit
              </Button>
            )}
          </Stack>
        </Card>
      </Form>
    </>
  );
}
