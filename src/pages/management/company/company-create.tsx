import { CONFIG } from 'src/global-config';

import { CreateCompanyView } from 'src/sections/management/company/view/company-create-view';

const metadata = { title: `Create a new company | Company - ${CONFIG.appName}` };

// ----------------------------------------------------------------------

export default function CreateCompanyPage() {
  return <CreateCompanyView />;
}

CreateCompanyPage.metadata = metadata; 