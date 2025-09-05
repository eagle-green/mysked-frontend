import { useForm } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useMultiStepForm } from 'src/hooks/use-multistep-form';

import { Form } from 'src/components/hook-form';

import { AssessmentDetailForm } from './assessment-detail-form';

export function FieldLevelRiskAssessment() {
  const { currentStepIndex, steps, step, prev, next } = useMultiStepForm([
    <AssessmentDetailForm />,
    <Box sx={{ display: 'flex', gap: 2 }}>Form 2</Box>,
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
      <Form methods={methods} onSubmit={onSubmit}>
        <Card sx={{ py: 3, px: 5 }}>
          <Stack spacing={3}>{step}</Stack>
          <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ py: 3 }}>
            <Stack>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                Page {`${currentStepIndex + 1} / ${steps.length}`}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              {currentStepIndex !== 0 && (
                <Button type="button" variant="contained" onClick={prev}>
                  Prev
                </Button>
              )}
              <Button type="button" variant="contained" onClick={next}>
                {currentStepIndex === steps.length - 1 ? 'Submit' : 'Next'}
              </Button>
            </Stack>
          </Stack>
        </Card>
      </Form>
    </>
  );
}
