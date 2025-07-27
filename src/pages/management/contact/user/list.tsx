import { CONFIG } from 'src/global-config';

import { UserListView } from 'src/sections/management/user/view/user-list-view';
// ----------------------------------------------------------------------

const metadata = { title: `Employee List | Site - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <UserListView />
    </>
  );
}
