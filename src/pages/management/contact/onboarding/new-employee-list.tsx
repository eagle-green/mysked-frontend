import { CONFIG } from 'src/global-config';

import { NewEmployeeListView } from 'src/sections/management/onboarding/new-hire-employee/view/new-employee-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `New Employee List | Management - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <NewEmployeeListView />
    </>
  );
}
