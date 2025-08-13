import dayjs from 'dayjs';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fIsAfter } from 'src/utils/format-time';
import { getPositionColor } from 'src/utils/format-role';

import { fetcher, endpoints } from 'src/lib/axios';
import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';
import { VEHICLE_TYPE_OPTIONS } from 'src/assets/data/vehicle';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, schemaHelper } from 'src/components/hook-form';

// Helper function to format phone numbers
const formatPhoneNumber = (phone: string) => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Handle different phone number lengths
  if (cleaned.length === 10) {
    // Format as 123 456 7890
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // Format as 123 456 7890 (removing country code)
    return `${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  } else if (cleaned.length === 7) {
    // Format as 123 4567
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  }

  // Return original if no pattern matches
  return phone;
};

// Helper function to format vehicle type
const formatVehicleType = (type: string) => {
  const option = VEHICLE_TYPE_OPTIONS.find((opt) => opt.value === type);
  return option?.label || type;
};

import { JobNewEditAddress } from './job-new-edit-address';
import {  JobNewEditDetails } from './job-new-edit-details';
import { JobNewEditStatusDate } from './job-new-edit-status-date';

// ----------------------------------------------------------------------

export type NewJobSchemaType = zod.infer<typeof NewJobSchema>;

export const NewJobSchema = zod
  .object({
    client: zod.object({
      id: zod.string().min(1, { message: 'Client is required!' }),
      region: zod.string(),
      name: zod.string(),
      logo_url: zod.string().nullable().optional(),
      email: zod
        .string()
        .nullable()
        .optional()
        .transform((v) => v ?? ''),
      contact_number: zod
        .string()
        .nullable()
        .optional()
        .transform((v) => v ?? ''),
      unit_number: zod.string().nullable().optional(),
      street_number: zod.string().nullable().optional(),
      street_name: zod.string().nullable().optional(),
      city: zod.string().nullable().optional(),
      province: zod.string().nullable().optional(),
      postal_code: zod.string().nullable().optional(),
      country: zod.string().optional(),
      status: zod.string().optional(),
      fullAddress: zod.string().optional(),
      phoneNumber: zod.string().optional(),
    }),
    start_date_time: schemaHelper.date({
      message: { required: 'Start date and time are required!' },
    }),
    end_date_time: schemaHelper.date({ message: { required: 'End date and time are required!' } }),
    company: zod.object({
      id: zod.string().min(1, { message: 'Company is required!' }),
      region: zod.string(),
      name: zod.string(),
      logo_url: zod.string().nullable().optional(),
      email: zod
        .string()
        .nullable()
        .optional()
        .transform((v) => v ?? ''),
      contact_number: zod
        .string()
        .nullable()
        .optional()
        .transform((v) => v ?? ''),
      unit_number: zod.string().nullable().optional(),
      street_number: zod.string().nullable().optional(),
      street_name: zod.string().nullable().optional(),
      city: zod.string().nullable().optional(),
      province: zod.string().nullable().optional(),
      postal_code: zod.string().nullable().optional(),
      country: zod.string().optional(),
      status: zod.string().optional(),
      fullAddress: zod.string().optional(),
      phoneNumber: zod.string().optional(),
    }),
    site: zod
      .object({
        id: zod.string().min(1, { message: 'Site is required!' }),
        company_id: zod.string().optional(),
        name: zod.string().optional(),
        email: zod.string().nullable().optional().transform((v) => v ?? ''),
        contact_number: zod.string().nullable().optional().transform((v) => v ?? ''),
        unit_number: zod.string().nullable().optional(),
        street_number: zod.string().nullable().optional(),
        street_name: zod.string().nullable().optional(),
        city: zod.string().nullable().optional(),
        province: zod.string().nullable().optional(),
        postal_code: zod.string().nullable().optional(),
        country: zod.string().optional(),
        status: zod.string().optional(),
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
            email: zod.string().optional(),
            phone_number: zod.string().optional(),
            photo_url: zod.string().optional(),
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
            email: zod.string().optional(),
            phone_number: zod.string().optional(),
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
    timesheet_manager_id: zod.string().min(1, { message: 'Timesheet manager is required!' }),
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
  email: '',
  phone_number: '',
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

type NotificationTab = {
  id: string;
  title: string;
  jobData: NewJobSchemaType;
  recipients: {
    workers: Array<{
      id: string;
      name: string;
      position: string;
      photo_url?: string;
      email?: string;
      phone?: string;
      start_time?: any;
      end_time?: any;
      assignedVehicles?: Array<{
        type: string;
        license_plate: string;
        unit_number: string;
      }>;
      notifyEmail: boolean;
      notifyPhone: boolean;
    }>;
    vehicles: Array<{
      id: string;
      type: string;
      license_plate?: string;
      unit_number?: string;
      operator: {
        id: string;
        name: string;
        photo_url?: string;
        email?: string;
        phone?: string;
        notifyEmail: boolean;
        notifyPhone: boolean;
      };
    }>;
  };
  isValid: boolean;
};

type Props = {
  currentJob?: any;
  userList?: any[];
};

export function JobMultiCreateForm({ currentJob, userList }: Props) {
  const router = useRouter();
  const loadingSend = useBoolean();
  const loadingNotifications = useBoolean();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [isMultiMode, setIsMultiMode] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [activeNotificationTab, setActiveNotificationTab] = useState(0);
  const [notificationTabs, setNotificationTabs] = useState<NotificationTab[]>([]);

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
        company: {
          id: jobData.company?.id || '',
          region: jobData.company?.region || '',
          name: jobData.company?.name || '',
          logo_url: jobData.company?.logo_url || null,
          email: jobData.company?.email || '',
          contact_number: jobData.company?.contact_number || '',
          unit_number: jobData.company?.unit_number || '',
          street_number: jobData.company?.street_number || '',
          street_name: jobData.company?.street_name || '',
          city: jobData.company?.city || '',
          province: jobData.company?.province || '',
          postal_code: jobData.company?.postal_code || '',
          country: jobData.company?.country || '',
          status: jobData.company?.status || '',
          fullAddress: jobData.company?.display_address || '',
          phoneNumber: jobData.company?.phoneNumber || '',
        },
        site: {
          id: jobData.site?.id || '',
          company_id: jobData.site?.company_id || '',
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
                email: worker.email || '',
                phone_number: worker.phone_number || '',
                photo_url: worker.photo_url || '',
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
              email: vehicle.operator?.email || '',
              phone_number: vehicle.operator?.phone_number || '',
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
        timesheet_manager_id: jobData.timesheet_manager_id || '',
      };

      return result;
    }

    return {
      start_date_time: defaultStartDateTime,
      end_date_time: defaultEndDateTime,
      status: 'draft',
      po_number: '',

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
      company: {
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
      site: {
        id: '',
        company_id: '',
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
      timesheet_manager_id: '',
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
          const hasCompany = Boolean(formValues.company?.id && formValues.company.id !== '');
          const hasWorkers = Boolean(formValues.workers && formValues.workers.length > 0);
          const hasEquipments = Boolean(formValues.equipments && formValues.equipments.length > 0);
          const isFormValid = hasClient && hasCompany && hasWorkers && hasEquipments;

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
      // Copy workers from the source tab but preserve their relative time differences
      workers: (baseData.workers || []).map((worker: any) => {
        const workerStartTime = dayjs(worker.start_time);
        const workerEndTime = dayjs(worker.end_time);
        const jobStartTime = dayjs(baseData.start_date_time);
        const jobEndTime = dayjs(baseData.end_date_time);

        // Calculate the time differences from job start/end
        const startDiff = workerStartTime.diff(jobStartTime, 'minute');
        const endDiff = workerEndTime.diff(jobEndTime, 'minute');

        // Apply the same differences to the new job times
        const newJobStartTime = dayjs(baseData.start_date_time).add(1, 'day');
        const newJobEndTime = dayjs(baseData.end_date_time).add(1, 'day');

        return {
          ...worker,
          start_time: newJobStartTime.add(startDiff, 'minute').toDate(),
          end_time: newJobEndTime.add(endDiff, 'minute').toDate(),
          status: 'draft',
        };
      }),
      // Copy vehicles and equipment from the source tab
      vehicles: (baseData.vehicles || []).map((vehicle: any) => ({
        ...vehicle,
        // Keep vehicle assignments but they may need to be updated if workers change
      })),
      equipments: (baseData.equipments || []).map((equipment: any) => ({
        ...equipment,
      })),
      company: {
        ...baseData.company,
      },
      timesheet_manager_id: baseData.timesheet_manager_id || '',
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

      // In multi-mode, ensure all tabs are valid
      if (isMultiMode && jobsToCreate.length !== jobTabs.length) {
        toast.dismiss(toastId);
        toast.error('Please complete all job tabs before creating jobs');
        loadingSend.onFalse();
        return;
      }

      // Create all jobs sequentially
      const createdJobs = [];
      for (const tab of jobsToCreate) {
        // Filter out empty vehicles and equipment before sending to API
        const filteredVehicles = (tab.data.vehicles || [])
          .filter((v: any) => {
            const isValid = v.id && v.id !== '' && v.type && v.type !== '';

            return isValid;
          })
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

        const jobStartDate = dayjs(tab.data.start_date_time);
        const mappedData = {
          ...tab.data,
          start_time: tab.data.start_date_time,
          end_time: tab.data.end_date_time,
          notes: tab.data.note,
          workers: (tab.data.workers || [])
            .filter((w: any) => w.id && w.position)
            .map((worker: any) => {
              // Normalize worker start/end to the job date while preserving chosen times
              const workerStart = dayjs(worker.start_time || tab.data.start_date_time);
              const workerEnd = dayjs(worker.end_time || tab.data.end_date_time);

              const normalizedStart = jobStartDate
                .hour(workerStart.hour())
                .minute(workerStart.minute())
                .second(0)
                .millisecond(0);

              let normalizedEnd = jobStartDate
                .hour(workerEnd.hour())
                .minute(workerEnd.minute())
                .second(0)
                .millisecond(0);

              if (!normalizedEnd.isAfter(normalizedStart)) {
                normalizedEnd = normalizedEnd.add(1, 'day');
              }

              return {
                ...worker,
                id: worker.id,
                status: 'draft',
                start_time: normalizedStart.toISOString(),
                end_time: normalizedEnd.toISOString(),
              };
            }),
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

      // Invalidate calendar queries to refresh cached data
      queryClient.invalidateQueries({ queryKey: ['calendar-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['worker-calendar-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['user-job-dates'] }); // Add this line

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
    (values: { client?: any; company?: any; site?: any; workers?: any[] }) => {
      // Save current form data to tab data whenever form values change
      if (formRef.current) {
        const currentFormData = formRef.current.getValues();
        setJobTabs((prev) =>
          prev.map((tab, index) => (index === activeTab ? { ...tab, data: currentFormData } : tab))
        );
      }
      // Initialize or update initial values
      const hasValidClient = values.client?.id && values.client.id !== '';
      const hasValidCompany = values.company?.id && values.company.id !== '';
      const hasValidSite = values.site?.id && values.site.id !== '';

      // If no initial values exist yet, set them
      if (!initialTabValuesRef.current[activeTab]) {
        if (hasValidClient || hasValidCompany || hasValidSite) {
          initialTabValuesRef.current[activeTab] = {
            client: hasValidClient ? values.client : undefined,
            company: hasValidCompany ? values.company : undefined,
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

      if (hasValidCompany && !currentInitial.company) {
        updatedInitial.company = values.company;
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

      // Check for changes only when workers are assigned
      const hasWorkers = values.workers && values.workers.some((w: any) => w.id && w.id !== '');
      if (!hasWorkers) return;

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

      // Check for company change - only if both current and initial have valid IDs
      const hasCurrentCompany = values.company?.id && values.company.id !== '';
      const hasInitialCompany = initialValues.company?.id && initialValues.company.id !== '';

      if (
        hasCurrentCompany &&
        hasInitialCompany &&
        initialValues.company.id !== values.company.id
      ) {
        setCompanyChangeWarning({
          open: true,
          newCompanyName: values.company.name,
          previousCompanyName: initialValues.company.name,
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
        return;
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
        email: '',
        phone_number: '',
        photo_url: '',
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
          email: '',
          phone_number: '',
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

  // Handle company change confirmation
  const handleCompanyChangeConfirm = () => {
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
        email: '',
        phone_number: '',
        photo_url: '',
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
          email: '',
          phone_number: '',
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

    setCompanyChangeWarning((prev) => ({ ...prev, open: false }));

    // Clear initial values for this tab to prevent false change detection
    delete initialTabValuesRef.current[activeTab];
  };

  // Handle company change cancellation
  const handleCompanyChangeCancel = () => {
    // Revert the company back to the initial value
    const initialValues = initialTabValuesRef.current[activeTab];
    const initialCompany = initialValues?.company;

    if (initialCompany && formRef.current) {
      formRef.current.setValue('company', initialCompany);
    }

    setCompanyChangeWarning((prev) => ({ ...prev, open: false }));
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
        email: '',
        phone_number: '',
        photo_url: '',
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
          email: '',
          phone_number: '',
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

  const handleSendNotifications = useCallback(async () => {
    const toastId = toast.loading('Creating jobs and sending notifications...');
    loadingNotifications.onTrue();

    try {
      // Get current form data
      const currentFormData = formRef.current?.getValues();

      // Prepare jobs to create
      const jobsToCreate = isMultiMode
        ? jobTabs.map((tab, index) => ({
            ...tab,
            data: index === activeTab ? currentFormData : tab.data,
          }))
        : [
            {
              ...jobTabs[0],
              data: currentFormData,
            },
          ];

      // Create all jobs first
      const createdJobs = [];
      for (const tab of jobsToCreate) {
        // Filter out empty vehicles and equipment before sending to API
        const filteredVehicles = (tab.data.vehicles || [])
          .filter((v: any) => {
            const isValid = v.id && v.id !== '' && v.type && v.type !== '';

            return isValid;
          })
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
              // Fix: Use job-level times instead of potentially outdated worker times
              start_time: tab.data.start_date_time,
              end_time: tab.data.end_date_time,
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

      // Invalidate calendar queries to refresh cached data
      queryClient.invalidateQueries({ queryKey: ['calendar-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['worker-calendar-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['user-job-dates'] }); // Add this line

      // Send notifications for each created job
      let totalNotificationsSent = 0;
      let totalNotificationsFailed = 0;

      for (let i = 0; i < createdJobs.length; i++) {
        const createdJob = createdJobs[i];
        // Get the notification data for this job using the index
        const jobNotificationData = notificationTabs[i];

        // Extract the actual job ID from the nested structure
        const jobId = createdJob?.job?.id || createdJob?.id;

        if (jobNotificationData && jobId) {
          // Send notifications for each worker
          for (const worker of jobNotificationData.recipients.workers) {
            if (worker.notifyEmail || worker.notifyPhone) {
              try {
                // Update worker status to pending and send notifications
                const notificationResponse = await fetcher([
                  `${endpoints.work.job}/${jobId}/worker/${worker.id}/response`,
                  {
                    method: 'PUT',
                    data: {
                      status: 'pending',
                      sendEmail: worker.notifyEmail,
                      sendSMS: worker.notifyPhone,
                    },
                  },
                ]);

                const { notifications } = notificationResponse;
                if (notifications) {
                  if (notifications.emailSent) totalNotificationsSent++;
                  if (notifications.smsSent) totalNotificationsSent++;
                  if (notifications.errors && notifications.errors.length > 0) {
                    totalNotificationsFailed += notifications.errors.length;
                  }
                }
              } catch (notificationError) {
                console.error(
                  'Failed to send notification for worker:',
                  worker.id,
                  notificationError
                );
                totalNotificationsFailed++;
              }
            }
          }

          // Send notifications for each vehicle operator
          for (const vehicle of jobNotificationData.recipients.vehicles) {
            if (vehicle.operator.notifyEmail || vehicle.operator.notifyPhone) {
              try {
                // Update worker status to pending and send notifications
                const notificationResponse = await fetcher([
                  `${endpoints.work.job}/${jobId}/worker/${vehicle.operator.id}/response`,
                  {
                    method: 'PUT',
                    data: {
                      status: 'pending',
                      sendEmail: vehicle.operator.notifyEmail,
                      sendSMS: vehicle.operator.notifyPhone,
                    },
                  },
                ]);

                const { notifications } = notificationResponse;
                if (notifications) {
                  if (notifications.emailSent) totalNotificationsSent++;
                  if (notifications.smsSent) totalNotificationsSent++;
                  if (notifications.errors && notifications.errors.length > 0) {
                    totalNotificationsFailed += notifications.errors.length;
                  }
                }
              } catch (notificationError) {
                console.error(
                  'Failed to send notification for vehicle operator:',
                  vehicle.operator.id,
                  notificationError
                );
                totalNotificationsFailed++;
              }
            }
          }
        }
      }

      toast.dismiss(toastId);
      if (totalNotificationsSent > 0 && totalNotificationsFailed === 0) {
        toast.success(
          isMultiMode
            ? `Successfully created ${createdJobs.length} job(s) and sent ${totalNotificationsSent} notification(s)!`
            : `Job created successfully and ${totalNotificationsSent} notification(s) sent!`
        );
      } else if (totalNotificationsSent > 0 && totalNotificationsFailed > 0) {
        toast.warning(
          `Jobs created successfully! ${totalNotificationsSent} notification(s) sent, ${totalNotificationsFailed} failed.`
        );
      } else if (totalNotificationsFailed > 0) {
        toast.warning(
          `Jobs created successfully, but all notifications failed. Please contact workers manually.`
        );
      } else {
        toast.success(
          isMultiMode
            ? `Successfully created ${createdJobs.length} job(s)!`
            : 'Job created successfully!'
        );
      }

      loadingNotifications.onFalse();
      setNotificationDialogOpen(false);

      // Navigate to job list page
      router.push(paths.work.job.list);
    } catch (error) {
      toast.dismiss(toastId);
      console.error(error);
      toast.error('Failed to create jobs. Please try again.');
      loadingNotifications.onFalse();
    }
  }, [
    jobTabs,
    isMultiMode,
    loadingNotifications,
    queryClient,
    router,
    activeTab,
    notificationTabs,
  ]);

  const extractRecipients = (jobData: NewJobSchemaType) => {
    const workers = (jobData.workers || [])
      .filter((worker: any) => worker.id && worker.position)
      .map((worker: any) => {
        // Use the actual end_time without modification for display
        // The overnight shift logic should be handled in the display component, not here
        const displayEndTime = worker.end_time;

        // Check if this worker is also a vehicle operator
        const assignedVehicles = (jobData.vehicles || [])
          .filter((vehicle: any) => vehicle.operator?.id === worker.id)
          .map((vehicle: any) => ({
            type: vehicle.type,
            license_plate: vehicle.license_plate,
            unit_number: vehicle.unit_number,
          }));

        return {
          id: worker.id,
          name: `${worker.first_name} ${worker.last_name}`.trim(),
          position: worker.position,
          photo_url: worker.photo_url,
          email: worker.email || '',
          phone: worker.phone_number || worker.phone || '',
          start_time: worker.start_time,
          end_time: displayEndTime,
          assignedVehicles,
          notifyEmail: Boolean(worker.email),
          notifyPhone: Boolean(worker.phone_number || worker.phone),
        };
      });

    const vehicles = (jobData.vehicles || [])
      .filter((vehicle: any) => vehicle.operator?.id)
      .map((vehicle: any) => ({
        id: vehicle.id,
        type: vehicle.type,
        license_plate: vehicle.license_plate,
        unit_number: vehicle.unit_number,
        operator: {
          id: vehicle.operator.id,
          name: `${vehicle.operator.first_name} ${vehicle.operator.last_name}`.trim(),
          photo_url: vehicle.operator.photo_url,
          email: vehicle.operator.email || '',
          phone: vehicle.operator.phone_number || vehicle.operator.phone || '',
          notifyEmail: Boolean(vehicle.operator.email),
          notifyPhone: Boolean(vehicle.operator.phone_number || vehicle.operator.phone),
        },
      }));

    const result = { workers, vehicles };
    return result;
  };

  const handleOpenNotificationDialog = () => {
    // Prepare notification tabs based on current job tabs
    const currentFormData = formRef.current?.getValues();

    if (isMultiMode) {
      const tabs = jobTabs.map((tab, index) => {
        const tabData = index === activeTab ? currentFormData : tab.data;
        return {
          id: tab.id,
          title: tab.title,
          jobData: tabData,
          recipients: extractRecipients(tabData),
          isValid: tab.isValid,
        };
      });
      setNotificationTabs(tabs);
    } else {
      setNotificationTabs([
        {
          id: '1',
          title: 'Job 1',
          jobData: currentFormData,
          recipients: extractRecipients(currentFormData),
          isValid: jobTabs[0]?.isValid || false,
        },
      ]);
    }

    setActiveNotificationTab(0);
    setNotificationDialogOpen(true);
  };

  const handleNotificationTabChange = (event: React.SyntheticEvent, newValue: number) => {
    if (newValue >= notificationTabs.length) return;
    setActiveNotificationTab(newValue);
  };

  const handleWorkerNotificationChange = (
    workerId: string,
    type: 'email' | 'phone',
    checked: boolean
  ) => {
    setNotificationTabs((prev) =>
      prev.map((tab) => ({
        ...tab,
        recipients: {
          ...tab.recipients,
          workers: tab.recipients.workers.map((worker) =>
            worker.id === workerId
              ? { ...worker, [`notify${type.charAt(0).toUpperCase() + type.slice(1)}`]: checked }
              : worker
          ),
        },
      }))
    );
  };

  const handleVehicleNotificationChange = (
    vehicleId: string,
    type: 'email' | 'phone',
    checked: boolean
  ) => {
    setNotificationTabs((prev) =>
      prev.map((tab) => ({
        ...tab,
        recipients: {
          ...tab.recipients,
          vehicles: tab.recipients.vehicles.map((vehicle) =>
            vehicle.id === vehicleId
              ? {
                  ...vehicle,
                  operator: {
                    ...vehicle.operator,
                    [`notify${type.charAt(0).toUpperCase() + type.slice(1)}`]: checked,
                  },
                }
              : vehicle
          ),
        },
      }))
    );
  };

  const currentTabData = useMemo(() => jobTabs[activeTab] || jobTabs[0], [jobTabs, activeTab]);

  // Cleanup effect to close dialogs when active tab changes
  useEffect(() => {
    // Close any open dialogs when active tab changes
    setClientChangeWarning((prev) => ({ ...prev, open: false }));
    setCompanyChangeWarning((prev) => ({ ...prev, open: false }));
    setSiteChangeWarning((prev) => ({ ...prev, open: false }));
  }, [activeTab]);

  // Client and company change warning states
  const [clientChangeWarning, setClientChangeWarning] = useState<{
    open: boolean;
    newClientName: string;
    previousClientName: string;
  }>({
    open: false,
    newClientName: '',
    previousClientName: '',
  });

  const [companyChangeWarning, setCompanyChangeWarning] = useState<{
    open: boolean;
    newCompanyName: string;
    previousCompanyName: string;
  }>({
    open: false,
    newCompanyName: '',
    previousCompanyName: '',
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
    [tabIndex: number]: { client?: any; company?: any; site?: any };
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
          key={`tab-${activeTab}-${currentTabData.id}`}
          ref={formRef}
          data={currentTabData.data}
          onValidationChange={handleCurrentTabValidationChange}
          onFormValuesChange={handleFormValuesChange}
          isMultiMode={isMultiMode}
          userList={userList}
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
            {jobTabs.filter((tab) => tab.isValid).length !== jobTabs.length && ' (all jobs must be complete)'}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {jobTabs[0]?.isValid ? 'Job ready' : 'Please fill in required fields'}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => router.push(paths.work.job.list)}>
            Cancel
          </Button>

          <Button
            variant="contained"
            loading={loadingSend.value}
            onClick={isMultiMode ? handleCreateAllJobs : () => handleCreateAllJobs()}
            disabled={
              isMultiMode ? jobTabs.filter((tab) => tab.isValid).length !== jobTabs.length : !jobTabs[0]?.isValid
            }
          >
            {isMultiMode
              ? `Create All Jobs (${jobTabs.filter((tab) => tab.isValid).length})`
              : 'Create Job'}
          </Button>

          <Button
            variant="contained"
            color="success"
            onClick={handleOpenNotificationDialog}
            disabled={
              isMultiMode ? jobTabs.filter((tab) => tab.isValid).length !== jobTabs.length : !jobTabs[0]?.isValid
            }
            startIcon={<Iconify icon="solar:bell-bing-bold" />}
          >
            Create & Send
          </Button>
        </Box>
      </Box>

      {/* Notification Dialog */}
      <Dialog
        open={notificationDialogOpen}
        onClose={() => setNotificationDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Create & Send Notifications</Typography>
            <IconButton onClick={() => setNotificationDialogOpen(false)} size="small">
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {isMultiMode && notificationTabs.length > 1 && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                  {notificationTabs.map((tab, index) => (
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
                        backgroundColor:
                          activeNotificationTab === index ? 'primary.main' : 'transparent',
                        color:
                          activeNotificationTab === index ? 'primary.contrastText' : 'text.primary',
                        border: 1,
                        borderColor: activeNotificationTab === index ? 'primary.main' : 'divider',
                        '&:hover': {
                          backgroundColor:
                            activeNotificationTab === index ? 'primary.dark' : 'action.hover',
                        },
                      }}
                      onClick={() => handleNotificationTabChange({} as React.SyntheticEvent, index)}
                    >
                      <Typography variant="body2">{tab.title}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}

          {notificationTabs[activeNotificationTab] && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {notificationTabs.length === 1
                  ? 'Job Details'
                  : `${notificationTabs[activeNotificationTab].title} - Job Details`}
              </Typography>

              {/* Job Information */}
              <Box sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Client:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {notificationTabs[activeNotificationTab].jobData.client?.name || 'N/A'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Company:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {notificationTabs[activeNotificationTab].jobData.company?.name || 'N/A'}
                    </Typography>
                  </Box>

                  {dayjs(notificationTabs[activeNotificationTab].jobData.start_date_time).isSame(
                    dayjs(notificationTabs[activeNotificationTab].jobData.end_date_time),
                    'day'
                  ) ? (
                    // Same day - show date and time range
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Date:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {dayjs(
                            notificationTabs[activeNotificationTab].jobData.start_date_time
                          ).format('MMM DD, YYYY')}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Time:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {dayjs(
                            notificationTabs[activeNotificationTab].jobData.start_date_time
                          ).format('h:mm A')}{' '}
                          -{' '}
                          {dayjs(
                            notificationTabs[activeNotificationTab].jobData.end_date_time
                          ).format('h:mm A')}
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    // Different days - show start and end separately
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Start:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {dayjs(
                            notificationTabs[activeNotificationTab].jobData.start_date_time
                          ).format('MMM DD, YYYY h:mm A')}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          End:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {dayjs(
                            notificationTabs[activeNotificationTab].jobData.end_date_time
                          ).format('MMM DD, YYYY h:mm A')}
                        </Typography>
                      </Box>
                    </>
                  )}

                  {notificationTabs[activeNotificationTab].jobData.po_number && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        PO Number:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {notificationTabs[activeNotificationTab].jobData.po_number}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>

              {/* Workers Section */}
              {notificationTabs[activeNotificationTab].recipients.workers.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <Iconify icon="solar:users-group-rounded-bold" />
                    Assigned Workers (
                    {notificationTabs[activeNotificationTab].recipients.workers.length})
                  </Typography>
                  <Stack spacing={1.5}>
                    {notificationTabs[activeNotificationTab].recipients.workers.map(
                      (worker, index) => (
                        <Box
                          key={worker.id}
                          sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'stretch', sm: 'center' },
                            justifyContent: { xs: 'flex-start', sm: 'space-between' },
                            gap: { xs: 1, sm: 2 },
                            p: { xs: 1.5, md: 0 },
                            border: { xs: '1px solid', md: 'none' },
                            borderColor: { xs: 'divider', md: 'transparent' },
                            borderRadius: 1,
                          }}
                        >
                          {/* Position and Worker Info */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              minWidth: 0,
                              flex: { xs: 'none', sm: 1 },
                              mb: { xs: 1, sm: 0 },
                            }}
                          >
                            <Chip
                              label={
                                JOB_POSITION_OPTIONS.find(
                                  (option) => option.value === worker.position
                                )?.label || worker.position
                              }
                              size="small"
                              color={getPositionColor(worker.position)}
                              variant="soft"
                              sx={{ minWidth: 60, flexShrink: 0 }}
                            />
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                minWidth: 0,
                                flex: 1,
                              }}
                            >
                              <Avatar
                                src={worker?.photo_url ?? undefined}
                                alt={worker?.name}
                                sx={{
                                  width: { xs: 28, md: 32 },
                                  height: { xs: 28, md: 32 },
                                  flexShrink: 0,
                                }}
                              >
                                {worker?.name?.charAt(0).toUpperCase()}
                              </Avatar>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: 500,
                                  minWidth: 0,
                                  flex: 1,
                                }}
                              >
                                {worker.name}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Time Info */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: { xs: 1, md: 2 },
                              flexShrink: 0,
                              flexDirection: { xs: 'column', md: 'row' },
                              alignSelf: { xs: 'stretch', md: 'center' },
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: { xs: 1, md: 1 },
                                width: { xs: '100%', md: 'auto' },
                              }}
                            >
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {(() => {
                                  const startTime = dayjs(worker.start_time);
                                  const endTime = dayjs(worker.end_time);

                                  // Check if this is an overnight shift (start time PM, end time AM)
                                  const startHour = startTime.hour();
                                  const endHour = endTime.hour();
                                  const isOvernight = startHour >= 12 && endHour < 12;

                                  if (startTime.isSame(endTime, 'day') && !isOvernight) {
                                    // Same day, not overnight
                                    return (
                                      <>
                                        <Typography variant="body2">
                                          Start: {startTime.format('h:mm A')}
                                        </Typography>
                                        <Typography variant="body2">
                                          End: {endTime.format('h:mm A')}
                                        </Typography>
                                      </>
                                    );
                                  } else {
                                    // Different days or overnight shift
                                    return (
                                      <>
                                        <Typography variant="body2">
                                          Start: {startTime.format('MMM DD, h:mm A')}
                                        </Typography>
                                        <Typography variant="body2">
                                          End: {endTime.format('MMM DD, h:mm A')}
                                        </Typography>
                                      </>
                                    );
                                  }
                                })()}
                              </Box>
                            </Box>

                            {/* Notification Toggles */}
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                                alignSelf: { xs: 'flex-start', md: 'center' },
                              }}
                            >
                              {worker.email && (
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={worker.notifyEmail}
                                      onChange={(e) =>
                                        handleWorkerNotificationChange(
                                          worker.id,
                                          'email',
                                          e.target.checked
                                        )
                                      }
                                      size="small"
                                      color="primary"
                                    />
                                  }
                                  label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <Iconify
                                        icon="solar:letter-bold"
                                        sx={{ width: 16, height: 16 }}
                                      />
                                      <Typography variant="body2">
                                        Email ({worker.email})
                                      </Typography>
                                    </Box>
                                  }
                                />
                              )}
                              {worker.phone && (
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={worker.notifyPhone}
                                      onChange={(e) =>
                                        handleWorkerNotificationChange(
                                          worker.id,
                                          'phone',
                                          e.target.checked
                                        )
                                      }
                                      size="small"
                                      color="primary"
                                    />
                                  }
                                  label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <Iconify
                                        icon="solar:phone-bold"
                                        sx={{ width: 16, height: 16 }}
                                      />
                                      <Typography variant="body2">
                                        SMS ({formatPhoneNumber(worker.phone)})
                                      </Typography>
                                    </Box>
                                  }
                                />
                              )}
                            </Box>
                          </Box>
                        </Box>
                      )
                    )}
                  </Stack>
                </Box>
              )}
              <Divider />
              {/* Vehicles Section */}
              {notificationTabs[activeNotificationTab].recipients.vehicles.length > 0 && (
                <Box sx={{ mb: 3, mt: 3 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <Iconify icon="solar:cart-3-bold" />
                    Vehicle & Operators (
                    {notificationTabs[activeNotificationTab].recipients.vehicles.length})
                  </Typography>
                  <Stack spacing={1.5}>
                    {notificationTabs[activeNotificationTab].recipients.vehicles.map(
                      (vehicle: any, index: number) => (
                        <Box
                          key={vehicle.id || index}
                          sx={{
                            // Responsive layout
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'stretch', sm: 'center' },
                            justifyContent: { xs: 'flex-start', sm: 'space-between' },
                            gap: { xs: 1, sm: 2 },
                            p: { xs: 1.5, md: 0 },
                            border: { xs: '1px solid', md: 'none' },
                            borderColor: { xs: 'divider', md: 'transparent' },
                            borderRadius: 1,
                            // '&:hover': {
                            //   bgcolor: 'background.neutral',
                            // },
                          }}
                        >
                          {/* Vehicle Info */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              minWidth: 0,
                              flex: { xs: 'none', sm: 1 },
                              mb: { xs: vehicle.operator ? 1 : 0, sm: 0 },
                            }}
                          >
                            <Chip
                              label={formatVehicleType(vehicle.type)}
                              size="medium"
                              variant="outlined"
                              sx={{ minWidth: 80, flexShrink: 0 }}
                            />
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 500,
                                minWidth: 0,
                                flex: 1,
                              }}
                            >
                              {vehicle.license_plate} - {vehicle.unit_number}
                            </Typography>
                          </Box>

                          {/* Operator Info */}
                          {vehicle.operator && (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                flexShrink: 0,
                                ml: { xs: 1, sm: 0 },
                              }}
                            >
                              <Avatar
                                src={vehicle.operator?.photo_url ?? undefined}
                                alt={vehicle.operator?.name}
                                sx={{
                                  width: { xs: 28, md: 32 },
                                  height: { xs: 28, md: 32 },
                                  flexShrink: 0,
                                }}
                              >
                                {vehicle.operator?.name?.charAt(0).toUpperCase()}
                              </Avatar>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: 500,
                                }}
                              >
                                {vehicle.operator.name}
                              </Typography>

                              {/* Notification Toggles */}
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 1,
                                  ml: 2,
                                  alignSelf: { xs: 'flex-start', md: 'center' },
                                }}
                              >
                                {vehicle.operator.email && (
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={vehicle.operator.notifyEmail}
                                        onChange={(e) =>
                                          handleVehicleNotificationChange(
                                            vehicle.id,
                                            'email',
                                            e.target.checked
                                          )
                                        }
                                        size="small"
                                        color="primary"
                                      />
                                    }
                                    label={
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Iconify
                                          icon="solar:letter-bold"
                                          sx={{ width: 16, height: 16 }}
                                        />
                                        <Typography variant="body2">
                                          Email ({vehicle.operator.email})
                                        </Typography>
                                      </Box>
                                    }
                                  />
                                )}
                                {vehicle.operator.phone && (
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={vehicle.operator.notifyPhone}
                                        onChange={(e) =>
                                          handleVehicleNotificationChange(
                                            vehicle.id,
                                            'phone',
                                            e.target.checked
                                          )
                                        }
                                        size="small"
                                        color="primary"
                                      />
                                    }
                                    label={
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Iconify
                                          icon="solar:phone-bold"
                                          sx={{ width: 16, height: 16 }}
                                        />
                                        <Typography variant="body2">
                                          SMS ({formatPhoneNumber(vehicle.operator.phone)})
                                        </Typography>
                                      </Box>
                                    }
                                  />
                                )}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      )
                    )}
                  </Stack>
                </Box>
              )}

              {/* Equipment Section */}
              {notificationTabs[activeNotificationTab].jobData.equipments &&
                notificationTabs[activeNotificationTab].jobData.equipments.length > 0 && (
                  <>
                    <Divider />
                    <Box sx={{ mb: 3, mt: 3 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Iconify icon="solar:inbox-bold" />
                        Equipment (
                        {notificationTabs[activeNotificationTab].jobData.equipments.length})
                      </Typography>
                      <Stack>
                        {notificationTabs[activeNotificationTab].jobData.equipments.map(
                          (equipment: any, index: number) => (
                            <Box
                              key={equipment.id || index}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 1,
                              }}
                            >
                              <Chip
                                label={equipment.type
                                  ?.replace(/_/g, ' ')
                                  .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                variant="outlined"
                                sx={{ minWidth: 80 }}
                              />
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 500, color: 'text.secondary' }}
                              >
                                QTY: {equipment.quantity || 1}
                              </Typography>
                            </Box>
                          )
                        )}
                      </Stack>
                    </Box>
                  </>
                )}

              {/* Notes Section */}
              {notificationTabs[activeNotificationTab].jobData.note && (
                <>
                  <Divider />

                  <Box sx={{ mb: 3, mt: 3 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                      <Iconify icon="solar:notes-bold-duotone" />
                      Notes
                    </Typography>
                    <Box
                      sx={{
                        p: 2,
                        pt: 0,
                        // border: 1,
                        // borderColor: 'divider',
                        // borderRadius: 1,
                        // bgcolor: 'background.neutral',
                      }}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {notificationTabs[activeNotificationTab].jobData.note}
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}

              {notificationTabs[activeNotificationTab].recipients.workers.length === 0 &&
                notificationTabs[activeNotificationTab].recipients.vehicles.length === 0 && (
                  <Alert severity="warning">
                    <Typography variant="body2">
                      No recipients found for this job. Please assign workers or vehicle operators
                      first.
                    </Typography>
                  </Alert>
                )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setNotificationDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSendNotifications}
            variant="contained"
            color="success"
            loading={loadingNotifications.value}
            disabled={notificationTabs.filter((tab) => tab.isValid).length === 0}
            startIcon={<Iconify icon="solar:bell-bing-bold" />}
          >
            Create & Send ({notificationTabs.filter((tab) => tab.isValid).length})
          </Button>
        </DialogActions>
      </Dialog>

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

      {/* Company Change Warning Dialog */}
      <Dialog
        open={companyChangeWarning.open}
        onClose={handleCompanyChangeCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Company Change Warning</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              You&apos;ve changed the company from{' '}
              <strong>{companyChangeWarning.previousCompanyName}</strong> to{' '}
              <strong>{companyChangeWarning.newCompanyName}</strong>.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              This will reset all assigned workers, vehicles, and equipment because:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 1 }}>
              <li>Different companies may have different requirements</li>
              <li>Workers assigned to one company may not be suitable for another</li>
              <li>Vehicle and equipment needs may vary by location</li>
            </Typography>
            <Typography variant="body2">
              Do you want to continue and reset all assignments?
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCompanyChangeCancel} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleCompanyChangeConfirm} variant="contained" color="warning">
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
              <li>Different sites may have different employee preferences</li>
              <li>Workers assigned to one site may not be suitable for another</li>
              <li>Site-specific requirements may vary</li>
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
  onFormValuesChange?: (values: {
    client?: any;
    company?: any;
    site?: any;
    workers?: any[];
    timesheet_manager_id?: any;
  }) => void;
  isMultiMode?: boolean;
  userList?: any[];
};

const JobFormTab = React.forwardRef<any, JobFormTabProps>(
  ({ data, onValidationChange, onFormValuesChange, isMultiMode = false, userList }, ref) => {
    const methods = useForm<NewJobSchemaType>({
      mode: 'onSubmit',
      resolver: zodResolver(NewJobSchema),
      defaultValues: data,
    });

    // Watch for form values changes for change detection
    const watchedClient = methods.watch('client');
    const watchedCompany = methods.watch('company');
    const watchedSite = methods.watch('site');
    const watchedWorkers = methods.watch('workers');
    const watchedTimesheetManager = methods.watch('timesheet_manager_id');

    // Simple validation effect that runs whenever form values change
    useEffect(() => {
      const formValues = methods.getValues();

      const hasClient = Boolean(formValues.client?.id && formValues.client.id !== '');
      const hasCompany = Boolean(formValues.company?.id && formValues.company.id !== '');
      const hasSite = Boolean(formValues.site?.id && formValues.site.id !== '');
      const hasWorkers = Boolean(
        formValues.workers &&
          formValues.workers.length > 0 &&
          formValues.workers.some(
            (worker: any) =>
              worker.id && worker.id !== '' && worker.position && worker.position !== ''
          )
      );
      const hasTimesheetManager = Boolean(formValues.timesheet_manager_id && formValues.timesheet_manager_id !== '');

      const isFormValid = hasClient && hasCompany && hasSite && hasWorkers && hasTimesheetManager;

      onValidationChange(isFormValid);
    }, [methods, onValidationChange, watchedClient, watchedCompany, watchedSite, watchedWorkers, watchedTimesheetManager]);

    // Force validation to run when any form field changes
    useEffect(() => {
      const subscription = methods.watch((value, { name }) => {
        const formValues = methods.getValues();
        const hasClient = Boolean(formValues.client?.id && formValues.client.id !== '');
        const hasCompany = Boolean(formValues.company?.id && formValues.company.id !== '');
        const hasSite = Boolean(formValues.site?.id && formValues.site.id !== '');
        const hasWorkers = Boolean(
          formValues.workers &&
            formValues.workers.length > 0 &&
            formValues.workers.some(
              (worker: any) =>
                worker.id && worker.id !== '' && worker.position && worker.position !== ''
            )
        );
        const hasTimesheetManager = Boolean(formValues.timesheet_manager_id && formValues.timesheet_manager_id !== '');

        const isFormValid = hasClient && hasCompany && hasSite && hasWorkers && hasTimesheetManager;

        onValidationChange(isFormValid);
      });

      return () => subscription.unsubscribe();
    }, [methods, onValidationChange]);

    // Additional validation check with timeout to ensure it runs after form is fully initialized
    useEffect(() => {
      const timeoutId = setTimeout(() => {
        const formValues = methods.getValues();

        const hasClient = Boolean(formValues.client?.id && formValues.client.id !== '');
        const hasCompany = Boolean(formValues.company?.id && formValues.company.id !== '');
        const hasSite = Boolean(formValues.site?.id && formValues.site.id !== '');
        const hasWorkers = Boolean(
          formValues.workers &&
            formValues.workers.length > 0 &&
            formValues.workers.some(
              (worker: any) =>
                worker.id && worker.id !== '' && worker.position && worker.position !== ''
            )
        );
        const hasTimesheetManager = Boolean(formValues.timesheet_manager_id && formValues.timesheet_manager_id !== '');

        const isFormValid = hasClient && hasCompany && hasSite && hasWorkers && hasTimesheetManager;

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
          company: watchedCompany,
          site: watchedSite,
          workers: watchedWorkers,
          timesheet_manager_id: watchedTimesheetManager,
        });
      }
    }, [watchedClient, watchedCompany, watchedSite, watchedWorkers, watchedTimesheetManager, onFormValuesChange]);

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
          <JobNewEditDetails userList={userList} />
        </Card>
      </Form>
    );
  }
);
