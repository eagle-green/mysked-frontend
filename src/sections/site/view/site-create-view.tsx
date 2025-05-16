import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SiteNewEditForm } from '../site-new-edit-form';

// ----------------------------------------------------------------------

export function CreateSiteView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new site"
        links={[{ name: 'Site' }, { name: 'Create Site' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <SiteNewEditForm />
    </DashboardContent>
  );
}
