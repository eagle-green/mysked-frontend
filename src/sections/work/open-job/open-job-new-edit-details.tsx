import type { IUser } from 'src/types/user';
import type { IJobWorker, IJobVehicle, IJobEquipment } from 'src/types/job';

import { useState, useEffect } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import FormControlLabel from '@mui/material/FormControlLabel';

import {
  JOB_VEHICLE_OPTIONS,
  JOB_EQUIPMENT_OPTIONS,
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

import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';

import { EnhancedWorkerItem } from './open-job-enhanced-worker-item';

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

export function JobNewEditDetails({ userList }: { userList?: any[] }) {
  const { control, getValues, setValue, watch } = useFormContext();
  const note = watch('note');
  const [showNote, setShowNote] = useState(Boolean(note));
  // View All toggle for worker preferences
  const [viewAllWorkers, setViewAllWorkers] = useState(false);

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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" sx={{ color: 'text.disabled' }}>
          Workers:
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={viewAllWorkers}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setViewAllWorkers(e.target.checked)}
              size="small"
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              View All
            </Typography>
          }
        />
      </Box>

      <Stack spacing={3}>
        {workerFields.map((item, index) => (
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
            viewAllWorkers={viewAllWorkers}
          />
        ))}
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

      <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

      <Typography variant="h6" sx={{ color: 'text.disabled', mb: 3 }}>
        Vehicles:
      </Typography>

      <Stack spacing={3}>
        {vehicleFields.map((item, index) => (
          <VehicleItem
            key={item.id}
            fieldNames={getVehicleFieldNames(index)}
            onRemoveVehicleItem={() => removeVehicle(index)}
          />
        ))}
      </Stack>

      {/* Check if there are LCT positions to allow vehicles */}
      {!getValues('workers')?.some((w: any) => w.position && w.position.toLowerCase() === 'lct') ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>No LCT Positions:</strong> You must add at least one LCT position before adding
            vehicles. TCP positions do not require vehicles.
          </Typography>
        </Alert>
      ) : vehicleFields.length >
        (getValues('workers')?.filter((w: any) => w.position && w.position.toLowerCase() === 'lct')
          .length || 0) ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Too Many Vehicle Entries:</strong> You have {vehicleFields.length} vehicle
            entries but only{' '}
            {getValues('workers')?.filter(
              (w: any) => w.position && w.position.toLowerCase() === 'lct'
            ).length || 0}{' '}
            LCT positions. Please remove excess vehicle entries or add more LCT positions.
          </Typography>
        </Alert>
      ) : (
        <Button
          size="small"
          color="primary"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => {
            // const lctWorkers =
            //   getValues('workers')?.filter(
            //     (w: any) => w.position && w.position.toLowerCase() === 'lct'
            //   ).length || 0; // Unused variable

            // Check if any existing vehicle row is incomplete
            const hasIncompleteRows =
              getValues('vehicles')?.some((v: any) => !v.type || !v.quantity || v.quantity < 1) ||
              false;

            // Only add vehicle if no incomplete rows and haven't exceeded LCT position limit
            if (!hasIncompleteRows) {
              appendVehicle({
                type: '',
                quantity: 1,
                license_plate: '',
                unit_number: '',
                operator: {
                  id: '',
                  first_name: '',
                  last_name: '',
                  photo_url: '',
                  worker_index: null,
                },
              });
            }
          }}
          disabled={(() => {
            const lctWorkers =
              getValues('workers')?.filter(
                (w: any) => w.position && w.position.toLowerCase() === 'lct'
              ).length || 0;

            // Check if any vehicle row is incomplete (missing type or quantity)
            const hasIncompleteRows =
              getValues('vehicles')?.some((v: any) => !v.type || !v.quantity || v.quantity < 1) ||
              false;

            // Check if total quantity would exceed LCT positions
            const totalVehicleQuantity =
              getValues('vehicles')?.reduce((total: number, v: any) => {
                if (v.quantity && v.type) {
                  return total + (Number(v.quantity) || 0);
                }
                return total;
              }, 0) || 0;

            // Disable if: incomplete rows exist OR total quantity >= LCT positions
            return hasIncompleteRows || totalVehicleQuantity >= lctWorkers;
          })()}
          sx={{ mt: 2, flexShrink: 0, alignItems: 'flex-start' }}
        >
          Add Vehicle
        </Button>
      )}

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

type VehicleItemProps = {
  onRemoveVehicleItem: () => void;
  fieldNames: {
    type: string;
    id: string;
    quantity: string;
    license_plate: string;
    unit_number: string;
    operator: string;
    operator_id: string;
    operator_worker_index: string;
    operator_first_name: string;
    operator_last_name: string;
    operator_position: string;
    operator_photo_url: string;
  };
};

