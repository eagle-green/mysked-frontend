import type { IClientItem } from 'src/types/client';

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
  country: schemaHelper.nullableInput(zod.string().min(1, { message: 'Country is required!' }), {
    // message for null value
    message: 'Country is required!',
  }),
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
  status: zod.string().nullable(),
});

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  currentClient?: IClientItem;
  onUpdateSuccess: () => void;
};

export function ClientQuickEditForm({ currentClient, open, onClose, onUpdateSuccess }: Props) {
  const queryClient = useQueryClient();

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
    mutationFn: async (updatedData: ClientQuickEditSchemaType) => await fetcher([
        `${endpoints.client}/${currentClient!.id}`,
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
      ]),
    onSuccess: () => {
      toast.success('Client updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      onUpdateSuccess();
    },
    onError: () => {
      toast.error('Failed to update client.');
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    if (!currentClient?.id) return;

    const toastId = toast.loading('Updating client...');
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
              {CLIENT_STATUS_OPTIONS.map((status) => (
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
            Update
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
