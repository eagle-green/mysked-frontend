import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SiteNewEditForm } from 'src/sections/site/site-new-edit-form';
// ----------------------------------------------------------------------

export function EditSiteView() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['site', id],
    queryFn: async () => {
      if (!id) return null;
      return fetcher(`${endpoints.site}/${id}`);
    },
    enabled: !!id,
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError || !data) return <div>Something went wrong.</div>;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit a site"
        links={[{ name: 'Management' }, { name: 'Site' }, { name: 'Edit Site' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <SiteNewEditForm currentSite={data.site} />
    </DashboardContent>
  );
}
