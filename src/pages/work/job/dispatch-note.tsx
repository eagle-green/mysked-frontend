import { CONFIG } from 'src/global-config';

import { JobDispatchNoteView } from 'src/sections/work/job/view/job-dispatch-note-view';

// ----------------------------------------------------------------------

const metadata = { title: `Dispatch Note | Job - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <JobDispatchNoteView />
    </>
  );
}
