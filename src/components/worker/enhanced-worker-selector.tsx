import type { ScheduleConflict } from 'src/utils/schedule-conflict';
import type { IEnhancedEmployee, IWorkerWarningDialog } from 'src/types/preference';
import type { AutocompleteWithAvatarOption } from 'src/components/hook-form/rhf-autocomplete-with-avatar';

import React, { useMemo, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';

import { Field } from 'src/components/hook-form';
import { WorkerWarningDialog } from 'src/components/preference/worker-warning-dialog';
import { EnhancedPreferenceIndicators } from 'src/components/preference/enhanced-preference-indicators';

import { ScheduleConflictDialog } from 'src/sections/work/job/schedule-conflict-dialog';

import { type WorkerConflictData, useWorkerConflictChecker } from './worker-conflict-checker';

// ----------------------------------------------------------------------

interface EnhancedWorkerSelectorProps {
  workerFieldNames: Record<string, string>;
  employeeOptions: any[];
  position: string;
  viewAllWorkers?: boolean;
  currentWorkerIndex?: number;
  disabled?: boolean;
  onWorkerSelect?: (worker: any) => void;
}

export function EnhancedWorkerSelector({
  workerFieldNames,
  employeeOptions,
  position: currentPosition,
  viewAllWorkers = false,
  currentWorkerIndex,
  disabled = false,
  onWorkerSelect,
}: EnhancedWorkerSelectorProps) {
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

  const [scheduleConflictDialog, setScheduleConflictDialog] = useState({
    open: false,
    workerName: '',
    workerPhotoUrl: '',
    conflicts: [] as ScheduleConflict[],
  });

  // Get current values
  const workers = useMemo(() => watch('workers') || [], [watch]);
  const currentEmployeeId = watch(workerFieldNames.id);
  const thisWorkerIndex = currentWorkerIndex ?? Number(workerFieldNames.id.match(/workers\[(\d+)\]\.id/)?.[1] ?? -1);

  // Get current company, site, and client for preference fetching
  const currentCompany = getValues('company');
  const currentSite = getValues('site');
  const currentClient = getValues('client');
  const jobStartDateTime = watch('start_date_time');
  const jobEndDateTime = watch('end_date_time');
  const currentJobId = watch('id');

  // Use the shared conflict checker
  const { enhanceEmployeeWithConflicts, checkEmployeeConflicts } = useWorkerConflictChecker({
    jobStartDateTime,
    jobEndDateTime,
    currentJobId,
    currentCompany,
    currentSite,
    currentClient,
    workers,
    employeeOptions,
  });

  // Collect already picked employee IDs
  const pickedEmployeeIds = workers
    .map((w: any, idx: number) => (idx !== thisWorkerIndex ? w.id : null))
    .filter(Boolean);

  // Enhanced employee options with preference metadata
  const enhancedOptions: (IEnhancedEmployee & WorkerConflictData)[] = useMemo(
    () =>
      employeeOptions
        .filter((emp) => {
          // Only filter out already picked employees - allow any position
          const alreadyPicked = pickedEmployeeIds.includes(emp.value);
          return !alreadyPicked;
        })
        .map((emp) => enhanceEmployeeWithConflicts(emp, currentPosition, pickedEmployeeIds))
        .sort((a, b) => a.sortPriority - b.sortPriority),
    [
      employeeOptions,
      currentPosition,
      pickedEmployeeIds,
      enhanceEmployeeWithConflicts,
    ]
  );

  // Filter options based on viewAll setting
  const filteredOptions = useMemo(() => {
    if (viewAllWorkers) {
      return enhancedOptions;
    }
    
    // Hide mandatory not-preferred, time-off conflicts, and direct overlaps by default
    const filtered = enhancedOptions.filter(
      (emp) => 
        !emp.hasMandatoryNotPreferred && 
        !emp.hasTimeOffConflict && 
        !emp.hasBlockingScheduleConflict
    );

    return filtered;
  }, [enhancedOptions, viewAllWorkers]);
  
  // Get the currently selected employee option (check filteredOptions first, then enhancedOptions if already selected)
  const selectedEmployeeOption = currentEmployeeId
    ? filteredOptions.find((emp) => emp.value === currentEmployeeId) ||
      enhancedOptions.find((emp) => emp.value === currentEmployeeId) ||
      null
    : null;

  // Get error for this worker's id
  let employeeError = undefined;
  const match = workerFieldNames.id.match(/workers\[(\d+)\]\.id/);
  if (match) {
    const idx = Number(match[1]);
    const workerErrors = errors?.workers as unknown as any[];
    employeeError = workerErrors?.[idx]?.id?.message;
  }

  // Handle employee selection with preference checking
  const handleEmployeeSelect = (employee: (IEnhancedEmployee & WorkerConflictData) | null) => {
    if (!employee) {
      // Clear selection
      setValue(workerFieldNames.id, '');
      setValue(workerFieldNames.first_name, '');
      setValue(workerFieldNames.last_name, '');
      setValue(workerFieldNames.photo_url, '');
      if (thisWorkerIndex >= 0) {
        setValue(`workers[${thisWorkerIndex}].email`, '');
        setValue(`workers[${thisWorkerIndex}].phone_number`, '');
        setValue(`workers[${thisWorkerIndex}].status`, 'draft');
      }
      return;
    }

    // Check conflicts using the shared checker
    const conflictResult = checkEmployeeConflicts(employee, currentPosition);

    // Handle 8-hour gap violations (show schedule conflict dialog)
    if (conflictResult.shouldShowScheduleDialog) {
      setScheduleConflictDialog({
        open: true,
        workerName: employee.label,
        workerPhotoUrl: employee.photo_url,
        conflicts: conflictResult.scheduleConflicts || [],
      });
      return;
    }

    // Show comprehensive warning if there are any issues
    // But allow proceeding even for certification issues (since cross-position selection is allowed)
    if (conflictResult.allIssues.length > 0) {
      console.log('[ENHANCED WORKER SELECTOR] Showing warning dialog:', {
        employeeName: employee.label,
        canProceed: conflictResult.canProceed,
        hasMandatoryIssues: conflictResult.hasMandatoryIssues,
        warningType: conflictResult.warningType
      });
      
      setWorkerWarning({
        open: true,
        employee: {
          name: employee.label,
          id: employee.value,
          photo_url: employee.photo_url,
        },
        warningType: conflictResult.warningType,
        reasons: conflictResult.allIssues,
        isMandatory: conflictResult.hasMandatoryIssues,
        canProceed: conflictResult.canProceed, // Use the actual canProceed from conflict checker
        workerFieldNames,
      });
      return;
    }

    // No warnings, proceed with selection
    proceedWithSelection(employee);
  };

  const proceedWithSelection = (employee: IEnhancedEmployee & WorkerConflictData) => {
    // Set basic worker info
    setValue(workerFieldNames.id, employee.value);
    setValue(workerFieldNames.first_name, employee.first_name);
    setValue(workerFieldNames.last_name, employee.last_name);
    setValue(workerFieldNames.photo_url, employee.photo_url);
    
    if (thisWorkerIndex >= 0) {
      setValue(`workers[${thisWorkerIndex}].email`, employee.email || '');
      setValue(`workers[${thisWorkerIndex}].phone_number`, employee.phone_number || '');
      setValue(`workers[${thisWorkerIndex}].status`, 'draft');
    }

    // Set default times
    const jobStartTime = getValues('start_date_time');
    const jobEndTime = getValues('end_date_time');
    setValue(workerFieldNames.start_time, jobStartTime);
    setValue(workerFieldNames.end_time, jobEndTime);

    // Call optional callback
    if (onWorkerSelect) {
      onWorkerSelect(employee);
    }
  };

  const handleWarningConfirm = () => {
    if (!workerWarning.canProceed) {
      // Cannot proceed - clear the worker selection
      setValue(workerFieldNames.id, '');
      setValue(workerFieldNames.first_name, '');
      setValue(workerFieldNames.last_name, '');
      setValue(workerFieldNames.photo_url, '');
      if (thisWorkerIndex >= 0) {
        setValue(`workers[${thisWorkerIndex}].email`, '');
        setValue(`workers[${thisWorkerIndex}].phone_number`, '');
        setValue(`workers[${thisWorkerIndex}].status`, 'draft');
      }
    } else {
      // Can proceed - find the employee in enhancedOptions (to support any position)
      const employee = enhancedOptions.find((emp) => emp.value === workerWarning.employee.id);
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
      if (thisWorkerIndex >= 0) {
        setValue(`workers[${thisWorkerIndex}].email`, '');
        setValue(`workers[${thisWorkerIndex}].phone_number`, '');
        setValue(`workers[${thisWorkerIndex}].status`, 'draft');
      }
    }
    setWorkerWarning((prev) => ({ ...prev, open: false }));
  };

  const handleScheduleConflictCancel = () => {
    setScheduleConflictDialog((prev) => ({ ...prev, open: false }));
  };

  const handleScheduleConflictProceed = (acknowledgeWarnings: boolean) => {
    // Find the employee and proceed with selection
    const employee = employeeOptions.find((emp: any) => emp.label === scheduleConflictDialog.workerName);
    if (employee) {
      const enhancedEmployee = enhanceEmployeeWithConflicts(employee, currentPosition, pickedEmployeeIds);
      proceedWithSelection(enhancedEmployee);
      
      // If there were warnings acknowledged, set status appropriately
      if (acknowledgeWarnings && thisWorkerIndex >= 0) {
        setValue(`workers[${thisWorkerIndex}].status`, 'draft');
      }
    }
    setScheduleConflictDialog((prev) => ({ ...prev, open: false }));
  };

  return (
    <>
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
              disabled ||
              !currentPosition ||
              (thisWorkerIndex >= 0 && (
                workers[thisWorkerIndex]?.status === 'accepted' ||
                workers[thisWorkerIndex]?.status === 'pending'
              )) ||
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
                handleEmployeeSelect(value as IEnhancedEmployee & WorkerConflictData);
              } else {
                handleEmployeeSelect(null);
              }
            }}
            renderOption={(props, option) => {
              const enhancedOption = option as IEnhancedEmployee & WorkerConflictData;
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
                        {enhancedOption.hasBlockingScheduleConflict && (
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ fontWeight: 'medium' }}
                          >
                            {enhancedOption.hasUnavailabilityConflict ? '(Unavailable)' : '(Schedule Conflict)'}
                          </Typography>
                        )}
                        {enhancedOption.hasScheduleConflict && !enhancedOption.hasBlockingScheduleConflict && (
                          <Typography
                            variant="caption"
                            color="warning"
                            sx={{ fontWeight: 'medium' }}
                          >
                            (8-Hour Gap)
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

      <WorkerWarningDialog
        warning={workerWarning}
        onClose={handleWarningCancel}
        onConfirm={handleWarningConfirm}
        onCancel={handleWarningCancel}
      />

      <ScheduleConflictDialog
        open={scheduleConflictDialog.open}
        onClose={handleScheduleConflictCancel}
        onProceed={handleScheduleConflictProceed}
        workerName={scheduleConflictDialog.workerName}
        workerPhotoUrl={scheduleConflictDialog.workerPhotoUrl}
        conflicts={scheduleConflictDialog.conflicts}
        newJobStartTime={getValues('start_date_time')}
        newJobEndTime={getValues('end_date_time')}
        newJobSiteName={getValues('site')?.name}
        newJobClientName={getValues('client')?.name}
      />
    </>
  );
}

