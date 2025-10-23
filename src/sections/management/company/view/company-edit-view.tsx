import { Icon } from '@iconify/react';
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

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CompanySiteList } from 'src/sections/management/company/company-site-list';
import { CompanyNewEditForm } from 'src/sections/management/company/company-new-edit-form';

import { CompanyProfileCover } from '../profile-cover';

// Lazy load tab components
const CompanyPreferenceEditForm = lazy(() =>
  import('../company-preference-edit-form').then((module) => ({
    default: module.CompanyPreferenceEditForm,
  }))
);

const CompanyPreferredEditForm = lazy(() =>
  import('../company-preferred-edit-form').then((module) => ({
    default: module.CompanyPreferredEditForm,
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
  import('../company-preference-edit-form');
};

const preloadPreferred = () => {
  import('../company-preferred-edit-form');
};

// ----------------------------------------------------------------------

const TAB_ITEMS = [
  {
    value: '',
    label: 'Profile',
    icon: <Icon width={24} icon="solar:user-id-bold" />,
  },
  {
    value: 'sites',
    label: 'Sites',
    icon: <Icon width={24} icon="solar:list-bold" />,
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

export function EditCompanyView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedTab = searchParams.get(TAB_PARAM) ?? '';

  const createRedirectPath = (currentPath: string, query: string) => {
    const queryString = new URLSearchParams({ [TAB_PARAM]: query }).toString();
    return query ? `${currentPath}?${queryString}` : currentPath;
  };

  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetcher(`${endpoints.management.company}/${id}`);
      return response.data.company;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Edit a customer"
          links={[{ name: 'Management' }, { name: 'Customer' }, { name: 'Edit' }]}
          sx={{ mb: { xs: 3, md: 5 }, p: 3 }}
        />
        <TabLoadingFallback />
      </DashboardContent>
    );
  }

  if (error) {
    console.error('Error fetching company:', error);
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Edit a customer"
          links={[{ name: 'Management' }, { name: 'Customer' }, { name: 'Edit' }]}
          sx={{ mb: { xs: 3, md: 5 }, p: 3 }}
        />
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h3>Error Loading Company</h3>
          <p>Failed to load company data. Please check your authentication and try again.</p>
          <p>Error: {error?.message || 'Unknown error'}</p>
        </div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit a customer"
        links={[{ name: 'Management' }, { name: 'Company' }, { name: 'Edit' }]}
        sx={{ mb: { xs: 3, md: 5 }, p: 3 }}
      />

      {data && (
        <Card sx={{ mb: 3, height: { xs: 290, md: 180 } }}>
          <CompanyProfileCover
            name={data.name}
            logoURL={data.logo_url}
            region={data.region}
            email={data.email}
            contactNumber={data.contact_number}
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

      {selectedTab === '' && data && <CompanyNewEditForm currentCompany={data} />}
      {selectedTab === 'sites' && data && <CompanySiteList companyId={data.id} />}
      {selectedTab === 'not-preferred' && data && (
        <Suspense fallback={<TabLoadingFallback />}>
          <CompanyPreferenceEditForm currentCompany={data} />
        </Suspense>
      )}
      {selectedTab === 'preferred' && data && (
        <Suspense fallback={<TabLoadingFallback />}>
          <CompanyPreferredEditForm currentCompany={data} />
        </Suspense>
      )}
    </DashboardContent>
  );
}
