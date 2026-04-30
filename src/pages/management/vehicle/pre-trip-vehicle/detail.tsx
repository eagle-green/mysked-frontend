import { CONFIG } from 'src/global-config';

import { AdminPreTripVehicleDetailView } from 'src/sections/management/vehicle/admin-pre-trip-vehicle/view/pre-trip-vehicle-detail-view';

// ----------------------------------------------------------------------

const metadata = { title: `Pre Trip Vehicle | Management - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <AdminPreTripVehicleDetailView />
    </>
  );
}
