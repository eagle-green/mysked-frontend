import { CONFIG } from 'src/global-config';

import { AdminIncidentReportListView } from 'src/sections/work/incident-report/view/admin-incident-report-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `Incident Report | Work Management - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <AdminIncidentReportListView />
    </>
  );
}
