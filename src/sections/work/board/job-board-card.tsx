import type { IJob } from 'src/types/job';
import type { Theme, SxProps } from '@mui/material/styles';

import dayjs from 'dayjs';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { usePopover } from 'minimal-shared/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Accordion from '@mui/material/Accordion';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { formatPhoneNumberSimple } from 'src/utils/format-number';
import { getPositionColor, getPositionLabel, getWorkerStatusColor } from 'src/utils/format-role';

import { fetcher, endpoints } from 'src/lib/axios';
import { JOB_EQUIPMENT_OPTIONS } from 'src/assets/data/job';
import { VEHICLE_TYPE_OPTIONS } from 'src/assets/data/vehicle';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

import { JobDetailsDialog } from '../calendar/job-details-dialog';
import { AcceptOnBehalfDialog } from '../job/accept-on-behalf-dialog';
import { JobBoardQuickEditDialog } from './job-board-quick-edit-dialog';

// ----------------------------------------------------------------------

type AvatarPalette =
  | 'primary'
  | 'secondary'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'grey';

const getAvatarPaletteKey = (firstName?: string, lastName?: string): AvatarPalette => {
  const charAt = (firstName || lastName || '').charAt(0).toLowerCase();

  if (['a', 'c', 'f'].includes(charAt)) return 'primary';
  if (['e', 'd', 'h'].includes(charAt)) return 'secondary';
  if (['i', 'k', 'l'].includes(charAt)) return 'info';
  if (['m', 'n', 'p'].includes(charAt)) return 'success';
  if (['q', 's', 't'].includes(charAt)) return 'warning';
  if (['v', 'x', 'y'].includes(charAt)) return 'error';

  return 'grey';
};

// ----------------------------------------------------------------------

type Props = {
  sx?: SxProps<Theme>;
  job: IJob;
  disabled?: boolean;
  viewMode?: 'day' | 'week';
};

