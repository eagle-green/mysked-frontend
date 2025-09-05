import type { IJob, IJobWorker, IJobEquipment } from 'src/types/job';

import dayjs from 'dayjs';
import { useState } from 'react';
import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemText from '@mui/material/ListItemText';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDate, fTime } from 'src/utils/format-time';
import { formatPhoneNumberSimple } from 'src/utils/format-number';

import { provinceList } from 'src/assets/data/assets';
import { VEHICLE_TYPE_OPTIONS } from 'src/assets/data/vehicle';
import { JOB_POSITION_OPTIONS, JOB_EQUIPMENT_OPTIONS } from 'src/assets/data/job';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

import { JobNotifyDialog } from './open-job-notify-dialog';

// ----------------------------------------------------------------------

type Props = {
  row: IJob;
  selected: boolean;
  detailsHref: string;
  editHref: string;
  onSelectRow: () => void;
  onDeleteRow: () => Promise<void>;
  onCancelRow: () => Promise<void>;
  showWarning?: boolean;
};

// Helper to build full address from site fields
function getFullAddress(site: any) {
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
    site.country,
  ]
    .filter(Boolean)
    .join(', ');

  // Replace province name with code
  provinceList.forEach(({ value, code }) => {
    addr = addr.replace(value, code);
  });
  return addr;
}

const formatVehicleType = (type: string) => {
  const option = VEHICLE_TYPE_OPTIONS.find((opt) => opt.value === type);
  return option?.label || type;
};

const formatEquipmentType = (type: string) => {
  const option = JOB_EQUIPMENT_OPTIONS.find((opt) => opt.value === type);
  return option?.label || type;
};

