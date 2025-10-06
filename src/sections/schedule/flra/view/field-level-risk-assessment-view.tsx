import { useQuery } from '@tanstack/react-query';

import { Box, CircularProgress } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { FieldLevelRiskAssessment } from '../components/field-level-risk-assessment-form';

export function FieldLevelRiskAssessmentFormView() {
  const params = useParams();
  const editFlraId = params.id;

  // Fetch FLRA data if editing
  const { data: flraData, isLoading } = useQuery({
    queryKey: ['flra-edit', editFlraId],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.flra.detail.replace(':id', editFlraId!)}`);
      return response.data.flra_form;
    },
    enabled: !!editFlraId,
  });

  if (editFlraId && isLoading) {
    return (
      <DashboardContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={editFlraId ? 'Edit Field Level Risk Assessment' : 'Field Level Risk Assessment'}
        links={[
          { name: 'My Schedule', href: paths.schedule.root },
          { name: 'FLRA', href: paths.schedule.work.flra.list },
          { name: editFlraId ? 'Edit' : 'Create' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <FieldLevelRiskAssessment
        key={editFlraId || 'new'} // Force re-render when ID changes
        editData={flraData}
        flraId={editFlraId || undefined}
        jobData={flraData?.job} // Pass job data if available
      />
    </DashboardContent>
  );
}
