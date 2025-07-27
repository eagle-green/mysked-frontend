import { CONFIG } from 'src/global-config';

import { SiteEditView } from 'src/sections/management/company/site/view/site-edit-view';

const metadata = { title: `Site Edit | Company - ${CONFIG.appName}` };

// ----------------------------------------------------------------------

export default function SiteEditPage() {
  return <SiteEditView />;
}

SiteEditPage.metadata = metadata; 