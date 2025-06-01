import type { IUser } from 'src/types/user';
import type { IJobWorker, IJobVehicle, IJobEquipment } from 'src/types/job';

import { useQuery } from '@tanstack/react-query';
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

import { fetcher, endpoints } from 'src/lib/axios';
import {
  JOB_VEHICLE_OPTIONS,
  JOB_POSITION_OPTIONS,
  JOB_EQUIPMENT_OPTIONS,
} from 'src/assets/data/job';

import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export const defaultVehicle: Omit<IJobVehicle, 'id'> = {
  type: '',
  number: '',
  operator: '',
};

export const defaultWorker: Omit<IJobWorker, 'id'> = {
  position: '',
  employee: '',
  first_name: '',
  last_name: '',
  start_time: '',
  end_time: '',
  photo_url: '',
};

export const defaultEquipment: Omit<IJobEquipment, 'id'> = {
  type: '',
  name: '',
  operator: '',
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
  number: `vehicles[${index}].number`,
  operator: `vehicles[${index}].operator`,
});

const getEquipmentFieldNames = (index: number) => ({
  type: `equipment[${index}].type`,
  name: `equipment[${index}].name`,
  quantity: `equipment[${index}].quantity`,
});

export function JobNewEditDetails() {
  const { control, getValues } = useFormContext();

  const {
    fields: vehicleFields,
    append: appendVehicle,
    remove: removeVehicle,
  } = useFieldArray({ control, name: 'vehicles' });
  const {
    fields: equipmentFields,
    append: appendEquipment,
    remove: removeEquipment,
  } = useFieldArray({ control, name: 'equipment' });
  const {
    fields: workerFields,
    append: appendWorker,
    remove: removeWorker,
  } = useFieldArray({ control, name: 'workers' });

  // Fetch user list for employee autocomplete
  const { data: userList } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: async () => {
      const data = await fetcher(`${endpoints.user}?status=active`);
      return data.users;
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
  const { data: siteList } = useQuery({
    queryKey: ['sites', 'active'],
    queryFn: async () => {
      const data = await fetcher(`${endpoints.site}?status=active`);
      return data.sites;
    },
  });

  // Fetch client list for client autocomplete (if present)
  const { data: clientList } = useQuery({
    queryKey: ['clients', 'active'],
    queryFn: async () => {
      const data = await fetcher(`${endpoints.client}?status=active`);
      return data.clients;
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
          const { start_time, end_time } = getValues();
          appendWorker({
            ...defaultWorker,
            id: '',
            start_time: start_time || '',
            end_time: end_time || '',
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
            number: '',
            operator: { employee_id: '', first_name: '', last_name: '' },
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
        onClick={() => appendEquipment({ type: '', name: '', quantity: 1 })}
        sx={{ mt: 2, flexShrink: 0 }}
      >
        Add Equipment
      </Button>

      <Divider sx={{ my: 3, borderStyle: 'dashed' }} />
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
    number: string;
    operator: string;
  };
};

type EquipmentItemProps = {
  onRemoveEquipmentItem: () => void;
  fieldNames: {
    type: string;
    name: string;
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
    formState: { errors },
  } = useFormContext();
  const theme = useTheme();
  const isXsSmMd = useMediaQuery(theme.breakpoints.down('md'));
  const workers = watch('workers') || [];
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

        <Autocomplete
          size="small"
          fullWidth
          options={filteredOptions}
          value={
            filteredOptions.find((opt) => opt.value === getValues(workerFieldNames.id)) || null
          }
          onChange={(_, newValue) => {
            setValue(workerFieldNames.id, newValue ? newValue.value : '');
            setValue(workerFieldNames.first_name, newValue ? newValue.first_name : '');
            setValue(workerFieldNames.last_name, newValue ? newValue.last_name : '');
            setValue(workerFieldNames.photo_url, newValue ? newValue.photo_url : '');
          }}
          getOptionLabel={(option) =>
            option?.label || [option?.first_name, option?.last_name].filter(Boolean).join(' ') || ''
          }
          isOptionEqualToValue={(option, value) => option.value === value.value}
          renderOption={(props, option) => {
            const { key, ...rest } = props;
            const fallbackLetter =
              option.first_name?.charAt(0).toUpperCase() ||
              option.last_name?.charAt(0).toUpperCase() ||
              '?';
            return (
              <li key={key} {...rest} style={{ display: 'flex', alignItems: 'center' }}>
                <Avatar src={option.photo_url} sx={{ width: 28, height: 28, mr: 1 }}>
                  {!option.photo_url && fallbackLetter}
                </Avatar>
                {option.label}
              </li>
            );
          }}
          renderInput={(params) => {
            // Find the selected option
            const selected = filteredOptions.find(
              (opt) => opt.value === getValues(workerFieldNames.id)
            );
            const fallbackLetter =
              selected?.first_name?.charAt(0).toUpperCase() ||
              selected?.last_name?.charAt(0).toUpperCase() ||
              '?';
            return (
              <TextField
                {...params}
                label={position ? 'Employee*' : 'Select position first'}
                placeholder={position ? 'Search an employee' : 'Select position first'}
                error={!!employeeError}
                helperText={employeeError}
                FormHelperTextProps={{ sx: { minHeight: 24 } }}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: selected ? (
                    <Avatar src={selected.photo_url} sx={{ width: 28, height: 28, mx: 1 }}>
                      {!selected.photo_url && fallbackLetter}
                    </Avatar>
                  ) : null,
                }}
              />
            );
          }}
          disabled={!position}
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
  const vehicles = watch('vehicles') || [];
  // Find the index of this vehicle row
  const thisVehicleIndex = Number(
    fieldNames.operator.match(/vehicles\[(\d+)\]\.operator/)?.[1] ?? -1
  );
  // Collect all selected operator worker references (employee_id + worker_index) from other vehicles
  const pickedOperators = vehicles
    .map((v: any, idx: number) =>
      idx !== thisVehicleIndex && v.operator
        ? `${v.operator.employee_id}__${v.operator.worker_index}`
        : null
    )
    .filter(Boolean);
  const operatorOptions = workers
    .filter((w: any) => w && w.id && (w.first_name || w.last_name))
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
        photo_url: w.photo_url,
        workerIndex: idx,
      };
    })
    .filter((opt: { value: string }) => !pickedOperators.includes(opt.value));

  // Vehicle Number field logic
  const selectedVehicleType = watch(fieldNames.type);
  const selectedVehicleNumber = watch(fieldNames.number);
  const vehicleNumberDisabled = !selectedVehicleType;
  const vehicleNumberPlaceholder = vehicleNumberDisabled
    ? 'Select vehicle type first'
    : 'Search a asset';
  const vehicleNumberLabel = vehicleNumberDisabled ? 'Select vehicle type' : 'Vehicle Number*';

  // Placeholder vehicle number options
  const vehicleNumberOptions = [
    { value: 'rd211k', label: 'RD211K' },
    { value: 'tf322k_unit_107', label: 'TF322K Unit 107' },
  ];

  // Improved operator disabled state and placeholder/label
  let operatorDisabled = false;
  let operatorPlaceholder = 'Search an operator';
  let operatorLabel = 'Operator*';
  if (!workers.length) {
    operatorDisabled = true;
    operatorPlaceholder = 'Add workers first';
    operatorLabel = 'Add workers first';
  } else if (!operatorOptions.length) {
    operatorDisabled = true;
    operatorPlaceholder = 'Select an employee for a worker first';
    operatorLabel = 'Add workers first';
  } else if (!selectedVehicleType) {
    operatorDisabled = true;
    operatorPlaceholder = 'Select vehicle first';
    operatorLabel = 'Select vehicle first';
  } else if (!selectedVehicleNumber) {
    operatorDisabled = true;
    operatorPlaceholder = 'Select vehicle number';
    operatorLabel = 'Select vehicle number';
  }

  // Get error for this vehicle's operator.employee_id
  let operatorError = undefined;
  const matchOp = fieldNames.operator.match(/vehicles\[(\d+)\]\.operator/);
  if (matchOp) {
    const idx = Number(matchOp[1]);
    const vehicleErrors = errors?.vehicles as unknown as any[];
    operatorError = vehicleErrors?.[idx]?.operator?.employee_id?.message;
  }
  // Get error for this vehicle's number (vehicle number)
  let vehicleNumberError = undefined;
  const matchNumber = fieldNames.number.match(/vehicles\[(\d+)\]\.number/);
  if (matchNumber) {
    const idx = Number(matchNumber[1]);
    const vehicleErrors = errors?.vehicles as unknown as any[];
    vehicleNumberError = vehicleErrors?.[idx]?.number?.message;
  }

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
          label="Vehicle Type*"
          FormHelperTextProps={{ sx: { minHeight: 24 } }}
        >
          {JOB_VEHICLE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field.Select>

        <Autocomplete
          size="small"
          fullWidth
          options={vehicleNumberOptions}
          getOptionLabel={(option) => option.label || ''}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          value={vehicleNumberOptions.find((opt) => opt.value === selectedVehicleNumber) || null}
          onChange={(_, newValue) => setValue(fieldNames.number, newValue ? newValue.value : '')}
          disabled={vehicleNumberDisabled}
          renderInput={(params) => (
            <TextField
              {...params}
              label={vehicleNumberLabel}
              placeholder={vehicleNumberPlaceholder}
              error={!!vehicleNumberError}
              helperText={vehicleNumberError}
              FormHelperTextProps={{ sx: { minHeight: 24 } }}
            />
          )}
        />

        <Controller
          name={fieldNames.operator}
          control={control}
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
                    setValue(fieldNames.operator, {
                      employee_id: newValue.employee_id,
                      worker_index: newValue.workerIndex,
                      first_name: newValue.first_name,
                      last_name: newValue.last_name,
                      position: newValue.position,
                    });
                  } else {
                    setValue(fieldNames.operator, {
                      employee_id: '',
                      worker_index: null,
                      first_name: '',
                      last_name: '',
                      position: '',
                    });
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
                      <Avatar src={option.photo_url} sx={{ width: 28, height: 28, mr: 1 }}>
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
                      label={operatorLabel}
                      placeholder={operatorPlaceholder}
                      error={!!operatorError}
                      helperText={operatorError}
                      FormHelperTextProps={{ sx: { minHeight: 24 } }}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: selected ? (
                          <Avatar src={selected.photo_url} sx={{ width: 28, height: 28, mx: 1 }}>
                            {!selected.photo_url && fallbackLetter}
                          </Avatar>
                        ) : null,
                      }}
                    />
                  );
                }}
                disabled={operatorDisabled}
              />
            );
          }}
        />

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
  const { watch, setValue } = useFormContext();
  const theme = useTheme();
  const isXsSmMd = useMediaQuery(theme.breakpoints.down('md'));
  const selectedEquipmentType = watch(fieldNames.type);
  const selectedEquipmentName = watch(fieldNames.name);

  // Placeholder equipment name options
  const equipmentNameOptions = [
    { value: 'arrowboard_trailer', label: 'Arrowboard Trailer' },
    { value: 'mobilization', label: 'Mobilization' },
  ];

  // Equipment Name field logic
  const equipmentNameDisabled = !selectedEquipmentType;
  const equipmentNamePlaceholder = equipmentNameDisabled
    ? 'Select equipment type first'
    : 'Search a asset';
  const equipmentNameLabel = equipmentNameDisabled ? 'Select equipment type' : 'Equipment Name*';

  // Quantity field logic
  const quantityDisabled = !selectedEquipmentName;
  const quantityPlaceholder = quantityDisabled ? 'Select equipment first' : '0';
  // const"Quantity*"= quantityDisabled ? 'Select equipment first' : 'Quantity*';

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

        <Autocomplete
          size="small"
          fullWidth
          options={equipmentNameOptions}
          getOptionLabel={(option) => option.label || ''}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          value={equipmentNameOptions.find((opt) => opt.value === selectedEquipmentName) || null}
          onChange={(_, newValue) => setValue(fieldNames.name, newValue ? newValue.value : '')}
          disabled={equipmentNameDisabled}
          renderInput={(params) => (
            <TextField
              {...params}
              label={equipmentNameLabel}
              placeholder={equipmentNamePlaceholder}
              FormHelperTextProps={{ sx: { minHeight: 24 } }}
            />
          )}
        />

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
