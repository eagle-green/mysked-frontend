import { CONFIG } from 'src/global-config';

import { EmployeeCreateView } from 'src/sections/employee/view/employee-create-view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new employee | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <EmployeeCreateView />
    </>
  );
}
