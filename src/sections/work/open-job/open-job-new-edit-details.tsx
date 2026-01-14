import type { IUser } from 'src/types/user';
import type { IJobWorker, IJobVehicle, IJobEquipment } from 'src/types/job';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import useMediaQuery from '@mui/material/useMediaQuery';
import CircularProgress from '@mui/material/CircularProgress';

import { fetcher, endpoints } from 'src/lib/axios';
import {
  JOB_VEHICLE_OPTIONS,
  JOB_POSITION_OPTIONS,
} from 'src/assets/data/job';

// Function to check if a certification is valid (not expired)
const isCertificationValid = (expiryDate: string | null | undefined): boolean => {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  return expiry >= today;
};

// Function to check if a certification expires within 30 days and return days remaining
const getCertificationExpiringSoon = (
  expiryDate: string | null | undefined
): { isExpiringSoon: boolean; daysRemaining: number } => {
  if (!expiryDate) return { isExpiringSoon: false, daysRemaining: 0 };
  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  expiry.setHours(0, 0, 0, 0); // Reset time to start of day

  const timeDiff = expiry.getTime() - today.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

  return {
    isExpiringSoon: daysRemaining >= 0 && daysRemaining <= 30,
    daysRemaining,
  };
};

// Function to check certification status for a user
const checkUserCertifications = (
  user: IUser
): {
  tcpStatus: {
    isValid: boolean;
    isExpiringSoon: boolean;
    daysRemaining: number;
    hasCertification: boolean;
  };
  driverLicenseStatus: {
    isValid: boolean;
    isExpiringSoon: boolean;
    daysRemaining: number;
    hasLicense: boolean;
  };
} => {
  // Check TCP Certification
  const tcpStatus = {
    hasCertification: !!user.tcp_certification_expiry,
    isValid: isCertificationValid(user.tcp_certification_expiry),
    isExpiringSoon: false,
    daysRemaining: 0,
  };

  if (tcpStatus.hasCertification) {
    const expiringInfo = getCertificationExpiringSoon(user.tcp_certification_expiry);
    tcpStatus.isExpiringSoon = expiringInfo.isExpiringSoon;
    tcpStatus.daysRemaining = expiringInfo.daysRemaining;
  }

  // Check Driver License
  const driverLicenseStatus = {
    hasLicense: !!user.driver_license_expiry,
    isValid: isCertificationValid(user.driver_license_expiry),
    isExpiringSoon: false,
    daysRemaining: 0,
  };

  if (driverLicenseStatus.hasLicense) {
    const expiringInfo = getCertificationExpiringSoon(user.driver_license_expiry);
    driverLicenseStatus.isExpiringSoon = expiringInfo.isExpiringSoon;
    driverLicenseStatus.daysRemaining = expiringInfo.daysRemaining;
  }

  return { tcpStatus, driverLicenseStatus };
};

import { useEquipment } from 'src/hooks/use-equipment';

import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { AddEquipmentDialog } from 'src/components/equipment/add-equipment-dialog';
import { EditEquipmentDialog } from 'src/components/equipment/edit-equipment-dialog';

import { EnhancedWorkerItem } from '../job/enhanced-worker-item';

// ----------------------------------------------------------------------

export const defaultVehicle: Omit<IJobVehicle, 'id'> = {
  type: '',
  quantity: 1,
  license_plate: '',
  unit_number: '',
  operator: {
    id: '',
    worker_index: null,
    first_name: '',
    last_name: '',
    position: '',
    photo_url: '',
  },
};

export const defaultWorker: Omit<IJobWorker, 'id'> = {
  position: '',
  user_id: '',
  first_name: '',
  last_name: '',
  phone_number: '',
  start_time: null,
  end_time: null,
  photo_url: '',
  status: 'draft',
};

export const defaultEquipment: Omit<IJobEquipment, 'id'> = {
  type: '',
  quantity: 1,
};

