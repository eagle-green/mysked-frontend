import type { UserType } from 'src/auth/types';
import type {
  TimeSheetDetails,
} from 'src/types/timesheet';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { pdf } from '@react-pdf/renderer';
import timezone from 'dayjs/plugin/timezone';
import { useBoolean } from 'minimal-shared/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useEffect, useCallback } from 'react';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { formatPositionDisplay } from 'src/utils/format-role';
import { getTimesheetDateInVancouver } from 'src/utils/timesheet-date';

import { fetcher, endpoints } from 'src/lib/axios';
import TimesheetPDF from 'src/pages/template/timesheet-pdf';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { TimeSheetSignatureDialog } from '../../../sections/schedule/timesheet/template/timesheet-signature';
import { TimeSheetDetailHeader } from '../../../sections/schedule/timesheet/template/timesheet-detail-header';
import { TimesheetManagerChangeDialog } from '../../../sections/schedule/timesheet/template/timesheet-manager-change-dialog';
import { TimesheetManagerSelectionDialog } from '../../../sections/schedule/timesheet/template/timesheet-manager-selection-dialog';

// ----------------------------------------------------------------------
type TimeSheetEditProps = {
  timesheet: TimeSheetDetails;
  user?: UserType;
};

export function AdminTimeSheetEditForm({ timesheet, user }: TimeSheetEditProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // const loadingSend = useBoolean();
  const signatureDialog = useBoolean();
  
  const [workerData, setWorkerData] = useState<Record<string, any>>({});
  const [workerInitials, setWorkerInitials] = useState<Record<string, string>>({});
  const [currentWorkerIdForSignature, setCurrentWorkerIdForSignature] = useState<string | null>(null);
  const [managerNotes] = useState<string>(timesheet.notes || '');
  const [adminNotes, setAdminNotes] = useState<string>(timesheet.admin_notes || '');
  
  const [timesheetManagerChangeDialog, setTimesheetManagerChangeDialog] = useState<{
    open: boolean;
    newManager: any;
  }>({
    open: false,
    newManager: null,
  });

  const [timesheetManagerSelectionDialog, setTimesheetManagerSelectionDialog] = useState<{
    open: boolean;
  }>({
    open: false,
  });

  const { entries } = timesheet;

  // Fetch job workers for timesheet manager change
  const { data: jobWorkersData } = useQuery({
    queryKey: ['job-workers', timesheet.job.id],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.work.job}/${timesheet.job.id}/workers`);
      return response.data;
    },
    enabled: !!timesheet.job.id,
  });

  const jobWorkers = jobWorkersData || { workers: [] };

  // Check if current user has access to this timesheet
  const hasTimesheetAccess = useMemo(() => {
    if (!user?.id) return false;
    // Admin users can access any timesheet
    if (user.role === 'admin') return true;
    // Only the current timesheet manager can access and edit the timesheet
    if (user.id === timesheet.timesheet_manager_id) return true;
    return false;
  }, [user, timesheet.timesheet_manager_id]);

  // Check if timesheet is read-only
  const isTimesheetReadOnly = useMemo(() => {
    if (!user?.id) return true;
    // Admins can edit submitted/confirmed timesheets
    if (user.role === 'admin') return false;
    // Timesheet manager can only edit if not submitted/confirmed
    return ['submitted', 'confirmed', 'approved'].includes(timesheet.status);
  }, [user, timesheet.status]);

  // Check if user can edit timesheet manager
  const canEditTimesheetManager = useMemo(() => user?.role === 'admin' || user?.id === timesheet.timesheet_manager_id, [user, timesheet.timesheet_manager_id]);

  // Filter out workers who haven't accepted the job
  // Include entries where worker has 'accepted' status OR where worker is the timesheet manager
  const acceptedEntries = useMemo(
    () =>
      entries.filter(
        (entry) =>
          entry.job_worker_status === 'accepted' ||
          entry.worker_id === timesheet.timesheet_manager_id
      ),
    [entries, timesheet.timesheet_manager_id]
  );

  // Initialize worker data when entries change
  useEffect(() => {
    const initialData: Record<string, any> = {};
    const initialInitials: Record<string, string> = {};
    
    acceptedEntries.forEach((entry) => {
      // Calculate travel time from total_travel_minutes or sum of travel minutes
      let travelTimeMinutes = 0;
      if (entry.total_travel_minutes) {
        travelTimeMinutes = entry.total_travel_minutes;
      } else if (entry.travel_to_minutes || entry.travel_during_minutes || entry.travel_from_minutes) {
        travelTimeMinutes = 
          (parseInt(entry.travel_to_minutes as string) || 0) +
          (parseInt(entry.travel_during_minutes as string) || 0) +
          (parseInt(entry.travel_from_minutes as string) || 0);
      }
      
      initialData[entry.id] = {
        mob: entry.mob || false,
        break_minutes: entry.break_total_minutes || 0,
        shift_start: entry.shift_start || entry.original_start_time,
        shift_end: entry.shift_end || entry.original_end_time,
        travel_time_hours: Math.floor(travelTimeMinutes / 60),
        travel_time_minutes: travelTimeMinutes % 60,
        worker_notes: entry.worker_notes || '',
        admin_notes: entry.admin_notes || '',
      };
      
      if (entry.initial) {
        initialInitials[entry.id] = entry.initial;
      }
    });
    
    setWorkerData(initialData);
    setWorkerInitials(initialInitials);
  }, [acceptedEntries]);

  // Calculate total hours for each entry (reactive to workerData changes)
  const entryTotalHours = useMemo(() => {
    const hoursMap: Record<string, number> = {};
    acceptedEntries.forEach((entry) => {
      const data = workerData[entry.id];
      if (!data) {
        hoursMap[entry.id] = 0;
        return;
      }

      // Calculate from shift times if available, otherwise use API value
      if (data.shift_start && data.shift_end) {
        const start = dayjs(data.shift_start);
        const end = dayjs(data.shift_end);
        let minutes = end.diff(start, 'minute');
        // Subtract break minutes
        minutes -= data.break_minutes || 0;
        // Convert to decimal hours with 2 decimal places
        hoursMap[entry.id] = Math.round((minutes / 60) * 100) / 100;
      } else if (entry.shift_total_minutes !== undefined && entry.shift_total_minutes !== null) {
        // Use the corrected value from backend (handles date correction for multi-day shifts)
        hoursMap[entry.id] = Math.round((entry.shift_total_minutes / 60) * 100) / 100;
      } else {
        hoursMap[entry.id] = 0;
      }
    });
    return hoursMap;
  }, [acceptedEntries, workerData]);

  // Update worker field
  const updateWorkerField = useCallback((workerId: string, field: string, value: any) => {
    setWorkerData((prev) => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        [field]: value,
      },
    }));
  }, []);

  // Handle initial signature
  const handleInitialSignature = useCallback((signature: string) => {
    if (currentWorkerIdForSignature) {
      setWorkerInitials((prev) => ({
        ...prev,
        [currentWorkerIdForSignature]: signature,
      }));
      setCurrentWorkerIdForSignature(null);
      signatureDialog.onFalse();
    }
  }, [currentWorkerIdForSignature, signatureDialog]);


  // Handle timesheet manager change
  const handleConfirmTimesheetManagerChange = useCallback(async () => {
    if (!timesheetManagerChangeDialog.newManager) return;

    try {
      const response = await fetcher([
        `${endpoints.timesheet.list}/${timesheet.id}`,
        {
          method: 'PUT',
          data: {
            timesheet_manager_id: timesheetManagerChangeDialog.newManager.user_id,
          },
        },
      ]);

      if (response.success) {
        toast.success('Timesheet manager updated successfully');
        await queryClient.invalidateQueries({ queryKey: ['timesheet-detail-query', timesheet.id] });
        await queryClient.invalidateQueries({ queryKey: ['timesheet-list-query'] });
        setTimesheetManagerChangeDialog({ open: false, newManager: null });
        router.push(paths.work.job.timesheet.list);
      } else {
        toast.error('Failed to update timesheet manager');
      }
    } catch (error) {
      console.error('Error updating timesheet manager:', error);
      toast.error('Failed to update timesheet manager');
    }
  }, [timesheetManagerChangeDialog.newManager, timesheet.id, queryClient, router]);

  // Close timesheet manager change dialog
  const handleCloseTimesheetManagerChange = useCallback(() => {
    setTimesheetManagerChangeDialog({ open: false, newManager: null });
  }, []);

  // Handle cancel
  const handleCancel = useCallback(() => {
    router.push(paths.work.job.timesheet.list);
  }, [router]);

  // Check access before rendering
  if (hasTimesheetAccess === false) {
    return (
      <Card sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Access denied. Redirecting...
        </Typography>
      </Card>
    );
  }

  // Render the timesheet edit form
  return (
    <Box>
      {/* Read-only Banner */}
      {isTimesheetReadOnly && (
        <Card sx={{ mb: 2, p: 2, bgcolor: '#e3f2fd', border: '1px solid #bbdefb' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Iconify icon="solar:info-circle-bold" color="#000000" />
            <Typography variant="body1" color="info.dark">
              This timesheet is currently <strong>{timesheet.status}</strong> and cannot be edited.
              {timesheet.status === 'submitted' && ' It has been submitted for approval.'}
              {timesheet.status === 'confirmed' && ' It has been confirmed and approved.'}
              {timesheet.status === 'approved' && ' It has been approved and is now final.'}
            </Typography>
          </Box>
        </Card>
      )}

      {/* Rejected Timesheet Warning Banner */}
      {timesheet.status === 'rejected' && (
        <Card sx={{ mb: 2, p: 2, bgcolor: '#fff3cd', border: '1px solid #ffeaa7' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Iconify icon="solar:info-circle-bold" color="#000000" />
              <Typography variant="body1" color="warning.dark">
                This timesheet has been <strong>rejected</strong>. Please review the feedback, make
                necessary corrections, and resubmit for approval.
              </Typography>
            </Box>

            {timesheet.rejection_reason && (
              <Box sx={{ ml: 4, pl: 2, borderLeft: '3px solid #ffc107' }}>
                <Typography variant="subtitle2" color="#637381" sx={{ mb: 1 }}>
                  <strong>Rejection Reason:</strong>
                </Typography>
                <Typography variant="body2" color="#000000">
                  {timesheet.rejection_reason}
                </Typography>
              </Box>
            )}
          </Box>
        </Card>
      )}

      <Card sx={{ mb: 2 }}>
        {/* Timesheet detail header section */}
        <TimeSheetDetailHeader
          job_number={timesheet.job.job_number}
          po_number={(timesheet.job.po_number || '').trim()}
          full_address={timesheet.site.display_address}
          client_name={timesheet.client.name}
          client_logo_url={timesheet.client.logo_url}
          worker_name="All Workers"
          worker_photo_url={null}
          confirmed_by={timesheet.confirmed_by || null}
          timesheet_manager_id={timesheet.timesheet_manager_id}
          timesheet_manager={timesheet.timesheet_manager}
          current_user_id={user?.id || ''}
          job_id={timesheet.job.id}
          onTimesheetManagerChange={() => setTimesheetManagerSelectionDialog({ open: true })}
          canEditTimesheetManager={canEditTimesheetManager}
          workerOptions={jobWorkers.workers.map((worker: any) => ({
            value: worker.user_id,
            label: `${worker.first_name} ${worker.last_name}`,
            photo_url: worker.photo_url || '',
            first_name: worker.first_name,
            last_name: worker.last_name,
          }))}
          disabled={isTimesheetReadOnly}
          timesheet_status={timesheet.status}
          submitted_at={timesheet.updated_at}
        />
      </Card>

      <Card sx={{ mt: 3 }}>
                    <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Worker Timesheets
                      </Typography>

          {/* Desktop Table View */}
          <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Worker</TableCell>
                  <TableCell align="center">MOB</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>Break (min)</TableCell>
                  <TableCell>End Time</TableCell>
                  <TableCell>Total Hours</TableCell>
                  <TableCell>Travel Time</TableCell>
                  <TableCell>Initial</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {acceptedEntries.map((entry) => {
                  const data = workerData[entry.id] || {
                    mob: false,
                    shift_start: null,
                    break_minutes: 0,
                    shift_end: null,
                    initial: null,
                  };

                  // Get total hours from memoized calculation (reactive to workerData changes)
                  const totalHours = entryTotalHours[entry.id] || 0;

                              return (
                    <TableRow key={entry.id}>
                      {/* Worker Name */}
                      <TableCell>
                        <Stack spacing={1}>
                              {entry.position && (
                                <Chip
                                  label={formatPositionDisplay(entry.position)}
                                  size="small"
                                  variant="soft"
                                  color={
                                    entry.position.toLowerCase().includes('lct')
                                      ? 'info'
                                      : entry.position.toLowerCase().includes('tcp')
                                      ? 'secondary'
                                      : 'primary'
                                  }
                                  sx={{ height: 20, fontSize: '0.75rem', width: 'fit-content' }}
                                />
                              )}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              src={entry.worker_photo_url || undefined}
                              alt={`${entry.worker_first_name} ${entry.worker_last_name}`}
                              sx={{ width: 32, height: 32 }}
                            >
                              {entry.worker_first_name?.charAt(0)}
                            </Avatar>
                            <Typography variant="subtitle2">
                              {entry.worker_first_name} {entry.worker_last_name}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* MOB Checkbox */}
                      <TableCell align="center">
                        <Checkbox
                          checked={data.mob}
                          onChange={(e) => updateWorkerField(entry.id, 'mob', e.target.checked)}
                          disabled={isTimesheetReadOnly}
                        />
                      </TableCell>

                      {/* Start Time */}
                      <TableCell>
                        <TimePicker
                          value={data.shift_start ? dayjs(data.shift_start).tz('America/Vancouver') : null}
                          onChange={(newValue) => {
                            if (newValue && entry.original_start_time) {
                              const baseDate = dayjs(entry.original_start_time).tz('America/Vancouver');
                                const newDateTime = baseDate
                                  .hour(newValue.hour())
                                  .minute(newValue.minute())
                                  .second(0)
                                  .millisecond(0);
                              updateWorkerField(entry.id, 'shift_start', newDateTime.toISOString());
                            }
                          }}
                          disabled={isTimesheetReadOnly}
                            slotProps={{
                              textField: {
                                size: 'small',
                              fullWidth: true,
                            },
                          }}
                        />
                      </TableCell>

                      {/* Break Minutes */}
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          fullWidth
                          value={data.break_minutes || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                            updateWorkerField(entry.id, 'break_minutes', Math.max(0, value || 0));
                          }}
                          disabled={isTimesheetReadOnly}
                          inputProps={{ min: 0, step: 1 }}
                          sx={{ maxWidth: '100px' }}
                        />
                      </TableCell>

                      {/* End Time */}
                      <TableCell>
                        <TimePicker
                          value={data.shift_end ? dayjs(data.shift_end).tz('America/Vancouver') : null}
                          onChange={(newValue) => {
                            if (newValue && entry.original_end_time) {
                              const baseDate = dayjs(entry.original_end_time).tz('America/Vancouver');
                              const newDateTime = baseDate
                                  .hour(newValue.hour())
                                  .minute(newValue.minute())
                                  .second(0)
                                  .millisecond(0);
                              updateWorkerField(entry.id, 'shift_end', newDateTime.toISOString());
                            }
                          }}
                          disabled={isTimesheetReadOnly}
                            slotProps={{
                              textField: {
                                size: 'small',
                              fullWidth: true,
                            },
                          }}
                        />
                      </TableCell>

                      {/* Total Hours */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {totalHours.toFixed(2).replace(/\.?0+$/, '')}
                        </Typography>
                      </TableCell>

                      {/* Travel Time */}
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TextField
                            type="number"
                            size="small"
                            label="Hrs"
                            value={data.travel_time_hours || 0}
                            onChange={(e) => {
                              const value = parseInt(e.target.value, 10) || 0;
                              updateWorkerField(entry.id, 'travel_time_hours', value);
                            }}
                            disabled={isTimesheetReadOnly}
                            inputProps={{ min: 0, step: 1 }}
                            sx={{ width: 70 }}
                          />
                          <TextField
                            type="number"
                            size="small"
                            label="Min"
                            value={data.travel_time_minutes || 0}
                            onChange={(e) => {
                              const value = parseInt(e.target.value, 10) || 0;
                              // Ensure minutes are between 0 and 59
                              const clampedValue = Math.max(0, Math.min(59, value));
                              updateWorkerField(entry.id, 'travel_time_minutes', clampedValue);
                            }}
                            disabled={isTimesheetReadOnly}
                            inputProps={{ min: 0, max: 59, step: 1 }}
                            sx={{ width: 70 }}
                          />
                        </Stack>
                      </TableCell>

                      {/* Initial Signature - Read Only */}
                      <TableCell>
                        {workerInitials[entry.id] ? (
                            <Box
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 0.5,
                                p: 0.5,
                                height: 32,
                            display: 'flex',
                                alignItems: 'center',
                                bgcolor: 'background.paper',
                              }}
                            >
                            <img
                              src={workerInitials[entry.id]}
                              alt="Initial"
                              style={{ height: '24px', width: 'auto' }}
                            />
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Not signed
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Mobile Card View */}
          <Stack spacing={2} sx={{ display: { xs: 'block', md: 'none' } }}>
            {acceptedEntries.map((entry) => {
              const data = workerData[entry.id] || {
                mob: false,
                shift_start: null,
                break_minutes: 0,
                shift_end: null,
                initial: null,
              };

              // Get total hours from memoized calculation (reactive to workerData changes)
              const totalHours = entryTotalHours[entry.id] || 0;

              return (
                <Card key={entry.id} sx={{ p: 2 }}>
                  <Stack spacing={2}>
                    {/* Worker Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
                      <Avatar
                        src={entry.worker_photo_url || undefined}
                        alt={`${entry.worker_first_name} ${entry.worker_last_name}`}
                        sx={{ width: 32, height: 32 }}
                      >
                        {entry.worker_first_name?.charAt(0)}
                      </Avatar>
                      <Typography variant="subtitle2">
                        {entry.worker_first_name} {entry.worker_last_name}
                      </Typography>
                      {entry.position && (
                        <Chip
                          label={formatPositionDisplay(entry.position)}
                          size="small"
                          variant="soft"
                          color={
                            entry.position.toLowerCase().includes('lct')
                              ? 'info'
                              : entry.position.toLowerCase().includes('tcp')
                              ? 'secondary'
                              : 'primary'
                          }
                          sx={{ height: 20, fontSize: '0.75rem' }}
                        />
                      )}
                    </Box>

                    {/* MOB Checkbox */}
                    <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Checkbox
                          checked={data.mob}
                          onChange={(e) => updateWorkerField(entry.id, 'mob', e.target.checked)}
                          disabled={isTimesheetReadOnly}
                        />
                        <Typography variant="body2">MOB</Typography>
                      </Box>
                    </Box>

                    {/* Time Inputs */}
                    <Stack spacing={2} sx={{ mb: 2 }}>
                      <TimePicker
                        label="Start Time"
                        value={data.shift_start ? dayjs(data.shift_start).tz('America/Vancouver') : null}
                        onChange={(newValue) => {
                          if (newValue && entry.original_start_time) {
                            const baseDate = dayjs(entry.original_start_time).tz('America/Vancouver');
                            const newDateTime = baseDate
                              .hour(newValue.hour())
                              .minute(newValue.minute())
                              .second(0)
                              .millisecond(0);
                            updateWorkerField(entry.id, 'shift_start', newDateTime.toISOString());
                          }
                        }}
                        disabled={isTimesheetReadOnly}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                          },
                        }}
                      />

                      <TextField
                        label="Break Minutes"
                        type="number"
                        value={data.break_minutes || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                          updateWorkerField(entry.id, 'break_minutes', Math.max(0, value || 0));
                        }}
                        disabled={isTimesheetReadOnly}
                        fullWidth
                        inputProps={{
                          min: 0,
                          step: 1,
                        }}
                      />

                      <TimePicker
                        label="End Time"
                        value={data.shift_end ? dayjs(data.shift_end).tz('America/Vancouver') : null}
                        onChange={(newValue) => {
                          if (newValue && entry.original_end_time) {
                            const baseDate = dayjs(entry.original_end_time).tz('America/Vancouver');
                            const newDateTime = baseDate
                              .hour(newValue.hour())
                              .minute(newValue.minute())
                              .second(0)
                              .millisecond(0);
                            updateWorkerField(entry.id, 'shift_end', newDateTime.toISOString());
                          }
                        }}
                        disabled={isTimesheetReadOnly}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                          },
                        }}
                      />
                    </Stack>

                      {/* Total Hours Display */}
                      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          Total: {totalHours.toFixed(2).replace(/\.?0+$/, '')}
                        </Typography>
                      </Box>

                      {/* Travel Time */}
                      <Stack spacing={2} sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                          Travel Time
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <TextField
                            type="number"
                            size="small"
                            label="Hours"
                            value={data.travel_time_hours || 0}
                            onChange={(e) => {
                              const value = parseInt(e.target.value, 10) || 0;
                              updateWorkerField(entry.id, 'travel_time_hours', value);
                            }}
                            disabled={isTimesheetReadOnly}
                            inputProps={{ min: 0, step: 1 }}
                            sx={{ flex: 1 }}
                            fullWidth
                          />
                          <TextField
                            type="number"
                            size="small"
                            label="Minutes"
                            value={data.travel_time_minutes || 0}
                            onChange={(e) => {
                              const value = parseInt(e.target.value, 10) || 0;
                              // Ensure minutes are between 0 and 59
                              const clampedValue = Math.max(0, Math.min(59, value));
                              updateWorkerField(entry.id, 'travel_time_minutes', clampedValue);
                            }}
                            disabled={isTimesheetReadOnly}
                            inputProps={{ min: 0, max: 59, step: 1 }}
                            sx={{ flex: 1 }}
                            fullWidth
                          />
                        </Stack>
                      </Stack>

                      {/* Initial Signature - Read Only */}
                      <Stack spacing={1}>
                        <Button
                          variant="outlined"
                          fullWidth
                          disabled
                          startIcon={
                            workerInitials[entry.id] ? (
                              <Iconify icon="solar:check-circle-bold" color="success.main" />
                            ) : (
                              <Iconify icon="solar:pen-bold" />
                            )
                          }
                          sx={{
                            borderColor: workerInitials[entry.id] ? 'success.main' : 'divider',
                            color: workerInitials[entry.id] ? 'success.main' : 'text.secondary',
                          }}
                        >
                          {workerInitials[entry.id] ? 'Signed' : 'Not Signed'}
                        </Button>
                        {workerInitials[entry.id] && (
                          <Box
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1,
                              p: 1,
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              bgcolor: 'background.paper',
                            }}
                          >
                            <img
                              src={workerInitials[entry.id]}
                              alt="Initial Signature"
                              style={{ height: '40px', width: 'auto', maxWidth: '100%' }}
                            />
                          </Box>
                        )}
                      </Stack>
                    </Stack>
                  </Card>
              );
            })}
          </Stack>
        </Box>

        {/* Timesheet Manager Note Section */}
        {managerNotes && (
          <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Timesheet Manager Note
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary' }}>
              {managerNotes}
            </Typography>
          </Box>
        )}

        {/* Admin Note Section */}
        <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Admin Note
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Add admin notes for this timesheet..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            disabled={isTimesheetReadOnly}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.paper',
              },
            }}
          />
        </Box>

        {/* Client Signature Section - Only show if timesheet is not in draft status */}
        {timesheet.status !== 'draft' && (
          <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Client Signature
            </Typography>
            
            {/* Client Signature Message */}
            <Paper 
              elevation={1} 
              sx={{ 
                p: 2, 
                mb: 2, 
                bgcolor: 'info.lighter',
                border: '1px solid',
                borderColor: 'info.main',
                borderRadius: 1
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'info.darker',
                  fontWeight: 'medium',
                  lineHeight: 1.5
                }}
              >
                By signing this invoice as a representative of the customer confirms that the hours recorded are accurate and were performed by the name of the employee(s) in a satisfactory manner.
              </Typography>
            </Paper>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              {(() => {
                // Find client signature from signatures array
                const clientSignature = (timesheet.signatures as any)?.find((sig: any) => {
                  try {
                    const signatureData = JSON.parse(sig.signature_data || '{}');
                    return signatureData.client;
                  } catch {
                    return false;
                  }
                });
                
                const clientSignatureData = clientSignature ? JSON.parse(clientSignature.signature_data).client : null;
                
                return clientSignatureData ? (
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      bgcolor: 'background.paper',
                      minHeight: '120px',
                      minWidth: '300px',
                      maxWidth: '400px',
                    }}
                  >
                    <img
                      src={clientSignatureData}
                      alt="Client Signature"
                      style={{ 
                        height: 'auto', 
                        width: 'auto', 
                        maxHeight: '100px',
                        maxWidth: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      bgcolor: 'background.neutral',
                      minHeight: '120px',
                      minWidth: '300px',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Client signature not provided
                    </Typography>
                  </Box>
                );
              })()}
            </Box>
          </Box>
        )}


        {/* Action Buttons */}
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={async () => {
                try {
                  // Fetch the complete timesheet data from the backend
                  const response = await fetcher(endpoints.timesheet.exportPDF.replace(':id', timesheet.id));

                  if (response.success && response.data) {
                    // Create PDF with the real data from backend
                    try {
                      const blob = await pdf(<TimesheetPDF timesheetData={response.data} />).toBlob();
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;

                      // Generate filename with safety checks
                      const clientName = response.data?.client?.name || 'unknown';
                      const jobNumber = response.data?.job?.job_number || 'unknown';
                      const timesheetDate =
                        response.data?.job?.start_time ||
                        response.data?.timesheet?.timesheet_date ||
                        response.data?.timesheet_date ||
                        new Date();

                      // Format client name: remove spaces, convert to lowercase
                      const formattedClientName = clientName.replace(/\s+/g, '-').toLowerCase();

                      const filename = `timesheet-job-${jobNumber}-${formattedClientName}-${getTimesheetDateInVancouver(timesheetDate).format('MM-DD-YYYY')}.pdf`;

                      link.download = filename;
                      document.body.appendChild(link);
                      link.click();

                      // Cleanup after downloading the file
                      setTimeout(() => {
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                      }, 300);
                      
                      toast.success('Timesheet PDF exported successfully');
                    } catch (pdfError) {
                      console.error('Error generating PDF:', pdfError);
                      toast.error('Failed to generate PDF');
                    }
                  } else {
                    console.error('Failed to fetch timesheet data for PDF export');
                    toast.error('Failed to fetch timesheet data');
                  }
                } catch (error: any) {
                  console.error('Error exporting timesheet PDF:', error);
                  toast.error('Failed to export timesheet PDF');
                }
              }}
              startIcon={<Iconify icon="solar:download-bold" />}
            >
              Export Timesheet
            </Button>
            <Button
              variant="contained"
              onClick={async () => {
                const toastId = toast.loading('Saving timesheet...');
                try {
                  // Save all worker entries
                  const savePromises = acceptedEntries.map((entry) => {
                    const data = workerData[entry.id];
                    // Calculate total travel minutes from hours and minutes
                    const travelTimeMinutes = ((data?.travel_time_hours || 0) * 60) + (data?.travel_time_minutes || 0);
                    
                    const processedData = {
                      shift_start: data?.shift_start || null,
                      shift_end: data?.shift_end || null,
                      mob: data?.mob || false,
                      break_minutes: data?.break_minutes || 0,
                      // Store travel time as travel_to_minutes (can be updated to use a dedicated field if backend supports it)
                      travel_to_minutes: travelTimeMinutes > 0 ? travelTimeMinutes : undefined,
                      initial: workerInitials[entry.id] || null,
                      worker_notes: data?.worker_notes || null,
                      admin_notes: data?.admin_notes || null,
                    };
                    
                    return fetcher([
                      `${endpoints.timesheet.entries}/${entry.id}`,
                      { method: 'PUT', data: processedData },
                    ]);
                  });
                  
                  await Promise.all(savePromises);
                  
                  // Update timesheet notes and admin notes
                  await fetcher([
                    `${endpoints.timesheet.list}/${timesheet.id}`,
                    { 
                      method: 'PUT', 
                      data: { 
                        notes: managerNotes,
                        admin_notes: adminNotes
                      } 
                    },
                  ]);
                  
                  await queryClient.refetchQueries({ queryKey: ['timesheet-detail-query', timesheet.id] });
                  toast.success('Timesheet updated successfully');
                } catch {
                  toast.error('Failed to update timesheet');
                } finally {
                  toast.dismiss(toastId);
                }
              }}
              disabled={isTimesheetReadOnly}
              startIcon={<Iconify icon="solar:pen-bold" />}
            >
              Update Timesheet
            </Button>
        </Box>
        </Box>
      </Card>

      {/* Signature Dialog for Initial Only (Admins cannot edit client signature) */}
      <TimeSheetSignatureDialog
        title="Worker Initial Signature"
        type="initial"
        dialog={signatureDialog}
        onSave={(signature, type) => {
          if (signature && currentWorkerIdForSignature) {
            handleInitialSignature(signature);
          }
        }}
      />

      {/* Timesheet Manager Selection Dialog */}
      <TimesheetManagerSelectionDialog
        open={timesheetManagerSelectionDialog.open}
        onClose={() => setTimesheetManagerSelectionDialog({ open: false })}
        currentManager={{
          id: timesheet.timesheet_manager_id,
          name: `${timesheet.timesheet_manager?.first_name || ''} ${timesheet.timesheet_manager?.last_name || ''}`.trim(),
          photo_url: null,
        }}
        workerOptions={jobWorkers.workers.map((worker: any) => ({
          value: worker.user_id,
          label: `${worker.first_name} ${worker.last_name}`,
          photo_url: worker.photo_url || null,
          first_name: worker.first_name,
          last_name: worker.last_name,
        }))}
        onConfirm={(selectedWorkerId) => {
          const selectedWorker = jobWorkers.workers.find((w: any) => w.user_id === selectedWorkerId);
          if (selectedWorker) {
            setTimesheetManagerChangeDialog({
              open: true,
              newManager: selectedWorker,
            });
            setTimesheetManagerSelectionDialog({ open: false });
          }
        }}
      />

      {/* Timesheet Manager Change Confirmation Dialog */}
      {timesheetManagerChangeDialog.newManager && (
        <TimesheetManagerChangeDialog
          open={timesheetManagerChangeDialog.open}
          onClose={handleCloseTimesheetManagerChange}
          onConfirm={handleConfirmTimesheetManagerChange}
          currentManager={{
            id: timesheet.timesheet_manager_id,
            name: `${timesheet.timesheet_manager?.first_name || ''} ${timesheet.timesheet_manager?.last_name || ''}`.trim(),
            photo_url: null,
          }}
          newManager={{
            id: timesheetManagerChangeDialog.newManager.user_id,
            name: `${timesheetManagerChangeDialog.newManager.first_name} ${timesheetManagerChangeDialog.newManager.last_name}`,
            photo_url: timesheetManagerChangeDialog.newManager.photo_url || null,
          }}
        />
      )}
    </Box>
  );
}
