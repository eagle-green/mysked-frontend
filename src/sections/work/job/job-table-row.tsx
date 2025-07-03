import type { IJob, IJobWorker, IJobEquipment } from 'src/types/job';

import { useState } from 'react';
import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import MenuList from '@mui/material/MenuList';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
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

import { JobNotifyDialog } from './job-notify-dialog';

// ----------------------------------------------------------------------

type Props = {
  row: IJob;
  selected: boolean;
  detailsHref: string;
  editHref: string;
  onSelectRow: () => void;
  onDeleteRow: () => Promise<void>;
  showWarning?: boolean;
  effectiveStatus?: string;
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
  pending: 'Pending',
  ready: 'Ready',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function JobTableRow(props: Props) {
  const { row, selected, onSelectRow, onDeleteRow, detailsHref, editHref, showWarning = false, effectiveStatus } = props;
  const confirmDialog = useBoolean();
  const menuActions = usePopover();
  const collapseRow = useBoolean();
  const responseDialog = useBoolean();
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteRow();
      confirmDialog.onFalse();
    } finally {
      setIsDeleting(false);
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
        sx={{
          ...(showWarning && {
            backgroundColor: 'warning.lighter',
            '&:hover': {
              backgroundColor: 'warning.light',
            },
          }),
        }}
      >
        <TableCell padding="checkbox">
          <Checkbox
            checked={selected}
            onClick={onSelectRow}
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
            <Link component={RouterLink} href={paths.site.edit(row.site.id)} color="inherit">
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
                href={paths.contact.client.edit(row.client.id)}
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
              ((effectiveStatus || row.status) === 'draft' && 'info') ||
              ((effectiveStatus || row.status) === 'pending' && 'warning') ||
              ((effectiveStatus || row.status) === 'ready' && 'primary') ||
              ((effectiveStatus || row.status) === 'in_progress' && 'secondary') ||
              ((effectiveStatus || row.status) === 'completed' && 'success') ||
              ((effectiveStatus || row.status) === 'cancelled' && 'error') ||
              'default'
            }
          >
            {STATUS_LABELS[effectiveStatus || row.status] || (effectiveStatus || row.status)}
          </Label>
        </TableCell>

        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <IconButton
            color={collapseRow.value ? 'inherit' : 'default'}
            onClick={collapseRow.onToggle}
            sx={{ ...(collapseRow.value && { bgcolor: 'action.hover' }) }}
          >
            <Iconify icon="eva:arrow-ios-downward-fill" />
          </IconButton>

          <IconButton color={menuActions.open ? 'inherit' : 'default'} onClick={menuActions.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>
    );
  }

  function renderSecondaryRow() {
    if (!row || !row.id) return null;
    return (
      <TableRow>
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
              {row.workers.map((item: IJobWorker) => {
                const vehicle = row.vehicles?.find((v) => v.operator?.id === item.id);
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
                    </Box>
                    <ListItemText
                      slotProps={{
                        primary: { sx: { typography: 'body2' } },
                      }}
                    >
                      <Link
                        href={`tel:${item?.phone_number}`}
                        rel="noopener noreferrer"
                        underline="hover"
                      >
                        {formatPhoneNumberSimple(item?.phone_number)}
                      </Link>
                    </ListItemText>
                    <ListItemText
                      primary={formatVehicleType(vehicle?.type || '')}
                      slotProps={{
                        primary: { sx: { typography: 'body2' } },
                      }}
                    />
                    <ListItemText
                      primary={
                        vehicle
                          ? `${vehicle.license_plate || ''} ${vehicle.unit_number ? `- ${vehicle.unit_number}` : ''}`.trim() ||
                            null
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
                          <Button
                            variant="contained"
                            onClick={() => handleStatusClick(item.id)}
                            size="small"
                          >
                            Notify
                          </Button>
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
                            'default'
                          }
                        >
                          {item.status}
                        </Label>
                      )}
                    </ListItemText>
                  </Box>
                );
              })}
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
          <MenuItem component={RouterLink} href={editHref} onClick={() => menuActions.onClose()}>
            <Iconify icon="solar:pen-bold" />
            Edit
          </MenuItem>
        </li>
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
      </MenuList>
    </CustomPopover>
  );

  const renderConfirmDialog = () => (
    <Dialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Delete Job</DialogTitle>
      <DialogContent>
        Are you sure you want to delete <strong>{row.job_number}</strong>?
      </DialogContent>
      <DialogActions>
        <Button
          onClick={confirmDialog.onFalse}
          disabled={isDeleting}
          sx={{ mr: 1 }}
        >
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

  return (
    <>
      {renderPrimaryRow()}
      {renderSecondaryRow()}
      {renderMenuActions()}
      {renderConfirmDialog()}
    </>
  );
}
