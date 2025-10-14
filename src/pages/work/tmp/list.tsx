import { CONFIG } from 'src/global-config';

import { AdminTmpListView } from 'src/sections/work/tmp/view/admin-tmp-list-view';
// ----------------------------------------------------------------------

const metadata = { title: `Traffic Management Plan List | Job - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <AdminTmpListView />
    </>
  );
}
