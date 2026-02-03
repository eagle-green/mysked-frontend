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

import { getRoleDisplayInfo } from 'src/utils/format-role';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

export function VehicleUserAccessEditView() {
  const router = useRouter();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [vehicleAccess, setVehicleAccess] = useState(false);

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

  const { data: userAccessResponse, isLoading: isLoadingAccess } = useQuery({
    queryKey: ['user-access', id],
    queryFn: async () => {
      try {
        const response = await fetcher(endpoints.invoice.userAccess.detail(id!));
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (userAccessResponse) {
      setVehicleAccess(userAccessResponse.vehicle_access ?? false);
    } else {
      setVehicleAccess(false);
    }
  }, [userAccessResponse]);

  const updateMutation = useMutation({
    mutationFn: async (data: { vehicle_access: boolean }) =>
      fetcher([endpoints.invoice.userAccess.update(id!), { method: 'PUT', data }]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-access'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-user-access'] });
      if (id) queryClient.invalidateQueries({ queryKey: ['user-access', id] });
      toast.success('Vehicle access updated successfully!');
      router.push(paths.management.vehicle.userAccess.list);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update vehicle access. Please try again.');
    },
  });

  const handleSave = useCallback(() => {
    updateMutation.mutate({ vehicle_access: vehicleAccess });
  }, [vehicleAccess, updateMutation]);

  const handleCancel = useCallback(() => {
    router.push(paths.management.vehicle.userAccess.list);
  }, [router]);

  if (isLoadingUser || isLoadingAccess) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Edit Vehicle Access"
          links={[
            { name: 'Management' },
            { name: 'Vehicle', href: paths.management.vehicle.list },
            { name: 'User Access', href: paths.management.vehicle.userAccess.list },
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
          heading="Edit Vehicle Access"
          links={[
            { name: 'Management' },
            { name: 'Vehicle', href: paths.management.vehicle.list },
            { name: 'User Access', href: paths.management.vehicle.userAccess.list },
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
        heading="Edit Vehicle Access"
        links={[
          { name: 'Management' },
          { name: 'Vehicle', href: paths.management.vehicle.list },
          { name: 'User Access', href: paths.management.vehicle.userAccess.list },
          { name: 'Edit' },
        ]}
        sx={{ mb: 3 }}
      />

      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              pb: 2,
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
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
              <Typography variant="body2" color="text.secondary">
                {getRoleDisplayInfo(currentUser.role).label || currentUser.role}
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Vehicle Access
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={vehicleAccess}
                  onChange={(e) => setVehicleAccess(e.target.checked)}
                />
              }
              label="Allow access to Management Vehicle (list, create, edit)"
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              When enabled, this worker will see the Vehicle menu under Management and can view
              vehicle list, create new vehicles, and edit existing vehicles. Note: Audit access is
              restricted to admins and field supervisors only.
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
            <Button variant="outlined" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={updateMutation.isPending}
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
