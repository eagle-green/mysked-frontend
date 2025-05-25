import { CONFIG } from 'src/global-config';

import { EmployeeEditView } from 'src/sections/employee/view/employee-edit-view';

// ----------------------------------------------------------------------

const metadata = { title: `Edit an employee | Employee - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <EmployeeEditView />
    </>
  );
} 