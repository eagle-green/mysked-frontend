import type { IJob } from 'src/types/job';
import type { ScheduleConflict } from 'src/utils/schedule-conflict';

import dayjs from 'dayjs';
import { useState } from 'react';
import timezone from 'dayjs/plugin/timezone';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { formatPhoneNumberSimple } from 'src/utils/format-number';
import { getPositionColor, getPositionLabel } from 'src/utils/format-role';

import { provinceList } from 'src/assets/data';
import { fetcher, endpoints } from 'src/lib/axios';
import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';
import { VEHICLE_TYPE_OPTIONS } from 'src/assets/data/vehicle';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { useWorkerConflictChecker } from 'src/components/worker';
import { WorkerWarningDialog } from 'src/components/preference/worker-warning-dialog';

import { ScheduleConflictDialog } from 'src/sections/work/job/schedule-conflict-dialog';

dayjs.extend(timezone);

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  job: IJob;
  onSuccess?: () => void;
};

export function JobBoardQuickEditDialog({ open, onClose, job, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [showAddWorkerForm, setShowAddWorkerForm] = useState(false);
  const [viewAllWorkers, setViewAllWorkers] = useState(false);
  const [timesheetManagerError, setTimesheetManagerError] = useState('');
  
  // Local state for timesheet manager to allow UI updates
  const [timesheetManagerId, setTimesheetManagerId] = useState(job.timesheet_manager_id);
  
  // Track workers that have been removed in the UI (not yet persisted)
  const [removedWorkerIds, setRemovedWorkerIds] = useState<Set<string>>(new Set());
  
  // Track newly added workers in the UI (not yet persisted)
  const [newWorkers, setNewWorkers] = useState<any[]>([]);
  
  // Track newly added vehicles in the UI (not yet persisted)
  const [newVehicles, setNewVehicles] = useState<any[]>([]);
  
  // New worker form state
  const [newWorker, setNewWorker] = useState<{
    position: string;
    employeeId: string;
    start_time: dayjs.Dayjs;
    end_time: dayjs.Dayjs;
  }>({
    position: '',
    employeeId: '',
    start_time: job.start_time ? dayjs(job.start_time) : dayjs(),
    end_time: job.end_time ? dayjs(job.end_time) : dayjs().add(8, 'hour'),
  });
  
  // Selected vehicles to add
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set());
  
  // Fetch vehicles for selected employee
  const { data: employeeVehicles } = useQuery({
    queryKey: ['employee-vehicles', newWorker.employeeId],
    queryFn: async () => {
      if (!newWorker.employeeId) return { vehicles: [] };
      const response = await fetcher(`${endpoints.management.vehicle}?operator_id=${newWorker.employeeId}`);
      return response.data;
    },
    enabled: !!newWorker.employeeId && showAddWorkerForm,
  });
  
  const availableVehicles = employeeVehicles?.vehicles || [];
  
  // Fetch employee list
  const { data: userListData } = useQuery({
    queryKey: ['users', 'job-creation'],
    queryFn: async () => {
      const response = await fetcher([`${endpoints.management.user}/job-creation`, { method: 'GET' }]);
      return response.data.users;
    },
    enabled: showAddWorkerForm,
  });
  
  // Employee options with role
  const employeeOptions = userListData
    ? userListData.map((user: any) => ({
        label: `${user.first_name} ${user.last_name}`,
        value: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        photo_url: user.photo_url || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        role: user.role || '', // Add role for filtering
      }))
    : [];
  
  // Get selected employee info for display
  const selectedEmployeeInfo = employeeOptions.find((opt: any) => opt.value === newWorker.employeeId);
  
  // Get the display workers (excluding removed ones, including new ones)
  const displayWorkers = [
    ...(job.workers || []).filter((worker: any) => !removedWorkerIds.has(worker.id)),
    ...newWorkers,
  ];
  
  // Use conflict checker - using job workers only for conflict check
  const { enhanceEmployeeWithConflicts, checkEmployeeConflicts } = useWorkerConflictChecker({
    jobStartDateTime: job.start_time ? String(job.start_time) : undefined,
    jobEndDateTime: job.end_time ? String(job.end_time) : undefined,
    currentJobId: job.id,
    currentCompany: job.company,
    currentSite: job.site,
    currentClient: job.client,
    workers: job.workers || [], // Only use existing job workers for conflict checking
    employeeOptions,
  });
  
  // Enhanced employee options with conflicts
  // First, get already assigned workers to exclude them
  const assignedWorkerIds = displayWorkers.map((w: any) => w.id).filter(Boolean);
  
  // Filter out already assigned workers (no position filtering - allow any role)
  const filteredByRole = employeeOptions.filter((emp: any) => {
    // Filter out already assigned workers
    if (assignedWorkerIds.includes(emp.value)) {
      return false;
    }
    
    // Allow all workers regardless of position/role
    return true;
  });
  
  // Enhance with conflict data
  const enhancedEmployeeOptions = filteredByRole.map((emp: any) => 
    enhanceEmployeeWithConflicts(emp, newWorker.position, assignedWorkerIds)
  );
  
  // Filter based on viewAll setting and sort by priority
  const filteredEmployeeOptions = (viewAllWorkers 
    ? enhancedEmployeeOptions 
    : enhancedEmployeeOptions.filter((emp: any) =>
        !emp.hasTimeOffConflict &&
        !emp.hasBlockingScheduleConflict &&
        !emp.hasMandatoryNotPreferred
      )
  ).sort((a: any, b: any) => (a.sortPriority || 0) - (b.sortPriority || 0));
  
  // Track worker warning dialog state (for mandatory restrictions, certifications, schedule conflicts)
  const [workerWarning, setWorkerWarning] = useState({
    open: false,
    employee: {
      name: '',
      id: '',
      photo_url: '',
    },
    warningType: 'not_preferred' as 'not_preferred' | 'mandatory_not_preferred' | 'worker_conflict' | 'schedule_conflict' | 'time_off_conflict' | 'certification_issues' | 'multiple_issues',
    reasons: [] as string[],
    isMandatory: false,
    canProceed: false,
  });
  
  // Track gap conflict dialog state (for 8-hour gap violations only)
  const [gapConflictDialog, setGapConflictDialog] = useState({
    open: false,
    workerName: '',
    workerPhotoUrl: '',
    conflicts: [] as ScheduleConflict[],
  });
  
  // Get the display vehicles (excluding those whose operators have been removed, including new ones)
  const displayVehicles = [
    ...(job.vehicles || []).filter(
      (vehicle: any) => !vehicle.operator || !removedWorkerIds.has(vehicle.operator.id)
    ),
    ...newVehicles,
  ];

  const handleUnassignWorker = (workerId: string) => {
    // Only remove from UI, don't persist yet
    setRemovedWorkerIds((prev) => new Set(prev).add(workerId));
  };
  
  const handleClose = () => {
    // Reset all changes when dialog closes
    setRemovedWorkerIds(new Set());
    setNewWorkers([]);
    setNewVehicles([]);
    setShowAddWorkerForm(false);
    setViewAllWorkers(false);
    onClose();
  };
  
  const handleAddWorker = () => {
    // Show add worker form
    setShowAddWorkerForm(true);
    setNewWorker({
      position: '',
      employeeId: '',
      start_time: job.start_time ? dayjs(job.start_time) : dayjs(),
      end_time: job.end_time ? dayjs(job.end_time) : dayjs().add(8, 'hour'),
    });
    setSelectedVehicles(new Set());
  };
  
  const handleCancelAddWorker = () => {
    setShowAddWorkerForm(false);
    setNewWorker({
      position: '',
      employeeId: '',
      start_time: job.start_time ? dayjs(job.start_time) : dayjs(),
      end_time: job.end_time ? dayjs(job.end_time) : dayjs().add(8, 'hour'),
    });
    setSelectedVehicles(new Set());
  };
  
  const handleVehicleToggle = (vehicleId: string, checked: boolean) => {
    setSelectedVehicles(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(vehicleId);
      } else {
        newSet.delete(vehicleId);
      }
      return newSet;
    });
  };
  
  const handleConfirmAddWorker = async () => {
    if (!newWorker.position || !newWorker.employeeId) {
      toast.error('Please select both position and employee');
      return;
    }
    
    // Find the selected employee with conflict data
    const selectedEmployee = enhancedEmployeeOptions.find((opt: any) => opt.value === newWorker.employeeId);
    
    if (!selectedEmployee) {
      toast.error('Selected employee not found');
      return;
    }
    
    // Check for conflicts
    const hasBlockingScheduleConflict = selectedEmployee.hasBlockingScheduleConflict;
    const hasTimeOffConflict = selectedEmployee.hasTimeOffConflict;
    const hasMandatoryNotPreferred = selectedEmployee.hasMandatoryNotPreferred;
    
    // Show schedule conflict dialog if worker has conflicts
    if (selectedEmployee.hasScheduleConflict && !hasBlockingScheduleConflict) {
      // Non-blocking conflict - show warning
      setGapConflictDialog({
        open: true,
        workerName: selectedEmployee.label,
        workerPhotoUrl: selectedEmployee.photo_url,
        conflicts: selectedEmployee.conflictInfo?.conflicts || [],
      });
      return;
    }
    
    // Block assignment if there are blocking conflicts
    if (hasBlockingScheduleConflict || hasTimeOffConflict || hasMandatoryNotPreferred) {
      let errorMessage = 'Cannot assign this worker due to: ';
      const reasons = [];
      if (hasBlockingScheduleConflict) reasons.push('schedule conflict');
      if (hasTimeOffConflict) reasons.push('time-off conflict');
      if (hasMandatoryNotPreferred) reasons.push('mandatory restrictions');
      errorMessage += reasons.join(', ');
      toast.error(errorMessage);
      return;
    }
    
      // Create new worker object
      const workerToAdd = {
        id: newWorker.employeeId,
        position: newWorker.position,
        first_name: selectedEmployee.first_name,
        last_name: selectedEmployee.last_name,
        photo_url: selectedEmployee.photo_url,
        start_time: typeof newWorker.start_time === 'string' ? newWorker.start_time : dayjs(newWorker.start_time).toISOString(),
        end_time: typeof newWorker.end_time === 'string' ? newWorker.end_time : dayjs(newWorker.end_time).toISOString(),
        status: 'draft',
        phone_number: selectedEmployee.phone_number || '', 
        email: selectedEmployee.email || '',
      };
    
    // Add to new workers list
    setNewWorkers((prev) => [...prev, workerToAdd]);
    
    // Add selected vehicles
    if (availableVehicles.length > 0 && selectedVehicles.size > 0) {
      availableVehicles
        .filter((vehicle: any) => selectedVehicles.has(vehicle.id))
        .forEach((vehicle: any) => {
          const vehicleToAdd = {
            type: vehicle.type,
            id: vehicle.id,
            license_plate: vehicle.license_plate,
            unit_number: vehicle.unit_number || '',
            operator: {
              id: newWorker.employeeId,
              first_name: selectedEmployee.first_name,
              last_name: selectedEmployee.last_name,
              photo_url: selectedEmployee.photo_url,
              worker_index: null,
            },
          };
          setNewVehicles((prev) => [...prev, vehicleToAdd]);
        });
    }
    
    // Hide form and reset
    handleCancelAddWorker();
  };

  const handlePublish = async () => {
    try {
      setIsLoading(true);
      
      // Validate timesheet manager is selected
      if (!timesheetManagerId || timesheetManagerId === '') {
        setTimesheetManagerError('Timesheet manager is required');
        setIsLoading(false);
        return;
      } else {
        setTimesheetManagerError('');
      }
      
      // Update job with the local state
      job.timesheet_manager_id = timesheetManagerId;
      
      // Validate that workers exist
      if (displayWorkers.length === 0) {
        toast.error('At least one worker is required');
        setIsLoading(false);
        return;
      }
      
      // Get the updated workers list (excluding removed workers, including new ones)
      const updatedWorkers = displayWorkers.map((worker: any) => ({
        id: worker.id,
        position: worker.position,
        start_time: worker.start_time,
        end_time: worker.end_time,
      }));
      
      // Normalize times to ISO strings
      const normalizedWorkers = updatedWorkers.map((worker: any) => ({
        ...worker,
        start_time: typeof worker.start_time === 'string' ? worker.start_time : dayjs(worker.start_time).toISOString(),
        end_time: typeof worker.end_time === 'string' ? worker.end_time : dayjs(worker.end_time).toISOString(),
      }));
      
      // Get the updated vehicles list (excluding vehicles whose operators have been removed, including new ones)
      const updatedVehicles = displayVehicles.map((vehicle: any) => ({
        type: vehicle.type || '',
        id: vehicle.id || '',
        license_plate: vehicle.license_plate || '',
        unit_number: vehicle.unit_number || '',
        operator: vehicle.operator && vehicle.operator.id ? {
          id: vehicle.operator.id,
          first_name: vehicle.operator.first_name || '',
          last_name: vehicle.operator.last_name || '',
          photo_url: vehicle.operator.photo_url || '',
        } : {
          id: '',
          first_name: '',
          last_name: '',
          photo_url: '',
        },
      }));
      
      // Save job with notifications (this will handle sending notifications)
      await fetcher([
        `${endpoints.work.job}/${job.id}/save-with-notifications`,
        {
          method: 'PUT',
          data: {
            ...job,
            workers: normalizedWorkers,
            vehicles: updatedVehicles,
            timesheet_manager_id: timesheetManagerId || '',
          },
        },
      ]);

      toast.success('Changes published and notifications sent');
      
      // Clear new workers and vehicles after successful publish
      setNewWorkers([]);
      setNewVehicles([]);
      setRemovedWorkerIds(new Set());
      setShowAddWorkerForm(false);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-jobs'] });
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error publishing job:', error);
      
      // Extract error message from various possible locations
      let errorMessage = 'Failed to publish changes';
      
      if (error?.response?.data) {
        // Try different fields that might contain the error
        errorMessage = error.response.data.error || 
                      error.response.data.message || 
                      error.response.data.details?.message ||
                      JSON.stringify(error.response.data);
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (time: any) => dayjs(time).format('h:mm A');
  const formatDate = (time: any) => dayjs(time).format('MMM DD, YYYY');

  const isTimesheetManager = (workerId: string) => job.timesheet_manager_id === workerId;

  const formatVehicleType = (type: string) => {
    switch (type) {
      case 'highway_truck':
        return 'HWY';
      case 'lane_closure_truck':
        return 'LCT';
      default: {
        const option = VEHICLE_TYPE_OPTIONS.find((opt) => opt.value === type);
        return option?.label || type;
      }
    }
  };

  // Helper function to get full address
  const getFullAddress = (site: any) => {
    if (!site) return '';
    
    // Use display_address from backend if available
    if (site.display_address) return site.display_address;
    
    // Fallback: Build the address string from fields
    let addr = [
      site.unit_number,
      site.street_number,
      site.street_name,
      site.city,
      site.province,
      site.postal_code,
    ]
      .filter(Boolean)
      .join(', ');
    
    provinceList.forEach(({ value, code }) => {
      addr = addr.replace(value, code);
    });
    
    return addr;
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6">Quick Edit Job</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              #{job.job_number}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 3 }}>
        <Stack spacing={3}>
          {/* Job Info */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
              Job Details
            </Typography>
            <Stack spacing={2}>
              {/* Customer and Client */}
              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Customer
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      src={job.company?.logo_url}
                      alt={job.company?.name}
                      sx={{ width: 32, height: 32 }}
                    >
                      {job.company?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {job.company?.name}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Client
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      src={job.client?.logo_url}
                      alt={job.client?.name}
                      sx={{ width: 32, height: 32 }}
                    >
                      {job.client?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {job.client?.name}
                    </Typography>
                  </Box>
                </Box>
              </Stack>

              {/* Site Address */}
              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Site
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                  {job.site?.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                  <Iconify icon="mingcute:location-fill" width={16} sx={{ color: 'text.secondary', mt: 0.25 }} />
                  <Typography variant="body2" color="text.secondary">
                    {getFullAddress(job.site)}
                  </Typography>
                </Box>
              </Box>

              {/* Date and Time */}
              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Date
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Iconify icon="solar:calendar-bold" width={16} sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatDate(job.start_time)}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Time
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Iconify icon="solar:clock-circle-bold" width={16} sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatTime(job.start_time)} - {formatTime(job.end_time)}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Stack>
          </Box>

          <Divider />

          {/* Timesheet Manager */}
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 1 }}>
              Timesheet Manager *
            </Typography>
            <Autocomplete
              fullWidth
              size="small"
              options={displayWorkers.filter((w: any) => w.id && w.position)}
              value={
                displayWorkers.find((w: any) => w.id === timesheetManagerId) || null
              }
              onChange={(_, value) => {
                setTimesheetManagerId(value?.id || '');
                // Clear error when user selects a manager
                setTimesheetManagerError('');
              }}
              onInputChange={(_, value, reason) => {
                // Handle clear button click
                if (reason === 'clear') {
                  setTimesheetManagerId('');
                  setTimesheetManagerError('');
                }
              }}
              getOptionLabel={(option: any) => 
                `${option.first_name} ${option.last_name}`
              }
              renderOption={(props, option: any) => (
                <Box component="li" {...props}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar
                      src={option.photo_url}
                      alt={option.first_name}
                      sx={{ width: 32, height: 32 }}
                    >
                      {option.first_name?.charAt(0)}
                    </Avatar>
                    <Typography variant="body2">
                      {option.first_name} {option.last_name}
                    </Typography>
                    <Chip
                      label={getPositionLabel(option.position)}
                      size="small"
                      variant="soft"
                      color={getPositionColor(option.position)}
                      sx={{ ml: 'auto' }}
                    />
                  </Stack>
                </Box>
              )}
              renderInput={(params) => {
                const selectedWorker = displayWorkers.find((w: any) => w.id === timesheetManagerId);
                return (
                  <TextField 
                    {...params} 
                    placeholder="Select timesheet manager"
                    error={!!timesheetManagerError}
                    helperText={timesheetManagerError || 'Required: Select a worker who will manage timesheets for this job'}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: selectedWorker ? (
                        <Box sx={{ mr: 0.5, display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            src={selectedWorker.photo_url} 
                            alt={`${selectedWorker.first_name} ${selectedWorker.last_name}`}
                            sx={{ width: 28, height: 28 }}
                          >
                            {selectedWorker.first_name?.charAt(0)}
                          </Avatar>
                        </Box>
                      ) : null,
                    }}
                  />
                );
              }}
            />
          </Box>

          <Divider />

          {/* Workers List */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                Assigned Workers ({job.workers?.length || 0})
              </Typography>
              <Button
                size="small"
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={handleAddWorker}
                sx={{ textTransform: 'none' }}
              >
                Add Worker
              </Button>
            </Box>

            {displayWorkers.length > 0 || job.workers?.length > 0 ? (
              <Stack spacing={1.5}>
                {displayWorkers.map((worker: any, index: number) => {
                  const positionLabel =
                    JOB_POSITION_OPTIONS.find((option) => option.value === worker.position)?.label ||
                    worker.position ||
                    'Unknown Position';

                  return (
                    <Box
                      key={worker.id || index}
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 1,
                        p: { xs: 1.5, md: 1 },
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        bgcolor: 'transparent',
                        alignItems: { xs: 'flex-start', md: 'center' },
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      {/* Position and Worker Info */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          minWidth: 0,
                          flexWrap: 'wrap',
                          flex: 1,
                        }}
                      >
                        {worker.position && (
                          <Chip
                            label={positionLabel}
                            size="small"
                            variant="soft"
                            color={getPositionColor(worker.position)}
                            sx={{ minWidth: 60, flexShrink: 0 }}
                          />
                        )}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          <Avatar
                            src={worker?.photo_url}
                            alt={worker?.first_name}
                            sx={{
                              width: 28,
                              height: 28,
                              flexShrink: 0,
                            }}
                          >
                            {worker?.first_name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                minWidth: 0,
                              }}
                            >
                              {worker.first_name} {worker.last_name}
                            </Typography>
                            {isTimesheetManager(worker.id) && (
                              <Chip
                                label="TM"
                                size="small"
                                color="info"
                                variant="soft"
                                sx={{ 
                                  height: 18,
                                  fontSize: '0.65rem',
                                  px: 0.5,
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>

                      {/* Contact and Time Info */}
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          gap: 1,
                          flexWrap: 'wrap',
                        }}
                      >
                        {worker.phone_number && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            <Iconify icon="solar:phone-bold" width={16} sx={{ color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {formatPhoneNumberSimple(worker.phone_number)}
                            </Typography>
                          </Box>
                        )}

                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Iconify icon="solar:clock-circle-bold" width={16} sx={{ color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {worker.start_time ? formatTime(worker.start_time) : ''} -{' '}
                            {worker.end_time ? formatTime(worker.end_time) : ''}
                          </Typography>
                          {worker.status && (
                            <Label
                              variant="soft"
                              color={
                                worker.status === 'accepted' 
                                  ? 'success' 
                                  : worker.status === 'rejected' 
                                  ? 'error' 
                                  : worker.status === 'draft'
                                  ? 'info'
                                  : 'warning'
                              }
                              sx={{ fontSize: 10, px: 0.75, py: 0.25 }}
                            >
                              {worker.status}
                            </Label>
                          )}
                        </Box>
                      </Box>

                      {/* Unassign Button */}
                      <Tooltip title="Remove worker (changes will be saved when you publish)">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleUnassignWorker(worker.id)}
                          sx={{
                            flexShrink: 0,
                            '&:hover': {
                              bgcolor: 'error.lighter',
                            },
                          }}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <Box
                sx={{
                  py: 4,
                  textAlign: 'center',
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <Iconify
                  icon="solar:users-group-rounded-bold-duotone"
                  width={48}
                  sx={{ color: 'text.disabled', mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  No workers assigned yet
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Click &quot;Add Worker&quot; to assign workers to this job
                </Typography>
              </Box>
            )}
          </Box>

          {/* Add Worker Form */}
          {showAddWorkerForm && (
            <Box
              sx={{
                p: 2,
                border: '2px dashed',
                borderColor: 'primary.main',
                borderRadius: 2,
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Add New Worker
              </Typography>
              
              <Stack spacing={2}>
                {/* Position Selection */}
                <FormControl fullWidth size="small">
                  <InputLabel>Position *</InputLabel>
                  <Select
                    value={newWorker.position}
                    onChange={(e) => {
                      setNewWorker({ 
                        ...newWorker, 
                        position: e.target.value,
                        employeeId: '' // Clear employee when position changes
                      });
                    }}
                    label="Position *"
                  >
                    {JOB_POSITION_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Employee Selection */}
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">
                      Select worker
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={viewAllWorkers}
                          onChange={(e) => {
                            setViewAllWorkers(e.target.checked);
                            // Clear selected employee when toggling
                            setNewWorker({ ...newWorker, employeeId: '' });
                          }}
                        />
                      }
                      label={
                        <Typography variant="caption" color="text.secondary">
                          View all ({filteredEmployeeOptions.length})
                        </Typography>
                      }
                    />
                  </Stack>
                  <Autocomplete
                    fullWidth
                    size="small"
                    options={filteredEmployeeOptions}
                    value={filteredEmployeeOptions.find((opt: any) => opt.value === newWorker.employeeId) || 
                           enhancedEmployeeOptions.find((opt: any) => opt.value === newWorker.employeeId) || null}
                    onChange={(_, value) => {
                // Don't allow selection of disabled workers
                if (value && (value.hasBlockingScheduleConflict || value.hasTimeOffConflict || value.hasMandatoryNotPreferred)) {
                  // If viewAllWorkers is on, show warning dialog instead
                  if (viewAllWorkers) {
                    // Use checkEmployeeConflicts to get all issues
                    const conflictResult = checkEmployeeConflicts(value, newWorker.position);
                    
                    // If it's an 8-hour gap violation, show the gap dialog
                    if (conflictResult.shouldShowScheduleDialog) {
                      setGapConflictDialog({
                        open: true,
                        workerName: value.label,
                        workerPhotoUrl: value.photo_url,
                        conflicts: conflictResult.scheduleConflicts || [],
                      });
                    } else {
                      // Otherwise show the worker warning dialog with all issues
                      setWorkerWarning({
                        open: true,
                        employee: {
                          name: value.label,
                          id: value.value,
                          photo_url: value.photo_url,
                        },
                        warningType: conflictResult.warningType,
                        reasons: conflictResult.allIssues,
                        isMandatory: conflictResult.hasMandatoryIssues,
                        canProceed: conflictResult.canProceed,
                      });
                    }
                  } else {
                    toast.error(`Cannot select ${value.label}: They have conflicting assignments or restrictions.`);
                  }
                  return;
                }
                setNewWorker({ ...newWorker, employeeId: value?.value || '' });
              }}
                    getOptionDisabled={(option: any) => false} // Don't disable in Autocomplete so clicks work
                    renderOption={(props: any, option: any) => {
                      const isDisabled = option.hasBlockingScheduleConflict || option.hasTimeOffConflict || option.hasMandatoryNotPreferred;
                      
                      // Determine which conflict message to show
                      let conflictMessage = '';
                      let conflictColor: 'error' | 'warning' = 'error';
                      
                      if (option.hasTimeOffConflict) {
                        conflictMessage = 'TIME OFF';
                      } else if (option.hasBlockingScheduleConflict) {
                        conflictMessage = 'SCHEDULE CONFLICT';
                      } else if (option.hasMandatoryNotPreferred) {
                        conflictMessage = 'RESTRICTED';
                      } else if (option.hasScheduleConflict && !option.hasBlockingScheduleConflict) {
                        conflictMessage = '8HR GAP';
                        conflictColor = 'warning';
                      }
                      
                      return (
                        <Box 
                          component="li" 
                          {...props}
                          onClick={(e: any) => {
                            // If disabled but has conflicts, check what type and show appropriate dialog
                            if (isDisabled && viewAllWorkers) {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              // Use checkEmployeeConflicts to get all issues
                              const conflictResult = checkEmployeeConflicts(option, newWorker.position);
                              
                              // If it's an 8-hour gap violation, show the gap dialog
                              if (conflictResult.shouldShowScheduleDialog) {
                                setGapConflictDialog({
                                  open: true,
                                  workerName: option.label,
                                  workerPhotoUrl: option.photo_url,
                                  conflicts: conflictResult.scheduleConflicts || [],
                                });
                              } else {
                                // Otherwise show the worker warning dialog with all issues
                                setWorkerWarning({
                                  open: true,
                                  employee: {
                                    name: option.label,
                                    id: option.value,
                                    photo_url: option.photo_url,
                                  },
                                  warningType: conflictResult.warningType,
                                  reasons: conflictResult.allIssues,
                                  isMandatory: conflictResult.hasMandatoryIssues,
                                  canProceed: conflictResult.canProceed,
                                });
                              }
                            } else if (!isDisabled && option.hasScheduleConflict && !option.hasBlockingScheduleConflict) {
                              // Show gap violation dialog for 8-hour gap warnings
                              e.preventDefault();
                              e.stopPropagation();
                              setGapConflictDialog({
                                open: true,
                                workerName: option.label,
                                workerPhotoUrl: option.photo_url,
                                conflicts: option.conflictInfo?.conflicts || [],
                              });
                            }
                          }}
                          sx={{
                            ...(props.sx || {}),
                            cursor: isDisabled && viewAllWorkers ? 'pointer' : undefined,
                            '&:hover': isDisabled && viewAllWorkers ? {
                              backgroundColor: 'action.hover',
                            } : undefined,
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                            <Avatar 
                              src={option.photo_url} 
                              alt={option.label}
                              sx={{ width: 36, height: 36 }}
                            >
                              {option.first_name?.charAt(0)}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>
                              {option.label}
                            </Typography>
                            {conflictMessage && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: 0.5,
                                  backgroundColor: conflictColor === 'error' ? 'error.main' : 'warning.main',
                                  color: conflictColor === 'error' ? 'error.contrastText' : 'warning.contrastText',
                                }}
                              >
                                <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                                  {conflictMessage}
                                </Typography>
                              </Box>
                            )}
                          </Stack>
                        </Box>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Worker *" 
                        placeholder="Search by name..."
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: selectedEmployeeInfo ? (
                            <Box sx={{ mr: 0.5, display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                src={selectedEmployeeInfo.photo_url} 
                                alt={selectedEmployeeInfo.label}
                                sx={{ width: 28, height: 28 }}
                              >
                                {selectedEmployeeInfo.first_name?.charAt(0)}
                              </Avatar>
                            </Box>
                          ) : null,
                        }}
                      />
                    )}
                  />
                </Stack>

                {/* Time Selection */}
                <Stack direction="row" spacing={2}>
                  <TimePicker
                    label="Start Time"
                    value={newWorker.start_time}
                    onChange={(newValue) => setNewWorker({ ...newWorker, start_time: newValue || dayjs() })}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                      },
                    }}
                  />
                  <TimePicker
                    label="End Time"
                    value={newWorker.end_time}
                    onChange={(newValue) => setNewWorker({ ...newWorker, end_time: newValue || dayjs().add(8, 'hour') })}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                      },
                    }}
                  />
                </Stack>
                
                {/* Vehicle Selection */}
                {selectedEmployeeInfo && availableVehicles.length > 0 && (
                  <Box>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedVehicles.size === availableVehicles.length && availableVehicles.length > 0}
                          indeterminate={selectedVehicles.size > 0 && selectedVehicles.size < availableVehicles.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedVehicles(new Set(availableVehicles.map((v: any) => v.id)));
                            } else {
                              setSelectedVehicles(new Set());
                            }
                          }}
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="caption">
                          Add assigned vehicles ({selectedVehicles.size}/{availableVehicles.length})
                        </Typography>
                      }
                    />
                    <Collapse in={selectedVehicles.size > 0 || availableVehicles.length > 0}>
                      <Stack spacing={1} sx={{ mt: 1 }}>
                        {availableVehicles.map((vehicle: any) => (
                          <Box
                            key={vehicle.id}
                            sx={{
                              p: 1.5,
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1,
                              bgcolor: selectedVehicles.has(vehicle.id) ? 'action.selected' : 'background.neutral',
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                              <Checkbox
                                checked={selectedVehicles.has(vehicle.id)}
                                onChange={(e) => handleVehicleToggle(vehicle.id, e.target.checked)}
                                size="small"
                              />
                              <Chip
                                label={formatVehicleType(vehicle.type)}
                                size="small"
                                variant="outlined"
                              />
                              <Typography variant="body2">
                                {vehicle.license_plate} - {vehicle.unit_number}
                              </Typography>
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    </Collapse>
                  </Box>
                )}

                {/* Action Buttons */}
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button size="small" onClick={handleCancelAddWorker}>
                    Cancel
                  </Button>
                  <Button size="small" variant="contained" onClick={handleConfirmAddWorker}>
                    Add Worker
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}

          {/* Vehicles Section */}
          {displayVehicles.length > 0 && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Vehicles ({displayVehicles.length})
                </Typography>
                
                <Stack spacing={1.5}>
                  {displayVehicles.map((vehicle: any, index: number) => (
                    <Box
                      key={vehicle.id || index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      {/* Vehicle Type Chip */}
                      <Chip
                        label={formatVehicleType(vehicle.type)}
                        size="small"
                        variant="outlined"
                        sx={{ minWidth: 60, flexShrink: 0 }}
                      />
                      
                      {/* Vehicle Plate and Unit */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {vehicle.license_plate || 'N/A'} - {vehicle.unit_number || 'N/A'}
                        </Typography>
                      </Box>

                      {/* Operator Info */}
                      {vehicle.operator && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <Avatar
                            src={vehicle.operator?.photo_url}
                            alt={vehicle.operator?.first_name}
                            sx={{
                              width: 28,
                              height: 28,
                              flexShrink: 0,
                            }}
                          >
                            {vehicle.operator?.first_name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 500,
                                display: 'block',
                              }}
                            >
                              {vehicle.operator.first_name} {vehicle.operator.last_name}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit">
          Close
        </Button>
        <Button
          variant="contained"
          onClick={handlePublish}
          disabled={isLoading || displayWorkers.length === 0}
          startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
        >
          {isLoading 
            ? 'Sending...' 
            : (removedWorkerIds.size > 0 || newWorkers.length > 0)
              ? `Publish & Notify Workers (${newWorkers.length} added, ${removedWorkerIds.size} removed)`
              : 'Publish & Notify Workers'}
        </Button>
      </DialogActions>

      {/* Worker Warning Dialog (Mandatory Restrictions, Certifications, Schedule Conflicts) */}
      <WorkerWarningDialog
        warning={workerWarning}
        onClose={() => setWorkerWarning({ ...workerWarning, open: false })}
        onConfirm={() => {
          // Only add the worker if they can proceed (not mandatory restrictions)
          if (workerWarning.canProceed && workerWarning.employee.id) {
            setNewWorker({ ...newWorker, employeeId: workerWarning.employee.id });
          }
          setWorkerWarning({ ...workerWarning, open: false });
        }}
        onCancel={() => setWorkerWarning({ ...workerWarning, open: false })}
      />

      {/* Gap Conflict Dialog (8-Hour Gap Violations Only) */}
      <ScheduleConflictDialog
        open={gapConflictDialog.open}
        onClose={() => setGapConflictDialog({ open: false, workerName: '', workerPhotoUrl: '', conflicts: [] })}
        onProceed={() => {
          // For gap violations, we can proceed with assignment
          setGapConflictDialog({ open: false, workerName: '', workerPhotoUrl: '', conflicts: [] });
        }}
        workerName={gapConflictDialog.workerName}
        workerPhotoUrl={gapConflictDialog.workerPhotoUrl}
        conflicts={gapConflictDialog.conflicts}
        newJobStartTime={newWorker.start_time ? String(newWorker.start_time) : dayjs().toISOString()}
        newJobEndTime={newWorker.end_time ? String(newWorker.end_time) : dayjs().toISOString()}
        newJobSiteName={job.site?.name}
        newJobClientName={job.client?.name}
      />
    </Dialog>
  );
}

