import { useCallback } from 'react';
import { usePopover, useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components/router-link';

import { fDate, fTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

import { TIME_OFF_TYPES, TIME_OFF_STATUSES } from 'src/types/timeOff';
import { HIRE_TYPES, NEW_EMPLOYEE_STATUSES } from 'src/types/new-hire';

// ----------------------------------------------------------------------

type Props = {
  row: any;
  editHref: string;
  onEditRow?: (id: string) => void;
};

export function NewEmployeeTableRow({ row, onEditRow, editHref }: Props) {
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

  const getTypeInfo = (type: string) =>
    HIRE_TYPES.find((t) => t.value === type) || { label: type, color: '#666' };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = fDate(startDate);
    const end = fDate(endDate);

    if (start === end) {
      return start;
    }
    return `${start} - ${end}`;
  };

  const handleEdit = useCallback(() => {
    // Navigate to edit page
    window.location.href = paths.management.user.onboarding.edit(row?.id);
    popover.onClose();
  }, [row.id, popover]);

  return (
    <>
      <TableRow hover>
        <TableCell>
          <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
            <Avatar
              src={row?.employee?.photo_url ?? undefined}
              alt={row?.employee?.first_name}
              sx={{ width: 32, height: 32 }}
            >
              {row?.employee?.first_name?.charAt(0).toUpperCase()}
            </Avatar>

            <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
              <Link
                component={RouterLink}
                href={editHref}
                color="primary"
                sx={{ cursor: 'pointer' }}
              >
                {`${row?.employee?.first_name} ${row?.employee?.last_name}`}
              </Link>
            </Stack>
          </Box>
        </TableCell>

        <TableCell>
          <Typography variant="body2">{row?.contract_datail?.position}</Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2">{fDate(row?.contract_datail?.start_date)}</Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2">{fDate(row?.contract_datail?.hire_date)}</Typography>
        </TableCell>

        <TableCell>
          <Label variant="soft" color={getStatusColor(row.status)}>
            {NEW_EMPLOYEE_STATUSES.find((s) => s.value === row.status)?.label || row.status}
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
        </MenuList>
      </CustomPopover>
    </>
  );
}
