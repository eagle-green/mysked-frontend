import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Form } from 'src/components/hook-form';

import { NewJobSchema } from './open-job-create-form';
import { JobNewEditAddress } from './open-job-new-edit-address';
import { JobNewEditDetails } from './open-job-new-edit-details';
import { JobNewEditStatusDate } from './open-job-new-edit-status-date';

import type { NewJobSchemaType } from './open-job-create-form';

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
  userList?: any[];
};

export function JobNewEditForm({ currentJob, userList }: Props) {
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
          is_open_job: true, // Ensure this is set for open jobs
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
        toast.success(isEdit ? 'Update success!' : 'Create success!');
        loadingSend.onFalse();
        router.push(paths.work.openJob.list);
        // console.info('DATA', JSON.stringify(data, null, 2));
      } catch (error) {
        toast.dismiss(toastId);
        console.error(error);
        toast.error(`Failed to ${isEdit ? 'update' : 'create'} job. Please try again.`);
        loadingSend.onFalse();
      }
    },
    (formErrors) => {
      // Scroll to first error field instead of showing toast
      // Helper function to find and scroll to first error field
      const scrollToFirstError = (errorObj: any) => {
        // Helper to recursively find first error field path
        const findFirstErrorPath = (errObj: any, path = ''): string | null => {
          for (const [key, value] of Object.entries(errObj)) {
            const currentPath = path ? `${path}.${key}` : key;
            
            if (value && typeof value === 'object') {
              // Check if it's an error object with message
              if ('message' in value) {
                return currentPath;
              }
              // Recursively search nested objects
              const nestedPath = findFirstErrorPath(value, currentPath);
              if (nestedPath) return nestedPath;
            }
          }
          return null;
        };

        const firstErrorPath = findFirstErrorPath(errorObj);
        
        // Try multiple strategies to find and scroll to the error field
        setTimeout(() => {
          let errorElement: HTMLElement | null = null;
          
          // Strategy 1: Try finding by name attribute (handles nested paths like "client.id")
          if (firstErrorPath) {
            errorElement = document.querySelector(`[name="${firstErrorPath}"]`) as HTMLElement;
          }
          
          // Strategy 2: For custom fields like site.id, client.id, company.id - find by error message text
          if (!errorElement && firstErrorPath) {
            const [fieldName, subField] = firstErrorPath.split('.');
            const errorMessage = errorObj[fieldName]?.[subField]?.message;
            
            if (errorMessage) {
              // Find Typography element containing the error message (MUI uses Typography for error messages)
              const allElements = Array.from(document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6'));
              const errorTextElement = allElements.find((el) => {
                const text = el.textContent?.trim();
                return text === errorMessage || text?.includes(errorMessage);
              }) as HTMLElement;
              
              if (errorTextElement) {
                // Find the parent Stack container that contains this error (the field container)
                const stackContainer = errorTextElement.closest('div[class*="Stack"]') as HTMLElement;
                if (stackContainer) {
                  errorElement = stackContainer;
                } else {
                  // Fallback to the error text element itself
                  errorElement = errorTextElement;
                }
              }
            }
          }
          
          // Strategy 3: For custom fields - find by label text (e.g., "Site:", "Client:", "Company:")
          if (!errorElement && firstErrorPath) {
            const fieldName = firstErrorPath.split('.')[0]; // Get base field name (e.g., "site" from "site.id")
            const labelText = fieldName.charAt(0).toUpperCase() + fieldName.slice(1) + ':'; // "Site:", "Client:", "Company:"
            
            // Find the Typography element with the label
            const allElements = Array.from(document.querySelectorAll('p, h6, h5, h4, span, div'));
            const labelElement = allElements.find((el) => {
              const text = el.textContent?.trim();
              return text === labelText || text === fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
            }) as HTMLElement;
            
            if (labelElement) {
              // Find the parent Stack container (the field container)
              const stackContainer = labelElement.closest('div[class*="Stack"]') as HTMLElement;
              if (stackContainer) {
                errorElement = stackContainer;
              }
            }
          }
          
          // Strategy 4: Try finding by aria-invalid (MUI sets this on error fields)
          if (!errorElement) {
            errorElement = document.querySelector('[aria-invalid="true"]') as HTMLElement;
          }
          
          // Strategy 5: Try finding by Mui-error class (MUI error styling)
          if (!errorElement) {
            const muiErrorElement = document.querySelector('.Mui-error') as HTMLElement;
            if (muiErrorElement) {
              // Find the associated input/select/textarea within the error container
              errorElement = muiErrorElement.querySelector('input, select, textarea') as HTMLElement ||
                            muiErrorElement.closest('.MuiFormControl-root')?.querySelector('input, select, textarea') as HTMLElement ||
                            muiErrorElement;
            }
          }
          
          // Strategy 6: Try finding by role="alert" (used by MUI for error messages)
          if (!errorElement) {
            const alertElement = document.querySelector('[role="alert"]') as HTMLElement;
            if (alertElement) {
              // Find the associated input field (usually in a parent FormControl)
              const formControl = alertElement.closest('.MuiFormControl-root');
              if (formControl) {
                errorElement = formControl.querySelector('input, select, textarea') as HTMLElement;
              } else {
                // For custom fields, scroll to the alert element itself
                errorElement = alertElement;
              }
            }
          }
          
          // Strategy 7: Try finding any input/select/textarea with error styling
          if (!errorElement) {
            const errorInput = document.querySelector('input.Mui-error, select.Mui-error, textarea.Mui-error') as HTMLElement;
            if (errorInput) {
              errorElement = errorInput;
            }
          }
          
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Try to focus if it's a focusable element
            const focusableElement = errorElement.querySelector('input, select, textarea') as HTMLElement;
            if (focusableElement) {
              focusableElement.focus();
            } else if (errorElement.tagName === 'INPUT' || errorElement.tagName === 'SELECT' || errorElement.tagName === 'TEXTAREA') {
              errorElement.focus();
            }
          }
        }, 100);
      };
      
      scrollToFirstError(formErrors);
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
        <Tooltip 
          title={currentJob?.status === 'completed' ? 'Completed jobs cannot be updated' : ''}
          disableHoverListener={currentJob?.status !== 'completed'}
        >
          <span>
            <Button 
              type="submit" 
              variant="contained" 
              loading={loadingSend.value && isSubmitting}
              disabled={currentJob?.status === 'completed'}
            >
              {currentJob ? 'Update' : 'Create'}
            </Button>
          </span>
        </Tooltip>
      </Box>
    </Form>
  );
}
