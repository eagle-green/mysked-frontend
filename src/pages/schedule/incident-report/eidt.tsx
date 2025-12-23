import { CONFIG } from 'src/global-config';

import { EditIncidentReportView } from 'src/sections/schedule/incident-report/view/incident-report-edit';

// ----------------------------------------------------------------------

const metadata = { title: `Incident Report | My Schedule - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <EditIncidentReportView />
    </>
  );
}
