import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const metadata = { title: `Terms of Service - ${CONFIG.appName}` };

export default function TermsPage() {
  const lastUpdated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <title>{metadata.title}</title>

      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card sx={{ p: { xs: 3, md: 5 } }}>
          <Stack spacing={4}>
            {/* Header */}
            <Box>
              <Typography variant="h3" gutterBottom>
                Terms of Service
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last updated: {lastUpdated}
              </Typography>
            </Box>

            <Divider />

            {/* Introduction */}
            <Box>
              <Typography variant="body1" paragraph>
                Welcome to MySked, the scheduling system used by Eaglegreen Traffic Control
                (&quot;Eaglegreen,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By using our website, scheduling portal, or
                SMS notifications, you agree to these Terms of Service.
              </Typography>
            </Box>

            {/* Section 1 */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                1. Purpose
              </Typography>
              <Typography variant="body1" paragraph>
                MySked is used by Eaglegreen Traffic Control to manage work schedules, job
                assignments, and shift notifications for employees.
              </Typography>
            </Box>

            {/* Section 2 */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                2. Use of the Service
              </Typography>
              <Typography variant="body1" paragraph>
                Employees must provide accurate contact information and keep their profiles up to
                date. You agree to receive scheduling notifications, shift reminders, and updates
                related to your employment if you have opted in to SMS communications.
              </Typography>
            </Box>

            {/* Section 3 */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                3. Messaging and Notifications
              </Typography>
              <Typography variant="body1" paragraph>
                By opting in, you consent to receive text messages related to scheduling and job
                updates. Message frequency varies depending on job activity (typically 1–5 messages
                per week). Message and data rates may apply. Reply STOP to unsubscribe or HELP for
                help.
              </Typography>
            </Box>

            {/* Section 4 */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                4. Privacy
              </Typography>
              <Typography variant="body1" paragraph>
                We respect your privacy and handle your personal information according to our
                Privacy Policy available at{' '}
                <Typography
                  component="a"
                  href="/privacy"
                  sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  mysked.ca/privacy
                </Typography>
                .
              </Typography>
            </Box>

            {/* Section 5 */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                5. Modifications
              </Typography>
              <Typography variant="body1" paragraph>
                We may update these Terms occasionally. Continued use of MySked means you accept any
                revised terms.
              </Typography>
            </Box>

            {/* Section 6 */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                6. Contact
              </Typography>
              <Typography variant="body1" paragraph>
                For questions about these Terms, contact us at:
              </Typography>
              <Stack spacing={1} sx={{ pl: 2 }}>
                <Typography variant="body1">
                  📧{' '}
                  <Typography
                    component="a"
                    href="mailto:info@mysked.ca"
                    sx={{
                      color: 'primary.main',
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    info@mysked.ca
                  </Typography>
                </Typography>
                <Typography variant="body1">
                  📍 Eaglegreen Traffic Control, 955 Seaborne Ave #2145, Port Coquitlam, BC V3E 3G7
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Card>
      </Container>
    </>
  );
}

