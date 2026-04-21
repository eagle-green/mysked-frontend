import { CONFIG } from 'src/global-config';

import { NewHireEmployeeCreateView } from 'src/sections/management/onboarding/new-hire-employee/view/new-hire-employee-create-view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new employee | Management - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <NewHireEmployeeCreateView />
    </>
  );
}
