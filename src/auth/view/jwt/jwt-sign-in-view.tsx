import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { useRouter } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';
import { AnimateLogoRotate } from 'src/components/animate';

import { useAuthContext } from 'src/auth/hooks';
import { FormHead } from 'src/auth/components/form-head';
import { signInWithPassword } from 'src/auth/context/jwt';

// ----------------------------------------------------------------------

export type SignInSchemaType = zod.infer<typeof SignInSchema>;

export const SignInSchema = zod.object({
  email: zod
    .string()
    .min(1, { message: 'Email is required!' })
    .email({ message: 'Email must be a valid email address!' }),
  password: zod
    .string()
    .min(1, { message: 'Password is required!' })
    .min(6, { message: 'Password must be at least 6 characters!' }),
});

// ----------------------------------------------------------------------

export function JwtSignInView() {
  const showPassword = useBoolean();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { checkUserSession } = useAuthContext();

  const defaultValues: SignInSchemaType = {
    email: '',
    password: '',
  };

  const methods = useForm<SignInSchemaType>({
    resolver: zodResolver(SignInSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      setError(null); // Clear any previous errors
      await signInWithPassword({
        email: data.email,
        password: data.password,
      });

      await checkUserSession?.();
      router.refresh();
    } catch (err: any) {
      console.error('Sign in error:', err);
      const backendError =
        err?.response?.data?.error ||
        err?.error ||
        err?.message;
      if (backendError) {
        setError(backendError);
      } else {
        setError('An error occurred during sign in. Please try again.');
      }
    }
  });

  const renderForm = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Field.Text
        name="email"
        label="Email address"
        placeholder="Email"
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Box sx={{ gap: 1.5, display: 'flex', flexDirection: 'column' }}>
        {/* <Link
          component={RouterLink}
          href="#"
          variant="body2"
          color="inherit"
          sx={{ alignSelf: 'flex-end' }}
        >
          Forgot password?
        </Link> */}
        <Field.Text
          name="password"
          label="Password"
          placeholder="Password"
          type={showPassword.value ? 'text' : 'password'}
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={showPassword.onToggle} edge="end">
                    <Iconify
                      icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Button
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Sign in..."
      >
        Sign in
      </Button>
    </Box>
  );

  return (
    <>
      <AnimateLogoRotate
        sx={{ mb: 3, mx: 'auto' }}
        slotProps={{
          logo: {
            sx: { width: 70, height: 70 },
          },
        }}
      />

      <FormHead
        title="Sign in to your account"
        description="Please log in with the account provided by admin team."
      />

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
      </Form>

      {/* <FormDivider />

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            const credential = credentialResponse.credential;
            if (credential) {
              try {
                const res = await axios.post(endpoints.auth.googleLogin, {
                  credential: credentialResponse.credential,
                });

                const { data } = res.data;

                if (data?.accessToken) {
                  sessionStorage.setItem(JWT_STORAGE_KEY, data.accessToken);
                  await setSession(data.accessToken);
                  await checkUserSession?.();
                  router.refresh();
                } else {
                  console.error('Access token is missing');
                }
              } catch (error) {
                console.error('Google login error:', error);
              }
            } else {
              console.error('No credential returned from Google');
            }
          }}
          onError={() => console.error('Login failed')}
        />
      </Box> */}
    </>
  );
}
