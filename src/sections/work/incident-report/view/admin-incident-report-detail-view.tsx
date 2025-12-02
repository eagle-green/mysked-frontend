import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import { DashboardContent } from 'src/layouts/dashboard/content';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { AdminIncidentReportDetail } from '../admin-incident-report-detail';

const INCIDENT_REPORT_TEST_DATA = {
  incident_report: {
    id: 'd66da964-5f11-48ac-98c9-45fa87c04aa8',
    jobNumber: '25-10232',
    incidentType: 'traffic accident',
    incidentDate: new Date(),
    incidentTime: new Date(),
    reportDescription: `Vehicle failed to observe the posted detour signs and entered a closed lane despite active warning signals. 
    The driver, a red sedan, ignored multiple traffic cones and barriers. I immediately stepped into the lane to alert the driver, signaling them to stop. The vehicle came to a halt without incident.
     After confirming the driver was uninjured, I instructed them to safely exit the work zone and redirected traffic.`,
    reportDate: new Date(),
    reportedBy: {
      name: 'Jerwin Fortillano',
      photo_logo_url: null,
      role: 'Admin',
    },
    incidentSeverity: 'moderate',
  },
  job: {
    id: 'd66da964-5f11-48ac-98c9-45fa87c04aa7',
    job_number: '25-10007',
    po_number: 'PO-25-1202',
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
      client_logo_url: null,
      client_name: null,
    },
  },
};

export function DetailIncidentReportView() {
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
        heading="Incident Report Detail"
        links={[
          { name: 'Work Management' },
          { name: 'Incident Report' },
          { name: 'Detail Incident Report' },
          { name: `${data.incident_report.jobNumber}` },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <AdminIncidentReportDetail data={data} />
    </DashboardContent>
  );
}
