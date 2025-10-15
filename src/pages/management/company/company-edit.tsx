import { CONFIG } from 'src/global-config';

import { EditCompanyView } from 'src/sections/management/company/view/company-edit-view';

const metadata = { title: `Edit a customer | Company - ${CONFIG.appName}` };

// ----------------------------------------------------------------------

export default function EditCompanyPage() {
  return <EditCompanyView />;
}

EditCompanyPage.metadata = metadata; 