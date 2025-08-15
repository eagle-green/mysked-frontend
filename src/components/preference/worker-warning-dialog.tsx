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

// Function to determine avatar color based on name (same as used in avatar component)
const colorByName = (
  name?: string
): 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'default' => {
  const charAt = name?.charAt(0).toLowerCase();

  if (['a', 'c', 'f'].includes(charAt!)) return 'primary';
  if (['e', 'd', 'h'].includes(charAt!)) return 'secondary';
  if (['i', 'k', 'l'].includes(charAt!)) return 'info';
  if (['m', 'n', 'p'].includes(charAt!)) return 'success';
  if (['q', 's', 't'].includes(charAt!)) return 'warning';
  if (['v', 'x', 'y'].includes(charAt!)) return 'error';

  return 'default';
};

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
      case 'certification_issues':
        return 'warning';
      case 'multiple_issues':
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
      case 'time_off_conflict': {
        // Check if there are other types of conflicts besides time-off
        const hasOtherConflicts = warning.reasons.some(
          (reason) =>
            !reason.includes('pending:') &&
            !reason.includes('approved:') &&
            !reason.includes('rejected:') &&
            !reason.includes('time-off') &&
            !reason.includes('Time-Off') &&
            !reason.includes('Day Off') &&
            !reason.includes('Vacation') &&
            !reason.includes('Sick Leave')
        );

        if (hasOtherConflicts) {
          // Mixed conflicts - time-off plus other issues
          // Time-off conflicts are mandatory, certification/license issues are warnings
          const hasMandatoryConflicts = warning.reasons.some(
            (reason) => reason.includes('(Mandatory)') // Only truly mandatory preferences
          );

          if (hasMandatoryConflicts) {
            return 'Multiple Conflicts Detected';
          } else {
            return 'Time-Off Conflict & Warnings';
          }
        } else {
          return warning.employee.name.includes('Workers')
            ? 'Multiple Worker Conflicts'
            : 'Time-Off Conflict';
        }
      }
      case 'certification_issues':
        return 'Certification Warnings';
      case 'multiple_issues':
        return 'Multiple Issues Detected';
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
      case 'certification_issues':
        return 'solar:shield-cross-bold';
      case 'multiple_issues':
        return 'solar:warning-triangle-bold';
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
        return `This employee cannot be assigned to this job under any circumstances.`;
      }
      case 'schedule_conflict':
        return warning.employee.name.includes('Workers')
          ? `Multiple workers cannot be assigned to this job due to scheduling conflicts:`
          : `${warning.employee.name} cannot be assigned to this job due to a scheduling conflict:`;
      case 'time_off_conflict': {
        // Check if there are other types of conflicts besides time-off
        const hasOtherConflicts = warning.reasons.some(
          (reason) =>
            !reason.includes('pending:') &&
            !reason.includes('approved:') &&
            !reason.includes('rejected:') &&
            !reason.includes('time-off') &&
            !reason.includes('Time-Off')
        );

        if (hasOtherConflicts) {
          // Mixed conflicts - time-off plus other issues
          // Time-off conflicts are mandatory, certification/license issues are warnings
          const hasMandatoryConflicts = warning.reasons.some(
            (reason) => reason.includes('(Mandatory)') // Only truly mandatory preferences
          );

          if (hasMandatoryConflicts) {
            return `${warning.employee.name} has multiple conflicts including mandatory restrictions and time-off requests. This assignment cannot proceed due to mandatory restrictions.`;
          } else {
            return `This employee cannot be assigned to this job under any circumstances.`;
          }
        } else {
          // Only time-off conflicts
          return warning.employee.name.includes('Workers')
            ? `Multiple workers cannot be assigned to this job due to time-off conflicts:`
            : `${warning.employee.name} cannot be assigned to this job due to time-off requests (mandatory):`;
        }
      }
      case 'not_preferred': {
        // Determine which entities have preferences by looking at the reasons
        const hasCompany = warning.reasons.some(
          (reason) =>
            reason.includes('Company') ||
            reason.includes('Eaglegreen') ||
            reason.includes('Eagle Green')
        );
        const hasSite = warning.reasons.some((reason) => reason.includes('Site'));
        const hasClient = warning.reasons.some((reason) => reason.includes('Client'));

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
      case 'certification_issues':
        return `${warning.employee.name} has few warnings. You can still proceed, but please review the issues below:`;
      case 'multiple_issues':
        return `${warning.employee.name} has multiple issues that need to be addressed:`;
      case 'worker_conflict':
        return `There are preference conflicts between ${warning.employee.name} and other workers assigned to this job:`;
      default:
        return 'There are concerns about assigning this employee to this job.';
    }
  };

  const renderStatusLabel = (typeAndReason: string, status: string, dateInfo: string) => {
    // Determine label color based on status (same pattern as job-table-row.tsx)
    const getLabelColor = (statusValue: string) => {
      switch (statusValue.toLowerCase()) {
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

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary">
          {typeAndReason}
        </Typography>
        <Label variant="soft" color={labelColor}>
          {status}
        </Label>
        <Typography variant="body2" color="text.secondary">
          {dateInfo}
        </Typography>
      </Box>
    );
  };

  const renderMandatoryReason = (reason: string) => {
    // Simple check: if it contains "(Mandatory)", style it
    if (reason.includes('(Mandatory)')) {
      // Split at "(Mandatory):" to separate entity name and reason
      const parts = reason.split('(Mandatory):');
      const entityName = parts[0].trim();
      const reasonText = parts[1] ? parts[1].trim() : '';

      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            {entityName}
          </Typography>
          <Label variant="soft" color="error">
            Mandatory
          </Label>
          <Typography variant="body2" color="text.secondary">
            {reasonText}
          </Typography>
        </Box>
      );
    }

    // If no "(Mandatory)" found, return plain text
    return (
      <Typography variant="body2" color="text.secondary">
        {reason}
      </Typography>
    );
  };

  const renderTimeOffReason = (reason: string) => {
    // Look for status pattern: "Day Off pending at date" (without colon)
    // Make the regex more flexible to handle variations in spacing
    const statusMatch = reason.match(/^(.*?)\s+(approved|pending|rejected)\s+(at|from)\s+(.*)$/i);

    if (statusMatch) {
      const [, typeInfo, status, datePreposition, dateInfo] = statusMatch;
      try {
        return (
          <Box
            sx={{
              backgroundColor: 'error.lighter',
              paddingLeft: 1,
              paddingRight: 1,
              paddingTop: 1,
              paddingBottom: 1,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'error.main',
            }}
          >
            {renderStatusLabel(typeInfo, status, `${datePreposition} ${dateInfo}`)}
          </Box>
        );
      } catch (error) {
        console.error('Error in renderStatusLabel:', error);
        return (
          <Typography variant="body2" color="text.secondary">
            {reason}
          </Typography>
        );
      }
    }

    // If the first pattern doesn't match, try a more flexible approach
    // Look for "Day Off" followed by status and date info
    const flexibleMatch = reason.match(/^(Day Off)\s+(approved|pending|rejected)\s+(.*)$/i);
    if (flexibleMatch) {
      const [, typeInfo, status, dateInfo] = flexibleMatch;
      try {
        return (
          <Box
            sx={{
              backgroundColor: 'error.lighter',
              paddingLeft: 1,
              paddingRight: 1,
              paddingTop: 1,
              paddingBottom: 1,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'error.main',
            }}
          >
            {renderStatusLabel(typeInfo, status, dateInfo)}
          </Box>
        );
      } catch (error) {
        console.error('Error in renderStatusLabel:', error);
        return (
          <Typography variant="body2" color="text.secondary">
            {reason}
          </Typography>
        );
      }
    }

    // Fallback to plain text if no status found
    return (
      <Typography variant="body2" color="text.secondary">
        {reason}
      </Typography>
    );
  };

  return (
    <Dialog open={warning.open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Iconify
            icon={getIcon() as any}
            sx={{
              color:
                getSeverity() === 'error'
                  ? 'error.main'
                  : getSeverity() === 'warning'
                    ? 'warning.main'
                    : 'info.main',
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
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 3,
            p: 2,
            backgroundColor: 'background.neutral',
            borderRadius: 1,
          }}
        >
          {warning.employee.name.includes('Workers') ? (
            <Avatar sx={{ width: 48, height: 48, bgcolor: 'warning.main' }}>
              <Iconify icon="solar:users-group-rounded-bold" sx={{ width: 24, height: 24 }} />
            </Avatar>
          ) : (
            <Avatar
              src={warning.employee.photo_url}
              sx={{
                width: 48,
                height: 48,
                bgcolor: (theme) => {
                  const paletteColor = (theme.palette as any)[colorByName(warning.employee.name)];
                  return paletteColor?.main || theme.palette.grey[500];
                },
                color: (theme) => {
                  const paletteColor = (theme.palette as any)[colorByName(warning.employee.name)];
                  return paletteColor?.contrastText || theme.palette.grey[100];
                },
              }}
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
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5,
                        flex: 1,
                        ml: reason.includes('worker(s) have conflicts') ? 0 : 2,
                      }}
                    >
                      {reason
                        .split('\n')
                        .filter(Boolean)
                        .map((line, lineIndex) => {
                          if (line.endsWith(':')) {
                            // Worker name
                            return (
                              <Typography
                                key={lineIndex}
                                variant="subtitle2"
                                sx={{ fontWeight: 600, mt: 1 }}
                              >
                                {line}
                              </Typography>
                            );
                          } else if (line.startsWith('• ')) {
                            // Conflict detail
                            return warning.warningType === 'time_off_conflict' ? (
                              <Box
                                key={lineIndex}
                                sx={{ display: 'flex', alignItems: 'flex-start' }}
                              >
                                <Box
                                  sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    backgroundColor: 'text.secondary',
                                    mt: 1.5, // Center align with the text
                                    flexShrink: 0,
                                    ml: 1, // Match the ml: 1 from other bullet points
                                  }}
                                />
                                <Box sx={{ flex: 1, mt: 0.5 }}>
                                  {renderTimeOffReason(line.substring(2))}
                                </Box>
                              </Box>
                            ) : (
                              (() => {
                                const conflictText = line.substring(2);
                                const isMandatoryConflict =
                                  conflictText.includes('Worker is already scheduled') ||
                                  conflictText.includes('Worker has a scheduling conflict') ||
                                  conflictText.includes(
                                    'Worker has a time-off request during this period'
                                  );

                                return (
                                  <Typography
                                    key={lineIndex}
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                      ml: 1,
                                      backgroundColor: isMandatoryConflict
                                        ? 'error.lighter'
                                        : 'transparent',
                                      padding: isMandatoryConflict ? 1 : 0,
                                      borderRadius: isMandatoryConflict ? 1 : 0,
                                      border: isMandatoryConflict ? '1px solid' : 'none',
                                      borderColor: isMandatoryConflict
                                        ? 'error.main'
                                        : 'transparent',
                                    }}
                                  >
                                    {conflictText}
                                  </Typography>
                                );
                              })()
                            );
                          }
                          return null;
                        })}
                    </Box>
                  ) : warning.warningType === 'time_off_conflict' ||
                    reason.includes('pending') ||
                    reason.includes('approved') ||
                    reason.includes('rejected') ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
                      {renderTimeOffReason(reason)}
                    </Box>
                  ) : (
                    // Check if this reason is mandatory and add background color
                    (() => {
                      const isMandatoryReason =
                        reason.includes('(Mandatory)') ||
                        reason.includes('Already scheduled for Job #') ||
                        reason.includes('Worker has a scheduling conflict');

                      // Schedule conflicts should have error background (mandatory), not warning
                      const isScheduleConflict =
                        reason.includes('Already scheduled for Job #') ||
                        reason.includes('Worker has a scheduling conflict');

                      // Multi-line handling removed - back to single line

                      return (
                        <>
                          {isMandatoryReason ? (
                            <Box
                              sx={{
                                backgroundColor: 'error.lighter',
                                paddingLeft: 1,
                                paddingRight: 1,
                                paddingTop: 1,
                                paddingBottom: 1,
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'error.main',
                              }}
                            >
                              {renderMandatoryReason(reason)}
                            </Box>
                          ) : (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                backgroundColor: isScheduleConflict
                                  ? 'error.lighter'
                                  : 'transparent',
                                paddingLeft: isScheduleConflict ? 1 : 0,
                                paddingRight: isScheduleConflict ? 1 : 0,
                                borderRadius: isScheduleConflict ? 1 : 0,
                                border: isScheduleConflict ? '1px solid' : 'none',
                                borderColor: isScheduleConflict ? 'error.main' : 'transparent',
                              }}
                            >
                              {reason}
                            </Typography>
                          )}
                        </>
                      );
                    })()
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
                  : warning.warningType === 'certification_issues'
                    ? 'You can proceed with this assignment, but please be aware of the warnings listed above.'
                    : 'You can choose to proceed with this assignment, but please consider the concerns listed above.'}
            </Typography>
          ) : (
            <Typography variant="body2" color="error.main" sx={{ fontWeight: 500 }}>
              {warning.warningType === 'schedule_conflict'
                ? warning.employee.name.includes('Workers')
                  ? 'These workers will be removed from the assignment as double-booking is not allowed.'
                  : 'This worker will be removed from the assignment as double-booking is not allowed.'
                : warning.warningType === 'time_off_conflict'
                  ? (() => {
                      // Check if there are other types of conflicts besides time-off
                      const hasOtherConflicts = warning.reasons.some(
                        (reason) =>
                          !reason.includes('pending') &&
                          !reason.includes('approved') &&
                          !reason.includes('rejected') &&
                          !reason.includes('time-off') &&
                          !reason.includes('Time-Off')
                      );

                      if (hasOtherConflicts) {
                        // Mixed conflicts - check if any are mandatory
                        // Time-off conflicts are mandatory, certification/license issues are warnings
                        const hasMandatoryConflicts = warning.reasons.some(
                          (reason) => reason.includes('(Mandatory)') // Only truly mandatory preferences
                        );

                        if (hasMandatoryConflicts) {
                          return 'This assignment cannot proceed due to mandatory restrictions (mandatory preferences only).';
                        } else {
                          return 'This assignment cannot proceed due to time-off conflicts.';
                        }
                      } else {
                        // Only time-off conflicts
                        const statusMatch = warning.reasons[0]?.match(
                          /^(.*?)\s+(approved|pending|rejected):\s*(.*)$/i
                        );
                        const status = statusMatch ? statusMatch[2].toLowerCase() : 'time-off';
                        const statusText =
                          status === 'approved'
                            ? 'an approved'
                            : status === 'pending'
                              ? 'a pending'
                              : status === 'rejected'
                                ? 'a rejected'
                                : 'a';

                        if (warning.employee.name.includes('Workers')) {
                          return `These workers cannot be assigned due to time-off conflicts.`;
                        } else {
                          const hasText = 'has';
                          return `This worker cannot be assigned as they ${hasText} ${statusText} time-off request during this period.`;
                        }
                      }
                    })()
                  : 'This assignment cannot proceed due to mandatory restrictions.'}
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
          <Button onClick={onConfirm} variant="contained" color="primary">
            {warning.warningType === 'schedule_conflict'
              ? 'OK'
              : warning.warningType === 'time_off_conflict'
                ? 'OK'
                : 'Understood'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default WorkerWarningDialog;
