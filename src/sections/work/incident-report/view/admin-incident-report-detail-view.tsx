import dayjs from 'dayjs';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components/router-link';

import { endpoints, fetcher } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard/content';

import { Iconify } from 'src/components/iconify/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { AdminIncidentReportDetail } from '../admin-incident-report-detail';

export function DetailIncidentReportView() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetcher(`${endpoints.work.job}/${id}`);
      const { job } = response.data;
      const values = {
        incident_report: {
          id: 'd66da964-5f11-48ac-98c9-45fa87c04aa8',
          incidentType: 'traffic accident',
          dateOfIncident: dayjs(job.start_time).format('YYYY-MM-DD'),
          timeOfIncident: dayjs(job.start_time).toISOString(),
          reportDescription: `Vehicle failed to observe the posted detour signs and entered a closed lane despite active warning signals. The driver, a red sedan, ignored multiple traffic cones and barriers. I immediately stepped into the lane to alert the driver, signaling them to stop. The vehicle came to a halt without incident. After confirming the driver was uninjured, I instructed them to safely exit the work zone and redirected traffic.`,
          reportedBy: {
            name: 'Jerwin Fortillano',
            photo_logo_url: null,
            role: 'Admin',
          },
          incidentSeverity: 'moderate',
          status: 'confirmed',
          evidence: null,
        },
        job: job || {},
        workers: job?.workers || [],
        comments: [
          {
            id: 'd66da964-5f11-48ac-98c9-45fa87c04aa8',
            user: {
              id: 'd66da964-5f11-48ac-98c9-45fa87c04aa8',
              name: 'Jerwin Fortillano',
              photo_logo_url: null,
            },
            description:
              'Vehicle failed to observe the posted detour signs and entered a closed lane despite active warning signals. The driver, a red sedan, ignored multiple',
            posted_date: dayjs().toISOString(),
          },
          {
            id: 'd66da964-5f11-48ac-98c9-45fa87c04aa8',
            user: {
              id: 'd66da964-5f11-48ac-98c9-45fa87c04aa9',
              name: 'Kiwoon Jung',
              photo_logo_url: null,
            },
            description:
              'Vehicle failed to observe the posted detour signs and entered a closed lane despite active warning signals. The driver, a red sedan, ignored multiple',
            posted_date: dayjs().toISOString(),
          },
        ],
      };
      return values;
    },
    enabled: !!id,
  });

  if (!data) return null;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Incident Report Detail"
        links={[
          { name: 'Work Management' },
          { name: 'Incident Report' },
          { name: 'Detail Incident Report' },
          { name: `${data.job.job_number}` },
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
