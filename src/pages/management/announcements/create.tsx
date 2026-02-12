import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';

import { AnnouncementCreateView } from 'src/sections/management/announcements';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

const metadata = { title: `Create Announcement | ${CONFIG.appName}` };

export default function AnnouncementCreatePage() {
  const { user } = useAuthContext();
  const canCreate = user?.role === 'admin';

  if (!canCreate) {
    return (
      <Container maxWidth={false}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', textAlign: 'center', gap: 2 }}>
          <Typography variant="h4" color="error" gutterBottom>Access Denied</Typography>
          <Typography variant="body1" color="text.secondary">You don&apos;t have permission to create announcements.</Typography>
        </Box>
      </Container>
    );
  }

  return <AnnouncementCreateView />;
}

AnnouncementCreatePage.metadata = metadata;
