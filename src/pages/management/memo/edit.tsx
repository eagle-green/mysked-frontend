import { CONFIG } from 'src/global-config';

import { EditCompanyWideMemoView } from 'src/sections/management/memo/view/memo-edit-view';

// ----------------------------------------------------------------------

const metadata = { title: `Company Wide Memo | Management - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <EditCompanyWideMemoView />
    </>
  );
}
