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

import { SiteNewEditForm } from 'src/sections/site/site-new-edit-form';
import { SiteProfileCover } from '../profile-cover';

// Lazy load tab components
const SitePreferenceEditForm = lazy(() =>
  import('../site-preference-edit-form').then((module) => ({
    default: module.SitePreferenceEditForm,
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
  import('../site-preference-edit-form');
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

export function EditSiteView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedTab = searchParams.get(TAB_PARAM) ?? '';

  const createRedirectPath = (currentPath: string, query: string) => {
    const queryString = new URLSearchParams({ [TAB_PARAM]: query }).toString();
    return query ? `${currentPath}?${queryString}` : currentPath;
  };

  const { id } = useParams<{ id: string }>();

  const { data } = useQuery({
    queryKey: ['site', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetcher(`${endpoints.site}/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit a site"
        links={[{ name: 'Management' }, { name: 'Site' }, { name: 'Edit' }]}
        sx={{ mb: { xs: 3, md: 5 }, p: 3 }}
      />

      {data?.site && (
        <Card sx={{ mb: 3, height: { xs: 290, md: 180 } }}>
          <SiteProfileCover
            name={data.site.name}
            region={data.site.region}
            city={data.site.city}
            province={data.site.province}
            email={data.site.email}
            contactNumber={data.site.contact_number}
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
      {selectedTab === '' && data?.site && <SiteNewEditForm currentSite={data?.site} />}
      {selectedTab === 'preference' && data?.site && (
        <Suspense fallback={<TabLoadingFallback />}>
          <SitePreferenceEditForm currentSite={data?.site} />
        </Suspense>
      )}
    </DashboardContent>
  );
}
