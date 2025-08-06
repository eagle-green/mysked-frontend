import { CONFIG } from 'src/global-config';

import { AdminTimesheetListView } from 'src/sections/work/timesheet/view';

// ----------------------------------------------------------------------

const metadata = { title: `Timesheet | Management - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <AdminTimesheetListView />
    </>
  );
}
