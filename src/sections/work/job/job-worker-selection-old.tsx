import type { IEnhancedEmployee } from 'src/types/preference';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormContext } from 'react-hook-form';

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';

import { analyzeScheduleConflicts } from 'src/utils/schedule-conflict';

import { fetcher, endpoints } from 'src/lib/axios';

import { PreferenceIndicators } from 'src/components/preference/preference-indicators';

// ----------------------------------------------------------------------

interface WorkerSelectionProps {
  currentWorkerIndex: number;
  employeeOptions: any[];
  onEmployeeSelect: (employee: IEnhancedEmployee | null) => void;
  selectedEmployeeId?: string;
}

export function WorkerSelection({
  currentWorkerIndex,
  employeeOptions,
  onEmployeeSelect,
  selectedEmployeeId,
}: WorkerSelectionProps) {
  const { getValues } = useFormContext();
  const [viewAllWorkers, setViewAllWorkers] = useState(false);
  const [selectedWorkerForConflict, setSelectedWorkerForConflict] = useState<any>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  // Get current company, site, and client IDs for preference fetching
  const currentCompany = getValues('company');
  const currentSite = getValues('site');
  const currentClient = getValues('client');

  // Fetch preferences for filtering
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

  // Get job dates for time-off conflict checking
  const startDateTime = getValues('start_date_time');
  const endDateTime = getValues('end_date_time');

  // Fetch time-off requests that might conflict with job dates
  const { data: timeOffRequests = [] } = useQuery({
    queryKey: ['time-off-conflicts', startDateTime, endDateTime],
    queryFn: async () => {
      if (!startDateTime || !endDateTime) return [];

      // Format dates for API call
      const startDate = new Date(startDateTime).toISOString().split('T')[0];
      const endDate = new Date(endDateTime).toISOString().split('T')[0];

      const response = await fetcher(
        `/api/time-off/admin/all?start_date=${startDate}&end_date=${endDate}`
      );

      return response.data?.timeOffRequests || [];
    },
    enabled: !!startDateTime && !!endDateTime,
  });

  // Fetch schedule conflicts for 8-hour gap checking
  const { data: scheduleConflicts = { scheduledWorkers: [], gap_checking_enabled: true } } = useQuery({
    queryKey: [
      'worker-schedule-conflicts',
      startDateTime ? dayjs(startDateTime).toISOString() : null,
      endDateTime ? dayjs(endDateTime).toISOString() : null,
    ],
    queryFn: async () => {
      try {
        if (!startDateTime || !endDateTime) {
          return { scheduledWorkers: [], gap_checking_enabled: true };
        }

        const startISO = dayjs(startDateTime).toISOString();
        const endISO = dayjs(endDateTime).toISOString();
        const url = `${endpoints.work.job}/check-availability?start_time=${encodeURIComponent(startISO)}&end_time=${encodeURIComponent(endISO)}&check_gap=true`;

        const response = await fetcher(url);

        return {
          scheduledWorkers: response?.scheduledWorkers || [],
          gap_checking_enabled: response?.gap_checking_enabled ?? true,
        };
      } catch (error) {
        console.warn('Schedule conflict checking failed:', error);
        return { scheduledWorkers: [], gap_checking_enabled: true };
      }
    },
    enabled: !!startDateTime && !!endDateTime,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Enhanced employee options with preference metadata and time-off conflicts
  const enhancedEmployeeOptions = useMemo(
    () =>
      employeeOptions
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

          // Check for time-off conflicts
          const timeOffConflicts = (Array.isArray(timeOffRequests) ? timeOffRequests : []).filter((request: any) => {
            // Only check pending and approved requests
            if (!['pending', 'approved'].includes(request.status)) return false;

            // Check if this request belongs to the current employee
            if (request.user_id !== emp.value) return false;

            // Check if the time-off request dates overlap with the job dates
            // Normalize dates to compare only the date part (remove time component)
            const jobStartDate = new Date(startDateTime);
            const jobEndDate = new Date(endDateTime);
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

          // Check for schedule conflicts (8-hour gap violations and overlaps)
          const workerScheduleConflicts = (scheduleConflicts?.scheduledWorkers || []).filter(
            (conflict: any) => conflict.user_id === emp.value
          );
          const hasScheduleConflict = workerScheduleConflicts.length > 0;
          
          let scheduleConflictInfo = null;
          let hasBlockingScheduleConflict = false;
          if (hasScheduleConflict) {
            const conflictAnalysis = analyzeScheduleConflicts(workerScheduleConflicts);
            hasBlockingScheduleConflict = conflictAnalysis.directOverlaps.length > 0;
            scheduleConflictInfo = {
              directOverlaps: conflictAnalysis.directOverlaps.length,
              gapViolations: conflictAnalysis.gapViolations.length,
              totalConflicts: conflictAnalysis.totalConflicts,
              conflicts: workerScheduleConflicts,
            };
          }

          // Build preference metadata
          const preferences = {
            company: companyPref
              ? {
                  type: companyPref.preference_type,
                  isMandatory: companyPref.is_mandatory || false,
                  reason: companyPref.reason,
                }
              : null,
            site: sitePref
              ? {
                  type: sitePref.preference_type,
                  isMandatory: sitePref.is_mandatory || false,
                  reason: sitePref.reason,
                }
              : null,
            client: clientPref
              ? {
                  type: clientPref.preference_type,
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
            (preferences.client?.type === 'not_preferred' && !preferences.client.isMandatory);

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

          // Determine background color with priority: time-off > direct overlap > mandatory not-preferred > gap violations > regular not-preferred > preferred
          let backgroundColor: 'success' | 'warning' | 'error' | 'default' = 'default';
          if (hasTimeOffConflict) {
            backgroundColor = 'error'; // Time-off conflicts have highest priority
          } else if (scheduleConflictInfo && scheduleConflictInfo.directOverlaps > 0) {
            backgroundColor = 'error'; // Direct overlaps prevent assignment
          } else if (hasMandatoryNotPreferred) {
            backgroundColor = 'error'; // Mandatory not-preferred
          } else if (scheduleConflictInfo && scheduleConflictInfo.gapViolations > 0) {
            backgroundColor = 'warning'; // 8-hour gap violations are warnings
          } else if (hasNotPreferred) {
            backgroundColor = 'warning'; // Regular not-preferred
          } else if (preferredCount > 0) {
            backgroundColor = 'success'; // Preferred workers
          }

          return {
            ...emp,
            preferences,
            hasMandatoryNotPreferred,
            hasNotPreferred,
            hasPreferred: preferredCount > 0,
            preferredCount,
            preferenceIndicators,
            backgroundColor,
            hasTimeOffConflict,
            timeOffConflicts,
            hasScheduleConflict,
            hasBlockingScheduleConflict,
            scheduleConflictInfo,
            sortPriority: hasTimeOffConflict
              ? 2000 // Time-off conflicts sorted last
              : (scheduleConflictInfo && scheduleConflictInfo.directOverlaps > 0)
                ? 1900 // Direct overlaps sorted after time-off
                : hasMandatoryNotPreferred
                  ? 1000
                  : preferredCount > 0
                    ? -preferredCount // Preferred workers always come first (negative values sort first)
                    : (scheduleConflictInfo && scheduleConflictInfo.gapViolations > 0)
                      ? 800 // Gap violations after preferred workers
                      : hasNotPreferred
                        ? 500
                        : 0,
          };
        })
        .sort((a: any, b: any) => a.sortPriority - b.sortPriority),
    [employeeOptions, companyPreferences, sitePreferences, clientPreferences, timeOffRequests, scheduleConflicts, startDateTime, endDateTime]
  );

  // Filter options based on viewAll setting
  const filteredOptions = useMemo(() => {
    if (viewAllWorkers) {
      return enhancedEmployeeOptions;
    }
    
    // Hide mandatory not-preferred, time-off conflicts, and direct overlaps by default
    const filtered = enhancedEmployeeOptions.filter(
      (emp) => 
        !emp.hasMandatoryNotPreferred && 
        !emp.hasTimeOffConflict && 
        !(emp.scheduleConflictInfo && emp.scheduleConflictInfo.directOverlaps > 0)
    );

    return filtered;
  }, [enhancedEmployeeOptions, viewAllWorkers]);

  const handleWorkerClick = (emp: any) => {
    // Check if worker has blocking conflicts (time-off or direct overlaps)
    const hasBlockingConflicts = emp.hasTimeOffConflict || (emp.scheduleConflictInfo && emp.scheduleConflictInfo.directOverlaps > 0);
    
    if (hasBlockingConflicts && viewAllWorkers) {
      // Show conflict dialog for workers with blocking conflicts
      setSelectedWorkerForConflict(emp);
      setShowConflictDialog(true);
    } else if (!hasBlockingConflicts) {
      // Normal selection for workers without blocking conflicts
      // Note: Workers with gap violations will be handled by the enhanced worker item component
      onEmployeeSelect(emp);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedWorkerForConflict) {
      onEmployeeSelect(selectedWorkerForConflict);
    }
    setShowConflictDialog(false);
    setSelectedWorkerForConflict(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ color: 'text.disabled' }}>
          Workers:
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={viewAllWorkers}
              onChange={(e) => setViewAllWorkers(e.target.checked)}
              size="small"
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              View All
            </Typography>
          }
        />
      </Box>

      {/* Display employee options with preference indicators */}
      <Box>
        {filteredOptions.map((emp) => (
          <Box
            key={emp.value}
            onClick={() => handleWorkerClick(emp)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1,
              borderRadius: 1,
              cursor: ((emp.hasTimeOffConflict || emp.scheduleConflictInfo?.directOverlaps > 0) && !viewAllWorkers) ? 'not-allowed' : 'pointer',
              backgroundColor:
                emp.backgroundColor === 'success'
                  ? 'success.lighter'
                  : emp.backgroundColor === 'warning'
                    ? 'warning.lighter'
                    : emp.backgroundColor === 'error'
                      ? 'error.lighter'
                      : 'transparent',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <Typography variant="body2">{emp.label}</Typography>
            <PreferenceIndicators indicators={emp.preferenceIndicators} />

            {/* Time-off conflict indicator */}
            {emp.hasTimeOffConflict && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.25,
                  borderRadius: 0.5,
                  backgroundColor: 'error.main',
                  color: 'error.contrastText',
                }}
              >
                <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                  TIME OFF
                </Typography>
              </Box>
            )}

            {/* Schedule conflict indicators */}
            {emp.scheduleConflictInfo?.directOverlaps > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.25,
                  borderRadius: 0.5,
                  backgroundColor: 'error.main',
                  color: 'error.contrastText',
                }}
              >
                <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                  OVERLAP
                </Typography>
              </Box>
            )}

            {emp.scheduleConflictInfo?.gapViolations > 0 && !emp.scheduleConflictInfo?.directOverlaps && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.25,
                  borderRadius: 0.5,
                  backgroundColor: 'warning.main',
                  color: 'warning.contrastText',
                }}
              >
                <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                  8HR GAP
                </Typography>
              </Box>
            )}
          </Box>
        ))}
      </Box>

      {/* Time-off conflict dialog */}
      <Dialog
        open={showConflictDialog}
        onClose={() => setShowConflictDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Time-Off Conflict Warning</DialogTitle>
        <DialogContent>
          {selectedWorkerForConflict && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>{selectedWorkerForConflict.label}</strong> has the following time-off
                request(s) during this job period:
              </Typography>

              {selectedWorkerForConflict.timeOffConflicts?.map((conflict: any, index: number) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    mb: 1,
                    borderRadius: 1,
                    backgroundColor: 'error.lighter',
                    border: '1px solid',
                    borderColor: 'error.main',
                  }}
                >
                  <Typography variant="subtitle2" color="error.main">
                    {conflict.type?.charAt(0).toUpperCase() +
                      conflict.type?.slice(1).replace('_', ' ')}{' '}
                    - {conflict.status}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Date:</strong> {dayjs(conflict.start_date).tz('America/Los_Angeles').format('MMM D, YYYY')}
                    {conflict.start_date !== conflict.end_date &&
                      ` - ${dayjs(conflict.end_date).tz('America/Los_Angeles').format('MMM D, YYYY')}`}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Reason:</strong> {conflict.reason}
                  </Typography>
                </Box>
              ))}

              <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
                Assigning this worker may cause scheduling conflicts. Are you sure you want to
                proceed?
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConflictDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirmSelection} color="warning" variant="contained">
            Assign Anyway
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default WorkerSelection;
