import { useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const metadata = {
  title: 'MySked - Workforce Management by Eagle Green',
  description:
    'Professional workforce management software for scheduling, timesheets, job tracking, and field operations. Built for traffic control companies and service businesses by Eagle Green.',
};

const FEATURES = [
  {
    icon: 'solar:calendar-bold',
    title: 'Smart Scheduling',
    description:
      'Efficient job scheduling and workforce coordination with real-time updates and notifications.',
  },
  {
    icon: 'solar:clock-circle-bold-duotone',
    title: 'Timesheet Tracking',
    description: 'Automated timesheet management with GPS verification and digital approvals.',
  },
  {
    icon: 'solar:case-minimalistic-bold-duotone',
    title: 'Job Management',
    description:
      'Complete job lifecycle tracking from creation to completion with worker assignments.',
  },
  {
    icon: 'solar:users-group-rounded-bold-duotone',
    title: 'Team Coordination',
    description: 'Seamless communication and coordination between office staff and field workers.',
  },
  {
    icon: 'solar:chart-2-bold-duotone',
    title: 'Real-time Reporting',
    description:
      'Comprehensive dashboards and reports for better business insights and decision making.',
  },
  {
    icon: 'solar:shield-check-bold-duotone',
    title: 'Compliance Ready',
    description:
      'Built-in compliance tracking for certifications, safety requirements, and regulations.',
  },
];

// ----------------------------------------------------------------------

export function LandingView() {
  const theme = useTheme();

  // // Test error boundary - uncomment to test
  // // throw new Error("Test error for error boundary");

  useEffect(() => {
    // Set document title and meta tags
    document.title = metadata.title;

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', metadata.description);

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', metadata.title);

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', metadata.description);

    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    ogImage.setAttribute('content', 'https://mysked.ca/logo/stopsign-logo-stop-sign-orange.png');
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.dark, 0.1)} 100%)`,
      }}
    >
      {/* Header */}
      <Box
        component="header"
        sx={{
          py: 3,
          px: { xs: 2, md: 5 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'background.paper',
          boxShadow: `0 1px 4px ${alpha(theme.palette.grey[500], 0.12)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            component="img"
            src="/logo/stopsign-logo-stop-sign-orange.png"
            alt="MySked"
            sx={{
              height: 40,
              width: 'auto',
              borderRadius: '10%',
            }}
          />
        </Box>
      </Box>

      {/* Hero Section */}
      <Container
        maxWidth="xl"
        sx={{ flex: 1, display: 'flex', alignItems: 'center', py: { xs: 8, md: 12 } }}
      >
        <Stack spacing={6} sx={{ width: 1 }}>
          {/* Hero Content */}
          <Stack spacing={3} sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto' }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                fontWeight: 800,
                lineHeight: 1.2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Professional Workforce Management
            </Typography>

            <Typography
              variant="h4"
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '1.25rem', md: '1.5rem' },
                fontWeight: 400,
              }}
            >
              Built for Traffic Control Companies and Service Businesses
            </Typography>

            <Typography
              variant="body1"
              sx={{ color: 'text.secondary', fontSize: '1.125rem', maxWidth: 600, mx: 'auto' }}
            >
              Streamline your operations with smart scheduling, timesheet tracking, job management,
              and real-time field coordination. <br />
              Built by Eagle Green.
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ justifyContent: 'center', mt: 2 }}
            >
              <Button
                component={RouterLink}
                href={paths.auth.jwt.signIn}
                variant="contained"
                size="large"
                startIcon={<Iconify icon={'solar:login-2-bold-duotone' as any} />}
                sx={{ minWidth: 200, py: 1.5 }}
              >
                Sign In to MySked
              </Button>
            </Stack>
          </Stack>

          {/* Features Grid */}
          <Grid container spacing={3} sx={{ mt: 4, justifyContent: 'center' }}>
            {FEATURES.map((feature) => (
              <Grid size={{ xs: 12, md: 6 }} key={feature.title} sx={{ maxWidth: 400 }}>
                <Card
                  sx={{
                    p: 3,
                    height: '100%',
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: theme.shadows[8],
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.dark, 0.2)} 100%)`,
                      }}
                    >
                      <Iconify
                        icon={feature.icon as any}
                        width={32}
                        sx={{ color: 'primary.main' }}
                      />
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {feature.title}
                    </Typography>

                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {feature.description}
                    </Typography>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: { xs: 2, md: 5 },
          textAlign: 'center',
          bgcolor: 'background.paper',
          borderTop: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
        }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          © {new Date().getFullYear()} MySked by Eagle Green. All rights reserved.
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>
          Version {CONFIG.appVersion}
        </Typography>
      </Box>
    </Box>
  );
}
