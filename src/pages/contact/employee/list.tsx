import { CONFIG } from 'src/global-config';

import { EmployeeListView } from 'src/sections/employee/view/employee-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `Employee | Contact - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <EmployeeListView />
    </>
  );
}
