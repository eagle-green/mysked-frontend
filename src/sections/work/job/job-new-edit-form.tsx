import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Form } from 'src/components/hook-form';

import { NewJobSchema } from './job-create-form';
import { JobNewEditAddress } from './job-new-edit-address';
import { JobNewEditDetails } from './job-new-edit-details';
import { JobNewEditStatusDate } from './job-new-edit-status-date';

import type { NewJobSchemaType } from './job-create-form';

// ----------------------------------------------------------------------

const defaultWorkerForm = {
  position: '',
  id: '',
  first_name: '',
  last_name: '',
  start_time: '',
  end_time: '',
  status: 'draft',
};

const defaultEquipmentForm = {
  type: '',
  quantity: 1,
};

// ----------------------------------------------------------------------

type Props = {
  currentJob?: any;
};

export function JobNewEditForm({ currentJob }: Props) {
  const router = useRouter();
  const loadingSend = useBoolean();
  const queryClient = useQueryClient();

  const defaultStartDateTime = dayjs()
    .add(1, 'day')
    .hour(8)
    .minute(0)
    .second(0)
    .millisecond(0)
    .toISOString(); // 8:00 AM tomorrow
  const defaultEndDateTime = dayjs(defaultStartDateTime).add(8, 'hour').toISOString(); // 4:00 PM tomorrow

  const defaultValues: NewJobSchemaType = currentJob
    ? {
        ...currentJob,
        client: {
          ...currentJob.client,
          unit_number: currentJob.client?.unit_number || '',
          fullAddress: currentJob.client?.fullAddress || '',
          phoneNumber: currentJob.client?.phoneNumber || '',
        },
        start_date_time: currentJob.start_date_time
          ? dayjs(currentJob.start_date_time).toDate()
          : defaultStartDateTime,
        end_date_time: currentJob.end_date_time
          ? dayjs(currentJob.end_date_time).toDate()
          : defaultEndDateTime,
        site: {
          ...currentJob.site,
          fullAddress: currentJob.site?.fullAddress || '',
          phoneNumber: currentJob.site?.phoneNumber || '',
        },
        note: currentJob.notes || '',
        po_number: currentJob.po_number || '',
        workers:
          currentJob.workers?.map((worker: any) =>
            // Always load the status from the backend
            ({
              id: worker.id, // Use worker.id consistently
              position: worker.position,
              first_name: worker.first_name,
              last_name: worker.last_name,
              start_time: worker.start_time
                ? dayjs(worker.start_time).toDate()
                : defaultStartDateTime,
              end_time: worker.end_time ? dayjs(worker.end_time).toDate() : defaultEndDateTime,
              photo_url: worker.photo_url || '',
              status: worker.status, // <-- Always load status from backend
            })
          ) || [],
        vehicles:
          currentJob.vehicles?.map((vehicle: any) => ({
            type: vehicle.type,
            id: vehicle.id,
            license_plate: vehicle.license_plate,
            unit_number: vehicle.unit_number,
            operator: {
              id: vehicle.operator?.id || '',
              first_name: vehicle.operator?.first_name || '',
              last_name: vehicle.operator?.last_name || '',
              photo_url: vehicle.operator?.photo_url || '',
              worker_index: currentJob.workers?.findIndex(
                (w: any) => w.id === vehicle.operator?.id
              ),
              position: vehicle.operator?.position || '',
            },
          })) || [],
        equipments: currentJob.equipments || [],
      }
    : {
        start_date_time: defaultStartDateTime,
        end_date_time: defaultEndDateTime,
        status: 'draft',
        po_number: '',
        site: {
          id: '',
          region: '',
          name: '',
          email: '',
          contact_number: '',
          unit_number: '',
          street_number: '',
          street_name: '',
          city: '',
          province: '',
          postal_code: '',
          country: '',
          status: '',
          fullAddress: '',
          phoneNumber: '',
        },
        client: {
          id: '',
          region: '',
          name: '',
          logo_url: null,
          email: '',
          contact_number: '',
          unit_number: '',
          street_number: '',
          street_name: '',
          city: '',
          province: '',
          postal_code: '',
          country: '',
          status: '',
          fullAddress: '',
          phoneNumber: '',
        },
        workers: [
          {
            ...defaultWorkerForm,
            start_time: defaultStartDateTime,
            end_time: defaultEndDateTime,
          },
        ],
        vehicles: [], // Start with no vehicles - they should be added manually when workers are available
        equipments: [
          {
            ...defaultEquipmentForm,
          },
        ],
      };

  const methods = useForm<NewJobSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(NewJobSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const handleCreate = handleSubmit(async (data) => {
    const isEdit = Boolean(currentJob?.id);
    const toastId = toast.loading(isEdit ? 'Updating job...' : 'Creating job...');
    loadingSend.onTrue();
    try {
      // Map worker.id to worker.id for backend
      const mappedData = {
        ...data,
        start_time: data.start_date_time,
        end_time: data.end_date_time,
        notes: data.note,
        workers: data.workers
          .filter((w) => w.id && w.position)
          .map((worker) => {
            // Find the original worker by id or user_id
            const originalWorker = currentJob?.workers.find(
              (w: { id: string; user_id?: string }) => w.id === worker.id || w.user_id === worker.id
            );

            // Check if worker is assigned as operator in any vehicle (current and original)
            const isOperatorNow = (data.vehicles || []).some(
              (v) => v.operator && v.operator.id === worker.id
            );
            const wasOperatorBefore = (currentJob?.vehicles || []).some(
              (v: any) => v.operator && v.operator.id === worker.id
            );

            const hasOperatorAssignmentChanged = isOperatorNow !== wasOperatorBefore;

            const hasChanges =
              originalWorker &&
              (dayjs(originalWorker.start_time).toISOString() !==
                dayjs(worker.start_time).toISOString() ||
                dayjs(originalWorker.end_time).toISOString() !==
                  dayjs(worker.end_time).toISOString() ||
                originalWorker.position !== worker.position ||
                hasOperatorAssignmentChanged);

            let workerStatus = 'draft';
            if (isEdit) {
              if (originalWorker) {
                if (hasChanges) {
                  workerStatus = 'draft';
                } else {
                  workerStatus = worker.status || originalWorker.status || 'draft';
                }
              } else {
                // New worker added
                workerStatus = 'draft';
              }
            }

            return {
              ...worker,
              id: worker.id,
              status: workerStatus,
            };
          }),
      };

      await fetcher([
        isEdit ? `${endpoints.work.job}/${currentJob?.id}` : endpoints.work.job,
        {
          method: isEdit ? 'PUT' : 'POST',
          data: mappedData,
        },
      ]);

      // Invalidate job queries to refresh cached data
      if (isEdit && currentJob?.id) {
        queryClient.invalidateQueries({ queryKey: ['job', currentJob.id] });
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
      }

      // Invalidate calendar queries to refresh cached data
      queryClient.invalidateQueries({ queryKey: ['calendar-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['worker-calendar-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['user-job-dates'] }); // Add this line

      // Invalidate time-off conflict queries to refresh cached data
      queryClient.invalidateQueries({ queryKey: ['time-off-conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['worker-schedules'] });

      toast.dismiss(toastId);
      toast.success(isEdit ? 'Update success!' : 'Create success!');
      loadingSend.onFalse();
      router.push(paths.work.job.list);
      // console.info('DATA', JSON.stringify(data, null, 2));
    } catch (error) {
      toast.dismiss(toastId);
      console.error(error);
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} job. Please try again.`);
      loadingSend.onFalse();
    }
  });

  return (
    <Form methods={methods} onSubmit={handleCreate}>
      <Card>
        <JobNewEditAddress />

        <JobNewEditStatusDate />

        <JobNewEditDetails />
      </Card>

      <Box
        sx={{
          mt: 3,
          gap: 2,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <Button type="submit" variant="contained" loading={loadingSend.value && isSubmitting}>
          {currentJob ? 'Update' : 'Create'}
        </Button>
      </Box>
    </Form>
  );
}
