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

import { ClientNewEditForm } from 'src/sections/contact/client/client-new-edit-form';
import { ClientProfileCover } from '../profile-cover';

// Lazy load tab components
const ClientPreferenceEditForm = lazy(() =>
  import('../client-preference-edit-form').then((module) => ({
    default: module.ClientPreferenceEditForm,
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
const preloadPreference = () => {
  import('../client-preference-edit-form');
};

// ----------------------------------------------------------------------

const TAB_ITEMS = [
  {
    value: '',
    label: 'Profile',
    icon: <Iconify width={24} icon="solar:user-id-bold" />,
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

export function EditClientView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedTab = searchParams.get(TAB_PARAM) ?? '';

  const createRedirectPath = (currentPath: string, query: string) => {
    const queryString = new URLSearchParams({ [TAB_PARAM]: query }).toString();
    return query ? `${currentPath}?${queryString}` : currentPath;
  };

  const { id } = useParams<{ id: string }>();

  const { data } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetcher(`${endpoints.client}/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit a client"
        links={[
          { name: 'Management' },
          { name: 'Contact' },
          { name: 'Client' },
          { name: 'Edit' },
        ]}
        sx={{ mb: { xs: 3, md: 5 }, p: 3 }}
      />

      {data?.client && (
        <Card sx={{ mb: 3, height: { xs: 290, md: 180 } }}>
          <ClientProfileCover
            name={data.client.name}
            logoURL={data.client.logo_url}
            region={data.client.region}
            email={data.client.email}
            contactNumber={data.client.contact_number}
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
      {selectedTab === '' && data?.client && <ClientNewEditForm currentClient={data?.client} />}
      {selectedTab === 'preference' && data?.client && (
        <Suspense fallback={<TabLoadingFallback />}>
          <ClientPreferenceEditForm currentData={data?.client} />
        </Suspense>
      )}
    </DashboardContent>
  );
}
