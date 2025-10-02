import { CONFIG } from 'src/global-config';

import { EditOpenJobView } from 'src/sections/work/open-job/view';

// ----------------------------------------------------------------------

const metadata = { title: `Edit open job | Work - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <EditOpenJobView />
    </>
  );
}

