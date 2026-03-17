import { CONFIG } from 'src/global-config';

import { AttendanceConductReportListView } from 'src/sections/management/attendance-conduct-report/view/attendance-conduct-report-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `Attendance & Conduct Report | Management - ${CONFIG.appName}` };

export default function AttendanceConductReportPage() {
  return (
    <>
      <title>{metadata.title}</title>
      <AttendanceConductReportListView />
    </>
  );
}
