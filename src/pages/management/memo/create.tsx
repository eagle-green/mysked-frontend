import { CONFIG } from 'src/global-config';

import { CreateCompanyWideMemoView } from 'src/sections/management/memo/view/memo-create-view';

// ----------------------------------------------------------------------

const metadata = { title: `Company Wide Memo | Management - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <CreateCompanyWideMemoView />
    </>
  );
}
