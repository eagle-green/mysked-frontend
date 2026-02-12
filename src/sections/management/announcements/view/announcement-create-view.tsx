import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AnnouncementCreateEditForm } from '../announcement-create-edit-form';

export function AnnouncementCreateView() {
  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <CustomBreadcrumbs
        heading="Create Announcement"
        links={[
          { name: 'Management', href: paths.management.root },
          { name: 'Announcements', href: paths.management.announcements.list },
          { name: 'Create' },
        ]}
        sx={{ mb: 3 }}
      />
      <AnnouncementCreateEditForm />
    </Container>
  );
}
