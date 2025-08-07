import type { IUser } from 'src/types/user';
import type { IJobWorker, IJobVehicle, IJobEquipment } from 'src/types/job';

import { Icon } from '@iconify/react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import useMediaQuery from '@mui/material/useMediaQuery';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { fetcher, endpoints } from 'src/lib/axios';
import {
  JOB_VEHICLE_OPTIONS,
  JOB_POSITION_OPTIONS,
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
const getCertificationExpiringSoon = (expiryDate: string | null | undefined): { isExpiringSoon: boolean; daysRemaining: number } => {
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
const checkUserCertifications = (user: IUser): { 
  tcpStatus: { isValid: boolean; isExpiringSoon: boolean; daysRemaining: number; hasCertification: boolean };
  driverLicenseStatus: { isValid: boolean; isExpiringSoon: boolean; daysRemaining: number; hasLicense: boolean };
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

import { EnhancedWorkerItem } from './enhanced-worker-item';

// ----------------------------------------------------------------------

export const defaultVehicle: Omit<IJobVehicle, 'id'> = {
  type: '',
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={viewAllWorkers}
                onChange={(e) => setViewAllWorkers(e.target.checked)}
                size="small"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            View All
          </Typography>
                <Tooltip
                  title={
                    <Box sx={{ p: 1 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Circle Icon Meanings:
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: 'success.main',
                            }}
                          />
                          <Typography variant="body2">Preferred</Typography>
        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: 'warning.main',
                            }}
                          />
                          <Typography variant="body2">Not Preferred</Typography>
      </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: 'error.main',
                            }}
                          />
                          <Typography variant="body2">Mandatory Restriction</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary' }}>
                          Order: Company | Site | Client
          </Typography>
                        <Typography variant="caption" sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}>
                          Note: Mandatory restrictions override all other preferences
                        </Typography>
                      </Box>
                    </Box>
                  }
                  arrow
                  placement="top"
                >
                  <Icon
                    icon="solar:info-circle-line-duotone"
                    width={16}
                    height={16}
                    style={{ color: 'var(--palette-text-secondary)', cursor: 'pointer' }}
                  />
                </Tooltip>
              </Box>
            }
          />
        </Box>
      </Box>

      <Stack spacing={3}>
        {workerFields.map((item, index) => (
          <EnhancedWorkerItem
            key={`worker-${item.id}-${index}`}
            workerFieldNames={getWorkerFieldNames(index)}
            onRemoveWorkerItem={() => {
              // Prevent removing the last worker
              if (workerFields.length > 1) {
                removeWorker(index);
              }
            }}
            employeeOptions={employeeOptions}
            position={getValues(`workers[${index}].position`)}
            canRemove={workerFields.length > 1}
            removeVehicle={removeVehicle}
            viewAllWorkers={viewAllWorkers}
          />
        ))}
      </Stack>

      <Button
        size="small"
        color="primary"
        startIcon={<Iconify icon="mingcute:add-line" />}
        onClick={() => {
          const jobStartTime = getValues('start_date_time');
          const jobEndTime = getValues('end_date_time');
          appendWorker({
            ...defaultWorker,
            start_time: jobStartTime || null,
            end_time: jobEndTime || null,
          });
        }}
        sx={{ mt: 2, flexShrink: 0 }}
      >
        Add Worker
      </Button>

      <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

      <Typography variant="h6" sx={{ color: 'text.disabled', mb: 3 }}>
        Vehicles:
      </Typography>

      {!getValues('workers')?.some(
        (w: any) => w.id && w.id !== '' && w.position && w.position !== ''
      ) && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Please add <strong>Workers</strong> first before adding vehicles. Vehicles require
            operators who must be selected from the assigned workers.
          </Typography>
        </Alert>
      )}

      <Stack spacing={3}>
        {vehicleFields.map((item, index) => (
          <VehicleItem
            key={item.id}
            fieldNames={getVehicleFieldNames(index)}
            onRemoveVehicleItem={() => removeVehicle(index)}
          />
        ))}
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
          !getValues('workers')?.some(
            (w: any) => w.id && w.id !== '' && w.position && w.position !== ''
          )
        }
        sx={{ mt: 2, flexShrink: 0 }}
      >
        Add Vehicle
      </Button>

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
        sx={{ mt: 2, flexShrink: 0 }}
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
          sx={{ mt: 2, flexShrink: 0 }}
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
  const {
    setValue,
    watch,
    control,
  } = useFormContext();
  const theme = useTheme();
  const isXsSmMd = useMediaQuery(theme.breakpoints.down('md'));
  const workers = watch('workers') || [];
  const vehicleList = watch('vehicles') || [];

  // Get the current vehicle index
  const thisVehicleIndex = Number(
    fieldNames.operator.match(/vehicles\[(\d+)\]\.operator/)?.[1] ?? -1
  );
  const selectedVehicleType = watch(fieldNames.type);
  const currentOperator = watch(fieldNames.operator);

  // Collect all selected operator worker references from other vehicles
  const pickedOperators = vehicleList
    .map((v: any, idx: number) =>
      idx !== thisVehicleIndex && v.operator ? v.operator.id : null
    )
    .filter(Boolean);

  // Create operator options from workers, excluding already picked ones
  const operatorOptions = workers
    .filter((w: any) => w && w.id && w.position && (w.first_name || w.last_name))
    .filter((w: any) => !pickedOperators.includes(w.id))
    .map((w: any, idx: number) => {
      const positionLabel =
        JOB_POSITION_OPTIONS.find((opt) => opt.value === w.position)?.label || w.position || '';
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
    queryKey: ['vehicles', currentOperator?.id, selectedVehicleType],
    queryFn: async () => {
      if (!currentOperator?.id || !selectedVehicleType) {
        return { vehicles: [] };
      }
        const response = await fetcher(
        `${endpoints.management.vehicle}?operator_id=${currentOperator.id}&type=${selectedVehicleType}`
        );
        return response.data;
    },
    enabled: !!currentOperator?.id && !!selectedVehicleType,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const vehicleOptions = useMemo(() => {
    const vehicles = vehicleOptionsData?.vehicles || [];
    return vehicles.map((vehicle: any) => ({
      ...vehicle,
      label: `${vehicle.license_plate} - ${vehicle.unit_number}`,
      value: vehicle.id,
    }));
  }, [vehicleOptionsData]);

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
              setValue(fieldNames.operator_worker_index, workers.findIndex((w: any) => w.id === newValue.value));
              
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
          label={!currentOperator?.id ? "Select operator first" : "Vehicle Type*"}
              disabled={!currentOperator?.id}
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
              disabled={!selectedVehicleType || !currentOperator?.id || isLoadingVehicles}
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
                    !currentOperator?.id
                      ? 'Select operator first'
                      : !selectedVehicleType
                        ? 'Select vehicle type first'
                        : 'Vehicle*'
                  }
                  placeholder={
                    !currentOperator?.id
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

