import { CONFIG } from 'src/global-config';

import { EditUserView } from 'src/sections/contact/user/view/user-edit-view';

// ----------------------------------------------------------------------

const metadata = { title: `Edit a employee | Site - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <EditUserView />
    </>
  );
}
