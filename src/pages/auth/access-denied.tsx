import { m } from 'framer-motion';

import { Stack, Button, Container, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { ForbiddenIllustration } from 'src/assets/illustrations';

import { Iconify } from 'src/components/iconify';
import { varBounce } from 'src/components/animate';

// ----------------------------------------------------------------------

export default function AccessDeniedPage() {
  const router = useRouter();

  return (
    <Container sx={{ textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <m.div variants={varBounce('in')}>
        <Typography variant="h3" sx={{ mb: 2 }}>
          Access Denied
        </Typography>
      </m.div>

      <m.div variants={varBounce('in')}>
        <Typography sx={{ color: 'text.secondary', mb: 1 }}>
          You do not have permission to access this page.
        </Typography>
      </m.div>

      <m.div variants={varBounce('in')}>
        <ForbiddenIllustration sx={{ my: { xs: 5, sm: 10 } }} />
      </m.div>

      <m.div variants={varBounce('in')}>
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            size="large"
            onClick={() => router.back()}
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
          >
            Go Back
          </Button>
          <Button
            component={RouterLink}
            href={paths.dashboard.root}
            variant="contained"
            size="large"
            startIcon={<Iconify icon="solar:home-angle-bold-duotone" />}
          >
            Go Home
          </Button>
        </Stack>
      </m.div>
    </Container>
  );
} 