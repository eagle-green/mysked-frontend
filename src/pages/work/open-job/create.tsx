import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { JobMultiCreateForm } from 'src/sections/work/open-job';

// ----------------------------------------------------------------------

export default function CreateOpenJobPage() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create Open Job"
        links={[
          { name: 'Dashboard', href: '/' },
          { name: 'Work', href: '/works' },
          { name: 'Open Job', href: '/works/open-jobs/list' },
          { name: 'Create' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <JobMultiCreateForm />
    </DashboardContent>
  );
}
