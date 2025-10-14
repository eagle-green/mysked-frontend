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
          { name: 'Work Management' },
          { name: 'Open Job' },
          { name: 'Create' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <JobMultiCreateForm />
    </DashboardContent>
  );
}
