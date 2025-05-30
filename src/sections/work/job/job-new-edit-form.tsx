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
      email: zod.string(),
      contact_number: zod.string(),
      unit_number: zod.string(),
      street_number: zod.string(),
      street_name: zod.string(),
      city: zod.string(),
      province: zod.string(),
      postal_code: zod.string(),
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
      email: zod.string(),
      contact_number: zod.string(),
      unit_number: zod.string(),
      street_number: zod.string(),
      street_name: zod.string(),
      city: zod.string(),
      province: zod.string(),
      postal_code: zod.string(),
      country: zod.string(),
      status: zod.string(),
      fullAddress: zod.string().optional(),
      phoneNumber: zod.string().optional(),
    }),
    // Not required
    status: zod.string(),
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
          type: zod
            .string({ required_error: 'Vehicle type is required!' })
            .min(1, { message: 'Vehicle type is required!' }),
          number: zod.string().optional(),
          operator: zod.object({
            employee_id: zod.string().optional(),
            first_name: zod.string().optional(),
            last_name: zod.string().optional(),
          }),
        })
        .superRefine((val, ctx) => {
          if (val.type && !val.number) {
            ctx.addIssue({
              code: zod.ZodIssueCode.custom,
              message: 'Vehicle number is required!',
              path: ['number'],
            });
          }
          if (val.number && !val.operator?.employee_id) {
            ctx.addIssue({
              code: zod.ZodIssueCode.custom,
              message: 'Operator is required!',
              path: ['operator', 'employee_id'],
            });
          }
        })
    ),
    equipment: zod.array(
      zod
        .object({
          type: zod
            .string({ required_error: 'Equipment type is required!' })
            .min(1, { message: 'Equipment type is required!' }),
          name: zod.string().optional(),
          quantity: zod.coerce.number().int().positive().or(zod.nan()).optional(),
        })
        .superRefine((val, ctx) => {
          if (val.type && !val.name) {
            ctx.addIssue({
              code: zod.ZodIssueCode.custom,
              message: 'Equipment name is required!',
              path: ['name'],
            });
          }
          if (val.name && (!val.quantity || isNaN(val.quantity) || val.quantity < 1)) {
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
  employee_id: '',
  first_name: '',
  last_name: '',
  start_time: '',
  end_time: '',
};

const defaultVehicleForm = {
  type: '',
  name: '',
  operator: {
    employee_id: '',
    first_name: '',
    last_name: '',
  },
};

const defaultEquipmentForm = {
  type: '',
  name: '',
  quantity: 1,
};

// ----------------------------------------------------------------------

type Props = {
  currentJob?: any;
};

export function JobNewEditForm({ currentJob }: Props) {
  const router = useRouter();

  const loadingSave = useBoolean();
  const loadingSend = useBoolean();

  const defaultStartDateTime = dayjs().hour(8).minute(0).second(0).millisecond(0).toISOString(); // 8:00 AM today
  const defaultEndDateTime = dayjs(defaultStartDateTime).add(8, 'hour').toISOString(); // 4:00 PM today
  const defaultValues: NewJobSchemaType = {
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
    equipment: [
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
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const handleCreate = handleSubmit(async (data) => {
    const isEdit = Boolean(currentJob?.id);
    const toastId = toast.loading(isEdit ? 'Updatin job...' : 'Creating job...');
    loadingSend.onTrue();
    try {
      // Map worker.id to worker.employee_id for backend
      const mappedData = {
        ...data,
        workers: data.workers
          .filter((w) => typeof w.id === 'string' && w.id.trim() !== '')
          .map(({ id, ...rest }) => ({
            ...rest,
            employee_id: id,
          })),
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
      console.info('DATA', JSON.stringify(data, null, 2));
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

      {/* Debug: Show validation errors */}
      {Object.keys(methods.formState.errors).length > 0 && (
        <pre style={{ color: 'red', fontSize: 12, marginTop: 16 }}>
          {JSON.stringify(methods.formState.errors, null, 2)}
        </pre>
      )}
    </Form>
  );
}
