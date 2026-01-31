import { CONFIG } from 'src/global-config';

import { JobDashboardView } from 'src/sections/work/job/view/job-dashboard-view';

// ----------------------------------------------------------------------

const metadata = { title: `Job Dashboard | Work Management - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <JobDashboardView />
    </>
  );
}
