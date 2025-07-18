import type { IUser } from 'src/types/user';

import { z as zod } from 'zod';
import { useState, useEffect } from 'react';
import { useBoolean } from 'minimal-shared/hooks';
import { useForm, Controller } from 'react-hook-form';
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
import { uploadUserAsset, isCloudinaryUrl, deleteAllUserAssets } from 'src/utils/cloudinary-upload';

import { fetcher, endpoints } from 'src/lib/axios';
import { roleList, provinceList } from 'src/assets/data';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';
// ----------------------------------------------------------------------

export type NewUserSchemaType = zod.infer<typeof NewUserSchema>;

export const NewUserSchema = zod.object({
  photo_url: zod
    .union([zod.instanceof(File), zod.string()])
    .optional()
    .nullable(),
  role: zod.string().optional(),
  first_name: zod.string().min(1, { message: 'First Name is required!' }),
  last_name: zod.string().min(1, { message: 'Last Name is required!' }),
  email: schemaHelper.emailRequired({
    required: 'Email is required!',
    invalid: 'Email must be a valid email address!',
  }),
  password: zod.string().min(8, { message: 'Password must be at least 8 characters!' }).optional(),
  phone_number: schemaHelper.phoneNumber({ isValid: isValidPhoneNumber }),
  status: zod.string().optional(),

  address: zod.object({
    // Not required
    unit_number: zod.string().optional().nullable(),
    street_number: zod.string().optional().nullable(),
    street_name: zod.string().optional().nullable(),
    status: zod.string(),
    country: zod.string().optional().nullable(),
    province: zod.string().optional().nullable(),
    city: zod.string().optional().nullable(),
    postal_code: schemaHelper.postalCode({
      message: {
        invalid_type: 'Postal code must be in A1A 1A1 format',
      },
    }),
  }),
});

// ----------------------------------------------------------------------

type Props = {
  currentUser?: IUser;
};

