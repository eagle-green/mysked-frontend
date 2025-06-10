import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ClientNewEditForm } from 'src/sections/contact/client/client-new-edit-form';
// ----------------------------------------------------------------------

export function EditClientView() {
  const { id } = useParams<{ id: string }>();

  const { data } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      if (!id) return null;
      return fetcher(`${endpoints.client}/${id}`);
    },
    enabled: !!id,
  });
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit a client"
        links={[{ name: 'Management' }, { name: 'Contact' }, { name: 'Client' }, { name: 'Edit' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {data?.data?.client && <ClientNewEditForm currentClient={data?.data?.client} />}
    </DashboardContent>
  );
}
