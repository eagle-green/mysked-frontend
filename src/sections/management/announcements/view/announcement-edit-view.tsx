import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useGetAnnouncementById } from 'src/actions/announcements';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { AnnouncementCreateEditForm } from '../announcement-create-edit-form';

type Props = { id: string };

export function AnnouncementEditView({ id }: Props) {
  const { user } = useAuthContext();
  const { data: announcement, isLoading, error } = useGetAnnouncementById(id);
  const canEdit = user?.role === 'admin';

  if (!canEdit) {
    return (
      <Container maxWidth={false} sx={{ py: 3 }}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h4" gutterBottom>Access Denied</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>You don&apos;t have permission to edit announcements.</Typography>
          <Button component={RouterLink} href={paths.management.announcements.list} variant="contained" startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}>
            Back to Announcements
          </Button>
        </Box>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxWidth={false} sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress /></Box>
      </Container>
    );
  }

  if (error || !announcement) {
    return (
      <Container maxWidth={false} sx={{ py: 3 }}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h4" gutterBottom>Announcement Not Found</Typography>
          <Button component={RouterLink} href={paths.management.announcements.list} variant="contained" startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}>
            Back to Announcements
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <CustomBreadcrumbs
        heading="Edit Announcement"
        links={[
          { name: 'Management', href: paths.management.root },
          { name: 'Announcements', href: paths.management.announcements.list },
          { name: announcement.title, href: paths.management.announcements.details(id) },
          { name: 'Edit' },
        ]}
        sx={{ mb: 3 }}
        action={
          <Button component={RouterLink} href={paths.management.announcements.details(id)} variant="outlined" startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}>
            Cancel
          </Button>
        }
      />
      <AnnouncementCreateEditForm currentAnnouncement={announcement} isEdit />
    </Container>
  );
}