// Add a mapping for status display labels
const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  open: 'Open',
  posted: 'Posted',
  pending: 'Pending',
  ready: 'Ready',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function JobTableRow(props: Props) {
  const {
    row,
    selected,
    onSelectRow,
    onDeleteRow,
    onCancelRow,
    detailsHref,
    editHref,
    showWarning = false,
  } = props;
  const confirmDialog = useBoolean();
  const cancelDialog = useBoolean();
  const menuActions = usePopover();
  const collapseRow = useBoolean();
  const responseDialog = useBoolean();
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Check if job is overdue and needs attention
  const isOverdue = row.isOverdue || false;

  // Check if job is urgent (starts within 24 hours but not ready)
  const now = dayjs();
  const startTime = dayjs(row.start_time);
  const endTime = dayjs(row.end_time);
  const hoursUntilStart = startTime.diff(now, 'hour');
  const isUrgent =
    hoursUntilStart <= 24 &&
    hoursUntilStart > 0 &&
    row.status !== 'ready' &&
    row.status !== 'completed' &&
    row.status !== 'cancelled';

  // Check if job is currently running but workers haven't accepted (pending/draft during job time)
  const isDuringJobTime = now.isAfter(startTime) && now.isBefore(endTime);
  const isRunningWithoutAcceptance =
    isDuringJobTime && (row.status === 'pending' || row.status === 'draft');

  // Check if job has passed end date and has rejected workers
  const hasRejectedWorkers =
    row.workers?.some((worker: any) => worker.status === 'rejected') || false;
  const isPastEndDate = now.isAfter(endTime);
  const isOverdueWithRejections = isPastEndDate && hasRejectedWorkers;

  // Check if job is draft and needs notifications sent (but not if it's overdue with rejections)
  const isDraftNeedingNotification =
    row.status === 'draft' && !isOverdue && !isOverdueWithRejections;

  const shouldShowWarning = showWarning || isDraftNeedingNotification;
  const shouldShowError =
    isUrgent || isRunningWithoutAcceptance || isOverdue || isOverdueWithRejections;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteRow();
      confirmDialog.onFalse();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await onCancelRow();
      cancelDialog.onFalse();
    } finally {
      setIsCancelling(false);
    }
  };

  const handleStatusClick = (workerId: string) => {
    setSelectedWorkerId(workerId);
    responseDialog.onTrue();
  };

  if (!row || !row.id) return null;

  function renderPrimaryRow() {
    if (!row || !row.id) return null;
    return (
      <TableRow
        hover
        selected={selected}
        aria-checked={selected}
        tabIndex={-1}
        sx={(theme) => ({
          whiteSpace: 'nowrap',
          ...(shouldShowError && {
            // Use CSS custom properties for dark mode aware colors - ERROR (urgent jobs)
            backgroundColor: 'rgba(var(--palette-error-mainChannel) / 0.12)',
            // Force appropriate text color for better contrast
            color: 'var(--palette-text-primary)',
            '& .MuiTableCell-root': {
              color: 'var(--palette-text-primary)',
            },
            // Override specific link colors for better contrast (job number, site name, client name)
            '& .MuiTableCell-root:nth-of-type(2) a, & .MuiTableCell-root:nth-of-type(3) > .MuiStack-root > a, & .MuiTableCell-root:nth-of-type(5) a':
              {
                color: 'var(--palette-text-primary) !important',
                '&:hover': {
                  color: 'var(--palette-primary-main) !important',
                },
              },
            // Override address span text color (plain text addresses, not links)
            '& .MuiTableCell-root:nth-of-type(3) .MuiBox-root span': {
              color: 'var(--palette-text-primary) !important',
            },
            '&:hover': {
              backgroundColor: 'rgba(var(--palette-error-mainChannel) / 0.16)',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(var(--palette-error-mainChannel) / 0.24)',
              color: 'var(--palette-text-primary)',
              '& .MuiTableCell-root': {
                color: 'var(--palette-text-primary)',
              },
              // Keep all links theme-aware when selected
              '& .MuiTableCell-root a': {
                color: 'var(--palette-text-primary) !important',
                '&:hover': {
                  color: 'var(--palette-primary-main) !important',
                },
              },
              // Keep address text theme-aware when selected
              '& .MuiTableCell-root:nth-of-type(3) .MuiBox-root span': {
                color: 'var(--palette-text-primary) !important',
              },
              '&:hover': {
                backgroundColor: 'rgba(var(--palette-error-mainChannel) / 0.32)',
              },
            },
          }),
          ...(shouldShowWarning &&
            !shouldShowError && {
              // Use CSS custom properties for dark mode aware colors - WARNING (overdue jobs)
              backgroundColor: 'rgba(var(--palette-warning-mainChannel) / 0.12)',
              // Force appropriate text color for better contrast
              color: 'var(--palette-text-primary)',
              '& .MuiTableCell-root': {
                color: 'var(--palette-text-primary)',
              },
              // Override specific link colors for better contrast (job number, site name, client name)
              '& .MuiTableCell-root:nth-of-type(2) a, & .MuiTableCell-root:nth-of-type(3) > .MuiStack-root > a, & .MuiTableCell-root:nth-of-type(5) a':
                {
                  color: 'var(--palette-text-primary) !important',
                  '&:hover': {
                    color: 'var(--palette-primary-main) !important',
                  },
                },
              // Override address text color (the Box with text.disabled)
              '& .MuiTableCell-root:nth-of-type(3) .MuiBox-root': {
                color: 'var(--palette-text-primary) !important',
              },
              '&:hover': {
                backgroundColor: 'rgba(var(--palette-warning-mainChannel) / 0.16)',
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(var(--palette-warning-mainChannel) / 0.24)',
                color: 'var(--palette-text-primary)',
                '& .MuiTableCell-root': {
                  color: 'var(--palette-text-primary)',
                },
                // Keep all links theme-aware when selected
                '& .MuiTableCell-root a': {
                  color: 'var(--palette-text-primary) !important',
                  '&:hover': {
                    color: 'var(--palette-primary-main) !important',
                  },
                },
                // Keep address text theme-aware when selected
                '& .MuiTableCell-root:nth-of-type(3) .MuiBox-root span': {
                  color: 'var(--palette-text-primary) !important',
                },
                '&:hover': {
                  backgroundColor: 'rgba(var(--palette-warning-mainChannel) / 0.32)',
                },
              },
            }),
        })}
      >
        <TableCell padding="checkbox">
          <Checkbox
            checked={selected}
            onClick={onSelectRow}
            disabled={row.status !== 'cancelled'}
            slotProps={{
              input: {
                id: `${row.id}-checkbox`,
                'aria-label': `${row.id} checkbox`,
              },
            }}
          />
        </TableCell>

        <TableCell>
          <Link component={RouterLink} href={detailsHref} color="inherit">
            {row.job_number}
          </Link>
        </TableCell>

        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Link
              component={RouterLink}
              href={paths.management.company.site.edit(row.site.id)}
              color="inherit"
            >
              {row.site.name}
            </Link>
            <Box component="span" sx={{ color: 'text.disabled' }}>
              {(() => {
                const hasCompleteAddress =
                  !!row.site.street_number &&
                  !!row.site.street_name &&
                  !!row.site.city &&
                  !!row.site.province &&
                  !!row.site.postal_code &&
                  !!row.site.country;

                if (hasCompleteAddress) {
                  return (
                    <Link
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        [
                          row.site.unit_number,
                          row.site.street_number,
                          row.site.street_name,
                          row.site.city,
                          row.site.province,
                          row.site.postal_code,
                          row.site.country,
                        ]
                          .filter(Boolean)
                          .join(', ')
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="hover"
                    >
                      {getFullAddress(row.site)}
                    </Link>
                  );
                }
                // Show as plain text if not a complete address
                return <span>{getFullAddress(row.site)}</span>;
              })()}
            </Box>
          </Stack>
        </TableCell>

        <TableCell>{row.site.region}</TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar src={row.client.logo_url ?? undefined} alt={row.client.name} sx={{ mr: 1.1 }}>
              {row.client.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
              <Link
                component={RouterLink}
                href={paths.management.client.edit(row.client.id)}
                color="inherit"
                sx={{ cursor: 'pointer' }}
              >
                {row.client.name}
              </Link>
            </Stack>
          </Box>
        </TableCell>

        <TableCell>
          <ListItemText
            primary={fDate(row.start_time)}
            secondary={fTime(row.start_time)}
            slotProps={{
              primary: {
                noWrap: true,
                sx: { typography: 'body2' },
              },
              secondary: {
                sx: { mt: 0.5, typography: 'caption' },
              },
            }}
          />
        </TableCell>

        <TableCell>
          <ListItemText
            primary={fDate(row.end_time)}
            secondary={fTime(row.end_time)}
            slotProps={{
              primary: {
                noWrap: true,
                sx: { typography: 'body2' },
              },
              secondary: {
                sx: { mt: 0.5, typography: 'caption' },
              },
            }}
          />
        </TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={
              (row.status === 'draft' && 'info') ||
              (row.status === 'open' && 'info') ||
              (row.status === 'posted' && 'info') ||
              (row.status === 'pending' && 'warning') ||
              (row.status === 'ready' && 'primary') ||
              (row.status === 'in_progress' && 'secondary') ||
              (row.status === 'completed' && 'success') ||
              (row.status === 'cancelled' && 'error') ||
              'default'
            }
          >
            {STATUS_LABELS[row.status] || row.status}
          </Label>
        </TableCell>

        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Reserved space for status icon to maintain alignment */}
            <Box sx={{ width: 32, display: 'flex', justifyContent: 'center' }}>
              {(shouldShowError || shouldShowWarning) && (
                <Tooltip
                  title={
                    <Box sx={{ fontSize: '14px', lineHeight: 1.4 }}>
                      <strong>
                        {shouldShowError
                          ? isUrgent
                            ? `Urgent: Job starts in ${hoursUntilStart} ${hoursUntilStart === 1 ? 'hour' : 'hours'} but not ready!`
                            : isOverdueWithRejections
                              ? 'Job is overdue and has rejected workers - needs immediate attention'
                              : isOverdue
                                ? "Job is overdue but workers haven't accepted"
                                : isRunningWithoutAcceptance
                                  ? "Job is currently running but workers haven't accepted yet!"
                                  : 'Job needs attention'
                          : isDraftNeedingNotification
                            ? 'Draft job - Send notifications to workers'
                            : 'Job needs attention'}
                      </strong>
                      {/* <br />
                      {shouldShowError 
                        ? `Current Status: ${STATUS_LABELS[row.status] || row.status} | Start Time: ${fTime(row.start_time)}`
                        : isOverdue
                          ? `End Time: ${fTime(row.end_time)} | Current Status: ${STATUS_LABELS[row.status] || row.status}`
                          : isDraftNeedingNotification
                            ? `Start Time: ${fTime(row.start_time)} | Click "Notify" to send to workers`
                            : `Current Status: ${STATUS_LABELS[row.status] || row.status}`
                      } */}
                    </Box>
                  }
                  placement="left"
                  arrow
                  componentsProps={{
                    tooltip: {
                      sx: {
                        fontSize: '14px',
                        maxWidth: 300,
                        '& .MuiTooltip-arrow': {
                          color: 'grey.800',
                        },
                      },
                    },
                  }}
                >
                  <IconButton
                    size="small"
                    sx={{
                      color: shouldShowError ? 'error.main' : 'warning.main',
                      '&:hover': {
                        backgroundColor: shouldShowError ? 'error.lighter' : 'warning.lighter',
                      },
                    }}
                  >
                    <Iconify
                      icon={shouldShowError ? 'solar:danger-bold' : 'solar:info-circle-bold'}
                      width={20}
                    />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            <IconButton
              color={collapseRow.value ? 'inherit' : 'default'}
              onClick={collapseRow.onToggle}
              sx={{ ...(collapseRow.value && { bgcolor: 'action.hover' }) }}
            >
              <Iconify icon="eva:arrow-ios-downward-fill" />
            </IconButton>

            <IconButton
              color={menuActions.open ? 'inherit' : 'default'}
              onClick={menuActions.onOpen}
            >
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>
    );
  }

  function renderSecondaryRow() {
    if (!row || !row.id) return null;
    return (
      <TableRow sx={{ whiteSpace: 'nowrap' }}>
        <TableCell sx={{ p: 0, border: 'none' }} colSpan={9}>
          <Collapse
            in={collapseRow.value}
            timeout="auto"
            unmountOnExit
            sx={{ bgcolor: 'background.neutral' }}
          >
            <Paper
              sx={{
                m: 1.5,
                mb: 0.1,
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              }}
            >
              <Box
                sx={(theme) => ({
                  display: 'grid',
                  gridTemplateColumns: 'repeat(8, 1fr)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: theme.spacing(1.5, 2, 1.5, 1.5),
                  borderBottom: `solid 2px ${theme.vars.palette.background.neutral}`,
                  '& .MuiListItemText-root': {
                    textAlign: 'center',
                  },
                })}
              >
                <ListItemText primary="Position" />
                <ListItemText primary="Employee" />
                <ListItemText primary="Contact" />
                <ListItemText primary="Vehicle Type" />
                <ListItemText primary="Vehicle" />
                <ListItemText primary="Start Time" />
                <ListItemText primary="End Time" />
                <ListItemText primary="Status" />
              </Box>
            </Paper>
            <Paper sx={{ m: 1.5, mt: 0, mb: 1, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
              {/* Workers + Vehicle */}
              {(() => {
                // For open jobs, show original positions created during job creation
                const originalPositions = row.workers.filter((item: IJobWorker) => 
                  // Show original positions (any status that indicates a position exists)
                   item.status === 'draft' || item.status === 'accepted' || item.status === 'pending' || item.status === 'open'
                );

                if (originalPositions.length === 0) {
                  return (
                    <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                      <Typography variant="body2">
                        No positions available for this open shift.
                      </Typography>
                    </Box>
                  );
                }

                return originalPositions.map((item: IJobWorker) => {
                // For open jobs, show the job's vehicle requirements if worker is assigned
                // For open jobs, vehicles are requirements (not assigned to operators)
                // So we show the first available vehicle requirement for this position
                const vehicle = row.vehicles?.length > 0 && row.vehicles[0]?.type
                  ? row.vehicles[0] // Show first vehicle requirement for open jobs
                  : null;
                const positionLabel =
                  JOB_POSITION_OPTIONS.find((option) => option.value === item.position)?.label ||
                  item.position;

                return (
                  <Box
                    key={item.id}
                    sx={(theme) => ({
                      display: 'grid',
                      gridTemplateColumns: 'repeat(8, 1fr)',
                      alignItems: 'center',
                      p: theme.spacing(1.5, 2, 1.5, 1.5),
                      borderBottom: `solid 2px ${theme.vars.palette.background.neutral}`,
                      '& .MuiListItemText-root': {
                        textAlign: 'center',
                      },
                    })}
                  >
                    <ListItemText
                      primary={positionLabel}
                      slotProps={{
                        primary: { sx: { typography: 'body2' } },
                      }}
                    />
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        overflow: 'hidden',
                        justifyContent: 'center',
                      }}
                    >
                      {item.status === 'accepted' && item.first_name ? (
                        <>
                          <Avatar
                            src={item?.photo_url ?? undefined}
                            alt={item?.first_name}
                            sx={{ width: 28, height: 28, mr: 1, flexShrink: 0, fontSize: 15 }}
                          >
                            {item?.first_name?.charAt(0).toUpperCase()}
                          </Avatar>

                          <Link
                            component={RouterLink}
                            href={detailsHref}
                            color="inherit"
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'block',
                            }}
                          >
                            {`${item.first_name || ''} ${item.last_name || ''}`.trim()}
                          </Link>
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Available
                        </Typography>
                      )}
                    </Box>
                    <ListItemText
                      slotProps={{
                        primary: { sx: { typography: 'body2' } },
                      }}
                    >
                      {item.status === 'accepted' && item.phone_number ? (
                        <Link
                          href={`tel:${item?.phone_number}`}
                          rel="noopener noreferrer"
                          underline="hover"
                        >
                          {formatPhoneNumberSimple(item?.phone_number)}
                        </Link>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </ListItemText>
                    <ListItemText
                      primary={
                        vehicle?.type 
                          ? formatVehicleType(vehicle.type)
                          : null
                      }
                      slotProps={{
                        primary: { sx: { typography: 'body2' } },
                      }}
                    />
                    <ListItemText
                      primary={
                        vehicle
                          ? `${vehicle.license_plate || 'TBD'} ${vehicle.unit_number ? `- ${vehicle.unit_number}` : ''}`.trim() ||
                            'TBD'
                          : null
                      }
                      slotProps={{
                        primary: { sx: { typography: 'body2' } },
                      }}
                    />
                    <ListItemText
                      primary={fTime(item.start_time)}
                      slotProps={{
                        primary: { sx: { typography: 'body2' } },
                      }}
                    />
                    <ListItemText
                      primary={fTime(item.end_time)}
                      slotProps={{
                        primary: { sx: { typography: 'body2' } },
                      }}
                    />
                    <ListItemText>
                      {!item.status || item.status === 'draft' ? (
                        <>
                          <Tooltip
                            title={
                              row.status === 'cancelled'
                                ? 'Cannot notify workers for cancelled jobs'
                                : ''
                            }
                            placement="top"
                          >
                            <span>
                              <Button
                                variant="contained"
                                onClick={() => handleStatusClick(item.id)}
                                size="small"
                                disabled={row.status === 'cancelled'}
                              >
                                Notify
                              </Button>
                            </span>
                          </Tooltip>
                          <JobNotifyDialog
                            open={responseDialog.value && selectedWorkerId === item.id}
                            onClose={responseDialog.onFalse}
                            jobId={row.id}
                            workerId={item.id}
                            data={row}
                          />
                        </>
                      ) : (
                        <Label
                          variant="soft"
                          color={
                            (item.status === 'pending' && 'warning') ||
                            (item.status === 'accepted' && 'success') ||
                            (item.status === 'rejected' && 'error') ||
                            (item.status === 'open' && 'info') ||
                            'default'
                          }
                        >
                          {item.status}
                        </Label>
                      )}
                    </ListItemText>
                  </Box>
                );
                });
              })()}
            </Paper>
            {row.equipments && row.equipments.length > 0 && (
              <>
                <Paper
                  sx={{
                    m: 1.5,
                    mt: 0,
                    mb: 0.1,
                    borderTopLeftRadius: 10,
                    borderTopRightRadius: 10,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                  }}
                >
                  <Box
                    sx={(theme) => ({
                      display: 'grid',
                      gridTemplateColumns: 'repeat(6, 1fr)',
                      alignItems: 'center',
                      p: theme.spacing(1.5, 2, 1.5, 1.5),
                      borderBottom: `solid 2px ${theme.vars.palette.background.neutral}`,
                      '& .MuiListItemText-root': {
                        textAlign: 'center',
                      },
                    })}
                  >
                    <ListItemText primary="Equipment Type" />
                    <ListItemText primary="Quantity" />
                  </Box>
                </Paper>
                <Paper sx={{ m: 1.5, mt: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                  {row.equipments.map((item: IJobEquipment) => (
                    <Box
                      key={item.id}
                      sx={(theme) => ({
                        display: 'grid',
                        gridTemplateColumns: 'repeat(6, 1fr)',
                        alignItems: 'center',
                        p: theme.spacing(1.5, 2, 1.5, 1.5),
                        borderBottom: `solid 2px ${theme.vars.palette.background.neutral}`,
                        '& .MuiListItemText-root': {
                          textAlign: 'center',
                        },
                      })}
                    >
                      <ListItemText
                        primary={formatEquipmentType(item.type)}
                        slotProps={{
                          primary: { sx: { typography: 'body2' } },
                        }}
                      />

                      <ListItemText
                        primary={item.quantity}
                        slotProps={{
                          primary: { sx: { typography: 'body2' } },
                        }}
                      />
                    </Box>
                  ))}
                </Paper>
              </>
            )}
            {row.notes && (
              <>
                <Paper
                  sx={{
                    m: 1.5,
                    mt: 0,
                    mb: 0.1,
                    borderTopLeftRadius: 10,
                    borderTopRightRadius: 10,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                  }}
                >
                  <Box
                    sx={(theme) => ({
                      display: 'grid',
                      gridTemplateColumns: 'repeat(6, 1fr)',
                      alignItems: 'center',
                      p: theme.spacing(1.5, 2, 1.5, 1.5),
                      borderBottom: `solid 2px ${theme.vars.palette.background.neutral}`,
                    })}
                  >
                    <ListItemText primary="Note" />
                  </Box>
                </Paper>
                <Paper sx={{ m: 1.5, mt: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                  <Box
                    sx={(theme) => ({
                      display: 'grid',
                      gridTemplateColumns: 'repeat(1, 1fr)',
                      alignItems: 'center',
                      p: theme.spacing(1.5, 2, 1.5, 1.5),
                      borderBottom: `solid 2px ${theme.vars.palette.background.neutral}`,
                    })}
                  >
                    <ListItemText
                      primary={row.notes}
                      slotProps={{
                        primary: {
                          sx: {
                            typography: 'body2',
                            whiteSpace: 'pre-wrap',
                          },
                        },
                      }}
                    />
                  </Box>
                </Paper>
              </>
            )}
          </Collapse>
        </TableCell>
      </TableRow>
    );
  }

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <li>
          <Tooltip
            title={row.status === 'cancelled' ? 'Cannot edit cancelled jobs' : ''}
            placement="left"
          >
            <span>
              <MenuItem
                component={RouterLink}
                href={editHref}
                onClick={() => menuActions.onClose()}
                disabled={row.status === 'cancelled'}
              >
                <Iconify icon="solar:pen-bold" />
                Edit
              </MenuItem>
            </span>
          </Tooltip>
        </li>
        <li>
          <Tooltip
            title={row.status === 'cancelled' ? 'Cannot duplicate cancelled jobs' : ''}
            placement="left"
          >
            <span>
              <MenuItem
                component={RouterLink}
                href={`${paths.work.job.create}?duplicate=${row.id}`}
                onClick={() => menuActions.onClose()}
                disabled={row.status === 'cancelled'}
              >
                <Iconify icon="solar:copy-bold" />
                Duplicate
              </MenuItem>
            </span>
          </Tooltip>
        </li>

        {/* Show Cancel button for non-cancelled jobs */}
        {row.status !== 'cancelled' && (
          <MenuItem
            onClick={() => {
              cancelDialog.onTrue();
              menuActions.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:close-circle-bold" />
            Cancel
          </MenuItem>
        )}

        {/* Show Delete button only for cancelled jobs */}
        {row.status === 'cancelled' && (
          <MenuItem
            onClick={() => {
              confirmDialog.onTrue();
              menuActions.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete
          </MenuItem>
        )}
      </MenuList>
    </CustomPopover>
  );

  const renderConfirmDialog = () => (
    <Dialog open={confirmDialog.value} onClose={confirmDialog.onFalse} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Job</DialogTitle>
      <DialogContent>
        Are you sure you want to delete <strong>{row.job_number}</strong>?
      </DialogContent>
      <DialogActions>
        <Button onClick={confirmDialog.onFalse} disabled={isDeleting} sx={{ mr: 1 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={isDeleting}
          startIcon={isDeleting ? <CircularProgress size={16} /> : null}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderCancelDialog = () => (
    <Dialog open={cancelDialog.value} onClose={cancelDialog.onFalse} maxWidth="xs" fullWidth>
      <DialogTitle>Cancel Job</DialogTitle>
      <DialogContent>
        Are you sure you want to cancel <strong>{row.job_number}</strong>?
        <br />
        <br />
        <Typography variant="body2" color="text.secondary">
          This will mark the job as cancelled. You can delete it later if needed.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={cancelDialog.onFalse} disabled={isCancelling} sx={{ mr: 1 }}>
          No, Keep Job
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={handleCancel}
          disabled={isCancelling}
          startIcon={isCancelling ? <CircularProgress size={16} /> : null}
        >
          {isCancelling ? 'Cancelling...' : 'Yes, Cancel Job'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      {renderPrimaryRow()}
      {renderSecondaryRow()}
      {renderMenuActions()}
      {renderConfirmDialog()}
      {renderCancelDialog()}
    </>
  );
}
