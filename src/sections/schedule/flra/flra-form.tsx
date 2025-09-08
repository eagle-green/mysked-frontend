import { useForm } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Step from '@mui/material/Step';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';

import { useMultiStepForm } from 'src/hooks/use-multistep-form';

import { Form } from 'src/components/hook-form';

import { RiskAssessmentForm } from './risk-assessment-form';
import { AssessmentDetailForm } from './assessment-detail-form';
import { TrafficControlPlanForm } from './traffic-control-plan-form';

export function FieldLevelRiskAssessment() {
  const formSections = [
    'Assessment Details',
    'Risk Assessments',
    'Traffic Control Plan',
    'Review & Submission',
  ];
  const { currentStepIndex, steps, step, prev, next } = useMultiStepForm([
    <AssessmentDetailForm />,
    <RiskAssessmentForm />,
    <TrafficControlPlanForm />,
  ]);

  const methods = useForm<any>({
    mode: 'all',
    // resolver: zodResolver(),
    defaultValues: {},
  });

  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting, errors },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    console.log(data);
  });
  return (
    <>
      <Card sx={{ p: 2, mb: 2 }}>
        <Stepper activeStep={currentStepIndex} alternativeLabel>
          {formSections.map((label, index) => (
            <Step key={index}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Card>
      <Form methods={methods} onSubmit={onSubmit}>
        <Card sx={{ py: 3, px: 5 }}>
          <Stack spacing={3}>{step}</Stack>
          <Stack
            direction="row"
            spacing={2}
            justifyContent="space-between"
            alignItems="center"
            mt={5}
          >
            {currentStepIndex !== 0 && (
              <Button type="button" variant="contained" onClick={prev}>
                Prev
              </Button>
            )}
            <Stack>
              <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                Page {`${currentStepIndex + 1} out of  ${steps.length}`}
              </Typography>
            </Stack>
            <Button type="button" variant="contained" onClick={next}>
              {currentStepIndex === steps.length - 1 ? 'Submit' : 'Next'}
            </Button>
          </Stack>
        </Card>
      </Form>
    </>
  );
}
