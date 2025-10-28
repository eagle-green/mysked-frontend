import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Checkbox from '@mui/material/Checkbox';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const metadata = { title: `SMS Opt-In Example - ${CONFIG.appName}` };

export default function SmsOptInExamplePage() {
  return (
    <>
      <title>{metadata.title}</title>

      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card sx={{ p: { xs: 3, md: 5 } }}>
          <Stack spacing={4}>
            {/* Header */}
            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                Employee Onboarding
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Eaglegreen Traffic Control
              </Typography>
            </Box>

            {/* SMS Consent Form */}
            <Box
              sx={{
                p: 3,
                bgcolor: 'background.neutral',
                borderRadius: 2,
                border: '2px solid',
                borderColor: 'primary.main',
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                SMS Notification Consent
              </Typography>

              <FormControlLabel
                control={<Checkbox defaultChecked />}
                label={
                  <Typography variant="body1" sx={{ py: 1 }}>
                    I consent to receive scheduling notifications, shift reminders, and job updates
                    via text message from <strong>Eaglegreen Traffic Control</strong>. Message
                    frequency varies (typically 1–5 messages per week). Message and data rates may
                    apply. Reply <strong>STOP</strong> to unsubscribe or <strong>HELP</strong> for
                    help.
                  </Typography>
                }
                sx={{
                  alignItems: 'flex-start',
                  '& .MuiCheckbox-root': { mt: -0.5 },
                }}
              />
            </Box>

            {/* Additional Information */}
            <Box sx={{ bgcolor: 'grey.50', p: 2.5, borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                What messages will I receive?
              </Typography>
              <Stack spacing={0.5} sx={{ pl: 2 }}>
                <Typography variant="body2">• New job assignments</Typography>
                <Typography variant="body2">• Shift confirmations and updates</Typography>
                <Typography variant="body2">• Cancellation notifications</Typography>
                <Typography variant="body2">• Schedule reminders</Typography>
              </Stack>
            </Box>

            <Box sx={{ bgcolor: 'grey.50', p: 2.5, borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                How often will I receive messages?
              </Typography>
              <Typography variant="body2">
                Message frequency varies based on your job activity. Typically, you can expect 1–5
                messages per week.
              </Typography>
            </Box>

            <Box sx={{ bgcolor: 'grey.50', p: 2.5, borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                How do I opt out?
              </Typography>
              <Typography variant="body2">
                Reply <strong>STOP</strong> to any text message to unsubscribe at any time. You can
                also manage your SMS preferences in your profile at{' '}
                <Typography
                  component="a"
                  href="https://mysked.ca"
                  target="_blank"
                  rel="noopener"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  https://mysked.ca
                </Typography>
              </Typography>
            </Box>

            {/* Legal Links */}
            <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary" align="center">
                By providing consent, you agree to our{' '}
                <Typography
                  component="a"
                  href="/terms"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Terms of Service
                </Typography>{' '}
                and{' '}
                <Typography
                  component="a"
                  href="/privacy"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Privacy Policy
                </Typography>
              </Typography>
            </Box>
          </Stack>
        </Card>
      </Container>
    </>
  );
}
