import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useParams, useRouter } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { FieldLevelRiskAssessment } from '../components/field-level-risk-assessment-form';

// ----------------------------------------------------------------------

export function FlraDetailView() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  // Fetch FLRA form details
  const {
    data: flraData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['flra-detail', jobId],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.flra.detail.replace(':id', jobId)}`);
      return response.data.flra_form;
    },
    enabled: !!jobId,
  });

  const handleBack = () => {
    router.push(paths.schedule.flra.list);
  };

  if (isLoading) {
    return (
      <DashboardContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  if (error || !flraData) {
    return (
      <DashboardContent>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="error" gutterBottom>
            FLRA form not found
          </Typography>
          <Button variant="contained" onClick={handleBack}>
            Back to FLRA List
          </Button>
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Field Level Risk Assessment"
        links={[
          { name: 'My Schedule', href: paths.schedule.root },
          { name: 'Field Level Risk Assessment', href: paths.schedule.flra.list },
          { name: `Job #${flraData.job?.job_number}` },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
            onClick={handleBack}
          >
            Back to List
          </Button>
        }
      />

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Job Information
        </Typography>

        {/* First Row: Job Number, Client with Logo, Site with Address */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 2,
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              Job Number
            </Typography>
            <Typography variant="body1">#{flraData.job?.job_number}</Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Client
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                src={flraData.client?.logo_url}
                alt={flraData.client?.name}
                sx={{ width: 32, height: 32 }}
              >
                {flraData.client?.name?.charAt(0)?.toUpperCase() || 'C'}
              </Avatar>
              <Typography variant="body1">{flraData.client?.name || '-'}</Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Site
            </Typography>
            <Box>
              <Typography variant="body1">{flraData.site?.name || '-'}</Typography>
              {flraData.site?.display_address && (
                <Box>
                  {(() => {
                    const address = flraData.site.display_address;
                    const addressParts = address.split(', ');
                    if (addressParts.length >= 2) {
                      const firstLine = addressParts.slice(0, 2).join(', ');
                      const secondLine = addressParts.slice(2).join(', ');
                      return (
                        <>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {firstLine},
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {secondLine}
                          </Typography>
                        </>
                      );
                    }
                    return (
                      <Typography variant="caption" color="text.secondary">
                        {address}
                      </Typography>
                    );
                  })()}
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* Second Row: Start Time, End Time */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              Start Time
            </Typography>
            <Typography variant="body1">
              {flraData.job?.start_time ? new Date(flraData.job.start_time).toLocaleString() : '-'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              End Time
            </Typography>
            <Typography variant="body1">
              {flraData.job?.end_time ? new Date(flraData.job.end_time).toLocaleString() : '-'}
            </Typography>
          </Box>

        </Box>
      </Card>

      <FieldLevelRiskAssessment
        jobData={{
          ...flraData.job,
          client: flraData.client,
          site: flraData.site,
        }}
      />
    </DashboardContent>
  );
}
