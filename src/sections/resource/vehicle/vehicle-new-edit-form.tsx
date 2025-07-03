import type { IUser } from 'src/types/user';
import type { IVehicleItem } from 'src/types/vehicle';

import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
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

export type NewVehicleSchemaType = zod.infer<typeof NewVehicleSchema>;

export const NewVehicleSchema = zod.object({
  region: zod.string().min(1, { message: 'Region is required!' }),
  type: zod.string().min(1, { message: 'Vehicle Type is required!' }),
  license_plate: zod.string().min(1, { message: 'License Plate is required!' }),
  unit_number: zod.string().min(1, { message: 'Unit Number is required!' }),
  assigned_driver: zod.string().min(1, { message: 'Assigned Driver is required!' }),
  // Optional fields
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

type Props = {
  currentData?: IVehicleItem;
};

type EmployeeOption = {
  label: string;
  value: string;
  photo_url: string | null;
  first_name: string;
  last_name: string;
};

export function VehicleNewEditForm({ currentData }: Props) {
  const router = useRouter();
  const confirmDialog = useBoolean();
  const [isDeleting, setIsDeleting] = useState(false);

  const defaultValues: NewVehicleSchemaType = {
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

  const methods = useForm<NewVehicleSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(NewVehicleSchema),
    defaultValues: currentData
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
    formState: { isSubmitting },
  } = methods;

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
        photo_url: user.photo_url,
        first_name: user.first_name,
        last_name: user.last_name,
      }))
    : [];

  const onSubmit = handleSubmit(async (data) => {
    const isEdit = Boolean(currentData?.id);
    const toastId = toast.loading(isEdit ? 'Updating...' : 'Creating...');

    try {
      const formattedData = {
        ...data,
        region: capitalizeWords(data.region),
        license_plate: emptyToNull(data.license_plate.toUpperCase()),
        unit_number: emptyToNull(capitalizeWords(data.unit_number)),
        year: data.year,
      };

      await fetcher([
        isEdit ? `${endpoints.vehicle}/${currentData?.id}` : endpoints.vehicle,
        {
          method: isEdit ? 'PUT' : 'POST',
          data: formattedData,
        },
      ]);

      toast.dismiss(toastId);
      toast.success(isEdit ? 'Update success!' : 'Create success!');
      router.push(paths.resource.vehicle.list);
    } catch (error) {
      toast.dismiss(toastId);
      console.error(error);
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} vehicle. Please try again.`);
    }
  });

  const onDelete = async () => {
    if (!currentData?.id) return;
    setIsDeleting(true);
    const toastId = toast.loading('Deleting vehicle...');
    try {
      await fetcher([`${endpoints.vehicle}/${currentData.id}`, { method: 'DELETE' }]);

      toast.dismiss(toastId);
      toast.success('Delete success!');
      router.push(paths.resource.vehicle.list);
    } catch (error) {
      toast.dismiss(toastId);
      console.error(error);
      toast.error('Failed to delete the vehicle.');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderConfirmDialog = (
    <Dialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Delete Vehicle</DialogTitle>
      <DialogContent>
        Are you sure you want to delete <strong>{currentData?.license_plate}</strong>?
      </DialogContent>
      <DialogActions>
        <Button
          onClick={confirmDialog.onFalse}
          disabled={isDeleting}
          sx={{ mr: 1 }}
        >
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
      <Grid container spacing={3}>
        <Grid size={{ xs: 16, md: 12 }}>
          <Card sx={{ p: 3 }}>
            <Box
              sx={{
                rowGap: 3,
                columnGap: 2,
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
              }}
            >
              {currentData && (
                <Field.Select name="status" label="Status">
                  {VEHICLE_STATUS_OPTIONS.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Field.Select>
              )}

              <Field.Select name="region" label="Region*">
                {regionList.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Field.Select>

              {!currentData && <Box sx={{ display: { xs: 'none', sm: 'block' } }} />}
              <Field.Select name="type" label="Vehicle Type*">
                {VEHICLE_TYPE_OPTIONS.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Field.Select>
              <Field.Text name="license_plate" label="License Plate*" />
              <Field.Text name="unit_number" label="Unit Number*" />
              <Field.AutocompleteWithAvatar
                name="assigned_driver"
                label="Assigned Driver*"
                placeholder="Select a driver"
                options={employeeOptions}
                value={
                  employeeOptions.find(
                    (option: EmployeeOption) => option.value === methods.watch('assigned_driver')
                  ) || null
                }
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
              justifyContent={!currentData ? 'flex-end' : 'space-between'}
              alignItems="center"
              sx={{ mt: 3 }}
            >
              {currentData && (
                <Button variant="soft" color="error" onClick={confirmDialog.onTrue}>
                  Delete
                </Button>
              )}
              <Button type="submit" variant="contained" loading={isSubmitting}>
                {!currentData ? 'Create' : 'Save changes'}
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
      {renderConfirmDialog}
    </Form>
  );
}
