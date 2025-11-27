import { CONFIG } from 'src/global-config';

import MissingTimecardsListView from 'src/sections/schedule/missing-timecards/view/missing-timecards-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `Missing Timesheets | Management - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <MissingTimecardsListView />
    </>
  );
}

