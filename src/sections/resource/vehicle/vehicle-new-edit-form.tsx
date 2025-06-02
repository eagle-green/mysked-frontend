import type { IUser } from 'src/types/user';
import type { IVehicleItem } from 'src/types/vehicle';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { emptyToNull, capitalizeWords } from 'src/utils/foramt-word';

import { fetcher, endpoints } from 'src/lib/axios';
import { regionList , VEHICLE_TYPE_OPTIONS, VEHICLE_STATUS_OPTIONS } from 'src/assets/data';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { ConfirmDialog } from 'src/components/custom-dialog';
// ----------------------------------------------------------------------

export type NewVehicleSchemaType = zod.infer<typeof NewVehicleSchema>;

export const NewVehicleSchema = zod.object({
  region: zod.string().min(1, { message: 'Region is required!' }),
  type: zod.string().min(1, { message: 'Vehicle Type is required!' }),
  license_plate: zod.string().min(1, { message: 'License Plate is required!' }),
  unit_number: zod.string().min(1, { message: 'Unit Number is required!' }),
  assigned_driver: zod.string().min(1, { message: 'Assigned Driver is required!' }),
});

// ----------------------------------------------------------------------

type Props = {
  currentData?: IVehicleItem;
};

export function VehicleNewEditForm({ currentData }: Props) {
  const router = useRouter();
  const confirmDialog = useBoolean();

  const defaultValues: NewVehicleSchemaType = {
    region: '',
    type: '',
    license_plate: '',
    unit_number: '',
    assigned_driver: '',
  };

  const methods = useForm<NewVehicleSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(NewVehicleSchema),
    defaultValues: currentData
      ? {
          ...currentData,
          assigned_driver: currentData.assigned_driver?.id || '',
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
    }
  };

  const renderConfirmDialog = (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title="Delete"
      content="Are you sure you want to delete this vehicle?"
      action={
        <Button
          variant="contained"
          color="error"
          onClick={async () => {
            confirmDialog.onFalse();
            await onDelete();
          }}
        >
          Delete
        </Button>
      }
    />
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
              />
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
