import { CONFIG } from 'src/global-config';

import { TimelinePage } from 'src/sections/work/timeline/timeline';
// ----------------------------------------------------------------------

const metadata = { title: `Timeline | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <TimelinePage />
    </>
  );
}
