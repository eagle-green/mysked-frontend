import { CONFIG } from 'src/global-config';

import { SiteListView } from 'src/sections/company/site/view/site-list-view';

const metadata = { title: `Site List | Company - ${CONFIG.appName}` };

// ----------------------------------------------------------------------

export default function SiteListPage() {
  return <SiteListView />;
}

SiteListPage.metadata = metadata; 