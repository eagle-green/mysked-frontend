import dayjs from 'dayjs';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fIsAfter } from 'src/utils/format-time';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
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
      email: zod
        .string()
        .nullable()
        .transform((v) => v ?? ''),
      contact_number: zod
        .string()
        .nullable()
        .transform((v) => v ?? ''),
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
      email: zod
        .string()
        .nullable()
        .transform((v) => v ?? ''),
      contact_number: zod
        .string()
        .nullable()
        .transform((v) => v ?? ''),
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
    po_number: zod.string().optional(),
    note: zod.string().optional(),
    workers: zod
      .array(
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
      )
      .min(1, { message: 'At least one worker is required!' }),
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
  position: '', // Start with empty position for new jobs
  id: '',
  first_name: '',
  last_name: '',
  start_time: '',
  end_time: '',
  status: 'draft',
};

// Removed unused defaultVehicleForm

const defaultEquipmentForm = {
  type: 'arrowboard_trailer', // Default type to satisfy validation - use valid option
  quantity: 1,
};

// ----------------------------------------------------------------------

type JobTab = {
  id: string;
  title: string;
  data: NewJobSchemaType;
  isValid: boolean;
};

type Props = {
  currentJob?: any;
};

export function JobMultiCreateForm({ currentJob }: Props) {
  const router = useRouter();
  const loadingSend = useBoolean();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [isMultiMode, setIsMultiMode] = useState(false);

  const formRef = useRef<any>(null);

  const defaultStartDateTime = dayjs()
    .add(1, 'day')
    .hour(8)
    .minute(0)
    .second(0)
    .millisecond(0)
    .toISOString();
  const defaultEndDateTime = dayjs(defaultStartDateTime).add(8, 'hour').toISOString();

  const createDefaultJobData = useCallback((): NewJobSchemaType => {
    if (currentJob) {
      // Handle nested job structure from API response
      const jobData = currentJob.job || currentJob;

      const result = {
        // Map API job data to form structure
        client: {
          id: jobData.client?.id || '',
          region: jobData.client?.region || '',
          name: jobData.client?.name || '',
          logo_url: jobData.client?.logo_url || null,
          email: jobData.client?.email || '',
          contact_number: jobData.client?.contact_number || '',
          unit_number: jobData.client?.unit_number || '',
          street_number: jobData.client?.street_number || '',
          street_name: jobData.client?.street_name || '',
          city: jobData.client?.city || '',
          province: jobData.client?.province || '',
          postal_code: jobData.client?.postal_code || '',
          country: jobData.client?.country || '',
          status: jobData.client?.status || '',
          fullAddress: jobData.client?.display_address || '',
          phoneNumber: jobData.client?.phoneNumber || '',
        },
        start_date_time: jobData.start_time
          ? dayjs(jobData.start_time).add(1, 'day').toDate()
          : defaultStartDateTime,
        end_date_time: jobData.end_time
          ? dayjs(jobData.end_time).add(1, 'day').toDate()
          : defaultEndDateTime,
        site: {
          id: jobData.site?.id || '',
          region: jobData.site?.region || '',
          name: jobData.site?.name || '',
          email: jobData.site?.email || '',
          contact_number: jobData.site?.contact_number || '',
          unit_number: jobData.site?.unit_number || '',
          street_number: jobData.site?.street_number || '',
          street_name: jobData.site?.street_name || '',
          city: jobData.site?.city || '',
          province: jobData.site?.province || '',
          postal_code: jobData.site?.postal_code || '',
          country: jobData.site?.country || '',
          status: jobData.site?.status || '',
          fullAddress: jobData.site?.display_address || '',
          phoneNumber: jobData.site?.phoneNumber || '',
        },
        status: jobData.status || 'draft',
        po_number: jobData.po_number || '',
        note: jobData.notes || jobData.note || '',
        workers:
          jobData.workers?.length > 0
            ? jobData.workers.map((worker: any) => ({
                id: worker.id, // API returns id directly
                position: worker.position || '',
                first_name: worker.first_name || '',
                last_name: worker.last_name || '',
                start_time: worker.start_time
                  ? dayjs(worker.start_time).add(1, 'day').toDate()
                  : defaultStartDateTime,
                end_time: worker.end_time
                  ? dayjs(worker.end_time).add(1, 'day').toDate()
                  : defaultEndDateTime,
                status: worker.status || 'draft',
              }))
            : [
                {
                  ...defaultWorkerForm,
                  start_time: jobData.start_time
                    ? dayjs(jobData.start_time).add(1, 'day').toDate()
                    : defaultStartDateTime,
                  end_time: jobData.end_time
                    ? dayjs(jobData.end_time).add(1, 'day').toDate()
                    : defaultEndDateTime,
                },
              ],
        vehicles:
          jobData.vehicles?.map((vehicle: any) => ({
            type: vehicle.type || '',
            id: vehicle.id || '',
            license_plate: vehicle.license_plate || '',
            unit_number: vehicle.unit_number || '',
            operator: {
              id: vehicle.operator?.id || '',
              first_name: vehicle.operator?.first_name || '',
              last_name: vehicle.operator?.last_name || '',
              photo_url: vehicle.operator?.photo_url || '',
              worker_index:
                jobData.workers?.findIndex((w: any) => w.id === vehicle.operator?.id) || null,
              position: vehicle.operator?.position || '',
            },
          })) || [],
        equipments:
          jobData.equipments?.length > 0
            ? jobData.equipments.map((equipment: any, index: number) => ({
                id: equipment.id || `temp-${index}`, // Add temporary ID if missing
                type: equipment.type || '',
                quantity: equipment.quantity || 1,
              }))
            : [defaultEquipmentForm],
      };

      return result;
    }

    return {
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
      equipments: [],
    };
  }, [currentJob, defaultStartDateTime, defaultEndDateTime]);

  // Initialize jobTabs state with one tab
  const [jobTabs, setJobTabs] = useState<JobTab[]>(() => {
    const initialData = createDefaultJobData();
    return [
      {
        id: '1',
        title: 'Job 1',
        data: initialData,
        isValid: false,
      },
    ];
  });

  // Update jobTabs when currentJob changes (for duplication)
  useEffect(() => {
    if (currentJob) {
      const newData = createDefaultJobData();
      setJobTabs([
        {
          id: '1',
          title: 'Job 1',
          data: newData,
          isValid: false,
        },
      ]);

      // Add a small delay to allow form validation to complete
      setTimeout(() => {
        if (formRef.current) {
          const formValues = formRef.current.getValues();
          const hasClient = Boolean(formValues.client?.id && formValues.client.id !== '');
          const hasSite = Boolean(formValues.site?.id && formValues.site.id !== '');
          const hasWorkers = Boolean(formValues.workers && formValues.workers.length > 0);
          const hasEquipments = Boolean(formValues.equipments && formValues.equipments.length > 0);
          const isFormValid = hasClient && hasSite && hasWorkers && hasEquipments;

          if (isFormValid) {
            setJobTabs((prev) =>
              prev.map((tab, index) => (index === 0 ? { ...tab, isValid: true } : tab))
            );
          }
        }
      }, 200);
    }
  }, [currentJob, createDefaultJobData]);

  const handleAddTab = () => {
    // Save current tab data before adding new tab
    const currentFormData = formRef.current?.getValues();

    // Generate unique tab ID by finding the next available number
    const existingIds = jobTabs.map((tab) => parseInt(tab.id, 10)).filter((id) => !isNaN(id));
    const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    const newTabId = nextId.toString();
    const newTabIndex = jobTabs.length;

    const sourceTabData = jobTabs[activeTab];
    const baseData = currentFormData || sourceTabData?.data;

    const newTabData: NewJobSchemaType = {
      ...baseData,
      start_date_time: dayjs(baseData.start_date_time).add(1, 'day').toDate(),
      end_date_time: dayjs(baseData.end_date_time).add(1, 'day').toDate(),
      status: 'draft',
      po_number: '',
      // Copy workers from the source tab but update their times
      workers: (baseData.workers || []).map((worker: any) => ({
        ...worker,
        start_time: dayjs(baseData.start_date_time).add(1, 'day').toDate(),
        end_time: dayjs(baseData.end_date_time).add(1, 'day').toDate(),
        status: 'draft',
      })),
      // Reset vehicles and equipment for new tab
      vehicles: [],
      equipments: [],
    };

    const newTab: JobTab = {
      id: newTabId,
      title: `Job ${newTabId}`,
      data: newTabData,
      isValid: false,
    };

    // Update current tab data and add new tab
    setJobTabs((prev) => {
      const updated = prev.map((tab, idx) =>
        idx === activeTab && currentFormData ? { ...tab, data: currentFormData } : tab
      );
      return [...updated, newTab];
    });
    setActiveTab(newTabIndex);
  };

  const handleRemoveTab = (tabIndex: number) => {
    if (jobTabs.length <= 1) {
      toast.error('At least one job tab is required');
      return;
    }

    const newActiveTab =
      activeTab >= tabIndex && activeTab > 0
        ? activeTab - 1
        : activeTab >= jobTabs.length - 1
          ? jobTabs.length - 2
          : activeTab;

    setJobTabs((prev) => {
      const filtered = prev.filter((_, index) => index !== tabIndex);
      // Ensure activeTab is within bounds after removal
      const validActiveTab = Math.min(newActiveTab, filtered.length - 1);
      setActiveTab(validActiveTab);
      return filtered;
    });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    if (newValue >= jobTabs.length) return;

    // Save current tab data before switching
    if (formRef.current) {
      const currentFormData = formRef.current.getValues();

      setJobTabs((prev) =>
        prev.map((tab, index) => (index === activeTab ? { ...tab, data: currentFormData } : tab))
      );
    }

    setActiveTab(newValue);
  };

  const handleCreateAllJobs = useCallback(async () => {
    const isSingleMode = !isMultiMode;
    const toastId = toast.loading(isSingleMode ? 'Creating job...' : 'Creating jobs...');
    loadingSend.onTrue();

    try {
      let jobsToCreate = [];

      // Save current tab data before creating jobs
      if (formRef.current) {
        const currentFormData = formRef.current.getValues();
        if (isSingleMode) {
          jobsToCreate = [
            {
              id: '1',
              title: 'Job 1',
              data: currentFormData,
              isValid: jobTabs[0]?.isValid || false,
            },
          ];
        } else {
          // Update current tab data
          setJobTabs((prev) =>
            prev.map((tab, index) =>
              index === activeTab ? { ...tab, data: currentFormData } : tab
            )
          );
          jobsToCreate = jobTabs.filter((tab) => tab.isValid);
        }
      } else {
        jobsToCreate = jobTabs;
      }

      if (jobsToCreate.length === 0) {
        toast.dismiss(toastId);
        toast.error('Please fill in at least one valid job');
        loadingSend.onFalse();
        return;
      }

      // Create all jobs sequentially
      const createdJobs = [];
      for (const tab of jobsToCreate) {
        // Filter out empty vehicles and equipment before sending to API
        const filteredVehicles = (tab.data.vehicles || [])
          .filter((v: any) => v.id && v.id !== '' && v.type && v.type !== '')
          .map((vehicle: any) => ({
            ...vehicle,
            id: vehicle.id,
            type: vehicle.type,
            license_plate: vehicle.license_plate || '',
            unit_number: vehicle.unit_number || '',
            operator: vehicle.operator?.id
              ? {
                  id: vehicle.operator.id,
                  first_name: vehicle.operator.first_name || '',
                  last_name: vehicle.operator.last_name || '',
                  photo_url: vehicle.operator.photo_url || '',
                }
              : null,
          }));

        const filteredEquipments = (tab.data.equipments || [])
          .filter((e: any) => e.type && e.type !== '')
          .map((equipment: any) => ({
            type: equipment.type,
            quantity: equipment.quantity || 1,
          }));

        const mappedData = {
          ...tab.data,
          start_time: tab.data.start_date_time,
          end_time: tab.data.end_date_time,
          notes: tab.data.note,
          workers: (tab.data.workers || [])
            .filter((w: any) => w.id && w.position)
            .map((worker: any) => ({
              ...worker,
              id: worker.id,
              status: 'draft',
            })),
          vehicles: filteredVehicles,
          equipments: filteredEquipments,
        };

        const response = await fetcher([
          endpoints.work.job,
          {
            method: 'POST',
            data: mappedData,
          },
        ]);

        createdJobs.push(response.data);
      }

      // Invalidate job queries to refresh cached data
      queryClient.invalidateQueries({ queryKey: ['jobs'] });

      toast.dismiss(toastId);
      toast.success(
        isSingleMode
          ? 'Job created successfully!'
          : `Successfully created ${createdJobs.length} job(s)!`
      );
      loadingSend.onFalse();
      router.push(paths.work.job.list);
    } catch (error) {
      toast.dismiss(toastId);
      console.error(error);
      toast.error('Failed to create jobs. Please try again.');
      loadingSend.onFalse();
    }
  }, [jobTabs, loadingSend, queryClient, router, isMultiMode, activeTab]);

  const handleCurrentTabValidationChange = useCallback(
    (isValid: boolean) => {
      setJobTabs((prev) => {
        const updated = prev.map((tab, index) => (index === activeTab ? { ...tab, isValid } : tab));

        return updated;
      });
    },
    [activeTab]
  );

  // Handle form values change for change detection and data saving
  const handleFormValuesChange = useCallback(
    (values: { client?: any; site?: any; workers?: any[] }) => {
      // Save current form data to tab data whenever form values change
      if (formRef.current) {
        const currentFormData = formRef.current.getValues();
        setJobTabs((prev) =>
          prev.map((tab, index) => (index === activeTab ? { ...tab, data: currentFormData } : tab))
        );
      }
      // Initialize or update initial values
      const hasValidClient = values.client?.id && values.client.id !== '';
      const hasValidSite = values.site?.id && values.site.id !== '';

      // If no initial values exist yet, set them
      if (!initialTabValuesRef.current[activeTab]) {
        if (hasValidClient || hasValidSite) {
          initialTabValuesRef.current[activeTab] = {
            client: hasValidClient ? values.client : undefined,
            site: hasValidSite ? values.site : undefined,
          };
          return; // Don't check for changes on first set
        }
        return;
      }

      // Update initial values if we have new valid values that weren't set before
      const currentInitial = initialTabValuesRef.current[activeTab];
      let shouldUpdate = false;
      const updatedInitial = { ...currentInitial };

      if (hasValidClient && !currentInitial.client) {
        updatedInitial.client = values.client;
        shouldUpdate = true;
      }

      if (hasValidSite && !currentInitial.site) {
        updatedInitial.site = values.site;
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        initialTabValuesRef.current[activeTab] = updatedInitial;
        return; // Don't check for changes when updating initial values
      }

      // Check for changes regardless of workers (warnings should appear even without workers)
      // const hasWorkers = values.workers && values.workers.some((w: any) => w.id && w.id !== '');
      // if (!hasWorkers) return;

      const initialValues = initialTabValuesRef.current[activeTab];
      if (!initialValues) return;

      // Check for client change - only if both current and initial have valid IDs
      const hasCurrentClient = values.client?.id && values.client.id !== '';
      const hasInitialClient = initialValues.client?.id && initialValues.client.id !== '';

      if (hasCurrentClient && hasInitialClient && initialValues.client.id !== values.client.id) {
        setClientChangeWarning({
          open: true,
          newClientName: values.client.name,
          previousClientName: initialValues.client.name,
        });
        return;
      }

      // Check for site change - only if both current and initial have valid IDs
      const hasCurrentSite = values.site?.id && values.site.id !== '';
      const hasInitialSite = initialValues.site?.id && initialValues.site.id !== '';

      if (hasCurrentSite && hasInitialSite && initialValues.site.id !== values.site.id) {
        setSiteChangeWarning({
          open: true,
          newSiteName: values.site.name,
          previousSiteName: initialValues.site.name,
        });
      }
    },
    [activeTab]
  );

  // Handle client change confirmation
  const handleClientChangeConfirm = () => {
    if (formRef.current) {
      const currentFormData = formRef.current.getValues();
      const { start_date_time, end_date_time } = currentFormData;

      // Reset workers but keep at least one
      const resetWorker = {
        position: '',
        id: '',
        first_name: '',
        last_name: '',
        start_time: start_date_time || defaultStartDateTime,
        end_time: end_date_time || defaultEndDateTime,
        status: 'draft',
      };

      // Reset vehicles
      const resetVehicle = {
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

      // Reset equipments
      const resetEquipment = {
        type: '',
        quantity: 1,
      };

      // Update the current tab data
      const updatedTabData = {
        ...currentFormData,
        workers: [resetWorker],
        vehicles: [resetVehicle],
        equipments: [resetEquipment],
        note: '', // Reset note field as well
      };

      setJobTabs((prev) =>
        prev.map((tab, index) => (index === activeTab ? { ...tab, data: updatedTabData } : tab))
      );

      // Also update the form with the reset data to ensure sync
      if (formRef.current) {
        formRef.current.reset(updatedTabData);
      }
    }

    setClientChangeWarning((prev) => ({ ...prev, open: false }));

    // Clear initial values for this tab to prevent false change detection
    delete initialTabValuesRef.current[activeTab];
  };

  // Handle client change cancellation
  const handleClientChangeCancel = () => {
    // Revert the client back to the initial value
    const initialValues = initialTabValuesRef.current[activeTab];
    const initialClient = initialValues?.client;

    if (initialClient && formRef.current) {
      formRef.current.setValue('client', initialClient);
    }

    setClientChangeWarning((prev) => ({ ...prev, open: false }));
  };

  // Handle site change confirmation
  const handleSiteChangeConfirm = () => {
    if (formRef.current) {
      const currentFormData = formRef.current.getValues();
      const { start_date_time, end_date_time } = currentFormData;

      // Reset workers but keep at least one
      const resetWorker = {
        position: '',
        id: '',
        first_name: '',
        last_name: '',
        start_time: start_date_time || defaultStartDateTime,
        end_time: end_date_time || defaultEndDateTime,
        status: 'draft',
      };

      // Reset vehicles
      const resetVehicle = {
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

      // Reset equipments
      const resetEquipment = {
        type: '',
        quantity: 1,
      };

      // Update the current tab data
      const updatedTabData = {
        ...currentFormData,
        workers: [resetWorker],
        vehicles: [resetVehicle],
        equipments: [resetEquipment],
        note: '', // Reset note field as well
      };

      setJobTabs((prev) =>
        prev.map((tab, index) => (index === activeTab ? { ...tab, data: updatedTabData } : tab))
      );

      // Also update the form with the reset data to ensure sync
      if (formRef.current) {
        formRef.current.reset(updatedTabData);
      }
    }

    setSiteChangeWarning((prev) => ({ ...prev, open: false }));

    // Clear initial values for this tab to prevent false change detection
    delete initialTabValuesRef.current[activeTab];
  };

  // Handle site change cancellation
  const handleSiteChangeCancel = () => {
    // Revert the site back to the initial value
    const initialValues = initialTabValuesRef.current[activeTab];
    const initialSite = initialValues?.site;

    if (initialSite && formRef.current) {
      formRef.current.setValue('site', initialSite);
    }

    setSiteChangeWarning((prev) => ({ ...prev, open: false }));
  };

  const currentTabData = useMemo(() => jobTabs[activeTab] || jobTabs[0], [jobTabs, activeTab]);

  // Cleanup effect to close dialogs when active tab changes
  useEffect(() => {
    // Close any open dialogs when active tab changes
    setClientChangeWarning((prev) => ({ ...prev, open: false }));
    setSiteChangeWarning((prev) => ({ ...prev, open: false }));
  }, [activeTab]);

  // Client and site change warning states
  const [clientChangeWarning, setClientChangeWarning] = useState<{
    open: boolean;
    newClientName: string;
    previousClientName: string;
  }>({
    open: false,
    newClientName: '',
    previousClientName: '',
  });

  const [siteChangeWarning, setSiteChangeWarning] = useState<{
    open: boolean;
    newSiteName: string;
    previousSiteName: string;
  }>({
    open: false,
    newSiteName: '',
    previousSiteName: '',
  });

  // Track initial values for change detection using ref to avoid stale closures
  const initialTabValuesRef = useRef<{
    [tabIndex: number]: { client?: any; site?: any };
  }>({});

  return (
    <Box>
      {/* Mode Toggle */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pl: 1 }}>
          <Typography variant="h6">Job Creation Mode</Typography>
          <FormControlLabel
            control={
              <Switch
                checked={isMultiMode}
                onChange={(e) => setIsMultiMode(e.target.checked)}
                color="primary"
              />
            }
            label={isMultiMode ? 'Multi-Job Mode' : 'Single Job Mode'}
          />
        </Box>
      </Card>

      {/* Tab Header - Only show in multi mode */}
      {isMultiMode && (
        <Card sx={{ mb: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
              {/* Custom tab buttons to avoid button nesting */}
              {jobTabs.map((tab, index) => (
                <Box
                  key={tab.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    borderRadius: 1,
                    cursor: 'pointer',
                    backgroundColor: activeTab === index ? 'primary.main' : 'transparent',
                    color: activeTab === index ? 'primary.contrastText' : 'text.primary',
                    border: 1,
                    borderColor: activeTab === index ? 'primary.main' : 'divider',

                    '&:hover': {
                      backgroundColor: activeTab === index ? 'primary.dark' : 'action.hover',
                    },
                  }}
                  onClick={() => handleTabChange({} as React.SyntheticEvent, index)}
                >
                  <Typography variant="body2">{tab.title}</Typography>
                  {tab.isValid && (
                    <Iconify
                      icon="eva:checkmark-fill"
                      sx={{
                        color: 'success.main',
                        width: 16,
                        height: 16,
                        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                      }}
                    />
                  )}
                  {jobTabs.length > 1 && (
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTab(index);
                      }}
                      color="error"
                      size="small"
                      sx={{
                        width: 20,
                        height: 20,
                        minWidth: 20,
                        color: 'error.main',
                        '&:hover': {
                          backgroundColor:
                            activeTab === index ? 'rgba(255,255,255,0.2)' : 'error.lighter',
                        },
                      }}
                      title="Remove this job"
                    >
                      <Iconify icon="mingcute:close-line" sx={{ width: 14, height: 14 }} />
                    </IconButton>
                  )}
                </Box>
              ))}

              {/* Add button */}
              <IconButton
                onClick={handleAddTab}
                color="primary"
                size="small"
                sx={{
                  width: 32,
                  height: 32,
                  '&:hover': { backgroundColor: 'primary.lighter' },
                }}
                title="Add new job"
              >
                <Iconify icon="mingcute:add-line" sx={{ width: 18, height: 18 }} />
              </IconButton>
            </Box>
          </Box>
        </Card>
      )}

      {/* Tab Content */}
      {currentTabData && (
        <JobFormTab
          key={`tab-${activeTab}`}
          ref={formRef}
          data={currentTabData.data}
          onValidationChange={handleCurrentTabValidationChange}
          onFormValuesChange={handleFormValuesChange}
          isMultiMode={isMultiMode}
        />
      )}

      {/* Action Buttons */}
      <Box
        sx={{
          mt: 3,
          gap: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {isMultiMode ? (
          <Typography variant="body2" color="text.secondary">
            {jobTabs.filter((tab) => tab.isValid).length} of {jobTabs.length} jobs ready
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {jobTabs[0]?.isValid ? 'Job ready' : 'Please fill in required fields'}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button size="large" variant="outlined" onClick={() => router.push(paths.work.job.list)}>
            Cancel
          </Button>

          <Button
            size="large"
            variant="contained"
            loading={loadingSend.value}
            onClick={isMultiMode ? handleCreateAllJobs : () => handleCreateAllJobs()}
            disabled={
              isMultiMode ? jobTabs.filter((tab) => tab.isValid).length === 0 : !jobTabs[0]?.isValid
            }
          >
            {isMultiMode
              ? `Create All Jobs (${jobTabs.filter((tab) => tab.isValid).length})`
              : 'Create Job'}
          </Button>
        </Box>
      </Box>

      {/* Client Change Warning Dialog */}
      <Dialog
        open={clientChangeWarning.open}
        onClose={handleClientChangeCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Client Change Warning</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              You&apos;ve changed the client from{' '}
              <strong>{clientChangeWarning.previousClientName}</strong> to{' '}
              <strong>{clientChangeWarning.newClientName}</strong>.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              This will reset all assigned workers, vehicles, and equipment because:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 1 }}>
              <li>Different clients may have different employee restrictions</li>
              <li>Workers assigned to one client may not be suitable for another</li>
              <li>Vehicle and equipment requirements may differ</li>
            </Typography>
            <Typography variant="body2">
              Do you want to continue and reset all assignments?
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClientChangeCancel} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleClientChangeConfirm} variant="contained" color="warning">
            Reset All Assignments
          </Button>
        </DialogActions>
      </Dialog>

      {/* Site Change Warning Dialog */}
      <Dialog
        open={siteChangeWarning.open}
        onClose={handleSiteChangeCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Site Change Warning</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              You&apos;ve changed the site from{' '}
              <strong>{siteChangeWarning.previousSiteName}</strong> to{' '}
              <strong>{siteChangeWarning.newSiteName}</strong>.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              This will reset all assigned workers, vehicles, and equipment because:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 1 }}>
              <li>Different sites may have different requirements</li>
              <li>Workers assigned to one site may not be suitable for another</li>
              <li>Vehicle and equipment needs may vary by location</li>
            </Typography>
            <Typography variant="body2">
              Do you want to continue and reset all assignments?
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSiteChangeCancel} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSiteChangeConfirm} variant="contained" color="warning">
            Reset All Assignments
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ----------------------------------------------------------------------

