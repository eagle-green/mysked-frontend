import { motion } from 'framer-motion';

import { Container, Typography } from '@mui/material';

import { ForbiddenIllustration } from 'src/assets/illustrations';

import { varBounce, MotionContainer } from 'src/components/animate';

// ----------------------------------------------------------------------

export default function AccessDeniedPage() {
  return (
    <Container component={MotionContainer} sx={{ textAlign: 'center' }}>
      <motion.div variants={varBounce('in')}>
        <Typography variant="h3" sx={{ mb: 2 }}>
          Access Denied
        </Typography>
      </motion.div>

      <motion.div variants={varBounce('in')}>
        <Typography sx={{ color: 'text.secondary' }}>
          You do not have permission to access this page.
        </Typography>
      </motion.div>

      <motion.div variants={varBounce('in')}>
        <ForbiddenIllustration sx={{ my: { xs: 5, sm: 10 } }} />
      </motion.div>
    </Container>
  );
} 