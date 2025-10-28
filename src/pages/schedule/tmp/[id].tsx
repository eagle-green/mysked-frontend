import { CONFIG } from 'src/global-config';

import { TmpDetailView } from 'src/sections/schedule/tmp/view/tmp-detail-view';

// ----------------------------------------------------------------------

const metadata = { title: `TMP Detail | My Schedule - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <TmpDetailView />
    </>
  );
}


