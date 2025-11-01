import { CONFIG } from 'src/global-config';

import { InventoryEditView } from 'src/sections/management/inventory/view';

// ----------------------------------------------------------------------

const metadata = { title: `Edit inventory | Management - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <InventoryEditView />
    </>
  );
}
