import type { IEnhancedEmployee } from 'src/types/preference';

import React, { useMemo, useState } from 'react';
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

import { PreferenceIndicators } from 'src/components/preference/preference-indicators';
import { type WorkerConflictData, useWorkerConflictChecker } from 'src/components/worker';

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
  const startDateTime = getValues('start_date_time');
  const endDateTime = getValues('end_date_time');
  const currentJobId = getValues('id');
  const workers = getValues('workers') || [];

  // Use the shared conflict checker
  const { enhanceEmployeeWithConflicts } = useWorkerConflictChecker({
    jobStartDateTime: startDateTime,
    jobEndDateTime: endDateTime,
    currentJobId,
    currentCompany,
    currentSite,
    currentClient,
    workers,
    employeeOptions,
  });

  // Enhanced employee options with preference metadata and conflicts
  const enhancedEmployeeOptions = useMemo(
    () =>
      employeeOptions
        .map((emp) => enhanceEmployeeWithConflicts(emp))
        .sort((a: any, b: any) => a.sortPriority - b.sortPriority),
    [employeeOptions, enhanceEmployeeWithConflicts]
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
        !emp.hasBlockingScheduleConflict
    );

    return filtered;
  }, [enhancedEmployeeOptions, viewAllWorkers]);

  const handleWorkerClick = (emp: IEnhancedEmployee & WorkerConflictData) => {
    // Check if worker has blocking conflicts (time-off or direct overlaps)
    const hasBlockingConflicts = emp.hasTimeOffConflict || emp.hasBlockingScheduleConflict;
    
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
        {filteredOptions.map((emp) => {
          // Determine background color with priority: time-off > direct overlap > mandatory not-preferred > gap violations > regular not-preferred > preferred
          let backgroundColor: 'success' | 'warning' | 'error' | 'default' = 'default';
          if (emp.hasTimeOffConflict) {
            backgroundColor = 'error'; // Time-off conflicts have highest priority
          } else if (emp.hasBlockingScheduleConflict) {
            backgroundColor = 'error'; // Direct overlaps prevent assignment
          } else if (emp.hasMandatoryNotPreferred) {
            backgroundColor = 'error'; // Mandatory not-preferred
          } else if (emp.hasScheduleConflict && !emp.hasBlockingScheduleConflict) {
            backgroundColor = 'warning'; // 8-hour gap violations are warnings
          } else if (emp.hasNotPreferred) {
            backgroundColor = 'warning'; // Regular not-preferred
          } else if (emp.hasPreferred) {
            backgroundColor = 'success'; // Preferred workers
          }

          return (
            <Box
              key={emp.value}
              onClick={() => handleWorkerClick(emp)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                borderRadius: 1,
                cursor: ((emp.hasTimeOffConflict || emp.hasBlockingScheduleConflict) && !viewAllWorkers) ? 'not-allowed' : 'pointer',
                backgroundColor:
                  backgroundColor === 'success'
                    ? 'success.lighter'
                    : backgroundColor === 'warning'
                      ? 'warning.lighter'
                      : backgroundColor === 'error'
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
              {emp.hasBlockingScheduleConflict && (
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

              {emp.hasScheduleConflict && !emp.hasBlockingScheduleConflict && (
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
          );
        })}
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


