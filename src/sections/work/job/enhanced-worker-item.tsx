import type { IEnhancedEmployee, IWorkerWarningDialog } from 'src/types/preference';
import type { AutocompleteWithAvatarOption } from 'src/components/hook-form/rhf-autocomplete-with-avatar';

import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState, useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

import { fetcher, endpoints } from 'src/lib/axios';
import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';

import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { WorkerWarningDialog } from 'src/components/preference/worker-warning-dialog';
import { EnhancedPreferenceIndicators } from 'src/components/preference/enhanced-preference-indicators';

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
    control,
    formState: { errors },
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
        `${endpoints.companyPreferences}?company_id=${currentCompany.id}`
      );
      return response.data.preferences || [];
    },
    enabled: !!currentCompany?.id,
  });

  const { data: sitePreferences = [] } = useQuery({
    queryKey: ['site-preferences', currentSite?.id],
    queryFn: async () => {
      if (!currentSite?.id) return [];
      const response = await fetcher(`${endpoints.sitePreference}?site_id=${currentSite.id}`);
      return response.data.preferences || [];
    },
    enabled: !!currentSite?.id,
  });

  const { data: clientPreferences = [] } = useQuery({
    queryKey: ['client-preferences', currentClient?.id],
    queryFn: async () => {
      if (!currentClient?.id) return [];
      const response = await fetcher(
        `${endpoints.clientPreferences}?client_id=${currentClient.id}`
      );
      return response.data.preferences || [];
    },
    enabled: !!currentClient?.id,
  });

  // Fetch user preferences for all workers already assigned to check for worker-to-worker conflicts
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
            const response = await fetcher(`${endpoints.userPreferences}?user_id=${workerId}`);
            return response.data.preferences || [];
          } catch (error) {
            console.error(`Error fetching user preferences for worker ${workerId}:`, error);
            return [];
          }
        })
      );

      return allPreferences.flat();
    },
    enabled: workers?.some((w: any) => w.id),
  });

  // Get job's start and end date/times for conflict checking
  const jobStartDateTime = watch('start_date_time');
  const jobEndDateTime = watch('end_date_time');

  // Get job ID for edit mode (to exclude current job from conflicts)
  const currentJobId = watch('id');

  // Fetch time-off requests that might conflict with job dates
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
      return response.data || [];
    },
    enabled: !!jobStartDateTime && !!jobEndDateTime,
    staleTime: 0, // Always consider data stale, force refetch
    gcTime: 0, // Don't cache, always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Fetch worker schedules to check for conflicts (only when we have times)
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
    enabled: !!jobStartDateTime && !!jobEndDateTime,
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
          const timeOffConflicts = timeOffRequests.filter((request: any) => {
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
            (preferences.client?.type === 'not_preferred' && preferences.client.isMandatory) ||
            hasMandatoryUserConflict; // Add user preference conflicts

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
  let employeeError = undefined;
  const match = workerFieldNames.id.match(/workers\[(\d+)\]\.id/);
  if (match) {
    const idx = Number(match[1]);
    const workerErrors = errors?.workers as unknown as any[];
    employeeError = workerErrors?.[idx]?.id?.message;
  }

  // Handle employee selection with preference checking
  const handleEmployeeSelect = (employee: IEnhancedEmployee | null) => {
    if (!employee) {
      // Clear selection
      setValue(workerFieldNames.id, '');
      setValue(workerFieldNames.first_name, '');
      setValue(workerFieldNames.last_name, '');
      setValue(workerFieldNames.photo_url, '');
      setValue(`workers[${thisWorkerIndex}].email`, '');
      setValue(`workers[${thisWorkerIndex}].phone_number`, '');
      setValue(`workers[${thisWorkerIndex}].status`, 'draft');
      return;
    }

    // Check for time-off conflicts first
    if (employee.hasTimeOffConflict) {
      const timeOffInfo =
        employee.timeOffConflicts
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

            return `${formattedType} [${conflict.status}]: ${conflict.reason} ${dateRange}`;
          })
          .join(', ') || 'Worker has a time-off request during this period';

      setWorkerWarning({
        open: true,
        employee: { name: `${employee.first_name} ${employee.last_name}`, id: employee.value },
        warningType: 'time_off_conflict',
        reasons: [timeOffInfo],
        isMandatory: true, // Time-off conflicts are mandatory blocks
        canProceed: false,
      });
      return;
    }

    // Check for schedule conflicts
    if (employee.hasScheduleConflict) {
      const conflictInfo = employee.conflictInfo
        ? `Worker is already scheduled for Job #${employee.conflictInfo.job_number || 'Unknown'} from ${dayjs(employee.conflictInfo.start_time).format('MMM D, h:mm A')} to ${dayjs(employee.conflictInfo.end_time).format('MMM D, h:mm A')}`
        : 'Worker has a scheduling conflict during this time period';

      setWorkerWarning({
        open: true,
        employee: { name: `${employee.first_name} ${employee.last_name}`, id: employee.value },
        warningType: 'schedule_conflict',
        reasons: [conflictInfo],
        isMandatory: true, // Schedule conflicts are mandatory blocks
        canProceed: false,
      });
      return;
    }

    // Check for warnings
    const reasons: string[] = [];
    let warningType:
      | 'not_preferred'
      | 'mandatory_not_preferred'
      | 'worker_conflict'
      | 'schedule_conflict' = 'not_preferred';
    let isMandatory = false;
    let canProceed = true;

    // Check for mandatory not-preferred
    if (employee.hasMandatoryNotPreferred) {
      warningType = 'mandatory_not_preferred';
      isMandatory = true;
      canProceed = false;

      if (
        employee.preferences.company?.type === 'not_preferred' &&
        employee.preferences.company.isMandatory
      ) {
        const reason = employee.preferences.company.reason || 'No reason';
        const companyName = currentCompany?.name || 'Company';
        reasons.push(`${companyName}: ${reason}`);
      }
      if (
        employee.preferences.site?.type === 'not_preferred' &&
        employee.preferences.site.isMandatory
      ) {
        const reason = employee.preferences.site.reason || 'No reason';
        const siteName = currentSite?.name || 'Site';
        reasons.push(`${siteName}: ${reason}`);
      }
      if (
        employee.preferences.client?.type === 'not_preferred' &&
        employee.preferences.client.isMandatory
      ) {
        const reason = employee.preferences.client.reason || 'No reason';
        const clientName = currentClient?.name || 'Client';
        reasons.push(`${clientName}: ${reason}`);
      }

      // Add mandatory user preference conflicts
      if (employee.hasMandatoryUserConflict) {
        const mandatoryUserConflicts =
          employee.userPreferenceConflicts?.filter((pref: any) => pref.is_mandatory) || [];
        mandatoryUserConflicts.forEach((pref: any) => {
          if (pref.employee_id === employee.value) {
            // Someone else marked this worker as not preferred (mandatory)
            // Find the user who set this preference using employeeOptions
            const userWhoSetPreference = employeeOptions.find((emp: any) => emp.value === pref.user_id);
            const conflictingWorkerName =
              userWhoSetPreference?.label ||
              pref.user?.display_name ||
              `${pref.user?.first_name} ${pref.user?.last_name}` ||
              'Unknown Worker';
            const reason = pref.reason || 'No reason provided';
            reasons.push(
              `${conflictingWorkerName} has marked this worker as not preferred: ${reason}`
            );
          } else if (pref.user_id === employee.value) {
            // This worker marked someone else as not preferred (mandatory)
            const conflictingWorkerName =
              pref.employee?.display_name ||
              `${pref.employee?.first_name} ${pref.employee?.last_name}` ||
              'Unknown Worker';
            const reason = pref.reason || 'No reason provided';
            reasons.push(
              `This worker has marked ${conflictingWorkerName} as not preferred: ${reason}`
            );
          }
        });
      }
    }
    // Check for regular not-preferred
    else if (employee.hasNotPreferred) {
      warningType = 'not_preferred';
      canProceed = true;

      if (
        employee.preferences.company?.type === 'not_preferred' &&
        !employee.preferences.company.isMandatory
      ) {
        const reason = employee.preferences.company.reason || 'No reason';
        const companyName = currentCompany?.name || 'Company';
        reasons.push(`${companyName}: ${reason}`);
      }
      if (
        employee.preferences.site?.type === 'not_preferred' &&
        !employee.preferences.site.isMandatory
      ) {
        const reason = employee.preferences.site.reason || 'No reason';
        const siteName = currentSite?.name || 'Site';
        reasons.push(`${siteName}: ${reason}`);
      }
      if (
        employee.preferences.client?.type === 'not_preferred' &&
        !employee.preferences.client.isMandatory
      ) {
        const reason = employee.preferences.client.reason || 'No reason';
        const clientName = currentClient?.name || 'Client';
        reasons.push(`${clientName}: ${reason}`);
      }

      // Add regular user preference conflicts
      if (employee.hasRegularUserConflict) {
        const regularUserConflicts =
          employee.userPreferenceConflicts?.filter((pref: any) => !pref.is_mandatory) || [];
        regularUserConflicts.forEach((pref: any) => {
          if (pref.employee_id === employee.value) {
            // Someone else marked this worker as not preferred
            // Find the user who set this preference using employeeOptions
            const userWhoSetPreference = employeeOptions.find((emp: any) => emp.value === pref.user_id);
            const conflictingWorkerName =
              userWhoSetPreference?.label ||
              pref.user?.display_name ||
              `${pref.user?.first_name} ${pref.user?.last_name}` ||
              'Unknown Worker';
            const reason = pref.reason || 'No reason provided';
            reasons.push(
              `${conflictingWorkerName} has marked this worker as not preferred: ${reason}`
            );
          } else if (pref.user_id === employee.value) {
            // This worker marked someone else as not preferred
            const conflictingWorkerName =
              pref.employee?.display_name ||
              `${pref.employee?.first_name} ${pref.employee?.last_name}` ||
              'Unknown Worker';
            const reason = pref.reason || 'No reason provided';
            reasons.push(
              `This worker has marked ${conflictingWorkerName} as not preferred: ${reason}`
            );
          }
        });
      }
    }

    // Show warning if there are issues
    if (reasons.length > 0) {
      setWorkerWarning({
        open: true,
        employee: {
          name: employee.label,
          id: employee.value,
          photo_url: employee.photo_url,
        },
        warningType,
        reasons,
        isMandatory,
        canProceed,
        workerFieldNames,
      });
      return;
    }

    // No warnings, proceed with selection
    proceedWithSelection(employee);
  };

  const proceedWithSelection = (employee: IEnhancedEmployee) => {
    setValue(workerFieldNames.id, employee.value);
    setValue(workerFieldNames.first_name, employee.first_name);
    setValue(workerFieldNames.last_name, employee.last_name);
    setValue(workerFieldNames.photo_url, employee.photo_url);
    setValue(`workers[${thisWorkerIndex}].email`, employee.email || '');
    setValue(`workers[${thisWorkerIndex}].phone_number`, employee.phone_number || '');
    setValue(`workers[${thisWorkerIndex}].status`, 'draft');
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
    const hasTimeOffConflict = timeOffRequests.some((request: any) => {
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

          <Controller
            name={workerFieldNames.id}
            control={control}
            defaultValue=""
            render={({ field }) => (
              <Field.AutocompleteWithAvatar
                {...field}
                key={`employee-autocomplete-${thisWorkerIndex}-${currentPosition}-${currentEmployeeId}`}
                label={
                  !getValues('client')?.id || !getValues('company')?.id || !getValues('site')?.id
                    ? 'Select company/site/client first'
                    : currentPosition
                      ? 'Employee*'
                      : 'Select position first'
                }
                placeholder={
                  !getValues('client')?.id || !getValues('company')?.id || !getValues('site')?.id
                    ? 'Select company/site/client first'
                    : currentPosition
                      ? 'Search an employee'
                      : 'Select position first'
                }
                options={filteredOptions}
                value={selectedEmployeeOption}
                disabled={
                  !currentPosition ||
                  workers[thisWorkerIndex]?.status === 'accepted' ||
                  workers[thisWorkerIndex]?.status === 'pending' ||
                  !getValues('client')?.id ||
                  !getValues('company')?.id
                }
                helperText={employeeError}
                fullWidth
                slotProps={{
                  textfield: {
                    size: 'small',
                    fullWidth: true,
                  },
                }}
                multiple={false}
                onChange={(
                  _event: React.SyntheticEvent<Element, Event>,
                  value:
                    | AutocompleteWithAvatarOption
                    | string
                    | (AutocompleteWithAvatarOption | string)[]
                    | null,
                  _reason: any,
                  _details?: any
                ) => {
                  if (Array.isArray(value)) return;
                  if (value && typeof value === 'object' && 'value' in value) {
                    handleEmployeeSelect(value as IEnhancedEmployee);
                  } else {
                    handleEmployeeSelect(null);
                  }
                }}
                renderOption={(props, option) => {
                  const enhancedOption = option as IEnhancedEmployee;
                  const { key, ...rest } = props;
                  return (
                    <Box
                      key={key}
                      component="li"
                      {...rest}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar
                            src={enhancedOption.photo_url}
                            alt={enhancedOption.label}
                            sx={{ width: 32, height: 32 }}
                          >
                            {enhancedOption.first_name?.charAt(0)?.toUpperCase()}
                          </Avatar>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">{enhancedOption.label}</Typography>
                            {enhancedOption.hasScheduleConflict && (
                              <Typography
                                variant="caption"
                                color="error"
                                sx={{ fontWeight: 'medium' }}
                              >
                                (Schedule Conflict)
                              </Typography>
                            )}
                            {enhancedOption.hasTimeOffConflict && (
                              <Typography
                                variant="caption"
                                color="error"
                                sx={{ fontWeight: 'medium' }}
                              >
                                (Time-Off Request)
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <EnhancedPreferenceIndicators
                          preferences={enhancedOption.preferences}
                          size="small"
                        />
                      </Box>
                    </Box>
                  );
                }}
              />
            )}
          />

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
