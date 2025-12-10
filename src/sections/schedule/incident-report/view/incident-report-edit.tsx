import dayjs from 'dayjs';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import { DashboardContent } from 'src/layouts/dashboard/content';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { EditIncidentReportForm } from '../incident-report-edit-form';

const now = dayjs();

const INCIDENT_REPORT_TEST_DATA = {
  incident_report: {
    id: 'd66da964-5f11-48ac-98c9-45fa87c04aa8',
    incidentType: 'traffic accident',
    dateOfIncident: now.format('YYYY-MM-DD'),
    timeOfIncident: now.format('YYYY-MM-DD'),
    reportDescription: `Vehicle failed to observe the posted detour signs and entered a closed lane despite active warning signals. The driver, a red sedan, ignored multiple traffic cones and barriers. I immediately stepped into the lane to alert the driver, signaling them to stop. The vehicle came to a halt without incident. After confirming the driver was uninjured, I instructed them to safely exit the work zone and redirected traffic.`,
    reportedBy: {
      name: 'Jerwin Fortillano',
      photo_logo_url: null,
      role: 'Admin',
    },
    incidentSeverity: 'moderate',
    status: 'processed',
    evidence: null,
  },
  job: {
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
  },
};

export function EditIncidentReportView() {
  const { id } = useParams<{ id: string }>();

  const { data } = useQuery({
    queryKey: ['incident-report-job', id],
    queryFn: async () => {
      if (!id) return null;
      //TODO:: create endpoints for incident report
      //const response = await fetcher(``);
      return INCIDENT_REPORT_TEST_DATA;
    },
    enabled: !!id,
  });

  if (!data) return null;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit Incident Report"
        links={[
          { name: 'My Schedule' },
          { name: 'Incident Report' },
          { name: 'Edit Incident Report' },
          { name: `${data.job.job_number}` },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <EditIncidentReportForm data={data} />
    </DashboardContent>
  );
}
