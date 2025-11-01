import { CONFIG } from 'src/global-config';

import { InventoryListView } from 'src/sections/management/inventory/view';

// ----------------------------------------------------------------------

const metadata = { title: `Inventory List | Site - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <InventoryListView />
    </>
  );
}
