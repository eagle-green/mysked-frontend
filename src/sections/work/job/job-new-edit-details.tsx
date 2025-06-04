import type { IUser } from 'src/types/user';
import type { IJobWorker, IJobVehicle, IJobEquipment } from 'src/types/job';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import useMediaQuery from '@mui/material/useMediaQuery';
import CircularProgress from '@mui/material/CircularProgress';

import { fetcher, endpoints } from 'src/lib/axios';
import {
  JOB_VEHICLE_OPTIONS,
  JOB_POSITION_OPTIONS,
  JOB_EQUIPMENT_OPTIONS,
} from 'src/assets/data/job';

import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { type AutocompleteWithAvatarOption } from 'src/components/hook-form/rhf-autocomplete-with-avatar';

// ----------------------------------------------------------------------

export const defaultVehicle: Omit<IJobVehicle, 'id'> = {
  type: '',
  license_plate: '',
  unit_number: '',
  operator: {
    employee_id: '',
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
  start_time: null,
  end_time: null,
  photo_url: '',
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
});

const getVehicleFieldNames = (index: number) => ({
  type: `vehicles[${index}].type`,
  id: `vehicles[${index}].id`,
  license_plate: `vehicles[${index}].license_plate`,
  unit_number: `vehicles[${index}].unit_number`,
  operator: `vehicles[${index}].operator`,
  operator_employee_id: `vehicles[${index}].operator.employee_id`,
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

export function JobNewEditDetails() {
  const { control, getValues, setValue, watch } = useFormContext();
  const note = watch('note');
  const [showNote, setShowNote] = useState(Boolean(note));

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
    name: 'equipment',
  });
  const {
    fields: workerFields,
    append: appendWorker,
    remove: removeWorker,
  } = useFieldArray({ control, name: 'workers' });

  // Fetch user list for employee autocomplete
  const { data: userList } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.user}?status=active`);
      return response.data.users;
    },
  });
  const employeeOptions = userList
    ? userList.map((user: IUser) => ({
        label: `${user.first_name} ${user.last_name}`,
        value: user.id,
        role: user.role,
        photo_url: user.photo_url,
        first_name: user.first_name,
        last_name: user.last_name,
      }))
    : [];

  // Fetch site list for site autocomplete (if present)
  useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const response = await fetcher(endpoints.site);
      return response.data.sites;
    },
  });

  // Fetch client list for client autocomplete (if present)
  useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await fetcher(endpoints.client);
      return response.data.clients;
    },
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ color: 'text.disabled', mb: 3 }}>
        Workers:
      </Typography>

      <Stack spacing={3}>
        {workerFields.map((item, index) => (
          <WorkerItem
            key={item.id}
            workerFieldNames={getWorkerFieldNames(index)}
            onRemoveWorkerItem={() => removeWorker(index)}
            employeeOptions={employeeOptions}
            position={getValues(`workers[${index}].position`)}
          />
        ))}
      </Stack>
      <Button
        size="small"
        color="primary"
        startIcon={<Iconify icon="mingcute:add-line" />}
        onClick={() => {
          const { start_date_time, end_date_time } = getValues();
          appendWorker({
            ...defaultWorker,
            id: '',
            start_time: start_date_time || null,
            end_time: end_date_time || null,
            status: 'draft',
          });
          setValue('status', 'draft');
        }}
        sx={{ mt: 2, flexShrink: 0 }}
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
              employee_id: '',
              first_name: '',
              last_name: '',
              photo_url: '',
              worker_index: null,
            },
          })
        }
        sx={{ mt: 2, flexShrink: 0 }}
      >
        Add Vehicle
      </Button>

      <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

      <Typography variant="h6" sx={{ color: 'text.disabled', mb: 3 }}>
        Equipments:
      </Typography>

      <Stack spacing={3}>
        {equipmentFields.map((item, index) => (
          <EquipmentItem
            key={item.id}
            fieldNames={getEquipmentFieldNames(index)}
            onRemoveEquipmentItem={() => removeEquipment(index)}
          />
        ))}
      </Stack>
      <Button
        size="small"
        color="primary"
        startIcon={<Iconify icon="mingcute:add-line" />}
        onClick={() => appendEquipment({ type: '', quantity: 1 })}
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
            <Iconify icon="solar:trash-bin-trash-bold" />
          </Button>
        </Box>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------

type WorkerItemProps = {
  onRemoveWorkerItem: () => void;
  workerFieldNames: Record<string, string>;
  employeeOptions: {
    label: string;
    value: string;
    role: string;
    photo_url: string;
    first_name: string;
    last_name: string;
  }[];
  position: string;
};

type VehicleItemProps = {
  onRemoveVehicleItem: () => void;
  fieldNames: {
    type: string;
    id: string;
    license_plate: string;
    unit_number: string;
    operator: string;
    operator_employee_id: string;
    operator_worker_index: string;
    operator_first_name: string;
    operator_last_name: string;
    operator_position: string;
    operator_photo_url: string;
  };
};

type EquipmentItemProps = {
  onRemoveEquipmentItem: () => void;
  fieldNames: {
    type: string;
    quantity: string;
  };
};

export function WorkerItem({
  onRemoveWorkerItem,
  workerFieldNames,
  employeeOptions,
  position,
}: WorkerItemProps) {
  const {
    getValues,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useFormContext();
  const theme = useTheme();
  const isXsSmMd = useMediaQuery(theme.breakpoints.down('md'));
  const workers = watch('workers') || [];
  const startDateTime = watch('start_date_time');
  const endDateTime = watch('end_date_time');

  // Find the index of this worker row
  const thisWorkerIndex = Number(workerFieldNames.id.match(/workers\[(\d+)\]\.id/)?.[1] ?? -1);
  // Collect all selected employee ids from other worker rows
  const pickedEmployeeIds = workers
    .map((w: any, idx: number) => (idx !== thisWorkerIndex ? w.id : null))
    .filter(Boolean);
  // Filter employees by role matching the selected position and not already picked
  const filteredOptions = position
    ? employeeOptions.filter((emp) => {
        if (!emp.role) return false;
        const roleMatch = emp.role
          .split('/')
          .map((r: string) => r.trim().toLowerCase())
          .includes(position.trim().toLowerCase());
        const alreadyPicked = pickedEmployeeIds.includes(emp.value);
        return roleMatch && !alreadyPicked;
      })
    : employeeOptions.filter((emp) => !pickedEmployeeIds.includes(emp.value));

  // Get error for this worker's id
  let employeeError = undefined;
  const match = workerFieldNames.id.match(/workers\[(\d+)\]\.id/);
  if (match) {
    const idx = Number(match[1]);
    const workerErrors = errors?.workers as unknown as any[];
    employeeError = workerErrors?.[idx]?.id?.message;
  }

  // Update worker times when job times change
  useEffect(() => {
    if (startDateTime || endDateTime) {
      const currentStartTime = getValues(workerFieldNames.start_time);
      const currentEndTime = getValues(workerFieldNames.end_time);

      // Only update if we have a time value
      if (currentStartTime && startDateTime) {
        const newStartTime = new Date(startDateTime);
        // Get hours and minutes from the current start time
        if (currentStartTime instanceof Date) {
          newStartTime.setHours(currentStartTime.getHours(), currentStartTime.getMinutes());
          setValue(workerFieldNames.start_time, newStartTime);
        }
      }

      if (currentEndTime && endDateTime) {
        const newEndTime = new Date(endDateTime);
        // Get hours and minutes from the current end time
        if (currentEndTime instanceof Date) {
          newEndTime.setHours(currentEndTime.getHours(), currentEndTime.getMinutes());
          setValue(workerFieldNames.end_time, newEndTime);
        }
      }
    }
  }, [
    startDateTime,
    endDateTime,
    workerFieldNames.start_time,
    workerFieldNames.end_time,
    getValues,
    setValue,
  ]);

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
        <Field.Select size="small" name={workerFieldNames.position} label="Position*">
          {JOB_POSITION_OPTIONS.map((item) => (
            <MenuItem key={item.value} value={item.value}>
              {item.label}
            </MenuItem>
          ))}
        </Field.Select>

        <Controller
          name={workerFieldNames.id}
          control={control}
          defaultValue=""
          render={({ field }) => (
            <Field.AutocompleteWithAvatar
              {...field}
              label={position ? 'Employee*' : 'Select position first'}
              placeholder={position ? 'Search an employee' : 'Select position first'}
              options={filteredOptions}
              disabled={!position}
              helperText={employeeError}
              fullWidth
              slotProps={{
                textfield: {
                  size: 'small',
                  fullWidth: true,
                },
              }}
              onChange={(_, value) => {
                const newValue = value as AutocompleteWithAvatarOption | null;
                if (newValue) {
                  field.onChange(newValue.value);
                  setValue(workerFieldNames.first_name, newValue.first_name);
                  setValue(workerFieldNames.last_name, newValue.last_name);
                  setValue(workerFieldNames.photo_url, newValue.photo_url);
                } else {
                  field.onChange('');
                  setValue(workerFieldNames.first_name, '');
                  setValue(workerFieldNames.last_name, '');
                  setValue(workerFieldNames.photo_url, '');
                }
              }}
            />
          )}
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
            onClick={onRemoveWorkerItem}
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
        >
          Remove
        </Button>
      )}
    </Box>
  );
}

export function VehicleItem({ onRemoveVehicleItem, fieldNames }: VehicleItemProps) {
  const {
    setValue,
    watch,
    control,
    formState: { errors },
  } = useFormContext();
  const theme = useTheme();
  const isXsSmMd = useMediaQuery(theme.breakpoints.down('md'));
  const workers = watch('workers') || [];
  const vehicleList = watch('vehicles') || [];

  // Get the current vehicle index and data
  const thisVehicleIndex = Number(
    fieldNames.operator.match(/vehicles\[(\d+)\]\.operator/)?.[1] ?? -1
  );
  const thisVehicle = vehicleList[thisVehicleIndex] as IJobVehicle;
  const selectedVehicleId = thisVehicle?.id;
  const selectedVehicleType = thisVehicle?.type;

  // Collect all selected operator worker references (employee_id + worker_index) from other vehicles
  const pickedOperators = vehicleList
    .map((v: any, idx: number) =>
      idx !== thisVehicleIndex && v.operator
        ? `${v.operator.employee_id}__${v.operator.worker_index}`
        : null
    )
    .filter(Boolean);
  const operatorOptions = workers
    .filter((w: any) => w && w.id && w.position && (w.first_name || w.last_name))
    .map((w: any, idx: number) => {
      const positionLabel =
        JOB_POSITION_OPTIONS.find((opt) => opt.value === w.position)?.label || w.position || '';
      return {
        label: `${w.first_name || ''} ${w.last_name || ''} (${positionLabel})`.trim(),
        value: `${w.id}__${idx}`,
        employee_id: w.id,
        first_name: w.first_name,
        last_name: w.last_name,
        position: w.position,
        positionLabel,
        photo_url: w.photo_url || '',
        workerIndex: idx,
      };
    })
    .filter((opt: { value: string }) => !pickedOperators.includes(opt.value));

  // Get the current operator value
  const currentOperator = watch(fieldNames.operator);
  const currentOperatorWorker = currentOperator?.employee_id
    ? workers.find((w: any) => w.id === currentOperator.employee_id)
    : null;

  // If we have a current operator but no photo_url, update it
  if (
    currentOperator?.employee_id &&
    !currentOperator.photo_url &&
    currentOperatorWorker?.photo_url
  ) {
    setValue(fieldNames.operator, {
      ...currentOperator,
      photo_url: currentOperatorWorker.photo_url,
    });
  }

  // Fetch vehicle options based on type and operator
  const { data: vehicleOptionsData, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ['vehicleOptions', selectedVehicleType, currentOperator?.employee_id],
    queryFn: async () => {
      // If we have an operator and vehicle type, get their assigned vehicles of that type
      if (currentOperator?.employee_id && selectedVehicleType) {
        const response = await fetcher(
          `${endpoints.vehicle}?status=active&operator_id=${currentOperator.employee_id}&type=${selectedVehicleType}`
        );
        return response.data;
      }
      // If no operator or type selected, return empty array
      return { vehicles: [] };
    },
    enabled: !!currentOperator?.employee_id && !!selectedVehicleType,
  });

  const vehicleOptions = useMemo(() => {
    const vehicles = vehicleOptionsData?.vehicles || [];

    const mappedVehicles = vehicles.map((vehicle: any) => ({
      ...vehicle,
      label: `${vehicle.license_plate} - ${vehicle.unit_number}`,
      value: vehicle.id,
    }));

    return { mappedVehicles, assignedVehicleIds: [] };
  }, [vehicleOptionsData]);

  // Find the current vehicle data
  const currentVehicle =
    vehicleOptions.mappedVehicles.find((v: any) => v.id === selectedVehicleId) || null;

  // Get helper text based on current state
  const getVehicleHelperText = () => {
    const vehicleErrors = errors.vehicles as any;
    const vehicleError = vehicleErrors?.[thisVehicleIndex];
    if (vehicleError?.id?.message) {
      return vehicleError.id.message;
    }
    return '';
  };

  // Vehicle number field logic
  const vehicleNumberField = (
    <Autocomplete
      fullWidth
      disablePortal
      id={`vehicle-number-${thisVehicleIndex}`}
      size="small"
      disabled={!selectedVehicleType || !currentOperator?.employee_id || isLoadingVehicles}
      options={vehicleOptions.mappedVehicles}
      value={currentVehicle}
      loading={isLoadingVehicles}
      onChange={(event, newValue) => {
        if (newValue) {
          setValue(`vehicles[${thisVehicleIndex}].id`, newValue.id);
          setValue(`vehicles[${thisVehicleIndex}].license_plate`, newValue.license_plate);
          setValue(`vehicles[${thisVehicleIndex}].unit_number`, newValue.unit_number);
        } else {
          setValue(`vehicles[${thisVehicleIndex}].id`, '');
          setValue(`vehicles[${thisVehicleIndex}].license_plate`, '');
          setValue(`vehicles[${thisVehicleIndex}].unit_number`, '');
        }
      }}
      getOptionLabel={(option) => {
        if (!option) return '';
        return option.label || `${option.license_plate} - ${option.unit_number}`;
      }}
      isOptionEqualToValue={(option, value) => option?.id === value?.id}
      renderInput={(params) => {
        const vehicleErrors = errors.vehicles as any;
        const vehicleError = vehicleErrors?.[thisVehicleIndex];
        const label = !currentOperator?.employee_id
          ? 'Select operator first'
          : !selectedVehicleType
            ? 'Select vehicle type first'
            : 'Vehicle*';
        const placeholder = !currentOperator?.employee_id
          ? 'Select operator first'
          : !selectedVehicleType
            ? 'Select vehicle type first'
            : isLoadingVehicles
              ? 'Loading vehicles...'
              : 'Select vehicle';

        return (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            error={!!vehicleError?.id}
            helperText={getVehicleHelperText()}
            disabled={!selectedVehicleType || !currentOperator?.employee_id || isLoadingVehicles}
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
        );
      }}
    />
  );

  // Get error for this vehicle's operator.employee_id
  let operatorError = undefined;
  const matchOp = fieldNames.operator.match(/vehicles\[(\d+)\]\.operator/);
  if (matchOp) {
    const idx = Number(matchOp[1]);
    const vehicleErrors = errors?.vehicles as unknown as any[];
    operatorError = vehicleErrors?.[idx]?.operator?.employee_id?.message;
  }

  const colorByName = (name?: string) => {
    const charAt = name?.charAt(0).toLowerCase();

    if (['a', 'c', 'f'].includes(charAt!)) return 'primary';
    if (['e', 'd', 'h'].includes(charAt!)) return 'secondary';
    if (['i', 'k', 'l'].includes(charAt!)) return 'info';
    if (['m', 'n', 'p'].includes(charAt!)) return 'success';
    if (['q', 's', 't'].includes(charAt!)) return 'warning';
    if (['v', 'x', 'y'].includes(charAt!)) return 'error';

    return 'default';
  };

  const getAvatarColor = (option: any) => {
    const displayName = option.first_name || option.last_name || '';
    return colorByName(displayName);
  };

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
        <Controller
          name={fieldNames.operator}
          control={control}
          defaultValue={{
            employee_id: '',
            worker_index: null,
            first_name: '',
            last_name: '',
            position: '',
            photo_url: '',
          }}
          render={({ field }) => {
            const selectedOperator =
              operatorOptions.find(
                (opt: any) =>
                  opt.employee_id === field.value?.employee_id &&
                  opt.workerIndex === field.value?.worker_index
              ) || null;
            return (
              <Autocomplete
                size="small"
                {...field}
                fullWidth
                options={operatorOptions}
                getOptionLabel={(option) =>
                  option?.label ||
                  [option?.first_name, option?.last_name].filter(Boolean).join(' ') ||
                  ''
                }
                isOptionEqualToValue={(option, value) => option.value === value.value}
                value={selectedOperator}
                onChange={(_, newValue) => {
                  if (newValue) {
                    const selectedWorker = workers[newValue.workerIndex];
                    setValue(fieldNames.operator, {
                      employee_id: newValue.employee_id,
                      worker_index: newValue.workerIndex,
                      first_name: newValue.first_name,
                      last_name: newValue.last_name,
                      position: newValue.position,
                      photo_url: selectedWorker?.photo_url || newValue.photo_url || '',
                    });
                    // Reset vehicle type and vehicle when operator changes
                    setValue(fieldNames.type, '');
                    setValue(fieldNames.id, '');
                    setValue(fieldNames.license_plate, '');
                    setValue(fieldNames.unit_number, '');
                  } else {
                    setValue(fieldNames.operator, {
                      employee_id: '',
                      worker_index: null,
                      first_name: '',
                      last_name: '',
                      position: '',
                      photo_url: '',
                    });
                    // Reset vehicle type and vehicle when operator is cleared
                    setValue(fieldNames.type, '');
                    setValue(fieldNames.id, '');
                    setValue(fieldNames.license_plate, '');
                    setValue(fieldNames.unit_number, '');
                  }
                }}
                renderOption={(props, option) => {
                  const { key, ...rest } = props;
                  const fallbackLetter =
                    option.first_name?.charAt(0).toUpperCase() ||
                    option.last_name?.charAt(0).toUpperCase() ||
                    '?';
                  return (
                    <li key={key} {...rest} style={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        src={option.photo_url || ''}
                        sx={{ width: 28, height: 28, mr: 1 }}
                        color={getAvatarColor(option)}
                      >
                        {!option.photo_url && fallbackLetter}
                      </Avatar>
                      {option.label}
                    </li>
                  );
                }}
                renderInput={(params: any) => {
                  const selected = operatorOptions.find(
                    (opt: any) =>
                      opt.employee_id === watch(fieldNames.operator)?.employee_id &&
                      opt.workerIndex === watch(fieldNames.operator)?.worker_index
                  );
                  const fallbackLetter =
                    selected?.first_name?.charAt(0).toUpperCase() ||
                    selected?.last_name?.charAt(0).toUpperCase() ||
                    '?';
                  return (
                    <TextField
                      {...params}
                      label="Operator*"
                      placeholder="Search an operator"
                      error={!!operatorError}
                      helperText={operatorError}
                      FormHelperTextProps={{ sx: { minHeight: 24 } }}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: selected ? (
                          <Avatar
                            src={selected.photo_url || ''}
                            sx={{ width: 28, height: 28 }}
                            color={getAvatarColor(selected)}
                          >
                            {!selected.photo_url && fallbackLetter}
                          </Avatar>
                        ) : null,
                      }}
                    />
                  );
                }}
              />
            );
          }}
        />

        <Controller
          name={fieldNames.type}
          control={control}
          render={({ field }) => (
            <Field.Select
              {...field}
              size="small"
              label={currentOperator?.employee_id ? 'Vehicle Type*' : 'Select operator first'}
              FormHelperTextProps={{ sx: { minHeight: 24 } }}
              disabled={!currentOperator?.employee_id}
              onChange={(event) => {
                field.onChange(event); // Update the form value
                // Reset vehicle when type changes
                setValue(fieldNames.id, '');
                setValue(fieldNames.license_plate, '');
                setValue(fieldNames.unit_number, '');
              }}
            >
              {JOB_VEHICLE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Field.Select>
          )}
        />

        {vehicleNumberField}

        {!isXsSmMd && (
          <Button
            size="small"
            color="error"
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            onClick={onRemoveVehicleItem}
            sx={{ px: 4, mt: 1 }}
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
          onClick={onRemoveVehicleItem}
        >
          Remove
        </Button>
      )}
    </Box>
  );
}

export function EquipmentItem({ onRemoveEquipmentItem, fieldNames }: EquipmentItemProps) {
  const { watch } = useFormContext();
  const theme = useTheme();
  const isXsSmMd = useMediaQuery(theme.breakpoints.down('md'));
  const selectedEquipmentType = watch(fieldNames.type);

  const quantityDisabled = !selectedEquipmentType;
  const quantityPlaceholder = quantityDisabled ? 'Select equipment first' : '0';

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
          name={fieldNames.type}
          label="Equipment Type*"
          FormHelperTextProps={{ sx: { minHeight: 24 } }}
        >
          {JOB_EQUIPMENT_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field.Select>

        <Field.Text
          size="small"
          fullWidth
          type="number"
          name={fieldNames.quantity}
          label="Quantity*"
          placeholder={quantityPlaceholder}
          disabled={quantityDisabled}
          FormHelperTextProps={{ sx: { minHeight: 24 } }}
        />

        {!isXsSmMd && (
          <Button
            size="small"
            color="error"
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            onClick={onRemoveEquipmentItem}
            sx={{ px: 4, mt: 1 }}
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
