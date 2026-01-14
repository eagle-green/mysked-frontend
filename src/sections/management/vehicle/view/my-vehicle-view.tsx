import { Icon } from '@iconify/react';
import { lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Skeleton from '@mui/material/Skeleton';

import { RouterLink } from 'src/routes/components';
import { usePathname, useSearchParams } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

import { VehicleInfoReadonly } from '../vehicle-info-readonly';
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

const VehicleHistoryTab = lazy(() =>
  import('../vehicle-history-tab').then((module) => ({
    default: module.VehicleHistoryTab,
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

const preloadHistory = () => {
  import('../vehicle-history-tab');
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
  {
    value: 'history',
    label: 'History',
    icon: <Icon width={24} icon="solar:history-bold" />,
    onMouseEnter: preloadHistory,
  },
];

// ----------------------------------------------------------------------

const TAB_PARAM = 'tab';

export function MyVehicleView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedTab = searchParams.get(TAB_PARAM) ?? '';
  const { user } = useAuthContext();

  const createRedirectPath = (currentPath: string, query: string) => {
    const queryString = new URLSearchParams({ [TAB_PARAM]: query }).toString();
    return query ? `${currentPath}?${queryString}` : currentPath;
  };

  // Fetch user's assigned vehicle
  const {
    data: vehicleData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user-vehicle', user?.id],
    queryFn: async () => {
      if (!user?.id) return { vehicles: [] };
      const response = await fetcher(`${endpoints.management.vehicle}?operator_id=${user.id}`);
      return response.data;
    },
    enabled: !!user?.id,
  });

  const vehicle = vehicleData?.vehicles?.[0]; // Get first assigned vehicle

  if (isLoading) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="My Vehicle"
          links={[
            { name: 'My Schedule' },
            { name: 'Vehicle' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <TabLoadingFallback />
      </DashboardContent>
    );
  }

  if (error || !vehicle) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="My Vehicle"
          links={[
            { name: 'My Schedule' },
            { name: 'Vehicle' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Box sx={{ typography: 'h6', mb: 1 }}>No Vehicle Assigned</Box>
          <Box sx={{ typography: 'body2', color: 'text.secondary' }}>
            You don&apos;t have a vehicle assigned to you at this time.
          </Box>
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="My Vehicle"
        links={[
          { name: 'My Schedule' },
          { name: 'Vehicle' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

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

      {selectedTab === '' && vehicle && <VehicleInfoReadonly vehicle={vehicle} />}
      {selectedTab === 'picture' && vehicle && (
        <Suspense fallback={<TabLoadingFallback />}>
          <VehiclePictureTab vehicleId={vehicle.id} />
        </Suspense>
      )}
      {selectedTab === 'inventory' && vehicle && (
        <Suspense fallback={<TabLoadingFallback />}>
          <VehicleInventoryTab vehicleId={vehicle.id} vehicleData={vehicle} isWorkerView />
        </Suspense>
      )}
      {selectedTab === 'history' && vehicle && (
        <Suspense fallback={<TabLoadingFallback />}>
          <VehicleHistoryTab vehicleId={vehicle.id} />
        </Suspense>
      )}
    </DashboardContent>
  );
}

