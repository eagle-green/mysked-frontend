import { CONFIG } from 'src/global-config';

import { JobListView } from 'src/sections/work/job/view';
// ----------------------------------------------------------------------

const metadata = { title: `Job List | Job - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <JobListView />
    </>
  );
}
