import { useQuery } from '@tanstack/react-query';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { UserNewEditForm } from 'src/sections/contact/user/user-new-edit-form';

import { useAuthContext } from 'src/auth/hooks';
// ----------------------------------------------------------------------

export function AccountEditView() {
  const { user } = useAuthContext();
  const { data } = useQuery({
    queryKey: ['user', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return fetcher(`${endpoints.user}/${user.id}`);
    },
    enabled: !!user?.id,
  });
  return (
    <DashboardContent>
      <CustomBreadcrumbs heading="Profile" sx={{ mb: { xs: 3, md: 5 } }} />

      <UserNewEditForm currentUser={data?.data?.user} />
    </DashboardContent>
  );
}
