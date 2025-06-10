import { CONFIG } from 'src/global-config';

import { EditClientView } from 'src/sections/contact/client/view/client-edit-view';

// ----------------------------------------------------------------------

const metadata = { title: `Edit a client | Client - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <EditClientView />
    </>
  );
}
