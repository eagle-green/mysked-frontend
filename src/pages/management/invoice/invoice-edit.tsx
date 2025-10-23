import { CONFIG } from 'src/global-config';

import { InvoiceEditView } from 'src/sections/management/invoice/view/invoice-edit';

//----------------------------------------------------------------------

const metadata = { title: `Invoice | Management - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <InvoiceEditView />
    </>
  );
}
