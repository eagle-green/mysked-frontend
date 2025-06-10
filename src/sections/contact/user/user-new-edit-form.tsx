import type { IUser } from 'src/types/user';

import { z as zod } from 'zod';
import { useBoolean } from 'minimal-shared/hooks';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fData } from 'src/utils/format-number';
import { normalizeFormValues } from 'src/utils/form-normalize';
import { emptyToNull, capitalizeWords } from 'src/utils/foramt-word';

import { fetcher, endpoints } from 'src/lib/axios';
import { roleList, provinceList } from 'src/assets/data';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { Form, Field, schemaHelper } from 'src/components/hook-form';
// ----------------------------------------------------------------------

export type NewUserSchemaType = zod.infer<typeof NewUserSchema>;

export const NewUserSchema = zod.object({
  photo_url: zod
    .union([zod.instanceof(File), zod.string()])
    .optional()
    .nullable(),
  role: zod.string().min(1, { message: 'Role is required!' }),
  first_name: zod.string().min(1, { message: 'First Name is required!' }),
  last_name: zod.string().min(1, { message: 'Last Name is required!' }),
  email: schemaHelper.emailRequired({
    required: 'Email is required!',
    invalid: 'Email must be a valid email address!',
  }),
  password: zod.string().min(8, { message: 'Password must be at least 8 characters!' }).optional(),
  phone_number: schemaHelper.phoneNumber({ isValid: isValidPhoneNumber }),

  province: zod.string(),
  city: zod.string(),
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
  country: zod.string().optional().nullable(),
});

// ----------------------------------------------------------------------

type Props = {
  currentUser?: IUser;
};

// Helper to check if a URL is a valid Cloudinary URL
function isCloudinaryUrl(url: string | null | undefined) {
  return typeof url === 'string' && url.includes('res.cloudinary.com');
}

