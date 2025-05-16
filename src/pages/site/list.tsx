import { CONFIG } from 'src/global-config';

import { SiteListView } from 'src/sections/site/view/site-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `Site List | Site - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <SiteListView />
    </>
  );
}
