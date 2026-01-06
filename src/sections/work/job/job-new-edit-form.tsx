import dayjs from 'dayjs';
import { useState } from 'react';
import utc from 'dayjs/plugin/utc';
import { useForm } from 'react-hook-form';
import timezone from 'dayjs/plugin/timezone';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';

dayjs.extend(utc);
dayjs.extend(timezone);

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Form } from 'src/components/hook-form';

import { NewJobSchema } from './job-create-form';
import { JobNewEditAddress } from './job-new-edit-address';
import { JobNewEditDetails } from './job-new-edit-details';
import { JobNewEditStatusDate } from './job-new-edit-status-date';
import { JobDraftWorkersDialog } from './job-draft-workers-dialog';
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

  // State for draft workers dialog
  const [showDraftWorkersDialog, setShowDraftWorkersDialog] = useState(false);

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
        timesheet_manager_id: currentJob.timesheet_manager_id || '',
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

    // Note: Toast messages are handled by the dialog component
    router.push(paths.work.job.list);
  };

  const handleCloseDialog = () => {
    setShowUpdateDialog(false);
  };

  const handleActualSubmit = async (data: any) => {
    const isEdit = Boolean(currentJob?.id);
    const toastId = toast.loading(isEdit ? 'Updating job...' : 'Creating job...');
    loadingSend.onTrue();
    try {
        // Map worker.id to worker.id for backend
        const jobStartDate = dayjs(data.start_date_time);

        // Destructure to exclude 'note' field (we'll map it to 'notes')
        const { note, ...dataWithoutNote } = data;

        const mappedData = {
          ...dataWithoutNote,
          start_time: dayjs(data.start_date_time).tz('America/Vancouver').toISOString(),
          end_time: dayjs(data.end_date_time).tz('America/Vancouver').toISOString(),
          notes: note,
          client_id: data.client?.id, // Map client.id to client_id for backend
          company_id: data.company?.id, // Map company.id to company_id for backend
          site_id: data.site?.id, // Map site.id to site_id for backend
          workers: data.workers
            .filter((w: any) => w.id && w.position)
            .map((worker: any) => {
              // Find the original worker by id or user_id
              const originalWorker = currentJob?.workers.find(
                (w: { id: string; user_id?: string }) =>
                  w.id === worker.id || w.user_id === worker.id
              );

              // Check if worker is assigned as operator in any vehicle (current and original)
              const isOperatorNow = (data.vehicles || []).some(
                (v: any) => v.operator && v.operator.id === worker.id
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

        if (isEdit && response.data?.allWorkersAreDraft && response.data.changes.length > 0) {
          // All workers are in draft status - show draft workers dialog
          setJobDataForDialog(response.data.jobData || mappedData);
          setTimeout(() => {
            setShowDraftWorkersDialog(true);
          }, 100);
        } else if (
          isEdit &&
          response.data?.hasWorkerRelevantChanges &&
          response.data.changes.length > 0
        ) {
          // Some workers have been notified - show regular update dialog
          setUpdateChanges(response.data.changes);
          setJobDataForDialog(response.data.jobData || mappedData);
          setTimeout(() => {
            setShowUpdateDialog(true);
          }, 100);
        } else {
          // No worker-relevant changes or no dialog needed - save directly
          if (isEdit) {
            await fetcher([
              `${endpoints.work.job}/${currentJob?.id}/save-without-notifications`,
              { method: 'PUT', data: mappedData },
            ]);

            // Invalidate cache after direct save
            queryClient.invalidateQueries({ queryKey: ['job', currentJob.id] });
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
          }

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
  };

  // Helper function to find and scroll to first error field
  const scrollToFirstError = (errors: any) => {
    // Helper to recursively find first error field path
    const findFirstErrorPath = (errorObj: any, path = ''): string | null => {
      for (const [key, value] of Object.entries(errorObj)) {
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

    const firstErrorPath = findFirstErrorPath(errors);
    
    // Try multiple strategies to find and scroll to the error field
    setTimeout(() => {
      let errorElement: HTMLElement | null = null;
      
      // Strategy 1: Try finding by name attribute (handles nested paths like "client.id")
      if (firstErrorPath) {
        errorElement = document.querySelector(`[name="${firstErrorPath}"]`) as HTMLElement;
      }
      
      // Strategy 2: For custom fields like site.id, client.id, company.id - find by label text first
      // This is more reliable than finding error messages since labels are always present
      if (!errorElement && firstErrorPath) {
        const fieldName = firstErrorPath.split('.')[0]; // Get base field name (e.g., "site" from "site.id")
        const labelText = fieldName.charAt(0).toUpperCase() + fieldName.slice(1) + ':'; // "Site:", "Client:", "Company:"
        
        // Find the Typography element with the label
        const allElements = Array.from(document.querySelectorAll('p, h6, h5, h4, span, div, h1, h2, h3'));
        const labelElement = allElements.find((el) => {
          const text = el.textContent?.trim();
          return text === labelText || text === fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
        }) as HTMLElement;
        
        if (labelElement) {
          // Find the parent Stack container that wraps the entire field (contains both label Box and content)
          // The structure is: Stack > Box (with label) + Stack/Box (with content/error)
          const parentStack = labelElement.closest('div[class*="Stack"]') as HTMLElement;
          
          if (parentStack) {
            // Check if this Stack contains the error message too (to ensure it's the right container)
            const errorMessage = errors[fieldName]?.[firstErrorPath.split('.')[1]]?.message;
            if (errorMessage) {
              const hasError = Array.from(parentStack.querySelectorAll('*')).some((el) => {
                const text = el.textContent?.trim();
                return text === errorMessage || text?.includes(errorMessage);
              });
              
              if (hasError) {
                errorElement = parentStack;
              } else {
                // Look for a parent Stack that contains both
                const grandParentStack = parentStack.parentElement?.closest('div[class*="Stack"]') as HTMLElement;
                errorElement = grandParentStack || parentStack;
              }
            } else {
              errorElement = parentStack;
            }
          } else {
            // Fallback: find the Box that contains the label
            const boxContainer = labelElement.closest('div[class*="Box"]') as HTMLElement;
            if (boxContainer) {
              // Then find the parent Stack
              const parentStackContainer = boxContainer.parentElement?.closest('div[class*="Stack"]') as HTMLElement;
              errorElement = parentStackContainer || boxContainer;
            }
          }
        }
      }
      
      // Strategy 3: For custom fields - find by error message text (fallback)
      if (!errorElement && firstErrorPath) {
        const [fieldName, subField] = firstErrorPath.split('.');
        const errorMessage = errors[fieldName]?.[subField]?.message;
        
        if (errorMessage) {
          // Find Typography element containing the error message
          const allElements = Array.from(document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6'));
          const errorTextElement = allElements.find((el) => {
            const text = el.textContent?.trim();
            return text === errorMessage || text?.includes(errorMessage);
          }) as HTMLElement;
          
          if (errorTextElement) {
            // Find the parent Stack container that contains this error
            const stackContainer = errorTextElement.closest('div[class*="Stack"]') as HTMLElement;
            if (stackContainer) {
              // Try to find a parent Stack that also contains the label
              const parentStack = stackContainer.parentElement?.closest('div[class*="Stack"]') as HTMLElement;
              errorElement = parentStack || stackContainer;
            } else {
              // Fallback to the error text element itself
              errorElement = errorTextElement;
            }
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
        // Calculate offset to account for fixed headers/navbars
        const offset = 100; // Adjust this value based on your header height
        const elementPosition = errorElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        
        // Also try to focus if it's a focusable element
        setTimeout(() => {
          const focusableElement = errorElement.querySelector('input, select, textarea, button') as HTMLElement;
          if (focusableElement) {
            focusableElement.focus();
          } else if (errorElement.tagName === 'INPUT' || errorElement.tagName === 'SELECT' || errorElement.tagName === 'TEXTAREA' || errorElement.tagName === 'BUTTON') {
            errorElement.focus();
          }
        }, 300);
      }
    }, 100);
  };

  const handleCreate = handleSubmit(
    async (data) => {
      // Proceed with submission - backend will handle validation
      await handleActualSubmit(data);
    },
    (errors) => {
      // Scroll to first error field instead of showing toast
      scrollToFirstError(errors);
    }
  );

  // Helper function to get status label
  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      draft: 'Draft',
      pending: 'Pending',
      ready: 'Ready',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return statusLabels[status] || status;
  };

  // Helper function to get status color (matches job-table-row.tsx)
  const getStatusColor = (status: string) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'draft') return 'info';
    if (normalized === 'pending') return 'warning';
    if (normalized === 'ready') return 'primary';
    if (normalized === 'in_progress') return 'secondary';
    if (normalized === 'completed') return 'success';
    if (normalized === 'cancelled') return 'error';
    return 'default';
  };

  return (
    <Form methods={methods} onSubmit={handleCreate}>
      {/* Job Status and Info Banner */}
      <Stack spacing={2} sx={{ mb: 2 }}>
        {/* Job Status Badge - Top Right */}
        {currentJob?.status && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Job Status:
            </Typography>
            <Label
              variant="soft"
              color={getStatusColor(currentJob.status)}
              sx={{
                px: 2,
                py: 2,
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                flexShrink: 0,
              }}
            >
              {getStatusLabel(currentJob.status)}
            </Label>
          </Box>
        )}
        
        {/* Info banner for completed jobs */}
        {currentJob?.status === 'completed' && (
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Note:</strong> This job is marked as <strong>Completed</strong>. 
              You can modify all fields including Workers, Vehicles, and Equipment (e.g., to replace no-show workers or update equipment). 
              All changes will be logged in the job history. 
              If you&apos;ve already exported timesheets, you may need to re-export them after making changes.
            </Typography>
          </Alert>
        )}
      </Stack>

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
        <Button
          type="submit"
          variant="contained"
          loading={loadingSend.value && isSubmitting}
        >
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

      <JobDraftWorkersDialog
        open={showDraftWorkersDialog}
        onClose={() => setShowDraftWorkersDialog(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['jobs'] });
          queryClient.invalidateQueries({ queryKey: ['calendar-jobs'] });
        }}
        jobId={currentJob?.id || ''}
        jobNumber={currentJob?.job_number || ''}
        jobData={jobDataForDialog}
      />
    </Form>
  );
}
