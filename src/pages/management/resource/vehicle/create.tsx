import { CONFIG } from 'src/global-config';

import { CreateVehicleView } from 'src/sections/resource/vehicle/view/vehicle-create-view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new site | Site - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <CreateVehicleView />
    </>
  );
}