const getWorkerFieldNames = (index: number): Record<string, string> => ({
  position: `workers[${index}].position`,
  id: `workers[${index}].id`,
  first_name: `workers[${index}].first_name`,
  last_name: `workers[${index}].last_name`,
  start_time: `workers[${index}].start_time`,
  end_time: `workers[${index}].end_time`,
  photo_url: `workers[${index}].photo_url`,
  email: `workers[${index}].email`,
  phone_number: `workers[${index}].phone_number`,
});

const getVehicleFieldNames = (index: number) => ({
  type: `vehicles[${index}].type`,
  id: `vehicles[${index}].id`,
  quantity: `vehicles[${index}].quantity`,
  license_plate: `vehicles[${index}].license_plate`,
  unit_number: `vehicles[${index}].unit_number`,
  operator: `vehicles[${index}].operator`,
  operator_id: `vehicles[${index}].operator.id`,
  operator_worker_index: `vehicles[${index}].operator.worker_index`,
  operator_first_name: `vehicles[${index}].operator.first_name`,
  operator_last_name: `vehicles[${index}].operator.last_name`,
  operator_position: `vehicles[${index}].operator.position`,
  operator_photo_url: `vehicles[${index}].operator.photo_url`,
});

const getEquipmentFieldNames = (index: number) => ({
  type: `equipments[${index}].type`,
  quantity: `equipments[${index}].quantity`,
});

