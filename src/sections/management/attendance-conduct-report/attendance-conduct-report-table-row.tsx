import type { IAttendanceConductReportRow } from 'src/types/attendance-conduct-report';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Avatar from '@mui/material/Avatar';
import Link from '@mui/material/Link';

import { RouterLink } from 'src/routes/components';

import { Label } from 'src/components/label';

import { getRoleDisplayInfo } from 'src/utils/format-role';

import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

type Props = {
  row: IAttendanceConductReportRow;
};

/** Score: show number; null/undefined shown as 100 (default until logic exists). */
function formatScore(value: number | null): string {
  if (value === null || value === undefined) return '100';
  return String(value);
}

/** Conduct counts: show nothing when 0, otherwise the number. */
function formatCount(value: number): string {
  if (value === 0) return '';
  return String(value);
}

export function AttendanceConductReportTableRow({ row }: Props) {
  const roleInfo = getRoleDisplayInfo(row.position);

  return (
    <TableRow hover>
      <TableCell>
        <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
          <Avatar
            src={row.photo_url ?? undefined}
            alt={row.employee}
            sx={{ width: 32, height: 32 }}
          >
            {row.employee?.charAt(0).toUpperCase()}
          </Avatar>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Link
              component={RouterLink}
              href={paths.management.user.edit(row.id)}
              color="inherit"
              sx={{ cursor: 'pointer' }}
            >
              {row.employee}
            </Link>
          </Stack>
        </Box>
      </TableCell>
      <TableCell>
        {roleInfo.label ? (
          <Label variant="inverted" color={roleInfo.color}>
            {roleInfo.label}
          </Label>
        ) : (
          ''
        )}
      </TableCell>
      <TableCell align="center">{formatScore(row.score)}</TableCell>
      <TableCell align="center">{formatCount(row.noShowUnpaid)}</TableCell>
      <TableCell align="center">{formatCount(row.sentHomeNoPpe)}</TableCell>
      <TableCell align="center">{formatCount(row.personalUnpaid)}</TableCell>
      <TableCell align="center">{formatCount(row.leftEarlyNoNotice)}</TableCell>
      <TableCell align="center">{formatCount(row.vacationDayUnpaid)}</TableCell>
      <TableCell align="center">{formatCount(row.sickLeaveUnpaid)}</TableCell>
      <TableCell align="center">{formatCount(row.personalDayOffUnpaid)}</TableCell>
      <TableCell align="center">{formatCount(row.vacationDay10)}</TableCell>
      <TableCell align="center">{formatCount(row.refusalOfShifts)}</TableCell>
      <TableCell align="center">{formatCount(row.unauthorizedDriving)}</TableCell>
      <TableCell align="center">{formatCount(row.unapprovePayoutWithoutDayOff)}</TableCell>
      <TableCell align="center">{formatCount(row.drivingInfractions)}</TableCell>
      <TableCell align="center">{formatCount(row.sickLeave5)}</TableCell>
      <TableCell align="center">{formatCount(row.verbalWarningsWriteUp)}</TableCell>
      <TableCell>
        <Label
          variant="soft"
          color={
            (row.status === 'active' && 'success') ||
            (row.status === 'inactive' && 'error') ||
            'default'
          }
        >
          {row.status}
        </Label>
      </TableCell>
    </TableRow>
  );
}
