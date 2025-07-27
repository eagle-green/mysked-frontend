import { CONFIG } from 'src/global-config';

import { ClientListView } from 'src/sections/management/client/view/client-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `Employee | Contact - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <ClientListView />
    </>
  );
}
