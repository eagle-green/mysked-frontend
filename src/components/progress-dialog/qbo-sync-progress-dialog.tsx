import React from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Stepper from '@mui/material/Stepper';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
import StepContent from '@mui/material/StepContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { type ProgressStep } from './types';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  steps: ProgressStep[];
  currentStep: number;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  allowClose?: boolean;
};

export function QboSyncProgressDialog({
  open,
  steps,
  currentStep,
  onClose,
  title = 'Syncing from QuickBooks',
  subtitle = 'Please wait while we sync data from QuickBooks Online. This may take a few moments. Do not close this window or navigate away.',
  allowClose = false,
}: Props) {
  const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;
  const isCompleted = currentStep >= steps.length - 1 && steps[steps.length - 1]?.status === 'completed';
  const hasError = steps.some((step) => step.status === 'error');

  return (
    <Dialog
      open={open}
      onClose={allowClose ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={!allowClose}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {!isCompleted && !hasError && <CircularProgress size={24} />}
          <Box>
            <Typography variant="h6" component="div">
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 0 }}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(progress)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.16),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: hasError ? 'error.main' : 'primary.main',
              },
            }}
          />
        </Box>

        <Stepper activeStep={currentStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                error={step.status === 'error'}
                sx={{
                  '& .MuiStepLabel-label': {
                    fontWeight: step.status === 'active' ? 600 : 400,
                    color: step.status === 'error' ? 'error.main' : 'inherit',
                  },
                }}
              >
                {step.label}
              </StepLabel>
              {step.description && (
                <StepContent>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                  {step.status === 'error' && step.error && (
                    <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
                      Error: {step.error}
                    </Typography>
                  )}
                </StepContent>
              )}
            </Step>
          ))}
        </Stepper>

        {isCompleted && (
          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 1,
              backgroundColor: (theme) => varAlpha(theme.vars.palette.success.mainChannel, 0.08),
              border: (theme) => `1px solid ${varAlpha(theme.vars.palette.success.mainChannel, 0.24)}`,
            }}
          >
            <Typography variant="body2" color="success.dark" sx={{ fontWeight: 600 }}>
              ✓ Sync completed successfully!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Data has been synchronized and the list has been updated.
            </Typography>
          </Box>
        )}

        {hasError && (
          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 1,
              backgroundColor: (theme) => varAlpha(theme.vars.palette.error.mainChannel, 0.08),
              border: (theme) => `1px solid ${varAlpha(theme.vars.palette.error.mainChannel, 0.24)}`,
            }}
          >
            <Typography variant="body2" color="error.dark" sx={{ fontWeight: 600 }}>
              ✗ Sync failed
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              There was an error syncing data from QuickBooks. Please try again.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 3 }}>
        {(isCompleted || hasError || allowClose) && (
          <Button variant="contained" onClick={onClose} fullWidth>
            {isCompleted ? 'Done' : hasError ? 'Close' : 'Cancel'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
