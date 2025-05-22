import { CONFIG } from 'src/global-config';

import { EditSiteView } from 'src/sections/site/view/site-edit-view';

// ----------------------------------------------------------------------

const metadata = { title: `Edit a site | Site - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <EditSiteView />
    </>
  );
}
