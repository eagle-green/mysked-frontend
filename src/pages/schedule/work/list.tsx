import { CONFIG } from 'src/global-config';

import WorkListView from 'src/sections/schedule/work/view/work-list-view';
// ----------------------------------------------------------------------

const metadata = { title: `Work List | Job - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <WorkListView />
    </>
  );
}