export function UserNewEditForm({ currentUser }: Props) {
  const router = useRouter();
  const confirmDialog = useBoolean();
  const showPassword = useBoolean();
  const [showPasswordField, setShowPasswordField] = useState(false);
  const { user } = useAuthContext();

  const defaultValues: NewUserSchemaType = {
    photo_url: null,
    role: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone_number: '',
    address: {
      unit_number: '',
      street_number: '',
      street_name: '',
      city: '',
      province: '',
      postal_code: '',
      country: 'Canada',
      status: 'active',
    },
  };

  const methods = useForm<NewUserSchemaType>({
    mode: 'onChange',
    // resolver: zodResolver(NewUserSchema), // Temporarily disable validation
    defaultValues,
    values: currentUser ? normalizeFormValues(currentUser) : defaultValues,
  });

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  useEffect(() => {
    setShowPasswordField(false);
  }, [currentUser]);

  // Reset form when currentUser changes
  useEffect(() => {
    if (currentUser) {
      const normalizedValues = normalizeFormValues(currentUser);
      reset(normalizedValues);
    }
  }, [currentUser, reset]);

  const handleUploadWithUserId = async (file: File, userId: string) =>
    uploadUserAsset({
      file,
      userId,
      assetType: 'profile',
    });

  const onSubmit = handleSubmit(async (data) => {
    const isEdit = Boolean(currentUser?.id);
    const toastId = toast.loading(isEdit ? 'Updating employee...' : 'Creating employee...');

    // Validate role is provided when creating a new user
    if (!isEdit && !data.role) {
      toast.dismiss(toastId);
      toast.error('Role is required when creating a new employee');
      return;
    }

    const transformedData = {
      ...data,
      first_name: capitalizeWords(data.first_name),
      last_name: capitalizeWords(data.last_name),
      status: data.status || 'active',
      address: {
        ...data.address,
        unit_number: emptyToNull(capitalizeWords(data.address.unit_number)),
        street_number: emptyToNull(capitalizeWords(data.address.street_number)),
        street_name: emptyToNull(capitalizeWords(data.address.street_name)),
        city: emptyToNull(capitalizeWords(data.address.city)),
        province: emptyToNull(capitalizeWords(data.address.province)),
        country: emptyToNull(capitalizeWords(data.address.country)),
      },
      email: emptyToNull(data.email?.toLowerCase()),
      // Only include password if the field is shown and has a value
      ...(!showPasswordField ? {} : { password: data.password }),
      // Only include role if it's provided (for new users) or if user is admin editing
      ...(data.role ? { role: data.role } : {}),
    };

    let uploadedUrl: string | null = typeof data.photo_url === 'string' ? data.photo_url : '';
    if (!uploadedUrl) {
      uploadedUrl = null;
    }
    // Only allow valid Cloudinary URLs or null
    if (uploadedUrl && !isCloudinaryUrl(uploadedUrl)) {
      uploadedUrl = null;
    }

    try {
      let createdUserId: string | null = null;
      
      if (data.photo_url instanceof File) {
        const file = data.photo_url;

        if (!isEdit) {
          // Remove photo_url from payload for initial user creation
          const rest = transformedData;
          const userResponse = await fetcher([endpoints.user, { method: 'POST', data: rest }]);
          createdUserId = userResponse?.employeeId;
          if (!createdUserId) {
            throw new Error('Failed to create user - no user ID returned');
          }
          uploadedUrl = await handleUploadWithUserId(file, createdUserId);

          await fetcher([
            `${endpoints.user}/${createdUserId}`,
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
          const userResponse = await fetcher([endpoints.user, { method: 'POST', data: transformedData }]);
          createdUserId = userResponse?.employeeId;
          }
        }

      toast.dismiss(toastId);
      toast.success(isEdit ? 'Update success!' : 'Create success!');
      
      router.push(paths.contact.user.list);
    } catch (error: any) {
      console.error('Error during form submission:', error);
      toast.dismiss(toastId);
      
      // Parse backend error messages for better user experience
      let errorMessage = isEdit
        ? 'Failed to update employee. Please try again.'
        : 'Failed to create employee. Please try again.';
      
      // The fetcher interceptor transforms errors, so we need to check different structures
      let backendError = '';
      
      // Check if it's a backend error with specific message
      if (error?.error && typeof error.error === 'string') {
        // This is the transformed error from the fetcher interceptor
        backendError = error.error;
      } else if (error?.response?.data?.error) {
        // Fallback to original axios error structure
        backendError = error.response.data.error;
      } else if (typeof error === 'string') {
        // Sometimes the error is just a string
        backendError = error;
      }
      
      if (backendError) {
        // Handle specific database constraint errors
        if (backendError.includes('duplicate key value violates unique constraint "users_email_unique"') ||
            backendError.includes('Key (email)') ||
            backendError.includes('already exists')) {
          errorMessage = 'An employee with this email address already exists. Please use a different email.';
        } else if (backendError.includes('format') || backendError.includes('digits') || backendError.includes('short')) {
          errorMessage = backendError;
        } else if (backendError.includes('Invalid photo_url')) {
          errorMessage = 'Invalid profile photo. Please upload a valid image.';
        } else if (backendError.includes('No valid fields provided for update')) {
          errorMessage = 'No changes were made. Please update at least one field.';
        } else if (backendError.includes('Employee not found')) {
          errorMessage = 'Employee not found. Please refresh the page and try again.';
        } else if (backendError.includes('Unauthorized')) {
          errorMessage = 'You are not authorized to perform this action.';
        } else {
          // Use the backend error message if it's a user-friendly one
          errorMessage = backendError;
        }
      }
      
      toast.error(errorMessage);
    }
  });



  const onDelete = async () => {
    if (!currentUser?.id) return;
    const toastId = toast.loading('Deleting employee...');
    try {
      // Delete all user assets from Cloudinary (including folder and placeholder)
      await deleteAllUserAssets(currentUser.id);
      
      // Delete the user from the database
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
    <Form methods={methods} onSubmit={onSubmit} key={currentUser?.id || 'new'}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ pt: 10, pb: 5, px: 3 }}>
            {currentUser && user?.role === 'admin' && (
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

            {currentUser && user?.role === 'admin' && (
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

            {currentUser && user?.role === 'admin' && (
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
              {user?.role === 'admin' && (
                <Field.Select name="role" label="Role*">
                  {roleList.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Field.Select>
              )}
              {user?.role === 'admin' && <Box sx={{ display: { xs: 'none', sm: 'block' } }} />}

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

              <Field.Text name="address.unit_number" label="Unit Number" />
              <Field.Text name="address.street_number" label="Street Number" />
              <Field.Text name="address.street_name" label="Street Name" />
              <Field.Text name="address.city" label="City" />

              <Field.Autocomplete
                fullWidth
                name="address.province"
                label="Province"
                placeholder="Choose a province"
                options={provinceList.map((option) => option.value)}
              />

              <Field.Text name="address.postal_code" label="Postal Code" />
              <Field.CountrySelect
                fullWidth
                name="address.country"
                label="Country"
                placeholder="Choose a country"
              />
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {/* Only show password fields if admin or creating a new user */}
                {(!currentUser || user?.role === 'admin') &&
                  (!currentUser ? (
                    // New user: always show password field
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
                  ) : (
                    // Editing user: only show password field after clicking Reset Password
                    <Box sx={{ width: '100%' }}>
                      <Stack spacing={2}>
                        <Box>
                          <Button
                            variant="outlined"
                            color="warning"
                            onClick={() => {
                              setShowPasswordField(true);
                              methods.setValue('password', '');
                            }}
                            startIcon={<Iconify icon="solar:lock-password-outline" />}
                          >
                            Reset Password
                          </Button>
                        </Box>
                        {/* Only show password field if reset is clicked */}
                        {showPasswordField && (
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
                  ))}
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
