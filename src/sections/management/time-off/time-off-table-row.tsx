import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { Label } from 'src/components/label';

import { TIME_OFF_TYPES, TIME_OFF_STATUSES } from 'src/types/timeOff';

// ----------------------------------------------------------------------

type Props = {
  row: any;
  selected: boolean;
  onSelectRow: VoidFunction;
  onView: (row: any) => void;
};

export function TimeOffTableRow({ row, selected, onSelectRow, onView }: Props) {
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

  // const getTypeColor = (type: string) => {
  //   const timeOffType = TIME_OFF_TYPES.find((t) => t.value === type);
  //   return timeOffType?.color || '#9E9E9E';
  // };

  return (
    <TableRow hover selected={selected}>
      <TableCell padding="checkbox">
        <Checkbox checked={selected} onClick={onSelectRow} />
      </TableCell>

      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={row?.photo_url ?? undefined} alt={row?.first_name}>
            {row?.first_name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2">
              {row.first_name} {row.last_name}
            </Typography>
            {/* <Typography variant="caption" color="text.secondary">
              {row.email}
            </Typography> */}
          </Box>
        </Box>
      </TableCell>

      <TableCell>
        <Typography variant="body2">
          {TIME_OFF_TYPES.find((t) => t.value === row.type)?.label || row.type}
        </Typography>
      </TableCell>

      <TableCell>
        <Typography variant="body2">
          {dayjs(row.start_date).isSame(dayjs(row.end_date), 'day')
            ? dayjs(row.start_date).format('MMM DD, YYYY')
            : `${dayjs(row.start_date).format('MMM DD, YYYY')} - ${dayjs(row.end_date).format('MMM DD, YYYY')}`}
        </Typography>
      </TableCell>

      <TableCell>
        <Label variant="soft" color={getStatusColor(row.status)}>
          {TIME_OFF_STATUSES.find((s) => s.value === row.status)?.label || row.status}
        </Label>
      </TableCell>

      <TableCell>
        {row.confirmed_by && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar src={row.confirmed_by_photo_url ?? undefined} alt={row.confirmed_by_first_name}>
              {row.confirmed_by_first_name?.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="body2">
              {row.confirmed_by_first_name} {row.confirmed_by_last_name}
            </Typography>
          </Box>
        )}
      </TableCell>

      <TableCell align="right">
        <Button size="small" variant="contained" onClick={() => onView(row)}>
          View
        </Button>
      </TableCell>
    </TableRow>
  );
}
