import { useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import useMediaQuery from '@mui/material/useMediaQuery';
import InputAdornment from '@mui/material/InputAdornment';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

const MIN_LEN = 8;

type Props = {
  userId: string;
};

export function AccountChangePasswordCard({ userId }: Props) {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
  const showCurrent = useBoolean();
  const showNew = useBoolean();
  const showConfirm = useBoolean();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < MIN_LEN) {
      toast.error(`New password must be at least ${MIN_LEN} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }
    if (!currentPassword.trim()) {
      toast.error('Enter your current password.');
      return;
    }

    setSubmitting(true);
    try {
      await fetcher([
        `${endpoints.management.user}/${userId}`,
        {
          method: 'PUT',
          data: {
            password: newPassword,
            current_password: currentPassword,
          },
        },
      ]);
      toast.success('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const ax = err as { error?: string };
      const msg =
        typeof ax?.error === 'string' && ax.error.length > 0
          ? ax.error
          : 'Could not update password.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Change password
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Enter your current password, then a new password (at least {MIN_LEN} characters).
      </Typography>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2} sx={{ maxWidth: 480 }}>
          <TextField
            fullWidth
            label="Current password"
            type={showCurrent.value ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={showCurrent.onToggle} edge="end" aria-label="Toggle visibility">
                      <Iconify
                        icon={showCurrent.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                      />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            fullWidth
            label="New password"
            type={showNew.value ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            helperText={`At least ${MIN_LEN} characters (same rules as sign-up).`}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={showNew.onToggle} edge="end" aria-label="Toggle visibility">
                      <Iconify icon={showNew.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            fullWidth
            label="Confirm new password"
            type={showConfirm.value ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={showConfirm.onToggle} edge="end" aria-label="Toggle visibility">
                      <Iconify
                        icon={showConfirm.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                      />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Box
            sx={{
              display: 'flex',
              justifyContent: { xs: 'stretch', sm: 'flex-end' },
              pt: 0.5,
            }}
          >
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
              fullWidth={isSmDown}
              sx={isSmDown ? { minHeight: 48, py: 1.25, fontWeight: 600 } : undefined}
            >
              {submitting ? 'Updating…' : 'Update password'}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Card>
  );
}
