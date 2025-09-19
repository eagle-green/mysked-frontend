import { CONFIG } from 'src/global-config';

import AdminFlraListView from 'src/sections/work/flra/view/admin-flra-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `FLRA List | Work Management - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <AdminFlraListView />
    </>
  );
}
