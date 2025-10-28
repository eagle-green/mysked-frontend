import { Icon } from '@iconify/react';
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

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { UserNewEditForm } from 'src/sections/management/user/user-new-edit-form';

import { ProfileCover } from '../profile-cover';

// ----------------------------------------------------------------------

// Certification requirements for each role
const CERTIFICATION_REQUIREMENTS: Record<string, string[]> = {
  tcp: ['tcp_certification'],
  lct: ['tcp_certification', 'driver_license'],
  hwy: ['tcp_certification', 'driver_license'],
  'lct/tcp': ['tcp_certification', 'driver_license'],
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

// Function to check if a certification expires within 30 days and return days remaining
const getCertificationExpiringSoon = (expiryDate: string | null | undefined): { isExpiringSoon: boolean; daysRemaining: number } => {
  if (!expiryDate) return { isExpiringSoon: false, daysRemaining: 0 };
  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  expiry.setHours(0, 0, 0, 0); // Reset time to start of day
  
  const timeDiff = expiry.getTime() - today.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  return {
    isExpiringSoon: daysRemaining >= 0 && daysRemaining <= 30,
    daysRemaining,
  };
};

// Function to check certification status - updated to match user-table-row logic
const checkCertificationStatus = (user: any) => {
  // Normalize role to handle variations
  const normalizedRole = user.role?.toLowerCase().trim();
  const requirements = CERTIFICATION_REQUIREMENTS[normalizedRole];

  if (!requirements) {
    return { hasIssues: false, missing: [], expired: [], expiringSoon: [] };
  }

  const missing: string[] = [];
  const expired: string[] = [];
  const expiringSoon: Array<{ name: string; daysRemaining: number }> = [];

  if (requirements.includes('tcp_certification')) {
    if (!user.tcp_certification_expiry) {
      missing.push('TCP Certification');
    } else if (!isCertificationValid(user.tcp_certification_expiry)) {
      expired.push('TCP Certification');
    } else {
      const expiringInfo = getCertificationExpiringSoon(user.tcp_certification_expiry);
      if (expiringInfo.isExpiringSoon) {
        expiringSoon.push({ name: 'TCP Certification', daysRemaining: expiringInfo.daysRemaining });
      }
    }
  }

  if (requirements.includes('driver_license')) {
    if (!user.driver_license_expiry) {
      missing.push('Driver License');
    } else if (!isCertificationValid(user.driver_license_expiry)) {
      expired.push('Driver License');
    } else {
      const expiringInfo = getCertificationExpiringSoon(user.driver_license_expiry);
      if (expiringInfo.isExpiringSoon) {
        expiringSoon.push({ name: 'Driver License', daysRemaining: expiringInfo.daysRemaining });
      }
    }
  }

  // Check if there are any issues (missing, expired, or expiring soon)
  const hasIssues = missing.length > 0 || expired.length > 0 || expiringSoon.length > 0;

  return {
    hasIssues,
    missing,
    expired,
    expiringSoon,
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
const UserPreferredEditForm = lazy(() =>
  import('../user-preferred-edit-form').then((module) => ({
    default: module.UserPreferredEditForm,
  }))
);
const UserCertificationsEditForm = lazy(() =>
  import('../user-certifications-edit-form').then((module) => ({
    default: module.UserCertificationsEditForm,
  }))
);
const UserAvailabilityEditForm = lazy(() =>
  import('../user-availability-edit-form').then((module) => ({
    default: module.UserAvailabilityEditForm,
  }))
);
const UserOrientationEditForm = lazy(() =>
  import('../user-orientation-edit-form').then((module) => ({
    default: module.UserOrientationEditForm,
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

const preloadPreferred = () => {
  import('../user-preferred-edit-form');
};

const preloadCertifications = () => {
  import('../user-certifications-edit-form').then((module) => {
    // Preload the UserAssetsUpload component as well
    import('../user-assets-upload');
  });
};

const preloadAvailability = () => {
  import('../user-availability-edit-form');
};

const preloadOrientation = () => {
  import('../user-orientation-edit-form');
};

// ----------------------------------------------------------------------

const TAB_ITEMS = [
  {
    value: '',
    label: 'Profile',
    icon: <Icon width={24} icon="solar:user-id-bold" />,
  },
  {
    value: 'performance',
    label: 'Performance',
    icon: <Icon width={24} icon="mdi:performance" />,
    onMouseEnter: preloadPerformance,
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
  {
    value: 'certifications',
    label: 'Certifications',
    icon: <Icon width={24} icon="fa:drivers-license" />,
    onMouseEnter: preloadCertifications,
  },
  {
    value: 'orientation',
    label: 'Orientation',
    icon: <Icon width={24} icon="solar:notebook-bold" />,
    onMouseEnter: preloadOrientation,
  },
  {
    value: 'availability',
    label: 'Availability',
    icon: <Icon width={24} icon="solar:calendar-bold" />,
    onMouseEnter: preloadAvailability,
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

  const { data, refetch } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetcher(`${endpoints.management.user}/${id}`);
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
              px: { xs: 0, md: 3 },
              display: 'flex',
              position: 'absolute',
              bgcolor: 'background.paper',
              justifyContent: { xs: 'center', md: 'flex-end' },
            }}
          >
            <Tabs 
              value={selectedTab}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                maxWidth: { xs: '100%', md: 'calc(100% - 200px)' }, // Reserve space for profile picture
              }}
            >
              {TAB_ITEMS.map((tab) => (
                <Tab
                  component={RouterLink}
                  key={tab.value}
                  value={tab.value}
                  icon={
                    tab.value === 'certifications' && certificationStatus?.hasIssues ? (
                      <Badge
                        badgeContent="!"
                        color={
                          certificationStatus.expired.length > 0 
                            ? 'error' 
                            : (certificationStatus as any).expiringSoon?.some((cert: { name: string; daysRemaining: number }) => cert.daysRemaining <= 15)
                              ? 'error'
                              : 'warning'
                        }
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
      {selectedTab === 'not-preferred' && data?.user && (
        <Suspense fallback={<TabLoadingFallback />}>
          <UserPreferenceEditForm currentData={data?.user} />
        </Suspense>
      )}
      {selectedTab === 'preferred' && data?.user && (
        <Suspense fallback={<TabLoadingFallback />}>
          <UserPreferredEditForm currentData={data?.user} />
        </Suspense>
      )}
      {selectedTab === 'certifications' && data?.user && (
        <Suspense fallback={<TabLoadingFallback />}>
          <UserCertificationsEditForm currentUser={data?.user} refetchUser={refetch} />
        </Suspense>
      )}
      {selectedTab === 'orientation' && data?.user && (
        <Suspense fallback={<TabLoadingFallback />}>
          <UserOrientationEditForm currentUser={data?.user} refetchUser={refetch} />
        </Suspense>
      )}
      {selectedTab === 'availability' && data?.user && (
        <Suspense fallback={<TabLoadingFallback />}>
          <UserAvailabilityEditForm currentUser={data?.user} />
        </Suspense>
      )}
      {/* {data?.data?.user && <UserNewEditForm currentUser={data?.data?.user} />} */}
    </DashboardContent>
  );
}