export function JobBoardCard({ job, disabled, sx, viewMode = 'day' }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const menuActions = usePopover();
  const [quickEditOpen, setQuickEditOpen] = useState(false);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobDetailsOpen, setJobDetailsOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState(job.notes || '');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const { attributes, isDragging, setNodeRef, transform } = useSortable({
    id: job.id,
    data: { type: 'item' },
  });

  const invalidateBoardQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['jobs'], exact: false });
  }, [queryClient]);

  // Update noteValue when job.notes changes
  useEffect(() => {
    setNoteValue(job.notes || '');
  }, [job.notes]);

  // Handle saving note
  const handleSaveNote = useCallback(async () => {
    if (!job.id) return;
    
    setIsSavingNote(true);
    try {
      await fetcher([
        `${endpoints.work.job}/${job.id}/save-without-notifications`,
        {
          method: 'PUT',
          data: {
            notes: noteValue || null,
          },
        },
      ]);

      // Invalidate queries to refresh the job data
      queryClient.invalidateQueries({ queryKey: ['jobs'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['job', job.id] });
      queryClient.invalidateQueries({ queryKey: ['job-details-dialog'] });

      toast.success('Note updated successfully!');
      setIsEditingNote(false);
      
      // Update the job data locally
      job.notes = noteValue || undefined;
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note. Please try again.');
    } finally {
      setIsSavingNote(false);
    }
  }, [job, noteValue, queryClient]);

  const handleClick = (e: React.MouseEvent) => {
    // Don't open if clicking on interactive elements
    const target = e.target as HTMLElement;
    
    // Check if click originated from an interactive element that should not trigger card click
    const clickedIconButton = target.closest('.MuiIconButton-root');
    const clickedMenu = target.closest('.MuiPopover-root, .MuiMenu-root');
    const clickedAccordion = target.closest('.MuiAccordionSummary-root');
    
    // Block if clicking on IconButton, Menu, or Accordion
    if (clickedIconButton || clickedMenu || clickedAccordion) {
      return;
    }
    
    // Only open dialog if not dragging and no other dialogs are open
    if (!isDragging && 
        !acceptDialogOpen && 
        !quickEditOpen && 
        !cancelDialogOpen && 
        !deleteDialogOpen && 
        !jobDetailsOpen && 
        !menuActions.open) {
      setJobDetailsOpen(true);
    }
  };

  const handleCloseJobDetails = () => {
    setJobDetailsOpen(false);
  };

  const handleQuickEdit = () => {
    menuActions.onClose();
    setQuickEditOpen(true);
  };

  const handleFullEdit = () => {
    menuActions.onClose();
    router.push(paths.work.job.edit(job.id));
  };

  const handleDuplicate = () => {
    menuActions.onClose();
    router.push(`${paths.work.job.create}?duplicate=${job.id}`);
  };

  const handleOpenCancelDialog = () => {
    menuActions.onClose();
    setCancelDialogOpen(true);
  };

  const handleOpenDeleteDialog = () => {
    menuActions.onClose();

    // Prevent deletion if job is not yet cancelled (consistent with Job List workflow)
    if (job.status !== 'cancelled') {
      toast.error('Please cancel the job first before deleting.');
      return;
    }

    setDeleteDialogOpen(true);
  };

  const extractErrorMessage = (error: any, fallback: string) => {
    if (error?.error) return error.error;
    if (error?.message) return error.message;
    if (typeof error === 'string') return error;
    return fallback;
  };

  const handleCancelJob = async () => {
    setIsCancelling(true);
    const toastId = toast.loading('Cancelling job...');
    try {
      await fetcher([
        `${endpoints.work.job}/${job.id}`,
        {
          method: 'PUT',
          data: {
            status: 'cancelled',
            cancellation_reason: null,
          },
        },
      ]);
      toast.dismiss(toastId);
      toast.success('Job cancelled successfully!');
      setCancelDialogOpen(false);
      invalidateBoardQueries();
    } catch (error: any) {
      toast.dismiss(toastId);
      const message = extractErrorMessage(error, 'Failed to cancel the job.');
      toast.error(message);
      console.error('Cancel job error:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDeleteJob = async () => {
    setIsDeleting(true);
    const toastId = toast.loading('Deleting job...');
    try {
      await fetcher([`${endpoints.work.job}/${job.id}`, { method: 'DELETE' }]);
      toast.dismiss(toastId);
      toast.success('Job deleted successfully!');
      setDeleteDialogOpen(false);
      invalidateBoardQueries();
    } catch (error: any) {
      toast.dismiss(toastId);
      const message = extractErrorMessage(error, 'Failed to delete the job.');
      toast.error(message);
      console.error('Delete job error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAcceptOnBehalf = (worker: any) => {
    setSelectedWorker(worker);
    setAcceptDialogOpen(true);
  };

  const handleAcceptSuccess = () => {
    invalidateBoardQueries();
    setAcceptDialogOpen(false);
    setSelectedWorker(null);
  };

  const handleCloseCancelDialog = () => {
    if (!isCancelling) {
      setCancelDialogOpen(false);
    }
  };

  const handleCloseDeleteDialog = () => {
    if (!isDeleting) {
      setDeleteDialogOpen(false);
    }
  };

  const formatTime = (time: any) => dayjs(time).format('h:mm A');

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

  const formatEquipmentType = (type: string) => {
    const option = JOB_EQUIPMENT_OPTIONS.find((opt) => opt.value === type);
    return option?.label || type;
  };

  // Get status color (matches job-table-row.tsx)
  const getStatusColor = (status: string) => {
    const statusMap: Record<string, 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error'> = {
      draft: 'info',
      pending: 'warning',
      ready: 'primary',
      in_progress: 'secondary',
      completed: 'success',
      cancelled: 'error',
    };
    return statusMap[status] || 'default';
  };

  // Get status label (matches job-table-row.tsx)
  const getStatusLabel = (status: string) => {
    const STATUS_LABELS: Record<string, string> = {
      draft: 'Draft',
      pending: 'Pending',
      ready: 'Ready',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return STATUS_LABELS[status] || status;
  };

  // Job attention/warning logic (same as job-table-row.tsx)
  const isOverdue = job.isOverdue || false;
  
  const now = dayjs();
  const startTime = dayjs(job.start_time);
  const endTime = dayjs(job.end_time);
  const hoursUntilStart = startTime.diff(now, 'hour');
  
  const isUrgent =
    hoursUntilStart <= 24 &&
    hoursUntilStart > 0 &&
    job.status !== 'ready' &&
    job.status !== 'completed' &&
    job.status !== 'cancelled';

  const isDuringJobTime = now.isAfter(startTime) && now.isBefore(endTime);
  const isRunningWithoutAcceptance =
    isDuringJobTime && (job.status === 'pending' || job.status === 'draft');

  const hasRejectedWorkers =
    job.workers?.some((worker: any) => worker.status === 'rejected') || false;
  const isPastEndDate = now.isAfter(endTime);
  const isOverdueWithRejections = isPastEndDate && hasRejectedWorkers;

  const isDraftNeedingNotification =
    job.status === 'draft' && !isOverdue && !isOverdueWithRejections;

  const shouldShowError =
    isOverdue || isUrgent || isRunningWithoutAcceptance || isOverdueWithRejections;
  const shouldShowWarning = !shouldShowError && isDraftNeedingNotification;

  const getWarningMessage = () => {
    if (shouldShowError) {
      if (isUrgent) {
        return `Urgent: Job starts in ${hoursUntilStart} ${hoursUntilStart === 1 ? 'hour' : 'hours'} but not ready!`;
      }
      if (isOverdueWithRejections) {
        return 'Job is overdue and has rejected workers - needs immediate attention';
      }
      if (isOverdue) {
        return "Job is overdue but workers haven't accepted";
      }
      if (isRunningWithoutAcceptance) {
        return "Job is currently running but workers haven't accepted yet!";
      }
      return 'Job needs attention';
    }
    if (isDraftNeedingNotification) {
      return 'Draft job - Send notifications to workers';
    }
    return 'Job needs attention';
  };

  return (
    <>
    <Card
      ref={disabled ? undefined : setNodeRef}
      onClick={handleClick}
      sx={{
        p: 2,
        cursor: 'pointer',
        position: 'relative',
        width: viewMode === 'day' ? 350 : 290,
        minWidth: viewMode === 'day' ? 350 : 290,
        maxWidth: viewMode === 'day' ? 350 : 290,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: theme.transitions.create(['box-shadow', 'opacity', 'background-color']),
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        // Background color for jobs that need attention (same as job list)
        ...(shouldShowError && {
          backgroundColor: 'rgba(var(--palette-error-mainChannel) / 0.12)',
          '&:hover': {
            backgroundColor: 'rgba(var(--palette-error-mainChannel) / 0.16)',
            boxShadow: theme.customShadows.z8,
          },
        }),
        ...(shouldShowWarning && !shouldShowError && {
          backgroundColor: 'rgba(var(--palette-warning-mainChannel) / 0.12)',
          '&:hover': {
            backgroundColor: 'rgba(var(--palette-warning-mainChannel) / 0.16)',
            boxShadow: theme.customShadows.z8,
          },
        }),
        ...(!shouldShowError && !shouldShowWarning && {
          '&:hover': {
            boxShadow: theme.customShadows.z8,
          },
        }),
        ...sx,
      }}
      {...attributes}
    >
      <Stack spacing={2}>
        {/* Header with Job Number, Status, Warning Badge, and Action Menu */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack spacing={0.5}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600 }}
            >
              #{job.job_number}
            </Typography>
            {job.po_number && (
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                {job.po_number}
              </Typography>
            )}
          </Stack>

          <Stack direction="row" alignItems="center" spacing={0.5}>
            {/* Warning/Error Badge */}
            {(shouldShowError || shouldShowWarning) && (
              <Tooltip
                title={
                  <Box sx={{ fontSize: '12px', lineHeight: 1.4 }}>
                    <strong>{getWarningMessage()}</strong>
                  </Box>
                }
                placement="top"
                arrow
                componentsProps={{
                  tooltip: {
                    sx: {
                      fontSize: '12px',
                      maxWidth: 250,
                      bgcolor: 'grey.800',
                      '& .MuiTooltip-arrow': {
                        color: 'grey.800',
                      },
                    },
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Iconify
                    icon={shouldShowError ? 'solar:danger-bold' : 'solar:info-circle-bold'}
                    width={16}
                    sx={{ color: shouldShowError ? 'error.main' : 'warning.main' }}
                  />
                </Box>
              </Tooltip>
            )}

            <Label variant="soft" color={getStatusColor(job.status)}>
              {getStatusLabel(job.status)}
            </Label>

            {/* Action Menu Button */}
            <Tooltip title="More actions" placement="top" arrow>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  menuActions.onOpen(e);
                }}
                sx={{
                  color: 'text.disabled',
                  '&:hover': {
                    color: 'text.primary',
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Iconify icon="eva:more-vertical-fill" width={20} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Customer and Client with Avatars */}
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar
              src={job.company.logo_url}
              alt={job.company.name}
              sx={{ width: 28, height: 28, fontSize: 14 }}
            >
              {job.company.name?.charAt(0).toUpperCase() || 'C'}
            </Avatar>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {job.company.name}
            </Typography>
          </Stack>
          
          {job.client && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Avatar
                src={job.client.logo_url}
                alt={job.client.name}
                sx={{ width: 28, height: 28, fontSize: 14 }}
              >
                {job.client.name?.charAt(0).toUpperCase() || 'C'}
              </Avatar>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {job.client.name}
              </Typography>
            </Stack>
          )}
        </Stack>

        {/* Site Address */}
        {job.site && (
          <Stack direction="row" alignItems="flex-start" spacing={0.5}>
            <Iconify icon="mingcute:location-fill" width={18} sx={{ color: 'text.secondary', mt: 0.2 }} />
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                flex: 1,
                lineHeight: 1.4,
              }}
            >
              {job.site.display_address || `${job.site.street_number || ''} ${job.site.street_name || ''}, ${job.site.city || ''}`}
            </Typography>
          </Stack>
        )}

        {/* Time */}
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Iconify icon="solar:clock-circle-bold" width={18} sx={{ color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {formatTime(job.start_time)} - {formatTime(job.end_time)}
          </Typography>
        </Stack>

        {/* Status */}
 

        {/* Workers List */}
        {job.workers && job.workers.length > 0 && (
          <Stack spacing={1}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Workers ({job.workers.length})
            </Typography>
            <Stack spacing={1.5} divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
              {job.workers.map((worker) => {
                const isTimesheetManager = job.timesheet_manager_id === worker.id;
                
                // Get vehicle info if applicable
                const vehicle = job.vehicles?.find((v) => v.operator?.id === worker.id);
                
                // Use the reusable utility function for position label
                const positionLabel = getPositionLabel(worker.position);
                const responseFirstName = worker.response_by?.first_name || worker.first_name;
                const responseLastName = worker.response_by?.last_name || worker.last_name;
                const responsePaletteKey = getAvatarPaletteKey(responseFirstName, responseLastName);

                return (
                  <Stack key={worker.id} spacing={0.5}>
                    {isTimesheetManager && (
                      <Chip
                        label="Timesheet Manager"
                        size="small"
                        color="info"
                        variant="soft"
                        sx={{ 
                          height: 20,
                          fontSize: '0.7rem',
                          alignSelf: 'flex-start',
                        }}
                      />
                    )}
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Avatar
                        src={worker.photo_url}
                        alt={`${worker.first_name} ${worker.last_name}`}
                        sx={{ width: 28, height: 28, fontSize: 14 }}
                      >
                        {worker.first_name?.charAt(0).toUpperCase() || 'W'}
                      </Avatar>
                      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {worker.first_name} {worker.last_name}
                        </Typography>
                        {worker.position && (
                          <Chip
                            label={positionLabel}
                            size="small"
                            color={getPositionColor(worker.position)}
                            variant="soft"
                            sx={{ 
                              height: 20,
                              fontSize: '0.7rem',
                            pointerEvents: 'none',
                            }}
                          />
                        )}
                      </Stack>
                      {worker.status && (
                        <>
                          {worker.status === 'pending' ? (
                            <Label
                              variant="soft"
                              color={getWorkerStatusColor(worker.status)}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleAcceptOnBehalf(worker);
                              }}
                              sx={{ 
                                fontSize: 10, 
                                px: 0.6, 
                                py: 0.3,
                                cursor: 'pointer',
                                '&:hover': {
                                  opacity: 0.8,
                                },
                              }}
                            >
                              {worker.status}
                            </Label>
                          ) : worker.status === 'accepted' && worker.response_at ? (
                            <Tooltip
                              title={
                                <Box sx={{ p: 0.5 }}>
                                  <Stack spacing={0.75}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <Avatar
                                        src={worker.response_by?.photo_url || worker.photo_url}
                                        sx={{
                                          width: 24,
                                          height: 24,
                                          fontSize: '0.75rem',
                                          ...(worker.response_by?.photo_url || worker.photo_url
                                            ? {}
                                            : {
                                                bgcolor: (pal) => {
                                                  const palette = (pal.palette as any)[responsePaletteKey];
                                                  return palette?.main || pal.palette.grey[500];
                                                },
                                                color: (pal) => {
                                                  const palette = (pal.palette as any)[responsePaletteKey];
                                                  return palette?.contrastText || pal.palette.common.white;
                                                },
                                              }),
                                        }}
                                      >
                                      {(worker.response_by?.first_name || worker.first_name)?.charAt(0)?.toUpperCase()}
                                      </Avatar>
                                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                        {worker.response_by
                                          ? `${worker.response_by.first_name} ${worker.response_by.last_name}`
                                          : `${worker.first_name} ${worker.last_name}`}
                                      </Typography>
                                    </Stack>
                                    <Typography variant="caption" sx={{ opacity: 0.8, pl: 3.5 }}>
                                      {dayjs(worker.response_at).format('MMM DD, YYYY h:mm A')}
                                    </Typography>
                                  </Stack>
                                </Box>
                              }
                              placement="top"
                              arrow
                            >
                              <Label
                                variant="soft"
                                color={getWorkerStatusColor(worker.status)}
                                sx={{ fontSize: 10, px: 0.6, py: 0.3 }}
                              >
                                {worker.status}
                              </Label>
                            </Tooltip>
                          ) : worker.status === 'rejected' && worker.response_at ? (
                            <Tooltip
                              title={
                                <Box sx={{ p: 0.5 }}>
                                  <Stack spacing={0.75}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <Avatar
                                        src={worker.response_by?.photo_url || worker.photo_url}
                                        sx={{
                                          width: 24,
                                          height: 24,
                                          fontSize: '0.75rem',
                                          ...(worker.response_by?.photo_url || worker.photo_url
                                            ? {}
                                            : {
                                                bgcolor: (pal) => {
                                                  const palette = (pal.palette as any)[responsePaletteKey];
                                                  return palette?.main || pal.palette.grey[500];
                                                },
                                                color: (pal) => {
                                                  const palette = (pal.palette as any)[responsePaletteKey];
                                                  return palette?.contrastText || pal.palette.common.white;
                                                },
                                              }),
                                        }}
                                      >
                                      {(worker.response_by?.first_name || worker.first_name)?.charAt(0)?.toUpperCase()}
                                      </Avatar>
                                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                        {worker.response_by
                                          ? `${worker.response_by.first_name} ${worker.response_by.last_name}`
                                          : `${worker.first_name} ${worker.last_name}`}
                                      </Typography>
                                    </Stack>
                                    <Typography variant="caption" sx={{ opacity: 0.8, pl: 3.5 }}>
                                      {dayjs(worker.response_at).format('MMM DD, YYYY h:mm A')}
                                    </Typography>
                                  </Stack>
                                </Box>
                              }
                              placement="top"
                              arrow
                            >
                              <Label
                                variant="soft"
                                color={getWorkerStatusColor(worker.status)}
                                sx={{ fontSize: 10, px: 0.6, py: 0.3 }}
                              >
                                {worker.status}
                              </Label>
                            </Tooltip>
                          ) : (
                            <Label
                              variant="soft"
                              color={getWorkerStatusColor(worker.status)}
                              sx={{ fontSize: 10, px: 0.6, py: 0.3 }}
                            >
                              {worker.status}
                            </Label>
                          )}
                        </>
                      )}
                    </Stack>
                    
                    {/* Worker Details */}
                    <Stack spacing={0.5}>
                      {(worker.phone_number || (worker.start_time && worker.end_time)) && (
                        <Stack direction="row" alignItems="center" sx={{justifyContent: 'space-between'}}>
                          {/* Phone */}
                          {worker.phone_number && (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Iconify icon="solar:phone-bold" width={14} sx={{ color: 'text.secondary' }} />
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                {formatPhoneNumberSimple(worker.phone_number)}
                              </Typography>
                            </Stack>
                          )}
                          
                          {/* Time */}
                          {worker.start_time && worker.end_time && (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Iconify icon="solar:clock-circle-bold" width={14} sx={{ color: 'text.secondary' }} />
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                {formatTime(worker.start_time)} - {formatTime(worker.end_time)}
                              </Typography>
                            </Stack>
                          )}
                        </Stack>
                      )}
                      
                      {/* Vehicle for this worker */}
                      {vehicle && (
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Iconify icon="carbon:delivery" width={14} sx={{ color: 'text.secondary' }} />
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                            {formatVehicleType(vehicle.type)} - {vehicle.license_plate || vehicle.unit_number
                              ? `${vehicle.license_plate || ''} ${vehicle.unit_number ? `${vehicle.unit_number}` : ''}`.trim()
                              : 'N/A'}
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          </Stack>
        )}

        {/* Equipment */}
        {job.equipments && job.equipments.length > 0 && (
          <Stack spacing={1}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Equipment ({job.equipments.length})
            </Typography>
            <Stack spacing={0.5}>
              {job.equipments.map((equipment, index) => (
                <Stack key={equipment.id || index} direction="row" alignItems="center" spacing={0.5} justifyContent="space-between">
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {formatEquipmentType(equipment.type)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {equipment.quantity}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
        )}


        {/* Job Notes - Accordion */}
        {(job.notes || isEditingNote) && (
          <Accordion
            disableGutters
            elevation={0}
            defaultExpanded={isEditingNote}
            sx={{
              backgroundColor: 'transparent !important',
              '&:before': {
                display: 'none',
              },
              '&.Mui-expanded': {
                backgroundColor: 'transparent !important',
              },
              '& .MuiAccordionSummary-root': {
                minHeight: 'auto',
                padding: 0,
                backgroundColor: 'transparent !important',
                '&.Mui-expanded': {
                  minHeight: 'auto',
                  backgroundColor: 'transparent !important',
                },
                '&:hover': {
                  backgroundColor: 'transparent !important',
                },
              },
              '& .MuiAccordionSummary-content': {
                margin: '8px 0',
                '&.Mui-expanded': {
                  margin: '8px 0',
                },
              },
              '& .MuiAccordionDetails-root': {
                backgroundColor: 'transparent !important',
              },
            }}
          >
            <AccordionSummary
              expandIcon={
                !isEditingNote ? (
                  <Iconify
                    icon="eva:arrow-ios-downward-fill"
                    width={18}
                    sx={{
                      transform: 'rotate(0deg)',
                      transition: 'transform 0.2s',
                      '&.Mui-expanded &': {
                        transform: 'rotate(180deg)',
                      },
                    }}
                  />
                ) : null
              }
              sx={{
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: 'transparent',
                },
                '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
                  transform: 'rotate(180deg)',
                },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Notes
                </Typography>
                {!isEditingNote && !job.notes && (
                  <Tooltip title="Add Note">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingNote(true);
                        setNoteValue('');
                      }}
                      sx={{ ml: 'auto' }}
                    >
                      <Iconify icon="mingcute:add-line" width={16} />
                    </IconButton>
                  </Tooltip>
                )}
                {!isEditingNote && job.notes && (
                  <Tooltip title="Edit Note">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingNote(true);
                        setNoteValue(job.notes || '');
                      }}
                      sx={{ ml: 'auto' }}
                    >
                      <Iconify icon="solar:pen-bold" width={16} />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </AccordionSummary>
            <AccordionDetails
              sx={{
                backgroundColor: 'transparent',
                padding: 0,
              }}
            >
              {isEditingNote ? (
                <Stack spacing={1.5}>
                  <TextField
                    multiline
                    rows={4}
                    value={noteValue}
                    onChange={(e) => setNoteValue(e.target.value)}
                    placeholder="Enter note..."
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingNote(false);
                        setNoteValue(job.notes || '');
                      }}
                      disabled={isSavingNote}
                    >
                      Cancel
                    </Button>
                    <LoadingButton
                      size="small"
                      variant="contained"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveNote();
                      }}
                      loading={isSavingNote}
                    >
                      Save
                    </LoadingButton>
                  </Stack>
                </Stack>
              ) : job.notes ? (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    backgroundColor: 'grey.100',
                    border: '1px solid',
                    borderColor: 'grey.300',
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                    {job.notes}
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    backgroundColor: 'grey.100',
                    border: '1px solid',
                    borderColor: 'grey.300',
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.4 }}>
                    No note
                  </Typography>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        )}
      </Stack>

      {/* Action Menu */}
      <CustomPopover
        open={menuActions.open}
        onClose={menuActions.onClose}
        anchorEl={menuActions.anchorEl}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem onClick={handleQuickEdit}>
            <Iconify icon="solar:users-group-rounded-bold" width={20} sx={{ mr: 1 }} />
            Quick Edit Workers
          </MenuItem>
          <MenuItem onClick={handleFullEdit}>
            <Iconify icon="solar:pen-bold" width={20} sx={{ mr: 1 }} />
            Full Edit
          </MenuItem>
          <MenuItem onClick={handleDuplicate}>
            <Iconify icon="solar:copy-bold" width={20} sx={{ mr: 1 }} />
            Duplicate
          </MenuItem>
          {job.status !== 'cancelled' ? (
            <MenuItem onClick={handleOpenCancelDialog}>
              <Iconify icon="solar:shield-check-bold" width={20} sx={{ mr: 1, color: 'warning.main' }} />
              Cancel Job
            </MenuItem>
          ) : (
            <MenuItem onClick={handleOpenDeleteDialog}>
              <Iconify icon="solar:trash-bin-trash-bold" width={20} sx={{ mr: 1, color: 'error.main' }} />
              Delete Job
            </MenuItem>
          )}
        </MenuList>
      </CustomPopover>

      {/* Quick Edit Dialog */}
      <JobBoardQuickEditDialog
        open={quickEditOpen}
        onClose={() => setQuickEditOpen(false)}
        job={job}
        onSuccess={() => {
          // Dialog will handle query invalidation
        }}
      />

      {/* Cancel Job Dialog */}
      <Dialog open={cancelDialogOpen} onClose={handleCloseCancelDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Job</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to cancel <strong>#{job.job_number}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This will mark the job as cancelled and notify all assigned workers via SMS and email.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog} disabled={isCancelling} sx={{ mr: 1 }}>
            No, Keep Job
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleCancelJob}
            disabled={isCancelling}
            startIcon={isCancelling ? <CircularProgress size={16} /> : null}
          >
            {isCancelling ? 'Cancelling...' : 'Yes, Cancel Job'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Job Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Job</DialogTitle>
        <DialogContent>
          {job.status !== 'cancelled' ? (
            <Typography variant="body2" color="error" sx={{ mb: 2 }}>
              Please cancel this job before deleting it.
            </Typography>
          ) : (
            <Typography variant="body1" sx={{ mb: 2 }}>
              Do you want to delete <strong>#{job.job_number}</strong>? This action cannot be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={isDeleting} sx={{ mr: 1 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteJob}
            disabled={isDeleting || job.status !== 'cancelled'}
            startIcon={isDeleting ? <CircularProgress size={16} /> : null}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Accept On Behalf Dialog */}
      {acceptDialogOpen && selectedWorker && (
        <AcceptOnBehalfDialog
          open={acceptDialogOpen}
          onClose={() => {
            setAcceptDialogOpen(false);
          }}
          jobId={job.id}
          worker={selectedWorker}
          onSuccess={handleAcceptSuccess}
        />
      )}
    </Card>

    {/* Job Details Dialog - Outside Card to prevent event propagation issues */}
    <JobDetailsDialog
      open={jobDetailsOpen}
      onClose={handleCloseJobDetails}
      jobId={job.id}
    />
    </>
  );
}



