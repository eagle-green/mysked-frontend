import type { TimeSheetDetails } from 'src/types/timesheet';

import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { AdminTimeSheetEditForm } from '../admin-timesheet-edit-form';

// ----------------------------------------------------------------------

export function AdminTimesheetEditView() {
  const { user } = useAuthContext();
  const { id } = useParams<{ id: string }>();
  const { data } = useQuery({
    queryKey: ['timesheet-detail-query', id],
    queryFn: async () => {
      if (!id) return null;
      //TODO:: Removing this if statement once api is ready
      const response = await fetcher(`${endpoints.timesheet.list}/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  if (!data) return null;

  const timesheet = data as TimeSheetDetails;

  const response = {
    ...timesheet,
    entries: timesheet.entries.map((entry) => ({
      ...entry,
      travel_to_km: entry?.travel_to_km ? +entry.travel_to_km : 0,
      travel_during_km: entry?.travel_during_km ? +entry.travel_during_km : 0,
      travel_from_km: entry?.travel_from_km ? +entry.travel_from_km : 0,
    })),
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Timesheet Details"
        links={[
          { name: 'Work Management' },
          { name: 'Timesheets' },
          { name: `${timesheet.job.job_number}` },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <AdminTimeSheetEditForm timesheet={response} user={user} />
    </DashboardContent>
  );
}
