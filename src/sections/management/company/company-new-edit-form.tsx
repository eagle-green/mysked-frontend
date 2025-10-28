import type { ICompanyItem } from 'src/types/company';

import { z as zod } from 'zod';
import { useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fData } from 'src/utils/format-number';
import { normalizeFormValues } from 'src/utils/form-normalize';
import { emptyToNull, capitalizeWords } from 'src/utils/foramt-word';

import { fetcher, endpoints } from 'src/lib/axios';
import { regionList, provinceList, COMPANY_STATUS_OPTIONS } from 'src/assets/data';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type NewCompanySchemaType = zod.infer<typeof NewCompanySchema>;

export const NewCompanySchema = zod.object({
  logo_url: zod
    .union([zod.instanceof(File), zod.string()])
    .optional()
    .nullable(),
  region: zod.string().min(1, { message: 'Region is required!' }),
  color: zod
    .string()
    .regex(/^#([0-9A-Fa-f]{3}){1,2}$/)
    .optional(),
  name: zod.string().min(1, { message: 'Customer Name is required!' }),
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
  unit_number: zod.string(),
  street_number: zod.string(),
  street_name: zod.string(),
  status: zod.string(),
});

// ----------------------------------------------------------------------

type Props = {
  currentCompany?: ICompanyItem;
};

export function CompanyNewEditForm({ currentCompany }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirmDialog = useBoolean();
  const [isDeleting, setIsDeleting] = useState(false);

  const defaultValues: NewCompanySchemaType = {
    logo_url: null,
    region: '',
    color: '#00B8D9', // Default color
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

  const methods = useForm<NewCompanySchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(NewCompanySchema),
    defaultValues,
    values: currentCompany ? normalizeFormValues(currentCompany) : defaultValues,
  });

  const {
    handleSubmit,
    watch,
    control,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  // Debug: Log form errors and values

  const handleUploadWithCompanyId = async (file: File, companyId: string) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const public_id = `companies/${companyId}/logo_${companyId}`;
    const folder = `companies/${companyId}`;

    const query = new URLSearchParams({
      public_id,
      timestamp: timestamp.toString(),
      folder,
      action: 'upload',
    }).toString();

    const { signature, api_key, cloud_name } = await fetcher([
      `${endpoints.cloudinary.upload}/signature?${query}`,
      { method: 'GET' },
    ]);

    // 2. Upload file with signed params
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', api_key);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('public_id', public_id);
    formData.append('overwrite', 'true');
    formData.append('folder', folder);

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`;

    const uploadRes = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData,
    });

    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      throw new Error(uploadData?.error?.message || 'Cloudinary upload failed');
    }

    return uploadData.secure_url;
  };

  const onSubmit = handleSubmit(async (data) => {
    const isEdit = Boolean(currentCompany?.id);
    const toastId = toast.loading(isEdit ? 'Updating company...' : 'Creating company...');

    const transformedData = {
      ...data,
      region: capitalizeWords(data.region),
      color: data.color || '#00B8D9', // Include color field
      unit_number: emptyToNull(capitalizeWords(data.unit_number)),
      street_number: emptyToNull(capitalizeWords(data.street_number)),
      street_name: emptyToNull(capitalizeWords(data.street_name)),
      city: emptyToNull(capitalizeWords(data.city)),
      province: emptyToNull(capitalizeWords(data.province)),
      country: emptyToNull(capitalizeWords(data.country)),
      email: emptyToNull(data.email?.toLowerCase()),
    };

    try {
      if (data.logo_url instanceof File) {
        const file = data.logo_url;

        if (!isEdit) {
          // First create the company without the logo
          const companyResponse = await fetcher([
            endpoints.management.company,
            { method: 'POST', data: transformedData },
          ]);

          const companyId = companyResponse?.data?.id;

          if (!companyId) {
            throw new Error(`Failed to create company: Invalid response structure`);
          }

          // Then upload the logo
          const uploadedUrl = await handleUploadWithCompanyId(file, companyId);

          // Finally update the company with the logo URL
          await fetcher([
            `${endpoints.management.company}/${companyId}`,
            { method: 'PUT', data: { ...transformedData, logo_url: uploadedUrl } },
          ]);
        } else {
          if (!currentCompany || !currentCompany.id) {
            throw new Error('Company ID is missing for update');
          }

          const companyId = currentCompany.id;
          const uploadedUrl = await handleUploadWithCompanyId(file, companyId);

          await fetcher([
            `${endpoints.management.company}/${companyId}`,
            { method: 'PUT', data: { ...transformedData, logo_url: uploadedUrl } },
          ]);
        }
      } else {
        if (isEdit) {
          await fetcher([
            `${endpoints.management.company}/${currentCompany?.id}`,
            { method: 'PUT', data: { ...transformedData, logo_url: data.logo_url } },
          ]);
        } else {
          await fetcher([endpoints.management.company, { method: 'POST', data: transformedData }]);
        }
      }

      toast.dismiss(toastId);
      toast.success(isEdit ? 'Update success!' : 'Create success!');

      // Invalidate cache to refresh company data
      if (isEdit && currentCompany?.id) {
        queryClient.invalidateQueries({ queryKey: ['company', currentCompany.id] });
        queryClient.invalidateQueries({ queryKey: ['companies'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['companies'] });
      }

      // Redirect to the customer list page after successful update
      router.push(paths.management.customer.list);
    } catch (error) {
      toast.dismiss(toastId);
      console.error(error);
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} company. Please try again.`);
    }
  });

  const onDelete = async () => {
    if (!currentCompany?.id) return;
    setIsDeleting(true);
    const toastId = toast.loading('Deleting customer...');
    try {
      await fetcher([`${endpoints.management.company}/${currentCompany.id}`, { method: 'DELETE' }]);

      toast.dismiss(toastId);
      toast.success('Delete success!');

      // Invalidate cache after deletion
      queryClient.invalidateQueries({ queryKey: ['company', currentCompany.id] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });

      router.push(paths.management.customer.list);
    } catch (error) {
      toast.dismiss(toastId);
      console.error(error);
      toast.error('Failed to delete the customer.');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderConfirmDialog = (
    <Dialog open={confirmDialog.value} onClose={confirmDialog.onFalse} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Customer</DialogTitle>
      <DialogContent>
        Are you sure you want to delete <strong>{currentCompany?.name}</strong>?
      </DialogContent>
      <DialogActions>
        <Button onClick={confirmDialog.onFalse} disabled={isDeleting} sx={{ mr: 1 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onDelete}
          disabled={isDeleting}
          startIcon={isDeleting ? <CircularProgress size={16} /> : null}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ pt: 10, pb: 5, px: 3 }}>
            {currentCompany && (
              <Label
                color={
                  (values.status === 'active' && 'success') ||
                  (values.status === 'inactive' && 'error') ||
                  'warning'
                }
                sx={{ position: 'absolute', top: 24, right: 24 }}
              >
                {values.status}
              </Label>
            )}

            <Box sx={{ position: 'absolute', top: 24, left: 24 }}>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', mb: 1, display: 'block' }}
              >
                Calendar Color
              </Typography>
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <Box
                    sx={{
                      position: 'relative',
                      width: 32,
                      height: 32,
                      borderRadius: '4px',
                      border: '2px solid #e0e0e0',
                      backgroundColor: field.value || '#00B8D9',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      '&:hover': {
                        borderColor: '#999',
                      },
                    }}
                  >
                    <input
                      type="color"
                      value={field.value || '#00B8D9'}
                      onChange={(e) => field.onChange(e.target.value)}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer',
                        margin: 0,
                        padding: 0,
                        border: 'none',
                        background: 'none',
                      }}
                    />
                  </Box>
                )}
              />
            </Box>

            <Box sx={{ mb: 5 }}>
              <Field.UploadAvatar
                name="logo_url"
                maxSize={3145728}
                helperText={
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 3,
                      mx: 'auto',
                      display: 'block',
                      textAlign: 'center',
                      color: 'text.disabled',
                    }}
                  >
                    Allowed *.jpeg, *.jpg, *.png, *.gif
                    <br /> max size of {fData(3145728)}
                  </Typography>
                }
              />
            </Box>

            {currentCompany && (
              <Stack sx={{ mt: 3, alignItems: 'center', justifyContent: 'center' }}>
                <Button variant="soft" color="error" onClick={confirmDialog.onTrue}>
                  Delete
                </Button>
              </Stack>
            )}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 3 }}>
            <Box
              sx={{
                rowGap: 3,
                columnGap: 2,
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
              }}
            >
              {currentCompany && (
                <Field.Select name="status" label="Status">
                  {COMPANY_STATUS_OPTIONS.map((status) => (
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

              {!currentCompany && <Box sx={{ display: { xs: 'none', sm: 'block' } }} />}

              <Field.Text name="name" label="Customer Name*" />
              <Field.Text name="email" label="Email address" />
              <Field.Phone
                name="contact_number"
                label="Contact Number"
                placeholder="Enter Contact Number"
                country={!currentCompany ? 'CA' : undefined}
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
            <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
              <Button type="submit" variant="contained" loading={isSubmitting}>
                {!currentCompany ? 'Create' : 'Save changes'}
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
      {renderConfirmDialog}
    </Form>
  );
}
