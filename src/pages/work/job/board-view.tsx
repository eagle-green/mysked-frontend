import { CONFIG } from 'src/global-config';

import { JobBoardView } from 'src/sections/work/job/view';
// ----------------------------------------------------------------------

const metadata = { title: `Job Board View | Job - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <JobBoardView />
    </>
  );
}



