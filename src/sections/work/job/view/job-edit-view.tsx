import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { JobNewEditForm } from '../job-new-edit-form';
// ----------------------------------------------------------------------

export function EditJobView() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetcher(`${endpoints.work.job}/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // Also fetch user list to ensure it's available for employee options
  const { data: userListData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', 'job-creation'],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.management.user}/job-creation`);
      return response.data.users;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoading || isLoadingUsers || isError || !data || !data.job) return null;

  // Transform the data to match the expected format
  const jobData = {
    ...data.job,
    note: data.job.notes || '',
    start_date_time: data.job.start_time,
    end_date_time: data.job.end_time,
    company: data.job.company
      ? {
          ...data.job.company,
          fullAddress: data.job.company.display_address || '',
          phoneNumber: data.job.company.phoneNumber || '',
        }
      : null,
    client: data.job.client
      ? {
          ...data.job.client,
          fullAddress: data.job.client.display_address || '',
          phoneNumber: data.job.client.phoneNumber || '',
        }
      : null,
    site: data.job.site
      ? {
          ...data.job.site,
          fullAddress: data.job.site.display_address || '',
          phoneNumber: data.job.site.phoneNumber || '',
        }
      : null,
    workers: (data.job.workers || []).map((worker: any) => ({
      id: worker.id || worker.user_id, // Handle both id and user_id for backward compatibility
      position: worker.position,
      first_name: worker.first_name,
      last_name: worker.last_name,
      start_time: worker.start_time,
      end_time: worker.end_time,
      photo_url: worker.photo_url || '',
      status: worker.status,
    })),
    vehicles: (data.job.vehicles || []).map((vehicle: any) => {
      const operator = vehicle.operator
        ? {
            id: vehicle.operator.id,
            worker_index: vehicle.operator.worker_index,
            first_name: vehicle.operator.first_name,
            last_name: vehicle.operator.last_name,
            position:
              vehicle.operator.position ||
              data.job.workers[vehicle.operator.worker_index]?.position ||
              '',
            photo_url:
              vehicle.operator.photo_url ||
              data.job.workers[vehicle.operator.worker_index]?.photo_url ||
              '',
          }
        : {
            id: '',
            worker_index: null,
            first_name: '',
            last_name: '',
            position: '',
            photo_url: '',
          };

      return {
        type: vehicle.type,
        id: vehicle.id,
        license_plate: vehicle.license_plate,
        unit_number: vehicle.unit_number,
        operator,
      };
    }),
    equipments: (data.job.equipments || []).map((item: any) => ({
      type: item.type,
      name: item.name,
      quantity: item.quantity,
    })),
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit a job"
        links={[{ name: 'Work Management' }, { name: 'Job' }, { name: 'Edit Job' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      {jobData && <JobNewEditForm currentJob={jobData} userList={userListData} />}
    </DashboardContent>
  );
}
