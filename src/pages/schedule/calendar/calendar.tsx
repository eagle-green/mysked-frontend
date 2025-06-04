import { CONFIG } from 'src/global-config';

import { CalendarView } from 'src/sections/work/calendar/view';

// ----------------------------------------------------------------------

const metadata = { title: `Calendar | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <CalendarView />
    </>
  );
}
