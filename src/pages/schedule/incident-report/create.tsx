import { CONFIG } from 'src/global-config';

import { CreateIncidentReportView } from 'src/sections/schedule/incident-report/view/incident-report-create';

// ----------------------------------------------------------------------

const metadata = { title: `Incident Report | My Schedule - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <CreateIncidentReportView />
    </>
  );
}
