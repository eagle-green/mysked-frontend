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

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { TIME_OFF_STATUSES } from 'src/types/timeOff';

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
      case 'time_off_conflict':
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
        return warning.employee.name.includes('Workers') 
          ? 'Multiple Worker Conflicts'
          : 'Schedule Conflict - Double Booking';
      case 'time_off_conflict':
        return warning.employee.name.includes('Workers') 
          ? 'Multiple Worker Conflicts'
          : 'Time-Off Conflict';
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
      case 'time_off_conflict':
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
        return warning.employee.name.includes('Workers') 
          ? `Multiple workers cannot be assigned to this job due to scheduling conflicts:`
          : `${warning.employee.name} cannot be assigned to this job due to a scheduling conflict:`;
      case 'time_off_conflict':
        return warning.employee.name.includes('Workers')
          ? `Multiple workers cannot be assigned to this job due to conflicts:`
          : `${warning.employee.name} cannot be assigned to this job due to a time-off request:`;
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

  const renderTimeOffReason = (reason: string) => {
    // Simple approach: just replace [status] with a Label component
    const statusMatch = reason.match(/\[(approved|pending|rejected)\]/i);
    
    if (statusMatch) {
      const status = statusMatch[1].toLowerCase();
      const statusInfo = TIME_OFF_STATUSES.find((s) => s.value === status);
      const statusLabel = statusInfo?.label || status;
      
      // Determine label color based on status
      const getLabelColor = (statusValue: string) => {
        switch (statusValue) {
          case 'approved':
            return 'success';
          case 'pending':
            return 'warning';
          case 'rejected':
            return 'error';
          default:
            return 'default';
        }
      };
      
      const labelColor = getLabelColor(status);
      
      // Replace the [status] part with a Label component
      const parts = reason.split(/\[(approved|pending|rejected)\]/i);
      
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              {parts[0]}
            </Typography>
            <Label
              variant="soft"
              color={labelColor}
            >
              {statusLabel}
            </Label>
            <Typography variant="body2" color="text.secondary">
              {parts[2]}
            </Typography>
          </Box>
        </Box>
      );
    }
    
    // Fallback to plain text if no status found
    return (
      <Typography variant="body2" color="text.secondary">
        {reason}
      </Typography>
    );
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
          {warning.employee.name.includes('Workers') ? (
            <Avatar sx={{ width: 48, height: 48, bgcolor: 'warning.main' }}>
              <Iconify icon="solar:users-group-rounded-bold" sx={{ width: 24, height: 24 }} />
            </Avatar>
          ) : (
            <Avatar
              src={warning.employee.photo_url}
              sx={{ width: 48, height: 48 }}
            >
              {warning.employee.name.charAt(0).toUpperCase()}
            </Avatar>
          )}
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
                  {/* Only show bullet point for non-header reasons */}
                  {!reason.includes('worker(s) have conflicts') && !reason.startsWith('\n') && (
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
                  )}
                  
                  {/* Handle different reason types */}
                  {reason.includes('worker(s) have conflicts') ? (
                    // Summary message
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      {reason}
                    </Typography>
                  ) : reason.startsWith('\n') ? (
                    // Worker-specific conflict group
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1, ml: reason.includes('worker(s) have conflicts') ? 0 : 2 }}>
                      {reason.split('\n').filter(Boolean).map((line, lineIndex) => {
                        if (line.endsWith(':')) {
                          // Worker name
                          return (
                            <Typography key={lineIndex} variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>
                              {line}
                            </Typography>
                          );
                        } else if (line.startsWith('• ')) {
                          // Conflict detail
                          return warning.warningType === 'time_off_conflict' && line.includes('[') ? (
                            <Box key={lineIndex} sx={{ ml: 1 }}>
                              {renderTimeOffReason(line.substring(2))}
                            </Box>
                          ) : (
                            <Typography key={lineIndex} variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                              {line.substring(2)}
                            </Typography>
                          );
                        }
                        return null;
                      })}
                    </Box>
                  ) : warning.warningType === 'time_off_conflict' ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
                      {renderTimeOffReason(reason)}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {reason}
                    </Typography>
                  )}
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
                : warning.warningType === 'time_off_conflict'
                  ? 'You can proceed with this assignment, but please ensure the worker is available during this time period.'
                  : 'You can choose to proceed with this assignment, but please consider the concerns listed above.'
              }
            </Typography>
          ) : (
            <Typography variant="body2" color="error.main" sx={{ fontWeight: 500 }}>
              {warning.warningType === 'schedule_conflict'
                ? warning.employee.name.includes('Workers')
                  ? 'These workers will be removed from the assignment as double-booking is not allowed.'
                  : 'This worker will be removed from the assignment as double-booking is not allowed.'
                : warning.warningType === 'time_off_conflict'
                  ? (() => {
                      // Extract status from the reason to show correct message
                      const statusMatch = warning.reasons[0]?.match(/\[(approved|pending|rejected)\]/i);
                      const status = statusMatch ? statusMatch[1].toLowerCase() : 'time-off';
                      const statusText = status === 'approved' ? 'an approved' : 
                                       status === 'pending' ? 'a pending' : 
                                       status === 'rejected' ? 'a rejected' : 'a';
                      
                      if (warning.employee.name.includes('Workers')) {
                        // Multiple workers - could be mixed conflicts
                        return `These workers cannot be assigned due to the conflicts listed above.`;
                      } else {
                        // Single worker
                        const hasText = 'has';
                        return `This worker cannot be assigned as they ${hasText} ${statusText} time-off request during this period.`;
                      }
                    })()
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
            {warning.warningType === 'schedule_conflict' 
              ? 'OK' 
              : warning.warningType === 'time_off_conflict'
                ? 'OK'
                : 'Understood'
            }
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default WorkerWarningDialog; 