import type { IJob } from 'src/types/job';
import type { Theme, SxProps } from '@mui/material/styles';

import dayjs from 'dayjs';
import { useState } from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Accordion from '@mui/material/Accordion';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { formatPhoneNumberSimple } from 'src/utils/format-number';
import { getPositionColor, getPositionLabel, getWorkerStatusColor } from 'src/utils/format-role';

import { JOB_EQUIPMENT_OPTIONS } from 'src/assets/data/job';
import { VEHICLE_TYPE_OPTIONS } from 'src/assets/data/vehicle';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

import { JobBoardQuickEditDialog } from './job-board-quick-edit-dialog';

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

  const menuActions = usePopover();
  const [quickEditOpen, setQuickEditOpen] = useState(false);

  const { attributes, isDragging, setNodeRef, transform } = useSortable({
    id: job.id,
    data: { type: 'item' },
  });

  const handleClick = () => {
    router.push(paths.work.job.edit(job.id));
  };

  const handleQuickEdit = () => {
    menuActions.onClose();
    setQuickEditOpen(true);
  };

  const handleFullEdit = () => {
    menuActions.onClose();
    handleClick();
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

  // Get status color
  const getStatusColor = (status: string) => {
    const statusMap: Record<string, 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error'> = {
      draft: 'info',
      pending: 'warning',
      ready: 'primary',
      'in-progress': 'primary',
      completed: 'success',
      cancelled: 'error',
    };
    return statusMap[status] || 'default';
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
    <Card
      ref={disabled ? undefined : setNodeRef}
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
              onClick={handleClick}
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

            <Label variant="soft" color={getStatusColor(job.status)} sx={{ textTransform: 'capitalize' }}>
              {job.status}
            </Label>

            {/* Action Menu Button */}
            <Tooltip title="More actions" placement="top" arrow>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
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
                            }}
                          />
                        )}
                      </Stack>
                      {worker.status && (
                        <Label
                          variant="soft"
                          color={getWorkerStatusColor(worker.status)}
                          sx={{ fontSize: 10, px: 0.6, py: 0.3 }}
                        >
                          {worker.status}
                        </Label>
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
        {job.notes && (
          <Accordion
            disableGutters
            elevation={0}
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
              expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={18} />}
              sx={{
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: 'transparent',
                },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Notes
              </Typography>
            </AccordionSummary>
            <AccordionDetails
              sx={{
                backgroundColor: 'transparent',
                padding: 0,
              }}
            >
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
                  {job.notes}
                </Typography>
              </Box>
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
    </Card>
  );
}



