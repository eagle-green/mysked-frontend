import type { IEnhancedEmployee, IWorkerWarningDialog } from 'src/types/preference';

import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { useFormContext } from 'react-hook-form';
import React, { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { fetcher, endpoints } from 'src/lib/axios';
import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';

import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { WorkerWarningDialog } from 'src/components/preference/worker-warning-dialog';

// ----------------------------------------------------------------------

interface EnhancedWorkerItemProps {
  onRemoveWorkerItem: () => void;
  workerFieldNames: Record<string, string>;
  employeeOptions: any[];
  position: string;
  canRemove: boolean;
  removeVehicle: (index: number) => void;
  viewAllWorkers?: boolean;
}

export function EnhancedWorkerItem({
  onRemoveWorkerItem,
  workerFieldNames,
  employeeOptions,
  position,
  canRemove,
  removeVehicle,
  viewAllWorkers = false,
}: EnhancedWorkerItemProps) {
  const theme = useTheme();
  const isXsSmMd = useMediaQuery(theme.breakpoints.down('md'));
  const {
    getValues,
    setValue,
    watch,
    // formState: { errors }, // Unused variable
  } = useFormContext();

  const [workerWarning, setWorkerWarning] = useState<IWorkerWarningDialog>({
    open: false,
    employee: { name: '', id: '' },
    warningType: 'not_preferred',
    reasons: [],
    isMandatory: false,
    canProceed: true,
  });

  // Get current values
  const workers = useMemo(() => watch('workers') || [], [watch]);
  const currentPosition = watch(workerFieldNames.position);
  const currentEmployeeId = watch(workerFieldNames.id);
  const thisWorkerIndex = Number(workerFieldNames.id.match(/workers\[(\d+)\]\.id/)?.[1] ?? -1);

  // Get current company, site, and client for preference fetching
  const currentCompany = getValues('company');
  const currentSite = getValues('site');
  const currentClient = getValues('client');

  // Fetch preferences
  const { data: companyPreferences = [] } = useQuery({
    queryKey: ['company-preferences', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];
      const response = await fetcher(
        `${endpoints.management.companyPreferences}?company_id=${currentCompany.id}`
      );
      return response.data.preferences || [];
    },
    enabled: !!currentCompany?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - don't refetch unnecessarily
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnMount: false, // Don't refetch on mount if we have data
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  const { data: sitePreferences = [] } = useQuery({
    queryKey: ['site-preferences', currentSite?.id],
    queryFn: async () => {
      if (!currentSite?.id) return [];
      const response = await fetcher(`${endpoints.management.sitePreference}?site_id=${currentSite.id}`);
      return response.data.preferences || [];
    },
    enabled: !!currentSite?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - don't refetch unnecessarily
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnMount: false, // Don't refetch on mount if we have data
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  const { data: clientPreferences = [] } = useQuery({
    queryKey: ['client-preferences', currentClient?.id],
    queryFn: async () => {
      if (!currentClient?.id) return [];
      const response = await fetcher(
        `${endpoints.management.clientPreferences}?client_id=${currentClient.id}`
      );
      return response.data.preferences || [];
    },
    enabled: !!currentClient?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - don't refetch unnecessarily
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnMount: false, // Don't refetch on mount if we have data
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Fetch user preferences for all workers already assigned to check for worker-to-worker conflicts
  // DISABLED for open jobs - no specific workers assigned yet
  const { data: userPreferences = [] } = useQuery({
    queryKey: [
      'all-user-preferences',
      workers
        ?.map((w: any) => w.id)
        ?.filter(Boolean)
        ?.sort(),
    ],
    queryFn: async () => {
      const assignedWorkerIds = workers?.map((w: any) => w.id)?.filter(Boolean) || [];
      if (assignedWorkerIds.length === 0) return [];

      // Fetch user preferences for all assigned workers
      const allPreferences = await Promise.all(
        assignedWorkerIds.map(async (workerId: string) => {
          try {
            const response = await fetcher(`${endpoints.management.userPreferences}?user_id=${workerId}`);
            return response.data.preferences || [];
          } catch (error) {
            console.error(`Error fetching user preferences for worker ${workerId}:`, error);
            return [];
          }
        })
      );

      return allPreferences.flat();
    },
    enabled: false, // DISABLED for open jobs - no specific workers assigned yet
  });

  // Get job's start and end date/times for conflict checking
  const jobStartDateTime = watch('start_date_time');
  const jobEndDateTime = watch('end_date_time');

  // Get job ID for edit mode (to exclude current job from conflicts)
  const currentJobId = watch('id');

  // Fetch time-off requests that might conflict with job dates
  // DISABLED for open jobs - no specific workers assigned yet
  const { data: timeOffRequests = [] } = useQuery({
    queryKey: ['time-off-conflicts', jobStartDateTime, jobEndDateTime],
    queryFn: async () => {
      if (!jobStartDateTime || !jobEndDateTime) return [];

      // Format dates for API call
      const startDate = new Date(jobStartDateTime).toISOString().split('T')[0];
      const endDate = new Date(jobEndDateTime).toISOString().split('T')[0];

      const response = await fetcher(
        `/api/time-off/admin/all?start_date=${startDate}&end_date=${endDate}`
      );
      return response.data?.timeOffRequests || [];
    },
    enabled: false, // DISABLED for open jobs - no specific workers to check
    staleTime: 0, // Always consider data stale, force refetch
    gcTime: 0, // Don't cache, always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Fetch worker schedules to check for conflicts (only when we have times)
  // DISABLED for open jobs - no specific workers assigned yet
  const { data: workerSchedules = { scheduledWorkers: [], success: false } } = useQuery({
    queryKey: [
      'worker-schedules',
      jobStartDateTime ? dayjs(jobStartDateTime).toISOString() : null,
      jobEndDateTime ? dayjs(jobEndDateTime).toISOString() : null,
      currentJobId,
    ],
    queryFn: async () => {
      try {
        if (!jobStartDateTime || !jobEndDateTime) {
          return { scheduledWorkers: [] };
        }

        const startISO = dayjs(jobStartDateTime).toISOString();
        const endISO = dayjs(jobEndDateTime).toISOString();
        let url = `${endpoints.work.job}/check-availability?start_time=${encodeURIComponent(startISO)}&end_time=${encodeURIComponent(endISO)}`;

        // Exclude current job from conflicts when editing
        if (currentJobId) {
          url += `&exclude_job_id=${encodeURIComponent(currentJobId)}`;
        }

        const response = await fetcher(url);

        return {
          scheduledWorkers: response?.scheduledWorkers || [],
          success: response?.success || false,
        };
      } catch (error) {
        console.warn('Schedule conflict checking failed:', error);
        // Always return a valid object, never undefined
        return { scheduledWorkers: [], success: false };
      }
    },
    enabled: false, // DISABLED for open jobs - no specific workers to check
    staleTime: 0, // Always consider data stale, force refetch
    gcTime: 0, // Don't cache, always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Get list of worker IDs that have overlapping schedules
  const conflictingWorkerIds = useMemo(() => {
    const scheduledWorkers = workerSchedules?.scheduledWorkers || [];
    const ids = scheduledWorkers.map((w: any) => w.user_id).filter(Boolean);
    return ids;
  }, [workerSchedules]);

  // Collect already picked employee IDs
  const pickedEmployeeIds = workers
    .map((w: any, idx: number) => (idx !== thisWorkerIndex ? w.id : null))
    .filter(Boolean);

  // Enhanced employee options with preference metadata
  const enhancedOptions: IEnhancedEmployee[] = useMemo(
    () =>
      employeeOptions
        .filter((emp) => {
          // Filter by role and not already picked
          if (!emp.role) return false;
          const roleMatch = currentPosition
            ? emp.role
                .split('/')
                .map((r: string) => r.trim().toLowerCase())
                .includes(currentPosition.trim().toLowerCase())
            : true;
          const alreadyPicked = pickedEmployeeIds.includes(emp.value);

          return roleMatch && !alreadyPicked;
        })
        .map((emp) => {
          // Find preferences for this employee
          const companyPref = companyPreferences.find(
            (p: any) => p.employee?.id === emp.value || p.user?.id === emp.value
          );
          const sitePref = sitePreferences.find(
            (p: any) => p.employee?.id === emp.value || p.user?.id === emp.value
          );
          const clientPref = clientPreferences.find(
            (p: any) => p.employee?.id === emp.value || p.user?.id === emp.value
          );

          // Check for schedule conflicts
          const hasScheduleConflict = conflictingWorkerIds.includes(emp.value);
          const conflictInfo = hasScheduleConflict
            ? (workerSchedules?.scheduledWorkers || []).find((w: any) => w.user_id === emp.value)
            : null;

          // Check for time-off conflicts
          const timeOffConflicts = (Array.isArray(timeOffRequests) ? timeOffRequests : []).filter((request: any) => {
            // Only check pending and approved requests
            if (!['pending', 'approved'].includes(request.status)) return false;

            // Check if this request belongs to the current employee
            if (request.user_id !== emp.value) return false;

            // Check if the time-off request dates overlap with the job dates
            const jobStartDate = new Date(jobStartDateTime);
            const jobEndDate = new Date(jobEndDateTime);
            const timeOffStartDate = new Date(request.start_date);
            const timeOffEndDate = new Date(request.end_date);

            // Convert to date strings for comparison (YYYY-MM-DD format)
            const jobStartDateStr = jobStartDate.toISOString().split('T')[0];
            const jobEndDateStr = jobEndDate.toISOString().split('T')[0];
            const timeOffStartDateStr = timeOffStartDate.toISOString().split('T')[0];
            const timeOffEndDateStr = timeOffEndDate.toISOString().split('T')[0];

            // Check for date overlap using date strings
            const hasOverlap =
              (timeOffStartDateStr <= jobStartDateStr && timeOffEndDateStr >= jobStartDateStr) || // Time-off starts before job and ends after job starts
              (timeOffStartDateStr <= jobEndDateStr && timeOffEndDateStr >= jobEndDateStr) || // Time-off starts before job ends and ends after job ends
              (timeOffStartDateStr >= jobStartDateStr && timeOffEndDateStr <= jobEndDateStr); // Time-off is completely within job period

            return hasOverlap;
          });

          const hasTimeOffConflict = timeOffConflicts.length > 0;

          // Check for user-to-user preference conflicts
          // Check if any currently assigned worker has this employee as "not preferred"
          // Exclude self-references (someone marking themselves as not preferred)
          const userPreferenceConflicts = userPreferences.filter(
            (pref: any) =>
              pref.employee_id === emp.value && 
              pref.preference_type === 'not_preferred' &&
              pref.user_id !== emp.value // Exclude self-references
          );

          // NEW: Check if this employee has marked any currently assigned workers as "not preferred" (bidirectional check)
          const currentlyAssignedWorkerIds =
            workers
              ?.map((w: any) => w.id)
              ?.filter((id: string) => id && id !== '' && id !== emp.value) || [];

          const reverseUserPreferenceConflicts = userPreferences.filter(
            (pref: any) =>
              pref.user_id === emp.value && // This employee is the one setting the preference
              pref.preference_type === 'not_preferred' &&
              currentlyAssignedWorkerIds.includes(pref.employee_id) // Against someone already assigned
          );

          // Combine both directions of conflicts
          const allUserPreferenceConflicts = [
            ...userPreferenceConflicts,
            ...reverseUserPreferenceConflicts,
          ];

          const hasMandatoryUserConflict = allUserPreferenceConflicts.some(
            (pref: any) => pref.is_mandatory
          );
          const hasRegularUserConflict = allUserPreferenceConflicts.some(
            (pref: any) => !pref.is_mandatory
          );

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

          // Calculate metadata - Include user preference conflicts and time-off conflicts
          const hasMandatoryNotPreferred =
            (preferences.company?.type === 'not_preferred' && preferences.company.isMandatory) ||
            (preferences.site?.type === 'not_preferred' && preferences.site.isMandatory) ||
            (preferences.client?.type === 'not_preferred' && preferences.client.isMandatory);
            // Note: User preference conflicts are NOT mandatory restrictions - they can be overridden

          const hasNotPreferred =
            (preferences.company?.type === 'not_preferred' && !preferences.company.isMandatory) ||
            (preferences.site?.type === 'not_preferred' && !preferences.site.isMandatory) ||
            (preferences.client?.type === 'not_preferred' && !preferences.client.isMandatory) ||
            hasRegularUserConflict; // Add user preference conflicts

          const preferredCount = [
            preferences.company?.type === 'preferred',
            preferences.site?.type === 'preferred',
            preferences.client?.type === 'preferred',
          ].filter(Boolean).length;

          const preferenceIndicators: [boolean, boolean, boolean] = [
            preferences.company?.type === 'preferred',
            preferences.site?.type === 'preferred',
            preferences.client?.type === 'preferred',
          ];

          // Remove background color for schedule conflicts (no longer needed)
          const backgroundColor: 'success' | 'warning' | 'error' | 'default' = 'default';

          return {
            ...emp,
            preferences,
            hasMandatoryNotPreferred,
            hasNotPreferred,
            hasPreferred: preferredCount > 0,
            hasScheduleConflict,
            conflictInfo,
            userPreferenceConflicts: allUserPreferenceConflicts, // Add user conflicts data (bidirectional)
            hasMandatoryUserConflict,
            hasRegularUserConflict,
            hasTimeOffConflict, // Add time-off conflict data
            timeOffConflicts, // Add time-off conflicts data
            preferredCount,
            preferenceIndicators,
            backgroundColor,
            certifications: emp.certifications, // Add certification data
            sortPriority: hasTimeOffConflict
              ? 3000 // Time-off conflicts have highest priority
              : hasScheduleConflict
                ? 2000 // Schedule conflicts sort last
                : hasMandatoryNotPreferred
                  ? 1000
                  : hasNotPreferred
                    ? 500
                    : preferredCount > 0
                      ? -preferredCount
                      : 0,
          };
        })
        .sort((a, b) => a.sortPriority - b.sortPriority),
    [
      employeeOptions,
      companyPreferences,
      sitePreferences,
      clientPreferences,
      userPreferences,
      timeOffRequests,
      currentPosition,
      pickedEmployeeIds,
      conflictingWorkerIds,
      workerSchedules,
      jobStartDateTime,
      jobEndDateTime,
      workers,
    ]
  );

  // Filter options based on viewAll setting
  const filteredOptions = useMemo(() => {
    if (viewAllWorkers) {
      return enhancedOptions;
    }

    // Always include currently assigned workers, regardless of preferences or conflicts
    const currentlyAssignedWorkerIds = workers
      .map((w: any) => w.id)
      .filter(Boolean);

    // Hide workers with time-off conflicts, schedule conflicts, and mandatory not-preferred restrictions by default
    // Only show preferred users and regular users (no preferences) without conflicts or mandatory restrictions
    // BUT always include currently assigned workers
    const filtered = enhancedOptions.filter(
      (emp) =>
        currentlyAssignedWorkerIds.includes(emp.value) || // Always include currently assigned workers
        (!emp.hasTimeOffConflict && // Hide time-off conflicts by default
          !emp.hasScheduleConflict && // Hide schedule conflicts by default
          !emp.hasMandatoryNotPreferred && // First check: NO mandatory restrictions
          (emp.hasPreferred || // Has preferred preferences
            (!emp.hasPreferred && !emp.hasNotPreferred))) // No preferences at all
    );

    return filtered;
  }, [enhancedOptions, viewAllWorkers, workers]);

  // Auto-clear selection when current worker becomes hidden due to viewAll toggle
  useEffect(() => {
    if (!viewAllWorkers && currentEmployeeId) {
      const isCurrentlyVisible = filteredOptions.some((emp) => emp.value === currentEmployeeId);
      if (!isCurrentlyVisible) {
        // Clear the worker selection since they're no longer visible
        setValue(workerFieldNames.id, '');
        setValue(workerFieldNames.first_name, '');
        setValue(workerFieldNames.last_name, '');
        setValue(workerFieldNames.photo_url, '');
        setValue(`workers[${thisWorkerIndex}].email`, '');
        setValue(`workers[${thisWorkerIndex}].phone_number`, '');
        setValue(`workers[${thisWorkerIndex}].status`, 'draft');
      }
    }
  }, [viewAllWorkers, currentEmployeeId, filteredOptions, setValue, workerFieldNames, thisWorkerIndex]);

  // Get the currently selected employee option
  const selectedEmployeeOption = currentEmployeeId
    ? filteredOptions.find((emp) => emp.value === currentEmployeeId) || 
      enhancedOptions.find((emp) => emp.value === currentEmployeeId) || null // Fallback to all options if not found in filtered
    : null;

  // Debug logging for worker data issues
  useEffect(() => {
    if (currentEmployeeId && !selectedEmployeeOption) {
      console.warn('Worker not found in options:', {
        currentEmployeeId,
        workerIndex: thisWorkerIndex,
        availableOptions: enhancedOptions.map(opt => ({ value: opt.value, label: opt.label })),
        filteredOptions: filteredOptions.map(opt => ({ value: opt.value, label: opt.label })),
        workers: workers.map((w: any) => ({ id: w.id, name: `${w.first_name} ${w.last_name}` }))
      });
    }
  }, [currentEmployeeId, selectedEmployeeOption, enhancedOptions, filteredOptions, workers, thisWorkerIndex]);



  // Get error for this worker's id
  // Get employee error for this specific worker
  // const match = workerFieldNames.id.match(/workers\[(\d+)\]\.id/);
  // const employeeError = match ? (() => {
  //   const idx = Number(match[1]);
  //   const workerErrors = errors?.workers as unknown as any[];
  //   return workerErrors?.[idx]?.id?.message;
  // })() : undefined; // Unused variable

  // Handle employee selection with preference checking - FUNCTION REMOVED (unused)
  // const handleEmployeeSelect = (employee: IEnhancedEmployee | null) => { ... };

  // (Removed unused handleEmployeeSelect function content)

  // Function content removed due to being unused

  // End of removed function

  const proceedWithSelection = (employee: IEnhancedEmployee) => {
    // Set basic worker info
    setValue(workerFieldNames.id, employee.value);
    setValue(workerFieldNames.first_name, employee.first_name);
    setValue(workerFieldNames.last_name, employee.last_name);
    setValue(workerFieldNames.photo_url, employee.photo_url);
    setValue(`workers[${thisWorkerIndex}].email`, employee.email || '');
    setValue(`workers[${thisWorkerIndex}].phone_number`, employee.phone_number || '');
    setValue(`workers[${thisWorkerIndex}].status`, 'draft');

    // Preserve worker's individual schedule times if they have existing jobs
    const existingSchedule = workerSchedules?.scheduledWorkers?.find(
      (w: any) => w.user_id === employee.value
    );
    
    // debug logs removed
    
    if (existingSchedule && existingSchedule.start_time && existingSchedule.end_time) {
      // Use the worker's existing schedule times
      // debug logs removed
      setValue(workerFieldNames.start_time, existingSchedule.start_time);
      setValue(workerFieldNames.end_time, existingSchedule.end_time);
    } else {
      // If no existing schedule or times are missing, use job times as defaults
      const jobStartTime = getValues('start_date_time');
      const jobEndTime = getValues('end_date_time');
      // debug logs removed
      setValue(workerFieldNames.start_time, jobStartTime);
      setValue(workerFieldNames.end_time, jobEndTime);
    }
    
    // Verify the values were set
    // verification log removed
  };

  const handleWarningConfirm = () => {
    // Check if we can proceed based on the canProceed flag
    if (!workerWarning.canProceed) {
      // Cannot proceed - clear the worker selection
      setValue(workerFieldNames.id, '');
      setValue(workerFieldNames.first_name, '');
      setValue(workerFieldNames.last_name, '');
      setValue(workerFieldNames.photo_url, '');
      setValue(workerFieldNames.email, '');
      setValue(workerFieldNames.phone_number, '');
      setValue(`workers[${thisWorkerIndex}].status`, 'draft');
    } else {
      // Can proceed - find the employee and add them
      const employee = filteredOptions.find((emp) => emp.value === workerWarning.employee.id);
      if (employee) {
        proceedWithSelection(employee);
      }
    }
    setWorkerWarning((prev) => ({ ...prev, open: false }));
  };

  const handleWarningCancel = () => {
    // For schedule conflicts, remove the worker when cancelled
    if (workerWarning.warningType === 'schedule_conflict') {
      setValue(workerFieldNames.id, '');
      setValue(workerFieldNames.first_name, '');
      setValue(workerFieldNames.last_name, '');
      setValue(workerFieldNames.photo_url, '');
      setValue(workerFieldNames.email, '');
      setValue(workerFieldNames.phone_number, '');
      setValue(`workers[${thisWorkerIndex}].status`, 'draft');
    }
    setWorkerWarning((prev) => ({ ...prev, open: false }));
  };

  // Check existing worker for conflicts when job times change
  useEffect(() => {
    // Skip if we're currently processing a date change (to prevent duplicate dialogs)
    if (getValues('isProcessingDateChange')) {
      return;
    }

    // Skip if no employee is selected
    if (!currentEmployeeId) {
      return;
    }

    // Skip if worker warning dialog is currently open (to prevent double dialogs during manual selection)
    if (workerWarning.open) {
      return;
    }

    // Check for schedule conflicts
    const hasScheduleConflict = workerSchedules?.scheduledWorkers?.some(
      (scheduledWorker: any) => scheduledWorker.user_id === currentEmployeeId
    );

    // Check for time-off conflicts
    const hasTimeOffConflict = (Array.isArray(timeOffRequests) ? timeOffRequests : []).some((request: any) => {
      // Only check pending and approved requests
      if (!['pending', 'approved'].includes(request.status)) return false;

      // Check if this request belongs to the current employee
      if (request.user_id !== currentEmployeeId) return false;

      // Check if the time-off request dates overlap with the job dates
      const jobStartDate = new Date(jobStartDateTime);
      const jobEndDate = new Date(jobEndDateTime);
      const timeOffStartDate = new Date(request.start_date);
      const timeOffEndDate = new Date(request.end_date);

      // Convert to date strings for comparison (YYYY-MM-DD format)
      const jobStartDateStr = jobStartDate.toISOString().split('T')[0];
      const jobEndDateStr = jobEndDate.toISOString().split('T')[0];
      const timeOffStartDateStr = timeOffStartDate.toISOString().split('T')[0];
      const timeOffEndDateStr = timeOffEndDate.toISOString().split('T')[0];

      // Check for date overlap using date strings
      return (
        (timeOffStartDateStr <= jobStartDateStr && timeOffEndDateStr >= jobStartDateStr) || // Time-off starts before job and ends after job starts
        (timeOffStartDateStr <= jobEndDateStr && timeOffEndDateStr >= jobEndDateStr) || // Time-off starts before job ends and ends after job ends
        (timeOffStartDateStr >= jobStartDateStr && timeOffEndDateStr <= jobEndDateStr) // Time-off is completely within job period
      );
    });

    // Only show dialog if there are conflicts (priority: time-off > schedule)
    if (hasTimeOffConflict || hasScheduleConflict) {
      const selectedEmployee = employeeOptions.find(
        (emp: any) => emp.value === currentEmployeeId
      );
      
      if (selectedEmployee) {
        // Don't show dialog - let the JobNewEditStatusDate component handle this
        // Just clear the worker to prevent conflicts
        setValue(workerFieldNames.id, '');
        setValue(workerFieldNames.first_name, '');
        setValue(workerFieldNames.last_name, '');
        setValue(workerFieldNames.photo_url, '');
        setValue(workerFieldNames.email, '');
        setValue(workerFieldNames.phone_number, '');
        setValue(`workers[${thisWorkerIndex}].status`, 'draft');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerSchedules, timeOffRequests, employeeOptions, getValues, jobStartDateTime, jobEndDateTime, setValue, workerFieldNames, thisWorkerIndex]);

  // Reset employee selection when position changes
  useEffect(() => {
    if (currentPosition && currentEmployeeId) {
      const selectedEmployee = employeeOptions.find((emp: any) => emp.value === currentEmployeeId);
      if (selectedEmployee) {
        const roleMatch = selectedEmployee.role
          ?.split('/')
          .map((r: string) => r.trim().toLowerCase())
          .includes(currentPosition.trim().toLowerCase());

        if (!roleMatch) {
          setValue(workerFieldNames.id, '');
          setValue(workerFieldNames.first_name, '');
          setValue(workerFieldNames.last_name, '');
          setValue(workerFieldNames.photo_url, '');
          setValue(workerFieldNames.email, '');
          setValue(workerFieldNames.phone_number, '');
          setValue(`workers[${thisWorkerIndex}].status`, 'draft');

          // Remove any vehicles assigned to this worker
          const currentVehicles = getValues('vehicles') || [];
          const vehiclesToRemove: number[] = [];
          currentVehicles.forEach((vehicle: any, vIdx: number) => {
            if (vehicle.operator && vehicle.operator.id === currentEmployeeId) {
              vehiclesToRemove.push(vIdx);
            }
          });

          if (vehiclesToRemove.length > 0) {
            vehiclesToRemove.reverse().forEach((vIdx: number) => {
              removeVehicle(vIdx);
            });
          }
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPosition,
    workerFieldNames,
    setValue,
    employeeOptions,
    thisWorkerIndex,
    getValues,
    removeVehicle,
    workerWarning.open,
  ]);

  return (
    <>
      <Box
        sx={{
          gap: 1.5,
          display: 'flex',
          alignItems: 'flex-end',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            gap: 2,
            width: 1,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          <Field.Select
            size="small"
            name={workerFieldNames.position}
            label={
              !getValues('client')?.id || !getValues('company')?.id || !getValues('site')?.id
                ? 'Select company/site/client first'
                : 'Position*'
            }
            disabled={
              workers[thisWorkerIndex]?.status === 'accepted' ||
              workers[thisWorkerIndex]?.status === 'pending' ||
              !getValues('client')?.id ||
              !getValues('company')?.id ||
              !getValues('site')?.id
            }
          >
            {JOB_POSITION_OPTIONS.map((item) => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </Field.Select>





          <Field.TimePicker
            name={workerFieldNames.start_time}
            label="Start Time"
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />

          <Field.TimePicker
            name={workerFieldNames.end_time}
            label="End Time"
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />

          {!isXsSmMd && (
            <Button
              size="small"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={onRemoveWorkerItem}
              disabled={!canRemove}
              sx={{ px: 4.5, mt: 1 }}
            >
              Remove
            </Button>
          )}
        </Box>
        {isXsSmMd && (
          <Button
            size="small"
            color="error"
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            onClick={onRemoveWorkerItem}
            disabled={!canRemove}
          >
            Remove
          </Button>
        )}
      </Box>

      <WorkerWarningDialog
        warning={workerWarning}
        onClose={handleWarningCancel}
        onConfirm={handleWarningConfirm}
        onCancel={handleWarningCancel}
      />
    </>
  );
}

export default EnhancedWorkerItem;