type JobFormTabProps = {
  data: NewJobSchemaType;
  onDataChange?: (data: NewJobSchemaType) => void;
  onValidationChange: (isValid: boolean) => void;
  onFormValuesChange?: (values: { client?: any; site?: any; workers?: any[] }) => void;
  isMultiMode?: boolean;
};

const JobFormTab = React.forwardRef<any, JobFormTabProps>(
  ({ data, onValidationChange, onFormValuesChange, isMultiMode = false }, ref) => {
    const methods = useForm<NewJobSchemaType>({
      mode: 'onBlur',
      resolver: zodResolver(NewJobSchema),
      defaultValues: data,
    });

    // Watch for form values changes for change detection
    const watchedClient = methods.watch('client');
    const watchedSite = methods.watch('site');
    const watchedWorkers = methods.watch('workers');

    // Simple validation effect that runs whenever form values change
    useEffect(() => {
      const formValues = methods.getValues();

      const hasClient = Boolean(formValues.client?.id && formValues.client.id !== '');
      const hasSite = Boolean(formValues.site?.id && formValues.site.id !== '');
      const hasWorkers = Boolean(
        formValues.workers &&
          formValues.workers.length > 0 &&
          formValues.workers.some(
            (worker: any) =>
              worker.id && worker.id !== '' && worker.position && worker.position !== ''
          )
      );

      const isFormValid = hasClient && hasSite && hasWorkers;

      onValidationChange(isFormValid);
    }, [methods, onValidationChange, watchedClient, watchedSite, watchedWorkers]);

    // Force validation to run when any form field changes
    useEffect(() => {
      const subscription = methods.watch((value, { name }) => {
        const formValues = methods.getValues();
        const hasClient = Boolean(formValues.client?.id && formValues.client.id !== '');
        const hasSite = Boolean(formValues.site?.id && formValues.site.id !== '');
        const hasWorkers = Boolean(
          formValues.workers &&
            formValues.workers.length > 0 &&
            formValues.workers.some(
              (worker: any) =>
                worker.id && worker.id !== '' && worker.position && worker.position !== ''
            )
        );

        const isFormValid = hasClient && hasSite && hasWorkers;

        onValidationChange(isFormValid);
      });

      return () => subscription.unsubscribe();
    }, [methods, onValidationChange]);

    // Additional validation check with timeout to ensure it runs after form is fully initialized
    useEffect(() => {
      const timeoutId = setTimeout(() => {
        const formValues = methods.getValues();

        const hasClient = Boolean(formValues.client?.id && formValues.client.id !== '');
        const hasSite = Boolean(formValues.site?.id && formValues.site.id !== '');
        const hasWorkers = Boolean(
          formValues.workers &&
            formValues.workers.length > 0 &&
            formValues.workers.some(
              (worker: any) =>
                worker.id && worker.id !== '' && worker.position && worker.position !== ''
            )
        );

        const isFormValid = hasClient && hasSite && hasWorkers;

        if (isFormValid) {
          onValidationChange(true);
        }
      }, 100); // Small delay to ensure form is fully initialized

      return () => clearTimeout(timeoutId);
    }, [methods, onValidationChange]);

    // Update parent when form values change
    useEffect(() => {
      if (onFormValuesChange) {
        onFormValuesChange({
          client: watchedClient,
          site: watchedSite,
          workers: watchedWorkers,
        });
      }
    }, [watchedClient, watchedSite, watchedWorkers, onFormValuesChange]);

    // Expose the getValues method through the ref
    React.useImperativeHandle(
      ref,
      () => ({
        getValues: () => methods.getValues(),
        setValue: (name: any, value: any) => methods.setValue(name, value),
        reset: (formData: any) => methods.reset(formData),
      }),
      [methods]
    );

    return (
      <Form methods={methods}>
        <Card sx={isMultiMode ? { borderTopLeftRadius: 0, borderTopRightRadius: 0 } : {}}>
          <JobNewEditAddress />
          <JobNewEditStatusDate />
          <JobNewEditDetails />
        </Card>
      </Form>
    );
  }
);
