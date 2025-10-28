import { useParams } from 'react-router';

import { CONFIG } from 'src/global-config';

import { AdminTmpDetailView } from 'src/sections/work/tmp/view/admin-tmp-detail-view';

// ----------------------------------------------------------------------

const metadata = { title: `TMP Details | Job - ${CONFIG.appName}` };

export default function Page() {
  const { id } = useParams();

  return (
    <>
      <title>{metadata.title}</title>

      <AdminTmpDetailView id={id!} />
    </>
  );
}


