import { useCallback } from 'react';
import { usePopover, useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { fDate, fTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

import { TIME_OFF_TYPES, TIME_OFF_STATUSES } from 'src/types/timeOff';

import { WorkerTimeOffQuickEditForm } from './worker-time-off-quick-edit-form';

// ----------------------------------------------------------------------

type Props = {
  row: any;
  onDeleteRow: (id: string) => void;
  onEditRow?: (id: string) => void;
};

export function WorkerTimeOffTableRow({
  row,
  onDeleteRow,
  onEditRow,
}: Props) {
  const popover = usePopover();
  const quickEditForm = useBoolean();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTypeInfo = (type: string) => TIME_OFF_TYPES.find((t) => t.value === type) || { label: type, color: '#666' };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = fDate(startDate);
    const end = fDate(endDate);

    if (start === end) {
      return start;
    }
    return `${start} - ${end}`;
  };

  const handleDelete = useCallback(() => {
    onDeleteRow(row.id);
    popover.onClose();
  }, [onDeleteRow, row.id, popover]);

  const handleEdit = useCallback(() => {
    // Navigate to edit page
    window.location.href = paths.schedule.timeOff.edit(row.id);
    popover.onClose();
  }, [row.id, popover]);

  const handleQuickEdit = useCallback(() => {
    quickEditForm.onTrue();
    popover.onClose();
  }, [quickEditForm, popover]);

  const isPending = row.status === 'pending';

  return (
    <>
      <TableRow hover>
        <TableCell>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            #{row.id}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2">{getTypeInfo(row.type).label}</Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2">{formatDateRange(row.start_date, row.end_date)}</Typography>
        </TableCell>

        <TableCell>
          <Typography
            variant="body2"
            sx={{
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.reason}
          </Typography>
        </TableCell>

        <TableCell>
          {row.created_at ? (
            <Box>
              <Typography variant="body2">
                {fDate(row.created_at)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {fTime(row.created_at)}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              N/A
            </Typography>
          )}
        </TableCell>
        <TableCell>
          <Label variant="soft" color={getStatusColor(row.status)}>
            {TIME_OFF_STATUSES.find((s) => s.value === row.status)?.label || row.status}
          </Label>
        </TableCell>

        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          {isPending && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="Quick Edit" placement="top" arrow>
                <IconButton
                  color={quickEditForm.value ? 'inherit' : 'default'}
                  onClick={handleQuickEdit}
                  sx={{ mr: 1 }}
                >
                  <Iconify icon="solar:pen-bold" />
                </IconButton>
              </Tooltip>

              <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
                <Iconify icon="eva:more-vertical-fill" />
              </IconButton>
            </Box>
          )}
        </TableCell>
      </TableRow>

      {isPending && (
        <CustomPopover
          open={popover.open}
          anchorEl={popover.anchorEl}
          onClose={popover.onClose}
          slotProps={{ arrow: { placement: 'right-top' } }}
        >
          <MenuList>
            <MenuItem onClick={handleEdit}>
              <Iconify icon="solar:pen-bold" />
              Edit
            </MenuItem>

            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <Iconify icon="solar:trash-bin-trash-bold" />
              Delete
            </MenuItem>
          </MenuList>
        </CustomPopover>
      )}

      <WorkerTimeOffQuickEditForm
        currentTimeOff={row}
        open={quickEditForm.value}
        onClose={quickEditForm.onFalse}
        onUpdateSuccess={quickEditForm.onFalse}
      />
    </>
  );
}
