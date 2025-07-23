import type { ISiteItem } from 'src/types/site';
import type { ICompanyItem } from 'src/types/company';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { normalizeFormValues } from 'src/utils/form-normalize';
import { emptyToNull, capitalizeWords } from 'src/utils/foramt-word';

import { provinceList } from 'src/assets/data';
import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

// const SITE_STATUS_OPTIONS = [
//   { value: 'active', label: 'Active' },
//   { value: 'inactive', label: 'Inactive' },
// ];

export type NewSiteSchemaType = zod.infer<typeof NewSiteSchema>;

export const NewSiteSchema = zod.object({
  company: zod
    .object({
      id: zod.string(),
      name: zod.string(),
    })
    .nullable()
    .refine((val) => val !== null, { message: 'Company is required!' }),
  name: zod.string().min(1, { message: 'Site Name is required!' }),
  email: schemaHelper.emailOptional({ message: 'Email must be a valid email address!' }),
  contact_number: schemaHelper.contactNumber({ isValid: isValidPhoneNumber }),
  country: schemaHelper.nullableInput(zod.string().min(1, { message: 'Country is required!' }), {
    message: 'Country is required!',
  }),
  province: schemaHelper.nullableInput(zod.string().min(1, { message: 'Province is required!' }), {
    message: 'Province is required!',
  }),
  city: schemaHelper.nullableInput(zod.string().min(1, { message: 'City is required!' }), {
    message: 'City is required!',
  }),
  unit_number: zod.string().optional(),
  street_number: zod.string().optional(),
  street_name: zod.string().optional(),
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
  status: zod.string().min(1, { message: 'Status is required!' }),
});

// ----------------------------------------------------------------------

