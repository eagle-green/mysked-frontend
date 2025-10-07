import { useFormContext } from 'react-hook-form';
import React, { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';

import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';

import { Label } from 'src/components/label';
import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { EnhancedWorkerSelector } from 'src/components/worker';

// ----------------------------------------------------------------------

interface EnhancedWorkerItemProps {
  onRemoveWorkerItem: () => void;
  workerFieldNames: Record<string, string>;
  employeeOptions: any[];
  position: string;
  canRemove: boolean;
  removeVehicle: (index: number) => void;
  viewAllWorkers?: boolean;
}

export function EnhancedWorkerItem({
  onRemoveWorkerItem,
  workerFieldNames,
  employeeOptions,
  position,
  canRemove,
  removeVehicle,
  viewAllWorkers = false,
}: EnhancedWorkerItemProps) {
  const theme = useTheme();
  const isXsSmMd = useMediaQuery(theme.breakpoints.down('md'));
  const { getValues, setValue, watch, trigger } = useFormContext();

  // Dialog state for removing worker with notifications
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  // Get current values
  const workers = watch('workers') || [];
  const currentPosition = watch(workerFieldNames.position);
  const currentEmployeeId = watch(workerFieldNames.id);
  const thisWorkerIndex = Number(workerFieldNames.id.match(/workers\[(\d+)\]\.id/)?.[1] ?? -1);

  // Get current worker status
  const currentWorkerStatus = workers[thisWorkerIndex]?.status || 'draft';

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
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // Check if worker has notifications sent (not draft status)
  const hasNotificationsSent = currentWorkerStatus !== 'draft';

  // Handle remove button click
  const handleRemoveClick = () => {
    if (hasNotificationsSent) {
      setShowRemoveDialog(true);
    } else {
      onRemoveWorkerItem();
    }
  };

  // Handle dialog confirm
  const handleRemoveConfirm = () => {
    setShowRemoveDialog(false);

    // Remove any vehicles operated by this worker before removing the worker
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

    // Now remove the worker
    onRemoveWorkerItem();
  };

  // Handle dialog cancel
  const handleRemoveCancel = () => {
    setShowRemoveDialog(false);
  };

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
    }
    // Trigger validation to update error messages
    await trigger('workers');
  };

  // Reset employee selection when position changes
  useEffect(() => {
    if (currentPosition && currentEmployeeId) {
      const selectedEmployee = employeeOptions.find((emp: any) => emp.value === currentEmployeeId);
      if (selectedEmployee) {
        const roleMatch = selectedEmployee.role
          ?.split('/')
          .map((r: string) => r.trim().toLowerCase())
          .includes(currentPosition.trim().toLowerCase());

        if (!roleMatch) {
          setValue(workerFieldNames.id, '');
          setValue(workerFieldNames.first_name, '');
          setValue(workerFieldNames.last_name, '');
          setValue(workerFieldNames.photo_url, '');
          setValue(`workers[${thisWorkerIndex}].email`, '');
          setValue(`workers[${thisWorkerIndex}].phone_number`, '');
          setValue(`workers[${thisWorkerIndex}].status`, 'draft');

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
        }
      }
    }
  }, [
    currentPosition,
    workerFieldNames,
    setValue,
    employeeOptions,
    thisWorkerIndex,
    getValues,
    removeVehicle,
    currentEmployeeId,
  ]);

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
        }}
      >
        <Box
          sx={{
            gap: 2,
            width: 1,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          <Stack direction="row" spacing={1} alignItems="flex-end" sx={{ width: 1 }}>
            {/* Worker Status Badge - displayed on the left side */}
            <Box sx={{ pb: 1, flexShrink: 0, width: 80 }}>
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

          <EnhancedWorkerSelector
            workerFieldNames={workerFieldNames}
            employeeOptions={employeeOptions}
            position={currentPosition}
            viewAllWorkers={viewAllWorkers}
            currentWorkerIndex={thisWorkerIndex}
            onWorkerSelect={handleWorkerSelect}
            disabled={
              workers[thisWorkerIndex]?.status === 'accepted' ||
              workers[thisWorkerIndex]?.status === 'pending'
            }
          />

          <Field.TimePicker
            name={workerFieldNames.start_time}
            label="Start Time"
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />

          <Field.TimePicker
            name={workerFieldNames.end_time}
            label="End Time"
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />

          {!isXsSmMd && (
            <Button
              size="small"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={handleRemoveClick}
              disabled={!canRemove}
              sx={{ px: 4.5, mt: 1 }}
            >
              Remove
            </Button>
          )}
        </Box>
        {isXsSmMd && (
          <Button
            size="small"
            color="error"
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            onClick={handleRemoveClick}
            disabled={!canRemove}
          >
            Remove
          </Button>
        )}
      </Box>

      {/* Remove Worker Confirmation Dialog */}
      <Dialog open={showRemoveDialog} onClose={handleRemoveCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Remove Worker</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 1 }}>
            This worker has already been notified about this job.
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Removing them will <strong>also remove this job from their schedule</strong> and they
            will no longer receive any updates about this job.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Worker Status: <strong>{getStatusLabel(currentWorkerStatus)}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Are you sure you want to proceed?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRemoveCancel}>Cancel</Button>
          <Button onClick={handleRemoveConfirm} color="error" variant="contained">
            Yes, Remove Worker
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default EnhancedWorkerItem;
