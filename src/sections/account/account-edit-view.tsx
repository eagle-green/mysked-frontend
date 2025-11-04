import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';
import { lazy, useMemo, useState, Suspense } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import { Badge } from '@mui/material';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProfileCover } from 'src/sections/management/user/profile-cover';
import { UserNewEditForm } from 'src/sections/management/user/user-new-edit-form';

import { useAuthContext } from 'src/auth/hooks';

// Lazy load the certifications form
const UserCertificationsEditForm = lazy(() =>
  import('src/sections/management/user/user-certifications-edit-form').then((module) => ({
    default: module.UserCertificationsEditForm,
  }))
);

// Lazy load the job history tab
const AccountJobHistoryTab = lazy(() =>
  import('./account-job-history-tab').then((module) => ({
    default: module.AccountJobHistoryTab,
  }))
);

// Loading component for Suspense fallback
const TabLoadingFallback = () => (
  <Card sx={{ p: 3 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      <Box sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: 'grey.300' }} />
      <Box sx={{ flex: 1 }}>
        <Box sx={{ width: '60%', height: 20, bgcolor: 'grey.300', borderRadius: 1, mb: 1 }} />
        <Box sx={{ width: '40%', height: 16, bgcolor: 'grey.300', borderRadius: 1 }} />
      </Box>
    </Box>
    <Box sx={{ width: '100%', height: 200, bgcolor: 'grey.300', borderRadius: 1 }} />
  </Card>
);

// ----------------------------------------------------------------------

// Certification requirements for each role
const CERTIFICATION_REQUIREMENTS: Record<string, string[]> = {
  tcp: ['tcp_certification'],
  lct: ['tcp_certification', 'driver_license'],
  hwy: ['tcp_certification', 'driver_license'],
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

// Function to check certification status
const checkCertificationStatus = (user: any) => {
  const requirements = CERTIFICATION_REQUIREMENTS[user.role?.toLowerCase()];

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

  return {
    hasIssues: missing.length > 0 || expired.length > 0,
    missing,
    expired,
    expiringSoon,
  };
};

const TAB_ITEMS = [
  {
    value: 'profile',
    label: 'Profile',
    icon: <Icon width={24} icon="solar:user-id-bold" />,
  },
  {
    value: 'job-history',
    label: 'Job History',
    icon: <Icon width={24} icon="solar:history-bold" />,
  },
  {
    value: 'certifications',
    label: 'Certifications',
    icon: <Icon width={24} icon="fa:drivers-license" />,
  },
];

export function AccountEditView() {
  const { user } = useAuthContext();
  const [currentTab, setCurrentTab] = useState('profile');
  
  const { data, refetch } = useQuery({
    queryKey: ['user', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return fetcher(`${endpoints.management.user}/${user.id}`);
    },
    enabled: !!user?.id,
  });

  const userData = data?.data?.user;

  // Check certification status
  const certificationStatus = useMemo(() => {
    if (!userData) return { hasIssues: false, missing: [], expired: [] };
    return checkCertificationStatus(userData);
  }, [userData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs heading="Profile" sx={{ mb: { xs: 3, md: 5 } }} />

      {/* Profile Cover - matching user management style */}
      {userData && (
        <Card sx={{ mb: 3, height: { xs: 290, md: 180 } }}>
          <ProfileCover
            role={userData.role}
            firstName={userData.first_name}
            lastName={userData.last_name}
            photoURL={userData.photo_url}
            phone_number={userData.phone_number}
            email={userData.email}
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
            <Tabs value={currentTab} onChange={handleTabChange}>
              {TAB_ITEMS.map((tab) => (
                <Tab
                  key={tab.value}
                  value={tab.value}
                  icon={
                    tab.value === 'certifications' && certificationStatus.hasIssues ? (
                      <Badge
                        badgeContent="!"
                        color={certificationStatus.expired.length > 0 ? 'error' : 'warning'}
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
                />
              ))}
            </Tabs>
          </Box>
        </Card>
      )}

      {/* Tab Content */}
      {currentTab === 'profile' && (
        <UserNewEditForm currentUser={userData} isAccountEdit />
      )}

      {currentTab === 'job-history' && userData && (
        <Suspense fallback={<TabLoadingFallback />}>
          <AccountJobHistoryTab userId={userData.id} />
        </Suspense>
      )}
      
      {currentTab === 'certifications' && userData && (
        <Suspense fallback={<TabLoadingFallback />}>
          <UserCertificationsEditForm currentUser={userData} refetchUser={refetch} />
        </Suspense>
      )}
    </DashboardContent>
  );
}
