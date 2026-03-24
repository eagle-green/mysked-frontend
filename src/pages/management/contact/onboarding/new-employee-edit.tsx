import { CONFIG } from 'src/global-config';

import { NewEmployeeEditView } from 'src/sections/management/onboarding/new-hire-employee/view/new-employee-edit';

// ----------------------------------------------------------------------

const metadata = { title: `New Employee Edit | Management - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <NewEmployeeEditView />
    </>
  );
}
