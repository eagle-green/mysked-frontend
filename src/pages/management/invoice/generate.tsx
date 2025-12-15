import { CONFIG } from 'src/global-config';

import { InvoiceGenerateView } from 'src/sections/management/invoice/view/invoice-generate-view';

// ----------------------------------------------------------------------

const metadata = { title: `Generate Invoice | Management - ${CONFIG.appName}` };

export default function InvoiceGeneratePage() {
  return (
    <>
      <title>{metadata.title}</title>
      <InvoiceGenerateView />
    </>
  );
}



