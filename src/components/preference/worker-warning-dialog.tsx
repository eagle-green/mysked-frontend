import type { IWorkerWarningDialog } from 'src/types/preference';

import React from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface WorkerWarningDialogProps {
  warning: IWorkerWarningDialog;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function WorkerWarningDialog({
  warning,
  onClose,
  onConfirm,
  onCancel,
}: WorkerWarningDialogProps) {
  const getSeverity = () => {
    switch (warning.warningType) {
      case 'mandatory_not_preferred':
        return 'error';
      case 'schedule_conflict':
        return 'error';
      case 'not_preferred':
        return 'warning';
      case 'worker_conflict':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getTitle = () => {
    switch (warning.warningType) {
      case 'mandatory_not_preferred':
        return 'Mandatory Restriction';
      case 'schedule_conflict':
        return 'Schedule Conflict - Double Booking';
      case 'not_preferred':
        return 'Not Preferred Employee';
      case 'worker_conflict':
        return 'Worker Preference Conflict';
      default:
        return 'Employee Warning';
    }
  };

  const getIcon = () => {
    switch (warning.warningType) {
      case 'mandatory_not_preferred':
        return 'solar:close-circle-bold';
      case 'schedule_conflict':
        return 'solar:calendar-date-bold';
      case 'not_preferred':
        return 'solar:danger-triangle-bold';
      case 'worker_conflict':
        return 'solar:users-group-rounded-bold';
      default:
        return 'solar:info-circle-bold';
    }
  };

  const getDescription = () => {
    switch (warning.warningType) {
      case 'mandatory_not_preferred': {
        // Determine which entities have preferences by looking at the reasons
        const hasCompany = warning.reasons.some(reason => reason.includes('Company') || reason.includes('Eaglegreen') || reason.includes('Eagle Green'));
        const hasSite = warning.reasons.some(reason => reason.includes('Site'));
        const hasClient = warning.reasons.some(reason => reason.includes('Client'));
        
        let entityText = '';
        if (hasCompany && hasSite && hasClient) {
          entityText = 'company/site/client';
        } else if (hasCompany && hasSite) {
          entityText = 'company/site';
        } else if (hasCompany && hasClient) {
          entityText = 'company/client';
        } else if (hasSite && hasClient) {
          entityText = 'site/client';
        } else if (hasCompany) {
          entityText = 'company';
        } else if (hasSite) {
          entityText = 'site';
        } else if (hasClient) {
          entityText = 'client';
        } else {
          entityText = 'job';
        }
        
        return `${warning.employee.name} has been marked as "Not Preferred" with mandatory restrictions for this ${entityText}. This employee cannot be assigned to this job under any circumstances.`;
      }
      case 'schedule_conflict':
        return `${warning.employee.name} cannot be assigned to this job due to a scheduling conflict:`;
      case 'not_preferred': {
        // Determine which entities have preferences by looking at the reasons
        const hasCompany = warning.reasons.some(reason => reason.includes('Company') || reason.includes('Eaglegreen') || reason.includes('Eagle Green'));
        const hasSite = warning.reasons.some(reason => reason.includes('Site'));
        const hasClient = warning.reasons.some(reason => reason.includes('Client'));
        
        let entityText = '';
        if (hasCompany && hasSite && hasClient) {
          entityText = 'company/site/client';
        } else if (hasCompany && hasSite) {
          entityText = 'company/site';
        } else if (hasCompany && hasClient) {
          entityText = 'company/client';
        } else if (hasSite && hasClient) {
          entityText = 'site/client';
        } else if (hasCompany) {
          entityText = 'company';
        } else if (hasSite) {
          entityText = 'site';
        } else if (hasClient) {
          entityText = 'client';
        } else {
          entityText = 'job';
        }
        
        return `${warning.employee.name} has been marked as "Not Preferred" for this ${entityText}. You can still proceed, but please be aware of the following concerns:`;
      }
      case 'worker_conflict':
        return `There are preference conflicts between ${warning.employee.name} and other workers assigned to this job:`;
      default:
        return 'There are concerns about assigning this employee to this job.';
    }
  };

  return (
    <Dialog
      open={warning.open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Iconify 
            icon={getIcon()} 
            sx={{ 
              color: getSeverity() === 'error' ? 'error.main' : 
                     getSeverity() === 'warning' ? 'warning.main' : 'info.main',
              width: 24,
              height: 24,
            }} 
          />
          {getTitle()}
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity={getSeverity()} sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            {getDescription()}
          </Typography>
        </Alert>

        {/* Employee Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, backgroundColor: 'background.neutral', borderRadius: 1 }}>
          <Avatar
            src={warning.employee.photo_url}
            sx={{ width: 48, height: 48 }}
          >
            {warning.employee.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {warning.employee.name}
            </Typography>
          </Box>
        </Box>

        {/* Reasons */}
        {warning.reasons.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              {warning.reasons.length === 1 ? 'Reason:' : 'Reasons:'}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {warning.reasons.map((reason, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: 'text.secondary',
                      mt: 1,
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {reason}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Action guidance */}
        <Box>
          {warning.canProceed ? (
            <Typography variant="body2" color="text.secondary">
              {warning.warningType === 'schedule_conflict' 
                ? 'You can proceed with this double-booking, but please ensure the worker can handle both assignments.'
                : 'You can choose to proceed with this assignment, but please consider the concerns listed above.'
              }
            </Typography>
          ) : (
                          <Typography variant="body2" color="error.main" sx={{ fontWeight: 500 }}>
               {warning.warningType === 'schedule_conflict'
                 ? 'This worker will be removed from the assignment as double-booking is not allowed.'
                 : 'This assignment cannot proceed due to mandatory restrictions.'
               }
              </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        {warning.canProceed ? (
          <>
            <Button onClick={onCancel} color="inherit">
              Cancel
            </Button>
            <Button 
              onClick={onConfirm} 
              variant="contained" 
              color={getSeverity() === 'error' ? 'error' : 'warning'}
            >
              Proceed Anyway
            </Button>
          </>
        ) : (
                    <Button 
            onClick={onConfirm} 
            variant="contained" 
            color="primary"
          >
            {warning.warningType === 'schedule_conflict' ? 'OK' : 'Understood'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default WorkerWarningDialog; 