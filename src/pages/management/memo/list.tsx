import { CONFIG } from 'src/global-config';

import { CompanyWideMemoListView } from 'src/sections/management/memo/view/memo-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `Company Wide Memo | Management - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <CompanyWideMemoListView />
    </>
  );
}
