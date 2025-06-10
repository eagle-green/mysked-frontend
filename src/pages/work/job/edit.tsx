import { CONFIG } from 'src/global-config';

import { EditJobView } from 'src/sections/work/job/view/job-edit-view';

// ----------------------------------------------------------------------

const metadata = { title: `Edit a job | Job - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <EditJobView />
    </>
  );
}
