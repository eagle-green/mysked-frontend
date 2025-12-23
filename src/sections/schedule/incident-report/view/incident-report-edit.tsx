import { useQuery } from '@tanstack/react-query';
import { Navigate, useParams } from 'react-router';

import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components/router-link';

import { fetcher } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard/content';

import { Iconify } from 'src/components/iconify/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { EditIncidentReportForm } from '../incident-report-edit-form';

export function EditIncidentReportView() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['incident-report', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetcher(`/api/incident-report/${id}`);
      return response.data;
    },
    enabled: !!id,
    retry: false, // Don't retry on error
  });

  // Check if error is access denied (403)
  const isAccessDenied = 
    (error as any)?.response?.status === 403 || 
    (error as any)?.status === 403;

  if (isAccessDenied) {
    return <Navigate to={paths.auth.accessDenied} replace />;
  }

  if (isLoading) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Incident Report Detail"
          links={[
            { name: 'My Schedule' },
            { name: 'Incident Report' },
            { name: 'Incident Report Detail' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <div>Loading...</div>
      </DashboardContent>
    );
  }

  if (isError || !data) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Incident Report Detail"
          links={[
            { name: 'My Schedule' },
            { name: 'Incident Report' },
            { name: 'Incident Report Detail' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <div>Error loading incident report or incident report not found.</div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Incident Report Detail"
        links={[
          { name: 'My Schedule' },
          { name: 'Incident Report' },
          { name: 'Incident Report Detail' },
          { name: data.job?.job_number || 'N/A' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.schedule.work.incident_report.root}
            variant="contained"
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
          >
            Back
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <EditIncidentReportForm data={data} />
    </DashboardContent>
  );
}
