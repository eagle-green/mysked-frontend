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

import { normalizeFormValues } from 'src/utils/form-normalize';
import { emptyToNull, capitalizeWords } from 'src/utils/foramt-word';

import { fetcher, endpoints } from 'src/lib/axios';
import { regionList, provinceList } from 'src/assets/data';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const SITE_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export type SiteQuickEditSchemaType = zod.infer<typeof SiteQuickEditSchema>;

export const SiteQuickEditSchema = zod.object({
  region: zod.string().min(1, { message: 'Region is required!' }),
  name: zod.string().min(1, { message: 'Site Name is required!' }),
  email: schemaHelper.emailOptional({ message: 'Email must be a valid email address!' }),
  contact_number: schemaHelper.contactNumber({ isValid: isValidPhoneNumber }),
  unit_number: zod.string().optional(),
  street_number: zod.string().optional(),
  street_name: zod.string().optional(),
  city: schemaHelper.nullableInput(zod.string().min(1, { message: 'City is required!' }), {
    message: 'City is required!',
  }),
  province: schemaHelper.nullableInput(zod.string().min(1, { message: 'Province is required!' }), {
    message: 'Province is required!',
  }),
  postal_code: zod
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true; // Allow empty
        // Canadian postal code format: A1A 1A1
        const postalCodeRegex = /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/;
        return postalCodeRegex.test(val);
      },
      { message: 'Postal code must be in A1A 1A1 format' }
    ),
  country: schemaHelper.nullableInput(zod.string().min(1, { message: 'Country is required!' }), {
    message: 'Country is required!',
  }),
  status: zod.string().min(1, { message: 'Status is required!' }),
});

// ----------------------------------------------------------------------

type Props = {
  currentSite?: ISiteItem;
  open: boolean;
  onClose: VoidFunction;
  onUpdateSuccess: VoidFunction;
};

export function SiteQuickEditForm({ currentSite, open, onClose, onUpdateSuccess }: Props) {
  const queryClient = useQueryClient();

  const updateSiteMutation = useMutation({
    mutationFn: async (updatedData: SiteQuickEditSchemaType) =>
      await fetcher([
        `${endpoints.site}/${currentSite!.id}`,
        {
          method: 'PUT',
          data: {
            ...updatedData,
            region: capitalizeWords(updatedData.region),
            name: updatedData.name, // Keep site name as entered by user
            unit_number: emptyToNull(capitalizeWords(updatedData.unit_number)),
            street_number: emptyToNull(capitalizeWords(updatedData.street_number)),
            street_name: emptyToNull(capitalizeWords(updatedData.street_name)),
            city: emptyToNull(capitalizeWords(updatedData.city)),
            province: emptyToNull(capitalizeWords(updatedData.province)),
            country: emptyToNull(capitalizeWords(updatedData.country)),
            postal_code: emptyToNull(updatedData.postal_code?.toUpperCase().trim()),
            email: emptyToNull(updatedData.email?.toLowerCase()),
          },
        },
      ]),
    onSuccess: () => {
      toast.success('Site updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.invalidateQueries({ queryKey: ['site', currentSite!.id] });
      // Also refetch companies in case the site update affects company data
      queryClient.invalidateQueries({ queryKey: ['companies'] });
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
    values: currentSite ? normalizeFormValues(currentSite) : defaultValues,
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

            <Field.Select name="region" label="Region*">
              {regionList.map((region) => (
                <MenuItem key={region} value={region}>
                  {region}
                </MenuItem>
              ))}
            </Field.Select>

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
            <Field.Text
              name="postal_code"
              label="Postal Code"
              placeholder="A1A 1A1"
              inputProps={{
                maxLength: 7,
                style: { textTransform: 'uppercase' },
              }}
            />
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