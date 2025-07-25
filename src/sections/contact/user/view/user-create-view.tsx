import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { UserNewEditForm } from '../user-new-edit-form';

// ----------------------------------------------------------------------

export function CreateUserView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new employee"
        links={[
          { name: 'Management' },
          { name: 'Contact' },
          { name: 'Employee' },
          { name: 'Create' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <UserNewEditForm />
    </DashboardContent>
  );
}
