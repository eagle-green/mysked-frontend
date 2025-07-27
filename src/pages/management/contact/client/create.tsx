import { CONFIG } from 'src/global-config';

import { ClientCreateView } from 'src/sections/management/client/view/client-create-view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new employee | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <ClientCreateView />
    </>
  );
}
