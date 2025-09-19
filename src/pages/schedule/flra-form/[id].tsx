import { CONFIG } from 'src/global-config';

import { FlraDetailView } from 'src/sections/schedule/flra/view/flra-detail-view';

// ----------------------------------------------------------------------

const metadata = { title: `FLRA Detail | My Schedule - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <FlraDetailView />
    </>
  );
}
