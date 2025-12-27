import React, { useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { fetcher, endpoints } from 'src/lib/axios';
import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';

import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';

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
}: EnhancedWorkerItemProps) {
  const theme = useTheme();
  const isXsSmMd = useMediaQuery(theme.breakpoints.down('md'));
  const { getValues, setValue, watch, control } = useFormContext();
  
  // Get appendVehicle from prop, or create one if not provided (fallback)
  const { append: appendVehicleFallback } = useFieldArray({
    control,
    name: 'vehicles',
  });
  
  const appendVehicleFn = appendVehicle || appendVehicleFallback;

  // Get current values
  const workers = watch('workers') || [];
  const currentPosition = watch(workerFieldNames.position);
  const currentEmployeeId = watch(workerFieldNames.id);
  const thisWorkerIndex = Number(workerFieldNames.id.match(/workers\[(\d+)\]\.id/)?.[1] ?? -1);

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
  const autoAssignedWorkersRef = useRef<Set<string>>(new Set());

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
  }, [currentPosition, workerFieldNames, setValue, employeeOptions, thisWorkerIndex, getValues, removeVehicle, currentEmployeeId]);

  return (
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
              onClick={onRemoveWorkerItem}
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
            onClick={onRemoveWorkerItem}
            disabled={!canRemove}
          >
            Remove
          </Button>
        )}
      </Box>
  );
}

export default EnhancedWorkerItem;
