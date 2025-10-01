import type { UserType } from 'src/auth/types';
import type { TimeSheetDetails } from 'src/types/timesheet';

import dayjs from 'dayjs';
import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { TimeSheetSignatureDialog } from './template/timesheet-signature';
import { TimeSheetDetailHeader } from './template/timesheet-detail-header';
import { TimesheetManagerChangeDialog } from './template/timesheet-manager-change-dialog';
import { TimesheetManagerSelectionDialog } from './template/timesheet-manager-selection-dialog';

// ----------------------------------------------------------------------
type TimeSheetEditProps = {
  timesheet: TimeSheetDetails;
  user?: UserType;
};

type WorkerFormData = {
  [key: string]: {
    mob: boolean;
    shift_start: string | null;
    break: boolean;
    shift_end: string | null;
    initial: string | null;
  };
};

export function TimeSheetEditForm({ timesheet, user }: TimeSheetEditProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const loadingSend = useBoolean();
  const submitDialog = useBoolean();
  const signatureDialog = useBoolean();

  const [clientSignature, setClientSignature] = useState<string | null>(null);
  const [workerInitials, setWorkerInitials] = useState<Record<string, string>>({});
  const [workerConfirmations, setWorkerConfirmations] = useState<Record<string, boolean>>({});
  const [currentWorkerIdForSignature, setCurrentWorkerIdForSignature] = useState<string | null>(
    null
  );

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

  // Check if current user can edit timesheet manager
  const canEditTimesheetManager = useMemo(
    () => user?.id === timesheet.timesheet_manager_id,
    [user?.id, timesheet.timesheet_manager_id]
  );

  // Check if current user has access to this timesheet
  const hasTimesheetAccess = useMemo(() => {
    if (!user?.id) return false;
    return user.id === timesheet.timesheet_manager_id;
  }, [user?.id, timesheet.timesheet_manager_id]);

  // Check if timesheet is read-only
  const isTimesheetReadOnly = useMemo(
    () =>
      timesheet.status === 'submitted' ||
      timesheet.status === 'confirmed' ||
      timesheet.status === 'approved',
    [timesheet.status]
  );

  // Filter accepted entries
  const acceptedEntries = useMemo(
    () => entries.filter((entry) => entry.job_worker_status === 'accepted'),
    [entries]
  );

  // Initialize worker data from entries
  const [workerData, setWorkerData] = useState<WorkerFormData>(() => {
    const initialData: WorkerFormData = {};
    acceptedEntries.forEach((entry) => {
      initialData[entry.id] = {
        mob: entry.mob || false,
        shift_start: entry.shift_start || entry.original_start_time || null,
        break: entry.break || false,
        shift_end: entry.shift_end || entry.original_end_time || null,
        initial: entry.initial || null,
      };
      if (entry.initial) {
        setWorkerInitials((prev) => ({ ...prev, [entry.id]: entry.initial! }));
      }
    });
    return initialData;
  });

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

  // Handle worker confirmation
  const handleWorkerConfirmation = useCallback((workerId: string, confirmed: boolean) => {
    setWorkerConfirmations((prev) => ({
      ...prev,
      [workerId]: confirmed,
    }));
  }, []);

  // Check if all workers are confirmed
  const allWorkersConfirmed = useMemo(
    () =>
      acceptedEntries.length > 0 && acceptedEntries.every((entry) => workerConfirmations[entry.id]),
    [acceptedEntries, workerConfirmations]
  );

  // Save all worker entries
  const saveAllEntries = useCallback(async () => {
    const savePromises = acceptedEntries.map((entry) => {
      const data = workerData[entry.id];
      if (!data) return Promise.resolve();

      const processedData = {
        shift_start: data.shift_start || null,
        shift_end: data.shift_end || null,
        mob: data.mob || false,
        break: data.break || false,
        initial: workerInitials[entry.id] || null,
        worker_notes: null,
        admin_notes: null,
      };

      return fetcher([
        `${endpoints.timesheet.entries}/${entry.id}`,
        { method: 'PUT', data: processedData },
      ]);
    });

    await Promise.all(savePromises);
  }, [acceptedEntries, workerData, workerInitials]);

  // Handle timesheet submission
  const handleSubmitTimesheet = useCallback(async () => {
    if (!allWorkersConfirmed) {
      toast.error('Please confirm all workers before submitting');
      return;
    }

    // Check if all workers have initials
    const missingInitials = acceptedEntries.filter((entry) => !workerInitials[entry.id]);
    if (missingInitials.length > 0) {
      toast.error(
        `Please add initials for all workers: ${missingInitials.map((entry) => `${entry.worker_first_name} ${entry.worker_last_name}`).join(', ')}`
      );
      return;
    }

    if (!clientSignature) {
      toast.error('Client signature is required');
      signatureDialog.onTrue();
      return;
    }

    const toastId = toast.loading('Submitting timesheet...');
    loadingSend.onTrue();

    try {
      // Save all entries first
      await saveAllEntries();

      // Refetch to get updated calculations
      await queryClient.refetchQueries({ queryKey: ['timesheet-detail-query', timesheet.id] });

      // Submit timesheet
      const submitData = {
        timesheet_manager_signature: null, // No timesheet manager signature needed
        client_signature: clientSignature,
        submitted_at: new Date().toISOString(),
      };

      const response = await fetcher([
        `${endpoints.timesheet.submit.replace(':id', timesheet.id)}`,
        {
          method: 'POST',
          data: submitData,
        },
      ]);

      queryClient.invalidateQueries({ queryKey: ['timesheet-detail-query', timesheet.id] });
      queryClient.invalidateQueries({ queryKey: ['timesheet-list-query'] });

      toast.success(response?.message ?? 'Timesheet submitted successfully.');
      submitDialog.onFalse();

      setTimeout(() => {
        router.push(paths.schedule.timesheet.root);
      }, 1000);
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error?.response?.data?.error || 'Failed to submit timesheet');
    } finally {
      toast.dismiss(toastId);
      loadingSend.onFalse();
    }
  }, [
    allWorkersConfirmed,
    clientSignature,
    saveAllEntries,
    queryClient,
    timesheet.id,
    router,
    loadingSend,
    submitDialog,
    signatureDialog,
    acceptedEntries,
    workerInitials,
  ]);

  // Handle initial signature
  const handleInitialSignature = useCallback(
    (signature: string) => {
      if (currentWorkerIdForSignature) {
        setWorkerInitials((prev) => ({
          ...prev,
          [currentWorkerIdForSignature]: signature,
        }));
        updateWorkerField(currentWorkerIdForSignature, 'initial', signature);
        setCurrentWorkerIdForSignature(null);
        signatureDialog.onFalse();
      }
    },
    [currentWorkerIdForSignature, updateWorkerField, signatureDialog]
  );

  // Handle signature save
  const handleSignatureSave = useCallback(
    (signature: string, type: string) => {
      if (type === 'client') {
        setClientSignature(signature);
      }
      signatureDialog.onFalse();
    },
    [signatureDialog]
  );

  // Handle timesheet manager change confirmation
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
        queryClient.invalidateQueries({ queryKey: ['timesheet-detail-query', timesheet.id] });
        queryClient.invalidateQueries({ queryKey: ['timesheet-list-query'] });
        setTimesheetManagerChangeDialog({ open: false, newManager: null });
        router.push(paths.schedule.timesheet.root);
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

  // Check access
  if (hasTimesheetAccess === false) {
    return (
      <Card sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Access denied. Redirecting...
        </Typography>
      </Card>
    );
  }

  if (!acceptedEntries.length) {
    return (
      <Card sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No workers have accepted this job yet.
        </Typography>
      </Card>
    );
  }

  // Render submit dialog
  const renderSubmitDialog = () => (
    <Dialog fullWidth maxWidth="md" open={submitDialog.value} onClose={submitDialog.onFalse}>
      <DialogTitle>Confirm Timesheet Submission</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Please review and confirm all worker timesheets before submission.
        </Typography>

        {/* Workers Summary */}
        <Card sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            All Workers - Please Confirm Each Worker
          </Typography>
          <Stack spacing={2}>
            {acceptedEntries.map((entry) => {
              const data = workerData[entry.id];

              // Calculate total hours from current form data
              let totalHours = 0;
              if (data?.shift_start && data?.shift_end) {
                const start = dayjs(data.shift_start);
                const end = dayjs(data.shift_end);
                let minutes = end.diff(start, 'minute');

                // Subtract 30 minutes if break is checked
                if (data.break) {
                  minutes -= 30;
                }

                totalHours = Math.round((minutes / 60) * 10) / 10;
              }

              return (
                <Box
                  key={entry.id}
                  sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2">
                      {entry.worker_first_name} {entry.worker_last_name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Checkbox
                        checked={workerConfirmations[entry.id] || false}
                        onChange={(e) => handleWorkerConfirmation(entry.id, e.target.checked)}
                        size="small"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Confirm
                      </Typography>
                    </Box>
                  </Box>
                  <Stack direction="row" spacing={3}>
                    <Typography variant="caption" color="text.secondary">
                      Total Hours: {totalHours} hrs
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Break: {data?.break ? '30 min' : '0 min'}
                    </Typography>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Card>

        {/* Client Signature Preview */}
        {clientSignature && (
          <Card sx={{ p: 2, mt: 2, bgcolor: 'success.lighter' }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'success.darker' }}>
              Client Signature
            </Typography>
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'success.main',
                borderRadius: 1,
                p: 2,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                bgcolor: 'background.paper',
              }}
            >
              <img
                src={clientSignature}
                alt="Client Signature"
                style={{ height: '60px', width: 'auto', maxWidth: '100%' }}
              />
            </Box>
          </Card>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 },
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 3 },
        }}
      >
        <Button
          onClick={submitDialog.onFalse}
          size="small"
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={() => {
            setCurrentWorkerIdForSignature(null); // Clear worker ID for client signature
            signatureDialog.onTrue();
          }}
          startIcon={
            clientSignature ? (
              <Iconify icon="solar:check-circle-bold" color="success.main" />
            ) : (
              <Iconify icon="solar:pen-bold" />
            )
          }
          sx={{
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          {clientSignature ? 'Update Client Signature' : 'Add Client Signature'}
        </Button>
        <Button
          color="success"
          variant="contained"
          size="small"
          onClick={handleSubmitTimesheet}
          disabled={!allWorkersConfirmed || !clientSignature}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Submit Timesheet
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      <TimeSheetDetailHeader
        job_number={Number(timesheet.job.job_number)}
        po_number={timesheet.job.po_number || ''}
        full_address={timesheet.site?.display_address || ''}
        client_name={timesheet.client?.name || ''}
        client_logo_url={timesheet.client?.logo_url || ''}
        worker_name={
          `${timesheet.timesheet_manager?.first_name || ''} ${timesheet.timesheet_manager?.last_name || ''}`.trim() ||
          'Manager'
        }
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
      />

      {isTimesheetReadOnly && (
        <Card sx={{ p: 2, mb: 3, bgcolor: 'warning.lighter' }}>
          <Typography variant="body2" color="warning.dark">
            This timesheet has been submitted and is read-only.
          </Typography>
        </Card>
      )}

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
                  <TableCell align="center">Break</TableCell>
                  <TableCell>End Time</TableCell>
                  <TableCell>Total Hours</TableCell>
                  <TableCell>Initial</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {acceptedEntries.map((entry) => {
                  const data = workerData[entry.id] || {
                    mob: false,
                    shift_start: null,
                    break: false,
                    shift_end: null,
                    initial: null,
                  };

                  // Calculate total hours
                  let totalHours = 0;
                  if (data.shift_start && data.shift_end) {
                    const start = dayjs(data.shift_start);
                    const end = dayjs(data.shift_end);
                    let minutes = end.diff(start, 'minute');
                    if (data.break) {
                      minutes -= 30;
                    }
                    totalHours = Math.round((minutes / 60) * 10) / 10;
                  }

                  return (
                    <TableRow key={entry.id}>
                      {/* Worker Name */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            src={entry.worker_photo_url || undefined}
                            alt={`${entry.worker_first_name} ${entry.worker_last_name}`}
                            sx={{ width: 32, height: 32 }}
                          >
                            {entry.worker_first_name?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2">
                                {entry.worker_first_name} {entry.worker_last_name}
                              </Typography>
                              {entry.position && (
                                <Chip
                                  label={entry.position.toUpperCase()}
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
                          </Box>
                        </Box>
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
                          value={data.shift_start ? dayjs(data.shift_start) : null}
                          onChange={(newValue) => {
                            if (newValue && entry.original_start_time) {
                              const baseDate = dayjs(entry.original_start_time);
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

                      {/* Break Checkbox */}
                      <TableCell align="center">
                        <Checkbox
                          checked={data.break}
                          onChange={(e) => updateWorkerField(entry.id, 'break', e.target.checked)}
                          disabled={isTimesheetReadOnly}
                        />
                      </TableCell>

                      {/* End Time */}
                      <TableCell>
                        <TimePicker
                          value={data.shift_end ? dayjs(data.shift_end) : null}
                          onChange={(newValue) => {
                            if (newValue && entry.original_end_time) {
                              const baseDate = dayjs(entry.original_end_time);
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
                          {totalHours} hrs
                        </Typography>
                      </TableCell>

                      {/* Initial Signature */}
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              setCurrentWorkerIdForSignature(entry.id);
                              signatureDialog.onTrue();
                            }}
                            disabled={isTimesheetReadOnly}
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
                            {workerInitials[entry.id] ? 'Signed' : 'Sign'}
                          </Button>
                          {workerInitials[entry.id] && (
                            <Box
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 0.5,
                                p: 0.5,
                                height: 32,
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <img
                                src={workerInitials[entry.id]}
                                alt="Initial"
                                style={{ height: '24px', width: 'auto' }}
                              />
                            </Box>
                          )}
                        </Stack>
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
                break: false,
                shift_end: null,
                initial: null,
              };

              // Calculate total hours
              let totalHours = 0;
              if (data.shift_start && data.shift_end) {
                const start = dayjs(data.shift_start);
                const end = dayjs(data.shift_end);
                let minutes = end.diff(start, 'minute');
                if (data.break) {
                  minutes -= 30;
                }
                totalHours = Math.round((minutes / 60) * 10) / 10;
              }

              return (
                <Card key={entry.id} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                  {/* Worker Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Avatar
                      src={entry.worker_photo_url || undefined}
                      alt={`${entry.worker_first_name} ${entry.worker_last_name}`}
                      sx={{ width: 32, height: 32 }}
                    >
                      {entry.worker_first_name?.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2">
                          {entry.worker_first_name} {entry.worker_last_name}
                        </Typography>
                        {entry.position && (
                          <Chip
                            label={entry.position.toUpperCase()}
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
                    </Box>
                  </Box>

                  {/* MOB & Break Checkboxes */}
                  <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Checkbox
                        checked={data.mob}
                        onChange={(e) => updateWorkerField(entry.id, 'mob', e.target.checked)}
                        disabled={isTimesheetReadOnly}
                      />
                      <Typography variant="body2">MOB</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Checkbox
                        checked={data.break}
                        onChange={(e) => updateWorkerField(entry.id, 'break', e.target.checked)}
                        disabled={isTimesheetReadOnly}
                      />
                      <Typography variant="body2">Break</Typography>
                    </Box>
                  </Box>

                  {/* Time Inputs */}
                  <Stack spacing={2} sx={{ mb: 2 }}>
                    <TimePicker
                      label="Start Time"
                      value={data.shift_start ? dayjs(data.shift_start) : null}
                      onChange={(newValue) => {
                        if (newValue && entry.original_start_time) {
                          const baseDate = dayjs(entry.original_start_time);
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

                    <TimePicker
                      label="End Time"
                      value={data.shift_end ? dayjs(data.shift_end) : null}
                      onChange={(newValue) => {
                        if (newValue && entry.original_end_time) {
                          const baseDate = dayjs(entry.original_end_time);
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
                      Total: {totalHours} hrs
                    </Typography>
                  </Box>

                  {/* Initial Signature Button */}
                  <Stack spacing={1}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => {
                        setCurrentWorkerIdForSignature(entry.id);
                        signatureDialog.onTrue();
                      }}
                      disabled={isTimesheetReadOnly}
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
                      {workerInitials[entry.id] ? 'Signed' : 'Add Initial'}
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
                          bgcolor: 'background.neutral',
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
                </Card>
              );
            })}
          </Stack>
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
                borderRadius: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: 'info.darker',
                  fontWeight: 'medium',
                  lineHeight: 1.5,
                }}
              >
                By signing this invoice as a representative of the customer confirms that the hours
                recorded are accurate and were performed by the name of the employee(s) in a
                satisfactory manner.
              </Typography>
            </Paper>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              {(() => {
                // Find client signature from signatures array
                const clientSignatureRecord = (timesheet.signatures as any)?.find((sig: any) => {
                  try {
                    const signatureData = JSON.parse(sig.signature_data || '{}');
                    return signatureData.client;
                  } catch {
                    return false;
                  }
                });

                const clientSignatureData = clientSignatureRecord
                  ? JSON.parse(clientSignatureRecord.signature_data).client
                  : null;

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
                        objectFit: 'contain',
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
        <Box
          sx={{ p: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}
        >
          <Button variant="outlined" onClick={() => router.push(paths.schedule.timesheet.root)}>
            Cancel
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={async () => {
                const toastId = toast.loading('Saving timesheet...');
                try {
                  await saveAllEntries();
                  await queryClient.refetchQueries({
                    queryKey: ['timesheet-detail-query', timesheet.id],
                  });
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
            <Button
              variant="contained"
              onClick={submitDialog.onTrue}
              disabled={isTimesheetReadOnly}
              startIcon={<Iconify icon="solar:check-circle-bold" />}
              color="success"
            >
              Submit
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Signature Dialog for Initial */}
      <TimeSheetSignatureDialog
        title={
          currentWorkerIdForSignature ? 'Worker Initial Signature' : 'Client Signature Required'
        }
        type={currentWorkerIdForSignature ? 'initial' : 'client'}
        dialog={signatureDialog}
        onSave={(signature, type) => {
          if (signature) {
            if (currentWorkerIdForSignature) {
              handleInitialSignature(signature);
            } else {
              handleSignatureSave(signature, type);
            }
          }
        }}
      />

      {renderSubmitDialog()}

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
          const selectedWorker = jobWorkers.workers.find(
            (w: any) => w.user_id === selectedWorkerId
          );
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
    </>
  );
}
