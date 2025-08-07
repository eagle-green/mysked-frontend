import type { IUser } from 'src/types/user';
import type { IVehicleItem } from 'src/types/vehicle';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { emptyToNull, capitalizeWords } from 'src/utils/foramt-word';

import { fetcher, endpoints } from 'src/lib/axios';
import { regionList, SITE_STATUS_OPTIONS, VEHICLE_TYPE_OPTIONS } from 'src/assets/data';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

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

// Function to check driver license status
const checkDriverLicenseStatus = (user: IUser): { 
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

export type VehicleQuickEditSchemaType = zod.infer<typeof VehicleQuickEditSchema>;

export const VehicleQuickEditSchema = zod.object({
  region: zod.string().min(1, { message: 'Region is required!' }),
  type: zod.string().min(1, { message: 'Vehicle Type is required!' }),
  license_plate: zod.string().min(1, { message: 'License Plate is required!' }),
  unit_number: zod.string().min(1, { message: 'Unit Number is required!' }),
  // Optional fields
  assigned_driver: zod.string().optional(),
  info: zod.string().optional(),
  year: zod.preprocess(
    (val) => (val === '' ? null : val),
    zod.number().nullable().optional()
  ),
  location: zod.string().optional(),
  is_spare_key: zod.boolean().optional(),
  is_winter_tire: zod.boolean().optional(),
  is_tow_hitch: zod.boolean().optional(),
  note: zod.string().optional(),
  status: zod.string().optional(),
});

// ----------------------------------------------------------------------

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

type Props = {
  open: boolean;
  onClose: () => void;
  currentData?: IVehicleItem;
  onUpdateSuccess: () => void;
};

export function VehicleQuickEditForm({ currentData, open, onClose, onUpdateSuccess }: Props) {
  const queryClient = useQueryClient();
  const warningDialog = useBoolean();
  const [selectedEmployeeWithoutLicense, setSelectedEmployeeWithoutLicense] = useState<EmployeeOption | null>(null);
  const [lastWarnedEmployeeId, setLastWarnedEmployeeId] = useState<string | null>(null);

  // Fetch user list for employee autocomplete
  const { data: userList } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.management.user}?status=active`);
      return response.data.users;
    },
  });

  const employeeOptions = useMemo(() => userList
      ? userList.map((user: IUser) => {
          const licenseStatus = checkDriverLicenseStatus(user);
          return {
            label: `${user.first_name} ${user.last_name}`,
            value: user.id,
            photo_url: user.photo_url,
            first_name: user.first_name,
            last_name: user.last_name,
            licenseStatus,
          };
        })
      : [], [userList]);

  const updateVehicleMutation = useMutation({
    mutationFn: async (updatedData: VehicleQuickEditSchemaType) =>
      await fetcher([
        `${endpoints.management.vehicle}/${currentData!.id}`,
        {
          method: 'PUT',
          data: {
            ...updatedData,
            region: emptyToNull(capitalizeWords(updatedData.region)),
            license_plate: emptyToNull(updatedData.license_plate.toUpperCase()),
            unit_number: emptyToNull(capitalizeWords(updatedData.unit_number)),
          },
        },
      ]),
    onSuccess: () => {
      toast.success('Vehicle updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      onUpdateSuccess();
    },
    onError: () => {
      toast.error('Failed to update site.');
    },
  });

  const defaultValues: VehicleQuickEditSchemaType = {
    region: '',
    type: '',
    license_plate: '',
    unit_number: '',
    assigned_driver: '',
    info: '',
    year: undefined,
    location: '',
    is_spare_key: false,
    is_winter_tire: false,
    is_tow_hitch: false,
    note: '',
    status: '',
  };

  const methods = useForm<VehicleQuickEditSchemaType>({
    mode: 'all',
    resolver: zodResolver(VehicleQuickEditSchema),
    defaultValues,
    values: currentData
      ? {
          ...currentData,
          assigned_driver: currentData.assigned_driver?.id || '',
          info: currentData.info || '',
          year: currentData.year,
          location: currentData.location || '',
          is_spare_key: currentData.is_spare_key ?? false,
          is_winter_tire: currentData.is_winter_tire ?? false,
          is_tow_hitch: currentData.is_tow_hitch ?? false,
          note: currentData.note || '',
          status: currentData.status || '',
        }
      : defaultValues,
  });

  const {
    reset,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = methods;

  // Watch for assigned driver changes and show confirmation if needed
  const assignedDriverId = watch('assigned_driver');
  
  useEffect(() => {
    if (assignedDriverId) {
      const selectedEmployee = employeeOptions.find((option: EmployeeOption) => option.value === assignedDriverId);
      if (selectedEmployee && !selectedEmployee.licenseStatus.hasLicense && selectedEmployee.value !== lastWarnedEmployeeId) {
        setSelectedEmployeeWithoutLicense(selectedEmployee);
        setLastWarnedEmployeeId(selectedEmployee.value);
        warningDialog.onTrue();
        // Don't clear the selection - let user decide
      }
    }
  }, [assignedDriverId, employeeOptions, methods, warningDialog, lastWarnedEmployeeId]);

  const onSubmit = handleSubmit(async (data) => {
    if (!currentData?.id) return;

    const toastId = toast.loading('Updating vehicle...');
    try {
      await updateVehicleMutation.mutateAsync(data);
      toast.dismiss(toastId);
    } catch (error) {
      toast.dismiss(toastId);
      console.error(error);
    }
  });

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: { maxWidth: 720 },
        },
      }}
    >
      <DialogTitle>Quick update</DialogTitle>

      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          <Box
            sx={{
              pt: 1,
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
            }}
          >
            <Field.Select name="status" label="Status">
              {SITE_STATUS_OPTIONS.map((status) => (
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
              label="Assigned Driver*"
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
                label={
                  <Typography variant="subtitle2">Spare Key</Typography>
                }
                sx={{ mx: 0, width: 1, justifyContent: 'space-between' }}
              />
              <Field.Switch
                name="is_winter_tire"
                labelPlacement="start"
                label={
                  <Typography variant="subtitle2">Winter Tire</Typography>
                }
                sx={{ mx: 0, width: 1, justifyContent: 'space-between' }}
              />
              <Field.Switch
                name="is_tow_hitch"
                labelPlacement="start"
                label={
                  <Typography variant="subtitle2">Tow Hitch</Typography>
                }
                sx={{ mx: 0, width: 1, justifyContent: 'space-between' }}
              />
            </Box>
            <Field.Text name="note" label="Note" multiline rows={4} />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>

          <Button type="submit" variant="contained" loading={isSubmitting}>
            Update
          </Button>
        </DialogActions>
      </Form>
      
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
            <strong>{selectedEmployeeWithoutLicense?.first_name} {selectedEmployeeWithoutLicense?.last_name}</strong> does not have a valid driver license.
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
              // The selection is already maintained since we don't clear it
            }} 
            variant="contained"
            color="warning"
          >
            Assign Anyway
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
