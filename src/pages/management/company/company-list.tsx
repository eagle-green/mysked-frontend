import { CONFIG } from 'src/global-config';

import { CompanyListView } from 'src/sections/management/company/view/company-list-view';

const metadata = { title: `Customer List | Company - ${CONFIG.appName}` };

// ----------------------------------------------------------------------

export default function CompanyListPage() {
  return <CompanyListView />;
}

CompanyListPage.metadata = metadata;
