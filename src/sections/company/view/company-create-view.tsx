import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CompanyNewEditForm } from '../company-new-edit-form';

// ----------------------------------------------------------------------

export function CreateCompanyView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new company"
        links={[
          { name: 'Management' },
          { name: 'Company' },
          { name: 'Create' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CompanyNewEditForm />
    </DashboardContent>
  );
}
