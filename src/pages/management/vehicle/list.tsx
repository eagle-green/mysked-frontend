import { CONFIG } from 'src/global-config';

import { VehicleListView } from 'src/sections/management/vehicle/view';

// ----------------------------------------------------------------------

const metadata = { title: `Vehicle List | Site - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <VehicleListView />
    </>
  );
}
