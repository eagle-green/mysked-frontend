import { CONFIG } from 'src/global-config';

import { TimeSheetEditView } from 'src/sections/schedule/timesheet/view/timesheet-edit-view';

// ----------------------------------------------------------------------

const metadata = { title: `Timesheet | My Schedule - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <TimeSheetEditView />
    </>
  );
}