import { useParams } from 'react-router';
import { lazy, useMemo, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import { Badge } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';

import { RouterLink } from 'src/routes/components';
import { usePathname, useSearchParams } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { UserNewEditForm } from 'src/sections/contact/user/user-new-edit-form';

import { ProfileCover } from '../profile-cover';

// ----------------------------------------------------------------------

// Certification requirements for each role
const CERTIFICATION_REQUIREMENTS: Record<string, string[]> = {
  'tcp': ['tcp_certification'],
  'lct': ['tcp_certification', 'driver_license'],
  'field supervisor': ['tcp_certification', 'driver_license'],
};

// Function to check if a certification is valid (not expired)
const isCertificationValid = (expiryDate: string | null | undefined): boolean => {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  return expiry >= today;
};

// Function to check certification status
const checkCertificationStatus = (user: any) => {
  const requirements = CERTIFICATION_REQUIREMENTS[user.role?.toLowerCase()];
  
  if (!requirements) {
    return { hasIssues: false, missing: [], expired: [] };
  }

  const missing: string[] = [];
  const expired: string[] = [];
  
  if (requirements.includes('tcp_certification')) {
    if (!user.tcp_certification_expiry) {
      missing.push('TCP Certification');
    } else if (!isCertificationValid(user.tcp_certification_expiry)) {
      expired.push('TCP Certification');
    }
  }
  
  if (requirements.includes('driver_license')) {
    if (!user.driver_license_expiry) {
      missing.push('Driver License');
    } else if (!isCertificationValid(user.driver_license_expiry)) {
      expired.push('Driver License');
    }
  }

  return {
    hasIssues: missing.length > 0 || expired.length > 0,
    missing,
    expired,
  };
};

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
const UserCertificationsEditForm = lazy(() =>
  import('../user-certifications-edit-form').then((module) => ({
    default: module.UserCertificationsEditForm,
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

const preloadCertifications = () => {
  import('../user-certifications-edit-form').then(module => {
    // Preload the UserAssetsUpload component as well
    import('../user-assets-upload');
  });
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
  {
    value: 'certifications',
    label: 'Certifications',
    icon: <Iconify width={24} icon="solar:pen-bold" />,
    onMouseEnter: preloadCertifications,
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

  // Check certification status
  const certificationStatus = useMemo(() => {
    if (!data?.user) return { hasIssues: false, missing: [], expired: [] };
    return checkCertificationStatus(data.user);
  }, [data?.user]);

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
                  icon={
                    tab.value === 'certifications' && certificationStatus.hasIssues ? (
                      <Badge
                        badgeContent="!"
                        color="error"
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            minWidth: '16px',
                            height: '16px',
                          },
                        }}
                      >
                        {tab.icon}
                      </Badge>
                    ) : (
                      tab.icon
                    )
                  }
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
      {selectedTab === 'certifications' && data?.user && (
        <Suspense fallback={<TabLoadingFallback />}>
          <UserCertificationsEditForm currentUser={data?.user} />
        </Suspense>
      )}
      {/* {data?.data?.user && <UserNewEditForm currentUser={data?.data?.user} />} */}
    </DashboardContent>
  );
}
