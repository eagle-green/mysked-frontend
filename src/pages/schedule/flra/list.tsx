import { CONFIG } from 'src/global-config';

import FlraListView from 'src/sections/schedule/flra/view/flra-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `FLRA | My Schedule - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <FlraListView />
    </>
  );
}
