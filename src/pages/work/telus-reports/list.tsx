import { CONFIG } from 'src/global-config';

import { TelusReportsListView } from 'src/sections/work/telus-reports/view/telus-reports-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `TELUS Reports | Work Management - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <TelusReportsListView />
    </>
  );
}
