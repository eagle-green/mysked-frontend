import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import { DashboardContent } from 'src/layouts/dashboard/content';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { CreateIncidentReportForm } from '../incident-report-create-form';

const JOB_TEST_DATE = {
  id: 'd66da964-5f11-48ac-98c9-45fa87c04aa7',
  job_number: '25-10007',
  site: {
    name: 'EG TEST',
    street_number: '123',
    street_name: 'Bonifacio',
    city: 'Bacolod',
    province: 'NCR',
    postal_code: '6000',
    country: 'PH',
    display_address: '123 Bonifacio Bacolod, NCR 6000, 6000',
  },
  client: {
    name: 'Joe Drake -Excavating',
  },
};

export function CreateIncidentReportView() {
  const { id } = useParams<{ id: string }>();

  const { data } = useQuery({
    queryKey: ['incident-report-job', id],
    queryFn: async () => {
      if (!id) return null;
      //TODO:: create endpoints for incident report
      //const response = await fetcher(``);
      return JOB_TEST_DATE;
    },
    enabled: !!id,
  });

  if (!data) return null;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create Incident Report"
        links={[
          { name: 'My Schedule' },
          { name: 'Incident Report' },
          { name: 'Create Incident Report' },
          { name: `${data.job_number}` },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CreateIncidentReportForm job={data} />
    </DashboardContent>
  );
}
