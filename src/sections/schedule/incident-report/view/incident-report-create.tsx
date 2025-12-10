import dayjs from 'dayjs';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import { DashboardContent } from 'src/layouts/dashboard/content';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { IJob } from 'src/types/job';

import { CreateIncidentReportForm } from '../incident-report-create-form';

const now = dayjs();

const JOB_TEST_DATE: IJob = {
  id: 'd66da964-5f11-48ac-98c9-45fa87c04aa7',
  job_number: '25-10007',
  region: '',
  status: 'pending',
  po_number: '',
  company: {
    id: 'd66da964-5f11-48ac-98c9-45fa87c04aa7',
    name: 'EG TEST',
    region: 'Negros Occidental',
    logo_url: '',
    display_address: '123 Bonifacio Bacolod, NCR 6000, 6000',
    unit_number: '123',
    street_number: '457',
    street_name: 'Bonifacio',
    city: 'Bacolod',
    province: 'Negros Occidental',
    postal_code: '6116',
    country: 'Philippines',
  },
  start_time: now.format('YYYY-MM-DD'),
  end_time: now.format('YYYY-MM-DD'),
  client: {
    id: 'd66da964-5f11-48ac-98c9-45fa87c04aa7',
    name: 'EG Test',
    logo_url: '',
  },
  site: {
    id: 'd66da964-5f11-48ac-98c9-45fa87c04aa7',
    name: 'EG Sample',
    region: 'Negros Occidental',
    display_address: '123 Bonifacio Bacolod, NCR 6000, 6000',
  },
  items: [],
  workers: [],
  vehicles: [],
  equipments: [],
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
