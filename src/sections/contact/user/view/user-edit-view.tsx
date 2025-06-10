import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { UserNewEditForm } from 'src/sections/contact/user/user-new-edit-form';
// ----------------------------------------------------------------------

export function EditUserView() {
  const { id } = useParams<{ id: string }>();

  const { data } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      if (!id) return null;
      return fetcher(`${endpoints.user}/${id}`);
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
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <UserNewEditForm currentUser={data?.data?.user} />
    </DashboardContent>
  );
}
