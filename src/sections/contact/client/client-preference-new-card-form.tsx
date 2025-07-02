import type { IUser } from 'src/types/user';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export const NewClientPreferenceSchema = zod.object({
  restricted_user_id: zod.string().min(1, { message: 'employee is required!' }),
  reason: zod.string().optional(),
});

type NewClientPreferenceSchemaType = zod.infer<typeof NewClientPreferenceSchema>;

type Props = {
  currentData?: Partial<NewClientPreferenceSchemaType>;
  sx?: any;
  onSuccess?: () => void;
  currentClientId: string;
  onClose: () => void;
  existingRestrictions?: Array<{ restricted_user_id: string }>;
  isEditMode?: boolean;
  restrictionId?: string;
};

type EmployeeOption = {
  label: string;
  value: string;
  photo_url: string | null;
  first_name: string;
  last_name: string;
};

export function ClientPreferenceNewCardForm({
  sx,
  currentData,
  onSuccess,
  currentClientId,
  onClose,
  existingRestrictions = [],
  isEditMode = false,
  restrictionId,
}: Props) {
  // Fetch user list for employee autocomplete
  const { data: userList } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.user}?status=active`);
      return response.data.users;
    },
  });

  const employeeOptions = userList
    ? userList
        .filter(
          (user: IUser) =>
            !existingRestrictions.some((restriction) => restriction.restricted_user_id === user.id)
        )
        .map((user: IUser) => ({
          label: `${user.first_name} ${user.last_name}`,
          value: user.id,
          photo_url: user.photo_url,
          first_name: user.first_name,
          last_name: user.last_name,
        }))
    : [];

  // In edit mode, we need to include the current restricted user in options
  const editModeOptions =
    isEditMode && currentData?.restricted_user_id
      ? userList
          ?.filter((user: IUser) => user.id === currentData.restricted_user_id)
          .map((user: IUser) => ({
            label: `${user.first_name} ${user.last_name}`,
            value: user.id,
            photo_url: user.photo_url,
            first_name: user.first_name,
            last_name: user.last_name,
          })) || []
      : [];

  const finalEmployeeOptions = isEditMode
    ? [...editModeOptions, ...employeeOptions]
    : employeeOptions;

  const methods = useForm<NewClientPreferenceSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(NewClientPreferenceSchema),
    defaultValues: currentData || { restricted_user_id: '', reason: '' },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    const toastId = toast.loading(isEditMode ? 'Updating...' : 'Adding...');
    try {
      const endpoint =
        isEditMode && restrictionId
          ? `${endpoints.clientRestrictions}/${restrictionId}`
          : endpoints.clientRestrictions;

      const method = isEditMode ? 'PUT' : 'POST';

      await fetcher([
        endpoint,
        {
          method,
          data: {
            ...data,
            client_id: currentClientId,
          },
        },
      ]);
      toast.dismiss(toastId);
      toast.success(isEditMode ? 'Update success!' : 'Add success!');
      if (typeof onSuccess === 'function') onSuccess();
      if (typeof onClose === 'function') onClose();
    } catch (error) {
      toast.dismiss(toastId);
      console.error('Error adding/updating restriction:', error);
      toast.error(
        isEditMode
          ? 'Failed to update restriction. Please try again.'
          : 'Failed to add employee. Please try again.'
      );
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Box
        sx={[
          () => ({
            gap: 2.5,
            width: 1,
            display: 'flex',
            flexDirection: 'column',
          }),
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        <Field.AutocompleteWithAvatar
          name="restricted_user_id"
          label="Client Work Restrictions*"
          placeholder="Select a employee"
          options={finalEmployeeOptions}
          value={
            finalEmployeeOptions.find(
              (option: EmployeeOption) => option.value === methods.watch('restricted_user_id')
            ) || null
          }
          disabled={isEditMode}
        />
        <Field.Text name="reason" label="Reason" multiline rows={4} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, pb: 2.5 }}>
          <Button color="inherit" variant="outlined" onClick={onClose}>
            Cancel
          </Button>

          <Button color="inherit" variant="contained" type="submit" disabled={isSubmitting}>
            {isEditMode ? 'Update' : 'Add'}
          </Button>
        </Box>
      </Box>
    </Form>
  );
}
