import { CONFIG } from 'src/global-config';

import { AdminTimesheetEditView } from 'src/sections/work/timesheet/view/admin-timesheet-edit-view';

// ----------------------------------------------------------------------

const metadata = { title: `Timesheet | Work Management - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <AdminTimesheetEditView />
    </>
  );
}
