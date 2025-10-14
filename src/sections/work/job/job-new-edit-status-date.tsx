import type { IWorkerWarningDialog } from 'src/types/preference';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useFormContext } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';

import { fetcher, endpoints } from 'src/lib/axios';

import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { WorkerWarningDialog } from 'src/components/preference/worker-warning-dialog';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// ----------------------------------------------------------------------

export function JobNewEditStatusDate() {
  const { watch, setValue, getValues, trigger } = useFormContext();
  const startTime = watch('start_date_time');
  const endTime = watch('end_date_time');
  const clientType = watch('client_type');

  // Watch timesheet manager for controlled value
  const selectedTimesheetManager = watch('timesheet_manager_id');
  
  // Get workers data directly from form - watch for real-time updates
  const workersRaw = watch('workers');
  const workers = useMemo(() => workersRaw || [], [workersRaw]);

  // Calculate valid workers for timesheet manager selection
  const getValidWorkersForOptions = (workersList: any[]) => workersList.filter((worker: any) => 
      // Must have all fields populated for display in options
       (
        worker?.id &&
        worker.id.trim() !== '' &&
        worker?.position &&
        worker.position.trim() !== '' &&
        worker?.first_name &&
        worker.first_name.trim() !== '' &&
        worker?.last_name &&
        worker.last_name.trim() !== ''
      )
    );

  const getValidWorkersForEnabling = (workersList: any[]) => workersList.filter((worker: any) => 
      // Minimal check - just need position and employee selected
       (
        worker?.id &&
        worker.id.trim() !== '' &&
        worker?.position &&
        worker.position.trim() !== ''
      )
    );

  const timesheetManagerOptions = getValidWorkersForOptions(workers).map((worker: any) => ({
    value: worker.id,
    label: `${worker.first_name} ${worker.last_name}`,
    photo_url: worker.photo_url || '',
    first_name: worker.first_name,
    last_name: worker.last_name,
  }));

  const isTimesheetManagerDisabled = getValidWorkersForEnabling(workers).length === 0;

  const timesheetManagerValue = useMemo(() => {
    if (!selectedTimesheetManager) return null;

    const selectedWorker = workers.find((worker: any) => worker?.id === selectedTimesheetManager);
    if (!selectedWorker) return null;

    return {
      value: selectedWorker.id,
      label: `${selectedWorker.first_name} ${selectedWorker.last_name}`,
      photo_url: selectedWorker.photo_url || '',
      first_name: selectedWorker.first_name,
      last_name: selectedWorker.last_name,
    };
  }, [workers, selectedTimesheetManager]);

  // Clear timesheet manager when workers change and selection is no longer valid
  useEffect(() => {
    if (selectedTimesheetManager && selectedTimesheetManager !== '') {
      const validWorkers = getValidWorkersForOptions(workers);

      // Only clear if we have valid workers but the selection is not among them
      if (validWorkers.length > 0) {
        const isSelectionValid = validWorkers.some(
          (worker: any) => worker.id === selectedTimesheetManager
        );

        if (!isSelectionValid) {
          setValue('timesheet_manager_id', '');
        }
      }
    }
  }, [workers, selectedTimesheetManager, setValue]);

  const [shiftHour, setShiftHour] = useState<number | string>('');
  const [hasManuallyChangedEndDate, setHasManuallyChangedEndDate] = useState(false);
  const [prevStartTime, setPrevStartTime] = useState<string | null>(null);
  const [workerWarning, setWorkerWarning] = useState<IWorkerWarningDialog>({
    open: false,
    employee: { name: '', id: '' },
    warningType: 'time_off_conflict',
    reasons: [],
    isMandatory: true,
    canProceed: false,
  });
  const [pendingDateChange, setPendingDateChange] = useState<{
    startDate: string;
    endDate: string;
  } | null>(null);
  const [isProcessingDateChange, setIsProcessingDateChange] = useState(false);

  // Fetch time-off requests for conflict checking
  const { data: timeOffRequests = [], isLoading: timeOffLoading } = useQuery({
    queryKey: ['time-off-conflicts-for-date-change', startTime, endTime],
    queryFn: async () => {
      if (!startTime || !endTime) return [];

      const startDate = dayjs(startTime).format('YYYY-MM-DD');
      const endDate = dayjs(endTime).format('YYYY-MM-DD');

      const response = await fetcher(
        `/api/time-off/admin/all?start_date=${startDate}&end_date=${endDate}`
      );
      return response.data?.timeOffRequests || [];
    },
    enabled: !!startTime && !!endTime,
  });

  // Fetch worker schedules for conflict checking
  const { data: workerSchedules = { scheduledWorkers: [] }, isLoading: scheduleLoading } = useQuery(
    {
      queryKey: ['worker-schedules-for-date-change', startTime, endTime],
      queryFn: async () => {
        if (!startTime || !endTime) return { scheduledWorkers: [] };

        const startISO = dayjs(startTime).toISOString();
        const endISO = dayjs(endTime).toISOString();
        const url = `${endpoints.work.job}/check-availability?start_time=${encodeURIComponent(startISO)}&end_time=${encodeURIComponent(endISO)}`;

        const response = await fetcher(url);
        return {
          scheduledWorkers: response?.scheduledWorkers || [],
          success: response?.success || false,
        };
      },
      enabled: !!startTime && !!endTime,
    }
  );

  // Check for conflicts when dates change
  const checkDateChangeConflicts = useCallback(
    (newStartDate: string, newEndDate: string) => {
      const assignedWorkers = workers.filter((w: any) => w.id && w.id !== '');

      if (assignedWorkers.length === 0) {
        return [];
      }

      const conflictingWorkers: any[] = [];

      // Check time-off conflicts
      (Array.isArray(timeOffRequests) ? timeOffRequests : []).forEach((request: any) => {
        if (!['pending', 'approved'].includes(request.status)) {
          return;
        }

        const assignedWorker = assignedWorkers.find((w: any) => w.id === request.user_id);
        if (!assignedWorker) {
          return;
        }

        const jobStartDate = dayjs(newStartDate);
        const jobEndDate = dayjs(newEndDate);
        const timeOffStartDate = dayjs(request.start_date);
        const timeOffEndDate = dayjs(request.end_date);

        // Check for date overlap
        // For time-off requests, if start_date and end_date are the same, it's a single-day request
        // that should conflict with any job on that day
        const isSingleDayTimeOff = timeOffStartDate.isSame(timeOffEndDate, 'day');

        let hasOverlap = false;

        if (isSingleDayTimeOff) {
          // Single day time-off conflicts with any job on the same day
          hasOverlap =
            jobStartDate.isSame(timeOffStartDate, 'day') ||
            jobEndDate.isSame(timeOffStartDate, 'day');
        } else {
          // Multi-day time-off - check for date range overlap
          hasOverlap =
            (timeOffStartDate.isSameOrBefore(jobStartDate) &&
              timeOffEndDate.isSameOrAfter(jobStartDate)) ||
            (timeOffStartDate.isSameOrBefore(jobEndDate) &&
              timeOffEndDate.isSameOrAfter(jobEndDate)) ||
            (timeOffStartDate.isSameOrAfter(jobStartDate) &&
              timeOffEndDate.isSameOrBefore(jobEndDate));
        }

        if (hasOverlap) {
          const formattedType = request.type
            .split('_')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          const startDate = dayjs(request.start_date);
          const endDate = dayjs(request.end_date);
          const isSameDay = startDate.isSame(endDate, 'day');

          const dateRange = isSameDay
            ? `at ${startDate.format('MMM D, YYYY')}`
            : `from ${startDate.format('MMM D, YYYY')} to ${endDate.format('MMM D, YYYY')}`;

          const conflict = {
            id: assignedWorker.id,
            name: `${assignedWorker.first_name} ${assignedWorker.last_name}`,
            conflictType: 'time_off' as const,
            conflictDetails: `${formattedType} [${request.status}]: ${request.reason} ${dateRange}`,
          };

          conflictingWorkers.push(conflict);
        }
      });

      // Check schedule conflicts
      workerSchedules.scheduledWorkers.forEach((scheduledWorker: any) => {
        const assignedWorker = assignedWorkers.find((w: any) => w.id === scheduledWorker.user_id);
        if (!assignedWorker) {
          return;
        }

        const conflict = {
          id: assignedWorker.id,
          name: `${assignedWorker.first_name} ${assignedWorker.last_name}`,
          conflictType: 'schedule_conflict' as const,
          conflictDetails: `Already scheduled for Job #${scheduledWorker.job_number} from ${dayjs(scheduledWorker.start_time).format('MMM D, h:mm A')} to ${dayjs(scheduledWorker.end_time).format('MMM D, h:mm A')}`,
        };

        conflictingWorkers.push(conflict);
      });

      return conflictingWorkers;
    },
    [workers, timeOffRequests, workerSchedules]
  );

  // Handle date change with conflict checking
  const handleDateChange = useCallback(
    (newStartDate: string, newEndDate: string) => {
      // Set flag immediately to prevent worker components from showing their dialogs
      setIsProcessingDateChange(true);

      // Wait for data to load before checking conflicts
      if (timeOffLoading || scheduleLoading) {
        // Still proceed with date change for now, conflicts will be checked when data loads
        setValue('start_date_time', newStartDate);
        setValue('end_date_time', newEndDate);
        // Set pending change so useEffect can check conflicts when data loads
        setPendingDateChange({ startDate: newStartDate, endDate: newEndDate });
        return;
      }

      const conflicts = checkDateChangeConflicts(newStartDate, newEndDate);

      if (conflicts.length > 0) {
        // Format conflicts for WorkerWarningDialog
        const timeOffConflicts = conflicts.filter((c) => c.conflictType === 'time_off');
        const scheduleConflicts = conflicts.filter((c) => c.conflictType === 'schedule');

        // Group conflicts by worker for better display
        const groupedConflicts = conflicts.reduce((groups: any, conflict) => {
          const workerName = conflict.name;
          if (!groups[workerName]) {
            groups[workerName] = [];
          }
          groups[workerName].push(conflict);
          return groups;
        }, {});

        // Create formatted reasons showing each worker and their specific conflicts
        const workerConflictReasons: string[] = [];
        Object.entries(groupedConflicts).forEach(([workerName, workerConflicts]: [string, any]) => {
          const conflictDetails = workerConflicts.map((c: any) => c.conflictDetails).join('\n• ');
          workerConflictReasons.push(`\n${workerName}:\n• ${conflictDetails}`);
        });

        // Create summary message
        const conflictSummary = `${conflicts.length} worker(s) have conflicts with the new date range:`;
        const allReasons = [conflictSummary, ...workerConflictReasons];

        setWorkerWarning({
          open: true,
          employee: {
            name: conflicts.length === 1 ? conflicts[0].name : `${conflicts.length} Workers`,
            id: conflicts[0].id, // Use first conflict ID as reference
          },
          warningType:
            conflicts.length === 1
              ? timeOffConflicts.length > 0
                ? 'time_off_conflict'
                : 'schedule_conflict'
              : timeOffConflicts.length > 0 && scheduleConflicts.length > 0
                ? 'time_off_conflict' // Mixed conflicts, use time_off_conflict for display
                : timeOffConflicts.length > 0
                  ? 'time_off_conflict'
                  : 'schedule_conflict',
          reasons: allReasons,
          isMandatory: true,
          canProceed: false,
        });
        setPendingDateChange({ startDate: newStartDate, endDate: newEndDate });
      } else {
        // No conflicts, proceed with date change
        setValue('start_date_time', newStartDate);
        setValue('end_date_time', newEndDate);
        // Clear the flag since no conflicts were found
        setIsProcessingDateChange(false);
      }
    },
    [checkDateChangeConflicts, setValue, timeOffLoading, scheduleLoading]
  );

  // Handle conflict dialog confirmation
  const handleConflictConfirm = useCallback(() => {
    if (pendingDateChange) {
      const { startDate, endDate } = pendingDateChange;

      // Get all conflicting worker IDs from the last check
      const conflicts = checkDateChangeConflicts(startDate, endDate);
      const conflictingWorkerIds = conflicts.map((c) => c.id);

      // Only clear workers that have conflicts, preserve others
      const updatedWorkers = workers.map((worker: any) => {
        if (conflictingWorkerIds.includes(worker.id)) {
          // Clear this worker as it has a conflict
          return {
            ...worker,
            id: '',
            first_name: '',
            last_name: '',
            photo_url: '',
            email: '',
            phone_number: '',
            status: 'draft',
          };
        }
        // Keep worker as is if no conflict
        return worker;
      });

      setValue('workers', updatedWorkers);
      setValue('start_date_time', startDate);
      setValue('end_date_time', endDate);
    }

    setWorkerWarning((prev) => ({ ...prev, open: false }));
    setPendingDateChange(null);
    setIsProcessingDateChange(false);
  }, [pendingDateChange, workers, setValue, checkDateChangeConflicts]);

  const handleConflictCancel = useCallback(() => {
    setWorkerWarning((prev) => ({ ...prev, open: false }));
    setPendingDateChange(null);
    setIsProcessingDateChange(false);
  }, []);

  // Add flag to form context for other components to check
  useEffect(() => {
    setValue('isProcessingDateChange', isProcessingDateChange);
  }, [isProcessingDateChange, setValue]);

  // Check for conflicts after data loads (for date changes that happened while data was loading)
  // This handles the case where user changes dates but timeOff/schedule data is still loading
  useEffect(() => {
    // Only run when data has finished loading and we have dates
    if (timeOffLoading || scheduleLoading || !startTime || !endTime) {
      return;
    }

    // Skip if there's already a dialog open to avoid double dialogs
    if (workerWarning.open) {
      return;
    }

    // Only check if we have a pending date change (from handleDateChange when data was loading)
    if (!pendingDateChange) {
      return;
    }

    // Check if the current dates match the pending change
    if (pendingDateChange.startDate !== startTime || pendingDateChange.endDate !== endTime) {
      return;
    }

    const conflicts = checkDateChangeConflicts(startTime, endTime);

    if (conflicts.length > 0) {
      // Format conflicts for WorkerWarningDialog (same logic as handleDateChange)
      const timeOffConflicts = conflicts.filter((c) => c.conflictType === 'time_off');
      const scheduleConflicts = conflicts.filter((c) => c.conflictType === 'schedule_conflict');

      // Group conflicts by worker for better display
      const groupedConflicts = conflicts.reduce((groups: any, conflict) => {
        const workerName = conflict.name;
        if (!groups[workerName]) {
          groups[workerName] = [];
        }
        groups[workerName].push(conflict);
        return groups;
      }, {});

      // Create formatted reasons showing each worker and their specific conflicts
      const workerConflictReasons: string[] = [];
      Object.entries(groupedConflicts).forEach(([workerName, workerConflicts]: [string, any]) => {
        const conflictDetails = workerConflicts.map((c: any) => c.conflictDetails).join('\n• ');
        workerConflictReasons.push(`\n${workerName}:\n• ${conflictDetails}`);
      });

      // Create summary message
      const conflictSummary = `${conflicts.length} worker(s) have conflicts with the new date range:`;
      const allReasons = [conflictSummary, ...workerConflictReasons];

      setWorkerWarning({
        open: true,
        employee: {
          name: conflicts.length === 1 ? conflicts[0].name : `${conflicts.length} Workers`,
          id: conflicts[0].id,
        },
        warningType:
          conflicts.length === 1
            ? timeOffConflicts.length > 0
              ? 'time_off_conflict'
              : 'schedule_conflict'
            : timeOffConflicts.length > 0 && scheduleConflicts.length > 0
              ? 'time_off_conflict'
              : timeOffConflicts.length > 0
                ? 'time_off_conflict'
                : 'schedule_conflict',
        reasons: allReasons,
        isMandatory: true,
        canProceed: false,
      });
    }

    // Always clear the pending change and processing flag after handling (whether conflicts found or not)
    setPendingDateChange(null);
    setIsProcessingDateChange(false);
  }, [
    timeOffLoading,
    scheduleLoading,
    startTime,
    endTime,
    pendingDateChange,
    checkDateChangeConflicts,
    workerWarning.open,
  ]);

  // ✅ Set default start_time and end_time only if they don't exist
  useEffect(() => {
    const currentStartTime = getValues('start_date_time');

    if (!currentStartTime) {
      const startAt8AM = dayjs()
        .add(1, 'day')
        .hour(8)
        .minute(0)
        .second(0)
        .millisecond(0)
        .toISOString();
      setValue('start_date_time', startAt8AM);
      setValue('end_date_time', dayjs(startAt8AM).add(8, 'hour').toISOString());
    }
  }, [getValues, setValue]);

  // Auto-sync end date when start date changes (keep same time) - but only if user hasn't manually changed end date
  // AND only if this is an actual user change (not form reset)
  useEffect(() => {
    if (
      startTime &&
      endTime &&
      !hasManuallyChangedEndDate &&
      prevStartTime &&
      prevStartTime !== startTime
    ) {
      const start = dayjs(startTime);
      const end = dayjs(endTime);
      const prevStart = dayjs(prevStartTime);

      // Check if the date part changed (not the time)
      const startDate = start.format('YYYY-MM-DD');
      const endDate = end.format('YYYY-MM-DD');
      const prevStartDate = prevStart.format('YYYY-MM-DD');
      const endTimeOnly = end.format('HH:mm:ss');

      // Only sync if the start date actually changed from the previous value
      if (startDate !== prevStartDate && startDate !== endDate) {
        // Keep the same end time but change the date to match start date
        const newEndDateTime = dayjs(startDate + ' ' + endTimeOnly);
        handleDateChange(startTime, newEndDateTime.toISOString());
      }

      // Check if the time part changed (not the date)
      const startTimeOnly = start.format('HH:mm:ss');
      const prevStartTimeOnly = prevStart.format('HH:mm:ss');
      const startDateOnly = start.format('YYYY-MM-DD');
      const prevStartDateOnly = prevStart.format('YYYY-MM-DD');

      // If only the time changed (same date), maintain the same duration
      if (startDateOnly === prevStartDateOnly && startTimeOnly !== prevStartTimeOnly) {
        const duration = end.diff(prevStart, 'millisecond');
        const newEndDateTime = start.add(duration, 'millisecond');
        handleDateChange(startTime, newEndDateTime.toISOString());
      }
    }
  }, [startTime, endTime, setValue, hasManuallyChangedEndDate, prevStartTime, handleDateChange]);

  // Only set end_time to 8 hours after start_time if end_time is not set yet
  useEffect(() => {
    if (startTime && !endTime) {
      // Convert both to UTC to ensure consistent formatting
      const startUTC = dayjs(startTime).utc().toISOString();
      const newEndTime = dayjs(startTime).add(8, 'hour').utc().toISOString();

      // Update both to ensure consistency
      setValue('start_date_time', startUTC);
      setValue('end_date_time', newEndTime);
    }
  }, [startTime, endTime, setValue]);

  // ✅ Calculate shift duration
  useEffect(() => {
    if (startTime && endTime) {
      const start = dayjs(startTime);
      const end = dayjs(endTime);
      const hours = end.diff(start, 'minute') / 60;
      setShiftHour(hours.toFixed(2));
    } else {
      setShiftHour('');
    }
  }, [startTime, endTime]);

  useEffect(() => {
    const startDate = getValues('start_date_time');
    const endDate = getValues('end_date_time');

    if (startDate && endDate) {
      setValue('start_date_time', startDate);
      setValue('end_date_time', endDate);
    }
  }, [getValues, setValue]);

  // Update previous start time when start time changes
  useEffect(() => {
    if (startTime) {
      setPrevStartTime(startTime);
    }
  }, [startTime]);

  // Reset manual change flag only for completely new jobs
  useEffect(() => {
    const currentStartTime = getValues('start_date_time');
    const currentEndTime = getValues('end_date_time');

    // Only reset the flag if both times are empty (new job)
    if (!currentStartTime && !currentEndTime) {
      setHasManuallyChangedEndDate(false);
      setPrevStartTime(null);
    }
  }, [getValues]);

  return (
    <Box
      sx={{
        p: 3,
        gap: 2,
        display: 'flex',
        bgcolor: 'background.neutral',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <Field.Select
          fullWidth
          name="client_type"
          label="Client Type"
          placeholder="Select client type"
          defaultValue="general"
          slotProps={{ inputLabel: { shrink: true } }}
        >
          <MenuItem value="general">General</MenuItem>
          <MenuItem value="telus">TELUS</MenuItem>
          <MenuItem value="lts">LTS</MenuItem>
        </Field.Select>

        <Field.Text
          fullWidth
          name="po_number"
          label="PO # | NW #"
          placeholder="Enter PO # | NW #"
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <Field.Text
          fullWidth
          name="approver"
          label="Approver"
          placeholder="Enter approver"
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Box>

      {/* TELUS-specific fields */}
      {clientType === 'telus' && (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexDirection: 'column',
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            mb: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexDirection: { xs: 'column', sm: 'row' },
            }}
          >
            <Field.Text
              fullWidth
              name="build_partner"
              label="Build Partner"
              placeholder="Enter build partner"
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Field.Text
              fullWidth
              name="additional_build_partner"
              label="Additional Build Partner"
              placeholder="Enter additional build partner"
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Field.Select
              fullWidth
              name="region"
              label="Region"
              placeholder="Select region"
              slotProps={{ inputLabel: { shrink: true } }}
            >
              <MenuItem value="lower_mainland">Lower Mainland</MenuItem>
              <MenuItem value="island">Island</MenuItem>
            </Field.Select>

            <Field.Text
              fullWidth
              name="coid_fas_feeder"
              label="COID/FAS | Feeder"
              placeholder="Enter COID/FAS | Feeder"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexDirection: { xs: 'column', sm: 'row' },
            }}
          >
            <Field.Text
              fullWidth
              name="quantity_lct"
              label="Quantity of LCT"
              placeholder="Enter quantity"
              type="number"
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Field.Text
              fullWidth
              name="quantity_tcp"
              label="Quantity of TCP"
              placeholder="Enter quantity"
              type="number"
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Field.Text
              fullWidth
              name="quantity_highway_truck"
              label="Quantity of Highway Truck"
              placeholder="Enter quantity"
              type="number"
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Field.Text
              fullWidth
              name="quantity_crash_barrel_truck"
              label="Quantity of Crash/Barrel Truck"
              placeholder="Enter quantity"
              type="number"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          <Field.Text
            fullWidth
            name="afad"
            label="AFAD"
            placeholder="Enter AFAD"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>
      )}

      {/* LTS-specific fields */}
      {clientType === 'lts' && (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexDirection: 'column',
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            mb: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexDirection: { xs: 'column', sm: 'row' },
            }}
          >
            <Field.Text
              fullWidth
              name="project"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Project
                  <Tooltip title="Access Build, MxU, NGM, Drops" arrow>
                    <IconButton size="small" sx={{ p: 0.5 }}>
                      <Iconify icon="eva:info-outline" width={16} />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
              placeholder="Enter project"
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Field.Text
              fullWidth
              name="vendor"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Vendor
                  <Tooltip title="Name of Company Invoiced" arrow>
                    <IconButton size="small" sx={{ p: 0.5 }}>
                      <Iconify icon="eva:info-outline" width={16} />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
              placeholder="Enter vendor"
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Field.Text
              fullWidth
              name="build_partner_lts"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Build Partner
                  <Tooltip title="Company on Site" arrow>
                    <IconButton size="small" sx={{ p: 0.5 }}>
                      <Iconify icon="eva:info-outline" width={16} />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
              placeholder="Enter build partner"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexDirection: { xs: 'column', sm: 'row' },
            }}
          >
            <Field.Select
              fullWidth
              name="region_lts"
              label="Region"
              placeholder="Select region"
              slotProps={{ inputLabel: { shrink: true } }}
            >
              <MenuItem value="lower_mainland">Lower Mainland</MenuItem>
              <MenuItem value="island">Island</MenuItem>
            </Field.Select>

            <Field.Text
              fullWidth
              name="fsa_feeder"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  FSA | Feeder
                  <Tooltip
                    title="ie: ARGV 1024A - 0002A&#10;ie: ARGV 0002A&#10;ie: ARGV 1024A&#10;ie: LNGL F31"
                    arrow
                  >
                    <IconButton size="small" sx={{ p: 0.5 }}>
                      <Iconify icon="eva:info-outline" width={16} />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
              placeholder="Enter FSA | Feeder"
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Field.Text
              fullWidth
              name="flagging_slip"
              label="Flagging Slip #"
              placeholder="Enter flagging slip number"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          <Field.Text
            fullWidth
            name="description_scope"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Description of scope of work / activity
                <Tooltip
                  title="Examples: Aerial or UG Placing, Aerial or UG Splicing, Manhole Access, Pole Transfers, Civil"
                  arrow
                >
                  <IconButton size="small" sx={{ p: 0.5 }}>
                    <Iconify icon="eva:info-outline" width={16} />
                  </IconButton>
                </Tooltip>
              </Box>
            }
            placeholder="Enter description of scope of work"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Field.Text
            fullWidth
            name="changing_location"
            label="Changing Location | Stationary Work"
            placeholder="Enter changing location or stationary work details"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Field.Text
            fullWidth
            name="additional_information"
            label="Additional Information"
            placeholder="Enter additional information"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Field.Text
            fullWidth
            name="notes_from_eg"
            label="Notes From EG"
            multiline
            rows={3}
            placeholder="Enter notes from EG"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <Field.MobileDateTimePicker
          name="start_date_time"
          label="Start Date/Time"
          value={startTime ? dayjs(startTime) : null}
          onChange={(newValue) => {
            if (newValue) {
              const newStartDate = newValue.toISOString();
              const currentEndDate = getValues('end_date_time');

              if (currentEndDate) {
                handleDateChange(newStartDate, currentEndDate);
              } else {
                setValue('start_date_time', newStartDate);
              }
            }
          }}
        />
        <Field.MobileDateTimePicker
          name="end_date_time"
          label="End Date/Time"
          value={endTime ? dayjs(endTime) : null}
          shouldDisableDate={(date) => {
            // Disable dates before the start date
            if (startTime) {
              const startDate = dayjs(startTime).startOf('day');
              return date.isBefore(startDate);
            }
            return false;
          }}
          shouldDisableTime={(value, view) => {
            if (view === 'hours' || view === 'minutes') {
              // Disable times on the start date that are before the start time
              if (startTime) {
                const startDateTime = dayjs(startTime);
                const selectedDate = dayjs(value).startOf('day');
                const startDate = startDateTime.startOf('day');

                // If it's the same day as start date, disable times before start time
                if (selectedDate.isSame(startDate)) {
                  const startTimeOnly = startDateTime.format('HH:mm');
                  const selectedTimeOnly = dayjs(value).format('HH:mm');
                  return selectedTimeOnly < startTimeOnly;
                }
              }
            }
            return false;
          }}
          onChange={(newValue) => {
            if (newValue) {
              const startTimeValue = getValues('start_date_time');
              if (startTimeValue) {
                const startDateTime = dayjs(startTimeValue);
                const endDateTime = dayjs(newValue);

                // Check if this would result in a negative duration (overnight shift)
                const duration = endDateTime.diff(startDateTime, 'hour');

                if (duration < 0) {
                  // This is an overnight shift, add one day to the end time
                  const adjustedEndTime = endDateTime.add(1, 'day');
                  handleDateChange(startTimeValue, adjustedEndTime.toISOString());
                } else {
                  handleDateChange(startTimeValue, newValue.toISOString());
                }
              } else {
                setValue('end_date_time', newValue.toISOString());
              }

              // Mark that user has manually changed the end date
              setHasManuallyChangedEndDate(true);
            }
          }}
        />

        <Field.Text
          disabled
          name="shift_hour"
          label="Shift Duration (Hours)"
          value={shiftHour}
          sx={{
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none',
            },
          }}
        />

        <Field.AutocompleteWithAvatar
          key={`timesheet-manager-${workers.length}-${workers.map((w: any) => w.id).join('-')}`}
          fullWidth
          name="timesheet_manager_id"
          label={
            isTimesheetManagerDisabled
              ? 'Timesheet Manager * (Add workers and select employees first)'
              : 'Timesheet Manager *'
          }
          placeholder={
            isTimesheetManagerDisabled
              ? 'Add workers and select employees first'
              : 'Select timesheet manager'
          }
          options={timesheetManagerOptions}
          disabled={isTimesheetManagerDisabled}
          value={timesheetManagerValue}
          onChange={async (event: any, newValue: any) => {
            if (newValue) {
              setValue('timesheet_manager_id', newValue.value);
            } else {
              setValue('timesheet_manager_id', '');
            }
            // Trigger validation to clear error messages
            await trigger('timesheet_manager_id');
          }}
        />
      </Box>

      {/* Conflict Dialog */}
      <WorkerWarningDialog
        warning={workerWarning}
        onClose={handleConflictCancel}
        onConfirm={handleConflictConfirm}
        onCancel={handleConflictCancel}
      />

      {/* Debug info */}
      {workerWarning.open && (
        <div style={{ display: 'none' }}>
          Debug: Dialog should be open with {workerWarning.reasons.length} conflicts
        </div>
      )}
    </Box>
  );
}