export function JobNewEditDetails({ userList, currentJob }: { userList?: any[]; currentJob?: any }) {
  const { control, getValues, setValue, watch } = useFormContext();
  const note = watch('note');
  const [showNote, setShowNote] = useState(Boolean(note));
  const isEditMode = Boolean(currentJob?.id);

  const {
    fields: vehicleFields,
    append: appendVehicle,
    remove: removeVehicle,
  } = useFieldArray({
    control,
    name: 'vehicles',
  });

  const {
    fields: equipmentFields,
    append: appendEquipment,
    remove: removeEquipment,
  } = useFieldArray({
    control,
    name: 'equipments',
  });

  const {
    fields: workerFields,
    append: appendWorker,
    remove: removeWorker,
  } = useFieldArray({
    control,
    name: 'workers',
  });

  // Get form errors for workers field
  const { formState: { errors } } = useFormContext();
  const workersError = errors.workers;

  // Separate accepted workers from open positions
  const workers = watch('workers') || [];
  const vehicles = watch('vehicles') || [];
  // Accepted workers include: accepted, no_show, called_in_sick (they were accepted at some point)
  const acceptedWorkers = workers.filter((w: any) => 
    w.status === 'accepted' || w.status === 'no_show' || w.status === 'called_in_sick'
  );

  // Monitor worker changes and automatically remove excess vehicle entries
  useEffect(() => {
    const lctWorkers =
      getValues('workers')?.filter((w: any) => w.position && w.position.toLowerCase() === 'lct')
        .length || 0;

    // If we have more vehicle entries than LCT positions, remove the excess
    if (vehicleFields.length > lctWorkers) {
      const excessCount = vehicleFields.length - lctWorkers;
      for (let i = 0; i < excessCount; i++) {
        removeVehicle(vehicleFields.length - 1);
      }
    }
  }, [workerFields, vehicleFields.length, getValues, removeVehicle]);

  const employeeOptions = userList
    ? userList.map((user: IUser) => {
        const certifications = checkUserCertifications(user);
        return {
          label: `${user.first_name} ${user.last_name}`,
          value: user.id,
          role: user.role || '',
          photo_url: user.photo_url || '',
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone_number: user.phone_number || '',
          certifications,
        };
      })
    : [];

  return (
    <Box sx={{ p: 3 }}>
      {/* Accepted Workers Section */}
      {acceptedWorkers.length > 0 && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'text.disabled' }}>
              Accepted Workers:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {acceptedWorkers.length} {acceptedWorkers.length === 1 ? 'worker' : 'workers'} accepted
            </Typography>
          </Box>

          <Stack spacing={3} sx={{ mb: 4 }}>
            {workerFields.map((item, index) => {
              const workerStatus = getValues(`workers[${index}].status`);
              // Show accepted workers, no_show, and called_in_sick in this section
              if (workerStatus !== 'accepted' && workerStatus !== 'no_show' && workerStatus !== 'called_in_sick') return null;
              
              return (
                <EnhancedWorkerItem
                  key={`accepted-worker-${item.id}-${index}`}
                  workerFieldNames={getWorkerFieldNames(index)}
                  onRemoveWorkerItem={() => {
                    removeWorker(index);
                  }}
                  employeeOptions={employeeOptions}
                  position={getValues(`workers[${index}].position`)}
                  canRemove
                  removeVehicle={removeVehicle}
                  appendVehicle={appendVehicle}
                  viewAllWorkers
                />
              );
            })}
          </Stack>

          <Divider sx={{ my: 3, borderStyle: 'dashed' }} />
        </>
      )}

      {/* Vehicles Section - Only display in edit mode when workers have accepted */}
      {isEditMode && (
        <>
          <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

          <Typography variant="h6" sx={{ color: 'text.disabled', mb: 3 }}>
            Vehicles:
          </Typography>

          {!acceptedWorkers.some((w: any) => {
            const position = (w.position || '').toLowerCase();
            return position === 'lct' || position === 'hwy' || position === 'field_supervisor';
          }) && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Please add accepted workers with <strong>LCT</strong>, <strong>HWY</strong>, or <strong>Field Supervisor</strong> positions first before adding vehicles.
              </Typography>
            </Alert>
          )}

          <Stack spacing={3}>
            {vehicleFields.map((item, index) => {
              const vehicle = vehicles[index];
              
              // Only show vehicles that:
              // 1. Have an operator assigned to an accepted worker with LCT/HWY/Field Supervisor position
              // 2. OR are being actively edited (have type, license_plate, or unit_number filled)
              
              if (vehicle?.operator?.id) {
                const worker = workers.find((w: any) => w.id === vehicle.operator.id);
                if (worker) {
                  const isAccepted = worker.status === 'accepted' || worker.status === 'no_show' || worker.status === 'called_in_sick';
                  if (isAccepted) {
                    const position = (worker.position || '').toLowerCase();
                    if (position === 'lct' || position === 'hwy' || position === 'field_supervisor') {
                      return (
                        <OpenJobVehicleItemWrapper
                          key={`vehicle-${item.id || index}`}
                          vehicle={vehicle}
                          vehicleIndex={index}
                          acceptedWorkers={acceptedWorkers}
                          onRemove={() => {
                            removeVehicle(index);
                          }}
                        />
                      );
                    }
                  }
                }
              }
              
              // Don't render empty/incomplete vehicle items automatically
              // They will be added via the "Add Vehicle" button
              return null;
            })}
          </Stack>

          <Button
            size="small"
            color="primary"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() =>
              appendVehicle({
                type: '',
                id: '',
                license_plate: '',
                unit_number: '',
                quantity: 1, // Add quantity field (required by schema)
                operator: {
                  id: '',
                  first_name: '',
                  last_name: '',
                  photo_url: '',
                  worker_index: null,
                },
              })
            }
            disabled={
              !acceptedWorkers.some((w: any) => {
                const position = (w.position || '').toLowerCase();
                return position === 'lct' || position === 'hwy' || position === 'field_supervisor';
              })
            }
            sx={{ mt: 2, flexShrink: 0, alignItems: 'flex-start' }}
          >
            Add Vehicle
          </Button>

          <Divider sx={{ my: 3, borderStyle: 'dashed' }} />
        </>
      )}

      {/* Open Positions Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" sx={{ color: 'text.disabled' }}>
          {acceptedWorkers.length > 0 ? 'Open Positions:' : 'Workers:'}
        </Typography>
      </Box>

      <Stack spacing={3}>
        {workerFields.map((item, index) => {
          const workerStatus = getValues(`workers[${index}].status`);
          // Only show open positions (not accepted, no_show, or called_in_sick workers) in the editable section
          if (workerStatus === 'accepted' || workerStatus === 'no_show' || workerStatus === 'called_in_sick') return null;
          
          return (
            <EnhancedWorkerItem
              key={`worker-${item.id}-${index}`}
              workerFieldNames={getWorkerFieldNames(index)}
              onRemoveWorkerItem={() => {
                removeWorker(index);
              }}
              employeeOptions={employeeOptions}
              position={getValues(`workers[${index}].position`)}
              canRemove
              removeVehicle={removeVehicle}
              appendVehicle={appendVehicle}
              viewAllWorkers
              hideEmployeeSelector
            />
          );
        })}
      </Stack>

      {/* Display workers validation error */}
      {workersError && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          {typeof workersError.message === 'string' ? workersError.message : 'Workers validation error'}
        </Typography>
      )}

      <Button
        size="small"
        color="primary"
        startIcon={<Iconify icon="mingcute:add-line" />}
        onClick={() => {
          const jobStartTime = getValues('start_date_time');
          const jobEndTime = getValues('end_date_time');

          // Ensure we have valid job times
          if (!jobStartTime || !jobEndTime) {
            console.warn('Job start or end time not set, using current time as fallback');
            const now = new Date();
            const fallbackStart = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
            const fallbackEnd = new Date(now.getTime() + 9 * 60 * 60 * 1000); // 9 hours from now

            appendWorker({
              ...defaultWorker,
              start_time: fallbackStart,
              end_time: fallbackEnd,
            });
          } else {
            // Set job times as defaults for new worker slots
            appendWorker({
              ...defaultWorker,
              start_time: jobStartTime, // Use job start time as default
              end_time: jobEndTime, // Use job end time as default
            });
          }
        }}
        sx={{ mt: 2, flexShrink: 0, alignItems: 'flex-start' }}
      >
        Add Worker
      </Button>

      {/* Vehicles section removed - vehicles are auto-assigned when workers apply for LCT/HWY/Field Supervisor positions */}

      <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

      <Typography variant="h6" sx={{ color: 'text.disabled', mb: 3 }}>
        Equipment:
      </Typography>

      <Stack spacing={3}>
        {equipmentFields.map((item, index) => (
          <EquipmentItem
            key={item.id}
            equipmentFieldNames={getEquipmentFieldNames(index)}
            onRemoveEquipmentItem={() => removeEquipment(index)}
          />
        ))}
      </Stack>

      <Button
        size="small"
        color="primary"
        startIcon={<Iconify icon="mingcute:add-line" />}
        onClick={() => appendEquipment(defaultEquipment)}
        sx={{ mt: 2, flexShrink: 0, alignItems: 'flex-start' }}
      >
        Add Equipment
      </Button>

      <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

      {!showNote ? (
        <Button
          size="small"
          color="primary"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => setShowNote(true)}
          sx={{ mt: 2, flexShrink: 0, alignItems: 'flex-start' }}
        >
          Add Note
        </Button>
      ) : (
        <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Field.Text name="note" label="Note" multiline rows={4} fullWidth />
          <Button
            size="small"
            color="error"
            onClick={() => {
              setValue('note', ''); // Clear the note content
              setShowNote(false);
            }}
            sx={{ mt: 1 }}
          >
            Remove
          </Button>
        </Box>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------

type OpenJobVehicleItemWrapperProps = {
  vehicle: any;
  vehicleIndex: number;
  acceptedWorkers: any[];
  onRemove: () => void;
};

function OpenJobVehicleItemWrapper({
  vehicle,
  vehicleIndex,
  acceptedWorkers,
  onRemove,
}: OpenJobVehicleItemWrapperProps) {
  const operatorId = vehicle.operator?.id || '';
  const vehicleType = vehicle.type || '';

  // Create operator options from accepted workers
  const operatorOptions = acceptedWorkers
    .filter((w: any) => {
      const position = (w.position || '').toLowerCase();
      return position === 'lct' || position === 'hwy' || position === 'field_supervisor';
    })
    .map((w: any) => {
      const positionLabel =
        JOB_POSITION_OPTIONS.find((opt: any) => opt.value === w.position)?.label || w.position || '';
      return {
        label: `${w.first_name || ''} ${w.last_name || ''} (${positionLabel})`.trim(),
        value: w.id,
        photo_url: w.photo_url || '',
        first_name: w.first_name,
        last_name: w.last_name,
        position: w.position,
      };
    });

  // Fetch vehicles for the selected operator and vehicle type
  const { data: vehicleOptionsData, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ['vehicles', operatorId, vehicleType],
    queryFn: async () => {
      if (!operatorId || !vehicleType) {
        return { vehicles: [] };
      }
      const response = await fetcher(
        `${endpoints.management.vehicle}?operator_id=${operatorId}&type=${vehicleType}`
      );
      return response.data;
    },
    enabled: !!operatorId && !!vehicleType,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const vehicleOptions = useMemo(() => {
    const vehiclesList = vehicleOptionsData?.vehicles || [];
    return vehiclesList.map((v: any) => ({
      ...v,
      label: `${v.license_plate} - ${v.unit_number}`,
      value: v.id,
    }));
  }, [vehicleOptionsData]);

  const currentOperator = operatorOptions.find((opt: any) => opt.value === operatorId);
  const currentVehicle = vehicleOptions.find((v: any) => v.id === vehicle.id);

  return (
    <OpenJobVehicleItem
      vehicleIndex={vehicleIndex}
      operatorOptions={operatorOptions}
      vehicleOptions={vehicleOptions}
      isLoadingVehicles={isLoadingVehicles}
      currentOperator={currentOperator}
      currentVehicle={currentVehicle}
      currentVehicleType={vehicleType}
      onRemove={onRemove}
    />
  );
}

// ----------------------------------------------------------------------

type OpenJobVehicleItemProps = {
  vehicleIndex: number;
  operatorOptions: any[];
  vehicleOptions: any[];
  isLoadingVehicles: boolean;
  currentOperator: any;
  currentVehicle: any;
  currentVehicleType: string;
  onRemove: () => void;
};

function OpenJobVehicleItem({
  vehicleIndex,
  operatorOptions,
  vehicleOptions,
  isLoadingVehicles,
  currentOperator,
  currentVehicle,
  currentVehicleType,
  onRemove,
}: OpenJobVehicleItemProps) {
  const { setValue, watch, control } = useFormContext();
  const theme = useTheme();
  const isXsSmMd = useMediaQuery(theme.breakpoints.down('md'));

  const fieldNames = getVehicleFieldNames(vehicleIndex);
  const selectedVehicleType = watch(fieldNames.type);

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
        {/* 1. Operator Selection - First */}
        <Field.AutocompleteWithAvatar
          name={fieldNames.operator_id}
          label="Operator*"
          placeholder="Select an operator"
          options={operatorOptions}
          fullWidth
          slotProps={{
            textfield: {
              size: 'small',
              fullWidth: true,
            },
          }}
          onChange={(event: any, newValue: any) => {
            if (newValue) {
              // Set operator details
              setValue(fieldNames.operator_id, newValue.value);
              setValue(fieldNames.operator_first_name, newValue.first_name);
              setValue(fieldNames.operator_last_name, newValue.last_name);
              setValue(fieldNames.operator_position, newValue.position);
              setValue(fieldNames.operator_photo_url, newValue.photo_url);
              setValue(
                fieldNames.operator_worker_index,
                operatorOptions.findIndex((opt: any) => opt.value === newValue.value)
              );

              // Clear vehicle selections when operator changes
              setValue(fieldNames.type, '');
              setValue(fieldNames.id, '');
              setValue(fieldNames.license_plate, '');
              setValue(fieldNames.unit_number, '');
            } else {
              // Clear all fields
              setValue(fieldNames.operator_id, '');
              setValue(fieldNames.operator_first_name, '');
              setValue(fieldNames.operator_last_name, '');
              setValue(fieldNames.operator_position, '');
              setValue(fieldNames.operator_photo_url, '');
              setValue(fieldNames.operator_worker_index, null);
              setValue(fieldNames.type, '');
              setValue(fieldNames.id, '');
              setValue(fieldNames.license_plate, '');
              setValue(fieldNames.unit_number, '');
            }
          }}
        />

        {/* 2. Vehicle Type Selection - Second */}
        <Field.Select
          size="small"
          name={fieldNames.type}
          label={!currentOperator ? 'Select operator first' : 'Vehicle Type*'}
          disabled={!currentOperator}
          fullWidth
          onChange={(event) => {
            const newType = event.target.value;
            setValue(fieldNames.type, newType);
            // Clear vehicle selection when type changes
            setValue(fieldNames.id, '');
            setValue(fieldNames.license_plate, '');
            setValue(fieldNames.unit_number, '');
          }}
        >
          {JOB_VEHICLE_OPTIONS.map((item) => (
            <MenuItem key={item.value} value={item.value}>
              {item.label}
            </MenuItem>
          ))}
        </Field.Select>

        {/* 3. Vehicle Selection - Third */}
        <Controller
          name={fieldNames.id}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Autocomplete
              {...field}
              fullWidth
              size="small"
              disabled={!selectedVehicleType || !currentOperator || isLoadingVehicles}
              options={vehicleOptions}
              value={vehicleOptions.find((v: any) => v.id === field.value) || null}
              loading={isLoadingVehicles}
              onChange={(event: any, newValue: any) => {
                if (newValue) {
                  setValue(fieldNames.id, newValue.id);
                  setValue(fieldNames.license_plate, newValue.license_plate);
                  setValue(fieldNames.unit_number, newValue.unit_number);
                } else {
                  setValue(fieldNames.id, '');
                  setValue(fieldNames.license_plate, '');
                  setValue(fieldNames.unit_number, '');
                }
              }}
              getOptionLabel={(option: any) => option?.label || ''}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={
                    !currentOperator
                      ? 'Select operator first'
                      : !selectedVehicleType
                        ? 'Select vehicle type first'
                        : 'Vehicle*'
                  }
                  placeholder={
                    !currentOperator
                      ? 'Select operator first'
                      : !selectedVehicleType
                        ? 'Select vehicle type first'
                        : isLoadingVehicles
                          ? 'Loading vehicles...'
                          : 'Select vehicle'
                  }
                  error={!!error}
                  helperText={error?.message}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isLoadingVehicles ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          )}
        />

        {!isXsSmMd && (
          <Button
            size="small"
            color="error"
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            onClick={onRemove}
            sx={{ px: 4.5, mt: 1 }}
          >
            Remove
          </Button>
        )}
      </Box>

      {isXsSmMd && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: 1 }}>
          <Button
            size="small"
            color="error"
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            onClick={onRemove}
            sx={{ px: 4.5 }}
          >
            Remove
          </Button>
        </Box>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------

