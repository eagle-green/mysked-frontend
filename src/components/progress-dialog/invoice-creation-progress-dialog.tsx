import { useState, useEffect } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import Dialog from '@mui/material/Dialog';
import Stepper from '@mui/material/Stepper';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { type ProgressStep } from './types';

// ----------------------------------------------------------------------

interface InvoiceCreationProgressDialogProps {
  open: boolean;
  steps: ProgressStep[];
  currentStep: number;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
}

export function InvoiceCreationProgressDialog({
  open,
  steps,
  currentStep,
  onClose,
  title = 'Generating Invoice',
  subtitle = 'Please wait while we process your request. Do not close this window or navigate away.',
}: InvoiceCreationProgressDialogProps) {
  const [progress, setProgress] = useState(0);

  // Calculate progress percentage
  useEffect(() => {
    const completedSteps = steps.filter((step) => step.status === 'completed').length;
    const totalSteps = steps.length;
    const newProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
    setProgress(newProgress);
  }, [steps]);

  const getStepIcon = (stepIndex: number, step: ProgressStep) => {
    if (step.status === 'completed') {
      return (
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            bgcolor: 'success.main',
            color: 'success.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 'bold',
          }}
        >
          ✓
        </Box>
      );
    }

    if (step.status === 'active') {
      return (
        <CircularProgress
          size={24}
          thickness={4}
          sx={{
            color: 'primary.main',
          }}
        />
      );
    }

    if (step.status === 'error') {
      return (
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            bgcolor: 'error.main',
            color: 'error.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 'bold',
          }}
        >
          ✕
        </Box>
      );
    }

    // pending
    return (
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.2),
          color: 'text.disabled',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 'bold',
        }}
      >
        {stepIndex + 1}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={undefined} // Prevent closing by clicking outside
      disableEscapeKeyDown // Prevent closing with escape key
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: 400,
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.2),
            }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: 'block', textAlign: 'center' }}
          >
            {Math.round(progress)}% Complete
          </Typography>
        </Box>

        <Stepper orientation="vertical" activeStep={currentStep}>
          {steps.map((step, index) => (
            <Step key={step.label} completed={step.status === 'completed'}>
              <StepLabel
                icon={getStepIcon(index, step)}
                error={step.status === 'error'}
                sx={{
                  '& .MuiStepLabel-label': {
                    fontWeight: step.status === 'active' ? 'bold' : 'normal',
                    color:
                      step.status === 'active'
                        ? 'primary.main'
                        : step.status === 'completed'
                          ? 'success.main'
                          : step.status === 'error'
                            ? 'error.main'
                            : 'text.secondary',
                  },
                }}
              >
                <Typography variant="subtitle2">{step.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {step.description}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Warning message */}
        <Box
          sx={{
            mt: 4,
            mb: 4,
            p: 2,
            borderRadius: 1,
            bgcolor: (theme) => varAlpha(theme.vars.palette.warning.mainChannel, 0.1),
            border: (theme) => `1px solid ${varAlpha(theme.vars.palette.warning.mainChannel, 0.2)}`,
          }}
        >
          <Typography variant="caption" color="warning.dark" sx={{ fontWeight: 'medium' }}>
            ⚠️ Important: Please do not close this window, refresh the page, or navigate away until
            the process is complete.
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

