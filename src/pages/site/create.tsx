import { CONFIG } from 'src/global-config';

import { CreateSiteView } from 'src/sections/site/view/site-create-view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new site | Site - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <CreateSiteView />
    </>
  );
}
