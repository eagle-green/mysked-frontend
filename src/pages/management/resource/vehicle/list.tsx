import { CONFIG } from 'src/global-config';

import { VehicleListView } from 'src/sections/resource/vehicle/view';

// ----------------------------------------------------------------------

const metadata = { title: `Site List | Site - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <VehicleListView />
    </>
  );
}
