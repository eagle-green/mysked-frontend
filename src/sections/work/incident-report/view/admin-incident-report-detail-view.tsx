import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components/router-link';

import { fetcher } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard/content';

import { Iconify } from 'src/components/iconify/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { AdminIncidentReportDetail } from '../admin-incident-report-detail';

export function DetailIncidentReportView() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['incident-report', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetcher(`/api/incident-report/admin/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Incident Report Detail"
          links={[
            { name: 'Work Management' },
            { name: 'Incident Report' },
            { name: 'Detail Incident Report' },
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
            { name: 'Work Management' },
            { name: 'Incident Report' },
            { name: 'Detail Incident Report' },
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
          { name: 'Work Management' },
          { name: 'Incident Report' },
          { name: 'Detail Incident Report' },
          { name: data.job?.job_number || 'N/A' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.work.job.incident_report.root}
            variant="contained"
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
          >
            Back
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <AdminIncidentReportDetail data={data} />
    </DashboardContent>
  );
}
