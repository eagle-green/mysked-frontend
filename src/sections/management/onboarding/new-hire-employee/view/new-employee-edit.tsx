import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard/content';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { NewEmployeeEditForm } from '../new-employee-edit';

export function NewEmployeeEditView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="New Employee Edit"
        links={[{ name: 'Management', href: paths.management.root }, { name: 'New Employee Edit' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <NewEmployeeEditForm />
    </DashboardContent>
  );
}
