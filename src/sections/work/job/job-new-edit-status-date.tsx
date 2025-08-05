import type { IWorkerWarningDialog } from 'src/types/preference';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useFormContext } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';

import { fetcher, endpoints } from 'src/lib/axios';

import { Field } from 'src/components/hook-form';
import { WorkerWarningDialog } from 'src/components/preference/worker-warning-dialog';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// ----------------------------------------------------------------------

export function JobNewEditStatusDate() {
  const { watch, setValue, getValues } = useFormContext();
  const startTime = watch('start_date_time');
  const endTime = watch('end_date_time');

  // Get workers data and force re-render
  const [workers, setWorkers] = useState<any[]>([]);

  // Update workers state when form values change
  const watchedWorkers = watch('workers');
  useEffect(() => {
    const currentWorkers = getValues('workers') || [];
    setWorkers(currentWorkers);
  }, [getValues, watchedWorkers]);

  // Watch timesheet manager for controlled value
  const selectedTimesheetManager = watch('timesheet_manager_id');

  // Clear timesheet manager when workers change and selection is no longer valid
  useEffect(() => {
    if (selectedTimesheetManager && selectedTimesheetManager !== '') {
      const validWorkers = workers.filter(
        (worker: any) =>
          worker.id &&
          worker.id !== '' &&
          worker.first_name &&
          worker.first_name.trim() !== '' &&
          worker.last_name &&
          worker.last_name.trim() !== ''
      );

      // Only clear if we have valid workers but the selection is not among them
      // This prevents clearing during initialization when workers array might be empty
      if (validWorkers.length > 0) {
        const isSelectionValid = validWorkers.some(
          (worker) => worker.id === selectedTimesheetManager
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
      return response.data || [];
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
      timeOffRequests.forEach((request: any) => {
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
          warningType: conflicts.length === 1 
            ? (timeOffConflicts.length > 0 ? 'time_off_conflict' : 'schedule_conflict')
            : (timeOffConflicts.length > 0 && scheduleConflicts.length > 0 
                ? 'time_off_conflict' // Mixed conflicts, use time_off_conflict for display
                : timeOffConflicts.length > 0 ? 'time_off_conflict' : 'schedule_conflict'),
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
      const conflictingWorkerIds = conflicts.map(c => c.id);

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
        warningType: conflicts.length === 1 
          ? (timeOffConflicts.length > 0 ? 'time_off_conflict' : 'schedule_conflict')
          : (timeOffConflicts.length > 0 && scheduleConflicts.length > 0 
              ? 'time_off_conflict' 
              : timeOffConflicts.length > 0 ? 'time_off_conflict' : 'schedule_conflict'),
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
        flexDirection: { xs: 'column', sm: 'row' },
      }}
    >
      <Field.Text
        fullWidth
        name="po_number"
        label="PO # | NW #"
        placeholder="Enter PO # | NW #"
        slotProps={{ inputLabel: { shrink: true } }}
      />

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
        key={`timesheet-manager-${workers.length}-${workers.map((w) => w.id).join('-')}`}
        fullWidth
        name="timesheet_manager_id"
        label={(() => {
          const validWorkers = workers.filter(
            (worker: any) =>
              worker.id &&
              worker.id !== '' &&
              worker.first_name &&
              worker.first_name.trim() !== '' &&
              worker.last_name &&
              worker.last_name.trim() !== ''
          );
          return validWorkers.length === 0 ? 'Add worker first' : 'Timesheet Manager *';
        })()}
        placeholder={(() => {
          const validWorkers = workers.filter(
            (worker: any) =>
              worker.id &&
              worker.id !== '' &&
              worker.first_name &&
              worker.first_name.trim() !== '' &&
              worker.last_name &&
              worker.last_name.trim() !== ''
          );
          return validWorkers.length === 0 ? 'Add worker first' : 'Select timesheet manager';
        })()}
        options={(() => {
          const validWorkers = workers.filter(
            (worker: any) =>
              worker.id &&
              worker.id !== '' &&
              worker.first_name &&
              worker.first_name.trim() !== '' &&
              worker.last_name &&
              worker.last_name.trim() !== ''
          );
          return validWorkers.map((worker: any) => ({
            value: worker.id,
            label: `${worker.first_name} ${worker.last_name}`,
            photo_url: worker.photo_url || '',
            first_name: worker.first_name,
            last_name: worker.last_name,
          }));
        })()}
        disabled={(() => {
          const validWorkers = workers.filter(
            (worker: any) =>
              worker.id &&
              worker.id !== '' &&
              worker.first_name &&
              worker.first_name.trim() !== '' &&
              worker.last_name &&
              worker.last_name.trim() !== ''
          );
          return validWorkers.length === 0;
        })()}
        value={(() => {
          const validWorkers = workers.filter(
            (worker: any) =>
              worker.id &&
              worker.id !== '' &&
              worker.first_name &&
              worker.first_name.trim() !== '' &&
              worker.last_name &&
              worker.last_name.trim() !== ''
          );
          const currentValue = selectedTimesheetManager;

          // Clear the field if no valid workers or no current value
          if (!currentValue || currentValue === '' || validWorkers.length === 0) {
            return null;
          }

          // Find the selected worker in current valid workers
          const selectedWorker = validWorkers.find((w) => w.id === currentValue);

          // If the previously selected worker is not in the current list, clear the selection
          if (!selectedWorker) {
            // Clear the form value to prevent stale selections
            setValue('timesheet_manager_id', '');
            return null;
          }

          return {
            value: selectedWorker.id,
            label: `${selectedWorker.first_name} ${selectedWorker.last_name}`,
            photo_url: selectedWorker.photo_url || '',
            first_name: selectedWorker.first_name,
            last_name: selectedWorker.last_name,
          };
        })()}
        onChange={(event: any, newValue: any) => {
          if (newValue) {
            setValue('timesheet_manager_id', newValue.value);
          } else {
            setValue('timesheet_manager_id', '');
          }
        }}
      />

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
