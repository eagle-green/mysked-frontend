import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ClientNewEditForm } from '../client-new-edit-form';

// ----------------------------------------------------------------------

export function ClientCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new client"
        links={[
          { name: 'Management' },
          { name: 'Contact' },
          { name: 'Client' },
          { name: 'Create' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ClientNewEditForm />
    </DashboardContent>
  );
}
