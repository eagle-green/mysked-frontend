import type { Dayjs } from 'dayjs';

import { z } from 'zod';
import dayjs from 'dayjs';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import AlertTitle from '@mui/material/AlertTitle';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import Autocomplete from '@mui/material/Autocomplete';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import { fDate, fTime } from 'src/utils/format-time';
import { getPositionColor } from 'src/utils/format-role';

import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';
import axiosInstance, { fetcher, endpoints } from 'src/lib/axios';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import {
  useTable,
  TableNoData,
  TableSkeleton,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

type Props = {
  userId: string;
};

const TABLE_HEAD = [
  { id: 'job_number', label: 'Job #' },
  { id: 'date', label: 'Date' },
  { id: 'company', label: 'Company' },
  { id: 'site', label: 'Site' },
  { id: 'position', label: 'Position' },
  { id: 'status', label: 'Status' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'missing_timesheet', label: 'Missing Timesheet' },
  { value: 'no_show', label: 'No Show' },
  { value: 'called_in_sick', label: 'Called in Sick' },
];

// Create a dynamic schema that requires additional fields when searchAllJobs is true
const createIncidentFormSchema = (searchAllJobs: boolean) =>
  z
    .object({
      job_id: z
        .string()
        .nullable()
        .refine((val) => val !== null && val !== '', {
          message: 'Job is required',
        }),
      incident_type: z
        .string()
        .refine((val) => val === 'no_show' || val === 'called_in_sick', {
          message: 'Incident type is required',
        })
        .transform((val) => val as 'no_show' | 'called_in_sick'),
      reason: z.string().optional(),
      notified_at: z.custom<Dayjs | null>((val) => true),
      position: z.string().optional(),
      start_time: z.custom<Dayjs | null>((val) => true).optional(),
      end_time: z.custom<Dayjs | null>((val) => true).optional(),
    })
    .refine(
      (data) => {
        // If incident_type is 'called_in_sick', notified_at must be provided
        if (data.incident_type === 'called_in_sick') {
          return data.notified_at !== null && dayjs(data.notified_at).isValid();
        }
        return true;
      },
      {
        message: 'Notification date & time is required for "Called in Sick" incidents',
        path: ['notified_at'],
      }
    )
    .superRefine((data, ctx) => {
      // If searchAllJobs is true, position, start_time, and end_time are required
      if (searchAllJobs) {
        if (!data.position || data.position.trim() === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Position is required when adding incident for removed worker',
            path: ['position'],
          });
        }
        if (!data.start_time || !dayjs(data.start_time).isValid()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Start Time is required when adding incident for removed worker',
            path: ['start_time'],
          });
        }
        if (!data.end_time || !dayjs(data.end_time).isValid()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'End Time is required when adding incident for removed worker',
            path: ['end_time'],
          });
        }
      }
    });

type IncidentFormData = {
  job_id: string | null;
  incident_type: 'no_show' | 'called_in_sick';
  reason?: string;
  notified_at: Dayjs | null;
  position?: string;
  start_time?: Dayjs | null;
  end_time?: Dayjs | null;
};

