import { CONFIG } from 'src/global-config';

import { InventoryCreateView } from 'src/sections/management/inventory/view';

// ----------------------------------------------------------------------

const metadata = { title: `Create inventory | Management - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <InventoryCreateView />
    </>
  );
}
