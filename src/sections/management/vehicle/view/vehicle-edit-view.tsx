import { Icon } from '@iconify/react';
import { lazy, Suspense } from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, usePathname, useSearchParams } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { VehicleProfileForm } from '../vehicle-profile-form';
import { VehicleProfileCover } from '../vehicle-profile-cover';

// Lazy load tab components
const VehiclePictureTab = lazy(() =>
  import('../vehicle-picture-tab').then((module) => ({
    default: module.VehiclePictureTab,
  }))
);

const VehicleInventoryTab = lazy(() =>
  import('../vehicle-inventory-tab').then((module) => ({
    default: module.VehicleInventoryTab,
  }))
);

// Loading component for Suspense fallback
const TabLoadingFallback = () => (
  <Box sx={{ p: 3 }}>
    <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" height={100} sx={{ mb: 1 }} />
    <Skeleton variant="rectangular" height={100} />
  </Box>
);

// Preload functions for better UX
const preloadPicture = () => {
  import('../vehicle-picture-tab');
};

const preloadInventory = () => {
  import('../vehicle-inventory-tab');
};

// ----------------------------------------------------------------------

const TAB_ITEMS = [
  {
    value: '',
    label: 'Vehicle Info',
    icon: <Icon width={24} icon="ic:baseline-fire-truck" />,
  },
  {
    value: 'picture',
    label: 'Picture',
    icon: <Icon width={24} icon="solar:camera-bold" />,
    onMouseEnter: preloadPicture,
  },
  {
    value: 'inventory',
    label: 'Inventory',
    icon: <Icon width={24} icon="solar:box-bold" />,
    onMouseEnter: preloadInventory,
  },
];

// ----------------------------------------------------------------------

const TAB_PARAM = 'tab';

export function EditVehicleView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedTab = searchParams.get(TAB_PARAM) ?? '';

  const createRedirectPath = (currentPath: string, query: string) => {
    const queryString = new URLSearchParams({ [TAB_PARAM]: query }).toString();
    return query ? `${currentPath}?${queryString}` : currentPath;
  };

  const { id } = useParams<{ id: string }>();

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: async () => {
      if (!id) return undefined;
      const response = await fetcher(`${endpoints.management.vehicle}/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Edit a vehicle"
          links={[
            { name: 'Management' },
            { name: 'Resource' },
            { name: 'Vehicle' },
            { name: 'Edit' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <TabLoadingFallback />
      </DashboardContent>
    );
  }

  if (error) {
    console.error('Error fetching vehicle:', error);
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Edit a vehicle"
          links={[
            { name: 'Management' },
            { name: 'Resource' },
            { name: 'Vehicle' },
            { name: 'Edit' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h3>Error Loading Vehicle</h3>
          <p>Failed to load vehicle data. Please check your authentication and try again.</p>
          <p>Error: {error?.message || 'Unknown error'}</p>
        </div>
      </DashboardContent>
    );
  }

  const vehicle = data?.vehicle;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit a vehicle"
        links={[
          { name: 'Management' },
          { name: 'Resource' },
          { name: 'Vehicle', href: paths.management.vehicle.list },
          { name: vehicle?.license_plate || 'Edit' },
        ]}
        action={
          <Button
            variant="contained"
            onClick={() => router.push(paths.management.vehicle.list)}
            startIcon={<Iconify icon="eva:arrowhead-left-fill" />}
          >
            Back
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {vehicle && (
        <Card sx={{ mb: 3, height: { xs: 290, md: 180 }, position: 'relative' }}>
          <VehicleProfileCover
            licensePlate={vehicle.license_plate}
            info={vehicle.info}
            driver={vehicle.assigned_driver}
          />
          <Box
            sx={{
              width: 1,
              bottom: 0,
              zIndex: 9,
              px: { md: 3 },
              display: 'flex',
              position: 'absolute',
              bgcolor: 'background.paper',
              justifyContent: { xs: 'center', md: 'flex-end' },
            }}
          >
            <Tabs value={selectedTab}>
              {TAB_ITEMS.map((tab) => (
                <Tab
                  component={RouterLink}
                  key={tab.value}
                  value={tab.value}
                  icon={tab.icon}
                  label={tab.label}
                  href={createRedirectPath(pathname, tab.value)}
                  onMouseEnter={tab.onMouseEnter}
                />
              ))}
            </Tabs>
          </Box>
        </Card>
      )}

      {selectedTab === '' && vehicle && <VehicleProfileForm currentData={vehicle} />}
      {selectedTab === 'picture' && vehicle && (
        <Suspense fallback={<TabLoadingFallback />}>
          <VehiclePictureTab vehicleId={vehicle.id} />
        </Suspense>
      )}
      {selectedTab === 'inventory' && vehicle && (
        <Suspense fallback={<TabLoadingFallback />}>
          <VehicleInventoryTab vehicleId={vehicle.id} vehicleData={vehicle} />
        </Suspense>
      )}
    </DashboardContent>
  );
}
