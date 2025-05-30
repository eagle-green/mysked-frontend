import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { JobNewEditForm } from '../job-new-edit-form';

// ----------------------------------------------------------------------

export function CreateJobView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new job"
        links={[{ name: 'Work Management' }, { name: 'Job' }, { name: 'Create Job' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <JobNewEditForm />
    </DashboardContent>
  );
}