export function AccountJobHistoryTab({ userId }: Props) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';

  const table = useTable({
    defaultRowsPerPage: 10,
    defaultDense: true,
    defaultOrderBy: 'date',
    defaultOrder: 'desc',
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [rejectionDialog, setRejectionDialog] = useState<{
    open: boolean;
    reason: string | null;
    date: string | null;
    rejectedBy: {
      first_name: string;
      last_name: string;
      photo_url: string;
    } | null;
  }>({
    open: false,
    reason: null,
    date: null,
    rejectedBy: null,
  });
  const [incidentDialog, setIncidentDialog] = useState(false);
  const [searchAllJobs, setSearchAllJobs] = useState(false);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [selectedJobFromSearch, setSelectedJobFromSearch] = useState<any>(null);
  const [autocompleteInputValue, setAutocompleteInputValue] = useState('');
  const [incidentDetailsDialog, setIncidentDetailsDialog] = useState<{
    open: boolean;
    incidentType: string | null;
    reason: string | null;
    notifiedAt: string | null;
    reportedAt: string | null;
    reportedBy: {
      first_name: string;
      last_name: string;
      photo_url: string;
    } | null;
  }>({
    open: false,
    incidentType: null,
    reason: null,
    notifiedAt: null,
    reportedAt: null,
    reportedBy: null,
  });

  // Persist form data in localStorage
  const STORAGE_KEY = `incident-form-${userId}`;
  const getPersistedFormData = (): Partial<IncidentFormData> => 
    // Always return empty values - don't load persisted data
    // This ensures users must select values each time
     ({
      job_id: null,
      incident_type: '' as any, // No default - user must select
      reason: '',
      notified_at: null,
      position: '' as any, // No default - user must select
      start_time: null,
      end_time: null,
    })
  ;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<IncidentFormData>({
    resolver: zodResolver(createIncidentFormSchema(searchAllJobs)),
    defaultValues: getPersistedFormData() as any,
    mode: 'onSubmit', // Only validate on submit, not on change or blur
    reValidateMode: 'onSubmit',
  });

  // Reset form with empty values when dialog opens
  useEffect(() => {
    if (incidentDialog) {
      reset({
        job_id: null,
        incident_type: '' as any,
        reason: '',
        notified_at: null,
        position: '' as any,
        start_time: null,
        end_time: null,
      });
      // Clear persisted form data when dialog opens
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [incidentDialog, reset, STORAGE_KEY]);

  // Persist form data when it changes
  const formValues = watch();
  useEffect(() => {
    if (incidentDialog) {
      const dataToStore = {
        ...formValues,
        notified_at: formValues.notified_at ? formValues.notified_at.toISOString() : null,
        start_time: formValues.start_time ? formValues.start_time.toISOString() : null,
        end_time: formValues.end_time ? formValues.end_time.toISOString() : null,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
    }
  }, [formValues, incidentDialog, STORAGE_KEY]);

  const incidentType = watch('incident_type');

  // Fetch job history
  const { data, isLoading } = useQuery({
    queryKey: [
      'worker-job-history',
      userId,
      statusFilter,
      table.page,
      table.rowsPerPage,
      table.orderBy,
      table.order,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: table.rowsPerPage.toString(),
        offset: (table.page * table.rowsPerPage).toString(),
        orderBy: table.orderBy,
        order: table.order,
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetcher(
        `${endpoints.work.job}/worker/${userId}/history?${params.toString()}`
      );
      return response.data;
    },
    enabled: !!userId,
  });

  // Fetch rejection statistics
  const { data: rejectionStats } = useQuery({
    queryKey: ['worker-rejection-stats', userId],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.work.job}/worker/${userId}/rejection-stats`);
      return response.data;
    },
    enabled: !!userId,
  });

  // Fetch accepted and completed jobs for this worker (for incident creation)
  const { data: acceptedJobsData } = useQuery({
    queryKey: ['worker-accepted-completed-jobs', userId],
    queryFn: async () => {
      // Fetch both accepted and completed jobs
      const [acceptedResponse, completedResponse] = await Promise.all([
        fetcher(`${endpoints.work.job}/worker/${userId}/history?status=accepted&limit=1000`),
        fetcher(`${endpoints.work.job}/worker/${userId}/history?status=completed&limit=1000`),
      ]);

      // Combine and deduplicate by job_id
      const acceptedJobs = acceptedResponse.data?.jobs || [];
      const completedJobs = completedResponse.data?.jobs || [];

      // Create a map to avoid duplicates
      const jobsMap = new Map();
      [...acceptedJobs, ...completedJobs].forEach((job: any) => {
        if (!jobsMap.has(job.job_id)) {
          jobsMap.set(job.job_id, job);
        }
      });

      return Array.from(jobsMap.values());
    },
    enabled: !!userId && isAdmin && incidentDialog && !searchAllJobs,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Fetch existing incidents for this worker to filter them out
  const { data: existingIncidentsData } = useQuery({
    queryKey: ['worker-incidents', userId],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.work.job}/worker/${userId}/incidents`);
      return response.data?.incidents || [];
    },
    enabled: !!userId && isAdmin && incidentDialog && searchAllJobs,
  });

  // Search all jobs by job number (for incident creation when worker was removed)
  const { data: searchedJobsData, isLoading: isSearchingJobs } = useQuery({
    queryKey: ['search-jobs-by-number', jobSearchQuery],
    queryFn: async () => {
      if (!jobSearchQuery.trim()) {
        return [];
      }
      // Remove # if user typed it
      const searchTerm = jobSearchQuery.replace(/^#/, '').trim();
      if (!searchTerm) {
        return [];
      }
      const response = await fetcher(
        `${endpoints.work.job}?search=${encodeURIComponent(searchTerm)}&limit=50&rowsPerPage=50`
      );
      const jobs = response.data?.jobs || [];
      
      // Filter out jobs that already have incidents for this worker
      const existingIncidentJobIds = new Set(
        (existingIncidentsData || []).map((incident: any) => incident.job_id)
      );
      
      // Return only jobs that don't have incidents
      return jobs.filter((job: any) => !existingIncidentJobIds.has(job.id));
    },
    enabled: !!userId && isAdmin && incidentDialog && searchAllJobs && jobSearchQuery.trim().length >= 2,
  });

  // Create incident mutation
  const createIncidentMutation = useMutation({
    mutationFn: async (formData: IncidentFormData) => {
      if (!formData.job_id) {
        throw new Error('Job is required');
      }
      if (!formData.incident_type) {
        throw new Error('Incident type is required');
      }
      const payload = {
        job_id: formData.job_id,
        worker_id: userId,
        incident_type: formData.incident_type,
        reason: formData.reason || null,
        notified_at: formData.notified_at ? formData.notified_at.toISOString() : null,
        position: formData.position || null,
        start_time: formData.start_time ? formData.start_time.toISOString() : null,
        end_time: formData.end_time ? formData.end_time.toISOString() : null,
      };
      const response = await axiosInstance.post(
        `${endpoints.work.job}/worker/${userId}/incidents`,
        payload
      );
      return response.data;
    },
    onSuccess: async (responseData) => {
      // Invalidate all related queries to refresh the data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['worker-job-history', userId] }),
        queryClient.invalidateQueries({ queryKey: ['worker-rejection-stats', userId] }),
        queryClient.invalidateQueries({ queryKey: ['worker-accepted-completed-jobs', userId] }),
      ]);
      // Refetch the data immediately to ensure UI updates
      await queryClient.refetchQueries({ queryKey: ['worker-job-history', userId] });
      // Clear persisted form data on success
      localStorage.removeItem(STORAGE_KEY);
      toast.success('Incident created successfully');
      setIncidentDialog(false);
      setSearchAllJobs(false);
      setJobSearchQuery('');
      setSelectedJobFromSearch(null);
      setAutocompleteInputValue('');
      reset();
    },
    onError: (error: any) => {
      console.error('Error creating incident:', error);
      const errorMessage =
        error?.response?.data?.error || error?.message || 'Failed to create incident';
      toast.error(errorMessage);
      // Don't close dialog on error so user can see the error and retry
    },
  });

  const onSubmitIncident = handleSubmit(
    (formData: IncidentFormData) => {
      createIncidentMutation.mutate(formData);
    },
    (formErrors) => {}
  );

  const stats = data?.stats || {};
  const jobs = data?.jobs || [];
  const totalCount = data?.pagination?.total || 0;
  const rejectionData = rejectionStats || {};

  const isApproachingLimit = rejectionData.last3Months >= 1 || rejectionData.thisYear >= 4;
  const hasExceededLimit = rejectionData.last3Months > 1 || rejectionData.thisYear >= 5;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'accepted':
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'missing_timesheet':
        return 'warning';
      case 'no_show':
        return 'error';
      case 'called_in_sick':
        return 'warning';
      case 'draft':
        return 'info';
      case 'rejected':
        return 'error';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (job: any) => {
    const jobEnded = new Date(job.end_time) < new Date();

    // Check worker status for incidents (status is updated when incident is created)
    if (job.worker_status === 'no_show') {
      return 'No Show';
    }
    if (job.worker_status === 'called_in_sick') {
      return 'Called in Sick';
    }

    // Also check incident_type for backward compatibility (in case status wasn't updated)
    if (job.incident_type === 'no_show') {
      return 'No Show';
    }
    if (job.incident_type === 'called_in_sick') {
      return 'Called in Sick';
    }

    // If filtering by "accepted", show "Accepted" for all accepted jobs
    if (statusFilter === 'accepted' && job.worker_status === 'accepted') {
      return 'Accepted';
    }

    // If filtering by "completed", show "Completed" for all jobs in this filter
    // (backend already filters to accepted + ended jobs)
    if (statusFilter === 'completed' && job.worker_status === 'accepted' && jobEnded) {
      return 'Completed';
    }

    // Check if job is completed (accepted + ended)
    // Note: Completed means job ended, regardless of timesheet status
    if (job.worker_status === 'accepted' && jobEnded) {
      return 'Completed';
    }
    // Check if job is missing timesheet (accepted + ended + no timesheet OR draft timesheet)
    // Note: This is only for display when NOT filtering by completed
    if (
      job.worker_status === 'accepted' &&
      jobEnded &&
      (!job.timesheet_id || job.timesheet_status === 'draft' || !job.timesheet_entry_id)
    ) {
      return 'Missing Timesheet';
    }
    // Return the worker status as-is for other cases
    return (
      job.worker_status?.charAt(0).toUpperCase() + job.worker_status?.slice(1) || job.worker_status
    );
  };

  const getDisplayStatus = (job: any) => {
    // Check worker status for incidents (status is updated when incident is created)
    if (job.worker_status === 'no_show') {
      return 'no_show';
    }
    if (job.worker_status === 'called_in_sick') {
      return 'called_in_sick';
    }

    // Also check incident_type for backward compatibility (in case status wasn't updated)
    if (job.incident_type === 'no_show') {
      return 'no_show';
    }
    if (job.incident_type === 'called_in_sick') {
      return 'called_in_sick';
    }

    // If filtering by "accepted", return "accepted" for all accepted jobs
    if (statusFilter === 'accepted' && job.worker_status === 'accepted') {
      return 'accepted';
    }

    const jobEnded = new Date(job.end_time) < new Date();

    // If filtering by "completed", return "completed" for all jobs in this filter
    // (backend already filters to accepted + ended jobs)
    if (statusFilter === 'completed' && job.worker_status === 'accepted' && jobEnded) {
      return 'completed';
    }

    // Determine the status for display and filtering
    // Completed: accepted + ended (regardless of timesheet status)
    if (job.worker_status === 'accepted' && jobEnded) {
      return 'completed';
    }
    // Missing timesheet: accepted + ended + no timesheet OR draft timesheet
    // Note: This is only for display when NOT filtering by completed
    if (
      job.worker_status === 'accepted' &&
      jobEnded &&
      (!job.timesheet_id || job.timesheet_status === 'draft' || !job.timesheet_entry_id)
    ) {
      return 'missing_timesheet';
    }
    return job.worker_status;
  };

  const handleStatusFilterChange = useCallback(
    (event: any) => {
      setStatusFilter(event.target.value);
      table.onChangePage(null, 0); // Reset to first page
    },
    [table]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Statistics Cards */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        {/* Job Stats Card */}
        <Card sx={{ p: 3, flex: 1 }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Iconify icon="solar:case-minimalistic-bold" width={32} color="primary.main" />
              <Typography variant="h6">Job Statistics</Typography>
            </Box>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Total Jobs:
                </Typography>
                <Typography variant="h6">{stats.total || 0}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Completed:
                </Typography>
                <Label color="success" variant="soft">
                  {stats.completed || 0}
                </Label>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Accepted:
                </Typography>
                <Label color="success" variant="soft">
                  {stats.accepted || 0}
                </Label>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Pending:
                </Typography>
                <Label color="warning" variant="soft">
                  {stats.pending || 0}
                </Label>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Rejected:
                </Typography>
                <Label color="error" variant="soft">
                  {stats.rejected || 0} ({(() => {
                    const percentage = stats.rejectionPercentage;
                    if (typeof percentage === 'number' && !isNaN(percentage)) {
                      return percentage.toFixed(1);
                    }
                    if (typeof percentage === 'string' && percentage !== 'NaN' && !isNaN(parseFloat(percentage))) {
                      return percentage;
                    }
                    return '0.0';
                  })()}%)
                </Label>
              </Box>
              {isAdmin && (
                <>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No Show:
                    </Typography>
                    <Label color="error" variant="soft">
                      {stats.noShow || 0}
                    </Label>
                  </Box>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Called in Sick:
                    </Typography>
                    <Label color="warning" variant="soft">
                      {stats.calledInSick || 0}
                    </Label>
                  </Box>
                </>
              )}
              <Divider sx={{ my: 0.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Missing Timesheet:
                </Typography>
                <Label color="warning" variant="soft">
                  {stats.missingTimesheet || 0}
                </Label>
              </Box>
              {isAdmin && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<Iconify icon="mingcute:add-line" />}
                    onClick={() => setIncidentDialog(true)}
                    fullWidth
                  >
                    Add Incident
                  </Button>
                </Box>
              )}
            </Stack>
          </Stack>
        </Card>

        {/* Rejection Policy Card */}
        <Card
          sx={{
            p: 3,
            flex: 1,
            bgcolor: hasExceededLimit
              ? (theme) => alpha(theme.palette.error.main, 0.08)
              : isApproachingLimit
                ? (theme) => alpha(theme.palette.warning.main, 0.08)
                : 'background.paper',
            border: (theme) =>
              hasExceededLimit
                ? `1px solid ${theme.palette.error.main}`
                : isApproachingLimit
                  ? `1px solid ${theme.palette.warning.main}`
                  : 'none',
          }}
        >
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Iconify
                icon="solar:shield-check-bold"
                width={32}
                color={
                  hasExceededLimit
                    ? 'error.main'
                    : isApproachingLimit
                      ? 'warning.main'
                      : 'info.main'
                }
              />
              <Typography variant="h6">Rejection Status</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Policy: Max <strong>1 rejection / 3 months</strong> OR{' '}
              <strong>5 rejections / year</strong>
            </Typography>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Last 3 months:
                </Typography>
                <Label color={rejectionData.last3Months >= 1 ? 'error' : 'success'} variant="soft">
                  {rejectionData.last3Months || 0} / 1{rejectionData.last3Months >= 1 && ' ⚠️'}
                </Label>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  This year:
                </Typography>
                <Label color={rejectionData.thisYear >= 4 ? 'error' : 'success'} variant="soft">
                  {rejectionData.thisYear || 0} / 5{rejectionData.thisYear >= 4 && ' ⚠️'}
                </Label>
              </Box>
            </Stack>
            {hasExceededLimit && (
              <Alert severity="error" sx={{ mt: 1 }}>
                <AlertTitle>Limit Exceeded</AlertTitle>
                You have exceeded the rejection limit. Further rejections will be reviewed by
                management.
              </Alert>
            )}
            {!hasExceededLimit && isApproachingLimit && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                <AlertTitle>Approaching Limit</AlertTitle>
                This worker is approaching the rejection limit.
              </Alert>
            )}
          </Stack>
        </Card>
      </Stack>

      {/* Job History Table */}
      <Card>
        <Box sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h6">Job History</Typography>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                label="Status Filter"
                onChange={handleStatusFilterChange}
              >
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom
                headCells={TABLE_HEAD}
                order={table.order}
                orderBy={table.orderBy}
                onSort={table.onSort}
              />

              <TableBody>
                {isLoading ? (
                  <TableSkeleton />
                ) : jobs.length === 0 ? (
                  <TableNoData notFound />
                ) : (
                  jobs.map((job: any, index: number) => {
                    const positionLabel =
                      job.position
                        ? (JOB_POSITION_OPTIONS.find((option) => option.value === job.position)?.label ||
                           job.position)
                        : 'N/A';

                    // Use job_worker_id as primary key, with index as fallback to ensure uniqueness
                    const uniqueKey = job.job_worker_id 
                      ? `${job.job_worker_id}-${index}` 
                      : `${job.job_id}-${job.position}-${job.worker_start_time}-${job.worker_end_time}-${index}`;

                    return (
                      <TableRow key={uniqueKey} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            #{job.job_number}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2">{fDate(job.start_time)}</Typography>
                          {job.worker_start_time && job.worker_end_time ? (
                            <Typography variant="caption" color="text.secondary">
                              {fTime(job.worker_start_time)} - {fTime(job.worker_end_time)}
                            </Typography>
                          ) : null}
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2">{job.company_name || ''}</Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2">{job.site_name || ''}</Typography>
                          {job.site_city && (
                            <Typography variant="caption" color="text.secondary">
                              {job.site_city}
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell>
                          <Label variant="soft" color={getPositionColor(job.position)}>
                            {positionLabel}
                          </Label>
                        </TableCell>

                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Label variant="soft" color={getStatusColor(getDisplayStatus(job))}>
                              {getStatusLabel(job)}
                            </Label>
                            {(getDisplayStatus(job) === 'rejected' && job.rejection_reason) && (
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRejectionDialog({
                                    open: true,
                                    reason: job.rejection_reason,
                                    date: job.rejected_at,
                                    rejectedBy: job.response_by_first_name
                                      ? {
                                          first_name: job.response_by_first_name,
                                          last_name: job.response_by_last_name,
                                          photo_url: job.response_by_photo_url || '',
                                        }
                                      : null,
                                  });
                                }}
                                sx={{ p: 0.5 }}
                              >
                                <Iconify icon="solar:info-circle-bold" width={18} />
                              </IconButton>
                            )}
                            {(getDisplayStatus(job) === 'no_show' ||
                              getDisplayStatus(job) === 'called_in_sick') && (
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIncidentDetailsDialog({
                                    open: true,
                                    incidentType: job.incident_type || job.worker_status,
                                    reason: job.incident_reason,
                                    notifiedAt: job.incident_notified_at,
                                    reportedAt: job.incident_reported_at,
                                    reportedBy: job.incident_reporter_first_name
                                      ? {
                                          first_name: job.incident_reporter_first_name,
                                          last_name: job.incident_reporter_last_name,
                                          photo_url: job.incident_reporter_photo_url,
                                        }
                                      : null,
                                  });
                                }}
                                sx={{ p: 0.5 }}
                              >
                                <Iconify icon="solar:info-circle-bold" width={18} />
                              </IconButton>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePaginationCustom
            page={table.page}
            dense={table.dense}
            count={totalCount}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Box>
      </Card>

      {/* Rejection Reason Dialog */}
      <Dialog
        open={rejectionDialog.open}
        onClose={() => setRejectionDialog({ open: false, reason: null, date: null, rejectedBy: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Rejection Details</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {rejectionDialog.rejectedBy && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Rejected by:
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar
                    src={rejectionDialog.rejectedBy.photo_url || undefined}
                    alt={`${rejectionDialog.rejectedBy.first_name} ${rejectionDialog.rejectedBy.last_name}`}
                    sx={{ width: 32, height: 32 }}
                  >
                    {rejectionDialog.rejectedBy.first_name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <Typography variant="body2">
                    {rejectionDialog.rejectedBy.first_name} {rejectionDialog.rejectedBy.last_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    (on behalf of worker)
                  </Typography>
                </Stack>
              </Box>
            )}
            {rejectionDialog.date && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Rejected Date & Time:
                </Typography>
                <Typography variant="body2">
                  {fDate(rejectionDialog.date)} at {fTime(rejectionDialog.date)}
                </Typography>
              </Box>
            )}
            {rejectionDialog.reason && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Rejection Reason:
                </Typography>
                <Typography variant="body2">{rejectionDialog.reason}</Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionDialog({ open: false, reason: null, date: null, rejectedBy: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Incident Details Dialog */}
      <Dialog
        open={incidentDetailsDialog.open}
        onClose={() =>
          setIncidentDetailsDialog({
            open: false,
            incidentType: null,
            reason: null,
            notifiedAt: null,
            reportedAt: null,
            reportedBy: null,
          })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {incidentDetailsDialog.incidentType === 'no_show' ? 'No Show' : 'Called in Sick'} Details
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {incidentDetailsDialog.reportedBy && (
              <Box sx={{ pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 1, display: 'block' }}
                >
                  Reported By:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    alt={`${incidentDetailsDialog.reportedBy.first_name} ${incidentDetailsDialog.reportedBy.last_name}`}
                    src={incidentDetailsDialog.reportedBy.photo_url || ''}
                    sx={{ width: 40, height: 40 }}
                  >
                    {incidentDetailsDialog.reportedBy.first_name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {incidentDetailsDialog.reportedBy.first_name}{' '}
                    {incidentDetailsDialog.reportedBy.last_name}
                  </Typography>
                </Box>
              </Box>
            )}
            {incidentDetailsDialog.reportedAt && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Reported Date & Time:
                </Typography>
                <Typography variant="body2">
                  {fDate(incidentDetailsDialog.reportedAt)} at{' '}
                  {fTime(incidentDetailsDialog.reportedAt)}
                </Typography>
              </Box>
            )}
            {incidentDetailsDialog.incidentType === 'called_in_sick' &&
              incidentDetailsDialog.notifiedAt && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    When they notified:
                  </Typography>
                  <Typography variant="body2">
                    {fDate(incidentDetailsDialog.notifiedAt)} at{' '}
                    {fTime(incidentDetailsDialog.notifiedAt)}
                  </Typography>
                </Box>
              )}
            {incidentDetailsDialog.reason && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Memo / Reason:
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                  {incidentDetailsDialog.reason}
                </Typography>
              </Box>
            )}
            {!incidentDetailsDialog.reason && (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No memo or reason provided
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setIncidentDetailsDialog({
                open: false,
                incidentType: null,
                reason: null,
                notifiedAt: null,
                reportedAt: null,
                reportedBy: null,
              })
            }
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Incident Creation Dialog */}
      {isAdmin && (
        <Dialog
          open={incidentDialog}
          onClose={(event, reason) => {
            // Prevent closing on backdrop click or escape key
            if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
              return;
            }
            // Only allow programmatic close (via Cancel button)
            if (!isSubmitting && !createIncidentMutation.isPending) {
              setIncidentDialog(false);
              setSearchAllJobs(false);
              setJobSearchQuery('');
              setSelectedJobFromSearch(null);
              setAutocompleteInputValue('');
            }
          }}
          maxWidth="sm"
          fullWidth
        >
          <form onSubmit={onSubmitIncident} noValidate>
            <DialogTitle>Add Worker Incident</DialogTitle>
            <DialogContent>
              <Stack spacing={3} sx={{ mt: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={searchAllJobs}
                      onChange={(e) => {
                        const newValue = e.target.checked;
                        setSearchAllJobs(newValue);
                        setJobSearchQuery('');
                        setSelectedJobFromSearch(null);
                        setAutocompleteInputValue('');
                        // Reset job_id when switching modes
                        reset({ ...watch(), job_id: null });
                        // Cancel any in-flight queries when switching modes
                        if (newValue) {
                          queryClient.cancelQueries({ queryKey: ['worker-accepted-completed-jobs', userId] });
                        } else {
                          queryClient.cancelQueries({ queryKey: ['search-jobs-by-number'] });
                        }
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Search all jobs
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Enable to search jobs even if worker was removed
                      </Typography>
                    </Box>
                  }
                />

                <Controller
                  name="job_id"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={
                        searchAllJobs
                          ? (() => {
                              // Include selected job in options if it exists and isn't already in search results
                              const options = searchedJobsData || [];
                              if (selectedJobFromSearch && field.value) {
                                const isAlreadyInOptions = options.some(
                                  (job: any) => String(job.id || job.job_id) === String(selectedJobFromSearch.id || selectedJobFromSearch.job_id)
                                );
                                if (!isAlreadyInOptions && 
                                    String(selectedJobFromSearch.id || selectedJobFromSearch.job_id) === String(field.value)) {
                                  return [selectedJobFromSearch, ...options];
                                }
                              }
                              return options;
                            })()
                          : (acceptedJobsData || [])
                      }
                      getOptionLabel={(option: any) =>
                        option?.job_number
                          ? `#${option.job_number} - ${fDate(option.start_time)}`
                          : ''
                      }
                      isOptionEqualToValue={(option: any, value: any) => {
                        const optionId = option?.id || option?.job_id;
                        const valueId = value?.id || value?.job_id;
                        return String(optionId) === String(valueId);
                      }}
                      inputValue={searchAllJobs ? autocompleteInputValue : undefined}
                      onInputChange={(_, newInputValue, reason) => {
                        if (searchAllJobs) {
                          // Always update the input value state
                          setAutocompleteInputValue(newInputValue);
                          
                          if (reason === 'input') {
                            // Update search query for backend search
                            setJobSearchQuery(newInputValue);
                            // If user is typing something different from selected job, clear selection
                            if (selectedJobFromSearch && field.value) {
                              const selectedLabel = `#${selectedJobFromSearch.job_number} - ${fDate(selectedJobFromSearch.start_time)}`;
                              if (newInputValue !== selectedLabel) {
                                field.onChange(null);
                                setSelectedJobFromSearch(null);
                              }
                            }
                          } else if (reason === 'clear') {
                            // When clearing, also clear the selection
                            field.onChange(null);
                            setSelectedJobFromSearch(null);
                            setJobSearchQuery('');
                          } else if (reason === 'reset') {
                            // When resetting, clear everything
                            setAutocompleteInputValue('');
                            setJobSearchQuery('');
                          }
                        }
                      }}
                      onChange={(_, newValue: any) => {
                        if (searchAllJobs) {
                          // Only accept valid job objects from search results
                          if (newValue && (newValue.id || newValue.job_id)) {
                            const jobId = String(newValue.id || newValue.job_id);
                            field.onChange(jobId);
                            // Store the selected job so it persists even if search query changes
                            setSelectedJobFromSearch(newValue);
                            // Update input value to show the selected job label
                            const selectedLabel = `#${newValue.job_number} - ${fDate(newValue.start_time)}`;
                            setAutocompleteInputValue(selectedLabel);
                          } else {
                            field.onChange(null);
                            setSelectedJobFromSearch(null);
                            setAutocompleteInputValue('');
                          }
                        } else {
                          field.onChange(newValue?.job_id ? String(newValue.job_id) : null);
                          setSelectedJobFromSearch(null);
                          setAutocompleteInputValue('');
                        }
                      }}
                      value={
                        searchAllJobs
                          ? (() => {
                              // First try to find in current search results
                              const foundInSearch = searchedJobsData?.find(
                                (job: any) => String(job.id || job.job_id) === String(field.value)
                              );
                              // If not found but we have a stored selected job, use that
                              if (!foundInSearch && selectedJobFromSearch && 
                                  String(selectedJobFromSearch.id || selectedJobFromSearch.job_id) === String(field.value)) {
                                return selectedJobFromSearch;
                              }
                              return foundInSearch || null;
                            })()
                          : acceptedJobsData?.find((job: any) => job.job_id === field.value) || null
                      }
                      loading={searchAllJobs ? isSearchingJobs : !acceptedJobsData}
                      filterOptions={(options, params) => {
                        if (searchAllJobs) {
                          // For search all jobs mode, return options as-is (already filtered by backend)
                          return options;
                        }
                        // For assigned jobs mode, use default filtering
                        const filtered = options.filter((option: any) => {
                          const label = option?.job_number
                            ? `#${option.job_number} - ${fDate(option.start_time)}`
                            : '';
                          return label.toLowerCase().includes(params.inputValue.toLowerCase());
                        });
                        return filtered;
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Job Number *"
                          placeholder={
                            searchAllJobs
                              ? 'Type job number to search... (min 2 characters)'
                              : 'Search job...'
                          }
                          error={!!errors.job_id}
                          helperText={
                            errors.job_id?.message ||
                            (searchAllJobs
                              ? 'Type at least 2 characters to search all jobs'
                              : 'Select from jobs where this worker is assigned')
                          }
                        />
                      )}
                    />
                  )}
                />

                <Controller
                  name="incident_type"
                  control={control}
                  render={({ field }) => {
                    const value = (field.value || '') as string;
                    const hasValue = value === 'no_show' || value === 'called_in_sick';
                    return (
                      <FormControl fullWidth error={!!errors.incident_type}>
                        <InputLabel id="incident-type-label" shrink={hasValue}>
                          Incident Type *
                        </InputLabel>
                        <Select 
                          {...field} 
                          value={value}
                          labelId="incident-type-label"
                          label="Incident Type" 
                          displayEmpty
                          notched={hasValue}
                          renderValue={(selected) => {
                            const selectedValue = (selected || '') as string;
                            if (selectedValue !== 'no_show' && selectedValue !== 'called_in_sick') {
                              return '';
                            }
                            return selectedValue === 'no_show' ? 'No Show' : 'Called in Sick';
                          }}
                        >
                          <MenuItem value="no_show">No Show</MenuItem>
                          <MenuItem value="called_in_sick">Called in Sick</MenuItem>
                        </Select>
                        {errors.incident_type && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                            {errors.incident_type.message}
                          </Typography>
                        )}
                      </FormControl>
                    );
                  }}
                />

                {incidentType === 'called_in_sick' && (
                  <Controller
                    name="notified_at"
                    control={control}
                    render={({ field }) => (
                      <DateTimePicker
                        {...field}
                        label="When did they notify?"
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.notified_at,
                            helperText: errors.notified_at?.message,
                          },
                        }}
                      />
                    )}
                  />
                )}

                {searchAllJobs && (
                  <>
                    <Controller
                      name="position"
                      control={control}
                      render={({ field }) => {
                        const hasValue = Boolean(field.value && field.value !== '');
                        return (
                          <FormControl fullWidth error={!!errors.position}>
                            <InputLabel id="position-label" shrink={hasValue}>
                              Position *
                            </InputLabel>
                            <Select 
                              {...field} 
                              labelId="position-label"
                              label="Position *" 
                              displayEmpty
                              notched={hasValue}
                              renderValue={(selected) => {
                                if (!selected || selected === '') {
                                  return '';
                                }
                                const option = JOB_POSITION_OPTIONS.find((opt) => opt.value === selected);
                                return option?.label || selected;
                              }}
                            >
                              {JOB_POSITION_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                            {errors.position && (
                              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                                {errors.position.message}
                              </Typography>
                            )}
                          </FormControl>
                        );
                      }}
                    />

                    <Stack direction="row" spacing={2}>
                      <Controller
                        name="start_time"
                        control={control}
                        render={({ field }) => {
                          // Get the selected job's date to combine with the selected time
                          const selectedJob = searchAllJobs
                            ? (selectedJobFromSearch ||
                                searchedJobsData?.find(
                                  (job: any) => String(job.id || job.job_id) === String(watch('job_id'))
                                ))
                            : acceptedJobsData?.find((job: any) => job.job_id === watch('job_id'));
                          
                          const jobDate = selectedJob?.start_time
                            ? dayjs(selectedJob.start_time).startOf('day')
                            : dayjs().startOf('day');
                          
                          // Combine job date with selected time
                          const fieldValue = field.value
                            ? jobDate
                                .hour(dayjs(field.value).hour())
                                .minute(dayjs(field.value).minute())
                                .second(0)
                                .millisecond(0)
                            : null;

                          return (
                            <TimePicker
                              label="Start Time *"
                              value={fieldValue}
                              onChange={(newValue) => {
                                if (newValue) {
                                  // Combine job date with selected time
                                  // If no job selected yet, use today's date
                                  const baseDate = selectedJob?.start_time
                                    ? dayjs(selectedJob.start_time).startOf('day')
                                    : dayjs().startOf('day');
                                  const combinedDateTime = baseDate
                                    .hour(newValue.hour())
                                    .minute(newValue.minute())
                                    .second(0)
                                    .millisecond(0);
                                  field.onChange(combinedDateTime);
                                } else {
                                  field.onChange(null);
                                }
                              }}
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  error: !!errors.start_time,
                                  helperText: errors.start_time?.message,
                                },
                              }}
                            />
                          );
                        }}
                      />

                      <Controller
                        name="end_time"
                        control={control}
                        render={({ field }) => {
                          // Get the selected job's date to combine with the selected time
                          const selectedJob = searchAllJobs
                            ? (selectedJobFromSearch ||
                                searchedJobsData?.find(
                                  (job: any) => String(job.id || job.job_id) === String(watch('job_id'))
                                ))
                            : acceptedJobsData?.find((job: any) => job.job_id === watch('job_id'));
                          
                          const jobDate = selectedJob?.start_time
                            ? dayjs(selectedJob.start_time).startOf('day')
                            : dayjs().startOf('day');
                          
                          // Combine job date with selected time
                          const fieldValue = field.value
                            ? jobDate
                                .hour(dayjs(field.value).hour())
                                .minute(dayjs(field.value).minute())
                                .second(0)
                                .millisecond(0)
                            : null;

                          return (
                            <TimePicker
                              label="End Time *"
                              value={fieldValue}
                              onChange={(newValue) => {
                                if (newValue) {
                                  // Combine job date with selected time
                                  // If no job selected yet, use today's date
                                  const baseDate = selectedJob?.start_time
                                    ? dayjs(selectedJob.start_time).startOf('day')
                                    : dayjs().startOf('day');
                                  const combinedDateTime = baseDate
                                    .hour(newValue.hour())
                                    .minute(newValue.minute())
                                    .second(0)
                                    .millisecond(0);
                                  field.onChange(combinedDateTime);
                                } else {
                                  field.onChange(null);
                                }
                              }}
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  error: !!errors.end_time,
                                  helperText: errors.end_time?.message,
                                },
                              }}
                            />
                          );
                        }}
                      />
                    </Stack>
                  </>
                )}

                <Controller
                  name="reason"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Memo / Reason"
                      multiline
                      rows={4}
                      placeholder="Enter memo or reason for the incident..."
                      helperText="Add any notes or details about this incident"
                      fullWidth
                    />
                  )}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  if (!isSubmitting && !createIncidentMutation.isPending) {
                    setIncidentDialog(false);
                    setSearchAllJobs(false);
                    setJobSearchQuery('');
                    setSelectedJobFromSearch(null);
                    setAutocompleteInputValue('');
                  }
                }}
                disabled={isSubmitting || createIncidentMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || createIncidentMutation.isPending}
                startIcon={
                  isSubmitting || createIncidentMutation.isPending ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : null
                }
              >
                {isSubmitting || createIncidentMutation.isPending
                  ? 'Creating...'
                  : 'Create Incident'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      )}
    </Box>
  );
}
