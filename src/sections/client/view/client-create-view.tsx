import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ClientNewEditForm } from '../client-new-edit-form';

// ----------------------------------------------------------------------

export function ClientCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new client"
        links={[{ name: 'Contact' }, { name: 'Client' }, { name: 'Create Client' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ClientNewEditForm />
    </DashboardContent>
  );
}
