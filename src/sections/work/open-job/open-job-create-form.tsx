import type { IEmployeePreferences } from 'src/types/preference';
import type { ScheduleConflict } from 'src/utils/schedule-conflict';

import dayjs from 'dayjs';
import { z as zod } from 'zod';
import { Icon } from '@iconify/react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useRef, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
  Stack,
  Alert,
  Button,
  Avatar,
  Dialog,
  Switch,
  Tooltip,
  Divider,
  Checkbox,
  TextField,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  CircularProgress,
  FormControlLabel,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fIsAfter } from 'src/utils/format-time';
import { getPositionColor } from 'src/utils/format-role';
import { analyzeScheduleConflicts } from 'src/utils/schedule-conflict';

import { fetcher, endpoints } from 'src/lib/axios';
import { VEHICLE_TYPE_OPTIONS } from 'src/assets/data/vehicle';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, schemaHelper } from 'src/components/hook-form';
import { WorkerWarningDialog } from 'src/components/preference/worker-warning-dialog';
import { EnhancedPreferenceIndicators } from 'src/components/preference/enhanced-preference-indicators';

import { ScheduleConflictDialog } from 'src/sections/work/job/schedule-conflict-dialog';

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

import { JobNewEditAddress } from './open-job-new-edit-address';
import { JobNewEditDetails } from './open-job-new-edit-details';
import { JobNewEditStatusDate } from './open-job-new-edit-status-date';

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
    site: zod.object({
      id: zod.string().min(1, { message: 'Site is required!' }),
      company_id: zod.string().optional(),
      name: zod.string().optional(),
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
    // Not required
    status: zod.string(),
    po_number: zod.string().optional(),
    network_number: zod.string().optional(),
    note: zod.string().optional(),
    workers: zod
      .array(
        zod
          .object({
            position: zod.string().min(1, { message: 'Position is required!' }),
            id: zod.string().nullable().optional(),
            first_name: zod.string().nullable().optional(),
            last_name: zod.string().nullable().optional(),
            start_time: schemaHelper.date({
              message: { required: 'Start date and time are required!' },
            }),
            end_time: schemaHelper.date({
              message: { required: 'End date and time are required!' },
            }),
            status: zod.string().nullable().optional(),
            email: zod.string().nullable().optional(),
            phone_number: zod.string().nullable().optional(),
            photo_url: zod.string().nullable().optional(),
          })
          .superRefine((val, ctx) => {
            // For open jobs, we only require position, not specific employee assignment
            if (val.position && val.position === '') {
              ctx.addIssue({
                code: zod.ZodIssueCode.custom,
                message: 'Position is required!',
                path: ['position'],
              });
            }
          })
      )
      .optional()
      .default([]),
    vehicles: zod.array(
      zod
        .object({
          type: zod.string().nullable().optional(),
          id: zod.string().nullable().optional(),
          quantity: zod.coerce.number().int().positive({ message: 'Quantity must be at least 1' }),
          license_plate: zod.string().nullable().optional(),
          unit_number: zod.string().nullable().optional(),
          operator: zod
            .object({
              id: zod.string().nullable().default(''),
              first_name: zod.string().nullable().optional(),
              last_name: zod.string().nullable().optional(),
              photo_url: zod.string().nullable().optional(),
              worker_index: zod.number().nullable().optional(),
              email: zod.string().nullable().optional(),
              phone_number: zod.string().nullable().optional(),
            })
            .optional(), // Make operator optional for open jobs
        })
        .superRefine((val, ctx) => {
          // For open jobs, vehicles don't require operators initially
          // Only validate vehicle type if provided
          if (val.type && val.type.trim()) {
            // Vehicle type is provided, so validate other fields
            if (!val.license_plate || !val.license_plate.trim()) {
              ctx.addIssue({
                code: zod.ZodIssueCode.custom,
                message: 'License plate is required when vehicle type is specified!',
                path: ['license_plate'],
              });
            }
            if (!val.unit_number || !val.unit_number.trim()) {
              ctx.addIssue({
                code: zod.ZodIssueCode.custom,
                message: 'Unit number is required when vehicle type is specified!',
                path: ['unit_number'],
              });
            }

            // Validate quantity is provided and positive
            if (!val.quantity || val.quantity < 1) {
              ctx.addIssue({
                code: zod.ZodIssueCode.custom,
                message: 'Vehicle quantity is required and must be at least 1!',
                path: ['quantity'],
              });
            }
          }
          // Note: Operator is optional for open jobs - workers will be assigned later
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
    timesheet_manager_id: zod.string().optional(),
  })
  .refine((data) => !fIsAfter(data.start_date_time, data.end_date_time), {
    message: 'End date time cannot be earlier than create date!',
    path: ['end_date_time'],
  })
  .refine(
    (data) => {
      // Validate that total vehicle quantity doesn't exceed available LCT positions
      if (data.vehicles && data.vehicles.length > 0) {
        const totalVehicleQuantity = data.vehicles.reduce((total, vehicle) => {
          if (vehicle.type && vehicle.quantity) {
            return total + vehicle.quantity;
          }
          return total;
        }, 0);

        const lctWorkerCount =
          data.workers?.filter(
            (worker) => worker.position && worker.position.toLowerCase() === 'lct'
          ).length || 0;

        return totalVehicleQuantity <= lctWorkerCount;
      }
      return true;
    },
    {
      message: 'Total vehicle quantity cannot exceed the number of LCT positions!',
      path: ['vehicles'],
    }
  );

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

interface NotificationTab {
  id: string;
  title: string;
  jobData: NewJobSchemaType;
  recipients: {
    workers: Array<{
      id: string;
      userId?: string;
      name: string;
      position: string;
      photo_url?: string;
      email?: string;
      phone?: string;
      start_time?: any;
      end_time?: any;
      assignedVehicles?: any[];
      notifyEmail: boolean;
      notifyPhone: boolean;
      userPositions?: string[];
      isCompatible?: boolean;
      isEligible?: boolean;
      isMock?: boolean;
      hasScheduleConflict?: boolean;
      hasBlockingScheduleConflict?: boolean;
      hasUnavailabilityConflict?: boolean;
      conflictInfo?: any;
      hasTimeOffConflict?: boolean;
      timeOffConflicts?: any[];
      preferences: IEmployeePreferences;
    }>;
    vehicles: any[];
  };
  isValid: boolean;
}

type Props = {
  currentJob?: any;
  userList?: any[];
};

export function JobMultiCreateForm({ currentJob, userList }: Props) {
  const router = useRouter();
  // const loadingSend = useBoolean();
  const loadingNotifications = useBoolean();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [isMultiMode] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [activeNotificationTab, setActiveNotificationTab] = useState(0);
  const [notificationTabs, setNotificationTabs] = useState<NotificationTab[]>([]);

  // State for worker selection (separate from eligibility)
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<Set<string>>(new Set());

  // State for worker display filter
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [workerSearchQuery, setWorkerSearchQuery] = useState('');

  // State for worker warning dialog
  const [workerWarning, setWorkerWarning] = useState<any>({
    open: false,
    employee: { name: '', id: '' },
    warningType: 'not_preferred',
    reasons: [],
    isMandatory: false,
    canProceed: true,
  });

  // State for schedule conflict dialog
  const [scheduleConflictDialog, setScheduleConflictDialog] = useState({
    open: false,
    workerName: '',
    workerPhotoUrl: '',
    conflicts: [] as any[],
  });

  const formRef = useRef<any>(null);

  // Fetch users if not provided via props
  const {
    data: fetchedUsers,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ['users', 'job-creation'],
    queryFn: async () => {
      try {
        // Use the dedicated job creation endpoint that returns all users
        const response = await fetcher(`${endpoints.management.user}/job-creation`);
        return response.data.users || [];
      } catch (error) {
        console.error('❌ Error fetching users:', error);

        return [];
      }
    },
    enabled: !userList || userList.length === 0, // Only fetch if userList is not provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2, // Retry failed requests
  });

  // Use provided userList or fetched users
  const availableUsers = userList || fetchedUsers || [];
  const finalUsers = availableUsers.length > 0 ? availableUsers : [];

  // Availability checking will be done inside the Form component when context is available

  // Removed unused fallbackUsers variable

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
          ? dayjs(jobData.start_time).toDate()
          : defaultStartDateTime,
        end_date_time: jobData.end_time
          ? dayjs(jobData.end_time).toDate()
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
        network_number: jobData.network_number || '',
        note: jobData.notes || jobData.note || '',
        workers:
          jobData.workers?.length > 0
            ? jobData.workers.map((worker: any) => ({
                id: worker.id, // API returns id directly
                position: worker.position || '',
                first_name: worker.first_name || '',
                last_name: worker.last_name || '',
                // Use worker times directly - they will be normalized to job date during submission
                start_time: worker.start_time
                  ? dayjs(worker.start_time).toDate()
                  : defaultStartDateTime,
                end_time: worker.end_time ? dayjs(worker.end_time).toDate() : defaultEndDateTime,
                status: worker.status || 'draft',
                email: worker.email || '',
                phone_number: worker.phone_number || '',
                photo_url: worker.photo_url || '',
              }))
            : [
                {
                  ...defaultWorkerForm,
                  // Use job times directly - will be normalized during submission
                  start_time: jobData.start_time
                    ? dayjs(jobData.start_time).toDate()
                    : defaultStartDateTime,
                  end_time: jobData.end_time
                    ? dayjs(jobData.end_time).toDate()
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
      network_number: '',

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
    const toastId = toast.loading('Creating open job and sending notifications...');
    loadingNotifications.onTrue();

    try {
      // Get current form data
      const currentFormData = formRef.current?.getValues();

      // Validate that selected worker counts match required position counts
      const positionCounts: Record<string, number> = {};
      const selectedWorkerCounts: Record<string, number> = {};

      // Count required positions from form data
      currentFormData.workers?.forEach((worker: any) => {
        if (worker.position) {
          positionCounts[worker.position] = (positionCounts[worker.position] || 0) + 1;
        }
      });

      // Count selected workers from dialog state (selectedWorkerIds)
      const availableWorkers = notificationTabs[0].recipients.workers;
      availableWorkers.forEach((worker: any) => {
        if (selectedWorkerIds.has(worker.id) && worker.position) {
          selectedWorkerCounts[worker.position] = (selectedWorkerCounts[worker.position] || 0) + 1;
        }
      });

      // Check if all required positions have enough selected workers
      const missingWorkers: string[] = [];
      Object.entries(positionCounts).forEach(([position, requiredCount]) => {
        const selectedCount = selectedWorkerCounts[position] || 0;
        if (selectedCount < requiredCount) {
          const missing = requiredCount - selectedCount;
          missingWorkers.push(
            `${missing} ${position.toUpperCase()} worker${missing > 1 ? 's' : ''}`
          );
        }
      });

      if (missingWorkers.length > 0) {
        toast.dismiss(toastId);
        loadingNotifications.onFalse();
        toast.error(`Please select more workers: ${missingWorkers.join(', ')} required.`);
        return;
      }

      // Prepare open job data
      const openJobData = {
        ...currentFormData,
        is_open_job: true,
        open_job_status: 'posted',
        posted_at: new Date().toISOString(),
        start_date_time: currentFormData.start_date_time,
        end_date_time: currentFormData.end_date_time,
        notes: currentFormData.note,
        timesheet_manager_id: null, // Don't set manager for open jobs - will be assigned later
        // For open jobs, send position requirements (not specific worker assignments)
        workers: (currentFormData.workers || [])
          .filter((w: any) => w.position && w.position !== '')
          .map((worker: any) => ({
            position: worker.position,
            start_time: worker.start_time,
            end_time: worker.end_time,
            status: 'open',
          })),
        vehicles: (currentFormData.vehicles || [])
          .filter((v: any) => v.type && v.type !== '')
          .map((vehicle: any) => ({
            type: vehicle.type,
            quantity: vehicle.quantity || 1,
          })),
        equipments: (currentFormData.equipments || [])
          .filter((e: any) => e.type && e.type !== '')
          .map((equipment: any) => ({
            type: equipment.type,
            quantity: equipment.quantity || 1,
          })),
      };

      // Create the open job
      const response = await fetcher([
        endpoints.work.job,
        {
          method: 'POST',
          data: openJobData,
        },
      ]);

      const createdJob = response.data;
      const jobId = createdJob?.job?.id || createdJob?.id;

      if (!jobId) {
        throw new Error('Failed to create open job');
      }

      // Invalidate job queries to refresh cached data
      queryClient.invalidateQueries({ queryKey: ['jobs'] });

      // Invalidate calendar queries to refresh cached data
      queryClient.invalidateQueries({ queryKey: ['calendar-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['worker-calendar-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['user-job-dates'] }); // Add this line

      // Send open job notifications to selected workers
      let totalNotificationsSent = 0;

      const selectedWorkers = notificationTabs[0].recipients.workers.filter((worker: any) =>
        selectedWorkerIds.has(worker.id)
      );

      for (const worker of selectedWorkers) {
        try {
          // Send open job notification using the new endpoint
          const notificationResponse = await fetcher([
            `${endpoints.work.job}/${jobId}/notify-open-job`,
            {
              method: 'POST',
              data: {
                workerId: worker.userId, // Use the original user ID, not the composite position ID
                sendEmail: true,
                sendSMS: true,
              },
            },
          ]);

          if (notificationResponse.success) {
            totalNotificationsSent += 2; // Email + SMS
          } else {
            console.error(
              `❌ Notification failed for worker ${worker.name}:`,
              notificationResponse
            );
          }
        } catch (notificationError) {
          console.error(
            'Failed to send open job notification for worker:',
            worker.id,
            notificationError
          );
        }
      }

      // Show success message
      toast.success(
        `Open job created successfully! ${totalNotificationsSent} notifications sent.`,
        { id: toastId }
      );

      // Close the notification dialog
      setNotificationDialogOpen(false);

      // Redirect to the open jobs list
      router.push(paths.work.openJob.list);
    } catch (error) {
      console.error('Failed to create open job or send notifications:', error);
      toast.error('Failed to create open job or send notifications. Please try again.', {
        id: toastId,
      });
    } finally {
      loadingNotifications.onFalse();
    }
  }, [selectedWorkerIds, notificationTabs, queryClient, router, loadingNotifications]);

  // Helper function to enhance worker with conflict data using shared conflict checker
  const enhanceWorkerWithConflicts = (
    workerUser: any,
    jobData: NewJobSchemaType,
    timeOffRequests: any[] = [],
    workerSchedules: any = { scheduledWorkers: [], success: false },
    companyPreferences: any[] = [],
    sitePreferences: any[] = [],
    clientPreferences: any[] = []
  ) => {
    // Use the shared conflict checker logic

    // Find preferences for this employee
    const companyPref = companyPreferences.find(
      (p: any) => p.employee?.id === workerUser.id || p.user?.id === workerUser.id
    );
    const sitePref = sitePreferences.find(
      (p: any) => p.employee?.id === workerUser.id || p.user?.id === workerUser.id
    );
    const clientPref = clientPreferences.find(
      (p: any) => p.employee?.id === workerUser.id || p.user?.id === workerUser.id
    );

    // Check for schedule conflicts
    const employeeScheduleConflicts = (workerSchedules?.scheduledWorkers || []).filter(
      (conflict: ScheduleConflict) => conflict.user_id === workerUser.id
    );

    // Analyze schedule conflicts for 8-hour gap information
    const scheduleConflictAnalysis =
      employeeScheduleConflicts.length > 0
        ? analyzeScheduleConflicts(employeeScheduleConflicts)
        : null;
    const hasBlockingScheduleConflict = scheduleConflictAnalysis
      ? scheduleConflictAnalysis.directOverlaps.length > 0
      : false;

    // Check if any of the conflicts are unavailability conflicts
    const hasUnavailabilityConflict = employeeScheduleConflicts.some(
      (c: any) => c.conflict_type === 'unavailable'
    );

    // Check for time-off conflicts
    const timeOffConflicts = (Array.isArray(timeOffRequests) ? timeOffRequests : []).filter(
      (request: any) => {
        // Only check pending and approved requests
        if (!['pending', 'approved'].includes(request.status)) return false;
        if (request.user_id !== workerUser.id) return false;

        // Check if the time-off request dates overlap with the job dates
        if (!jobData.start_date_time || !jobData.end_date_time) return false;

        // Use timezone-aware date comparison to avoid timezone conversion issues
        const jobStartDate = dayjs(jobData.start_date_time).tz('America/Vancouver');
        const jobEndDate = dayjs(jobData.end_date_time).tz('America/Vancouver');
        const timeOffStartDate = dayjs(request.start_date).tz('America/Vancouver');
        const timeOffEndDate = dayjs(request.end_date).tz('America/Vancouver');

        // Extract date-only strings in YYYY-MM-DD format (using Vancouver timezone)
        const jobStartDateStr = jobStartDate.format('YYYY-MM-DD');
        const jobEndDateStr = jobEndDate.format('YYYY-MM-DD');
        const timeOffStartDateStr = timeOffStartDate.format('YYYY-MM-DD');
        const timeOffEndDateStr = timeOffEndDate.format('YYYY-MM-DD');

        // Check for date overlap using date strings
        // Two date ranges overlap if: start1 <= end2 && start2 <= end1
        const hasOverlap =
          timeOffStartDateStr <= jobEndDateStr && timeOffEndDateStr >= jobStartDateStr;

        return hasOverlap;
      }
    );
    const hasTimeOffConflict = timeOffConflicts.length > 0;

    // Build preference metadata
    const preferences = {
      company: companyPref
        ? {
            type: companyPref.preference_type as 'preferred' | 'not_preferred',
            isMandatory: companyPref.is_mandatory || false,
            reason: companyPref.reason,
          }
        : null,
      site: sitePref
        ? {
            type: sitePref.preference_type as 'preferred' | 'not_preferred',
            isMandatory: sitePref.is_mandatory || false,
            reason: sitePref.reason,
          }
        : null,
      client: clientPref
        ? {
            type: clientPref.preference_type as 'preferred' | 'not_preferred',
            isMandatory: clientPref.is_mandatory || false,
            reason: clientPref.reason,
          }
        : null,
    };

    // Calculate metadata
    const hasMandatoryNotPreferred =
      (preferences.company?.type === 'not_preferred' && preferences.company.isMandatory) ||
      (preferences.site?.type === 'not_preferred' && preferences.site.isMandatory) ||
      (preferences.client?.type === 'not_preferred' && preferences.client.isMandatory);

    const hasAnyNotPreferred =
      preferences.company?.type === 'not_preferred' ||
      preferences.site?.type === 'not_preferred' ||
      preferences.client?.type === 'not_preferred';

    const conflictInfo = scheduleConflictAnalysis
      ? {
          directOverlaps: scheduleConflictAnalysis.directOverlaps.length,
          gapViolations: scheduleConflictAnalysis.gapViolations.length,
          conflicts: employeeScheduleConflicts,
        }
      : null;

    return {
      hasScheduleConflict: employeeScheduleConflicts.length > 0,
      hasBlockingScheduleConflict,
      hasUnavailabilityConflict,
      hasTimeOffConflict,
      timeOffConflicts,
      preferences,
      hasMandatoryNotPreferred,
      hasAnyNotPreferred,
      conflictInfo,
    };
  };

  const extractRecipients = (
    jobData: NewJobSchemaType,
    usersList: any[],
    timeOffRequests: any[] = [],
    workerSchedules: any = { scheduledWorkers: [], success: false },
    conflictingWorkerIds: string[] = [],
    companyPreferences: any[] = [],
    sitePreferences: any[] = [],
    clientPreferences: any[] = []
  ): { workers: any[]; vehicles: any[] } => {
    // For open jobs, we need to get all eligible workers based on positions needed
    // Get the positions needed from the job
    const positionsNeeded = (jobData.workers || [])
      .filter((worker: any) => worker.position) // Get positions, not assigned workers
      .map((worker: any) => worker.position);

    // If no positions defined, return empty result
    if (positionsNeeded.length === 0) {
      return { workers: [], vehicles: [] };
    }

    // Check if usersList exists and has data
    if (!usersList || usersList.length === 0) {
      return { workers: [], vehicles: [] };
    }

    // Show employees who have positions that match the job requirements
    const allWorkers = usersList
      .map((workerUser: any) => {
        // Determine user positions based on role and certifications
        let userPositions: string[] = [];

        // Determine positions from role and certifications (role takes precedence)
        if (workerUser.role === 'lct/tcp') {
          // LCT/TCP role users can do both LCT and TCP work
          userPositions.push('lct', 'tcp', 'lct/tcp');
        } else if (workerUser.role === 'lct') {
          // LCT role users can do LCT work (role takes precedence over backend positions)
          userPositions.push('lct');
        } else if (workerUser.role === 'tcp') {
          // TCP role users can do TCP work (role takes precedence over backend positions)
          userPositions.push('tcp');
        } else if (workerUser.role === 'worker' || workerUser.role === 'employee') {
          // Check if they have TCP certification
          if (workerUser.tcp_certification_expiry) {
            const tcpExpiry = new Date(workerUser.tcp_certification_expiry);
            if (tcpExpiry > new Date()) {
              userPositions.push('tcp');
            }
          }

          // Check if they have driver license (LCT)
          if (workerUser.driver_license_expiry) {
            const lctExpiry = new Date(workerUser.driver_license_expiry);
            if (lctExpiry > new Date()) {
              userPositions.push('lct');
            }
          }

          // If they have both, add LCT/TCP combination
          if (userPositions.includes('tcp') && userPositions.includes('lct')) {
            userPositions.push('lct/tcp');
          }

          // Don't give fallback positions - workers should only have positions they're actually qualified for
          // This prevents TCP workers from appearing in LCT jobs and vice versa
        } else if (workerUser.role === 'admin') {
          // Skip admin users
          return null;
        } else {
          // Fallback: use backend provided positions if role doesn't match known roles
          if (
            workerUser.positions &&
            Array.isArray(workerUser.positions) &&
            workerUser.positions.length > 0
          ) {
            userPositions = workerUser.positions;
          }
        }

        // Skip if no positions determined (this should rarely happen now)
        // This prevents workers without clear qualifications from appearing in any job
        if (userPositions.length === 0) {
          return null;
        }

        // Removed unused isEligible variable

        // Filter positions to only include those that match the job requirements
        // This ensures workers only appear for positions they're actually qualified for
        const eligiblePositions = positionsNeeded.filter((neededPosition: string) => {
          if (neededPosition.toLowerCase() === 'tcp') {
            return userPositions.some(
              (pos: any) => pos.toLowerCase() === 'tcp' || pos.toLowerCase() === 'lct/tcp'
            );
          } else if (neededPosition.toLowerCase() === 'lct') {
            return userPositions.some(
              (pos: any) => pos.toLowerCase() === 'lct' || pos.toLowerCase() === 'lct/tcp'
            );
          } else if (neededPosition.toLowerCase() === 'field_supervisor') {
            return userPositions.some((pos: any) => pos.toLowerCase() === 'field_supervisor');
          }
          return false;
        });

        // Include ALL workers who have eligible positions for this job
        // This matches the behavior of regular job creation where all workers are included
        // and then filtered by the UI based on the "View All" toggle
        if (eligiblePositions.length === 0) {
          return null;
        }

        // Use the shared conflict checking logic
        const conflictData = enhanceWorkerWithConflicts(
          workerUser,
          jobData,
          timeOffRequests,
          workerSchedules,
          companyPreferences,
          sitePreferences,
          clientPreferences
        );

        const {
          hasScheduleConflict,
          hasBlockingScheduleConflict,
          hasUnavailabilityConflict,
          hasTimeOffConflict,
          timeOffConflicts,
          preferences,
          hasMandatoryNotPreferred,
          hasAnyNotPreferred,
          conflictInfo,
        } = conflictData;

        const hasUnresolvableConflict =
          hasBlockingScheduleConflict || hasTimeOffConflict || hasMandatoryNotPreferred;

        // For open job creation, we want to include ALL workers in the list (like regular job creation)
        // but mark their eligibility appropriately so the UI filtering can work correctly
        // This ensures the "View All" toggle shows the same behavior as regular job creation
        //
        // Eligibility levels:
        // - isEligible: true = no conflicts, no preferences (shown by default)
        // - isEligible: false = has conflicts or preferences (only shown when "View All" is ON)
        const shouldBeEligible =
          !hasUnresolvableConflict && !hasAnyNotPreferred && !hasScheduleConflict;

        // For open jobs, create one entry per worker (not per position)
        // This prevents duplication while showing all eligible workers
        return [
          {
            id: workerUser.id, // Use original user ID, not composite
            userId: workerUser.id, // Keep original user ID for reference
            name: `${workerUser.first_name} ${workerUser.last_name}`.trim(),
            position: [...new Set(eligiblePositions)].join(', '), // Show unique eligible positions only
            photo_url: workerUser.photo_url,
            email: workerUser.email || '',
            phone: workerUser.phone_number || workerUser.phone || '',
            start_time: null, // Not applicable for open jobs
            end_time: null, // Not applicable for open jobs
            assignedVehicles: [], // Not applicable for open jobs
            // All eligible workers are selected by default
            notifyEmail: true,
            notifyPhone: true,
            // Add position compatibility info
            userPositions,
            isCompatible: true,
            isEligible: shouldBeEligible, // Workers with conflicts are not eligible
            isMock: false,
            // Add availability and preference info
            hasScheduleConflict,
            hasBlockingScheduleConflict, // New field for blocking conflicts (direct overlaps)
            hasUnavailabilityConflict,
            conflictInfo,
            hasTimeOffConflict,
            timeOffConflicts,
            preferences,
            // Add flags for preference handling
            hasAnyNotPreferred,
            hasMandatoryNotPreferred,
          },
        ];
      })
      .filter(Boolean) // Remove null entries
      .flat(); // Flatten the array

    return {
      workers: allWorkers,
      vehicles: [], // No vehicles for open jobs initially
    };
  };

  const handleOpenNotificationDialog = async () => {
    if (!formRef.current) {
      toast.error('Form not ready. Please wait a moment and try again.');
      return;
    }

    // First, validate the current form
    const isValid = await formRef.current.trigger();
    if (!isValid) {
      return;
    }

    const currentFormData = formRef.current.getValues();

    // Fetch availability data for the current job
    const availabilityData = await fetchAvailabilityData(currentFormData);

    if (isMultiMode) {
      // Multi-job mode: create notification tabs for all jobs
      const tabs = jobTabs.map((tab, index) => {
        const tabData = index === activeTab ? currentFormData : tab.data;
        return {
          id: tab.id,
          title: tab.title,
          jobData: tabData,
          recipients: extractRecipients(
            tabData,
            finalUsers,
            availabilityData.timeOffRequests,
            availabilityData.workerSchedules,
            availabilityData.conflictingWorkerIds,
            availabilityData.companyPreferences,
            availabilityData.sitePreferences,
            availabilityData.clientPreferences
          ),
          isValid: tab.isValid,
        };
      });
      setNotificationTabs(tabs);
    } else {
      // Single job mode: create one notification tab
      setNotificationTabs([
        {
          id: '1',
          title: 'Job 1',
          jobData: currentFormData,
          recipients: extractRecipients(
            currentFormData,
            finalUsers,
            availabilityData.timeOffRequests,
            availabilityData.workerSchedules,
            availabilityData.conflictingWorkerIds,
            availabilityData.companyPreferences,
            availabilityData.sitePreferences,
            availabilityData.clientPreferences
          ),
          isValid: jobTabs[0]?.isValid || false,
        },
      ]);
    }

    setActiveNotificationTab(0);
    setNotificationDialogOpen(true);

    // Initialize selected workers with all eligible workers
    // Note: Workers with 8-hour gap violations and "not preferred" preferences are NOT eligible and won't be pre-selected
    // They must be selected individually to ensure proper acknowledgment
    const eligibleWorkerIds = new Set<string>();
    if (isMultiMode) {
      // Multi-job mode: get eligible workers from all tabs
      jobTabs.forEach((tab: any) => {
        const tabData = tab.data || tab;
        const tabRecipients = extractRecipients(
          tabData,
          finalUsers,
          availabilityData.timeOffRequests,
          availabilityData.workerSchedules,
          availabilityData.conflictingWorkerIds,
          availabilityData.companyPreferences,
          availabilityData.sitePreferences,
          availabilityData.clientPreferences
        );
        tabRecipients.workers.forEach((worker: any) => {
          // Only pre-select workers who are truly available (no conflicts, no preferences, or preferred)
          // Workers with 8-hour gap violations and "not preferred" preferences should NOT be pre-selected
          // They must be selected individually to ensure proper acknowledgment of conflicts
          const isTrulyAvailable =
            worker.isEligible &&
            !worker.hasScheduleConflict &&
            !worker.hasTimeOffConflict &&
            !worker.hasMandatoryNotPreferred;

          if (isTrulyAvailable) {
            eligibleWorkerIds.add(worker.id);
          }
        });
      });
    } else {
      // Single job mode: get eligible workers from the single tab
      const singleTabRecipients = extractRecipients(
        currentFormData,
        finalUsers,
        availabilityData.timeOffRequests,
        availabilityData.workerSchedules,
        availabilityData.conflictingWorkerIds,
        availabilityData.companyPreferences,
        availabilityData.sitePreferences,
        availabilityData.clientPreferences
      );
      singleTabRecipients.workers.forEach((worker: any) => {
        // Only pre-select workers who are truly available (no conflicts, no preferences, or preferred)
        // Workers with 8-hour gap violations and "not preferred" preferences should NOT be pre-selected
        // They must be selected individually to ensure proper acknowledgment of conflicts
        const isTrulyAvailable =
          worker.isEligible &&
          !worker.hasScheduleConflict &&
          !worker.hasTimeOffConflict &&
          !worker.hasMandatoryNotPreferred;

        if (isTrulyAvailable) {
          eligibleWorkerIds.add(worker.id);
        }
      });
    }
    setSelectedWorkerIds(eligibleWorkerIds);
  };

  const handleNotificationTabChange = (event: React.SyntheticEvent, newValue: number) => {
    if (newValue >= notificationTabs.length) return;
    setActiveNotificationTab(newValue);
  };

  // Removed unused handleWorkerNotificationChange function

  const handleWorkerEligibilityChange = (workerId: string, checked: boolean) => {
    setSelectedWorkerIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(workerId);
      } else {
        newSet.delete(workerId);
      }
      return newSet;
    });
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

  const currentTabData = jobTabs[activeTab] || jobTabs[0];

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

  // Function to fetch availability data when needed
  const fetchAvailabilityData = async (jobData: any) => {
    try {
      const jobStartDateTime = jobData?.start_date_time;
      const jobEndDateTime = jobData?.end_date_time;

      if (!jobStartDateTime || !jobEndDateTime) {
        return {
          timeOffRequests: [],
          workerSchedules: { scheduledWorkers: [], success: false },
          conflictingWorkerIds: [],
          companyPreferences: [],
          sitePreferences: [],
          clientPreferences: [],
        };
      }

      // Fetch time-off requests
      const timeOffResponse = await fetcher(
        `/api/time-off/admin/all?start_date=${new Date(jobStartDateTime).toISOString().split('T')[0]}&end_date=${new Date(jobEndDateTime).toISOString().split('T')[0]}`
      );
      const timeOffRequests = Array.isArray(timeOffResponse?.data?.timeOffRequests)
        ? timeOffResponse.data.timeOffRequests
        : [];

      // Fetch worker schedules with 8-hour gap checking
      const scheduleResponse = await fetcher(
        `${endpoints.work.job}/check-availability?start_time=${encodeURIComponent(new Date(jobStartDateTime).toISOString())}&end_time=${encodeURIComponent(new Date(jobEndDateTime).toISOString())}&check_gap=true`
      );
      const workerSchedules =
        scheduleResponse?.processedWorkers || scheduleResponse?.scheduledWorkers
          ? {
              scheduledWorkers:
                scheduleResponse.processedWorkers || scheduleResponse.scheduledWorkers,
              success: true,
              gap_checking_enabled: scheduleResponse.gap_checking_enabled || false,
            }
          : { scheduledWorkers: [], success: false, gap_checking_enabled: false };
      // Separate workers with blocking conflicts (direct overlaps) from those with only gap violations
      const blockingWorkerIds = (workerSchedules.scheduledWorkers || [])
        .filter((w: any) => w.conflict_type === 'direct_overlap')
        .map((w: any) => w.user_id)
        .filter(Boolean);

      const conflictingWorkerIds = blockingWorkerIds; // Keep for backward compatibility

      // Fetch preferences
      const companyId = jobData?.company?.id;
      const siteId = jobData?.site?.id;
      const clientId = jobData?.client?.id;

      const [companyPrefs, sitePrefs, clientPrefs] = await Promise.all([
        companyId
          ? fetcher(`${endpoints.management.companyPreferences}?company_id=${companyId}`)
              .then((r) => r.data.preferences || [])
              .catch(() => [])
          : Promise.resolve([]),
        siteId
          ? fetcher(`${endpoints.management.sitePreference}?site_id=${siteId}`)
              .then((r) => r.data.preferences || [])
              .catch(() => [])
          : Promise.resolve([]),
        clientId
          ? fetcher(`${endpoints.management.clientPreferences}?client_id=${clientId}`)
              .then((r) => r.data.preferences || [])
              .catch(() => [])
          : Promise.resolve([]),
      ]);

      return {
        timeOffRequests,
        workerSchedules,
        conflictingWorkerIds,
        companyPreferences: companyPrefs,
        sitePreferences: sitePrefs,
        clientPreferences: clientPrefs,
      };
    } catch (error) {
      console.error('Error fetching availability data:', error);
      return {
        timeOffRequests: [],
        workerSchedules: { scheduledWorkers: [], success: false },
        conflictingWorkerIds: [],
        companyPreferences: [],
        sitePreferences: [],
        clientPreferences: [],
      };
    }
  };

  // Handle row click for worker selection
  // Priority order for warnings:
  // 1. 8-hour gap violations (non-blocking, can proceed with warning)
  // 2. Non-mandatory not-preferred preferences (can proceed with warning)
  // 3. Blocking conflicts, time-off conflicts, mandatory preferences (cannot proceed)
  const handleWorkerRowClick = (worker: any) => {
    // Check if worker is already selected - if so, just uncheck them (no dialog needed)
    const isCurrentlySelected = selectedWorkerIds.has(worker.id);
    if (isCurrentlySelected) {
      handleWorkerEligibilityChange(worker.id, false);
      return;
    }

    // Worker is not selected, so check if we need to show warnings before allowing selection
    const hasBlockingScheduleConflict = worker.hasBlockingScheduleConflict;
    const hasTimeOffConflict = worker.hasTimeOffConflict;
    const hasMandatoryNotPreferred =
      (worker.preferences?.company?.type === 'not_preferred' &&
        worker.preferences?.company?.isMandatory) ||
      (worker.preferences?.site?.type === 'not_preferred' &&
        worker.preferences?.site?.isMandatory) ||
      (worker.preferences?.client?.type === 'not_preferred' &&
        worker.preferences?.client?.isMandatory);

    // Check for non-mandatory not-preferred preferences using the new flag
    const hasNonMandatoryNotPreferred =
      worker.hasAnyNotPreferred && !worker.hasMandatoryNotPreferred;

    // Check for 8-hour gap violations (non-blocking schedule conflicts)
    const hasOnlyGapViolations = worker.hasScheduleConflict && !worker.hasBlockingScheduleConflict;

    // Check for 8-hour gap violations first (these can be selected with warning)
    if (hasOnlyGapViolations) {
      // Show schedule conflict dialog instead of the regular warning dialog
      setScheduleConflictDialog({
        open: true,
        workerName: worker.name,
        workerPhotoUrl: worker.photo_url || '',
        conflicts: worker.conflictInfo?.conflicts || [],
      });
      return; // Exit early to show conflict dialog
    }

    // If worker has mandatory restrictions or conflicts, show warning dialog and prevent selection
    // This takes priority over non-mandatory preferences
    if (hasBlockingScheduleConflict || hasTimeOffConflict || hasMandatoryNotPreferred) {
      const allIssues: string[] = [];
      let hasMandatoryIssues = false;
      let canProceed = false;
      let warningType:
        | 'not_preferred'
        | 'mandatory_not_preferred'
        | 'worker_conflict'
        | 'schedule_conflict'
        | 'time_off_conflict'
        | 'certification_issues'
        | 'multiple_issues' = 'not_preferred';

      // Check for certification issues based on position
      const { tcpStatus, driverLicenseStatus } = worker.certifications || {};

      // Always check TCP Certification (required for both TCP and LCT positions)
      if (!tcpStatus?.hasCertification) {
        allIssues.push('No TCP Certification');
        hasMandatoryIssues = true;
        canProceed = false;
      } else if (!tcpStatus.isValid) {
        allIssues.push('TCP Certification is expired');
        hasMandatoryIssues = true;
        canProceed = false;
      } else if (tcpStatus.isExpiringSoon) {
        allIssues.push(
          `TCP Certification expires in ${tcpStatus.daysRemaining} ${tcpStatus.daysRemaining === 1 ? 'day' : 'days'}`
        );
        // Expiring soon is a warning, not mandatory
      }

      // Check Driver License only for LCT position
      const currentPosition = worker.position?.toLowerCase();
      if (currentPosition === 'lct') {
        if (!driverLicenseStatus?.hasLicense) {
          allIssues.push('No Driver License');
          hasMandatoryIssues = true;
          canProceed = false;
        } else if (!driverLicenseStatus.isValid) {
          allIssues.push('Driver License is expired');
          hasMandatoryIssues = true;
          canProceed = false;
        } else if (driverLicenseStatus.isExpiringSoon) {
          allIssues.push(
            `Driver License expires in ${driverLicenseStatus.daysRemaining} ${driverLicenseStatus.daysRemaining === 1 ? 'day' : 'days'}`
          );
          // Expiring soon is a warning, not mandatory
        }
      }

      // Check for schedule conflicts (only blocking conflicts remain here since gap violations are handled above)
      if (hasBlockingScheduleConflict) {
        // Create detailed conflict information
        // Get job dates from form
        const currentFormData = formRef.current?.getValues();
        const jobStartDateTime = currentFormData?.start_date_time;
        const jobEndDateTime = currentFormData?.end_date_time;

        // Use conflicts from worker.conflictInfo (already enhanced by conflict checker)
        // But validate them against current job dates to filter out stale data
        const allConflicts = worker.conflictInfo?.conflicts || [];

        // Filter to only include conflicts that actually overlap with current job dates
        const currentJobStart = jobStartDateTime ? dayjs(jobStartDateTime) : null;
        const currentJobEnd = jobEndDateTime ? dayjs(jobEndDateTime) : null;

        const validConflicts = allConflicts.filter((conflict: any) => {
          if (!currentJobStart || !currentJobEnd) return true; // If no job dates, show all

          // Validate that this conflict actually overlaps with current job dates
          const conflictStart = dayjs(conflict.worker_start_time || conflict.scheduled_start_time);
          const conflictEnd = dayjs(conflict.worker_end_time || conflict.scheduled_end_time);

          // Check if dates overlap (conflict ends after job starts AND conflict starts before job ends)
          const hasOverlap =
            conflictEnd.isAfter(currentJobStart) && conflictStart.isBefore(currentJobEnd);

          if (!hasOverlap) {
            console.warn('[OPEN JOB CREATE] Filtering out stale conflict:', {
              conflictJob: conflict.job_number,
              conflictDates: `${conflictStart.format('MMM D')} - ${conflictEnd.format('MMM D')}`,
              currentJobDates: `${currentJobStart.format('MMM D')} - ${currentJobEnd.format('MMM D')}`,
            });
          }

          return hasOverlap;
        });

        if (validConflicts.length === 0) {
          // No valid conflicts after filtering - this might be stale data
          console.warn('[OPEN JOB CREATE] All conflicts filtered out - likely stale data');
          // Don't add to allIssues - treat as no blocking conflict
        } else if (validConflicts.length === 1) {
          const conflict = validConflicts[0];

          // Check if this is an unavailability conflict
          if (conflict.conflict_type === 'unavailable') {
            const startTime = dayjs(conflict.worker_start_time).format('MMM D, YYYY h:mm A');
            const endTime = dayjs(conflict.worker_end_time).format('MMM D, h:mm A');
            const reason = conflict.unavailability_reason || 'Marked as unavailable by admin';

            const conflictInfo = `Unavailable Period: ${startTime} to ${endTime}\nReason: ${reason}`;
            allIssues.push(conflictInfo);
          } else {
            // Regular schedule conflict
            const jobNumber = conflict.job_number || conflict.job_id?.slice(-8) || 'Unknown';
            const startTime = dayjs(
              conflict.scheduled_start_time || conflict.worker_start_time
            ).format('MMM D, YYYY h:mm A');
            const endTime = dayjs(conflict.scheduled_end_time || conflict.worker_end_time).format(
              'MMM D, h:mm A'
            );
            const siteName = conflict.site_name || 'Unknown Site';
            const clientName = conflict.client_name || 'Unknown Client';

            const conflictInfo = `Schedule Conflict: Job #${jobNumber} at ${siteName} (${clientName})\n${startTime} to ${endTime}`;
            allIssues.push(conflictInfo);
          }
        } else {
          // Multiple conflicts - check if any are unavailability
          const unavailableConflicts = validConflicts.filter(
            (c: any) => c.conflict_type === 'unavailable'
          );
          const scheduleConflicts = validConflicts.filter(
            (c: any) => c.conflict_type !== 'unavailable'
          );

          if (unavailableConflicts.length > 0 && scheduleConflicts.length === 0) {
            const conflictInfo = `Unavailable: ${unavailableConflicts.length} period(s) marked as unavailable`;
            allIssues.push(conflictInfo);
          } else if (unavailableConflicts.length > 0) {
            allIssues.push(`${unavailableConflicts.length} unavailable period(s)`);
            allIssues.push(`${scheduleConflicts.length} schedule conflict(s)`);
          } else {
            const conflictInfo = `Schedule Conflict: ${validConflicts.length} overlapping jobs detected`;
            allIssues.push(conflictInfo);
          }
        }

        // Only set mandatory if there are valid conflicts
        if (validConflicts.length > 0) {
          hasMandatoryIssues = true;
          canProceed = false;
          warningType = 'schedule_conflict';
        }
      }

      // Check for time-off conflicts
      if (hasTimeOffConflict) {
        const timeOffInfo =
          worker.timeOffConflicts
            ?.map((conflict: any) => {
              // Format time-off type (e.g., "day_off" -> "Day Off")
              const formattedType = conflict.type
                .split('_')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

              // Format dates - if start and end dates are the same, show only one date
              const startDate = dayjs(conflict.start_date);
              const endDate = dayjs(conflict.end_date);
              const isSameDay = startDate.isSame(endDate, 'day');

              const dateRange = isSameDay
                ? `at ${startDate.format('MMM D, YYYY')}`
                : `from ${startDate.format('MMM D, YYYY')} to ${endDate.format('MMM D, YYYY')}`;

              return `${formattedType} ${conflict.status} ${dateRange}`;
            })
            .join(', ') || 'Worker has a time-off request during this period';

        allIssues.push(timeOffInfo);
        hasMandatoryIssues = true;
        canProceed = false;
        warningType = 'time_off_conflict';
      }

      // Check for mandatory not-preferred
      if (hasMandatoryNotPreferred) {
        hasMandatoryIssues = true;
        canProceed = false;
        warningType = 'mandatory_not_preferred';

        if (
          worker.preferences?.company?.type === 'not_preferred' &&
          worker.preferences?.company?.isMandatory
        ) {
          const reason = worker.preferences.company.reason || 'No reason';
          const companyName = formRef.current?.getValues('company')?.name || 'Company';
          const issueText = `${companyName} (Mandatory): ${reason}`;
          if (!allIssues.includes(issueText)) {
            allIssues.push(issueText);
          }
        }
        if (
          worker.preferences?.site?.type === 'not_preferred' &&
          worker.preferences?.site?.isMandatory
        ) {
          const reason = worker.preferences.site.reason || 'No reason';
          const siteName = formRef.current?.getValues('site')?.name || 'Site';
          const issueText = `${siteName} (Mandatory): ${reason}`;
          if (!allIssues.includes(issueText)) {
            allIssues.push(issueText);
          }
        }
        if (
          worker.preferences?.client?.type === 'not_preferred' &&
          worker.preferences?.client?.isMandatory
        ) {
          const reason = worker.preferences.client.reason || 'No reason';
          const clientName = formRef.current?.getValues('client')?.name || 'Client';
          const issueText = `${clientName} (Mandatory): ${reason}`;
          if (!allIssues.includes(issueText)) {
            allIssues.push(issueText);
          }
        }
      }

      // Determine the final warning type based on the issues found
      if (allIssues.length > 1) {
        warningType = 'multiple_issues';
      } else if (
        allIssues.some(
          (issue) => issue.includes('TCP Certification') || issue.includes('Driver License')
        )
      ) {
        warningType = 'certification_issues';
      }

      // Safety check: Ensure canProceed is false if there are any blocking issues in the reasons
      const hasBlockingIssues = allIssues.some(
        (issue) =>
          issue.includes('Schedule Conflict:') ||
          issue.includes('Unavailable Period:') ||
          issue.includes('Unavailable:') ||
          ((issue.includes('time-off') || issue.includes('Time-Off')) &&
            !issue.includes('informational only')) ||
          issue.includes('(Mandatory)')
      );

      if (hasBlockingIssues || hasMandatoryIssues) {
        canProceed = false;
      }

      setWorkerWarning({
        open: true,
        employee: {
          name: worker.name,
          id: worker.id,
          photo_url: worker.photo_url,
        },
        warningType,
        reasons: allIssues,
        isMandatory: hasMandatoryIssues,
        canProceed,
      });
      return;
    }

    // Check for non-mandatory not-preferred preferences (these can be selected with warning)
    // This only runs if there are no mandatory restrictions
    if (hasNonMandatoryNotPreferred) {
      const allIssues: string[] = [];
      const warningType = 'not_preferred' as const;

      if (
        worker.preferences?.company?.type === 'not_preferred' &&
        !worker.preferences?.company?.isMandatory
      ) {
        const reason = worker.preferences.company.reason || 'No reason';
        const companyName = formRef.current?.getValues('company')?.name || 'Company';
        allIssues.push(`${companyName}: ${reason}`);
      }
      if (
        worker.preferences?.site?.type === 'not_preferred' &&
        !worker.preferences?.site?.isMandatory
      ) {
        const reason = worker.preferences.site.reason || 'No reason';
        const siteName = formRef.current?.getValues('site')?.name || 'Site';
        allIssues.push(`${siteName}: ${reason}`);
      }
      if (
        worker.preferences?.client?.type === 'not_preferred' &&
        !worker.preferences?.client?.isMandatory
      ) {
        const reason = worker.preferences.client.reason || 'No reason';
        const clientName = formRef.current?.getValues('client')?.name || 'Client';
        allIssues.push(`${clientName}: ${reason}`);
      }

      // Show warning dialog but allow proceeding
      setWorkerWarning({
        open: true,
        employee: {
          name: worker.name,
          id: worker.id,
          photo_url: worker.photo_url,
        },
        warningType,
        reasons: allIssues,
        isMandatory: false,
        canProceed: true,
      });
      return;
    }

    // If worker is eligible with no issues, allow selection directly
    handleWorkerEligibilityChange(worker.id, true);
  };

  const handleWarningConfirm = () => {
    // If the worker can proceed (non-mandatory not-preferred), add them to selection
    if (workerWarning.canProceed && workerWarning.employee?.id) {
      const isCurrentlySelected = selectedWorkerIds.has(workerWarning.employee.id);
      handleWorkerEligibilityChange(workerWarning.employee.id, !isCurrentlySelected);
    }

    // Close the dialog
    setWorkerWarning((prev: any) => ({ ...prev, open: false }));
  };

  const handleWarningCancel = () => {
    setWorkerWarning((prev: any) => ({ ...prev, open: false }));
  };

  return (
    <Box>
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
            {jobTabs.filter((tab) => tab.isValid).length !== jobTabs.length &&
              ' (all jobs must be complete)'}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {jobTabs[0]?.isValid ? 'Job ready' : 'Please fill in required fields'}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => router.push(paths.work.openJob.list)}>
            Cancel
          </Button>

          <Button
            variant="contained"
            color="success"
            onClick={handleOpenNotificationDialog}
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
                      {notificationTabs[activeNotificationTab].jobData.client?.name}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Company:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {notificationTabs[activeNotificationTab].jobData.company?.name}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Site:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {notificationTabs[activeNotificationTab].jobData.site?.name}
                    </Typography>
                  </Box>

                  {notificationTabs[activeNotificationTab].jobData.site?.fullAddress && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Address:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {notificationTabs[activeNotificationTab].jobData.site.fullAddress}
                      </Typography>
                    </Box>
                  )}

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
              {isLoadingUsers && (
                <Box sx={{ mb: 3, textAlign: 'center', py: 3 }}>
                  <CircularProgress size={40} sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Loading eligible workers...
                  </Typography>
                </Box>
              )}

              {usersError && (
                <Box sx={{ mb: 3 }}>
                  <Alert severity="error">
                    <Typography variant="body2">
                      Failed to load workers. Please try again or contact support.
                    </Typography>
                  </Alert>
                </Box>
              )}

              {!isLoadingUsers &&
                !usersError &&
                notificationTabs[activeNotificationTab].recipients.workers.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                      <Iconify icon="solar:users-group-rounded-bold" />
                      Eligible Workers (
                      {notificationTabs[activeNotificationTab].recipients.workers.length})
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Workers who can fill the required positions are shown below. Only truly
                      eligible workers (no conflicts, no preferences, or preferred) are shown and
                      pre-selected by default. Use &quot;View All&quot; toggle to see all workers
                      including those marked as &quot;not preferred&quot; or with conflicts.
                    </Typography>

                    {/* Select All Toggle Control */}
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          // Simple toggle: if any workers are selected, deselect all; otherwise select all eligible
                          const hasAnySelected = selectedWorkerIds.size > 0;

                          if (hasAnySelected) {
                            // If any workers are selected, deselect all
                            setSelectedWorkerIds(new Set());
                          } else {
                            // If no workers are selected, select all eligible workers
                            // Note: Workers with 8-hour gap violations and "not preferred" preferences are excluded from automatic selection
                            // They must be selected individually to ensure proper acknowledgment
                            // Get visible workers based on current "View All" toggle state
                            // This matches the behavior of regular job creation
                            const visibleWorkers = notificationTabs[
                              activeNotificationTab
                            ].recipients.workers.filter((worker) => {
                              if (showOnlyAvailable) {
                                return worker.isEligible;
                              } else {
                                return true;
                              }
                            });
                            const selectableWorkerIds = visibleWorkers
                              .filter(
                                (worker) =>
                                  // Exclude workers with blocking conflicts
                                  !worker.hasBlockingScheduleConflict &&
                                  // Exclude workers with time-off conflicts
                                  !worker.hasTimeOffConflict &&
                                  // Exclude workers with 8-hour gap violations (require individual selection)
                                  !worker.hasScheduleConflict &&
                                  // Exclude workers with ANY "not preferred" preferences (both mandatory and non-mandatory)
                                  // They require individual selection to ensure proper acknowledgment
                                  !(worker.preferences?.company?.type === 'not_preferred') &&
                                  !(worker.preferences?.site?.type === 'not_preferred') &&
                                  !(worker.preferences?.client?.type === 'not_preferred')
                              )
                              .map((worker) => worker.id);

                            setSelectedWorkerIds(new Set(selectableWorkerIds));
                          }
                        }}
                        startIcon={
                          <Iconify
                            icon={(() => {
                              // Simple icon logic: if any workers are selected, show deselect icon; otherwise show select icon
                              const hasAnySelected = selectedWorkerIds.size > 0;

                              return hasAnySelected
                                ? 'solar:close-circle-bold'
                                : 'solar:check-circle-bold';
                            })()}
                          />
                        }
                      >
                        {(() => {
                          // Always show the button text based on the current selection state
                          // Don't change text based on view toggle - keep it consistent
                          const hasAnySelected = selectedWorkerIds.size > 0;

                          return hasAnySelected ? 'Deselect All' : 'Select All';
                        })()}
                      </Button>
                      <Typography variant="caption" color="text.secondary">
                        Selects workers without conflicts or restrictions. Gap violations and
                        preferences require individual selection.
                      </Typography>
                    </Box>

                    {/* Search bar for workers */}
                    <Box sx={{ mb: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Search workers by name..."
                        value={workerSearchQuery}
                        onChange={(e) => setWorkerSearchQuery(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Iconify icon="solar:pen-bold" />
                            </InputAdornment>
                          ),
                          endAdornment: workerSearchQuery && (
                            <InputAdornment position="end">
                              <IconButton size="small" onClick={() => setWorkerSearchQuery('')}>
                                <Iconify icon="solar:close-circle-bold" />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 2 }}
                      />
                    </Box>

                    {/* Toggle for showing available vs all workers */}
                    {/* When OFF: Shows only workers without conflicts or preferences (matches regular job creation) */}
                    {/* When ON: Shows all workers including those with 8-hour gap violations (matches regular job creation) */}
                    <Box
                      sx={{
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Show only eligible workers (hide conflicts and preferences) - matches
                        regular job creation
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={!showOnlyAvailable}
                              onChange={(e) => setShowOnlyAvailable(!e.target.checked)}
                              size="small"
                              color="primary"
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                View All
                              </Typography>
                              <Tooltip
                                title={
                                  <Box sx={{ p: 1 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                      Circle Icon Meanings:
                                    </Typography>
                                    <Box
                                      sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}
                                    >
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box
                                          sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            backgroundColor: 'success.main',
                                          }}
                                        />
                                        <Typography variant="body2">Preferred</Typography>
                                      </Box>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box
                                          sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            backgroundColor: 'warning.main',
                                          }}
                                        />
                                        <Typography variant="body2">Not Preferred</Typography>
                                      </Box>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box
                                          sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            backgroundColor: 'error.main',
                                          }}
                                        />
                                        <Typography variant="body2">
                                          Mandatory Restriction
                                        </Typography>
                                      </Box>
                                      <Typography variant="caption" sx={{ mt: 0.5 }}>
                                        Order: Company | Site | Client
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        sx={{ mt: 1, fontStyle: 'italic' }}
                                      >
                                        Note: Mandatory restrictions override all other preferences
                                      </Typography>
                                    </Box>
                                  </Box>
                                }
                                arrow
                                placement="top"
                              >
                                <Icon
                                  icon="solar:info-circle-line-duotone"
                                  width={16}
                                  height={16}
                                  style={{
                                    color: 'var(--palette-text-secondary)',
                                    cursor: 'pointer',
                                  }}
                                />
                              </Tooltip>
                            </Box>
                          }
                        />
                      </Box>
                    </Box>

                    {/* Compact Employee List with Fixed Height */}
                    <Box
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        maxHeight: 600, // Increased height from 400 to 600
                        overflow: 'auto', // Scrollable
                        bgcolor: 'background.paper',
                      }}
                    >
                      <Stack spacing={0}>
                        {notificationTabs[activeNotificationTab].recipients.workers
                          .filter((worker) => {
                            // First apply search filter
                            if (
                              workerSearchQuery &&
                              !worker.name.toLowerCase().includes(workerSearchQuery.toLowerCase())
                            ) {
                              return false;
                            }

                            if (showOnlyAvailable) {
                              // Show only truly eligible workers (no conflicts, no preferences, or preferred)
                              // This matches the behavior of regular job creation when "View All" is OFF
                              return worker.isEligible;
                            } else {
                              // Show all workers when "View All" is enabled
                              // This matches the behavior of regular job creation when "View All" is ON
                              // and shows workers with 8-hour gap violations, preferences, etc.
                              return true;
                            }
                          })
                          .map((worker, index) => (
                            <Box
                              key={worker.id}
                              onClick={() => handleWorkerRowClick(worker)}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1, // Reduced from 1.5 to 1
                                p: 1, // Reduced from 1.5 to 1
                                borderBottom:
                                  index <
                                  notificationTabs[activeNotificationTab].recipients.workers.filter(
                                    (w) => {
                                      // Apply same filtering logic for border calculation
                                      if (showOnlyAvailable) {
                                        return w.isEligible;
                                      } else {
                                        return true;
                                      }
                                    }
                                  ).length -
                                    1
                                    ? 1
                                    : 0,
                                borderColor: 'divider',
                                bgcolor: selectedWorkerIds.has(worker.id)
                                  ? 'action.selected'
                                  : 'background.paper',
                                cursor: 'pointer',
                                '&:hover': {
                                  bgcolor: selectedWorkerIds.has(worker.id)
                                    ? 'action.selected'
                                    : 'action.hover',
                                },
                              }}
                            >
                              {/* Checkbox */}
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={selectedWorkerIds.has(worker.id)}
                                    onChange={(e) =>
                                      handleWorkerEligibilityChange(worker.id, e.target.checked)
                                    }
                                    disabled={
                                      worker.hasBlockingScheduleConflict ||
                                      worker.hasTimeOffConflict ||
                                      (worker.preferences?.company?.type === 'not_preferred' &&
                                        worker.preferences?.company?.isMandatory) ||
                                      (worker.preferences?.site?.type === 'not_preferred' &&
                                        worker.preferences?.site?.isMandatory) ||
                                      (worker.preferences?.client?.type === 'not_preferred' &&
                                        worker.preferences?.client?.isMandatory)
                                    }
                                    size="small"
                                    color="primary"
                                  />
                                }
                                label=""
                              />

                              {/* Compact Avatar */}
                              <Avatar
                                src={worker?.photo_url ?? undefined}
                                alt={worker?.name}
                                sx={{
                                  width: 24, // Reduced from 28 to 24
                                  height: 24, // Reduced from 28 to 24
                                  flexShrink: 0,
                                  fontSize: '0.7rem', // Reduced from 0.75rem to 0.7rem
                                }}
                              >
                                {worker?.name?.charAt(0).toUpperCase()}
                              </Avatar>

                              {/* Compact Name and Position - Single Line */}
                              <Box
                                sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }} // Reduced gap from 1.5 to 1
                              >
                                <Typography
                                  variant="body2"
                                  color="text.primary"
                                  sx={{ fontWeight: 'medium' }}
                                >
                                  {worker.name}
                                </Typography>

                                {/* Position Chips - Inline */}
                                <Box sx={{ display: 'flex', gap: 0.25 }}>
                                  {' '}
                                  {/* Reduced gap from 0.5 to 0.25 */}
                                  {worker.position.split(',').map((pos, posIndex) => (
                                    <Chip
                                      key={posIndex}
                                      label={pos.trim().toUpperCase()}
                                      size="small"
                                      color={getPositionColor(pos.trim())}
                                      variant="soft"
                                      sx={{
                                        height: 18, // Reduced from 20 to 18
                                        fontSize: '0.65rem', // Reduced from 0.7rem to 0.65rem
                                        fontWeight: 'bold',
                                        '& .MuiChip-label': {
                                          px: 0.75, // Reduced from 1 to 0.75
                                          py: 0.125, // Reduced from 0.25 to 0.125
                                          fontWeight: 'bold',
                                        },
                                      }}
                                    />
                                  ))}
                                </Box>

                                {/* Selected Indicator - Right after position chips */}
                                {selectedWorkerIds.has(worker.id) && (
                                  <Typography
                                    variant="caption"
                                    color="success.main"
                                    sx={{ fontWeight: 'medium' }}
                                  >
                                    ✓ Selected
                                  </Typography>
                                )}

                                {/* Conflict Indicators - Inline */}
                                {worker.hasBlockingScheduleConflict && (
                                  <Typography
                                    variant="caption"
                                    color="error"
                                    sx={{ fontWeight: 'medium' }}
                                  >
                                    {worker.hasUnavailabilityConflict
                                      ? '(Unavailable)'
                                      : '(Schedule Conflict)'}
                                  </Typography>
                                )}
                                {worker.hasScheduleConflict &&
                                  !worker.hasBlockingScheduleConflict && (
                                    <Typography
                                      variant="caption"
                                      color="warning.main"
                                      sx={{ fontWeight: 'medium' }}
                                    >
                                      (8-Hour Gap)
                                    </Typography>
                                  )}
                                {worker.hasTimeOffConflict && (
                                  <Typography
                                    variant="caption"
                                    color="error"
                                    sx={{ fontWeight: 'medium' }}
                                  >
                                    (Time-Off Request)
                                  </Typography>
                                )}
                              </Box>

                              {/* Preference Indicators */}
                              <EnhancedPreferenceIndicators
                                preferences={worker.preferences}
                                size="small"
                              />
                            </Box>
                          ))}
                      </Stack>
                    </Box>
                  </Box>
                )}

              {!isLoadingUsers &&
                !usersError &&
                notificationTabs[activeNotificationTab].recipients.workers.length === 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Alert severity="info">
                      <Typography variant="body2">
                        No eligible workers found for the required positions. Please check your
                        position requirements or contact support.
                      </Typography>
                    </Alert>
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
                              p: 1,
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

              {/* Position Requirements Summary */}
              {(() => {
                const jobData = notificationTabs[activeNotificationTab].jobData;
                const positionCounts: Record<string, number> = {};
                const selectedWorkerCounts: Record<string, number> = {};

                // Count required positions from form data
                jobData.workers?.forEach((worker: any) => {
                  if (worker.position) {
                    positionCounts[worker.position] = (positionCounts[worker.position] || 0) + 1;
                  }
                });

                // Count selected workers from dialog state (selectedWorkerIds)
                const availableWorkers = notificationTabs[activeNotificationTab].recipients.workers;
                availableWorkers.forEach((worker: any) => {
                  if (selectedWorkerIds.has(worker.id) && worker.position) {
                    selectedWorkerCounts[worker.position] =
                      (selectedWorkerCounts[worker.position] || 0) + 1;
                  }
                });

                const positionEntries = Object.entries(positionCounts);
                if (positionEntries.length === 0) return null;

                return (
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Position Requirements:
                    </Typography>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      {positionEntries.map(([position, requiredCount]) => {
                        const selectedCount = selectedWorkerCounts[position] || 0;
                        const isComplete = selectedCount >= requiredCount;
                        return (
                          <Chip
                            key={position}
                            label={`${position.toUpperCase()}: ${selectedCount}/${requiredCount}`}
                            color={isComplete ? 'success' : 'warning'}
                            size="small"
                            variant={isComplete ? 'filled' : 'outlined'}
                          />
                        );
                      })}
                    </Stack>
                    {Object.entries(positionCounts).some(([position, requiredCount]) => {
                      const selectedCount = selectedWorkerCounts[position] || 0;
                      return selectedCount < requiredCount;
                    }) && (
                      <Typography
                        variant="caption"
                        color="warning.main"
                        sx={{ mt: 1, display: 'block' }}
                      >
                        ⚠️ Please select enough workers for each position before sending
                        notifications.
                      </Typography>
                    )}
                  </Box>
                );
              })()}

              {/* Positions Section */}
              {notificationTabs[activeNotificationTab].jobData.workers &&
                notificationTabs[activeNotificationTab].jobData.workers.filter(
                  (worker: any) => worker.position
                ).length > 0 && (
                  <Box sx={{ mb: 3, mt: 3 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                      <Iconify icon="solar:user-id-bold" />
                      Positions (
                      {
                        notificationTabs[activeNotificationTab].jobData.workers.filter(
                          (worker: any) => worker.position
                        ).length
                      }
                      )
                    </Typography>
                    <Stack spacing={1}>
                      {notificationTabs[activeNotificationTab].jobData.workers
                        .filter((worker: any) => worker.position)
                        .map((worker: any, index: number) => (
                          <Box
                            key={index}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              p: 1,
                            }}
                          >
                            <Chip
                              label={worker.position?.toUpperCase()}
                              size="medium"
                              color={getPositionColor(worker.position?.trim())}
                              variant="soft"
                              sx={{
                                height: 24,
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                '& .MuiChip-label': {
                                  px: 1,
                                  py: 0.25,
                                  fontWeight: 'bold',
                                },
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 500, color: 'text.secondary' }}
                            >
                              {worker.start_time
                                ? dayjs(worker.start_time).format('h:mm A')
                                : dayjs(
                                    notificationTabs[activeNotificationTab].jobData.start_date_time
                                  ).format('h:mm A')}{' '}
                              -{' '}
                              {worker.end_time
                                ? dayjs(worker.end_time).format('h:mm A')
                                : dayjs(
                                    notificationTabs[activeNotificationTab].jobData.end_date_time
                                  ).format('h:mm A')}
                            </Typography>
                          </Box>
                        ))}
                    </Stack>
                  </Box>
                )}

              {/* Vehicles Section */}
              {notificationTabs[activeNotificationTab].jobData.vehicles &&
                notificationTabs[activeNotificationTab].jobData.vehicles.length > 0 && (
                  <>
                    <Divider />
                    <Box sx={{ mb: 3, mt: 3 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Iconify icon="solar:cart-3-bold" />
                        Vehicles ({notificationTabs[activeNotificationTab].jobData.vehicles.length})
                      </Typography>
                      <Stack>
                        {notificationTabs[activeNotificationTab].jobData.vehicles.map(
                          (vehicle: any, index: number) => (
                            <Box
                              key={vehicle.id || index}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 1,
                              }}
                            >
                              <Chip
                                label={vehicle.type
                                  ?.replace(/_/g, ' ')
                                  .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                variant="outlined"
                                sx={{ minWidth: 80 }}
                              />
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 500, color: 'text.secondary' }}
                              >
                                QTY: {vehicle.quantity || 1}
                              </Typography>
                            </Box>
                          )
                        )}
                      </Stack>
                    </Box>
                  </>
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

              {/* Summary for Open Jobs */}
              {notificationTabs[activeNotificationTab].recipients.workers.length > 0 && (
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    bgcolor: '#e3f2fd',
                    border: '1px solid #bbdefb',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle2" color="info.dark" sx={{ mb: 1 }}>
                    📋 Notification Summary
                  </Typography>
                  <Typography variant="body2" color="info.dark">
                    <strong>{selectedWorkerIds.size}</strong> selected workers out of{' '}
                    <strong>
                      {notificationTabs[activeNotificationTab].recipients.workers.length}
                    </strong>{' '}
                    total workers
                  </Typography>
                  <Typography variant="caption" color="info.dark" sx={{ display: 'block', mt: 1 }}>
                    Selected workers will receive notifications. Workers with conflicts or mandatory
                    restrictions cannot be selected. Workers marked as &quot;not preferred&quot; can
                    be selected but will show a warning dialog.
                  </Typography>
                </Box>
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
            disabled={
              notificationTabs.filter((tab) => tab.isValid).length === 0 ||
              (() => {
                // Check if all positions have enough selected workers
                const currentTab = notificationTabs[activeNotificationTab];
                if (!currentTab?.jobData?.workers) return true;

                const positionCounts: Record<string, number> = {};
                const selectedWorkerCounts: Record<string, number> = {};

                // Count required positions from form data
                currentTab.jobData.workers.forEach((worker: any) => {
                  if (worker.position) {
                    positionCounts[worker.position] = (positionCounts[worker.position] || 0) + 1;
                  }
                });

                // Count selected workers from dialog state (selectedWorkerIds)
                const availableWorkers = currentTab.recipients?.workers || [];
                availableWorkers.forEach((worker: any) => {
                  if (selectedWorkerIds.has(worker.id) && worker.position) {
                    selectedWorkerCounts[worker.position] =
                      (selectedWorkerCounts[worker.position] || 0) + 1;
                  }
                });

                // Check if any position is missing workers
                return Object.entries(positionCounts).some(([position, requiredCount]) => {
                  const selectedCount = selectedWorkerCounts[position] || 0;
                  return selectedCount < requiredCount;
                });
              })()
            }
            startIcon={<Iconify icon="solar:bell-bing-bold" />}
          >
            Create & Send
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

      {/* Worker Warning Dialog */}
      <WorkerWarningDialog
        warning={workerWarning}
        onClose={handleWarningCancel}
        onConfirm={handleWarningConfirm}
        onCancel={handleWarningCancel}
      />

      {/* Schedule Conflict Dialog */}
      <ScheduleConflictDialog
        open={scheduleConflictDialog.open}
        onClose={() => setScheduleConflictDialog((prev) => ({ ...prev, open: false }))}
        onProceed={(acknowledgeWarnings: boolean) => {
          // When user proceeds with gap violations, add the worker to selection
          const workerName = scheduleConflictDialog.workerName;
          const worker = notificationTabs[activeNotificationTab]?.recipients?.workers?.find(
            (w: any) => w.name === workerName
          );
          if (worker) {
            handleWorkerEligibilityChange(worker.id, true);
          }
          setScheduleConflictDialog((prev) => ({ ...prev, open: false }));
        }}
        workerName={scheduleConflictDialog.workerName}
        workerPhotoUrl={scheduleConflictDialog.workerPhotoUrl}
        conflicts={scheduleConflictDialog.conflicts}
        newJobStartTime={(() => {
          const startTime = notificationTabs[activeNotificationTab]?.jobData?.start_date_time;
          return startTime ? new Date(startTime) : new Date();
        })()}
        newJobEndTime={(() => {
          const endTime = notificationTabs[activeNotificationTab]?.jobData?.end_date_time;
          return endTime ? new Date(endTime) : new Date();
        })()}
        newJobSiteName={notificationTabs[activeNotificationTab]?.jobData?.site?.name || ''}
        newJobClientName={notificationTabs[activeNotificationTab]?.jobData?.client?.name || ''}
      />
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
      mode: 'onChange',
      resolver: zodResolver(NewJobSchema),
      defaultValues: data,
    });

    // Watch for form values changes for change detection
    const watchedClient = methods.watch('client');
    const watchedCompany = methods.watch('company');
    const watchedSite = methods.watch('site');
    const watchedWorkers = methods.watch('workers');
    // const watchedTimesheetManager = methods.watch('timesheet_manager_id'); // Remove for open jobs

    // Simple validation effect that runs whenever form values change
    useEffect(() => {
      const formValues = methods.getValues();

      const hasClient = Boolean(formValues.client?.id && formValues.client.id !== '');
      const hasCompany = Boolean(formValues.company?.id && formValues.company.id !== '');
      const hasSite = Boolean(formValues.site?.id && formValues.site.id !== '');
      // For open jobs, workers are optional (they'll be assigned later)

      const isFormValid = hasClient && hasCompany && hasSite;

      onValidationChange(isFormValid);
    }, [methods, onValidationChange, watchedClient, watchedCompany, watchedSite, watchedWorkers]);

    // Force validation to run when any form field changes
    useEffect(() => {
      const subscription = methods.watch((value, { name }) => {
        const formValues = methods.getValues();
        const hasClient = Boolean(formValues.client?.id && formValues.client.id !== '');
        const hasCompany = Boolean(formValues.company?.id && formValues.company.id !== '');
        const hasSite = Boolean(formValues.site?.id && formValues.site.id !== '');
        // For open jobs, workers are optional (they'll be assigned later)

        const isFormValid = hasClient && hasCompany && hasSite;

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
        // For open jobs, workers are optional (they'll be assigned later)

        const isFormValid = hasClient && hasCompany && hasSite;

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
          // timesheet_manager_id: watchedTimesheetManager, // Remove for open jobs
        });
      }
    }, [
      watchedClient,
      watchedCompany,
      watchedSite,
      watchedWorkers,
      // watchedTimesheetManager, // Remove this dependency
      onFormValuesChange,
    ]);

    // Expose the form methods through the ref
    React.useImperativeHandle(
      ref,
      () => ({
        getValues: () => methods.getValues(),
        setValue: (name: any, value: any) => methods.setValue(name, value),
        reset: (formData: any) => methods.reset(formData),
        trigger: () => methods.trigger(),
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
