import type { IUser } from 'src/types/user';
import type { IVehicleItem } from 'src/types/vehicle';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { emptyToNull, capitalizeWords } from 'src/utils/foramt-word';

import { fetcher, endpoints } from 'src/lib/axios';
import { regionList, VEHICLE_TYPE_OPTIONS, VEHICLE_STATUS_OPTIONS } from 'src/assets/data';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

// Function to check if a certification is valid (not expired)
const isCertificationValid = (expiryDate: string | null | undefined): boolean => {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiry >= today;
};

// Function to check if a certification expires within 30 days and return days remaining
const getCertificationExpiringSoon = (
  expiryDate: string | null | undefined
): { isExpiringSoon: boolean; daysRemaining: number } => {
  if (!expiryDate) return { isExpiringSoon: false, daysRemaining: 0 };
  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  const timeDiff = expiry.getTime() - today.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

  return {
    isExpiringSoon: daysRemaining >= 0 && daysRemaining <= 30,
    daysRemaining,
  };
};

// Function to check driver license status
const checkDriverLicenseStatus = (
  user: IUser
): {
  isValid: boolean;
  isExpiringSoon: boolean;
  daysRemaining: number;
  hasLicense: boolean;
} => {
  if (!user.driver_license_expiry) {
    return { isValid: false, isExpiringSoon: false, daysRemaining: 0, hasLicense: false };
  }

  const isValid = isCertificationValid(user.driver_license_expiry);
  const expiringInfo = getCertificationExpiringSoon(user.driver_license_expiry);

  return {
    isValid,
    isExpiringSoon: expiringInfo.isExpiringSoon,
    daysRemaining: expiringInfo.daysRemaining,
    hasLicense: true,
  };
};

export type VehicleProfileSchemaType = zod.infer<typeof VehicleProfileSchema>;

export const VehicleProfileSchema = zod.object({
  region: zod.string().min(1, { message: 'Region is required!' }),
  type: zod.string().min(1, { message: 'Vehicle Type is required!' }),
  license_plate: zod.string().min(1, { message: 'License Plate is required!' }),
  unit_number: zod.string().min(1, { message: 'Unit Number is required!' }),
  assigned_driver: zod.string().optional(),
  info: zod.string().optional(),
  year: zod.preprocess((val) => (val === '' ? null : val), zod.number().nullable().optional()),
  location: zod.string().optional(),
  is_spare_key: zod.boolean().optional(),
  is_winter_tire: zod.boolean().optional(),
  is_tow_hitch: zod.boolean().optional(),
  note: zod.string().optional(),
  status: zod.string().optional(),
});

// ----------------------------------------------------------------------

type Props = {
  currentData: IVehicleItem;
};

type EmployeeOption = {
  label: string;
  value: string;
  photo_url: string | null;
  first_name: string;
  last_name: string;
  licenseStatus: {
    isValid: boolean;
    isExpiringSoon: boolean;
    daysRemaining: number;
    hasLicense: boolean;
  };
};

