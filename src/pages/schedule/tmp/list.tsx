import { CONFIG } from 'src/global-config';

import { TmpListView } from 'src/sections/schedule/tmp/view/tmp-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `TMP | My Schedule - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <TmpListView />
    </>
  );
}


