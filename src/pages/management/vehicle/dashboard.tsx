import { CONFIG } from 'src/global-config';

import { VehicleDashboardView } from 'src/sections/management/vehicle/view';

// ----------------------------------------------------------------------

const metadata = { title: `Vehicle Dashboard | Management - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <VehicleDashboardView />
    </>
  );
}
