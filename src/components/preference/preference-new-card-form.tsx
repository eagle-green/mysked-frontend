import type { IUser } from 'src/types/user';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export const NewPreferenceSchema = zod.object({
  preference_type: zod
    .enum(['preferred', 'not_preferred'], { message: 'Preference type is required!' })
    .optional(),
  restricted_user_id: zod.string().min(1, { message: 'Employee is required!' }),
  reason: zod.string().optional(),
});

export type NewPreferenceSchemaType = zod.infer<typeof NewPreferenceSchema>;

type PreferenceContext = 'client' | 'user' | 'company' | 'site';

type PreferenceNewCardFormProps = {
  context: PreferenceContext;
  sx?: any;
  currentData?: any;
  onSuccess?: () => void;
  currentId: string;
  onClose?: () => void;
  existingPreferences?: any[];
  isEditMode?: boolean;
  preferenceId?: string;
  entityData?: any;
  preferenceType?: 'preferred' | 'not_preferred';
  [key: string]: any;
};

type EmployeeOption = {
  label: string;
  value: string;
  photo_url: string | null;
  first_name: string;
  last_name: string;
};

export function PreferenceNewCardForm({
  context,
  sx,
  currentData,
  onSuccess,
  currentId,
  onClose,
  existingPreferences = [],
  isEditMode = false,
  preferenceId,
  entityData,
  preferenceType,
}: PreferenceNewCardFormProps) {
  const queryClient = useQueryClient();

  // Fetch user list for employee autocomplete
  const { data: userList } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.user}?status=active`);
      return response.data.users;
    },
  });

  // Get the endpoint key for preferences
  const getPreferenceEndpoint = () => {
    switch (context) {
      case 'company':
        return endpoints.companyPreferences;
      case 'client':
        return endpoints.clientPreferences;
      case 'user':
        return endpoints.userPreferences;
      case 'site':
        return endpoints.sitePreference;
      default:
        throw new Error(`Unknown context: ${context}`);
    }
  };

  // Filter out employees that already have this preference type
  const employeeOptions = userList
    ? userList
        .filter((user: IUser) => {
          // For user context, exclude the current user (can't add self)
          if (context === 'user' && user.id === currentId) {
            return false;
          }
          
          // In edit mode, allow the current employee/user
          if (isEditMode && ((currentData?.employee?.id === user.id) || (currentData?.user?.id === user.id))) {
            return true;
          }
          // Otherwise, filter out users that already have ANY preference (preferred OR not_preferred)
          return !existingPreferences.some(pref => 
            (pref.employee?.id === user.id) || (pref.user?.id === user.id)
          );
        })
        .map((user: IUser) => ({
          label: `${user.first_name} ${user.last_name}`,
          value: user.id,
          photo_url: user.photo_url,
          first_name: user.first_name,
          last_name: user.last_name,
        }))
    : [];

  const methods = useForm<NewPreferenceSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(NewPreferenceSchema),
    defaultValues: currentData
      ? {
          preference_type: currentData.preference_type,
          restricted_user_id: (currentData.employee?.id || currentData.user?.id) || '',
          reason: currentData.reason || '',
        }
      : {
          preference_type: preferenceType || 'preferred',
          restricted_user_id: '',
          reason: '',
        },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const mutation = useMutation({
    mutationFn: async (data: NewPreferenceSchemaType) => {
      const endpoint = getPreferenceEndpoint();
      const payload = {
        [`${context}_id`]: currentId,
        ...(context === 'site' 
          ? { user_id: data.restricted_user_id } 
          : { employee_id: data.restricted_user_id }
        ),
        preference_type: preferenceType || data.preference_type,
        reason: data.reason || null,
      };

      if (isEditMode && preferenceId) {
        await fetcher([
          `${endpoint}/${preferenceId}`,
          { method: 'PUT', data: { 
            reason: data.reason,
            ...(context === 'site' && { preference_type: preferenceType })
          }},
        ]);
      } else {
        await fetcher([endpoint, { method: 'POST', data: payload }]);
      }
    },
    onSuccess: () => {
      toast.success(isEditMode ? 'Preference updated!' : 'Preference added!');
      queryClient.invalidateQueries({ queryKey: [`${context}-preferences`, currentId] });
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    },
    onError: (error: any) => {
      const errorMessage = error?.error || 'Failed to save preference. Please try again.';
      toast.error(errorMessage);
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    mutation.mutate(data);
  });

  // Get available options (exclude existing preferences)
  const availableOptions = [
    { value: 'preferred', label: 'Preferred' },
    { value: 'not_preferred', label: 'Not Preferred' },
  ].filter((option) => {
    // If preferenceType is fixed, only show that option
    if (preferenceType) {
      return option.value === preferenceType;
    }
    // Otherwise, show options that don't have this employee already
    return true;
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
        {!preferenceType && (
          <Field.Select name="preference_type" label="Preference Type" disabled={isEditMode}>
            {availableOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Field.Select>
        )}

        <Field.AutocompleteWithAvatar
          name="restricted_user_id"
          label={context === 'site' ? 'Select User' : 'Select Employee'}
          placeholder={context === 'site' ? 'Search for a user...' : 'Search for an employee...'}
          options={employeeOptions}
          disabled={isEditMode}
          value={
            employeeOptions.find(
              (option: EmployeeOption) => option.value === methods.watch('restricted_user_id')
            ) || null
          }
        />

        <Field.Text
          name="reason"
          label="Reason"
          multiline
          rows={4}
          placeholder="Enter reason for this preference..."
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pb: 3 }}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || employeeOptions.length === 0}
          >
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Add'}
          </Button>
        </Box>
      </Box>
    </Form>
  );
}