export function VehicleProfileForm({ currentData }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirmDialog = useBoolean();
  const warningDialog = useBoolean();
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedEmployeeWithoutLicense, setSelectedEmployeeWithoutLicense] =
    useState<EmployeeOption | null>(null);
  const [lastWarnedEmployeeId, setLastWarnedEmployeeId] = useState<string | null>(null);

  const defaultValues: VehicleProfileSchemaType = {
    region: '',
    type: '',
    license_plate: '',
    unit_number: '',
    assigned_driver: '',
    info: '',
    year: null,
    location: '',
    is_spare_key: false,
    is_winter_tire: false,
    is_tow_hitch: false,
    note: '',
    status: '',
  };

  const methods = useForm<VehicleProfileSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(VehicleProfileSchema),
    values: currentData
      ? {
          ...currentData,
          assigned_driver: currentData.assigned_driver?.id || '',
          is_spare_key: currentData.is_spare_key ?? false,
          is_winter_tire: currentData.is_winter_tire ?? false,
          is_tow_hitch: currentData.is_tow_hitch ?? false,
        }
      : defaultValues,
  });

  const {
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting },
  } = methods;

  // Reset form when currentData changes
  useEffect(() => {
    if (currentData) {
      reset({
        ...currentData,
        assigned_driver: currentData.assigned_driver?.id || '',
        is_spare_key: currentData.is_spare_key ?? false,
        is_winter_tire: currentData.is_winter_tire ?? false,
        is_tow_hitch: currentData.is_tow_hitch ?? false,
      });
    }
  }, [currentData, reset]);

  // Fetch user list for employee autocomplete
  const { data: userList } = useQuery({
    queryKey: ['users', 'job-creation', 'vehicle-edit'],
    queryFn: async () => {
      try {
        const response = await fetcher(`${endpoints.management.user}/job-creation`);

        if (!response) {
          throw new Error('No response received');
        }

        if (!response.data?.users) {
          throw new Error('No users in response');
        }

        return response.data.users;
      } catch (error) {
        console.error('❌ Error fetching users:', error);
        throw error;
      }
    },
    enabled: true,
    staleTime: 0,
    gcTime: 0,
    retry: 3,
  });

  const employeeOptions = useMemo(() => {
    if (!userList) {
      return [];
    }
    if (userList.length === 0) {
      return [];
    }

    const options = userList.map((user: IUser) => {
      const licenseStatus = checkDriverLicenseStatus(user);
      return {
        label: `${user.first_name} ${user.last_name}`,
        value: user.id,
        photo_url: user.photo_url,
        first_name: user.first_name,
        last_name: user.last_name,
        licenseStatus,
      };
    });

    return options;
  }, [userList]);

  // Watch for assigned driver changes and show confirmation if needed
  const assignedDriverId = watch('assigned_driver');
  const [lastSelectedDriverId, setLastSelectedDriverId] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Set initial driver ID when form loads
  useEffect(() => {
    if (isInitialLoad && assignedDriverId) {
      setLastSelectedDriverId(assignedDriverId);
      setIsInitialLoad(false);
    } else if (isInitialLoad && !assignedDriverId) {
      setIsInitialLoad(false);
    }
  }, [assignedDriverId, isInitialLoad]);

  useEffect(() => {
    if (isInitialLoad) {
      return;
    }

    if (assignedDriverId && assignedDriverId !== lastSelectedDriverId) {
      const selectedEmployee = employeeOptions.find(
        (option: EmployeeOption) => option.value === assignedDriverId
      );
      if (
        selectedEmployee &&
        !selectedEmployee.licenseStatus.hasLicense &&
        selectedEmployee.value !== lastWarnedEmployeeId
      ) {
        setSelectedEmployeeWithoutLicense(selectedEmployee);
        setLastWarnedEmployeeId(selectedEmployee.value);
        warningDialog.onTrue();
      }
      setLastSelectedDriverId(assignedDriverId);
    }
  }, [
    assignedDriverId,
    employeeOptions,
    methods,
    warningDialog,
    lastWarnedEmployeeId,
    isInitialLoad,
    lastSelectedDriverId,
  ]);

  const onSubmit = handleSubmit(async (data) => {
    const toastId = toast.loading('Updating...');

    try {
      const formattedData = {
        ...data,
        region: capitalizeWords(data.region),
        license_plate: emptyToNull(data.license_plate.toUpperCase()),
        unit_number: emptyToNull(capitalizeWords(data.unit_number)),
        assigned_driver: emptyToNull(data.assigned_driver),
        year: data.year,
      };

      await fetcher([
        `${endpoints.management.vehicle}/${currentData.id}`,
        {
          method: 'PUT',
          data: formattedData,
        },
      ]);

      toast.dismiss(toastId);
      toast.success('Update success!');

      queryClient.invalidateQueries({ queryKey: ['vehicle', currentData.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    } catch (error) {
      toast.dismiss(toastId);
      console.error(error);
      toast.error('Failed to update vehicle. Please try again.');
    }
  });

  const onDelete = async () => {
    setIsDeleting(true);
    const toastId = toast.loading('Deleting vehicle...');
    try {
      await fetcher([`${endpoints.management.vehicle}/${currentData.id}`, { method: 'DELETE' }]);

      toast.dismiss(toastId);
      toast.success('Delete success!');

      queryClient.invalidateQueries({ queryKey: ['vehicle', currentData.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });

      router.push(paths.management.vehicle.list);
    } catch (error) {
      toast.dismiss(toastId);
      console.error(error);
      toast.error('Failed to delete the vehicle.');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderConfirmDialog = (
    <Dialog open={confirmDialog.value} onClose={confirmDialog.onFalse} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Vehicle</DialogTitle>
      <DialogContent>
        Are you sure you want to delete <strong>{currentData?.license_plate}</strong>?
      </DialogContent>
      <DialogActions>
        <Button onClick={confirmDialog.onFalse} disabled={isDeleting} sx={{ mr: 1 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onDelete}
          disabled={isDeleting}
          startIcon={isDeleting ? <CircularProgress size={16} /> : null}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3 }}>
        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
          }}
        >
          <Field.Select name="status" label="Status">
            {VEHICLE_STATUS_OPTIONS.map((status) => (
              <MenuItem key={status.value} value={status.value}>
                {status.label}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Select name="region" label="Region*">
            {regionList.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Select name="type" label="Vehicle Type*">
            {VEHICLE_TYPE_OPTIONS.map((status) => (
              <MenuItem key={status.value} value={status.value}>
                {status.label}
              </MenuItem>
            ))}
          </Field.Select>
          <Field.Text name="license_plate" label="License Plate*" />
          <Field.Text name="unit_number" label="Unit Number*" />
          <Field.AutocompleteWithLicenseStatus
            name="assigned_driver"
            label="Assigned Driver"
            placeholder="Select a driver"
            options={employeeOptions}
          />
          <Field.Text name="info" label="Vehicle Info" />
          <Field.Text name="year" label="Vehicle Year" type="number" />
          <Field.Text name="location" label="Location" />
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: { xs: 'center', sm: 'flex-start' },
            }}
          >
            <Field.Switch
              name="is_spare_key"
              labelPlacement="start"
              label={<Typography variant="subtitle2">Spare Key</Typography>}
              sx={{ mx: 0, width: 1, justifyContent: 'space-between' }}
            />
            <Field.Switch
              name="is_winter_tire"
              labelPlacement="start"
              label={<Typography variant="subtitle2">Winter Tire</Typography>}
              sx={{ mx: 0, width: 1, justifyContent: 'space-between' }}
            />
            <Field.Switch
              name="is_tow_hitch"
              labelPlacement="start"
              label={<Typography variant="subtitle2">Tow Hitch</Typography>}
              sx={{ mx: 0, width: 1, justifyContent: 'space-between' }}
            />
          </Box>
          <Field.Text name="note" label="Note" multiline rows={4} />
        </Box>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mt: 3 }}
        >
          <Button variant="soft" color="error" onClick={confirmDialog.onTrue}>
            Delete
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            Save changes
          </Button>
        </Stack>
      </Card>

      {renderConfirmDialog}

      {/* Confirmation Dialog for Employee without License */}
      <Dialog
        open={warningDialog.value}
        onClose={() => {
          warningDialog.onFalse();
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Driver License Warning</DialogTitle>
        <DialogContent>
          <Typography>
            <strong>
              {selectedEmployeeWithoutLicense?.first_name}{' '}
              {selectedEmployeeWithoutLicense?.last_name}
            </strong>{' '}
            does not have a valid driver license.
          </Typography>
          <Typography sx={{ mt: 1, color: 'text.secondary' }}>
            Are you sure you want to assign this employee to the vehicle?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              methods.setValue('assigned_driver', '');
              warningDialog.onFalse();
            }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              warningDialog.onFalse();
            }}
            variant="contained"
            color="warning"
          >
            Assign Anyway
          </Button>
        </DialogActions>
      </Dialog>
    </Form>
  );
}

