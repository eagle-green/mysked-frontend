import type { ISiteItem } from 'src/types/site';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { delay } from 'src/utils/delay';
import { capitalizeWords } from 'src/utils/foramt-word';

import { regionList } from 'src/assets/data';
import { fetcher, endpoints } from 'src/lib/axios';
import provinceList from 'src/assets/data/province-list';

import { toast } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { Form, Field, schemaHelper } from 'src/components/hook-form';
// ----------------------------------------------------------------------

export type NewSiteSchemaType = zod.infer<typeof NewSiteSchema>;

export const NewSiteSchema = zod.object({
  region: zod.string().min(1, { message: 'Region is required!' }),
  name: zod.string().min(1, { message: 'Site Name is required!' }),
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
  currentSite?: ISiteItem;
};

export function SiteNewEditForm({ currentSite }: Props) {
  const router = useRouter();
  const confirmDialog = useBoolean();

  const defaultValues: NewSiteSchemaType = {
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

  const methods = useForm<NewSiteSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(NewSiteSchema),
    defaultValues,
    values: currentSite,
  });

  const {
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    const isEdit = Boolean(currentSite?.id);
    const toastId = toast.loading(isEdit ? 'Updating site...' : 'Creating site...');

    try {
      const formattedData = {
        ...data,
        region: capitalizeWords(data.region),
        unit_number: capitalizeWords(data.unit_number),
        street_number: capitalizeWords(data.street_number),
        street_name: capitalizeWords(data.street_name),
        city: capitalizeWords(data.city),
        province: capitalizeWords(data.province),
        country: capitalizeWords(data.country),
        email: data.email?.toLowerCase() || '',
      };

      await delay(800);

      await fetcher([
        isEdit ? `${endpoints.site}/${currentSite?.id}` : endpoints.site,
        {
          method: isEdit ? 'PUT' : 'POST',
          data: formattedData,
        },
      ]);

      toast.dismiss(toastId);
      toast.success(isEdit ? 'Update success!' : 'Create success!');
      router.push(paths.site.list);
    } catch (error) {
      toast.dismiss(toastId);
      console.error(error);
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} site. Please try again.`);
    }
  });

  const onDelete = async () => {
    if (!currentSite?.id) return;

    const toastId = toast.loading('Deleting site...');
    try {
      await delay(800);
      await fetcher([`${endpoints.site}/${currentSite.id}`, { method: 'DELETE' }]);

      toast.dismiss(toastId);
      toast.success('Delete success!');
      router.push(paths.site.list);
    } catch (error) {
      toast.dismiss(toastId);
      console.error(error);
      toast.error('Failed to delete the site.');
    }
  };

  const renderConfirmDialog = (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title="Delete"
      content="Are you sure you want to delete this site?"
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
              <Field.Select name="region" label="Region*">
                {regionList.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Field.Select>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }} />
              <Field.Text name="name" label="Site Name*" />
              <Field.Text name="email" label="Email address" />
              <Field.Phone
                name="contact_number"
                label="Contact Number"
                placeholder="Enter Contact Number"
                country={!currentSite ? 'CA' : undefined}
              />

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
                value={!currentSite ? 'CA' : undefined}
              />
            </Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mt: 3 }}
            >
              {currentSite && (
                <Button variant="soft" color="error" onClick={confirmDialog.onTrue}>
                  Delete site
                </Button>
              )}
              <Button type="submit" variant="contained" loading={isSubmitting}>
                {!currentSite ? 'Create site' : 'Save changes'}
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
      {renderConfirmDialog}
    </Form>
  );
}
