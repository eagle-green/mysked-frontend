import { CONFIG } from 'src/global-config';

import { WorkerCalendarView } from 'src/sections/schedule/calendar/view/calendar-view';

// ----------------------------------------------------------------------

const metadata = { title: `Calendar | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <WorkerCalendarView />
    </>
  );
}
