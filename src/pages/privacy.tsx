import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const metadata = { title: `Privacy Policy - ${CONFIG.appName}` };

export default function PrivacyPage() {
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
                Privacy Policy
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last updated: {lastUpdated}
              </Typography>
            </Box>

            <Divider />

            {/* Introduction */}
            <Box>
              <Typography variant="body1" paragraph>
                Eaglegreen Traffic Control (&quot;Eaglegreen,&quot; &quot;we,&quot; or &quot;our&quot;) respects your privacy.
                This Privacy Policy explains how we collect, use, and protect employee and user
                information through our MySked scheduling system and related SMS communications.
              </Typography>
            </Box>

            {/* Section 1 */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                1. Information We Collect
              </Typography>
              <Stack spacing={1} sx={{ pl: 2 }}>
                <Typography variant="body1">
                  • Contact information such as name, phone number, and email.
                </Typography>
                <Typography variant="body1">
                  • Scheduling details including assigned shifts and job sites.
                </Typography>
                <Typography variant="body1">
                  • SMS communication history related to work schedules.
                </Typography>
              </Stack>
            </Box>

            {/* Section 2 */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                2. How We Use Information
              </Typography>
              <Typography variant="body1" paragraph>
                We use this information to:
              </Typography>
              <Stack spacing={1} sx={{ pl: 2 }}>
                <Typography variant="body1">
                  • Send scheduling notifications, shift reminders, and job updates.
                </Typography>
                <Typography variant="body1">• Manage work assignments efficiently.</Typography>
                <Typography variant="body1">
                  • Communicate important changes or cancellations.
                </Typography>
              </Stack>
            </Box>

            {/* Section 3 */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                3. Data Protection
              </Typography>
              <Typography variant="body1" paragraph>
                We store data securely and do not sell or share personal information with third
                parties, except as required by law.
              </Typography>
            </Box>

            {/* Section 4 */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                4. SMS Communication
              </Typography>
              <Typography variant="body1" paragraph>
                By opting in, employees agree to receive text messages for job scheduling and
                updates. Message frequency varies and message/data rates may apply. Employees may
                opt out at any time by replying STOP.
              </Typography>
            </Box>

            {/* Section 5 */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                5. Access and Control
              </Typography>
              <Typography variant="body1" paragraph>
                Employees can update their contact information or communication preferences within
                the MySked portal.
              </Typography>
            </Box>

            {/* Section 6 */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                6. Contact Us
              </Typography>
              <Typography variant="body1" paragraph>
                If you have questions about this Privacy Policy, contact:
              </Typography>
              <Stack spacing={1} sx={{ pl: 2 }}>
                <Typography variant="body1">
                  📧{' '}
                  <Typography
                    component="a"
                    href="mailto:privacy@mysked.ca"
                    sx={{
                      color: 'primary.main',
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    privacy@mysked.ca
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

