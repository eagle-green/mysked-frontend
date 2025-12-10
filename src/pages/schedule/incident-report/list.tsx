import { CONFIG } from 'src/global-config';

import { IncidentReportListView } from 'src/sections/schedule/incident-report/view/incident-report-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `Incident Report | My Schedule - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <IncidentReportListView />
    </>
  );
}
