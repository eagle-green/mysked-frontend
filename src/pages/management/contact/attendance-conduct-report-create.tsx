import { CONFIG } from 'src/global-config';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { AttendanceConductReportCreateView } from 'src/sections/management/attendance-conduct-report/view/attendance-conduct-report-create-view';

// ----------------------------------------------------------------------

const metadata = { title: `Create Report | Attendance & Conduct Report - ${CONFIG.appName}` };

export default function AttendanceConductReportCreatePage() {
  return (
    <>
      <title>{metadata.title}</title>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Create Report"
          links={[
            { name: 'Management', href: paths.management.root },
            { name: 'Employee', href: paths.management.user.list },
            { name: 'Attendance & Conduct Report', href: paths.management.user.attendanceConductReport },
            { name: 'Create' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <AttendanceConductReportCreateView />
      </DashboardContent>
    </>
  );
}
