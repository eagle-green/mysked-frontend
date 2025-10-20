import { CONFIG } from 'src/global-config';

import { MultiCreateJobView } from 'src/sections/work/job/view/job-create-view';

// ----------------------------------------------------------------------

const metadata = { title: `Create Job | Job - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <MultiCreateJobView />
    </>
  );
} 