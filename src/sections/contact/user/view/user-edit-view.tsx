import { lazy, Suspense } from 'react';
import { useParams } from 'react-router';
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

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { UserNewEditForm } from 'src/sections/contact/user/user-new-edit-form';

import { ProfileCover } from '../profile-cover';

// Lazy load tab components
const UserPerformanceEditForm = lazy(() =>
  import('../user-performance-edit-form').then((module) => ({
    default: module.UserPerformanceEditForm,
  }))
);
const UserPreferenceEditForm = lazy(() =>
  import('../user-preference-edit-form').then((module) => ({
    default: module.UserPreferenceEditForm,
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
const preloadPerformance = () => {
  import('../user-performance-edit-form');
};

const preloadPreference = () => {
  import('../user-preference-edit-form');
};

// ----------------------------------------------------------------------

const TAB_ITEMS = [
  {
    value: '',
    label: 'Profile',
    icon: <Iconify width={24} icon="solar:user-id-bold" />,
  },
  {
    value: 'performance',
    label: 'Performance',
    icon: <Iconify width={24} icon="solar:pen-bold" />,
    onMouseEnter: preloadPerformance,
  },
  {
    value: 'preference',
    label: 'Preference',
    icon: <Iconify width={24} icon="solar:users-group-rounded-bold" />,
    onMouseEnter: preloadPreference,
  },
];

// ----------------------------------------------------------------------

const TAB_PARAM = 'tab';

export function EditUserView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedTab = searchParams.get(TAB_PARAM) ?? '';

  const createRedirectPath = (currentPath: string, query: string) => {
    const queryString = new URLSearchParams({ [TAB_PARAM]: query }).toString();
    return query ? `${currentPath}?${queryString}` : currentPath;
  };

  const { id } = useParams<{ id: string }>();

  const { data } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetcher(`${endpoints.user}/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit a employee"
        links={[
          { name: 'Management' },
          { name: 'Contact' },
          { name: 'Employee' },
          { name: 'Edit' },
        ]}
        sx={{ mb: { xs: 3, md: 5 }, p: 3 }}
      />

      {data?.user && (
        <Card sx={{ mb: 3, height: { xs: 290, md: 180 } }}>
          <ProfileCover
            role={data.user.role}
            firstName={data.user.first_name}
            lastName={data.user.last_name}
            photoURL={data.user.photo_url}
            phone_number={data.user.phone_number}
            email={data.user.email}
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
      {selectedTab === '' && data?.user && <UserNewEditForm currentUser={data?.user} />}
      {selectedTab === 'performance' && data?.user && (
        <Suspense fallback={<TabLoadingFallback />}>
          <UserPerformanceEditForm currentUser={data?.user} />
        </Suspense>
      )}
      {selectedTab === 'preference' && data?.user && (
        <Suspense fallback={<TabLoadingFallback />}>
          <UserPreferenceEditForm currentData={data?.user} />
        </Suspense>
      )}
      {/* {data?.data?.user && <UserNewEditForm currentUser={data?.data?.user} />} */}
    </DashboardContent>
  );
}
