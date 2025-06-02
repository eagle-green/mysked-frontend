import type { IUser } from 'src/types/user';
import type { IVehicleItem } from 'src/types/vehicle';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery , useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { emptyToNull, capitalizeWords } from 'src/utils/foramt-word';

import { fetcher, endpoints } from 'src/lib/axios';
import { regionList , SITE_STATUS_OPTIONS, VEHICLE_TYPE_OPTIONS } from 'src/assets/data';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type VehicleQuickEditSchemaType = zod.infer<typeof VehicleQuickEditSchema>;

export const VehicleQuickEditSchema = zod.object({
  region: zod.string().min(1, { message: 'Region is required!' }),
  type: zod.string().min(1, { message: 'Vehicle Type is required!' }),
  license_plate: zod.string().min(1, { message: 'License Plate is required!' }),
  unit_number: zod.string().min(1, { message: 'Unit Number is required!' }),
  // Not required
  assigned_driver: zod.string(),
});

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  currentData?: IVehicleItem;
  onUpdateSuccess: () => void;
};

export function VehicleQuickEditForm({ currentData, open, onClose, onUpdateSuccess }: Props) {
  const queryClient = useQueryClient();

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

  const updateVehicleMutation = useMutation({
    mutationFn: async (updatedData: VehicleQuickEditSchemaType) =>
      await fetcher([
        `${endpoints.vehicle}/${currentData!.id}`,
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
  };

  const methods = useForm<VehicleQuickEditSchemaType>({
    mode: 'all',
    resolver: zodResolver(VehicleQuickEditSchema),
    defaultValues,
    values: currentData ? {
      ...currentData,
      assigned_driver: currentData.assigned_driver?.id || '',
    } : defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

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
            <Field.Text name="license_plate" label="License Plate" />
            <Field.Text name="unit_number" label="Unit Number*" />
            <Field.AutocompleteWithAvatar
              fullWidth
              name="assigned_driver"
              label="Assigned Driver*"
              placeholder="Select a driver"
              options={employeeOptions}
            />
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
    </Dialog>
  );
}
