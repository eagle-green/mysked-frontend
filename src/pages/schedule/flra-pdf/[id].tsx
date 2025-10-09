import { CONFIG } from 'src/global-config';

import { FlraPdfView } from 'src/sections/schedule/flra/view/flra-pdf-view';

// ----------------------------------------------------------------------

const metadata = { title: `FLRA PDF | My Schedule - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <FlraPdfView />
    </>
  );
}


