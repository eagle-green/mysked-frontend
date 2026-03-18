import { CONFIG } from 'src/global-config';

import { AttendanceConductReportDashboardView } from 'src/sections/management/attendance-conduct-report/view/attendance-conduct-report-dashboard-view';

// ----------------------------------------------------------------------

const metadata = { title: `Attendance & Conduct Report — Dashboard | Management - ${CONFIG.appName}` };

export default function AttendanceConductReportDashboardPage() {
  return (
    <>
      <title>{metadata.title}</title>
      <AttendanceConductReportDashboardView />
    </>
  );
}
