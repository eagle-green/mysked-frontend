import type { UserType } from 'src/auth/types';
import type { IDatePickerControl } from 'src/types/common';
import type {
  TimeSheetDetails,
  ITimeSheetEntries,
  TimeEntryDateValidators,
  TimeEntryDateValidatorType,
} from 'src/types/timesheet';

import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, Suspense, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, usePathname, useSearchParams } from 'src/routes/hooks';

import { fIsAfter } from 'src/utils/format-time';
import { normalizeFormValues } from 'src/utils/form-normalize';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify/iconify';

import { TimeSheetUpdateSchema } from './schema/timesheet-schema';
import { TimeSummaryHeader, TimeSheetDetailHeader } from './template';

import type { TimeSheetUpdateType } from './schema/timesheet-schema';

// ----------------------------------------------------------------------

type TimeSheetEditProps = {
  timesheet: TimeSheetDetails;
  user?: UserType;
};

export function AdminTimeSheetEditForm({ timesheet, user }: TimeSheetEditProps) {
  // navigations
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // query
  const queryClient = useQueryClient();
  // Booleans
  const loadingSend = useBoolean();
  // State for submit dialog
  const submitDialog = useBoolean();
  const rejectConfirmDialog = useBoolean();

  // states
  const [currentEntry, setCurrentEntry] = useState<ITimeSheetEntries | null>(null);
  const [workerConfirmations, setWorkerConfirmations] = useState<Record<string, boolean>>({});
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const TAB_PARAM = 'worker';
  const { entries } = timesheet;

  // Check if current user has access to this timesheet
  const hasTimesheetAccess = useMemo(() => {
    if (!user?.id) return false;

    // Admin users can access any timesheet
    if (user.role === 'admin') return true;

    // Only the current timesheet manager can access and edit the timesheet
    if (user.id === timesheet.timesheet_manager_id) return true;

    // Workers cannot access the timesheet edit form - only view their own entries
    // For now, we'll assume only timesheet manager has access

    return false;
  }, [user?.id, user?.role, timesheet.timesheet_manager_id]);

  // Check if timesheet is read-only (submitted, approved, rejected, etc.)
  const isTimesheetReadOnly = useMemo(() => {
    // Rejected timesheets are always read-only (even for admins) - they can only view rejection reason
    if (timesheet.status === 'rejected') return true;

    // Approved timesheets are always read-only (even for admins) - they are final
    if (timesheet.status === 'approved') return true;

    // Admin users can edit non-rejected and non-approved timesheets
    if (user?.role === 'admin') return false;

    // For non-admin users, only draft timesheets can be edited
    return timesheet.status !== 'draft';
  }, [timesheet.status, user?.role]);

  // Redirect if user doesn't have access
  useEffect(() => {
    if (hasTimesheetAccess === false) {
      router.push(paths.auth.accessDenied);
      return;
    }
  }, [hasTimesheetAccess, router]);

  // Filter out workers who haven't accepted the job
  const acceptedEntries = useMemo(
    () => entries.filter((entry) => entry.job_worker_status === 'accepted'),
    [entries]
  );

  // Use existing timesheet entries instead of fetching from non-existent endpoint
  // Note: workerOptions was removed as it was unused

  // Note: canEditTimesheetManager was removed as it was unused

  const createTabItems = useCallback(
    () =>
      acceptedEntries.map((entry) => ({
        value: entry.id,
        label: `${entry.worker_first_name} ${entry.worker_last_name}`,
        icon: (
          <Avatar
            sx={{ height: 35, width: 35 }}
            src={entry.worker_photo_url || undefined}
            alt={`${entry.worker_first_name} ${entry.worker_last_name}`}
          >
            {entry.worker_first_name?.charAt(0).toUpperCase()}
          </Avatar>
        ),
        onclick: () => {
          // Immediate tab switch - no delay
          setCurrentEntry(entry);
        },
      })),
    [acceptedEntries]
  );

  const TAB_ITEMS = createTabItems();

  // Memoized tab selection to prevent unnecessary re-renders
  const selectedTab = useMemo(() => {
    const paramValue = searchParams.get(TAB_PARAM);
    return paramValue || acceptedEntries[0]?.id || '';
  }, [searchParams, acceptedEntries]);

  const toDayjs = (value?: string | Date | null) => dayjs(value);
  const dateValidations = useSetState<TimeEntryDateValidators>({
    travel_start: toDayjs(currentEntry?.travel_start || currentEntry?.original_start_time),
    travel_end: toDayjs(currentEntry?.travel_end || currentEntry?.original_start_time),
    timesheet_date: toDayjs(timesheet.timesheet_date),
    shift_start: toDayjs(currentEntry?.shift_start),
    shift_end: toDayjs(currentEntry?.shift_end),
    break_end: toDayjs(currentEntry?.break_end || currentEntry?.original_start_time),
    break_start: toDayjs(currentEntry?.break_start || currentEntry?.original_start_time),
  });
  const { state: currentDateValues, setState: updateValidation } = dateValidations;
  const { travel_end, travel_start, shift_end, shift_start, timesheet_date } = currentDateValues;

  // Travel validation (date + time fields)
  const travelEndError = fIsAfter(travel_start, travel_end);
  const travelStartError = fIsAfter(timesheet_date, travel_start);

  // Shift validation (date + time fields)
  const shiftStartError = fIsAfter(timesheet_date, shift_start);
  const shiftEndError = fIsAfter(shift_start, shift_end);

  // Break validation - proper date and time validation based on worker's shift times
  const breakStartDateError =
    currentEntry?.original_start_time &&
    currentDateValues.break_start &&
    dayjs(currentDateValues.break_start)
      .startOf('day')
      .isBefore(dayjs(currentEntry.original_start_time).startOf('day'));

  const breakEndDateError =
    currentEntry?.original_end_time &&
    currentDateValues.break_end &&
    dayjs(currentDateValues.break_end)
      .startOf('day')
      .isAfter(dayjs(currentEntry.original_end_time).startOf('day'));

  // Time validation - check if break times are within shift time range
  const breakStartTimeError =
    currentEntry?.original_start_time &&
    currentDateValues.break_start &&
    dayjs(currentDateValues.break_start).isBefore(dayjs(currentEntry.original_start_time));

  const breakEndTimeError =
    currentEntry?.original_end_time &&
    currentDateValues.break_end &&
    dayjs(currentDateValues.break_end).isAfter(dayjs(currentEntry.original_end_time));

  // Additional validation: break start time cannot be earlier than shift start time (same date)
  const breakStartTimeRangeError =
    currentEntry?.original_start_time &&
    currentDateValues.break_start &&
    dayjs(currentDateValues.break_start)
      .startOf('day')
      .isSame(dayjs(currentEntry.original_start_time).startOf('day')) &&
    dayjs(currentDateValues.break_start).isBefore(dayjs(currentEntry.original_start_time));

  // Additional validation: break end time cannot be later than shift end time (same date)
  const breakEndTimeRangeError =
    currentEntry?.original_end_time &&
    currentDateValues.break_end &&
    dayjs(currentDateValues.break_end)
      .startOf('day')
      .isSame(dayjs(currentEntry.original_end_time).startOf('day')) &&
    dayjs(currentDateValues.break_end).isAfter(dayjs(currentEntry.original_end_time));

  // CRITICAL FIX: break start time cannot be later than shift end time (same date)
  const breakStartTimeAfterShiftEndError =
    currentEntry?.original_end_time &&
    currentDateValues.break_start &&
    dayjs(currentDateValues.break_start)
      .startOf('day')
      .isSame(dayjs(currentEntry.original_end_time).startOf('day')) &&
    dayjs(currentDateValues.break_start).isAfter(dayjs(currentEntry.original_end_time));

  // CRITICAL FIX: break end time cannot be before break start time (same date)
  const breakEndBeforeBreakStartError =
    currentDateValues.break_start &&
    currentDateValues.break_end &&
    dayjs(currentDateValues.break_start)
      .startOf('day')
      .isSame(dayjs(currentDateValues.break_end).startOf('day')) &&
    dayjs(currentDateValues.break_end).isBefore(dayjs(currentDateValues.break_start));

  // CRITICAL FIX: break end time cannot be before break start time (same date) - ENHANCED
  const breakEndTimeBeforeBreakStartTimeError =
    currentDateValues.break_start &&
    currentDateValues.break_end &&
    dayjs(currentDateValues.break_start)
      .startOf('day')
      .isSame(dayjs(currentDateValues.break_end).startOf('day')) &&
    dayjs(currentDateValues.break_end).isBefore(dayjs(currentDateValues.break_start));

  // CRITICAL FIX: break end date cannot be before break start date
  const breakEndDateBeforeBreakStartDateError =
    currentDateValues.break_start &&
    currentDateValues.break_end &&
    dayjs(currentDateValues.break_end)
      .startOf('day')
      .isBefore(dayjs(currentDateValues.break_start).startOf('day'));

  const hasValidationErrors =
    travelEndError ||
    travelStartError ||
    shiftStartError ||
    shiftEndError ||
    breakStartDateError ||
    breakStartTimeError ||
    breakEndDateError ||
    breakEndTimeError ||
    breakStartTimeRangeError ||
    breakEndTimeRangeError ||
    breakStartTimeAfterShiftEndError ||
    breakEndBeforeBreakStartError ||
    breakEndTimeBeforeBreakStartTimeError ||
    breakEndDateBeforeBreakStartDateError;

  const methods = useForm<TimeSheetUpdateType>({
    mode: 'onChange',
    resolver: zodResolver(TimeSheetUpdateSchema),
    defaultValues: {
      travel_start: '',
      shift_start: currentEntry?.original_start_time || undefined,
      break_start: '',
      break_end: '',
      shift_end: currentEntry?.original_end_time || undefined,
      travel_end: '',
      travel_to_km: 0,
      travel_during_km: 0,
      travel_from_km: 0,
      worker_notes: '',
      admin_notes: '',
    },
  });

  const {
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { isSubmitting, isValid, errors },
  } = methods;

  const onSubmit = handleSubmit(async (data: TimeSheetUpdateType) => {
    // Convert travel distance fields to numbers and empty strings to null for timestamps
    const processedData = {
      ...data,
      travel_to_km: Number(data.travel_to_km) || 0,
      travel_during_km: Number(data.travel_during_km) || 0,
      travel_from_km: Number(data.travel_from_km) || 0,
      // CRITICAL FIX: Convert empty strings to null for timestamp fields
      travel_start: data.travel_start === '' ? null : data.travel_start,
      travel_end: data.travel_end === '' ? null : data.travel_end,
      break_start: data.break_start === '' ? null : data.break_start,
      break_end: data.break_end === '' ? null : data.break_end,
      shift_start: data.shift_start === '' ? null : data.shift_start,
      shift_end: data.shift_end === '' ? null : data.shift_end,
    };

    if (hasValidationErrors) {
      toast.error('Error: Conflicting date fields. Please resolve before submitting.');
      return;
    }

    if (!currentEntry?.id) {
      toast.error('No worker entry selected');
      return;
    }

    const toastId = toast.loading('Updating timesheet...');
    loadingSend.onTrue();

    try {
      const response = await fetcher([
        `${endpoints.timesheet.entries}/${currentEntry.id}`,
        { method: 'PUT', data: processedData },
      ]);

      // Invalidate related queries - more comprehensive invalidation
      queryClient.invalidateQueries({ queryKey: ['timesheet-detail-query', timesheet.id] });
      queryClient.invalidateQueries({ queryKey: ['timesheet-list-query'] });
      queryClient.invalidateQueries({ queryKey: ['timesheet'] });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });

      // Force refetch the current timesheet data
      await queryClient.refetchQueries({ queryKey: ['timesheet-detail-query', timesheet.id] });

      toast.success(response?.message ?? 'Timesheet updated successfully.');

      // No need to refresh - data is already updated via query invalidation
    } catch (error: any) {
      const fullName = `${currentEntry.worker_first_name} ${currentEntry.worker_last_name}`.trim();

      // Enhanced error logging
      console.error('🔍 Timesheet Update Error Details:', {
        error,
        errorType: typeof error,
        errorMessage: error?.message,
        errorResponse: error?.response,
        errorResponseData: error?.response?.data,
        errorResponseStatus: error?.response?.status,
        errorResponseStatusText: error?.response?.statusText,
        errorStack: error?.stack,
        fullError: JSON.stringify(error, null, 2),
      });

      // Show more specific error message from backend if available
      let errorMessage = 'Unknown error occurred';

      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.status) {
        errorMessage = `HTTP ${error.response.status}: ${error.response.statusText || 'Request failed'}`;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(`Failed to update timesheet for ${fullName}: ${errorMessage}`);
    } finally {
      toast.dismiss(toastId);
      loadingSend.onFalse();
    }
  });

  // Handle worker confirmation change
  const handleWorkerConfirmation = useCallback((workerId: string, confirmed: boolean) => {
    setWorkerConfirmations((prev) => ({
      ...prev,
      [workerId]: confirmed,
    }));
  }, []);

  // Check if all workers are confirmed
  const allWorkersConfirmed = useMemo(
    () =>
      acceptedEntries.length > 0 && acceptedEntries.every((entry) => workerConfirmations[entry.id]),
    [acceptedEntries, workerConfirmations]
  );

  // Handle timesheet approval (for admins)
  const handleApproveTimesheet = useCallback(async () => {
    if (!allWorkersConfirmed) {
      toast.error("Please confirm all workers' timesheet summaries before proceeding");
      return;
    }

    const toastId = toast.loading('Approving timesheet...');
    loadingSend.onTrue();

    try {
      // Approve the timesheet with admin notes
      const approveData = {
        admin_notes: adminNotes || '',
      };

      // Submit to backend
      const endpoint = `${endpoints.timesheet.approve.replace(':id', timesheet.id)}`;

      const response = await fetcher([
        endpoint,
        {
          method: 'PUT',
          data: approveData,
        },
      ]);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['timesheet-detail-query', timesheet.id] });
      queryClient.invalidateQueries({ queryKey: ['timesheet-list-query'] });
      queryClient.invalidateQueries({ queryKey: ['timesheet'] });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });

      toast.success(response?.message ?? 'Timesheet approved successfully.');

      // Close submit dialog
      submitDialog.onFalse();

      // Redirect to timesheet list
      setTimeout(() => {
        router.push(paths.work.job.timesheet.list);
      }, 1000);
    } catch (error: any) {
      // Enhanced error logging
      console.error('🔍 Timesheet Approve Error Details:', {
        error,
        errorType: typeof error,
        errorMessage: error?.message,
        errorResponse: error?.response,
        errorResponseData: error?.response?.data,
        errorResponseStatus: error?.response?.status,
        errorResponseStatusText: error?.response?.statusText,
        errorStack: error?.stack,
        fullError: JSON.stringify(error, null, 2),
      });

      let errorMessage = 'Unknown error occurred';

      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.status) {
        errorMessage = `HTTP ${error.response.status}: ${error.response.statusText || 'Request failed'}`;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(`Failed to approve timesheet: ${errorMessage}`);
    } finally {
      toast.dismiss(toastId);
      loadingSend.onFalse();
    }
  }, [
    allWorkersConfirmed,
    timesheet.id,
    queryClient,
    router,
    loadingSend,
    submitDialog,
    adminNotes,
  ]);

  // Handle timesheet rejection confirmation
  const handleRejectConfirmation = useCallback(() => {
    rejectConfirmDialog.onTrue();
  }, [rejectConfirmDialog]);

  // Handle timesheet rejection
  const handleRejectTimesheet = useCallback(async () => {
    const toastId = toast.loading('Rejecting timesheet...');
    loadingSend.onTrue();

    try {
      // Submit rejection to backend
      const rejectData = {
        rejection_reason: rejectionReason || '',
        admin_notes: adminNotes || '',
        status: 'rejected',
      };

      // Submit to backend
      const endpoint = `${endpoints.timesheet.reject.replace(':id', timesheet.id)}`;

      const response = await fetcher([
        endpoint,
        {
          method: 'PUT',
          data: rejectData,
        },
      ]);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['timesheet-detail-query', timesheet.id] });
      queryClient.invalidateQueries({ queryKey: ['timesheet-list-query'] });
      queryClient.invalidateQueries({ queryKey: ['timesheet'] });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });

      toast.success(response?.message ?? 'Timesheet rejected successfully.');

      // Close dialogs
      rejectConfirmDialog.onFalse();
      submitDialog.onFalse();

      // Redirect to timesheet list
      setTimeout(() => {
        router.push(paths.work.job.timesheet.list);
      }, 1000);
    } catch (error: any) {
      // Enhanced error logging
      console.error('🔍 Timesheet Reject Error Details:', {
        error,
        errorType: typeof error,
        errorMessage: error?.message,
        errorResponse: error?.response,
        errorResponseData: error?.response?.data,
        errorResponseStatus: error?.response?.status,
        errorResponseStatusText: error?.response?.statusText,
        errorStack: error?.stack,
        fullError: JSON.stringify(error, null, 2),
      });

      let errorMessage = 'Unknown error occurred';

      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.status) {
        errorMessage = `HTTP ${error.response.status}: ${error.response.statusText || 'Request failed'}`;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(`Failed to reject timesheet: ${errorMessage}`);
    } finally {
      toast.dismiss(toastId);
      loadingSend.onFalse();
    }
  }, [
    timesheet.id,
    queryClient,
    router,
    loadingSend,
    submitDialog,
    rejectConfirmDialog,
    adminNotes,
    rejectionReason,
  ]);

  // Tabs
  const createRedirectPath = (currentPath: string, query: string) => {
    const queryString = new URLSearchParams({ [TAB_PARAM]: query }).toString();
    return query ? `${currentPath}?${queryString}` : currentPath;
  };

  // Loading component for Suspense fallback
  const TabLoadingFallback = () => (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" height={100} sx={{ mb: 1 }} />
      <Skeleton variant="rectangular" height={100} />
    </Box>
  );

  const handleCancel = useCallback(() => {
    router.push(paths.work.job.timesheet.list);
  }, [router]);

  // Reset form when current entry change - optimized for performance
  useEffect(() => {
    if (currentEntry) {
      // Defer heavy form operations to prevent blocking tab switch
      const timer = setTimeout(() => {
        // Batch all updates together to reduce re-renders
        const normalizedValues = normalizeFormValues(currentEntry);
        const defaultValues = {
          ...normalizedValues,
          travel_start: currentEntry.travel_start || '',
          travel_end: currentEntry.travel_end || '',
          shift_start: currentEntry.shift_start || currentEntry.original_start_time,
          shift_end: currentEntry.shift_end || currentEntry.original_end_time,
          // CRITICAL FIX: Preserve actual time values, don't fall back to empty strings
          break_start: currentEntry.break_start || '',
          break_end: currentEntry.break_end || '',
        };

        // Batch validation updates
        const validationUpdates = {
          travel_start: toDayjs(currentEntry.travel_start || currentEntry.original_start_time),
          travel_end: toDayjs(currentEntry.travel_end || currentEntry.original_start_time),
          timesheet_date: toDayjs(timesheet.timesheet_date),
          shift_start: toDayjs(defaultValues.shift_start),
          shift_end: toDayjs(defaultValues.shift_end),
          break_end: toDayjs(currentEntry.break_end || currentEntry.original_start_time),
          break_start: toDayjs(currentEntry.break_start || currentEntry.original_start_time),
        };

        // Update validation and form in one batch
        updateValidation(validationUpdates);
        reset(defaultValues);
      }, 0);

      // Cleanup timer if component unmounts or currentEntry changes
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [currentEntry, reset, timesheet.timesheet_date, updateValidation]);

  // Set initial current entry - optimized to run only when necessary
  useEffect(() => {
    if (acceptedEntries.length > 0 && !currentEntry) {
      const entry = acceptedEntries.find((en) => en.id === selectedTab) || acceptedEntries[0];
      if (entry) {
        setCurrentEntry(entry);
      }
    }
    return undefined;
  }, [acceptedEntries, selectedTab, currentEntry]);

  // Dynamic Date Change Handler
  const createDateChangeHandler = useCallback(
    (key: TimeEntryDateValidatorType) => (newValue: IDatePickerControl) => {
      if (newValue) {
        const value = newValue?.toISOString();
        setValue(key, value);
        updateValidation({ [key]: newValue });
      }
      return undefined;
    },
    [setValue, updateValidation]
  );

  // Check access before rendering
  if (hasTimesheetAccess === false) {
    return (
      <Card sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Access denied. Redirecting...
        </Typography>
      </Card>
    );
  }

  if (!acceptedEntries.length) {
    return (
      <Card sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No workers have accepted this job yet. Only workers who have accepted the job can be added
          to timesheets.
        </Typography>
      </Card>
    );
  }

  // Render reject confirmation dialog
  const renderRejectConfirmDialog = () => (
    <Dialog
      open={rejectConfirmDialog.value}
      onClose={rejectConfirmDialog.onFalse}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ pb: 2 }}>Confirm Rejection</DialogTitle>
      <DialogContent sx={{ typography: 'body2' }}>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Are you sure you want to reject this timesheet? This action cannot be undone.
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Rejection Reason"
          placeholder="Please provide a reason for rejecting this timesheet..."
          value={rejectionReason || ''}
          onChange={(e) => setRejectionReason(e.target.value)}
          sx={{ mb: 2 }}
          helperText="This reason will be visible to the timesheet manager"
          required
        />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={rejectConfirmDialog.onFalse}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleRejectTimesheet}
          disabled={loadingSend.value || !rejectionReason?.trim()}
          startIcon={<Iconify icon="solar:close-circle-bold" />}
        >
          {loadingSend.value ? 'Rejecting...' : 'Confirm Rejection'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Render submit confirmation dialog
  const renderSubmitDialog = () => (
    <Dialog fullWidth maxWidth="md" open={submitDialog.value} onClose={submitDialog.onFalse}>
      <DialogTitle sx={{ pb: 2 }}>Confirm Timesheet</DialogTitle>
      <DialogContent sx={{ typography: 'body2' }}>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Please review the timesheet details before approval. Once approved, this timesheet will be
          marked as completed.
        </Typography>

        {/* Job Information */}
        <Card sx={{ mb: 3, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Job Information
          </Typography>

          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Job Number:
              </Typography>
              <Typography variant="body2">{timesheet.job.job_number}</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Site Address:
              </Typography>
              <Typography variant="body2">{timesheet.site.display_address}</Typography>
            </Box>
          </Stack>
        </Card>

        {/* All Workers Summary */}
        <Card sx={{ mb: 3, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            All Workers Summary - Please Confirm Each Worker
          </Typography>

          <Stack spacing={2}>
            {acceptedEntries.map((entry) => (
              <Box key={entry.id} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle2">
                    {entry.worker_first_name} {entry.worker_last_name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Checkbox
                      checked={workerConfirmations[entry.id] || false}
                      onChange={(e) => handleWorkerConfirmation(entry.id, e.target.checked)}
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      Confirm
                    </Typography>
                  </Box>
                </Box>
                <Stack direction="row" spacing={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Shift:{' '}
                      {entry.shift_total_minutes
                        ? Math.round((entry.shift_total_minutes / 60) * 10) / 10
                        : 0}{' '}
                      hrs
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Break: {entry.break_total_minutes || 0} min
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Travel: {entry.total_travel_minutes || 0} min
                    </Typography>
                  </Box>
                </Stack>

                {/* Worker Notes - Display if available */}
                {entry.worker_notes && (
                  <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #e0e0e0' }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mb: 0.5 }}
                    >
                      <strong>Worker Notes:</strong>
                    </Typography>
                    <Typography variant="caption" color="text.primary" sx={{ fontStyle: 'italic' }}>
                      &ldquo;{entry.worker_notes}&rdquo;
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Stack>
        </Card>

        {/* Timesheet Manager Signature Display */}
        <Card sx={{ mb: 3, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Timesheet Manager Signature
          </Typography>

          {timesheet.signatures && timesheet.signatures.length > 0 ? (
            <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Signed by: {(timesheet.signatures as any)[0]?.signer_first_name}{' '}
                {(timesheet.signatures as any)[0]?.signer_last_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Signature captured on:{' '}
                {new Date((timesheet.signatures as any)[0]?.signed_at).toLocaleString()}
              </Typography>
              {/* Display signature image if available */}
              {(timesheet.signatures as any)[0]?.signature_data && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  {(() => {
                    try {
                      const signatureData = JSON.parse(
                        (timesheet.signatures as any)[0].signature_data
                      );
                      if (signatureData.timesheet_manager) {
                        return (
                          <img
                            src={signatureData.timesheet_manager}
                            alt="Timesheet Manager Signature"
                            style={{
                              maxWidth: '200px',
                              maxHeight: '100px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                            }}
                          />
                        );
                      }
                    } catch (e) {
                      console.error('Error parsing signature data:', e);
                    }
                    return null;
                  })()}
                </Box>
              )}
            </Box>
          ) : (
            <Box
              sx={{
                p: 2,
                border: 1,
                borderColor: 'warning.main',
                borderRadius: 1,
                bgcolor: 'warning.light',
              }}
            >
              <Typography variant="body2" color="warning.dark">
                ⚠️ No signature found - timesheet may not have been properly submitted
              </Typography>
            </Box>
          )}
        </Card>

        {/* Admin Notes */}
        <Card sx={{ mb: 3, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Admin Notes
          </Typography>

          <TextField
            label="Admin Notes"
            multiline
            rows={4}
            fullWidth
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Add any administrative notes about this timesheet approval..."
          />
        </Card>

        {/* Warning message moved outside the container */}
        {!allWorkersConfirmed && (
          <Box
            sx={{ mt: 2, p: 2, bgcolor: '#fff3cd', borderRadius: 1, border: '1px solid #ffeaa7' }}
          >
            <Typography variant="body2" color="warning.dark">
              ⚠️ Please confirm all workers timesheet summaries before proceeding
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ gap: 1 }}>
        <Button variant="outlined" color="inherit" onClick={submitDialog.onFalse}>
          Cancel
        </Button>
        <Tooltip title="" placement="top">
          <span>
            <Button
              variant="contained"
              color="error"
              onClick={handleRejectConfirmation}
              disabled={loadingSend.value}
              startIcon={<Iconify icon="solar:close-circle-bold" />}
            >
              Reject
            </Button>
          </span>
        </Tooltip>
        <Button
          variant="contained"
          color="success"
          onClick={handleApproveTimesheet}
          disabled={!allWorkersConfirmed || loadingSend.value}
          startIcon={<Iconify icon="solar:check-circle-bold" />}
        >
          {loadingSend.value ? 'Approving...' : 'Approve'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      {/* Read-only Banner */}
      {/* General info banner - hide for rejected timesheets since we have a dedicated rejection banner */}
      {isTimesheetReadOnly && timesheet.status !== 'rejected' && (
        <Card sx={{ mb: 2, p: 2, bgcolor: '#e3f2fd', border: '1px solid #bbdefb' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Iconify icon="solar:info-circle-bold" color="info.main" />
            <Typography variant="body1" color="info.dark">
              This timesheet is currently <strong>{timesheet.status}</strong> and cannot be edited.
              {timesheet.status === 'submitted' && ' It has been submitted for approval.'}
              {timesheet.status === 'approved' && ' It has been approved and completed.'}
            </Typography>
          </Box>
        </Card>
      )}

      {/* Rejected Timesheet Warning Banner */}
      {timesheet.status === 'rejected' && (
        <Card sx={{ mb: 2, p: 2, bgcolor: '#fff3cd', border: '1px solid #ffeaa7' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Iconify icon="solar:info-circle-bold" color="#000000" />
              <Typography variant="body1" color="warning.dark">
                This timesheet has been <strong>rejected</strong>. It is now read-only for review
                purposes.
              </Typography>
            </Box>

            {timesheet.rejection_reason && (
              <Box sx={{ ml: 4, pl: 2, borderLeft: '3px solid #ffc107' }}>
                <Typography variant="subtitle2" color="#637381" sx={{ mb: 1 }}>
                  <strong>Rejection Reason:</strong>
                </Typography>
                <Typography variant="body2" color="#000000">
                  {timesheet.rejection_reason}
                </Typography>
              </Box>
            )}
          </Box>
        </Card>
      )}

      <Card sx={{ mb: 2 }}>
        {/* Timesheet detail header section */}
        <TimeSheetDetailHeader
          job_number={Number(timesheet.job.job_number)}
          po_number=""
          full_address={timesheet.site.display_address}
          client_name={timesheet.client.name}
          client_logo_url={timesheet.client.logo_url}
          worker_name={
            currentEntry
              ? `${currentEntry.worker_first_name} ${currentEntry.worker_last_name}`
              : 'No worker selected'
          }
          worker_photo_url={currentEntry?.worker_photo_url}
          confirmed_by={timesheet.confirmed_by || null}
          timesheet_manager_id={timesheet.timesheet_manager_id}
          timesheet_manager={timesheet.timesheet_manager}
          current_user_id={user?.id || ''}
          job_id={timesheet.job.id}
          onTimesheetManagerChange={() => {}} // Disabled for admin edit view
          canEditTimesheetManager={false} // Always false for admin edit view
          workerOptions={[]} // No worker options needed
          disabled // Always disabled
        />
      </Card>

      <Form methods={methods} onSubmit={onSubmit}>
        {/* Allow tab navigation but disable form fields when read-only */}
        <Tabs value={selectedTab}>
          {TAB_ITEMS.map((tab) => (
            <Tab
              component={RouterLink}
              key={tab.value}
              value={tab.value}
              icon={tab.icon}
              label={tab.label}
              href={createRedirectPath(pathname, tab.value)}
              onClick={tab.onclick}
              sx={{
                py: 2,
              }}
            />
          ))}
        </Tabs>

        {/* Disable only form fields when timesheet is read-only */}
        <Box sx={{ pointerEvents: isTimesheetReadOnly ? 'none' : 'auto' }}>
          <Suspense fallback={<TabLoadingFallback />}>
            {selectedTab !== '' && currentEntry && (
              <Card sx={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                <Stack>
                  <Box sx={{ bgcolor: 'background.neutral' }}>
                    <Box sx={{ p: 3 }}>
                      <Typography
                        variant="body1"
                        sx={{ color: 'text.primary', fontSize: '1.2rem' }}
                      >
                        Time Summary
                      </Typography>
                    </Box>

                    <Stack>
                      <TimeSummaryHeader
                        hours={currentEntry?.total_travel_minutes || 0}
                        header="Travel Details"
                        details="Total Travel in minutes"
                      />

                      <Box
                        sx={{
                          p: 3,
                          gap: 2,
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 2,
                            flexDirection: { xs: 'column', sm: 'row' },
                            width: '100%',
                          }}
                        >
                          <Field.DatePicker
                            name="travel_start_date"
                            label="Travel Start Date"
                            value={currentDateValues.travel_start}
                            shouldDisableDate={(date) => {
                              if (
                                !currentEntry?.original_start_time ||
                                !currentEntry?.original_end_time
                              )
                                return false;
                              const shiftStartDate = dayjs(
                                currentEntry.original_start_time
                              ).startOf('day');
                              const shiftEndDate = dayjs(currentEntry.original_end_time).startOf(
                                'day'
                              );
                              const selectedDate = dayjs(date).startOf('day');

                              // Disable dates outside the shift range
                              return (
                                selectedDate.isBefore(shiftStartDate) ||
                                selectedDate.isAfter(shiftEndDate)
                              );
                            }}
                            onChange={(newValue) => {
                              if (newValue) {
                                // Set the date part only, keep time separate
                                const dateOnly = dayjs(newValue).startOf('day');
                                setValue('travel_start', dateOnly.toISOString());
                                // Update currentDateValues for validation
                                updateValidation({
                                  travel_start: dateOnly,
                                });
                              }
                            }}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error: !!errors.travel_start,
                                helperText:
                                  errors.travel_start?.message ||
                                  (travelStartError
                                    ? 'Travel start date should be later than timesheet date'
                                    : null),
                                size: 'small',
                              },
                            }}
                            sx={{ minWidth: { xs: '100%', sm: '150px' } }}
                          />
                          <Field.TimePicker
                            name="travel_start"
                            label="Travel Start Time"
                            onChange={(newValue) => {
                              if (newValue) {
                                // Get the existing date from the form or use the current travel start date
                                const existingTravelStart = getValues('travel_start');
                                let baseDate;

                                if (existingTravelStart && existingTravelStart !== '') {
                                  // Use existing date, only update time
                                  baseDate = dayjs(existingTravelStart);
                                } else {
                                  // If no date set, use the shift start date as base
                                  baseDate = currentEntry?.original_start_time
                                    ? dayjs(currentEntry.original_start_time)
                                    : dayjs();
                                }

                                // CRITICAL FIX: Ensure we preserve the date from currentDateValues if available
                                if (currentDateValues.travel_start && !existingTravelStart) {
                                  baseDate = currentDateValues.travel_start;
                                }

                                // Create new datetime with existing date but new time
                                const newDateTime = baseDate
                                  .hour(newValue.hour())
                                  .minute(newValue.minute())
                                  .second(0)
                                  .millisecond(0);

                                // CRITICAL FIX: Use toISOString() to properly convert to UTC for backend storage
                                setValue('travel_start', newDateTime.toISOString());

                                // Update validation
                                updateValidation({ travel_start: newDateTime });
                              }
                            }}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error: !!errors.travel_start,
                                size: 'small',
                                placeholder: 'Select Travel Start Time',
                              },
                            }}
                            sx={{ minWidth: { xs: '100%', sm: '150px' } }}
                          />

                          <Field.DatePicker
                            name="travel_end_date"
                            label="Travel End Date"
                            value={currentDateValues.travel_end}
                            shouldDisableDate={(date) => {
                              if (
                                !currentEntry?.original_start_time ||
                                !currentEntry?.original_end_time
                              )
                                return false;
                              const shiftStartDate = dayjs(
                                currentEntry.original_start_time
                              ).startOf('day');
                              const shiftEndDate = dayjs(currentEntry.original_end_time).startOf(
                                'day'
                              );
                              const selectedDate = dayjs(date).startOf('day');

                              // Disable dates outside the shift range
                              return (
                                selectedDate.isBefore(shiftStartDate) ||
                                selectedDate.isAfter(shiftEndDate)
                              );
                            }}
                            onChange={(newValue) => {
                              if (newValue) {
                                // Set the date part only, keep time separate
                                const dateOnly = dayjs(newValue).startOf('day');
                                setValue('travel_end', dateOnly.toISOString());
                                // Update currentDateValues for validation
                                updateValidation({
                                  travel_end: dateOnly,
                                });
                              }
                            }}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error: !!errors.travel_end,
                                size: 'small',
                              },
                            }}
                            sx={{ minWidth: { xs: '100%', sm: '150px' } }}
                          />
                          <Field.TimePicker
                            name="travel_end"
                            label="Travel End Time"
                            onChange={(newValue) => {
                              if (newValue) {
                                // Get the existing date from the form or use the current travel end date
                                const existingTravelEnd = getValues('travel_end');
                                let baseDate;

                                if (existingTravelEnd && existingTravelEnd !== '') {
                                  // Use existing date, only update time
                                  baseDate = dayjs(existingTravelEnd);
                                } else {
                                  // If no date set, use the shift start date as base
                                  baseDate = currentEntry?.original_start_time
                                    ? dayjs(currentEntry.original_start_time)
                                    : dayjs();
                                }

                                // CRITICAL FIX: Ensure we preserve the date from currentDateValues if available
                                if (currentDateValues.travel_end && !existingTravelEnd) {
                                  baseDate = currentDateValues.travel_end;
                                }

                                // Create new datetime with existing date but new time
                                const finalDateTime = baseDate
                                  .hour(newValue.hour())
                                  .minute(newValue.minute())
                                  .second(0)
                                  .millisecond(0);

                                // CRITICAL FIX: Use toISOString() to properly convert to UTC for backend storage
                                setValue('travel_end', finalDateTime.toISOString());

                                // CRITICAL FIX: Force update the currentDateValues immediately
                                setTimeout(() => {
                                  updateValidation({ travel_end: finalDateTime });
                                }, 0);

                                // CRITICAL FIX: Update validation with the final date/time that was actually stored
                                updateValidation({ travel_end: finalDateTime });
                              }
                            }}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error: !!errors.travel_end || travelEndError,
                                helperText:
                                  errors.travel_end?.message ||
                                  (travelEndError
                                    ? 'Travel end time should be later than travel start time'
                                    : null),
                                size: 'small',
                                placeholder: 'Select Travel End Time',
                              },
                            }}
                            sx={{ minWidth: { xs: '100%', sm: '150px' } }}
                          />
                        </Box>
                      </Box>

                      <TimeSummaryHeader
                        header="Work Distance"
                        hours={currentEntry?.total_travel_km}
                        details="Total Work Distance in km"
                      />
                      {/* Travel Distance Fields - Inline between Travel and Shift Details */}
                      <Box sx={{ p: 3, bgcolor: 'background.neutral' }}>
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 2,
                            flexDirection: { xs: 'column', sm: 'row' },
                          }}
                        >
                          <Field.Text
                            name="travel_to_km"
                            label="Travel To (km)"
                            type="number"
                            inputProps={{ min: 0, step: 0.1 }}
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={{ flex: 1 }}
                            size="small"
                          />
                          <Field.Text
                            name="travel_from_km"
                            label="Travel From (km)"
                            type="number"
                            inputProps={{ min: 0, step: 0.1 }}
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={{ flex: 1 }}
                            size="small"
                          />
                          <Field.Text
                            name="travel_during_km"
                            label="Travel During (km)"
                            type="number"
                            inputProps={{ min: 0, step: 0.1 }}
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={{ flex: 1 }}
                            size="small"
                          />
                        </Box>
                      </Box>

                      <TimeSummaryHeader
                        hours={
                          currentEntry?.shift_total_minutes
                            ? Math.round((currentEntry.shift_total_minutes / 60) * 10) / 10
                            : 0
                        }
                        header="Shift Details"
                        details="Total Shift Duration in hours"
                        break_hours={currentEntry?.break_total_minutes || 0}
                      />
                      <Box
                        sx={{
                          p: 3,
                          gap: 2,
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                        }}
                      >
                        {/* Shift Start */}
                        <Field.MobileDateTimePicker
                          name="shift_start"
                          label="Shift Start Date/Time"
                          onChange={createDateChangeHandler('shift_start')}
                          value={currentDateValues.shift_start}
                          format="DD/MM/YYYY h:mm a"
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: !!errors.shift_start,
                              helperText:
                                errors.shift_start?.message ||
                                (shiftStartError
                                  ? 'Shift start time should be later than timesheet date'
                                  : null),
                              placeholder: 'Shift Start Date/Time',
                              size: 'small',
                            },
                          }}
                          sx={{ minWidth: { xs: '100%', sm: '150px' } }}
                        />

                        {/* Break Start Date */}
                        <Field.DatePicker
                          name="break_start_date"
                          label="Break Start Date"
                          value={currentDateValues.break_start}
                          shouldDisableDate={(date) => {
                            if (
                              !currentEntry?.original_start_time ||
                              !currentEntry?.original_end_time
                            )
                              return false;
                            const shiftStartDate = dayjs(currentEntry.original_start_time).startOf(
                              'day'
                            );
                            const shiftEndDate = dayjs(currentEntry.original_end_time).startOf(
                              'day'
                            );
                            const selectedDate = dayjs(date).startOf('day');

                            // Disable dates outside the shift range
                            return (
                              selectedDate.isBefore(shiftStartDate) ||
                              selectedDate.isAfter(shiftEndDate)
                            );
                          }}
                          onChange={(newValue) => {
                            if (newValue) {
                              // Set the date part only, keep time separate
                              // CRITICAL FIX: Use toISOString() to properly convert to UTC
                              const dateOnly = dayjs(newValue).startOf('day');
                              setValue('break_start', dateOnly.toISOString());
                              // CRITICAL FIX: Validate that break start date is not after break end date
                              const existingBreakEnd = getValues('break_end');
                              if (existingBreakEnd) {
                                const breakEndDate = dayjs(existingBreakEnd);
                                if (dateOnly.startOf('day').isAfter(breakEndDate.startOf('day'))) {
                                  // You could add a toast error here if you want to block it
                                }
                              }

                              // Update currentDateValues for validation
                              updateValidation({
                                break_start: dateOnly,
                              });
                            }
                          }}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: !!errors.break_start || !!breakStartDateError,
                              helperText:
                                errors.break_start?.message ||
                                (breakStartDateError
                                  ? 'Break start date cannot be earlier than job start date'
                                  : null),
                              size: 'small',
                            },
                          }}
                          sx={{ minWidth: { xs: '100%', sm: '150px' } }}
                        />

                        {/* Break Start Time */}
                        <Field.TimePicker
                          name="break_start"
                          label="Break Start Time"
                          shouldDisableTime={(timeValue, type) => {
                            // Prevent selecting break start time before shift start time
                            if (type === 'hours' && currentEntry?.original_start_time) {
                              const shiftStartHour = dayjs(currentEntry.original_start_time).hour();
                              const shouldDisable = timeValue.hour() < shiftStartHour;

                              return shouldDisable;
                            }
                            return false;
                          }}
                          onChange={(newValue) => {
                            if (newValue) {
                              // Get the existing date from the form or use the current break start date
                              const existingBreakStart = getValues('break_start');
                              let baseDate;

                              if (existingBreakStart && existingBreakStart !== '') {
                                // Use existing date, only update time
                                baseDate = dayjs(existingBreakStart);
                              } else {
                                // If no date set, use the shift start date as base
                                baseDate = currentEntry?.original_start_time
                                  ? dayjs(currentEntry.original_start_time)
                                  : dayjs();
                              }

                              // CRITICAL FIX: Ensure we preserve the date from currentDateValues if available
                              if (currentDateValues.break_start && !existingBreakStart) {
                                baseDate = currentDateValues.break_start;
                              }

                              // Create new datetime with existing date but new time
                              // CRITICAL FIX: Use local time, not UTC conversion
                              const newDateTime = baseDate
                                .hour(newValue.hour())
                                .minute(newValue.minute())
                                .second(0)
                                .millisecond(0);

                              // CRITICAL FIX: Use toISOString() to properly convert to UTC for backend storage
                              setValue('break_start', newDateTime.toISOString());

                              // CRITICAL FIX: Validate that break start date is not after break end date
                              const existingBreakEnd = getValues('break_end');
                              if (existingBreakEnd) {
                                const breakEndDate = dayjs(existingBreakEnd);
                                if (
                                  newDateTime.startOf('day').isAfter(breakEndDate.startOf('day'))
                                ) {
                                  // You could add a toast error here if you want to block it
                                }
                              }

                              // Update currentDateValues for validation
                              updateValidation({
                                break_start: newDateTime,
                              });
                            }
                          }}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error:
                                !!errors.break_start ||
                                !!breakStartTimeError ||
                                !!breakStartTimeRangeError ||
                                !!breakStartTimeAfterShiftEndError,
                              helperText:
                                breakStartTimeError ||
                                breakStartTimeRangeError ||
                                breakStartTimeAfterShiftEndError
                                  ? breakStartTimeRangeError
                                    ? 'Break start time cannot be earlier than shift start time'
                                    : breakStartTimeAfterShiftEndError
                                      ? 'Break start time cannot be later than shift end time'
                                      : 'Break start time cannot be earlier than job start time'
                                  : null,
                              size: 'small',
                              placeholder: 'Select Break Start Time',
                            },
                          }}
                          sx={{ minWidth: { xs: '100%', sm: '150px' } }}
                        />

                        {/* Break End Date */}
                        <Field.DatePicker
                          name="break_end_date"
                          label="Break End Date"
                          value={currentDateValues.break_end}
                          shouldDisableDate={(date) => {
                            if (
                              !currentEntry?.original_start_time ||
                              !currentEntry?.original_end_time
                            )
                              return false;
                            const shiftStartDate = dayjs(currentEntry.original_start_time).startOf(
                              'day'
                            );
                            const shiftEndDate = dayjs(currentEntry.original_end_time).startOf(
                              'day'
                            );
                            const selectedDate = dayjs(date).startOf('day');

                            // Disable dates outside the shift range
                            return (
                              selectedDate.isBefore(shiftStartDate) ||
                              selectedDate.isAfter(shiftEndDate)
                            );
                          }}
                          onChange={(newValue) => {
                            if (newValue) {
                              // Set the date part only, keep time separate
                              // CRITICAL FIX: Use toISOString() to properly convert to UTC
                              const dateOnly = dayjs(newValue).startOf('day');
                              setValue('break_end', dateOnly.toISOString());
                              // CRITICAL FIX: Validate that break end date is not before break start date
                              const existingBreakStart = getValues('break_start');
                              if (existingBreakStart) {
                                const breakStartDate = dayjs(existingBreakStart);
                                if (
                                  dateOnly.startOf('day').isBefore(breakStartDate.startOf('day'))
                                ) {
                                  // You could add a toast error here if you want to block it
                                }
                              }

                              // Update currentDateValues for validation
                              updateValidation({
                                break_end: dateOnly,
                              });
                            }
                          }}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error:
                                !!errors.break_end ||
                                !!breakEndDateError ||
                                !!breakEndDateBeforeBreakStartDateError,
                              helperText:
                                errors.break_end?.message ||
                                (breakEndDateError
                                  ? 'Break end date cannot be later than job end date'
                                  : breakEndDateBeforeBreakStartDateError
                                    ? 'Break end date cannot be before break start date'
                                    : null),
                              size: 'small',
                            },
                          }}
                          sx={{ minWidth: { xs: '100%', sm: '150px' } }}
                        />

                        {/* Break End Time */}
                        <Field.TimePicker
                          name="break_end"
                          label="Break End Time"
                          shouldDisableTime={(timeValue, type) => {
                            // Prevent selecting break end time after shift end time
                            if (type === 'hours' && currentEntry?.original_end_time) {
                              const shiftEndHour = dayjs(currentEntry.original_end_time).hour();
                              const shouldDisable = timeValue.hour() > shiftEndHour;

                              if (shouldDisable) return true;
                            }

                            // CRITICAL FIX: Prevent selecting break end time before break start time
                            if (type === 'hours' && currentDateValues.break_start) {
                              const breakStartHour = dayjs(currentDateValues.break_start).hour();
                              const shouldDisable = timeValue.hour() < breakStartHour;

                              if (shouldDisable) return true;
                            }

                            return false;
                          }}
                          onChange={(newValue) => {
                            if (newValue) {
                              // CRITICAL FIX: Always preserve the existing break end date, never change it
                              const existingBreakEnd = getValues('break_end');
                              let baseDate;

                              if (existingBreakEnd && existingBreakEnd !== '') {
                                // Use existing date, only update time
                                baseDate = dayjs(existingBreakEnd);
                              } else if (currentDateValues.break_end) {
                                // Use the date from currentDateValues if no form value
                                baseDate = currentDateValues.break_end;
                              } else {
                                // CRITICAL FIX: If no break end date is set, DO NOT set a default date
                                // This prevents the date from changing when only time is selected

                                return; // Exit early, don't change anything
                              }

                              // Create new datetime with existing date but new time
                              // CRITICAL FIX: Use local time, not UTC conversion
                              const newDateTime = baseDate
                                .hour(newValue.hour())
                                .minute(newValue.minute())
                                .second(0)
                                .millisecond(0);

                              // CRITICAL FIX: Use toISOString() to properly convert to UTC for backend storage
                              setValue('break_end', newDateTime.toISOString());

                              // CRITICAL FIX: Additional validation to prevent invalid times
                              if (currentEntry?.original_end_time) {
                                const shiftEndTime = dayjs(currentEntry.original_end_time);
                                if (newDateTime.isAfter(shiftEndTime)) {
                                  // You could add a toast error here if you want to block it
                                }
                              }

                              // CRITICAL FIX: Validate that break end date is not before break start date
                              const existingBreakStart = getValues('break_start');
                              if (existingBreakStart) {
                                const breakStartDate = dayjs(existingBreakStart);
                                if (
                                  newDateTime.startOf('day').isBefore(breakStartDate.startOf('day'))
                                ) {
                                  // You could add a toast error here if you want to block it
                                }
                              }

                              // Update currentDateValues for validation
                              updateValidation({
                                break_end: newDateTime,
                              });
                            }
                          }}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error:
                                !!errors.break_end ||
                                !!breakEndTimeError ||
                                !!breakEndTimeRangeError ||
                                !!breakEndBeforeBreakStartError ||
                                !!breakEndTimeBeforeBreakStartTimeError,
                              helperText:
                                breakEndTimeError ||
                                breakEndTimeRangeError ||
                                breakEndBeforeBreakStartError ||
                                breakEndTimeBeforeBreakStartTimeError
                                  ? breakEndTimeRangeError
                                    ? 'Break end time cannot be later than shift end time'
                                    : breakEndBeforeBreakStartError
                                      ? 'Break end time cannot be before break start time'
                                      : breakEndTimeBeforeBreakStartTimeError
                                        ? 'Break end time cannot be before break start time'
                                        : 'Break end time cannot be later than job end time'
                                  : null,
                              size: 'small',
                              placeholder: 'Select Break End Time',
                            },
                          }}
                          sx={{ minWidth: { xs: '100%', sm: '150px' } }}
                        />

                        {/* Shift End */}
                        <Field.MobileDateTimePicker
                          name="shift_end"
                          label="Shift End Date/Time"
                          onChange={createDateChangeHandler('shift_end')}
                          value={currentDateValues.shift_end}
                          format="DD/MM/YYYY h:mm a"
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: !!errors.shift_end,
                              helperText:
                                errors.shift_end?.message ||
                                (shiftEndError
                                  ? 'Shift end time should be later than shift start time'
                                  : null),
                              placeholder: 'Shift End Date/Time',
                              size: 'small',
                            },
                          }}
                          sx={{ minWidth: { xs: '100%', sm: '150px' } }}
                        />
                      </Box>
                    </Stack>
                  </Box>
                </Stack>

                {/* Worker Notes - Below travel distance fields */}
                <Box sx={{ p: 3 }}>
                  <Field.Text
                    name="worker_notes"
                    label="Worker Notes"
                    multiline
                    rows={4}
                    fullWidth
                  />
                </Box>
              </Card>
            )}
          </Suspense>
        </Box>

        <Box
          sx={{
            mt: 3,
            gap: 2,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button variant="outlined" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant="contained"
            type="submit"
            loading={loadingSend.value && isSubmitting}
            disabled={!isValid || hasValidationErrors || isTimesheetReadOnly}
          >
            {isSubmitting
              ? 'Updating...'
              : timesheet.status === 'rejected' || timesheet.status === 'approved'
                ? 'View Only'
                : 'Update Timesheet'}
          </Button>
          {timesheet.status !== 'rejected' && timesheet.status !== 'approved' && (
            <Button
              variant="contained"
              onClick={submitDialog.onTrue}
              color="success"
              startIcon={<Iconify icon="solar:check-circle-bold" />}
              disabled={isTimesheetReadOnly}
            >
              Confirm
            </Button>
          )}
        </Box>
      </Form>

      {renderRejectConfirmDialog()}
      {timesheet.status !== 'rejected' && timesheet.status !== 'approved' && renderSubmitDialog()}
    </>
  );
}
