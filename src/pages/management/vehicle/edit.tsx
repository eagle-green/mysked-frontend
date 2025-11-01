import { CONFIG } from 'src/global-config';

import { EditVehicleView } from 'src/sections/management/vehicle/view/vehicle-edit-view';

// ----------------------------------------------------------------------

const metadata = { title: `Edit a vehicle | Site - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <EditVehicleView />
    </>
  );
}
