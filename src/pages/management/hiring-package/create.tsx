import { CONFIG } from 'src/global-config';

import { HiringPackageCreateView } from 'src/sections/management/hiring-package/view/hiring-package-create-view';
// ----------------------------------------------------------------------

const metadata = { title: `Hiring Package | Create - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <HiringPackageCreateView />
    </>
  );
}
