import type { IEnhancedEmployee } from 'src/types/preference';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';

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

      return response.data || [];
    },
    enabled: !!startDateTime && !!endDateTime,
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
          const timeOffConflicts = timeOffRequests.filter((request: any) => {
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

          // Determine background color with time-off priority
          let backgroundColor: 'success' | 'warning' | 'error' | 'default' = 'default';
          if (hasTimeOffConflict) {
            backgroundColor = 'error'; // Time-off conflicts have highest priority
          } else if (preferredCount > 0) {
            backgroundColor = 'success';
          } else if (hasMandatoryNotPreferred) {
            backgroundColor = 'error';
          } else if (hasNotPreferred) {
            backgroundColor = 'warning';
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
            sortPriority: hasTimeOffConflict
              ? 2000 // Time-off conflicts sorted last
              : hasMandatoryNotPreferred
                ? 1000
                : hasNotPreferred
                  ? 500
                  : preferredCount > 0
                    ? -preferredCount
                    : 0,
          };
        })
        .sort((a: any, b: any) => a.sortPriority - b.sortPriority),
    [employeeOptions, companyPreferences, sitePreferences, clientPreferences, timeOffRequests, startDateTime, endDateTime]
  );

  // Filter options based on viewAll setting
  const filteredOptions = useMemo(() => {
    // Hide mandatory not-preferred and time-off conflicts by default
    const filtered = enhancedEmployeeOptions.filter(
      (emp) => !emp.hasMandatoryNotPreferred && !emp.hasTimeOffConflict
    );

    return filtered;
  }, [enhancedEmployeeOptions]);

  const handleWorkerClick = (emp: any) => {
    if (emp.hasTimeOffConflict && viewAllWorkers) {
      // Show conflict dialog for workers with time-off conflicts
      setSelectedWorkerForConflict(emp);
      setShowConflictDialog(true);
    } else if (!emp.hasTimeOffConflict) {
      // Normal selection for workers without conflicts
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
              cursor: emp.hasTimeOffConflict && !viewAllWorkers ? 'not-allowed' : 'pointer',
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
                    <strong>Date:</strong> {new Date(conflict.start_date).toLocaleDateString()}
                    {conflict.start_date !== conflict.end_date &&
                      ` - ${new Date(conflict.end_date).toLocaleDateString()}`}
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
