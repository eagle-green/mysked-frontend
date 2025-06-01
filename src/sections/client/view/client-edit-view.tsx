import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ClientNewEditForm } from 'src/sections/client/client-new-edit-form';
// ----------------------------------------------------------------------

export function EditClientView() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      if (!id) return null;
      return fetcher(`${endpoints.client}/${id}`);
    },
    enabled: !!id,
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError || !data) return <div>Something went wrong.</div>;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit a client"
        links={[{ name: 'Management' }, { name: 'Client' }, { name: 'Edit Client' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ClientNewEditForm currentClient={data.data.client} />
    </DashboardContent>
  );
}
