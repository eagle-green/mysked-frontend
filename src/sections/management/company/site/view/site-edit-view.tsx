import { Icon } from '@iconify/react';
import { lazy, Suspense, useMemo } from 'react';
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
import { useAuthContext } from 'src/auth/hooks';

import { SiteNewEditForm } from '../site-new-edit-form';
import { SiteProfileCover } from '../site-profile-cover';

// Lazy load tab components
const SitePreferenceEditForm = lazy(() =>
  import('../site-preference-edit-form').then((module) => ({
    default: module.SitePreferenceEditForm,
  }))
);

const SitePreferredEditForm = lazy(() =>
  import('../site-preferred-edit-form').then((module) => ({
    default: module.SitePreferredEditForm,
  }))
);

const SiteInventoryTab = lazy(() =>
  import('../site-inventory-tab').then((module) => ({
    default: module.SiteInventoryTab,
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

// const LoadingFallback = () => (
//   <Box sx={{ p: 3 }}>
//     <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
//     <Skeleton variant="rectangular" height={100} sx={{ mb: 1 }} />
//     <Skeleton variant="rectangular" height={100} />
//   </Box>
// );

// Preload functions for better UX
const preloadPreference = () => {
  import('../site-preference-edit-form');
};

const preloadPreferred = () => {
  import('../site-preferred-edit-form');
};

const preloadInventory = () => {
  import('../site-inventory-tab');
};

// ----------------------------------------------------------------------

const TAB_ITEMS_BASE = [
  {
    value: '',
    label: 'Detail',
    icon: <Icon width={24} icon="solar:document-text-bold" />,
  },
  {
    value: 'preferred',
    label: 'Preferred',
    icon: <Icon width={24} icon="solar:smile-circle-bold" />,
    onMouseEnter: preloadPreferred,
  },
  {
    value: 'not-preferred',
    label: 'Not Preferred',
    icon: <Icon width={24} icon="solar:sad-circle-bold" />,
    onMouseEnter: preloadPreference,
  },
];

// ----------------------------------------------------------------------

const TAB_PARAM = 'tab';

export function SiteEditView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedTab = searchParams.get(TAB_PARAM) ?? '';

  const createRedirectPath = (currentPath: string, query: string) => {
    const queryString = new URLSearchParams({ [TAB_PARAM]: query }).toString();
    return query ? `${currentPath}?${queryString}` : currentPath;
  };

  const { id } = useParams<{ id: string }>();
  const { user } = useAuthContext();

  const {
    data: site,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['site', id],
    queryFn: async () => {
      if (!id) return undefined;
      const response = await fetcher(`${endpoints.management.site}/${id}`);
      return response.data.site;
    },
    enabled: !!id,
  });

  // Only show Inventory tab for admin users
  const isAdmin = user?.role === 'admin';
  const TAB_ITEMS = useMemo(() => {
    if (!isAdmin) return TAB_ITEMS_BASE;
    // Insert Inventory tab between Detail (first) and Preferred (second)
    return [
      TAB_ITEMS_BASE[0], // Detail
      {
        value: 'inventory',
        label: 'Inventory',
        icon: <Icon width={24} icon="solar:box-bold" />,
        onMouseEnter: preloadInventory,
      },
      ...TAB_ITEMS_BASE.slice(1), // Preferred, Not Preferred
    ];
  }, [isAdmin]);

  if (isLoading) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Edit a site"
          links={[
            { name: 'Management' },
            { name: 'Company' },
            { name: 'Site', href: paths.management.customer.site.list },
            { name: 'Edit' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <TabLoadingFallback />
      </DashboardContent>
    );
  }

  if (error) {
    console.error('Error fetching site:', error);
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Edit a site"
          links={[
            { name: 'Management' },
            { name: 'Company' },
            { name: 'Site', href: paths.management.customer.site.list },
            { name: 'Edit' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h3>Error Loading Site</h3>
          <p>Failed to load site data. Please check your authentication and try again.</p>
          <p>Error: {error?.message || 'Unknown error'}</p>
        </div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit a site"
        links={[
          { name: 'Management' },
          { name: 'Company' },
          { name: 'Site', href: paths.management.customer.site.list },
          { name: site?.name || 'Edit' },
        ]}
        action={
          <Button
            variant="contained"
            onClick={() => router.push(paths.management.customer.site.list)}
            startIcon={<Iconify icon="eva:arrowhead-left-fill" />}
          >
            Back
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {site && (
        <Card sx={{ mb: 3, height: { xs: 290, md: 180 } }}>
          <SiteProfileCover
            name={site.name}
            companyName={site.company_name}
            address={site.display_address || `${site.city}, ${site.province}`}
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

      {selectedTab === '' && site && <SiteNewEditForm currentSite={site} />}
      {selectedTab === 'not-preferred' && site && (
        <Suspense fallback={<TabLoadingFallback />}>
          <SitePreferenceEditForm currentSite={site} />
        </Suspense>
      )}
      {selectedTab === 'preferred' && site && (
        <Suspense fallback={<TabLoadingFallback />}>
          <SitePreferredEditForm currentSite={site} />
        </Suspense>
      )}
      {selectedTab === 'inventory' && site && isAdmin && (
        <Suspense fallback={<TabLoadingFallback />}>
          <SiteInventoryTab siteId={site.id} />
        </Suspense>
      )}
    </DashboardContent>
  );
}
