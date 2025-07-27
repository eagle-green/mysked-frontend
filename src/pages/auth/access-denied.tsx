import { m } from 'framer-motion';

import { Container, Typography } from '@mui/material';

import { ForbiddenIllustration } from 'src/assets/illustrations';

import { varBounce } from 'src/components/animate';

// ----------------------------------------------------------------------

export default function AccessDeniedPage() {
  return (
    <Container sx={{ textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <m.div variants={varBounce('in')}>
        <Typography variant="h3" sx={{ mb: 2 }}>
          Access Denied
        </Typography>
      </m.div>

      <m.div variants={varBounce('in')}>
        <Typography sx={{ color: 'text.secondary' }}>
          You do not have permission to access this page.
        </Typography>
      </m.div>

      <m.div variants={varBounce('in')}>
        <ForbiddenIllustration sx={{ my: { xs: 5, sm: 10 } }} />
      </m.div>
    </Container>
  );
} 