import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';

import { AnnouncementEditView } from 'src/sections/management/announcements/view/announcement-edit-view';

const metadata = { title: `Edit Announcement | ${CONFIG.appName}` };

export default function AnnouncementEditPage() {
  const { id } = useParams();
  return <AnnouncementEditView id={id!} />;
}

AnnouncementEditPage.metadata = metadata;
