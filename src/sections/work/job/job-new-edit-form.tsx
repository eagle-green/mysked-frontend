import dayjs from 'dayjs';
import { useState } from 'react';
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
import { JobUpdateConfirmationDialog } from './job-update-confirmation-dialog';

import type { NewJobSchemaType } from './job-create-form';

// ----------------------------------------------------------------------

const defaultEquipmentForm = {
  type: '',
  quantity: 1,
};

// ----------------------------------------------------------------------

type Props = {
  currentJob?: any;
  userList?: any[];
};

export function JobNewEditForm({ currentJob, userList }: Props) {
  const router = useRouter();
  const loadingSend = useBoolean();
  const queryClient = useQueryClient();

  // State for update confirmation dialog
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateChanges, setUpdateChanges] = useState<any[]>([]);
  const [jobDataForDialog, setJobDataForDialog] = useState<any>(null);

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
        approver: currentJob.approver || '',
        client_type: currentJob.client_type || 'general',
        // TELUS fields
        build_partner: currentJob.build_partner || '',
        additional_build_partner: currentJob.additional_build_partner || '',
        region: currentJob.region || '',
        coid_fas_feeder: currentJob.coid_fas_feeder || '',
        quantity_lct: currentJob.quantity_lct || null,
        quantity_tcp: currentJob.quantity_tcp || null,
        quantity_highway_truck: currentJob.quantity_highway_truck || null,
        quantity_crash_barrel_truck: currentJob.quantity_crash_barrel_truck || null,
        afad: currentJob.afad || '',
        // LTS fields
        project: currentJob.project || '',
        vendor: currentJob.vendor || '',
        build_partner_lts: currentJob.build_partner_lts || '',
        region_lts: currentJob.region_lts || '',
        fsa_feeder: currentJob.fsa_feeder || '',
        flagging_slip: currentJob.flagging_slip || '',
        description_scope: currentJob.description_scope || '',
        changing_location: currentJob.changing_location || '',
        additional_information: currentJob.additional_information || '',
        notes_from_eg: currentJob.notes_from_eg || '',
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
        approver: '',
        client_type: 'general',
        // TELUS fields
        build_partner: '',
        additional_build_partner: '',
        region: '',
        coid_fas_feeder: '',
        quantity_lct: null,
        quantity_tcp: null,
        quantity_highway_truck: null,
        quantity_crash_barrel_truck: null,
        afad: '',
        // LTS fields
        project: '',
        vendor: '',
        build_partner_lts: '',
        region_lts: '',
        fsa_feeder: '',
        flagging_slip: '',
        description_scope: '',
        changing_location: '',
        additional_information: '',
        notes_from_eg: '',
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
        workers: [], // Start with no workers - they should be added manually
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

  // Add debugging for form state
  // const { formState } = methods;

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const handleNotificationSuccess = () => {
    // Invalidate job queries to refresh cached data
    if (currentJob?.id) {
      queryClient.invalidateQueries({ queryKey: ['job', currentJob.id] });
      queryClient.invalidateQueries({ queryKey: ['job-details-dialog'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    }

    // Invalidate calendar queries to refresh cached data
    queryClient.invalidateQueries({ queryKey: ['calendar-jobs'] });
    queryClient.invalidateQueries({ queryKey: ['worker-schedules'] });

    toast.success('Update success! Notifications sent to workers.');
    router.push(paths.work.job.list);
  };

  const handleCloseDialog = () => {
    setShowUpdateDialog(false);
  };

  const handleCreate = handleSubmit(
    async (data) => {
      const isEdit = Boolean(currentJob?.id);
      const toastId = toast.loading(isEdit ? 'Updating job...' : 'Creating job...');
      loadingSend.onTrue();
      try {
        // Map worker.id to worker.id for backend
        const jobStartDate = dayjs(data.start_date_time);

        const mappedData = {
          ...data,
          start_time: data.start_date_time,
          end_time: data.end_date_time,
          notes: data.note,
          site_id: data.site?.id, // Map site.id to site_id for backend
          workers: data.workers
            .filter((w) => w.id && w.position)
            .map((worker) => {
              // Find the original worker by id or user_id
              const originalWorker = currentJob?.workers.find(
                (w: { id: string; user_id?: string }) =>
                  w.id === worker.id || w.user_id === worker.id
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

              // debug logs removed

              // Normalize worker start/end to the job date while preserving chosen times
              const workerStart = dayjs(worker.start_time);
              const workerEnd = dayjs(worker.end_time);

              // Anchor start to job's start date
              const normalizedStart = jobStartDate
                .hour(workerStart.hour())
                .minute(workerStart.minute())
                .second(0)
                .millisecond(0);

              // Anchor end to job's start date by default (then adjust if overnight)
              let normalizedEnd = jobStartDate
                .hour(workerEnd.hour())
                .minute(workerEnd.minute())
                .second(0)
                .millisecond(0);

              // If the normalized end is before or equal to start, roll to next day
              if (!normalizedEnd.isAfter(normalizedStart)) {
                normalizedEnd = normalizedEnd.add(1, 'day');
              }

              return {
                ...worker,
                id: worker.id,
                status: workerStatus,
                start_time: normalizedStart.toISOString(),
                end_time: normalizedEnd.toISOString(),
              };
            }),
        };

        const response = await fetcher([
          isEdit ? `${endpoints.work.job}/${currentJob?.id}` : endpoints.work.job,
          {
            method: isEdit ? 'PUT' : 'POST',
            data: mappedData,
          },
        ]);

        // Invalidate job queries to refresh cached data
        if (isEdit && currentJob?.id) {
          queryClient.invalidateQueries({ queryKey: ['job', currentJob.id] });
          queryClient.invalidateQueries({ queryKey: ['job-details-dialog'] }); // Invalidate all dialog cache entries
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
        loadingSend.onFalse();

        if (isEdit && response.data?.hasWorkerRelevantChanges && response.data.changes.length > 0) {
          // Debug: Set dialog data and show dialog
          setUpdateChanges(response.data.changes);
          setJobDataForDialog(response.data.jobData || mappedData);

          // Use setTimeout to ensure state updates are processed
          setTimeout(() => {
            setShowUpdateDialog(true);
          }, 100);
        } else {
          toast.success(isEdit ? 'Update success!' : 'Create success!');
          router.push(paths.work.job.list);
        }
        // console.info('DATA', JSON.stringify(data, null, 2));
      } catch (error: any) {
        toast.dismiss(toastId);
        console.error('❌ ERROR CAUGHT in handleCreate');
        console.error('❌ Error details:', error);
        console.error('❌ Error response:', error?.response);
        console.error('❌ Error message:', error?.message);
        console.error('❌ Error status:', error?.response?.status);
        console.error('❌ Full error object:', JSON.stringify(error, null, 2));
        console.error('Error data:', error?.response?.data);
        toast.error(`Failed to ${isEdit ? 'update' : 'create'} job. Please try again.`);
        loadingSend.onFalse();
      }
    },
    (errors) => {
      toast.error('Please fix the form errors before submitting.');
    }
  );

  return (
    <Form methods={methods} onSubmit={handleCreate}>
      <Card>
        <JobNewEditAddress />

        <JobNewEditStatusDate />

        <JobNewEditDetails userList={userList} />
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

      <JobUpdateConfirmationDialog
        open={showUpdateDialog}
        onClose={handleCloseDialog}
        onSuccess={handleNotificationSuccess}
        jobId={currentJob?.id || ''}
        changes={updateChanges}
        jobNumber={currentJob?.job_number || ''}
        jobData={jobDataForDialog}
      />
    </Form>
  );
}
