import { CONFIG } from 'src/global-config';

import { CreateJobView } from 'src/sections/work/job/view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new job | Job - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <CreateJobView />
    </>
  );
}
