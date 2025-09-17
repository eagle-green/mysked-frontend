import type { IEnhancedEmployee } from 'src/types/preference';
import type { ScheduleConflict } from 'src/utils/schedule-conflict';

import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { analyzeScheduleConflicts } from 'src/utils/schedule-conflict';

import { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

export interface WorkerConflictData {
  hasTimeOffConflict: boolean;
  hasScheduleConflict: boolean;
  hasBlockingScheduleConflict: boolean;
  hasMandatoryNotPreferred: boolean;
  hasNotPreferred: boolean;
  hasPreferred: boolean;
  hasMandatoryUserConflict: boolean;
  hasRegularUserConflict: boolean;
  timeOffConflicts: any[];
  conflictInfo: any;
  userPreferenceConflicts: any[];
  preferredCount: number;
  preferenceIndicators: [boolean, boolean, boolean];
  preferences: any;
  certifications?: any;
  sortPriority: number;
}

export interface ConflictCheckResult {
  allIssues: string[];
  hasMandatoryIssues: boolean;
  canProceed: boolean;
  warningType: 'not_preferred' | 'mandatory_not_preferred' | 'worker_conflict' | 'schedule_conflict' | 'time_off_conflict' | 'certification_issues' | 'multiple_issues';
  shouldShowScheduleDialog: boolean;
  scheduleConflicts?: ScheduleConflict[];
}

interface UseWorkerConflictCheckerProps {
  jobStartDateTime?: string | Date;
  jobEndDateTime?: string | Date;
  currentJobId?: string;
  currentCompany?: any;
  currentSite?: any;
  currentClient?: any;
  workers?: any[];
  employeeOptions?: any[];
}

export function useWorkerConflictChecker({
  jobStartDateTime,
  jobEndDateTime,
  currentJobId,
  currentCompany,
  currentSite,
  currentClient,
  workers = [],
  employeeOptions = [],
}: UseWorkerConflictCheckerProps) {
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
  });

  const { data: sitePreferences = [] } = useQuery({
    queryKey: ['site-preferences', currentSite?.id],
    queryFn: async () => {
      if (!currentSite?.id) return [];
      const response = await fetcher(`${endpoints.management.sitePreference}?site_id=${currentSite.id}`);
      return response.data.preferences || [];
    },
    enabled: !!currentSite?.id,
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
    enabled: workers?.some((w: any) => w.id),
  });

  // Fetch time-off requests that might conflict with job dates
  const { data: timeOffRequests = [] } = useQuery({
    queryKey: ['time-off-conflicts', jobStartDateTime, jobEndDateTime],
    queryFn: async () => {
      if (!jobStartDateTime || !jobEndDateTime) return [];

      try {
        // Format dates for API call
        const startDate = new Date(jobStartDateTime).toISOString().split('T')[0];
        const endDate = new Date(jobEndDateTime).toISOString().split('T')[0];

        const response = await fetcher(
          `/api/time-off/admin/all?start_date=${startDate}&end_date=${endDate}`
        );
        
        // Ensure we always return an array
        const data = response?.data?.timeOffRequests;
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching time-off requests:', error);
        return [];
      }
    },
    enabled: !!jobStartDateTime && !!jobEndDateTime,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Fetch worker schedules to check for conflicts
  const { data: workerSchedules = { scheduledWorkers: [], success: false, gap_checking_enabled: true } } = useQuery({
    queryKey: [
      'worker-schedules',
      jobStartDateTime ? dayjs(jobStartDateTime).toISOString() : null,
      jobEndDateTime ? dayjs(jobEndDateTime).toISOString() : null,
      currentJobId,
    ],
    queryFn: async () => {
      try {
        if (!jobStartDateTime || !jobEndDateTime) {
          return { scheduledWorkers: [], gap_checking_enabled: true };
        }

        const startISO = dayjs(jobStartDateTime).toISOString();
        const endISO = dayjs(jobEndDateTime).toISOString();
        let url = `${endpoints.work.job}/check-availability?start_time=${encodeURIComponent(startISO)}&end_time=${encodeURIComponent(endISO)}&check_gap=true`;

        // Exclude current job from conflicts when editing
        if (currentJobId) {
          url += `&exclude_job_id=${encodeURIComponent(currentJobId)}`;
        }

        const response = await fetcher(url);

        return {
          scheduledWorkers: response?.scheduledWorkers || [],
          success: response?.success || false,
          gap_checking_enabled: response?.gap_checking_enabled ?? true,
        };
      } catch (error) {
        console.warn('Schedule conflict checking failed:', error);
        return { scheduledWorkers: [], success: false, gap_checking_enabled: true };
      }
    },
    enabled: !!jobStartDateTime && !!jobEndDateTime,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Get list of worker IDs that have schedule conflicts
  const conflictingWorkerIds = useMemo(() => {
    const scheduledWorkers = workerSchedules?.scheduledWorkers || [];
    const ids = scheduledWorkers.map((w: any) => w.user_id).filter(Boolean);
    return ids;
  }, [workerSchedules]);

  // Get conflicts by worker ID for detailed analysis
  const conflictsByWorkerId = useMemo(() => {
    const scheduledWorkers = workerSchedules?.scheduledWorkers || [];
    const conflicts: Record<string, ScheduleConflict[]> = {};
    
    scheduledWorkers.forEach((worker: any) => {
      if (!conflicts[worker.user_id]) {
        conflicts[worker.user_id] = [];
      }
      conflicts[worker.user_id].push(worker);
    });
    
    return conflicts;
  }, [workerSchedules]);

  // Enhanced employee options with conflict metadata
  const enhanceEmployeeWithConflicts = (emp: any, currentPosition?: string, pickedEmployeeIds: string[] = []): IEnhancedEmployee & WorkerConflictData => {
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
    
    // Determine if schedule conflict is blocking (direct overlap) or non-blocking (gap violation)
    let hasBlockingScheduleConflict = false;
    if (hasScheduleConflict) {
      const workerConflicts = conflictsByWorkerId[emp.value] || [];
      const conflictAnalysis = analyzeScheduleConflicts(workerConflicts);
      hasBlockingScheduleConflict = conflictAnalysis.directOverlaps.length > 0;
    }

    // Check for time-off conflicts
    const timeOffConflicts = (Array.isArray(timeOffRequests) ? timeOffRequests : []).filter((request: any) => {
      // Only check pending and approved requests
      if (!['pending', 'approved'].includes(request.status)) return false;

      // Check if this request belongs to the current employee
      if (request.user_id !== emp.value) return false;

      // Check if the time-off request dates overlap with the job dates
      const jobStartDate = new Date(jobStartDateTime!);
      const jobEndDate = new Date(jobEndDateTime!);
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
    const userPreferenceConflicts = userPreferences.filter(
      (pref: any) =>
        pref.employee_id === emp.value && 
        pref.preference_type === 'not_preferred' &&
        pref.user_id !== emp.value // Exclude self-references
    );

    // Check if this employee has marked any currently assigned workers as "not preferred"
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

    // Calculate metadata
    const hasMandatoryNotPreferred =
      (preferences.company?.type === 'not_preferred' && preferences.company.isMandatory) ||
      (preferences.site?.type === 'not_preferred' && preferences.site.isMandatory) ||
      (preferences.client?.type === 'not_preferred' && preferences.client.isMandatory);

    const hasNotPreferred =
      (preferences.company?.type === 'not_preferred' && !preferences.company.isMandatory) ||
      (preferences.site?.type === 'not_preferred' && !preferences.site.isMandatory) ||
      (preferences.client?.type === 'not_preferred' && !preferences.client.isMandatory) ||
      hasRegularUserConflict;

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

    const sortPriority = hasTimeOffConflict
      ? 3000 // Time-off conflicts have highest priority
      : hasScheduleConflict
        ? 2000 // Schedule conflicts sort last
        : hasMandatoryNotPreferred
          ? 1000
          : preferredCount > 0
            ? -preferredCount // Preferred workers always come first (negative values sort first)
            : hasNotPreferred
              ? 500
              : 0;

    return {
      ...emp,
      preferences,
      hasMandatoryNotPreferred,
      hasNotPreferred,
      hasPreferred: preferredCount > 0,
      hasScheduleConflict,
      hasBlockingScheduleConflict,
      conflictInfo,
      userPreferenceConflicts: allUserPreferenceConflicts,
      hasMandatoryUserConflict,
      hasRegularUserConflict,
      hasTimeOffConflict,
      timeOffConflicts,
      preferredCount,
      preferenceIndicators,
      certifications: emp.certifications,
      sortPriority,
    };
  };

  // Check conflicts for a specific employee
  const checkEmployeeConflicts = (
    employee: IEnhancedEmployee & WorkerConflictData,
    currentPosition?: string
  ): ConflictCheckResult => {
    let shouldShowScheduleDialog = false;
    let scheduleConflicts: ScheduleConflict[] = [];

    // First check for 8-hour gap violations (these have special dialog handling)
    if (employee.hasScheduleConflict) {
      const workerConflicts = conflictsByWorkerId[employee.value] || [];
      const conflictAnalysis = analyzeScheduleConflicts(workerConflicts);
      
      // Handle 8-hour gap violations first (these get their own special dialog)
      if (conflictAnalysis.gapViolations.length > 0) {
        shouldShowScheduleDialog = true;
        scheduleConflicts = workerConflicts;
        return {
          allIssues: [],
          hasMandatoryIssues: false,
          canProceed: true,
          warningType: 'schedule_conflict',
          shouldShowScheduleDialog,
          scheduleConflicts,
        };
      }
    }

    // Now collect all other potential issues for the regular warning dialog
    const allIssues: string[] = [];
    let hasMandatoryIssues = false;
    let canProceed = true;
    let warningType: 'not_preferred' | 'mandatory_not_preferred' | 'worker_conflict' | 'schedule_conflict' | 'time_off_conflict' | 'certification_issues' | 'multiple_issues' = 'not_preferred';

    // Check for certification issues based on position
    const { tcpStatus, driverLicenseStatus } = employee.certifications || {};

    // Always check TCP Certification (required for both TCP and LCT positions)
    if (!tcpStatus?.hasCertification) {
      allIssues.push('No TCP Certification');
    } else if (!tcpStatus.isValid) {
      allIssues.push('TCP Certification is expired');
    } else if (tcpStatus.isExpiringSoon) {
      allIssues.push(`TCP Certification expires in ${tcpStatus.daysRemaining} ${tcpStatus.daysRemaining === 1 ? 'day' : 'days'}`);
    }

    // Check Driver License only for LCT position
    if (currentPosition?.toLowerCase() === 'lct') {
      if (!driverLicenseStatus?.hasLicense) {
        allIssues.push('No Driver License');
      } else if (!driverLicenseStatus.isValid) {
        allIssues.push('Driver License is expired');
      } else if (driverLicenseStatus.isExpiringSoon) {
        allIssues.push(`Driver License expires in ${driverLicenseStatus.daysRemaining} ${driverLicenseStatus.daysRemaining === 1 ? 'day' : 'days'}`);
      }
    }

    // Check for time-off conflicts
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

            return `${formattedType} ${conflict.status} ${dateRange}`;
          })
          .join(', ') || 'Worker has a time-off request during this period';

      allIssues.push(timeOffInfo);
      hasMandatoryIssues = true;
      canProceed = false;
    }

    // Check for direct schedule overlaps (gap violations already handled above)
    if (employee.hasScheduleConflict) {
      const workerConflicts = conflictsByWorkerId[employee.value] || [];
      const conflictAnalysis = analyzeScheduleConflicts(workerConflicts);
      
      // Handle direct overlaps (these are mandatory blocks)
      if (conflictAnalysis.directOverlaps.length > 0) {
        // Create detailed conflict information
        const conflicts = conflictAnalysis.directOverlaps;
        if (conflicts.length === 1) {
          const conflict = conflicts[0];
          const jobNumber = conflict.job_number || conflict.job_id?.slice(-8) || 'Unknown';
          const startTime = dayjs(conflict.scheduled_start_time).format('MMM D, YYYY h:mm A');
          const endTime = dayjs(conflict.scheduled_end_time).format('MMM D, h:mm A');
          const siteName = conflict.site_name || 'Unknown Site';
          const clientName = conflict.client_name || 'Unknown Client';
          
          const conflictInfo = `Schedule Conflict: Job #${jobNumber} at ${siteName} (${clientName})\n${startTime} to ${endTime}`;
          allIssues.push(conflictInfo);
        } else {
          const conflictInfo = `Schedule Conflict: ${conflicts.length} overlapping jobs detected`;
          allIssues.push(conflictInfo);
        }
        hasMandatoryIssues = true;
        canProceed = false;
      }
    }

    // Check for mandatory not-preferred
    if (employee.hasMandatoryNotPreferred) {
      hasMandatoryIssues = true;
      canProceed = false;

      if (
        employee.preferences.company?.type === 'not_preferred' &&
        employee.preferences.company.isMandatory
      ) {
        const reason = employee.preferences.company.reason || 'No reason';
        const companyName = currentCompany?.name || 'Company';
        allIssues.push(`${companyName} (Mandatory): ${reason}`);
      }
      if (
        employee.preferences.site?.type === 'not_preferred' &&
        employee.preferences.site.isMandatory
      ) {
        const reason = employee.preferences.site.reason || 'No reason';
        const siteName = currentSite?.name || 'Site';
        allIssues.push(`${siteName} (Mandatory): ${reason}`);
      }
      if (
        employee.preferences.client?.type === 'not_preferred' &&
        employee.preferences.client.isMandatory
      ) {
        const reason = employee.preferences.client.reason || 'No reason';
        const clientName = currentClient?.name || 'Client';
        allIssues.push(`${clientName} (Mandatory): ${reason}`);
      }
    }
    
    // Check for user preference conflicts (these are warnings, not mandatory)
    if (employee.hasRegularUserConflict || employee.hasMandatoryUserConflict) {
      const allUserConflicts = employee.userPreferenceConflicts || [];
      allUserConflicts.forEach((pref: any) => {
        if (pref.employee_id === employee.value) {
          // Someone else marked this worker as not preferred
          const userWhoSetPreference = employeeOptions.find((emp: any) => emp.value === pref.user_id);
          const conflictingWorkerName =
            userWhoSetPreference?.label ||
            pref.user?.display_name ||
            `${pref.user?.first_name} ${pref.user?.last_name}` ||
            'Unknown Worker';
          const reason = pref.reason || 'No reason provided';
          allIssues.push(`${conflictingWorkerName} has marked this worker as not preferred: ${reason}`);
        } else if (pref.user_id === employee.value) {
          // This worker marked someone else as not preferred
          const conflictingWorkerName =
            pref.employee?.display_name ||
            `${pref.employee?.first_name} ${pref.employee?.last_name}` ||
            'Unknown Worker';
          const reason = pref.reason || 'No reason provided';
          allIssues.push(`This worker has marked ${conflictingWorkerName} as not preferred: ${reason}`);
        }
      });
    }
    
    // Check for regular not-preferred
    if (employee.hasNotPreferred) {
      if (
        employee.preferences.company?.type === 'not_preferred' &&
        !employee.preferences.company.isMandatory
      ) {
        const reason = employee.preferences.company.reason || 'No reason';
        const companyName = currentCompany?.name || 'Company';
        allIssues.push(`${companyName}: ${reason}`);
      }
      if (
        employee.preferences.site?.type === 'not_preferred' &&
        !employee.preferences.site.isMandatory
      ) {
        const reason = employee.preferences.site.reason || 'No reason';
        const siteName = currentSite?.name || 'Site';
        allIssues.push(`${siteName}: ${reason}`);
      }
      if (
        employee.preferences.client?.type === 'not_preferred' &&
        !employee.preferences.client.isMandatory
      ) {
        const reason = employee.preferences.client.reason || 'No reason';
        const clientName = currentClient?.name || 'Client';
        allIssues.push(`${clientName}: ${reason}`);
      }
    }

    // Determine warning type based on the most severe issue
    if (allIssues.some(issue => issue.includes('time-off') || issue.includes('Time-Off') || issue.includes('pending:') || issue.includes('approved:') || issue.includes('rejected:'))) {
      warningType = 'time_off_conflict';
    } else if (hasMandatoryIssues) {
      warningType = 'mandatory_not_preferred';
    } else if (allIssues.some(issue => issue.includes('schedule') || issue.includes('scheduled'))) {
      warningType = 'schedule_conflict';
    } else if (allIssues.some(issue => issue.includes('conflict'))) {
      warningType = 'worker_conflict';
    } else if (allIssues.some(issue => issue.includes('TCP') || issue.includes('Driver'))) {
      warningType = 'certification_issues';
    } else {
      warningType = 'not_preferred';
    }
    
    // Recalculate canProceed based on final state
    if (hasMandatoryIssues) {
      canProceed = false;
    } else {
      canProceed = true;
    }

    return {
      allIssues,
      hasMandatoryIssues,
      canProceed,
      warningType,
      shouldShowScheduleDialog,
      scheduleConflicts,
    };
  };

  return {
    enhanceEmployeeWithConflicts,
    checkEmployeeConflicts,
    conflictsByWorkerId,
    workerSchedules,
    timeOffRequests,
  };
}
