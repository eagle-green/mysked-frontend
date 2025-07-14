import dayjs from 'dayjs';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fIsAfter } from 'src/utils/format-time';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Form, schemaHelper } from 'src/components/hook-form';

import { JobNewEditAddress } from './job-new-edit-address';
import { JobNewEditDetails } from './job-new-edit-details';
import { JobNewEditStatusDate } from './job-new-edit-status-date';
// ----------------------------------------------------------------------

export type NewJobSchemaType = zod.infer<typeof NewJobSchema>;

export const NewJobSchema = zod
  .object({
    client: zod.object({
      id: zod.string().min(1, { message: 'Client is required!' }),
      region: zod.string(),
      name: zod.string(),
      logo_url: zod.string().nullable(),
      email: zod.string().nullable().transform((v) => v ?? ''),
      contact_number: zod.string().nullable().transform((v) => v ?? ''),
      unit_number: zod.string().nullable(),
      street_number: zod.string().nullable(),
      street_name: zod.string().nullable(),
      city: zod.string().nullable(),
      province: zod.string().nullable(),
      postal_code: zod.string().nullable(),
      country: zod.string(),
      status: zod.string(),
      fullAddress: zod.string().optional(),
      phoneNumber: zod.string().optional(),
    }),
    start_date_time: schemaHelper.date({
      message: { required: 'Start date and time are required!' },
    }),
    end_date_time: schemaHelper.date({ message: { required: 'End date and time are required!' } }),
    site: zod.object({
      id: zod.string().min(1, { message: 'Site is required!' }),
      region: zod.string(),
      name: zod.string(),
      email: zod.string().nullable().transform((v) => v ?? ''),
      contact_number: zod.string().nullable().transform((v) => v ?? ''),
      unit_number: zod.string().nullable(),
      street_number: zod.string().nullable(),
      street_name: zod.string().nullable(),
      city: zod.string().nullable(),
      province: zod.string().nullable(),
      postal_code: zod.string().nullable(),
      country: zod.string(),
      status: zod.string(),
      fullAddress: zod.string().optional(),
      phoneNumber: zod.string().optional(),
    }),
    // Not required
    status: zod.string(),
    note: zod.string().optional(),
    workers: zod.array(
      zod
        .object({
          position: zod.string().min(1, { message: 'Position is required!' }),
          id: zod.string().optional(),
          first_name: zod.string(),
          last_name: zod.string(),
          start_time: schemaHelper.date({
            message: { required: 'Start date and time are required!' },
          }),
          end_time: schemaHelper.date({
            message: { required: 'End date and time are required!' },
          }),
          status: zod.string().optional(),
        })
        .superRefine((val, ctx) => {
          if (val.position && !val.id) {
            ctx.addIssue({
              code: zod.ZodIssueCode.custom,
              message: 'Employee is required!',
              path: ['id'],
            });
          }
        })
    ),
    vehicles: zod.array(
      zod
        .object({
          type: zod.string().optional(),
          id: zod.string().optional(),
          license_plate: zod.string().optional(),
          unit_number: zod.string().optional(),
          operator: zod.object({
            id: zod.string().default(''),
            first_name: zod.string().optional(),
            last_name: zod.string().optional(),
            photo_url: zod.string().optional(),
            worker_index: zod.number().nullable().optional(),
          }),
        })
        .superRefine((val, ctx) => {
          // Always check operator first
          if (!val.operator?.id || val.operator.id.trim() === '') {
            ctx.addIssue({
              code: zod.ZodIssueCode.custom,
              message: 'Operator is required!',
              path: ['operator', 'id'],
            });
            return;
          }

          // Only check vehicle type if operator is selected
          if (!val.type || !val.type.trim()) {
            ctx.addIssue({
              code: zod.ZodIssueCode.custom,
              message: 'Vehicle type is required!',
              path: ['type'],
            });
            return;
          }

          // Check vehicle id only if type is selected
          if (val.type && !val.id) {
            ctx.addIssue({
              code: zod.ZodIssueCode.custom,
              message: 'Vehicle id is required!',
              path: ['id'],
            });
          }

          // Check license plate and unit number if type is selected
          if (val.type) {
            if (!val.license_plate || !val.license_plate.trim()) {
              ctx.addIssue({
                code: zod.ZodIssueCode.custom,
                message: 'License plate is required!',
                path: ['license_plate'],
              });
            }
            if (!val.unit_number || !val.unit_number.trim()) {
              ctx.addIssue({
                code: zod.ZodIssueCode.custom,
                message: 'Unit number is required!',
                path: ['unit_number'],
              });
            }
          }
        })
    ),
    equipments: zod.array(
      zod
        .object({
          type: zod
            .string({ required_error: 'Equipment type is required!' })
            .min(1, { message: 'Equipment type is required!' }),
          quantity: zod.coerce.number().int().positive().or(zod.nan()).optional(),
        })
        .superRefine((val, ctx) => {
          if (!val.quantity || isNaN(val.quantity) || val.quantity < 1) {
            ctx.addIssue({
              code: zod.ZodIssueCode.custom,
              message: 'Quantity must be more than 0',
              path: ['quantity'],
            });
          }
        })
    ),
  })
  .refine((data) => !fIsAfter(data.start_date_time, data.end_date_time), {
    message: 'End date time cannot be earlier than create date!',
    path: ['end_date_time'],
  });

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

const defaultVehicleForm = {
  type: '',
  id: '',
  license_plate: '',
  unit_number: '',
  operator: {
    id: '',
    first_name: '',
    last_name: '',
    photo_url: '',
    worker_index: null,
  },
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

  const defaultStartDateTime = dayjs().add(1, 'day').hour(8).minute(0).second(0).millisecond(0).toISOString(); // 8:00 AM tomorrow
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
        workers:
          currentJob.workers?.map((worker: any) =>
            // Always load the status from the backend
            ({
              id: worker.user_id || worker.id,
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
        vehicles: [
          {
            ...defaultVehicleForm,
          },
        ],
        equipments: [
          {
            ...defaultEquipmentForm,
          },
        ],
      };

  const methods = useForm<NewJobSchemaType>({
    mode: 'all',
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
    <Form methods={methods}>
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
        <Button
          size="large"
          variant="contained"
          loading={loadingSend.value && isSubmitting}
          onClick={handleCreate}
        >
          {currentJob ? 'Update' : 'Create'}
        </Button>
      </Box>
    </Form>
  );
}
