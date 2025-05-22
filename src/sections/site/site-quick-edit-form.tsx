import type { ISiteItem } from 'src/types/site';

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

import { capitalizeWords } from 'src/utils/foramt-word';

import { fetcher, endpoints } from 'src/lib/axios';
import { SITE_STATUS_OPTIONS } from 'src/assets/data';
import provinceList from 'src/assets/data/province-list';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type SiteQuickEditSchemaType = zod.infer<typeof SiteQuickEditSchema>;

export const SiteQuickEditSchema = zod.object({
  region: zod.string().min(1, { message: 'Region is required!' }),
  name: zod.string().min(1, { message: 'Name is required!' }),
  email: schemaHelper.emailOptional({ message: 'Email must be a valid email address!' }),
  contact_number: schemaHelper.contactNumber({ isValid: isValidPhoneNumber }),
  country: schemaHelper.nullableInput(zod.string().min(1, { message: 'Country is required!' }), {
    // message for null value
    message: 'Country is required!',
  }),
  province: zod.string().min(1, { message: 'Province is required!' }),
  city: zod.string().min(1, { message: 'City is required!' }),
  postal_code: schemaHelper.postalCode({
    message: {
      invalid_type: 'Postal code must be in A1A 1A1 format',
    },
  }),
  // Not required
  unit_number: zod.string(),
  street_number: zod.string(),
  street_name: zod.string(),
  status: zod.string(),
});

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  currentSite?: ISiteItem;
  onUpdateSuccess: () => void;
};

export function SiteQuickEditForm({ currentSite, open, onClose, onUpdateSuccess }: Props) {
  const queryClient = useQueryClient();

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const updateSiteMutation = useMutation({
    mutationFn: async (updatedData: SiteQuickEditSchemaType) => {
      await delay(500); // 1.5 seconds artificial delay
      return await fetcher([
        `${endpoints.site}/${currentSite!.id}`,
        {
          method: 'PUT',
          data: {
            ...updatedData,
            region: capitalizeWords(updatedData.region),
            unit_number: capitalizeWords(updatedData.unit_number),
            street_number: capitalizeWords(updatedData.street_number),
            street_name: capitalizeWords(updatedData.street_name),
            city: capitalizeWords(updatedData.city),
            province: capitalizeWords(updatedData.province),
            country: capitalizeWords(updatedData.country),
            email: updatedData.email?.toLowerCase() ?? '',
          },
        },
      ]);
    },
    onSuccess: () => {
      toast.success('Site updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['sites'] }); // Adjust query key if different
      onUpdateSuccess();
    },
    onError: () => {
      toast.error('Failed to update site.');
    },
  });

  const defaultValues: SiteQuickEditSchemaType = {
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

  const methods = useForm<SiteQuickEditSchemaType>({
    mode: 'all',
    resolver: zodResolver(SiteQuickEditSchema),
    defaultValues,
    values: currentSite,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    if (!currentSite?.id) return;

    const toastId = toast.loading('Updating site...');
    try {
      await updateSiteMutation.mutateAsync(data);
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

            <Box sx={{ display: { xs: 'none', sm: 'block' } }} />

            <Field.Text name="name" label="Site Name*" />
            <Field.Text name="email" label="Email Address" />
            <Field.Phone name="contact_number" label="Contact Number" />

            <Field.Text name="unit_number" label="Unit Number" />
            <Field.Text name="street_number" label="Street Number" />
            <Field.Text name="street_name" label="Street Name" />
            <Field.Text name="city" label="City*" />
            <Field.Autocomplete
              fullWidth
              name="province"
              label="Province*"
              placeholder="Choose a province"
              options={provinceList.map((option) => option.value)}
            />
            <Field.Text name="postal_code" label="Postal Code" />
            <Field.CountrySelect
              fullWidth
              name="country"
              label="Country*"
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
