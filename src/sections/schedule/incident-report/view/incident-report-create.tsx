
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components/router-link';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard/content';

import { Iconify } from 'src/components/iconify/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { CreateIncidentReportForm } from '../incident-report-create-form';

export function CreateIncidentReportView() {
  const { id } = useParams<{ id: string }>();

  const { data } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetcher(`${endpoints.work.job}/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  if (!data) return null;
  const { job } = data;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create Incident Report"
        links={[
          { name: 'My Schedule' },
          { name: 'Incident Report' },
          { name: 'Create Incident Report' },
          { name: `${job.job_number}` },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.schedule.incident_report.root}
            variant="contained"
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
          >
            Back
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CreateIncidentReportForm job={job} workers={job?.workers || []} />
    </DashboardContent>
  );
}
