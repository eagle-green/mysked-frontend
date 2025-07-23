import { CONFIG } from 'src/global-config';

import { SiteCreateView } from 'src/sections/company/site/view/site-create-view';

const metadata = { title: `Site Create | Company - ${CONFIG.appName}` };

// ----------------------------------------------------------------------

export default function SiteCreatePage() {
  return <SiteCreateView />;
}

SiteCreatePage.metadata = metadata; 