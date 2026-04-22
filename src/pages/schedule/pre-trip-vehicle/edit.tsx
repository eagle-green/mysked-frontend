import { CONFIG } from 'src/global-config';

import { PreTripVehicleEditView } from 'src/sections/schedule/pre-trip-vehicle/view/pre-trip-vehicle-edit-view';

// ----------------------------------------------------------------------

const metadata = { title: `Pre Trip Vehicle Inspection Edit | My Schedule - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <PreTripVehicleEditView />
    </>
  );
}
