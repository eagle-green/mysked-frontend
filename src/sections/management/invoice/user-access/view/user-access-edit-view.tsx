import { useParams } from 'react-router';
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

// Authorized users who can always see Invoice section and manage User Access
const AUTHORIZED_INVOICE_ADMINS = [
  'kiwoon@eaglegreen.ca',
  'kesia@eaglegreen.ca',
  'matth@eaglegreen.ca',
  'joec@eaglegreen.ca',
];

export function UserAccessEditView() {
  const router = useRouter();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  // Check if user is authorized
  const isAuthorized = user?.email && AUTHORIZED_INVOICE_ADMINS.includes(user.email.toLowerCase());

  const [invoiceAccess, setInvoiceAccess] = useState(false);

  // Fetch user data by ID
  const { data: userResponse, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetcher(`${endpoints.management.user}/${id}`);
      return response.data?.user || null;
    },
    enabled: !!id,
  });

  const currentUser = userResponse;
  const isCurrentUserAuthorizedAdmin = currentUser?.email && AUTHORIZED_INVOICE_ADMINS.includes(currentUser.email.toLowerCase());

  // Fetch user access data
  const { data: userAccessResponse, isLoading: isLoadingAccess } = useQuery({
    queryKey: ['user-access', id],
    queryFn: async () => {
      try {
        const response = await fetcher(endpoints.invoice.userAccess.detail(id!));
        return response.data;
      } catch {
        // If no access record exists, return null
        return null;
      }
    },
    enabled: !!id && !isCurrentUserAuthorizedAdmin, // Skip for authorized admins
  });

  // Set initial values
  useEffect(() => {
    if (isCurrentUserAuthorizedAdmin) {
      // Authorized admins always have access
      setInvoiceAccess(true);
    } else if (userAccessResponse) {
      setInvoiceAccess(userAccessResponse.invoice_access ?? false);
    } else {
      // Default to false if no access record exists
      setInvoiceAccess(false);
    }
  }, [userAccessResponse, isCurrentUserAuthorizedAdmin]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { invoice_access: boolean }) =>
      await fetcher([endpoints.invoice.userAccess.update(id!), {
        method: 'PUT',
        data,
      }]),
    onSuccess: () => {
      // Invalidate all user-access queries
      queryClient.invalidateQueries({ queryKey: ['user-access'] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['user-access', id] });
      }
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User access updated successfully!');
      router.push(paths.management.invoice.userAccess.list);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update user access. Please try again.');
    },
  });

  const handleSave = useCallback(() => {
    updateMutation.mutate({
      invoice_access: invoiceAccess,
    });
  }, [invoiceAccess, updateMutation]);

  const handleCancel = useCallback(() => {
    router.push(paths.management.invoice.userAccess.list);
  }, [router]);

  // Redirect if not authorized
  if (!isAuthorized) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Edit User Access"
          links={[{ name: 'Management' }, { name: 'Invoice' }, { name: 'User Access' }, { name: 'Edit' }]}
          sx={{ mb: 3 }}
        />
        <Box sx={{ py: 3 }}>
          <Typography variant="h4" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="error">
            You do not have permission to access this page.
          </Typography>
        </Box>
      </DashboardContent>
    );
  }

  if (isLoadingUser || isLoadingAccess) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Edit User Access"
          links={[
            { name: 'Management' },
            { name: 'Invoice', href: paths.management.invoice.list },
            { name: 'User Access', href: paths.management.invoice.userAccess.list },
            { name: 'Edit' },
          ]}
          sx={{ mb: 3 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <Typography>Loading user data...</Typography>
        </Box>
      </DashboardContent>
    );
  }

  if (!currentUser) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Edit User Access"
          links={[
            { name: 'Management' },
            { name: 'Invoice', href: paths.management.invoice.list },
            { name: 'User Access', href: paths.management.invoice.userAccess.list },
            { name: 'Edit' },
          ]}
          sx={{ mb: 3 }}
        />
        <Box sx={{ py: 3 }}>
          <Typography variant="h4" gutterBottom>
            User not found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            The user you&apos;re looking for doesn&apos;t exist.
          </Typography>
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit User Access"
        links={[
          { name: 'Management' },
          { name: 'Invoice', href: paths.management.invoice.list },
          { name: 'User Access', href: paths.management.invoice.userAccess.list },
          { name: 'Edit' },
        ]}
        sx={{ mb: 3 }}
      />

      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* User Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Avatar
              src={currentUser.photo_url ?? undefined}
              alt={`${currentUser.first_name} ${currentUser.last_name}`}
              sx={{ width: 64, height: 64 }}
            >
              {currentUser.first_name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {currentUser.first_name} {currentUser.last_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentUser.email}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                {currentUser.role}
              </Typography>
            </Box>
          </Box>

          {/* Authorized Admin Notice */}
          {isCurrentUserAuthorizedAdmin && (
            <Box sx={{ p: 2, bgcolor: 'warning.lighter', borderRadius: 1 }}>
              <Typography variant="body2" color="warning.darker">
                <strong>Note:</strong> This user ({currentUser.email}) is an authorized admin and automatically has invoice access. This cannot be changed.
              </Typography>
            </Box>
          )}

          {/* Access Settings */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Invoice Access
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={invoiceAccess}
                  onChange={(e) => setInvoiceAccess(e.target.checked)}
                  disabled={isCurrentUserAuthorizedAdmin}
                />
              }
              label="Allow access to Invoice module"
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              When enabled, this user will be able to see and access the Invoice menu and all invoice-related pages.
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
            <Button variant="outlined" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={updateMutation.isPending || isCurrentUserAuthorizedAdmin}
              startIcon={<Iconify icon="solar:check-circle-bold" />}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </Stack>
        </Stack>
      </Card>
    </DashboardContent>
  );
}

