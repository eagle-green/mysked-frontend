import { CONFIG } from 'src/global-config';

import { PreTripVehicleInspectionListView } from 'src/sections/schedule/pre-trip-vehicle/view/pre-trip-vehicle-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `Pre Trip Vehicle Inspection List | My Schedule - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <PreTripVehicleInspectionListView />
    </>
  );
}
