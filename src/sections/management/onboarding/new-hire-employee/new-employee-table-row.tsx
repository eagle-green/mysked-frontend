import { useCallback } from 'react';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components/router-link';

import { fDate } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

import { NEW_EMPLOYEE_STATUSES } from 'src/types/new-hire';

// ----------------------------------------------------------------------

type Props = {
  row: any;
  editHref: string;
  onEditRow?: (id: string) => void;
  onDelete?: (id: string) => void;
  /** When set (typically for packages not yet submitted), row menu includes resend invite. */
  onResendInvite?: (id: string) => void | Promise<void>;
};

export function NewEmployeeTableRow({ row, onEditRow, editHref, onDelete, onResendInvite }: Props) {
  const popover = usePopover();

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

  const handleEdit = useCallback(() => {
    window.location.href = paths.management.user.onboarding.edit(row?.id);
    popover.onClose();
  }, [row.id, popover]);

  const handleDelete = useCallback(() => {
    popover.onClose();
    onDelete?.(row?.id);
  }, [onDelete, row?.id, popover]);

  const handleResendInvite = useCallback(() => {
    popover.onClose();
    void onResendInvite?.(row?.id);
  }, [onResendInvite, row?.id, popover]);

  const emailDisplay = row?.candidateEmail && row.candidateEmail !== '—' ? row.candidateEmail : '—';

  const isFinalized =
    row?.status === 'completed' ||
    !!(row?.employee_user_id && String(row.employee_user_id).length > 0);
  const isAwaitingAdmin =
    !!(row?.submitted_at || row?.status === 'in_review') && !isFinalized;

  return (
    <>
      <TableRow hover>
        <TableCell sx={{ width: 72 }}>
          <Typography variant="body2" title={row?.id || undefined} sx={{ fontWeight: 600 }}>
            {row?.displayId > 0 ? row.displayId : '—'}
          </Typography>
        </TableCell>

        <TableCell>
          <Stack sx={{ typography: 'body2', alignItems: 'flex-start' }}>
            <Link
              component={RouterLink}
              href={editHref}
              color="inherit"
              sx={{ cursor: 'pointer' }}
            >
              {emailDisplay}
            </Link>
          </Stack>
        </TableCell>

        <TableCell>
          <Typography variant="body2">{row?.contract_detail?.position || '—'}</Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2">{fDate(row?.contract_detail?.hire_date)}</Typography>
        </TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={
              isFinalized
                ? 'success'
                : isAwaitingAdmin
                  ? 'secondary'
                  : getStatusColor(String(row?.status || 'pending'))
            }
          >
            {isFinalized
              ? 'Completed'
              : isAwaitingAdmin
                ? 'In Review'
                : NEW_EMPLOYEE_STATUSES.find((s) => s.value === row.status)?.label || row.status}
          </Label>
        </TableCell>

        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>

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
          {onResendInvite ? (
            <MenuItem onClick={handleResendInvite}>
              <Iconify icon="solar:letter-bold" />
              Resend invite
            </MenuItem>
          ) : null}
          {onDelete ? (
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <Iconify icon="solar:trash-bin-trash-bold" width={20} />
              Delete
            </MenuItem>
          ) : null}
        </MenuList>
      </CustomPopover>
    </>
  );
}
