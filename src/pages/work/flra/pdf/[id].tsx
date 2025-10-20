import { CONFIG } from 'src/global-config';

import { AdminFlraPdfView } from 'src/sections/work/flra/view/admin-flra-pdf-view';

const metadata = { title: `Field Level Risk Assessment Preview | Work Management - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <AdminFlraPdfView />
    </>
  );
}