// Removed unused VehicleItem function

// ----------------------------------------------------------------------

interface EquipmentItemProps {
  onRemoveEquipmentItem: () => void;
  equipmentFieldNames: Record<string, string>;
}

function EquipmentItem({ onRemoveEquipmentItem, equipmentFieldNames }: EquipmentItemProps) {
  const theme = useTheme();
  const isXsSmMd = useMediaQuery(theme.breakpoints.down('md'));
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [equipmentToEdit, setEquipmentToEdit] = useState<{ id: string; value: string } | null>(null);
  const { data: equipmentTypes = [] } = useEquipment();
  const { setValue, watch } = useFormContext();

  const handleEquipmentAdded = (newEquipment: { id: string; value: string }) => {
    // Auto-select the newly added equipment
    setValue(equipmentFieldNames.type, newEquipment.value);
  };

  const handleEquipmentCancel = () => {
    // Reset the equipment select field when dialog is cancelled
    setValue(equipmentFieldNames.type, '');
  };

  const handleEditEquipment = (equipmentId: string, equipmentValue: string) => {
    setEquipmentToEdit({ id: equipmentId, value: equipmentValue });
    setEditDialogOpen(true);
  };

  const handleEquipmentUpdated = (updatedEquipment: { id: string; value: string }) => {
    // If the currently selected equipment was updated, update the form value
    const currentValue = watch(equipmentFieldNames.type);
    if (currentValue === equipmentToEdit?.value) {
      setValue(equipmentFieldNames.type, updatedEquipment.value);
    }
    setEquipmentToEdit(null);
  };

  const handleEquipmentDeleted = () => {
    // If the currently selected equipment was deleted, clear the form value
    const currentValue = watch(equipmentFieldNames.type);
    if (currentValue === equipmentToEdit?.value) {
      setValue(equipmentFieldNames.type, '');
    }
    setEquipmentToEdit(null);
  };

  // Format equipment value to display label (convert snake_case to Title Case)
  const formatEquipmentLabel = (value: string) => value
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

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
          name={equipmentFieldNames.type}
          label="Equipment Type*"
          fullWidth
          slotProps={{ 
            inputLabel: { shrink: true },
            select: {
              displayEmpty: true,
              renderValue: (value: any) => {
                if (!value || value === '__add_new__') {
                  return <span style={{ color: '#919EAB', fontStyle: 'normal' }}>Select Equipment Type</span>;
                }
                return formatEquipmentLabel(value);
              }
            }
          }}
        >
          <MenuItem value="">
            <em>Select Equipment Type</em>
          </MenuItem>
          {equipmentTypes.map((equipment) => (
            <MenuItem 
              key={equipment.id} 
              value={equipment.value}
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                pr: 1,
                '&:hover .edit-icon': {
                  opacity: 1,
                  visibility: 'visible',
                }
              }}
            >
              <span>{formatEquipmentLabel(equipment.value)}</span>
              <IconButton
                size="small"
                edge="end"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleEditEquipment(equipment.id, equipment.value);
                }}
                className="edit-icon"
                sx={{
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  color: 'primary.main',
                  ml: 'auto',
                }}
              >
                <Iconify icon="solar:pen-bold" width={16} />
              </IconButton>
            </MenuItem>
          ))}
          <MenuItem 
            value="__add_new__" 
            onClick={() => setAddDialogOpen(true)}
            sx={{ 
              color: 'primary.main',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: 'action.hover',
              }
            }}
          >
            <Iconify icon="mingcute:add-line" sx={{ mr: 1, fontSize: 16 }} />
            Add Equipment Type
          </MenuItem>
        </Field.Select>

        <Field.Text
          size="small"
          name={equipmentFieldNames.quantity}
          label="Quantity"
          type="number"
          InputProps={{ inputProps: { min: 1 } }}
          fullWidth
        />

        {!isXsSmMd && (
          <Button
            size="small"
            color="error"
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            onClick={onRemoveEquipmentItem}
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
          onClick={onRemoveEquipmentItem}
        >
          Remove
        </Button>
      )}

      <AddEquipmentDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onEquipmentAdded={handleEquipmentAdded}
        onCancel={handleEquipmentCancel}
      />

      <EditEquipmentDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEquipmentToEdit(null);
        }}
        equipment={equipmentToEdit}
        onEquipmentUpdated={handleEquipmentUpdated}
        onEquipmentDeleted={handleEquipmentDeleted}
      />
    </Box>
  );
}
