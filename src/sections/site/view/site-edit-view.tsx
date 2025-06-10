import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SiteNewEditForm } from 'src/sections/site/site-new-edit-form';
// ----------------------------------------------------------------------

export function EditSiteView() {
  const { id } = useParams<{ id: string }>();

  const { data } = useQuery({
    queryKey: ['site', id],
    queryFn: async () => {
      if (!id) return null;
      return fetcher(`${endpoints.site}/${id}`);
    },
    enabled: !!id,
  });

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit a site"
        links={[{ name: 'Management' }, { name: 'Site' }, { name: 'Edit' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      {data?.data?.site && <SiteNewEditForm currentSite={data?.data?.site} />}
    </DashboardContent>
  );
}
