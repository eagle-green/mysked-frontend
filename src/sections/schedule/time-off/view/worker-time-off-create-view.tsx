import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { WorkerTimeOffNewEditForm } from '../worker-time-off-new-edit-form';

// ----------------------------------------------------------------------

export function WorkerTimeOffCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create Time Off Request"
        links={[
          { name: 'My Schedule', href: paths.schedule.root },
          { name: 'Time Off Request', href: paths.schedule.timeOff.list },
          { name: 'Create' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <WorkerTimeOffNewEditForm />
    </DashboardContent>
  );
}
