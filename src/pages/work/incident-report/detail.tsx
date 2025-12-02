import { CONFIG } from 'src/global-config';

import { DetailIncidentReportView } from 'src/sections/work/incident-report/view/admin-incident-report-detail-view';

// ----------------------------------------------------------------------

const metadata = { title: `Incident Report | Work Management - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <DetailIncidentReportView />
    </>
  );
}
