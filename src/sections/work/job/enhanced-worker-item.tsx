import dayjs from 'dayjs';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';
import FormControlLabel from '@mui/material/FormControlLabel';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import { fetcher, endpoints } from 'src/lib/axios';
import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { EnhancedWorkerSelector, type WorkerConflictData, useWorkerConflictChecker } from 'src/components/worker';

// ----------------------------------------------------------------------

interface EnhancedWorkerItemProps {
  onRemoveWorkerItem: () => void;
  workerFieldNames: Record<string, string>;
  employeeOptions: any[];
  position: string;
  canRemove: boolean;
  removeVehicle: (index: number) => void;
  appendVehicle?: (vehicle: any) => void;
  viewAllWorkers?: boolean;
  hideEmployeeSelector?: boolean; // For open positions in open jobs
}

export function EnhancedWorkerItem({
  onRemoveWorkerItem,
  workerFieldNames,
  employeeOptions,
  position,
  canRemove,
  removeVehicle,
  appendVehicle,
  viewAllWorkers = false,
  hideEmployeeSelector = false,
}: EnhancedWorkerItemProps) {
  const theme = useTheme();
  const isXsSmMd = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();
  const { getValues, setValue, watch, trigger, control } = useFormContext();
  
  // Get appendVehicle from prop, or create one if not provided (fallback)
  const { append: appendVehicleFallback } = useFieldArray({
    control,
    name: 'vehicles',
  });
  
  const appendVehicleFn = appendVehicle || appendVehicleFallback;

  // Dialog state for removing worker with notifications
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showResendDialog, setShowResendDialog] = useState(false);
  const [removalAction, setRemovalAction] = useState<'remove' | 'no_show' | 'called_in_sick' | 'reject'>('remove');
  const [incidentReason, setIncidentReason] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionReasonError, setRejectionReasonError] = useState(false);
  const [notifiedAt, setNotifiedAt] = useState<dayjs.Dayjs | null>(null);
  const [notifiedAtError, setNotifiedAtError] = useState(false);

  // Get current values
  const watchedWorkers = watch('workers');
  const workers = useMemo(() => watchedWorkers || [], [watchedWorkers]);
  const currentPosition = watch(workerFieldNames.position);
  const currentEmployeeId = watch(workerFieldNames.id);
  const thisWorkerIndex = Number(workerFieldNames.id.match(/workers\[(\d+)\]\.id/)?.[1] ?? -1);
  const jobStartDateTime = watch('start_date_time');
  const jobEndDateTime = watch('end_date_time');
  const currentJobId = watch('id');
  const currentCompany = getValues('company');
  const currentSite = getValues('site');
  const currentClient = getValues('client');
  const currentWorker = workers[thisWorkerIndex];

  // Get current worker status
  const currentWorkerStatus = workers[thisWorkerIndex]?.status || 'draft';

  // Check if we're in create mode (including duplicates)
  // In create mode (including duplicates), all workers will be in draft status
  // If any worker has a non-draft status, we're editing an existing job
  const isCreateMode = workers.every((w: any) => !w.status || w.status === 'draft');

  // Get worker's individual start/end times (for duplicate mode conflict checking)
  const workerStartTime = watch(workerFieldNames.start_time);
  const workerEndTime = watch(workerFieldNames.end_time);
  
  // For conflict checking in duplicate mode, normalize worker times with job date
  const conflictCheckStartTime = useMemo(() => {
    if (!isCreateMode || !jobStartDateTime) return jobStartDateTime;
    
    // Get worker's time (from currentWorker or form field)
    const workerTime = currentWorker?.start_time || workerStartTime;
    if (!workerTime) return jobStartDateTime;
    
    // Normalize: combine job date with worker's time
    // Handle both Date objects and ISO strings, ensure timezone consistency
    const workerStart = dayjs(workerTime);
    const jobStartDate = dayjs(jobStartDateTime);
    
    // Use the job's date but preserve the worker's time (hour/minute)
    const normalizedStart = jobStartDate
      .hour(workerStart.hour())
      .minute(workerStart.minute())
      .second(0)
      .millisecond(0);
    
    return normalizedStart.toISOString();
  }, [isCreateMode, jobStartDateTime, currentWorker?.start_time, workerStartTime]);
  
  const conflictCheckEndTime = useMemo(() => {
    if (!isCreateMode || !jobEndDateTime) return jobEndDateTime;
    
    // Get worker's time (from currentWorker or form field)
    const workerTime = currentWorker?.end_time || workerEndTime;
    if (!workerTime) return jobEndDateTime;
    
    // Normalize: combine job date with worker's time
    const workerEnd = dayjs(workerTime);
    const jobStartDate = dayjs(jobStartDateTime);
    
    // Use the job's date but preserve the worker's time (hour/minute)
    let normalizedEnd = jobStartDate
      .hour(workerEnd.hour())
      .minute(workerEnd.minute())
      .second(0)
      .millisecond(0);
    
    // If end is before start, roll to next day
    const normalizedStart = dayjs(conflictCheckStartTime || jobStartDateTime);
    if (!normalizedEnd.isAfter(normalizedStart)) {
      normalizedEnd = normalizedEnd.add(1, 'day');
    }
    
    return normalizedEnd.toISOString();
  }, [isCreateMode, jobEndDateTime, jobStartDateTime, currentWorker?.end_time, workerEndTime, conflictCheckStartTime]);

  // Use conflict checker to detect conflicts for duplicate mode
  // For duplicate mode, we need to check using the worker's individual times
  const { enhanceEmployeeWithConflicts } = useWorkerConflictChecker({
    jobStartDateTime: conflictCheckStartTime,
    jobEndDateTime: conflictCheckEndTime,
    currentJobId,
    currentCompany,
    currentSite,
    currentClient,
    workers,
    employeeOptions,
  });

  // Get conflict information for the currently selected worker (for duplicate mode)
  const workerConflictData = useMemo((): WorkerConflictData | null => {
    // Only check conflicts if we're in create mode AND have a valid employee selected
    if (!isCreateMode || !currentEmployeeId || currentEmployeeId === '' || !currentWorker) {
      return null;
    }
    
    // Wait for normalized times to be ready before checking conflicts
    if (!conflictCheckStartTime || !conflictCheckEndTime) {
      return null;
    }
    
    // Find the employee in options and enhance with conflicts
    const employeeOption = employeeOptions.find((emp: any) => emp.value === currentEmployeeId);
    if (!employeeOption) {
      // For duplicate mode, create a synthetic employee option from worker data
      const syntheticEmployee = {
        value: currentWorker.id,
        label: `${currentWorker.first_name || ''} ${currentWorker.last_name || ''}`.trim() || 'Unknown Employee',
        photo_url: currentWorker.photo_url || '',
        first_name: currentWorker.first_name || '',
        last_name: currentWorker.last_name || '',
        role: currentWorker.role || '',
        email: currentWorker.email || '',
        phone_number: currentWorker.phone_number || '',
      };
      return enhanceEmployeeWithConflicts(syntheticEmployee, currentPosition, 
        workers.map((w: any, idx: number) => idx !== thisWorkerIndex && w.id ? w.id : null).filter(Boolean)
      );
    }
    
    return enhanceEmployeeWithConflicts(employeeOption, currentPosition,
      workers.map((w: any, idx: number) => idx !== thisWorkerIndex && w.id ? w.id : null).filter(Boolean)
    );
  }, [currentEmployeeId, currentWorker, employeeOptions, enhanceEmployeeWithConflicts, currentPosition, workers, thisWorkerIndex, isCreateMode, conflictCheckStartTime, conflictCheckEndTime]);

  // Check if worker has blocking conflicts (for duplicate mode)
  const hasBlockingConflict = useMemo(() => {
    if (!workerConflictData || !isCreateMode) return false;
    return workerConflictData.hasBlockingScheduleConflict || 
           workerConflictData.hasTimeOffConflict || 
           workerConflictData.hasUnavailabilityConflict;
  }, [workerConflictData, isCreateMode]);

  // Get conflict message for tooltip
  const conflictMessage = useMemo(() => {
    if (!hasBlockingConflict || !workerConflictData) return '';
    
    const messages: string[] = [];
    if (workerConflictData.hasBlockingScheduleConflict) {
      messages.push('Schedule conflict: Worker is already scheduled for another job during this time');
    }
    if (workerConflictData.hasTimeOffConflict) {
      messages.push('Time off conflict: Worker has requested time off during this period');
    }
    if (workerConflictData.hasUnavailabilityConflict) {
      messages.push('Unavailability conflict: Worker is marked as unavailable during this time');
    }
    
    return messages.join('. ');
  }, [hasBlockingConflict, workerConflictData]);

  // Status mapping for display
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      case 'no_show':
        return 'No Show';
      case 'called_in_sick':
        return 'Called in Sick';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'info';
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'cancelled':
        return 'error';
      case 'no_show':
        return 'error';
      case 'called_in_sick':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Check if worker has notifications sent (not draft status)
  const hasNotificationsSent = currentWorkerStatus !== 'draft';

  const removeWorkerAndAssociations = useCallback(async () => {
    // Remove any vehicles assigned to this worker
    const currentVehicles = getValues('vehicles') || [];
    const vehiclesToRemove: number[] = [];
    currentVehicles.forEach((vehicle: any, vIdx: number) => {
      if (vehicle.operator && vehicle.operator.id === currentEmployeeId) {
        vehiclesToRemove.push(vIdx);
      }
    });

    if (vehiclesToRemove.length > 0) {
      vehiclesToRemove.reverse().forEach((vIdx: number) => {
        removeVehicle(vIdx);
      });
    }

    // Clear timesheet manager if the removed worker is currently assigned
    const timesheetManagerId = getValues('timesheet_manager_id');
    if (timesheetManagerId && currentEmployeeId && timesheetManagerId === currentEmployeeId) {
      setValue('timesheet_manager_id', '');
      await trigger('timesheet_manager_id');
    }

    // Remove the worker entry
    onRemoveWorkerItem();
    await trigger('workers');
  }, [currentEmployeeId, getValues, onRemoveWorkerItem, removeVehicle, setValue, trigger]);

  const handleRemoveClick = async () => {
    if (hasNotificationsSent) {
      setShowRemoveDialog(true);
      return;
    }

    await removeWorkerAndAssociations();
  };

  // Handle dialog confirm
  const handleRemoveConfirm = async () => {
    // Validate required fields for "Called in Sick"
    if (removalAction === 'called_in_sick' && !notifiedAt) {
      setNotifiedAtError(true);
      return;
    }

    // Validate required fields for "Reject"
    if (removalAction === 'reject' && !rejectionReason.trim()) {
      setRejectionReasonError(true);
      return;
    }
    
    setNotifiedAtError(false);
    setRejectionReasonError(false);
    setShowRemoveDialog(false);
    
    // If worker is pending and admin chose to reject
    if (currentWorkerStatus === 'pending' && currentJobId && currentEmployeeId) {
      if (removalAction === 'reject') {
        try {
          // Update worker response to rejected with reason
          await fetcher([
            `${endpoints.work.job}/${currentJobId}/worker/${currentEmployeeId}/response`,
            {
              method: 'PUT',
              data: {
                status: 'rejected',
                rejection_reason: rejectionReason.trim(),
                sendEmail: false,
                sendSMS: false,
              },
            },
          ]);
          
          // Update the worker status in the form
          setValue(`${workerFieldNames.id.replace('.id', '')}.status`, 'rejected');
          await trigger('workers');
          
          // Invalidate queries to refresh job data
          queryClient.invalidateQueries({ queryKey: ['jobs'] });
          queryClient.invalidateQueries({ queryKey: ['calendar-jobs'] });
          queryClient.invalidateQueries({ queryKey: ['worker-calendar-jobs'] });
          
          // Reset form fields
          setRejectionReason('');
          
          toast.success('Worker rejected successfully');
          return;
        } catch (error) {
          console.error('Failed to reject worker:', error);
          toast.error('Failed to reject worker. Please try again.');
          return;
        }
      }
    }
    
    // If worker is accepted and admin chose to mark as no_show or called_in_sick
    if (currentWorkerStatus === 'accepted' && currentJobId && currentEmployeeId) {
      if (removalAction === 'no_show' || removalAction === 'called_in_sick') {
        try {
          // Create worker incident via backend (this will log to job history and update status)
          await fetcher([
            `${endpoints.work.job}/worker/${currentEmployeeId}/incidents`,
            {
              method: 'POST',
              data: {
                job_id: currentJobId,
                worker_id: currentEmployeeId,
                incident_type: removalAction,
                reason: incidentReason || null,
                notified_at: notifiedAt ? notifiedAt.toISOString() : null,
                position: currentPosition || null,
                start_time: workerStartTime ? dayjs(workerStartTime).toISOString() : null,
                end_time: workerEndTime ? dayjs(workerEndTime).toISOString() : null,
              },
            },
          ]);
          
          // Update the worker status in the form (keep them in the job with updated status)
          setValue(`${workerFieldNames.id.replace('.id', '')}.status`, removalAction);
          await trigger('workers');
          
          // Invalidate queries to refresh job data
          queryClient.invalidateQueries({ queryKey: ['jobs'] });
          queryClient.invalidateQueries({ queryKey: ['calendar-jobs'] });
          queryClient.invalidateQueries({ queryKey: ['worker-calendar-jobs'] });
          
          // Reset form fields
          setIncidentReason('');
          setNotifiedAt(null);
          
          // Note: We keep the worker in the job with the updated status so it appears in their profile
          // The status change is logged to job history and the worker will see it in their job history tab
        } catch (error) {
          console.error('Failed to create worker incident:', error);
          // Fallback to regular removal if incident creation fails
          await removeWorkerAndAssociations();
        }
        return;
      }
    }
    
    // Regular removal (for non-accepted workers or when "Remove from job" is selected)
    void removeWorkerAndAssociations();
  };

  // Handle dialog cancel
  const handleRemoveCancel = () => {
    setShowRemoveDialog(false);
    setRemovalAction('remove'); // Reset to default
    setIncidentReason(''); // Reset reason
    setRejectionReason(''); // Reset rejection reason
    setNotifiedAt(null); // Reset notified_at
    setNotifiedAtError(false); // Reset error
    setRejectionReasonError(false); // Reset rejection error
  };

  // Handle resend notification click
  const handleResendClick = () => {
    setShowResendDialog(true);
  };

  const handleResendCancel = () => {
    setShowResendDialog(false);
  };

  const handleResendConfirm = async () => {
    // Change status from rejected to pending
    setValue(`workers[${thisWorkerIndex}].status`, 'pending');
    setShowResendDialog(false);
    // Trigger validation to update error messages
    await trigger('workers');
  };

  // Fetch vehicles for the selected worker
  const { data: employeeVehicles } = useQuery({
    queryKey: ['employee-vehicles', currentEmployeeId],
    queryFn: async () => {
      if (!currentEmployeeId) return { vehicles: [] };
      const response = await fetcher(`${endpoints.management.vehicle}?operator_id=${currentEmployeeId}`);
      return response.data;
    },
    enabled: !!currentEmployeeId,
  });

  const availableVehicles = employeeVehicles?.vehicles || [];

  // Track which workers we've already auto-assigned vehicles for to prevent duplicates
  const autoAssignedWorkersRef = React.useRef<Set<string>>(new Set());

  // Auto-assign vehicles when worker is selected and has assigned vehicles
  useEffect(() => {
    if (!currentEmployeeId || availableVehicles.length === 0) {
      // Clear the ref when worker is cleared
      if (!currentEmployeeId) {
        autoAssignedWorkersRef.current.clear();
      }
      return;
    }

    // Skip auto-populating vehicles for TCP workers
    const positionLower = currentPosition?.toLowerCase() || '';
    if (positionLower === 'tcp') {
      return;
    }

    // Skip if we've already auto-assigned vehicles for this worker
    if (autoAssignedWorkersRef.current.has(currentEmployeeId)) {
      return;
    }

    const currentVehicles = getValues('vehicles') || [];
    
    // Check which vehicles are already assigned to this worker
    const existingVehicleIds = currentVehicles
      .filter((v: any) => v.operator && v.operator.id === currentEmployeeId)
      .map((v: any) => v.id)
      .filter(Boolean);

    // Find vehicles that need to be added (not already in the list)
    const vehiclesToAdd = availableVehicles.filter(
      (vehicle: any) => vehicle.id && !existingVehicleIds.includes(vehicle.id)
    );

    // Auto-add vehicles that aren't already assigned
    if (vehiclesToAdd.length > 0) {
      vehiclesToAdd.forEach((vehicle: any) => {
        appendVehicleFn({
          type: vehicle.type || '',
          id: vehicle.id || '',
          license_plate: vehicle.license_plate || '',
          unit_number: vehicle.unit_number || '',
          operator: {
            id: currentEmployeeId,
            first_name: getValues(workerFieldNames.first_name) || '',
            last_name: getValues(workerFieldNames.last_name) || '',
            photo_url: getValues(workerFieldNames.photo_url) || '',
            position: currentPosition || '',
            worker_index: thisWorkerIndex,
          },
        });
      });
      
      // Mark this worker as having vehicles auto-assigned
      autoAssignedWorkersRef.current.add(currentEmployeeId);
    } else if (availableVehicles.length > 0) {
      // Even if no vehicles to add, mark as processed to avoid re-checking
      autoAssignedWorkersRef.current.add(currentEmployeeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEmployeeId, availableVehicles.length, appendVehicleFn, currentPosition]);

  // Handle worker selection with vehicle cleanup
  const handleWorkerSelect = async (worker: any) => {
    // Additional logic for vehicle cleanup when worker changes
    if (worker && currentEmployeeId && worker.value !== currentEmployeeId) {
      // Remove any vehicles assigned to the previous worker
      const currentVehicles = getValues('vehicles') || [];
      const vehiclesToRemove: number[] = [];
      currentVehicles.forEach((vehicle: any, vIdx: number) => {
        if (vehicle.operator && vehicle.operator.id === currentEmployeeId) {
          vehiclesToRemove.push(vIdx);
        }
      });

      if (vehiclesToRemove.length > 0) {
        vehiclesToRemove.reverse().forEach((vIdx: number) => {
          removeVehicle(vIdx);
        });
      }
      
      // Clear the auto-assigned ref for the previous worker so new worker can get vehicles
      autoAssignedWorkersRef.current.delete(currentEmployeeId);
    }

    const previousWorkerId = currentEmployeeId;
    const timesheetManagerId = getValues('timesheet_manager_id');

    // Trigger validation to update error messages
    await trigger('workers');

    // If the timesheet manager was the previous worker, clear selection so admin must choose again
    if (previousWorkerId && timesheetManagerId && timesheetManagerId === previousWorkerId) {
      setValue('timesheet_manager_id', worker?.value || '');
      await trigger('timesheet_manager_id');
    }
  };

  // Reset employee selection when position changes
  // DISABLED: Allow cross-position selection (e.g., HWY workers can work as LCT)
  // useEffect(() => {
  //   if (currentPosition && currentEmployeeId) {
  //     const selectedEmployee = employeeOptions.find((emp: any) => emp.value === currentEmployeeId);
  //     if (selectedEmployee) {
  //       const roleMatch = selectedEmployee.role
  //         ?.split('/')
  //         .map((r: string) => r.trim().toLowerCase())
  //         .includes(currentPosition.trim().toLowerCase());

  //       if (!roleMatch) {
  //         setValue(workerFieldNames.id, '');
  //         setValue(workerFieldNames.first_name, '');
  //         setValue(workerFieldNames.last_name, '');
  //         setValue(workerFieldNames.photo_url, '');
  //         setValue(`workers[${thisWorkerIndex}].email`, '');
  //         setValue(`workers[${thisWorkerIndex}].phone_number`, '');
  //         setValue(`workers[${thisWorkerIndex}].status`, 'draft');

  //         // Remove any vehicles assigned to this worker
  //         const currentVehicles = getValues('vehicles') || [];
  //         const vehiclesToRemove: number[] = [];
  //         currentVehicles.forEach((vehicle: any, vIdx: number) => {
  //           if (vehicle.operator && vehicle.operator.id === currentEmployeeId) {
  //             vehiclesToRemove.push(vIdx);
  //           }
  //         });

  //         if (vehiclesToRemove.length > 0) {
  //           vehiclesToRemove.reverse().forEach((vIdx: number) => {
  //             removeVehicle(vIdx);
  //           });
  //         }
  //       }
  //     }
  //   }
  // }, [
  //   currentPosition,
  //   workerFieldNames,
  //   setValue,
  //   employeeOptions,
  //   thisWorkerIndex,
  //   getValues,
  //   removeVehicle,
  //   currentEmployeeId,
  // ]);

  // Separate effect to trigger validation when position changes
  useEffect(() => {
    if (currentPosition) {
      // Small delay to ensure the form state is updated
      const timeoutId = setTimeout(() => {
        trigger('workers');
      }, 100);
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [currentPosition, trigger, thisWorkerIndex, workerFieldNames.position]);

  return (
    <>
      <Box
        sx={{
          gap: 1.5,
          display: 'flex',
          alignItems: 'flex-end',
          flexDirection: 'column',
          borderRadius: 1,
          border: isCreateMode && hasBlockingConflict ? '2px solid' : 'none',
          borderColor: isCreateMode && hasBlockingConflict ? 'error.main' : 'transparent',
          position: 'relative',
          p: isCreateMode && hasBlockingConflict ? 1.5 : 0,
          pt: isCreateMode && hasBlockingConflict ? 3.5 : 1.5,
        }}
        title={isCreateMode && hasBlockingConflict ? conflictMessage : undefined}
      >
        {/* Warning icon indicator */}
        {isCreateMode && hasBlockingConflict && (
          <Tooltip title={conflictMessage} arrow placement="top">
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                zIndex: 1,
              }}
            >
              <Iconify icon="solar:danger-triangle-bold" width={20} sx={{ color: 'error.main' }} />
              <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600 }}>
                Schedule Conflict
              </Typography>
            </Box>
          </Tooltip>
        )}
        <Box
          sx={{
            gap: 2,
            width: 1,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            mt: isCreateMode && hasBlockingConflict ? 1 : 0,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="flex-end" sx={{ flex: 1, minWidth: 0 }}>
            {/* Worker Status Badge - hide in create/duplicate mode (all workers are draft) */}
            {/* Show in edit mode to display worker response status */}
            {!isCreateMode && (
              <Box sx={{ pb: 1, flexShrink: 0, width: 100 }}>
                <Label
                  variant="soft"
                  color={getStatusColor(currentWorkerStatus)}
                  sx={{
                    px: 1.2,
                    py: 0.5,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}
                >
                  {getStatusLabel(currentWorkerStatus)}
                </Label>
              </Box>
            )}

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Field.Select
                size="small"
                name={workerFieldNames.position}
                label={
                  !getValues('client')?.id || !getValues('company')?.id || !getValues('site')?.id
                    ? 'Select company/site/client first'
                    : 'Position*'
                }
                disabled={
                  workers[thisWorkerIndex]?.status === 'accepted' ||
                  workers[thisWorkerIndex]?.status === 'pending' ||
                  workers[thisWorkerIndex]?.status === 'no_show' ||
                  workers[thisWorkerIndex]?.status === 'called_in_sick' ||
                  !getValues('client')?.id ||
                  !getValues('company')?.id ||
                  !getValues('site')?.id
                }
              >
                {JOB_POSITION_OPTIONS.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Field.Select>
            </Box>
          </Stack>

          {!hideEmployeeSelector && (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <EnhancedWorkerSelector
                workerFieldNames={workerFieldNames}
                employeeOptions={employeeOptions}
                position={currentPosition}
                viewAllWorkers={viewAllWorkers}
                currentWorkerIndex={thisWorkerIndex}
                onWorkerSelect={handleWorkerSelect}
                disabled={
                  workers[thisWorkerIndex]?.status === 'accepted' ||
                  workers[thisWorkerIndex]?.status === 'pending' ||
                  workers[thisWorkerIndex]?.status === 'no_show' ||
                  workers[thisWorkerIndex]?.status === 'called_in_sick'
                }
              />
            </Box>
          )}

          <Box sx={{ flexShrink: 0, width: { xs: '100%', md: 160 } }}>
            <Field.TimePicker
              name={workerFieldNames.start_time}
              label="Start Time"
              disabled={
                workers[thisWorkerIndex]?.status === 'no_show' ||
                workers[thisWorkerIndex]?.status === 'called_in_sick'
              }
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                },
              }}
            />
          </Box>

          <Box sx={{ flexShrink: 0, width: { xs: '100%', md: 160 } }}>
            <Field.TimePicker
              name={workerFieldNames.end_time}
              label="End Time"
              disabled={
                workers[thisWorkerIndex]?.status === 'no_show' ||
                workers[thisWorkerIndex]?.status === 'called_in_sick'
              }
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                },
              }}
            />
          </Box>

          {!isXsSmMd && (
            <Stack direction="row" spacing={1}>
              {currentWorkerStatus === 'rejected' && (
                <Button
                  size="small"
                  variant="contained"
                  color="warning"
                  startIcon={<Iconify icon={"solar:refresh-bold" as any} />}
                  onClick={handleResendClick}
                  sx={{ px: 3, mt: 1 }}
                >
                  Resend
                </Button>
              )}
              <Button
                size="small"
                color="error"
                startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                onClick={handleRemoveClick}
                disabled={
                  !canRemove ||
                  currentWorkerStatus === 'no_show' ||
                  currentWorkerStatus === 'called_in_sick'
                }
                sx={{ px: 1, mt: 1 }}
              >
                Remove
              </Button>
            </Stack>
          )}
        </Box>
        {isXsSmMd && (
          <Stack direction="row" spacing={1}>
            {currentWorkerStatus === 'rejected' && (
              <Button
                size="small"
                color="warning"
                startIcon={<Iconify icon={"solar:refresh-bold" as any} />}
                onClick={handleResendClick}
              >
                Resend
              </Button>
            )}
            <Button
              size="small"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={handleRemoveClick}
              disabled={
                !canRemove ||
                currentWorkerStatus === 'no_show' ||
                currentWorkerStatus === 'called_in_sick'
              }
            >
              Remove
            </Button>
          </Stack>
        )}
      </Box>

      {/* Remove Worker Confirmation Dialog */}
      <Dialog open={showRemoveDialog} onClose={handleRemoveCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Remove Worker</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 1 }}>
            This worker has already been notified about this job.
          </Typography>
          {currentWorkerStatus !== 'accepted' && (
            <Typography variant="body1" sx={{ mb: 2 }}>
              Removing them will <strong>also remove this job from their schedule</strong> and they
              will no longer receive any updates about this job.
            </Typography>
          )}
          {currentWorkerStatus === 'accepted' && (
            <Typography variant="body1" sx={{ mb: 2 }}>
              Choose how to handle this worker. If you mark them as &quot;No Show&quot; or &quot;Called in Sick&quot;,
              their status will be updated and the job will remain in their job history.
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Worker Status: <strong>{getStatusLabel(currentWorkerStatus)}</strong>
          </Typography>
          
          {/* Show options if worker has accepted the job */}
          {currentWorkerStatus === 'accepted' && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                Choose an action:
              </Typography>
              <RadioGroup
                value={removalAction}
                onChange={(e) => {
                  setRemovalAction(e.target.value as 'remove' | 'no_show' | 'called_in_sick');
                  // Reset fields when action changes
                  if (e.target.value === 'remove') {
                    setIncidentReason('');
                    setNotifiedAt(null);
                  }
                }}
              >
                <FormControlLabel
                  value="remove"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Remove from job
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Simply remove the worker from this job
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 1 }}
                />
                <FormControlLabel
                  value="no_show"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Mark as No Show
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Worker did not show up for the job. Status will be updated and will appear in their job history.
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 1 }}
                />
                <FormControlLabel
                  value="called_in_sick"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Mark as Called in Sick
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Worker called in sick for this job. Status will be updated and will appear in their job history.
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </Box>
          )}

          {/* Show memo/reason field when marking as no_show or called_in_sick */}
          {currentWorkerStatus === 'accepted' && (removalAction === 'no_show' || removalAction === 'called_in_sick') && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              {/* Show "When did they notify" field first for called_in_sick */}
              {removalAction === 'called_in_sick' && (
                <DateTimePicker
                  label="When did they notify? *"
                  value={notifiedAt}
                  onChange={(newValue) => {
                    setNotifiedAt(newValue);
                    setNotifiedAtError(false); // Clear error when value changes
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: notifiedAtError,
                      helperText: notifiedAtError ? 'Notification date & time is required for "Called in Sick" incidents' : '',
                    },
                  }}
                />
              )}

              <TextField
                fullWidth
                label="Memo / Reason"
                multiline
                rows={3}
                value={incidentReason}
                onChange={(e) => setIncidentReason(e.target.value)}
                placeholder="Enter reason or memo for this incident..."
              />
            </Stack>
          )}

          {/* Show options if worker has pending status */}
          {currentWorkerStatus === 'pending' && (
            <Box sx={{ mb: 2, mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                Choose an action:
              </Typography>
              <RadioGroup
                value={removalAction}
                onChange={(e) => {
                  setRemovalAction(e.target.value as 'remove' | 'reject');
                  // Reset fields when action changes
                  if (e.target.value === 'remove') {
                    setRejectionReason('');
                    setRejectionReasonError(false);
                  }
                }}
              >
                <FormControlLabel
                  value="remove"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Remove from job
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Simply remove the worker from this job
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 1 }}
                />
                <FormControlLabel
                  value="reject"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Reject on behalf of worker
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Mark the worker as rejected. You must provide a reason.
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </Box>
          )}

          {/* Show rejection reason field when rejecting pending worker */}
          {currentWorkerStatus === 'pending' && removalAction === 'reject' && (
            <TextField
              fullWidth
              label="Rejection Reason *"
              multiline
              rows={3}
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                setRejectionReasonError(false); // Clear error when value changes
              }}
              error={rejectionReasonError}
              helperText={rejectionReasonError ? 'Rejection reason is required' : 'Please provide a reason for rejecting this worker'}
              placeholder="Enter reason for rejecting this worker..."
              sx={{ mt: 2 }}
            />
          )}
          
          {currentWorkerStatus !== 'accepted' && currentWorkerStatus !== 'pending' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Are you sure you want to proceed?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRemoveCancel}>Cancel</Button>
          <Button onClick={handleRemoveConfirm} color="error" variant="contained">
            {currentWorkerStatus === 'accepted'
              ? removalAction === 'remove'
                ? 'Yes, Remove Worker'
                : removalAction === 'no_show'
                ? 'Mark as No Show'
                : 'Mark as Called in Sick'
              : currentWorkerStatus === 'pending'
              ? removalAction === 'reject'
                ? 'Reject Worker'
                : 'Yes, Remove Worker'
              : 'Yes, Remove Worker'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resend Notification Confirmation Dialog */}
      <Dialog open={showResendDialog} onClose={handleResendCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Resend Notification</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 1 }}>
            This will change the worker&apos;s status from <strong>Rejected</strong> to <strong>Pending</strong> and resend the job notification.
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            The worker will receive a new email and SMS notification about this job.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Are you sure you want to resend the notification?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResendCancel}>Cancel</Button>
          <Button onClick={handleResendConfirm} color="warning" variant="contained">
            Yes, Resend Notification
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default EnhancedWorkerItem;
