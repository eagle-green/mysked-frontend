import { CONFIG } from 'src/global-config';

import { MyVehicleView } from 'src/sections/management/vehicle/view/my-vehicle-view';

// ----------------------------------------------------------------------

const metadata = { title: `My Vehicle | Site - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <MyVehicleView />
    </>
  );
}

