import type { ISalesTrackerRow } from 'src/types/sales-tracker';

import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { fDate } from 'src/utils/format-time';

// ----------------------------------------------------------------------

type Props = {
  row: ISalesTrackerRow;
};

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const n = Number(value);
  return Number.isNaN(n) ? '—' : String(n);
}

export function SalesTrackerTableRow({ row }: Props) {
  return (
    <TableRow hover>
      <TableCell>{row.service || '—'}</TableCell>
      <TableCell>{row.customer || '—'}</TableCell>
      <TableCell>{row.date ? fDate(row.date) : '—'}</TableCell>
      <TableCell>{row.networkPoNumber || '—'}</TableCell>
      <TableCell>{row.timeCardNumber || '—'}</TableCell>
      <TableCell>{row.timesheetStatus || '—'}</TableCell>
      <TableCell>{row.employee || '—'}</TableCell>
      <TableCell align="right">{formatNumber(row.travelTime)}</TableCell>
      <TableCell align="right">{formatNumber(row.regularHours)}</TableCell>
      <TableCell align="right">{formatNumber(row.overtime8To11)}</TableCell>
      <TableCell align="right">{formatNumber(row.doubleTime11Plus)}</TableCell>
      <TableCell align="right">{formatNumber(row.lateNight)}</TableCell>
      <TableCell align="right">{formatNumber(row.nightShiftRegular)}</TableCell>
      <TableCell align="right">{formatNumber(row.nightShiftOvertime)}</TableCell>
      <TableCell align="right">{formatNumber(row.nightShiftDoubleTime)}</TableCell>
      <TableCell align="right">{formatNumber(row.mob)}</TableCell>
      <TableCell align="right">{formatNumber(row.sub)}</TableCell>
      <TableCell align="right">{formatNumber(row.loa)}</TableCell>
      <TableCell align="right">{formatNumber(row.emergencyCallout)}</TableCell>
    </TableRow>
  );
}
