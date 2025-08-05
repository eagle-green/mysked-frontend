import type { ITimeSheetTableView, TimecardEntry } from 'src/types/timecard';

import { useState } from 'react';
import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemText from '@mui/material/ListItemText';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { RouterLink } from 'src/routes/components';

import { fDate, fTime } from 'src/utils/format-time';
import { formatDuration, getFullAddress } from 'src/utils/timecard-helpers';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover/custom-popover';

import { useAuthContext } from 'src/auth/hooks';

import { TimeCardStatus } from 'src/types/timecard';

// ----------------------------------------------------------------------

type Props = {
  row: ITimeSheetTableView;
  selected: boolean;
  recordingLink: string;
  onSelectRow: () => void;
  onDeleteRow: () => void;
};

export function TimeSheetTableRow(props: Props) {
  const { row, selected, recordingLink, onSelectRow, onDeleteRow } = props;
  const menuActions = usePopover();
  const confirmDialog = useBoolean();
  // const collapseRow = useBoolean();
  const { user } = useAuthContext();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!row || !row.id || !row.job || !row.job.workers.length) return null;

  const { workers } = row.job;
  // [TODO]:: change to current user filter by id
  const currentUserWorker = workers.find((w) => w.id === w?.id);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteRow();
    } finally {
      setIsDeleting(false);
      confirmDialog.onFalse();
    }
  };

  const renderConfirmDialog = () => (
    <Dialog fullWidth maxWidth="xs" open={confirmDialog.value} onClose={confirmDialog.onFalse}>
      <DialogTitle sx={{ pb: 2 }}>Delete</DialogTitle>

      <DialogContent sx={{ typography: 'body2' }}>
        Are you sure want to delete timesheet with Job # <strong> {row.job.job_number} </strong>?
      </DialogContent>

      <DialogActions>
        <Button
          variant="outlined"
          color="inherit"
          onClick={confirmDialog.onFalse}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={isDeleting}
          startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <li>
          <MenuItem onClick={() => menuActions.onClose()}>
            <Iconify icon="solar:pen-bold" />
            Edit
          </MenuItem>
        </li>

        <li>
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
        </li>
      </MenuList>
    </CustomPopover>
  );

  function renderPrimaryRow() {
    return (
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
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
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Link
              component={RouterLink}
              href={recordingLink}
              color="inherit"
              sx={{ cursor: 'pointer' }}
            >
              {row.jobNumber}
            </Link>
          </Stack>
        </TableCell>
        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            {row.siteName}

            <Box component="span" sx={{ color: 'text.disabled' }}>
              {(() => {
                const hasCompleteAddress =
                  !!row.company.street_number &&
                  !!row.company.street_name &&
                  !!row.company.city &&
                  !!row.company.province &&
                  !!row.company.postal_code &&
                  !!row.company.country;

                if (hasCompleteAddress) {
                  return (
                    <Link
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        [
                          row.company.unit_number,
                          row.company.street_number,
                          row.company.street_name,
                          row.company.city,
                          row.company.province,
                          row.company.postal_code,
                          row.company.country,
                        ]
                          .filter(Boolean)
                          .join(', ')
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="hover"
                    >
                      {getFullAddress(row.job)}
                    </Link>
                  );
                }
                // Show as plain text if not a complete address
                return <span>{getFullAddress(row.company)}</span>;
              })()}
            </Box>
          </Stack>
        </TableCell>
        {/* <TableCell>{job.company.region}</TableCell> */}
        <TableCell>
          <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
            <Avatar src={row.clientLogo} alt={row.clientName} sx={{ width: 28, height: 28 }}>
              {row.clientName}
            </Avatar>

            <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
              {row.clientName}
            </Stack>
          </Box>
        </TableCell>
        <TableCell>
          <ListItemText
            primary={fDate(row.startDate)}
            secondary={fTime(row.startDate)}
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
            primary={fDate(row.endDate)}
            secondary={fTime(row.startDate)}
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
            primary={formatDuration(row.duration || 0)}
            secondary={`Hour${row.duration && row.duration > 0 ? 's' : ''}`}
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
              (row?.status === TimeCardStatus.DRAFT && 'secondary') ||
              (row?.status === TimeCardStatus.SUBMITTED && 'info') ||
              (row?.status === TimeCardStatus.APPROVED && 'success') ||
              (row?.status === TimeCardStatus.REJECTED && 'error') ||
              'default'
            }
          >
            {row?.status}
          </Label>
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
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

  return (
    <>
      {renderPrimaryRow()}
      {renderMenuActions()}
      {renderConfirmDialog()}
    </>
  );
}
