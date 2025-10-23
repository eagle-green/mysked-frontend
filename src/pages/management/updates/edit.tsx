import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';

import { UpdateEditView } from 'src/sections/management/updates/view/update-edit-view';

const metadata = { title: `Edit Update | ${CONFIG.appName}` };

// ----------------------------------------------------------------------

export default function UpdateEditPage() {
  const { id } = useParams();

  return <UpdateEditView id={id!} />;
}

UpdateEditPage.metadata = metadata;
