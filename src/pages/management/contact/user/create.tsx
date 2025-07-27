import { CONFIG } from 'src/global-config';

import { CreateUserView } from 'src/sections/management/user/view/user-create-view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new employee | Site - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <CreateUserView />
    </>
  );
}
