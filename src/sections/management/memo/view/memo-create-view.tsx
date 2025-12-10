import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard/content';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { CreateCompanyWideMemoForm } from '../memo-create-form';

//-------------------------------------------------------------------------------

export function CreateCompanyWideMemoView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create Company Wide Memo"
        links={[{ name: 'Management', href: paths.management.root }, { name: 'Create Memo' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CreateCompanyWideMemoForm />
    </DashboardContent>
  );
}
