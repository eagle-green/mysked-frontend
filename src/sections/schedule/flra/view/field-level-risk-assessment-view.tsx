import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Box, CircularProgress } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useParams, useRouter } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

import { FieldLevelRiskAssessment } from '../components/field-level-risk-assessment-form';

export function FieldLevelRiskAssessmentFormView() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const editFlraId = params.id;

  // Fetch FLRA data if editing
  const { data: flraData, isLoading, error } = useQuery({
    queryKey: ['flra-edit', editFlraId],
    queryFn: async () => {
      try {
        const response = await fetcher(`${endpoints.flra.detail.replace(':id', editFlraId!)}`);
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
    enabled: !!editFlraId,
    retry: false,
  });

  // Check if error is access denied
  const isAccessDeniedError = (error as any)?.isAccessDenied === true;

  // Check if user is the timesheet manager
  const isTimesheetManager = flraData?.timesheet_manager_id === user?.id;

  // Access control: Redirect to access denied if error is 403/401 or if not timesheet manager
  useEffect(() => {
    if (isAccessDeniedError || (editFlraId && flraData && !isTimesheetManager)) {
      router.push(paths.auth.accessDenied);
    }
  }, [isAccessDeniedError, editFlraId, flraData, isTimesheetManager, router]);

  if (editFlraId && isLoading) {
    return (
      <DashboardContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  // Check access control - if not timesheet manager or access denied error, return null and let useEffect redirect
  if (isAccessDeniedError || (editFlraId && flraData && !isTimesheetManager)) {
    return null;
  }

  // Prepare complete jobData if flraData exists
  const completeJobData = flraData ? {
    ...flraData.job,
    client: flraData.client,
    company: flraData.company,
    site: flraData.site,
  } : undefined;

  // Get job number from flraData
  const jobNumber = flraData?.job?.job_number || completeJobData?.job_number;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={editFlraId ? 'Edit Field Level Risk Assessment' : 'Field Level Risk Assessment'}
        links={[
          { name: 'My Schedule' },
          { name: 'FLRA', href: paths.schedule.work.flra.list },
          { name: editFlraId ? 'Edit' : 'Create' },
          ...(jobNumber ? [{ name: `#${jobNumber}` }] : []),
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <FieldLevelRiskAssessment
        key={editFlraId || 'new'} // Force re-render when ID changes
        editData={flraData}
        flraId={editFlraId || undefined}
        jobData={completeJobData}
      />
    </DashboardContent>
  );
}
