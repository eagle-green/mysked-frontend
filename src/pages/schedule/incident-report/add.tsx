import { CONFIG } from 'src/global-config';

import { WorkerAddIncidentReportView } from 'src/sections/schedule/incident-report/view/worker-add-incident-report-view';

// ----------------------------------------------------------------------

const metadata = { title: `Add Incident Report | My Schedule - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <WorkerAddIncidentReportView />
    </>
  );
}