function VehicleItem({ onRemoveVehicleItem, fieldNames }: VehicleItemProps) {
  const { setValue, watch, control } = useFormContext();
  const theme = useTheme();
  const isXsSmMd = useMediaQuery(theme.breakpoints.down('md'));
  const workers = watch('workers') || [];
  // const vehicleList = watch('vehicles') || []; // Unused variable

  // Get the current vehicle index
  const thisVehicleIndex = Number(
    fieldNames.operator.match(/vehicles\[(\d+)\]\.operator/)?.[1] ?? -1
  );
  // const selectedVehicleType = watch(fieldNames.type); // Unused variable
  // const currentOperator = watch(fieldNames.operator); // Unused variable

  // Collect all selected operator worker references from other vehicles
  // const pickedOperators = vehicleList // vehicleList was also unused
  //   .map((v: any, idx: number) => (idx !== thisVehicleIndex && v.operator ? v.operator.id : null))
  //   .filter(Boolean);

  // Create operator options from workers, excluding already picked ones
  // const operatorOptions = workers // Unused variable
  //   .filter((w: any) => w && w.id && w.position && (w.first_name || w.last_name))
  //   .filter((w: any) => !pickedOperators.includes(w.id)) // pickedOperators was also unused
  //   .map((w: any, idx: number) => {
  //     const positionLabel =
  //       JOB_POSITION_OPTIONS.find((opt) => opt.value === w.position)?.label || w.position || '';
  //     return {
  //       label: `${w.first_name || ''} ${w.last_name || ''} (${positionLabel})`.trim(),
  //       value: w.id,
  //       photo_url: w.photo_url || '',
  //       first_name: w.first_name,
  //       last_name: w.last_name,
  //       position: w.position,
  //     };
  //   });

  // For open jobs, we don't fetch specific vehicles - just show the type and allow manual entry
  // const vehicleOptionsData = { vehicles: [] }; // Unused variable
  // const isLoadingVehicles = false; // Unused variable

  // const vehicleOptions = useMemo(() => { // Unused variable
  //   const vehicles = vehicleOptionsData?.vehicles || [];
  //   return vehicles.map((vehicle: any) => ({
  //     ...vehicle,
  //     label: `${vehicle.license_plate} - ${vehicle.unit_number}`,
  //     value: vehicle.id,
  //   }));
  // }, [vehicleOptionsData]);

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
        {/* 1. Vehicle Type - First */}
        <Field.Select
          size="small"
          name={fieldNames.type}
          label="Vehicle Type*"
          fullWidth
          onChange={(event) => {
            const newType = event.target.value;
            setValue(fieldNames.type, newType);
            // Clear quantity when type changes
            setValue(`vehicles[${thisVehicleIndex}].quantity`, '');
          }}
        >
          <MenuItem value="">Select vehicle type</MenuItem>
          {JOB_VEHICLE_OPTIONS.map((item) => (
            <MenuItem key={item.value} value={item.value}>
              {item.label}
            </MenuItem>
          ))}
        </Field.Select>

        {/* 2. Vehicle Quantity - Second */}
        <Controller
          name={`vehicles[${thisVehicleIndex}].quantity`}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              size="small"
              label="Vehicle Quantity*"
              type="number"
              inputProps={{
                min: 1,
                max: (() => {
                  const lctWorkers = workers.filter(
                    (w: any) => w.position && w.position.toLowerCase() === 'lct'
                  ).length;
                  // Calculate total excluding current vehicle for consistent logic
                  const totalAllocatedQuantity =
                    watch('vehicles')?.reduce((total: number, v: any, idx: number) => {
                      if (idx !== thisVehicleIndex && v.quantity && v.type && v.quantity > 0) {
                        return total + (Number(v.quantity) || 0);
                      }
                      return total;
                    }, 0) || 0;
                  const remainingCapacity = lctWorkers - totalAllocatedQuantity;
                  return Math.max(1, remainingCapacity);
                })(),
                step: 1,
                inputMode: 'numeric',
              }}
              placeholder="1"
              fullWidth
              disabled={!watch(`vehicles[${thisVehicleIndex}].type`)}
              onChange={(event) => {
                const newValue = event.target.value;
                field.onChange(newValue);
              }}
              onBlur={(event) => {
                // Validate and cap the value when user finishes typing
                const newValue = parseInt(event.target.value, 10);
                if (!isNaN(newValue) && newValue > 0) {
                  const lctWorkers = workers.filter(
                    (w: any) => w.position && w.position.toLowerCase() === 'lct'
                  ).length;
                  // Calculate total excluding current vehicle to avoid circular dependency
                  const totalAllocatedQuantity =
                    watch('vehicles')?.reduce((total: number, v: any, idx: number) => {
                      if (idx !== thisVehicleIndex && v.quantity && v.type && v.quantity > 0) {
                        return total + (Number(v.quantity) || 0);
                      }
                      return total;
                    }, 0) || 0;
                  const remainingCapacity = lctWorkers - totalAllocatedQuantity;

                  // If the new value exceeds remaining capacity, cap it
                  if (newValue > remainingCapacity) {
                    field.onChange(remainingCapacity);
                  }
                }
                field.onBlur();
              }}
            />
          )}
        />

        {!isXsSmMd && (
          <Button
            size="small"
            color="error"
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            onClick={onRemoveVehicleItem}
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
            onClick={onRemoveVehicleItem}
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

interface EquipmentItemProps {
  onRemoveEquipmentItem: () => void;
  equipmentFieldNames: Record<string, string>;
}

function EquipmentItem({ onRemoveEquipmentItem, equipmentFieldNames }: EquipmentItemProps) {
  const theme = useTheme();
  const isXsSmMd = useMediaQuery(theme.breakpoints.down('md'));

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
        >
          {JOB_EQUIPMENT_OPTIONS.map((item) => (
            <MenuItem key={item.value} value={item.value}>
              {item.label}
            </MenuItem>
          ))}
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
    </Box>
  );
}