export function UserNewEditForm({ currentUser }: Props) {
  const router = useRouter();
  const confirmDialog = useBoolean();
  const showPassword = useBoolean();
  const isPasswordDisabled = useBoolean(currentUser ? true : false);

  const defaultValues: NewUserSchemaType = {
    photo_url: null,
    role: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone_number: '',
    unit_number: '',
    street_number: '',
    street_name: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'Canada',
    status: 'active',
  };

  const methods = useForm<NewUserSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(NewUserSchema),
    defaultValues,
    values: currentUser ? normalizeFormValues(currentUser) : defaultValues,
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const handleUploadWithUserId = async (file: File, userId: string) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const public_id = userId;
    const folder = 'user';

    const query = new URLSearchParams({
      public_id,
      timestamp: timestamp.toString(),
      folder,
      action: 'upload',
    }).toString();

    const { signature, api_key, cloud_name } = await fetcher([
      `${endpoints.cloudinary}/signature?${query}`,
      { method: 'GET' },
    ]);

    // 2. Upload file with signed params
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', api_key);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('public_id', userId);
    formData.append('overwrite', 'true');
    formData.append('folder', 'user');

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
    const isEdit = Boolean(currentUser?.id);
    const toastId = toast.loading(isEdit ? 'Updating employee...' : 'Creating employee...');

    const transformedData = {
      ...data,
      first_name: capitalizeWords(data.first_name),
      last_name: capitalizeWords(data.last_name),
      unit_number: emptyToNull(capitalizeWords(data.unit_number)),
      street_number: emptyToNull(capitalizeWords(data.street_number)),
      street_name: emptyToNull(capitalizeWords(data.street_name)),
      city: emptyToNull(capitalizeWords(data.city)),
      province: emptyToNull(capitalizeWords(data.province)),
      country: emptyToNull(capitalizeWords(data.country)),
      email: emptyToNull(data.email?.toLowerCase()),
      // Only include password if it's not disabled and has a value
      ...(isPasswordDisabled.value ? {} : { password: data.password }),
    };

    let uploadedUrl: string | null = typeof data.photo_url === 'string' ? data.photo_url : '';
    if (!uploadedUrl) {
      uploadedUrl = null;
    }
    // Only allow valid Cloudinary URLs or null
    if (uploadedUrl && !isCloudinaryUrl(uploadedUrl)) {
      uploadedUrl = null;
    }

    if (data.photo_url instanceof File) {
      const file = data.photo_url;

      if (!isEdit) {
        // Remove photo_url from payload for initial user creation
        const rest = transformedData;
        const userResponse = await fetcher([
          endpoints.user,
          { method: 'POST', data: rest },
        ]);
        const userId = userResponse?.data?.id;
        uploadedUrl = await handleUploadWithUserId(file, userId);

        await fetcher([
          `${endpoints.user}/${userId}`,
          { method: 'PUT', data: { ...rest, photo_url: uploadedUrl } },
        ]);
      } else {
        if (!currentUser || !currentUser.id) {
          throw new Error('Employee ID is missing for update');
        }

        const userId = currentUser.id;

        uploadedUrl = await handleUploadWithUserId(file, userId);

        await fetcher([
          `${endpoints.user}/${userId}`,
          { method: 'PUT', data: { ...transformedData, photo_url: uploadedUrl } },
        ]);
      }
    } else {
      if (isEdit) {
        await fetcher([
          `${endpoints.user}/${currentUser?.id}`,
          { method: 'PUT', data: { ...transformedData, photo_url: uploadedUrl } },
        ]);
      } else {
        await fetcher([endpoints.user, { method: 'POST', data: transformedData }]);
      }
    }

    toast.dismiss(toastId);
    toast.success(isEdit ? 'Update success!' : 'Create success!');
    router.push(paths.contact.user.list);
  });

  const deleteFromCloudinary = async (public_id: string) => {
    const timestamp = Math.floor(Date.now() / 1000);

    const query = new URLSearchParams({
      public_id,
      timestamp: timestamp.toString(),
      action: 'destroy',
    }).toString();

    const { signature, api_key, cloud_name } = await fetcher([
      `${endpoints.cloudinary}/signature?${query}`,
      { method: 'GET' },
    ]);

    const deleteUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/image/destroy`;

    const formData = new FormData();
    formData.append('public_id', public_id);
    formData.append('api_key', api_key);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);

    const res = await fetch(deleteUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (data.result !== 'ok') {
      throw new Error(data.result || 'Failed to delete from Cloudinary');
    }
  };

  const onDelete = async () => {
    if (!currentUser?.id) return;
    const publicId = `user/${currentUser.id}`;
    const toastId = toast.loading('Deleting employee...');
    try {
      await deleteFromCloudinary(publicId);
      await fetcher([`${endpoints.user}/${currentUser.id}`, { method: 'DELETE' }]);
      toast.dismiss(toastId);
      toast.success('Delete success!');
      router.push(paths.contact.user.list);
    } catch (error) {
      toast.dismiss(toastId);
      console.error(error);
      toast.error('Failed to delete the employee.');
    }
  };

  const renderConfirmDialog = (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title="Delete"
      content="Are you sure you want to delete this employee?"
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
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ pt: 10, pb: 5, px: 3 }}>
            {currentUser && (
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

            <Box sx={{ mb: 5 }}>
              <Field.UploadAvatar
                name="photo_url"
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
                    Allowed *.jpeg, *.jpg, *.png,
                    <br /> max size of {fData(3145728)}
                  </Typography>
                }
              />
            </Box>

            {currentUser && (
              <FormControlLabel
                labelPlacement="start"
                control={
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        {...field}
                        checked={field.value !== 'inactive'}
                        onChange={(event) =>
                          field.onChange(event.target.checked ? 'active' : 'inactive')
                        }
                      />
                    )}
                  />
                }
                label={
                  <>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      Status
                    </Typography>
                    {/* <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Apply disable account
                    </Typography> */}
                  </>
                }
                sx={{
                  mx: 0,
                  mb: 3,
                  width: 1,
                  justifyContent: 'space-between',
                }}
              />
            )}

            {/* <Field.Switch
              name="isVerified"
              labelPlacement="start"
              label={
                <>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    Email verified
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Disabling this will automatically send the user a verification email
                  </Typography>
                </>
              }
              sx={{ mx: 0, width: 1, justifyContent: 'space-between' }}
            /> */}

            {currentUser && (
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
              <Field.Select name="role" label="Role*">
                {roleList.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </Field.Select>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }} />
              <Box
                sx={{
                  rowGap: 3,
                  columnGap: 2,
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                }}
              >
                <Field.Text name="first_name" label="First Name*" />
                <Field.Text name="last_name" label="Last Name*" />
              </Box>

              <Field.Text name="email" label="Email address*" />

              <Field.Phone
                name="phone_number"
                label="Phone Number"
                country={!currentUser ? 'CA' : undefined}
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
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {currentUser ? (
                  <Box sx={{ width: '100%' }}>
                    <Stack spacing={2}>
                      <Box>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => {
                            isPasswordDisabled.onFalse();
                            methods.setValue('password', '');
                          }}
                          startIcon={<Iconify icon="solar:lock-password-outline" />}
                        >
                          Reset Password
                        </Button>
                      </Box>

                      {!isPasswordDisabled.value && (
                        <Box sx={{ mt: 2 }}>
                          <Field.Text
                            name="password"
                            label="New Password"
                            placeholder="Enter new password"
                            type={showPassword.value ? 'text' : 'password'}
                            required
                            slotProps={{
                              inputLabel: { shrink: true },
                              input: {
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton onClick={showPassword.onToggle} edge="end">
                                      <Iconify
                                        icon={
                                          showPassword.value
                                            ? 'solar:eye-bold'
                                            : 'solar:eye-closed-bold'
                                        }
                                      />
                                    </IconButton>
                                  </InputAdornment>
                                ),
                              },
                            }}
                          />
                        </Box>
                      )}
                    </Stack>
                  </Box>
                ) : (
                  <Field.Text
                    name="password"
                    label="Password"
                    placeholder="Password"
                    type={showPassword.value ? 'text' : 'password'}
                    required
                    slotProps={{
                      inputLabel: { shrink: true },
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={showPassword.onToggle} edge="end">
                              <Iconify
                                icon={
                                  showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'
                                }
                              />
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                )}
              </Box>
            </Box>
            <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
              <Button type="submit" variant="contained" loading={isSubmitting}>
                {!currentUser ? 'Create Employee' : 'Save changes'}
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
      {renderConfirmDialog}
    </Form>
  );
}
