import { CONFIG } from 'src/global-config';

import { AccountEditView } from 'src/sections/account/account-edit-view';

// ----------------------------------------------------------------------

const metadata = { title: `Edit a vehicle | Site - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <AccountEditView />
    </>
  );
}
