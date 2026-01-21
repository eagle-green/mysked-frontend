import { CONFIG } from 'src/global-config';

import { HiringPackageListView } from 'src/sections/management/hiring-package/view/hiring-package-list-view';
// ----------------------------------------------------------------------

const metadata = { title: `Hiring Package | List - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <HiringPackageListView />
    </>
  );
}
