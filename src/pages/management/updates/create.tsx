import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';

import { UpdateCreateView } from 'src/sections/management/updates';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

const metadata = { title: `Create Update | ${CONFIG.appName}` };

// ----------------------------------------------------------------------

export default function UpdateCreatePage() {
  const { user } = useAuthContext();

  // Only allow access for kiwoon@eaglegreen.ca
  const canCreateUpdate = user?.email === 'kiwoon@eaglegreen.ca';

  if (!canCreateUpdate) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            textAlign: 'center',
            gap: 2,
          }}
        >
          <Typography variant="h4" color="error" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You don&apos;t have permission to create updates.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Only authorized users can access this page.
          </Typography>
        </Box>
      </Container>
    );
  }

  return <UpdateCreateView />;
}

UpdateCreatePage.metadata = metadata;
