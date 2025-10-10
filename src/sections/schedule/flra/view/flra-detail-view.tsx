import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useParams, useRouter } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

import { FieldLevelRiskAssessment } from '../components/field-level-risk-assessment-form';

// ----------------------------------------------------------------------

export function FlraDetailView() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const flraId = params.id as string;

  // Fetch FLRA form details
  const {
    data: flraData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['flra-detail', flraId],
    queryFn: async () => {
      try {
        const response = await fetcher(`${endpoints.flra.detail.replace(':id', flraId)}`);
        return response.data?.flra_form || response.flra_form;
      } catch (err: any) {
        // Check if error message indicates permission issue
        const errorMessage = err?.error || err?.message || '';
        if (errorMessage.includes('permission') || errorMessage.includes('authorized')) {
          throw { isAccessDenied: true, originalError: err };
        }
        throw err;
      }
    },
    enabled: !!flraId,
    retry: false,
  });

  // Check if error is access denied
  const isAccessDeniedError = (error as any)?.isAccessDenied === true;

  // Check if user is the timesheet manager (must be before any early returns)
  const isTimesheetManager = flraData?.timesheet_manager_id === user?.id;

  // Access control: Only timesheet manager can access FLRA (must be before any early returns)
  useEffect(() => {
    if (isAccessDeniedError || (flraData && !isTimesheetManager)) {
      router.push(paths.auth.accessDenied);
    }
  }, [isAccessDeniedError, isTimesheetManager, flraData, router]);

  const handleBack = () => {
    router.push(paths.schedule.work.list);
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

  // Check access control first before showing error
  if (isAccessDeniedError || (flraData && !isTimesheetManager)) {
    return null; // useEffect will redirect to access denied
  }

  if (error || !flraData) {
    return (
      <DashboardContent>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="error" gutterBottom>
            FLRA form not found
          </Typography>
          <Button variant="contained" onClick={handleBack}>
            Back to My Job List
          </Button>
        </Box>
      </DashboardContent>
    );
  }

  // Prepare complete jobData object
  const completeJobData = {
    ...flraData.job,
    client: flraData.client,
    company: flraData.company,
    site: flraData.site,
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Field Level Risk Assessment"
        links={[
          { name: 'My Schedule', href: paths.schedule.root },
          { name: 'My Job List', href: paths.schedule.work.list },
          { name: `Job #${flraData.job?.job_number}` },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
            onClick={handleBack}
          >
            Back to My Job List
          </Button>
        }
      />

      <FieldLevelRiskAssessment
        jobData={completeJobData}
        editData={flraData}
        flraId={flraData.id}
      />
    </DashboardContent>
  );
}
