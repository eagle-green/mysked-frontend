import { CONFIG } from 'src/global-config';

import { InvoiceList } from 'src/sections/management/invoice/view/invoice-list';

//----------------------------------------------------------------------

const metadata = { title: `Invoice | Management - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <InvoiceList />
    </>
  );
}
