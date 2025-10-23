import type { IClient } from 'src/types/client';

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
import { regionList, provinceList } from 'src/assets/data';
import { CLIENT_STATUS_OPTIONS } from 'src/assets/data/client';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type ClientQuickEditSchemaType = zod.infer<typeof ClientQuickEditSchema>;

export const ClientQuickEditSchema = zod.object({
  region: zod.string().min(1, { message: 'Region is required!' }),
  name: zod.string().min(1, { message: 'Name is required!' }),
  email: schemaHelper.emailOptional({ message: 'Email must be a valid email address!' }),
  contact_number: schemaHelper.contactNumber({ isValid: isValidPhoneNumber }),
  country: zod.string().optional(),
  province: zod.string().optional(),
  city: zod.string().optional(),
  postal_code: schemaHelper.postalCode({
    message: {
      invalid_type: 'Postal code must be in A1A 1A1 format',
    },
  }),
  // Not required
  unit_number: zod.string().nullable(),
  street_number: zod.string().nullable(),
  street_name: zod.string().nullable(),
  status: zod.string().nullable(),
});

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  currentClient?: IClient;
  onUpdateSuccess: (createdClient?: IClient) => void;
};

export function ClientQuickEditForm({ currentClient, open, onClose, onUpdateSuccess }: Props) {
  const queryClient = useQueryClient();

  const isEditMode = !!currentClient?.id;

  const defaultValues: ClientQuickEditSchemaType = {
    region: '',
    name: '',
    email: '',
    contact_number: '',
    unit_number: '',
    street_number: '',
    street_name: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'Canada',
    status: 'active',
  };

  const methods = useForm<ClientQuickEditSchemaType>({
    mode: 'all',
    resolver: zodResolver(ClientQuickEditSchema),
    defaultValues,
    values: currentClient,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const updateClientMutation = useMutation({
    mutationFn: async (updatedData: ClientQuickEditSchemaType) => {
      if (isEditMode) {
        return await fetcher([
          `${endpoints.management.client}/${currentClient!.id}`,
          {
            method: 'PUT',
            data: {
              ...updatedData,
              logo_url: currentClient?.logo_url,
              region: capitalizeWords(updatedData.region),
              unit_number: emptyToNull(capitalizeWords(updatedData.unit_number)),
              street_number: emptyToNull(capitalizeWords(updatedData.street_number)),
              street_name: emptyToNull(capitalizeWords(updatedData.street_name)),
              city: emptyToNull(capitalizeWords(updatedData.city)),
              province: emptyToNull(capitalizeWords(updatedData.province)),
              country: emptyToNull(capitalizeWords(updatedData.country)),
              email: emptyToNull(updatedData.email?.toLowerCase()),
            },
          },
        ]);
      } else {
        return await fetcher([
          endpoints.management.client,
          {
            method: 'POST',
            data: {
              ...updatedData,
              region: capitalizeWords(updatedData.region),
              unit_number: emptyToNull(capitalizeWords(updatedData.unit_number)),
              street_number: emptyToNull(capitalizeWords(updatedData.street_number)),
              street_name: emptyToNull(capitalizeWords(updatedData.street_name)),
              city: emptyToNull(capitalizeWords(updatedData.city)),
              province: emptyToNull(capitalizeWords(updatedData.province)),
              country: emptyToNull(capitalizeWords(updatedData.country)),
              email: emptyToNull(updatedData.email?.toLowerCase()),
              status: 'active', // Always set to active for new clients
            },
          },
        ]);
      }
    },
    onSuccess: (data) => {
      if (isEditMode) {
        toast.success('Client updated successfully!');
      } else {
        toast.success('Client created successfully!');
      }
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-all'] });
      queryClient.invalidateQueries({ queryKey: ['client-status-counts'] });
      onUpdateSuccess(data?.client || data);
    },
    onError: () => {
      if (isEditMode) {
        toast.error('Failed to update client.');
      } else {
        toast.error('Failed to create client.');
      }
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    if (isEditMode && !currentClient?.id) return;

    const toastId = toast.loading(isEditMode ? 'Updating client...' : 'Creating client...');
    try {
      await updateClientMutation.mutateAsync(data);
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
      <DialogTitle>{isEditMode ? 'Quick update' : 'Create new client'}</DialogTitle>

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
            {isEditMode ? (
              <Field.Select name="status" label="Status">
                {CLIENT_STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Field.Select>
            ) : (
              <Field.Select name="region" label="Region*">
                {regionList.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Field.Select>
            )}

            {isEditMode ? (
              <Field.Select name="region" label="Region*">
                {regionList.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Field.Select>
            ) : (
              <Box /> // Empty box to maintain grid layout
            )}

            <Field.Text name="name" label="Client name" />
            <Field.Text name="email" label="Email address" />
            <Field.Phone
              name="contact_number"
              label="Contact number"
              country={!currentClient ? 'CA' : undefined}
            />

            <Field.Text name="unit_number" label="Unit Number" />
            <Field.Text name="street_number" label="Street Number" />
            <Field.Text name="street_name" label="Street Name" />
            <Field.Text name="city" label="City" />

            <Field.Autocomplete
              fullWidth
              name="province"
              label="Province"
              placeholder="Choose a province"
              options={provinceList.map((option) => option.value)}
            />

            <Field.Text name="postal_code" label="Postal Code" />
            <Field.CountrySelect
              fullWidth
              name="country"
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
            {isEditMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
