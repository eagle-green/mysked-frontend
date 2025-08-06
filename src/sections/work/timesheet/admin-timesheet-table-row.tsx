import type { TimesheetEntry } from 'src/types/job';

import { useState } from 'react';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { fDate, fTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: TimesheetEntry;
  selected: boolean;
  onSelectRow: () => void;
  onDeleteRow: () => Promise<void>;
};

// Add a mapping for status display labels
const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  holding: 'Holding',
};

const STATUS_COLORS: Record<string, 'info' | 'warning' | 'success' | 'secondary'> = {
  draft: 'info',
  submitted: 'warning',
  approved: 'success',
  holding: 'secondary',
};

export function AdminTimesheetTableRow(props: Props) {
  const { row, selected, onSelectRow, onDeleteRow } = props;

  const [openConfirm, setOpenConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const menuPopover = usePopover();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteRow();
      setOpenConfirm(false);
    } catch (error) {
      console.error('Error deleting timesheet:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  function renderPrimaryRow() {
    return (
      <TableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

        <TableCell>
          <Typography variant="body2" noWrap>
            {row.job.job_number || 'N/A'}
          </Typography>
        </TableCell>

        <TableCell>
          <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
            <Avatar src={row.company.logo_url ?? undefined} alt={row.company.name}>
              {row.company.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Typography variant="body2" noWrap>
              {row.company.name || 'N/A'}
            </Typography>
          </Box>
        </TableCell>

        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Typography variant="body2" noWrap>
              {row.site.name || 'N/A'}
            </Typography>
            {row.site.display_address && (
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
                        {row.site.display_address}
                      </Link>
                    );
                  }
                  // Show as plain text if not a complete address
                  return <span>{row.site.display_address}</span>;
                })()}
              </Box>
            )}
          </Stack>
        </TableCell>

        <TableCell>
          <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
            <Avatar src={row.client.logo_url ?? undefined} alt={row.client.name}>
              {row.client.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Typography variant="body2" noWrap>
              {row.client.name || 'N/A'}
            </Typography>
          </Box>
        </TableCell>

        <TableCell>
          <Stack spacing={0.5}>
            <Typography variant="body2" noWrap>
              {row.job.start_time ? fDate(row.job.start_time) : 'N/A'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
              {row.job.start_time ? fTime(row.job.start_time) : ''}
            </Typography>
          </Stack>
        </TableCell>

        <TableCell>
          <Stack spacing={0.5}>
            <Typography variant="body2" noWrap>
              {row.job.end_time ? fDate(row.job.end_time) : 'N/A'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
              {row.job.end_time ? fTime(row.job.end_time) : ''}
            </Typography>
          </Stack>
        </TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={STATUS_COLORS[row.status || 'draft']}
            sx={{ textTransform: 'capitalize' }}
          >
            {STATUS_LABELS[row.status || 'draft']}
          </Label>
        </TableCell>

        <TableCell align="right">
          <IconButton color={menuPopover.open ? 'inherit' : 'default'} onClick={menuPopover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>
    );
  }

  const renderMenuActions = () => (
    <CustomPopover
      open={menuPopover.open}
      anchorEl={menuPopover.anchorEl}
      onClose={menuPopover.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <MenuItem
          onClick={() => {
            // TODO: Implement export timesheet functionality
            menuPopover.onClose();
          }}
        >
          <Iconify icon="solar:export-bold" />
          Export timesheet
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  const renderConfirmDialog = () => (
    <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
      <DialogTitle>Delete Timesheet</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete this timesheet? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenConfirm(false)}>Cancel</Button>
        <Button
          onClick={handleDelete}
          color="error"
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
      {renderMenuActions()}
      {renderConfirmDialog()}
    </>
  );
}
