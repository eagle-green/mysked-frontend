import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard/content';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { NewEmployeeEditForm } from '../new-employee-edit';

export function NewEmployeeEditView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Hiring package"
        links={[
          { name: 'Management', href: paths.management.root },
          { name: 'Employee', href: paths.management.user.root },
          { name: 'Hiring packages', href: paths.management.user.onboarding.list },
          { name: 'Edit' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <NewEmployeeEditForm />
    </DashboardContent>
  );
}
