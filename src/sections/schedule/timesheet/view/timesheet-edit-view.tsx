import type { ITimeSheetEntries, TimeSheetDetails } from 'src/types/timesheet';

import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { TimeSheetEditForm } from '../timesheet-edit-form';


// ----------------------------------------------------------------------

export function TimeSheetEditView() {
  const { user } = useAuthContext();
  const { id } = useParams<{ id: string }>();
  const { data } = useQuery({
    queryKey: ['timesheet-detail-query', id],
    queryFn: async () => {
        if (!id) return null;
        //TODO:: Removing this if statement once api is ready
        const response = await fetcher(`${endpoints.timesheet}/${id}`);
        return response.data;
    },
    enabled: !!id,
  });

  if (!data) return null;

  const timesheet = data as TimeSheetDetails;
  const entries = timesheet.entries.concat([{
      id: "49f52731-e01c-477f-9b24-66c066881856",
      timesheet_id: "8caf09f9-a0fb-4a67-9c03-faa981475796",
      worker_id: "85ecc580-9f03-422b-b5f2-9c05de580588",
      job_worker_id: "b1c6d59a-c242-40de-9430-b813284dd7e8",
      original_start_time: "2025-08-01T13:00:00.000Z",
      original_end_time: "2025-08-01T22:00:00.000Z",
      travel_start: '',
      shift_start: "2025-08-01T09:04:08.297Z",
      break_start: "2025-01-02T09:04:08.297Z",
      break_end: "2025-08-02T09:04:08.297Z",
      shift_end: "2025-08-02T09:04:08.297Z",
      travel_end: '',
      shift_total_minutes: 24,
      break_total_minutes: null,
      travel_to_minutes: null,
      travel_during_minutes: null,
      travel_from_minutes: null,
      total_work_minutes: 24,
      travel_to_km: "1.2",
      travel_during_km: 0,
      travel_from_km: 0,
      total_travel_km: null,
      worker_notes: "",
      admin_notes: null,
      status: "active",
      created_at: "2025-08-01T09:04:08.297Z",
      updated_at: "2025-08-01T09:04:08.297Z",
      worker_first_name: "Jerwin",
      worker_last_name: "Fortillano",
      worker_email: "james.reid22@gmail.com",
      position: "lct",
      job_worker_status: "submitted"
    } as unknown as ITimeSheetEntries]);

  const response = { ...timesheet, entries: entries.map((entry) => (({
    ...entry,
    travel_to_km: entry?.travel_to_km ? +entry.travel_to_km : 0,
    travel_during_km: entry?.travel_during_km ? +entry.travel_during_km : 0,
    travel_from_km: entry?.travel_from_km ? +entry.travel_from_km : 0,
  }))) };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Timesheet Details"
        links={[
          { name: 'Schedule' },
          { name: 'Timesheet' },
          { name: 'Details' }
        ]}
        action={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton 
                  color='error'
                  component={RouterLink}
                  href={paths.schedule.timesheet.root}
              >
                  <Iconify icon="mingcute:close-line" />
              </IconButton>
            </Box>
         }
        sx={{ mb: { xs: 3, md: 5 } }}
      />
    
      <TimeSheetEditForm timesheet={response} user={user}/>
    </DashboardContent>
  );
}