import type { IUser } from 'src/types/user';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { emptyToNull, capitalizeWords } from 'src/utils/foramt-word';

import { fetcher, endpoints } from 'src/lib/axios';
import { roleList, provinceList } from 'src/assets/data';
import { USER_STATUS_OPTIONS } from 'src/assets/data/user';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type UserQuickEditSchemaType = zod.infer<typeof UserQuickEditSchema>;

export const UserQuickEditSchema = zod.object({
  role: zod.string().min(1, { message: 'Role is required!' }),
  first_name: zod.string().min(1, { message: 'First Name is required!' }),
  last_name: zod.string().min(1, { message: 'Last Name is required!' }),
  email: schemaHelper.emailRequired({
    required: 'Email is required!',
    invalid: 'Email must be a valid email address!',
  }),
  phone_number: schemaHelper.phoneNumber({ isValid: isValidPhoneNumber }),
  address: zod.object({
    country: zod.string().optional().nullable(),
    province: zod.string().nullable(),
    city: zod.string().nullable(),
    postal_code: schemaHelper.postalCode({
      message: {
        invalid_type: 'Postal code must be in A1A 1A1 format',
      },
    }),
    // Not required
    unit_number: zod.string().nullable(),
    street_number: zod.string().nullable(),
    street_name: zod.string().nullable(),
  }),
  status: zod.string().nullable(),
});

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  currentUser?: IUser;
  onUpdateSuccess: () => void;
};

export function UserQuickEditForm({ currentUser, open, onClose, onUpdateSuccess }: Props) {
  const queryClient = useQueryClient();

  const defaultValues: UserQuickEditSchemaType = {
    role: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: {
      unit_number: '',
      street_number: '',
      street_name: '',
      city: '',
      province: '',
      postal_code: '',
      country: 'Canada',
    },
    status: 'active',
  };

  const methods = useForm<UserQuickEditSchemaType>({
    mode: 'all',
    resolver: zodResolver(UserQuickEditSchema),
    defaultValues,
    values: currentUser,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const updateUserMutation = useMutation({
    mutationFn: async (updatedData: UserQuickEditSchemaType) =>
      await fetcher([
        `${endpoints.user}/${currentUser!.id}`,
        {
          method: 'PUT',
          data: {
            ...updatedData,
            first_name: capitalizeWords(updatedData.first_name),
            last_name: capitalizeWords(updatedData.last_name),
            status: updatedData.status || 'active',
            address: {
              ...updatedData.address,
              unit_number: emptyToNull(capitalizeWords(updatedData.address.unit_number)),
              street_number: emptyToNull(capitalizeWords(updatedData.address.street_number)),
              street_name: emptyToNull(capitalizeWords(updatedData.address.street_name)),
              city: emptyToNull(capitalizeWords(updatedData.address.city)),
              province: emptyToNull(capitalizeWords(updatedData.address.province)),
              country: emptyToNull(capitalizeWords(updatedData.address.country)),
            },
            email: emptyToNull(updatedData.email?.toLowerCase()),
          },
        },
      ]),
    onSuccess: () => {
      toast.success('User updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onUpdateSuccess();
    },
    onError: () => {
      toast.error('Failed to update user.');
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    if (!currentUser?.id) return;

    const toastId = toast.loading('Updating user...');
    try {
      await updateUserMutation.mutateAsync(data);
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
              {USER_STATUS_OPTIONS.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Select name="role" label="Role*">
              {roleList.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </Field.Select>

            <Box
              sx={{
                rowGap: 3,
                columnGap: 2,
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
              }}
            >
              <Field.Text name="first_name" label="First Name" />
              <Field.Text name="last_name" label="Last Name" />
            </Box>
            <Field.Text name="email" label="Email address*" />
            <Field.Phone
              name="phone_number"
              label="Phone Number"
              country={!currentUser?.phone_number ? 'CA' : undefined}
            />

            <Field.Text name="address.unit_number" label="Unit Number" />
            <Field.Text name="address.street_number" label="Street Number" />
            <Field.Text name="address.street_name" label="Street Name" />
            <Field.Text name="address.city" label="City" />

            <Field.Autocomplete
              fullWidth
              name="address.province"
              label="Province"
              placeholder="Choose a province"
              options={provinceList.map((option) => option.value)}
            />

            <Field.Text name="address.postal_code" label="Postal Code" />
            <Field.CountrySelect
              fullWidth
              name="address.country"
              label="Country"
              placeholder="Choose a country"
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
