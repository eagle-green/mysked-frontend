import type { IClient } from 'src/types/client';

import { z as zod } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { isValidPhoneNumber } from 'react-phone-number-input/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';

import { emptyToNull, capitalizeWords } from 'src/utils/foramt-word';

import { fetcher, endpoints } from 'src/lib/axios';
import { regionList, provinceList } from 'src/assets/data';
import { CLIENT_STATUS_OPTIONS } from 'src/assets/data/client';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type ClientQuickEditSchemaType = zod.infer<typeof ClientQuickEditSchema>;

export const ClientQuickEditSchema = zod.object({
  region: zod.string().min(1, { message: 'Region is required!' }),
  name: zod.string().min(1, { message: 'Name is required!' }),
  email: schemaHelper.emailOptional({ message: 'Email must be a valid email address!' }),
  timesheet_emails: zod
    .array(zod.string())
    .default([''])
    .refine(
      (arr) => arr.every((v) => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())),
      { message: 'Timesheet email must be a valid email address!' }
    ),
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
    timesheet_emails: [''],
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
    values: currentClient
      ? {
          ...currentClient,
          timesheet_emails:
            Array.isArray(currentClient.timesheet_emails) &&
            currentClient.timesheet_emails.length > 0
              ? currentClient.timesheet_emails
              : [''],
        }
      : undefined,
  });

  const {
    control,
    watch,
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'timesheet_emails',
  } as Parameters<typeof useFieldArray<ClientQuickEditSchemaType>>[0]);

  const values = watch();
  const firstTimesheetEmail = values?.timesheet_emails?.[0];
  const lastTimesheetEmail = values?.timesheet_emails?.[fields.length - 1];
  const isValidEmailFormat = (v: unknown) =>
    typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const canAddFirstTimesheetEmail = isValidEmailFormat(firstTimesheetEmail);
  const canAddAnotherTimesheetEmail =
    fields.length <= 1 || isValidEmailFormat(lastTimesheetEmail);

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
              timesheet_emails: (updatedData.timesheet_emails ?? [])
                .map((e) => (typeof e === 'string' ? e.trim().toLowerCase() : ''))
                .filter(Boolean),
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
              timesheet_emails: (updatedData.timesheet_emails ?? [])
                .map((e) => (typeof e === 'string' ? e.trim().toLowerCase() : ''))
                .filter(Boolean),
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
            <Field.Text
              name="timesheet_emails.0"
              label="Timesheet email address"
              placeholder="email@example.com"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        color="primary"
                        disabled={!canAddFirstTimesheetEmail}
                        onClick={() => append('')}
                        aria-label="Add timesheet email"
                      >
                        <Iconify icon="mingcute:add-line" />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            {fields.length > 1 && (
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Stack
                  spacing={2}
                  sx={{
                    p: 2,
                    borderRadius: 1.5,
                    bgcolor: 'background.neutral',
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    Additional timesheet email addresses
                  </Typography>
                  {fields.slice(1).map((field, i) => (
                    <Stack key={field.id} direction="row" spacing={1.5} alignItems="center">
                      <Field.Text
                        name={`timesheet_emails.${i + 1}`}
                        label={`Timesheet email address #${i + 2}`}
                        placeholder="email@example.com"
                        fullWidth
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => remove(i + 1)}
                                  aria-label="Remove timesheet email"
                                >
                                  <Iconify icon="mingcute:close-line" />
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    </Stack>
                  ))}
                  <Button
                    type="button"
                    color="primary"
                    size="small"
                    disabled={!canAddAnotherTimesheetEmail}
                    startIcon={<Iconify icon="mingcute:add-line" />}
                    onClick={() => append('')}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Add another timesheet email
                  </Button>
                </Stack>
              </Box>
            )}
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
