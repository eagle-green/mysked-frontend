import type { IUser } from 'src/types/user';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export const NewPreferenceSchema = zod.object({
  restricted_user_id: zod.string().min(1, { message: 'employee is required!' }),
  reason: zod.string().optional(),
  is_mandatory: zod.boolean().optional(),
});

type NewPreferenceSchemaType = zod.infer<typeof NewPreferenceSchema>;

type PreferenceContext = 'client' | 'user' | 'site';

type PreferenceNewCardFormProps = {
  context: PreferenceContext;
  currentData?: Partial<NewPreferenceSchemaType>;
  sx?: any;
  onSuccess?: () => void;
  currentId: string;
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

const CONTEXT_CONFIG = {
  client: {
    label: 'Client Work Restrictions*',
    placeholder: 'Select a employee',
    endpoint: endpoints.clientRestrictions,
    idParam: 'client_id',
    mandatoryLabel: 'Mandatory Restriction',
    mandatoryDescription:
      'When enabled, this employee cannot be assigned to any jobs for this client.',
  },
  user: {
    label: 'Do Not Work With*',
    placeholder: 'Select a employee',
    endpoint: endpoints.userRestrictions,
    idParam: 'user_id',
    mandatoryLabel: 'Mandatory Restriction',
    mandatoryDescription: 'When enabled, these employees cannot be assigned to the same job.',
  },
  site: {
    label: 'Do Not Work At This Site*',
    placeholder: 'Select an employee',
    endpoint: endpoints.siteRestrictions,
    idParam: 'site_id',
    mandatoryLabel: 'Mandatory Restriction',
    mandatoryDescription:
      'When enabled, this employee cannot be assigned to any jobs at this site.',
  },
};

export function PreferenceNewCardForm({
  context,
  sx,
  currentData,
  onSuccess,
  currentId,
  onClose,
  existingRestrictions = [],
  isEditMode = false,
  restrictionId,
}: PreferenceNewCardFormProps) {
  const config = CONTEXT_CONFIG[context];

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

  const methods = useForm<NewPreferenceSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(NewPreferenceSchema),
    defaultValues: currentData || { restricted_user_id: '', reason: '', is_mandatory: false },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    const toastId = toast.loading(isEditMode ? 'Updating...' : 'Adding...');
    try {
      const endpoint =
        isEditMode && restrictionId ? `${config.endpoint}/${restrictionId}` : config.endpoint;

      const method = isEditMode ? 'PUT' : 'POST';

      await fetcher([
        endpoint,
        {
          method,
          data: {
            ...data,
            [config.idParam]: currentId,
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
          label={config.label}
          placeholder={config.placeholder}
          options={finalEmployeeOptions}
          value={
            finalEmployeeOptions.find(
              (option: EmployeeOption) => option.value === methods.watch('restricted_user_id')
            ) || null
          }
          disabled={isEditMode}
        />
        <Field.Text name="reason" label="Reason" multiline rows={4} />

        <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
          <Field.Checkbox
            name="is_mandatory"
            label={
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5, paddingTop: 1 }}>
                  {config.mandatoryLabel}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {config.mandatoryDescription}
                </Typography>
              </Box>
            }
            sx={{
              alignItems: 'flex-start',
              m: 0,
              '& .MuiFormControlLabel-root': {
                alignItems: 'flex-start',
                margin: 0,
              },
              '& .MuiCheckbox-root': {
                paddingTop: 1,
                paddingBottom: 1,
                marginTop: 0,
              },
            }}
          />
        </Box>

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
