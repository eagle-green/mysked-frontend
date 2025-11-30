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
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import AlertTitle from '@mui/material/AlertTitle';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import Autocomplete from '@mui/material/Autocomplete';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
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

const incidentFormSchema = z
  .object({
    job_id: z
      .string()
      .nullable()
      .refine((val) => val !== null && val !== '', {
        message: 'Job is required',
      }),
    incident_type: z.string().refine((val) => val === 'no_show' || val === 'called_in_sick', {
      message: 'Incident type is required',
    }),
    reason: z.string().optional(),
    notified_at: z.custom<Dayjs | null>((val) => true),
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
  );

type IncidentFormData = {
  job_id: string | null;
  incident_type: 'no_show' | 'called_in_sick';
  reason?: string;
  notified_at: Dayjs | null;
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
  }>({
    open: false,
    reason: null,
    date: null,
  });
  const [incidentDialog, setIncidentDialog] = useState(false);
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
  const getPersistedFormData = (): Partial<IncidentFormData> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          incident_type:
            parsed.incident_type === 'no_show' || parsed.incident_type === 'called_in_sick'
              ? parsed.incident_type
              : ('no_show' as const),
          notified_at: parsed.notified_at ? dayjs(parsed.notified_at) : null,
        };
      }
    } catch (error) {
      console.warn('Failed to load persisted form data:', error);
    }
    return {
      job_id: null,
      incident_type: 'no_show' as const,
      reason: '',
      notified_at: null,
    };
  };

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<IncidentFormData>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: getPersistedFormData(),
  });

  // Persist form data when it changes
  const formValues = watch();
  useEffect(() => {
    if (incidentDialog) {
      const dataToStore = {
        ...formValues,
        notified_at: formValues.notified_at ? formValues.notified_at.toISOString() : null,
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
    enabled: !!userId && isAdmin && incidentDialog,
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
                  {stats.rejected || 0} ({stats.rejectionPercentage || '0.0'}%)
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
                      JOB_POSITION_OPTIONS.find((option) => option.value === job.position)?.label ||
                      job.position;

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
                          <Typography variant="caption" color="text.secondary">
                            {fTime(job.worker_start_time)} - {fTime(job.worker_end_time)}
                          </Typography>
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
                          {getDisplayStatus(job) === 'rejected' && job.rejection_reason ? (
                            <Label
                              variant="soft"
                              color={getStatusColor(getDisplayStatus(job))}
                              onClick={(e) => {
                                e.stopPropagation();
                                setRejectionDialog({
                                  open: true,
                                  reason: job.rejection_reason,
                                  date: job.rejected_at,
                                });
                              }}
                              sx={{
                                cursor: 'pointer',
                                '&:hover': {
                                  opacity: 0.8,
                                },
                              }}
                            >
                              {getStatusLabel(job)}
                            </Label>
                          ) : getDisplayStatus(job) === 'no_show' ||
                            getDisplayStatus(job) === 'called_in_sick' ? (
                            <Label
                              variant="soft"
                              color={getStatusColor(getDisplayStatus(job))}
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
                              sx={{
                                cursor: 'pointer',
                                '&:hover': {
                                  opacity: 0.8,
                                },
                              }}
                            >
                              {getStatusLabel(job)}
                            </Label>
                          ) : (
                            <Label variant="soft" color={getStatusColor(getDisplayStatus(job))}>
                              {getStatusLabel(job)}
                            </Label>
                          )}
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
        onClose={() => setRejectionDialog({ open: false, reason: null, date: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Rejection Details</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {rejectionDialog.date && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Rejected Date & Time:
                </Typography>
                <Typography variant="body2">
                  {fDate(rejectionDialog.date)} at {fTime(rejectionDialog.date)}
                </Typography>
              </Box>
            )}
            {rejectionDialog.reason && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Rejection Reason:
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {rejectionDialog.reason}
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionDialog({ open: false, reason: null, date: null })}>
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
            }
          }}
          maxWidth="sm"
          fullWidth
        >
          <form onSubmit={onSubmitIncident} noValidate>
            <DialogTitle>Add Worker Incident</DialogTitle>
            <DialogContent>
              <Stack spacing={3} sx={{ mt: 1 }}>
                <Controller
                  name="job_id"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={acceptedJobsData || []}
                      getOptionLabel={(option: any) =>
                        option?.job_number
                          ? `#${option.job_number} - ${fDate(option.start_time)}`
                          : ''
                      }
                      isOptionEqualToValue={(option: any, value: any) =>
                        option?.job_id === value?.job_id
                      }
                      onChange={(_, newValue: any) =>
                        field.onChange(newValue?.job_id ? String(newValue.job_id) : null)
                      }
                      value={
                        acceptedJobsData?.find((job: any) => job.job_id === field.value) || null
                      }
                      loading={!acceptedJobsData}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Job Number"
                          placeholder="Search job..."
                          error={!!errors.job_id}
                          helperText={errors.job_id?.message}
                        />
                      )}
                    />
                  )}
                />

                <Controller
                  name="incident_type"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.incident_type}>
                      <InputLabel>Incident Type</InputLabel>
                      <Select {...field} label="Incident Type">
                        <MenuItem value="no_show">No Show</MenuItem>
                        <MenuItem value="called_in_sick">Called in Sick</MenuItem>
                      </Select>
                      {errors.incident_type && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                          {errors.incident_type.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
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
