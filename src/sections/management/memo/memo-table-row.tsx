import dayjs from 'dayjs';
import { useState } from 'react';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components/router-link';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify/iconify';
import { CustomPopover } from 'src/components/custom-popover/custom-popover';

// ----------------------------------------------------------------------

export const STATUSES: { value: string; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: '#FF9800' },
  { value: 'in_progress', label: 'In Progress', color: '#2196F3' },
  { value: 'done', label: 'done', color: '#4CAF50' },
];

type Props = {
  row: any;
  selected: boolean;
  onSelectRow: VoidFunction;
  onView: (row: any) => void;
  onDelete: (timeOffId: string) => void;
};

export function CompanyWideMemoTableRow({ row, selected, onSelectRow, onView, onDelete }: Props) {
  const popover = usePopover();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const handleDelete = () => {
    onDelete(row.id);
    handleCloseMenu();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'done':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

        <TableCell>
          <Typography variant="body2">{row?.memo_title}</Typography>
        </TableCell>

        <TableCell>
          <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
            <Avatar
              src={row?.client.logo_url ?? undefined}
              alt={row?.client.name}
              sx={{ width: 32, height: 32 }}
            >
              {row?.client.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Typography variant="body2" noWrap>
              {row?.client.name}
            </Typography>
          </Box>
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              src={row?.published_by?.photo_url ?? undefined}
              alt={row?.published_by?.first_name}
              sx={{ width: 32, height: 32 }}
            >
              {row?.published_by?.first_name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2">
                {row.published_by.first_name} {row.published_by.last_name}
              </Typography>
              {/* <Typography variant="caption" color="text.secondary">
              {row.email}
            </Typography> */}
            </Box>
          </Box>
        </TableCell>

        <TableCell>
          <Typography variant="body2">
            {dayjs(row.start_date).isSame(dayjs(row.end_date), 'day')
              ? dayjs(row.start_date).format('MMM DD, YYYY')
              : `${dayjs(row.start_date).format('MMM DD, YYYY')} - ${dayjs(row.end_date).format('MMM DD, YYYY')}`}
          </Typography>
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              src={row?.assigned_by?.photo_url ?? undefined}
              alt={row?.assigned_by?.first_name}
              sx={{ width: 32, height: 32 }}
            >
              {row?.assigned_by?.first_name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2">
                {row.assigned_by.first_name} {row.assigned_by.last_name}
              </Typography>
              {/* <Typography variant="caption" color="text.secondary">
              {row.email}
            </Typography> */}
            </Box>
          </Box>
        </TableCell>

        <TableCell>
          <Label variant="soft" color={getStatusColor(row.status)}>
            {STATUSES.find((s) => s.value === row.status)?.label || row.status}
          </Label>
        </TableCell>

        <TableCell>
          <Box sx={{ pt: 1 }}>
            <BorderLinearProgress
              variant="determinate"
              value={
                (((((row?.pendingItemDone as number) || 0) / row?.pendingItemCounts) as number) ||
                  0) * 100
              }
            />
            <Typography variant="caption" color="text.disabled">
              {(((((row?.pendingItemDone as number) || 0) / row?.pendingItemCounts) as number) ||
                0) * 100}
              %
            </Typography>
          </Box>
        </TableCell>

        <TableCell align="left" sx={{ px: 1, whiteSpace: 'nowrap' }}>
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
          <MenuItem component={RouterLink} href={`${paths.management.memo.edit(row.id)}`}>
            <Iconify icon="solar:pen-bold" />
            Edit
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}

export const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 12,
  borderRadius: 5,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor: theme.palette.grey[200],
    ...theme.applyStyles('dark', {
      backgroundColor: theme.palette.grey[500],
    }),
  },
  [`& .${linearProgressClasses.colorPrimary}`]: {
    borderRadius: 5,
    backgroundColor: 'primary',
    ...theme.applyStyles('dark', {
      backgroundColor: 'primary',
    }),
  },
}));
