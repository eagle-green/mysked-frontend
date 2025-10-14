import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SiteNewEditForm } from '../site-new-edit-form';

// ----------------------------------------------------------------------

export function SiteCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new site"
        links={[
          { name: 'Management' },
          { name: 'Customer' },
          { name: 'Site' },
          { name: 'Create' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <SiteNewEditForm />
    </DashboardContent>
  );
} 