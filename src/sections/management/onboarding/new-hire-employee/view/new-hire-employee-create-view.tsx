import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard/content';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { NewHireEmployeeInformationForm } from '../new-hire-employee-form';

export function NewHireEmployeeCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="New Hire Employee Onboarding"
        links={[{ name: 'Management', href: paths.management.root }, { name: 'New Hire Employee' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <NewHireEmployeeInformationForm />
    </DashboardContent>
  );
}
