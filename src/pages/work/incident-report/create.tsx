import { CONFIG } from 'src/global-config';

import { AdminCreateIncidentReportView } from 'src/sections/work/incident-report/view/admin-create-incident-report-view';

// ----------------------------------------------------------------------

const metadata = { title: `Create Incident Report | Work Management - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <AdminCreateIncidentReportView />
    </>
  );
}
