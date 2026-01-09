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
import { getPositionColor, getPositionLabel, getWorkerStatusColor, getWorkerStatusLabel } from 'src/utils/format-role';

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
    // Navigate to open job edit page if it's an open job, otherwise to regular job edit page
    if (job.is_open_job) {
      router.push(paths.work.openJob.edit(job.id));
    } else {
      router.push(paths.work.job.edit(job.id));
    }
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