type Props = {
  currentSite?: ISiteItem | null;
  preSelectedCompany?: ICompanyItem;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function SiteNewEditForm({ currentSite, preSelectedCompany, onSuccess, onCancel }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();



  // Fetch companies for autocomplete
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await fetcher(endpoints.company);
      return response.data.companies || [];
    },
  });

  // Mutation for creating new site
  const createSiteMutation = useMutation({
    mutationFn: async (data: any) => await fetcher([endpoints.site, { method: 'POST', data }]),
    onSuccess: () => {
      toast.success('Site created successfully!');
      // Invalidate sites list to show the new site
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      // Also refetch companies in case the site creation affects company data
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(paths.management.site.list);
      }
    },
    onError: (error) => {
      console.error('Site creation error:', error);
      toast.error('Failed to create site');
    },
  });

  // Mutation for updating existing site
  const updateSiteMutation = useMutation({
    mutationFn: async (data: any) => await fetcher([
        `${endpoints.site}/${currentSite!.id}`,
        { method: 'PUT', data },
      ]),
    onSuccess: () => {
      toast.success('Site updated successfully!');
      // Invalidate both the sites list and individual site queries
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.invalidateQueries({ queryKey: ['site', currentSite!.id] });
      // Also refetch companies in case the site update affects company data
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(paths.management.site.list);
      }
    },
    onError: (error) => {
      console.error('Site update error:', error);
      toast.error('Failed to update site');
    },
  });

  const defaultValues: NewSiteSchemaType = {
    company: currentSite?.company_id
      ? companies.find((c: ICompanyItem) => c.id === currentSite.company_id) || null
      : preSelectedCompany || null,
    name: currentSite?.name || '',
    email: currentSite?.email || '',
    contact_number: currentSite?.contact_number || '',
    unit_number: currentSite?.unit_number || '',
    street_number: currentSite?.street_number || '',
    street_name: currentSite?.street_name || '',
    city: currentSite?.city || '',
    province: currentSite?.province || '',
    postal_code: currentSite?.postal_code || '',
    country: currentSite?.country || '',
    status: currentSite?.status || 'active',
  };

  const methods = useForm<NewSiteSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(NewSiteSchema),
    defaultValues,
  });

  const {
    // reset,
    // watch,
    handleSubmit,
    // formState: { isSubmitting: formSubmitting },
  } = methods;

  const isSubmitting = createSiteMutation.isPending || updateSiteMutation.isPending;

  // const values = watch();

  const onSubmit = handleSubmit(async (data) => {
    // Normalize form values
    const normalizedData = normalizeFormValues(data);

    // Capitalize text fields and extract company_id from company object
    const processedData = {
      ...normalizedData,
      company_id: normalizedData.company?.id,
      name: capitalizeWords(normalizedData.name),
      unit_number: emptyToNull(capitalizeWords(normalizedData.unit_number)),
      street_number: emptyToNull(capitalizeWords(normalizedData.street_number)),
      street_name: emptyToNull(capitalizeWords(normalizedData.street_name)),
      city: emptyToNull(capitalizeWords(normalizedData.city)),
      province: emptyToNull(capitalizeWords(normalizedData.province)),
      country: emptyToNull(capitalizeWords(normalizedData.country)),
      postal_code: emptyToNull(normalizedData.postal_code?.toUpperCase().trim()),
      email: normalizedData.email?.toLowerCase() || null,
    };

    // Remove the company object from the data before sending to backend
    delete processedData.company;

    if (currentSite) {
      // Update existing site
      updateSiteMutation.mutate(processedData);
    } else {
      // Create new site
      createSiteMutation.mutate(processedData);
    }
  });

  const isDialogMode = !!onCancel;

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      {isDialogMode ? (
        // Dialog mode - no card wrapper
        <>
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
              p: 1,
            }}
          >
            {/* Only show company field if no preSelectedCompany */}
            {!preSelectedCompany && (
              <Field.Autocomplete
                name="company"
                label="Company*"
                placeholder="Search and select company..."
                options={companies}
                disabled={!!preSelectedCompany}
                getOptionLabel={(option: ICompanyItem | null) => {
                  if (!option) return '';
                  return option.name || '';
                }}
                isOptionEqualToValue={(option: ICompanyItem, value: ICompanyItem) => option.id === value.id}
                renderOption={(props, option: ICompanyItem) => (
                  <Box component="li" {...props} key={option.id}>
                    <Box>
                      <Typography variant="body2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.region} • {option.display_address}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            )}

            <Field.Text name="name" label="Site Name*" />

            <Field.Text name="email" label="Email" />

            <Field.Text name="unit_number" label="Unit Number" />

            <Field.Text name="street_number" label="Street Number" />

            <Field.Text name="street_name" label="Street Name" />

            <Field.Text name="city" label="City*" />

            <Field.Autocomplete
              name="province"
              label="Province*"
              placeholder="Search and select province..."
              options={provinceList.map((p) => p.value)}
              getOptionLabel={(option: string) => option}
              isOptionEqualToValue={(option: string, value: string) => option === value}
              freeSolo={false}
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

            <Field.CountrySelect name="country" label="Country*" placeholder="Choose a country" />
          </Box>
          <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: 'flex-end' }}>
            {onCancel && (
              <Button variant="outlined" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
            <Button type="submit" variant="contained" loading={isSubmitting}>
              {!currentSite ? 'Create' : 'Save changes'}
            </Button>
          </Stack>
        </>
      ) : (
        // Page mode - with card wrapper
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
                <Field.Autocomplete
                  name="company"
                  label="Company*"
                  placeholder="Search and select company..."
                  options={companies}
                  disabled={!!preSelectedCompany}
                  getOptionLabel={(option: ICompanyItem | null) => {
                    if (!option) return '';
                    return option.name || '';
                  }}
                  isOptionEqualToValue={(option: ICompanyItem, value: ICompanyItem) => option.id === value.id}
                  renderOption={(props, option: ICompanyItem) => (
                    <Box component="li" {...props} key={option.id}>
                      <Box>
                        <Typography variant="body2">{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.region} • {option.display_address}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />

                <Field.Text name="name" label="Site Name*" />

                <Field.Text name="email" label="Email" />

                <Field.Text name="unit_number" label="Unit Number" />

                <Field.Text name="street_number" label="Street Number" />

                <Field.Text name="street_name" label="Street Name" />

                <Field.Text name="city" label="City*" />

                <Field.Autocomplete
                  name="province"
                  label="Province*"
                  placeholder="Search and select province..."
                  options={provinceList.map((p) => p.value)}
                  getOptionLabel={(option: string) => option}
                  isOptionEqualToValue={(option: string, value: string) => option === value}
                  freeSolo={false}
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

                <Field.CountrySelect name="country" label="Country*" placeholder="Choose a country" />
              </Box>
              <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: 'flex-end' }}>
                {onCancel && (
                  <Button variant="outlined" onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" variant="contained" loading={isSubmitting}>
                  {!currentSite ? 'Create' : 'Save changes'}
                </Button>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}
    </Form>
  );
}
