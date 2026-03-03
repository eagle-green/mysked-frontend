import type { ISalesTrackerRow } from 'src/types/sales-tracker';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';

import { fDate, fDateTime } from 'src/utils/format-time';
import { getPositionColor, formatPositionDisplay } from 'src/utils/format-role';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  row: ISalesTrackerRow;
};

// Format hours: round to 2 decimals, show nothing for 0 or null
function formatHours(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const n = Number(value);
  if (Number.isNaN(n) || n === 0) return '';
  return String(Math.round(n * 100) / 100);
}

// Travel: show nothing for 0 or null
function formatTravel(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const n = Number(value);
  if (Number.isNaN(n) || n === 0) return '';
  return String(Math.round(n * 100) / 100);
}

// SUB, LOA, EOC: show nothing for null/false, checkmark same as Job List (eva:checkmark-fill)
function renderBooleanCell(value: boolean | null | undefined) {
  if (value !== true) return null;
  return <Iconify icon="eva:checkmark-fill" width={20} sx={{ color: 'success.main' }} />;
}

function renderTimesheetStatus(status: string | null) {
  if (!status) return '';
  
  const statusConfig: Record<string, { label: string; color: 'default' | 'info' | 'success' | 'error' | 'primary' }> = {
    draft: { label: 'Draft', color: 'info' },
    submitted: { label: 'Submitted', color: 'success' },
    approved: { label: 'Approved', color: 'success' },
    rejected: { label: 'Rejected', color: 'error' },
    confirmed: { label: 'Confirmed', color: 'primary' },
  };
  
  const config = statusConfig[status.toLowerCase()] || { label: status, color: 'default' };
  return <Label variant="soft" color={config.color}>{config.label}</Label>;
}

export function SalesTrackerTableRow({ row }: Props) {
  const timesheetEditUrl = row.timesheetId ? paths.work.job.timesheet.edit(row.timesheetId) : '';
  const serviceLabel = formatPositionDisplay(row.service) || row.service;
  const serviceColor = getPositionColor(row.service);

  return (
    <TableRow hover>
      <TableCell>
        {serviceLabel ? (
          <Label variant="soft" color={serviceColor}>
            {serviceLabel}
          </Label>
        ) : (
          ''
        )}
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            alt={row.customer}
            src={row.customerLogoUrl || undefined}
            sx={{ width: 32, height: 32 }}
          >
            {row.customer?.charAt(0)?.toUpperCase() ?? 'C'}
          </Avatar>
          <ListItemText
            primary={row.customer || ''}
            primaryTypographyProps={{ variant: 'body2', noWrap: true }}
          />
        </Box>
      </TableCell>
      <TableCell>{row.date ? fDate(row.date, 'MMM DD YYYY') : ''}</TableCell>
      <TableCell>{row.networkPoNumber || ''}</TableCell>
      <TableCell>
        {timesheetEditUrl && row.timeCardNumber ? (
          <Link
            href={timesheetEditUrl}
            target="_blank"
            rel="noopener noreferrer"
            color="primary"
            fontWeight="bold"
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            {row.timeCardNumber}
          </Link>
        ) : (
          row.timeCardNumber || ''
        )}
      </TableCell>
      <TableCell>{renderTimesheetStatus(row.timesheetStatus)}</TableCell>
      <TableCell>
        {row.timesheetStatus === 'draft' ? null : row.submittedBy ? (
          <Stack spacing={0.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar
                src={row.submittedBy.photo_url || undefined}
                alt={`${row.submittedBy.first_name} ${row.submittedBy.last_name}`}
                sx={{ width: 32, height: 32 }}
              >
                {row.submittedBy.first_name?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Typography variant="body2" noWrap>
                {row.submittedBy.first_name && row.submittedBy.last_name
                  ? `${row.submittedBy.first_name} ${row.submittedBy.last_name}`
                  : null}
              </Typography>
            </Stack>
            {row.timesheetUpdatedAt && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {fDateTime(row.timesheetUpdatedAt)}
              </Typography>
            )}
          </Stack>
        ) : null}
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            alt={row.employee}
            src={row.employeePhotoUrl || undefined}
            sx={{ width: 32, height: 32 }}
          >
            {row.employee?.trim().split(/\s+/)[0]?.charAt(0)?.toUpperCase() ?? '?'}
          </Avatar>
          <ListItemText
            primary={row.employee || ''}
            primaryTypographyProps={{ variant: 'body2', noWrap: true }}
          />
        </Box>
      </TableCell>
      <TableCell align="center">{formatTravel(row.travelTime)}</TableCell>
      <TableCell align="center">{formatHours(row.regularHours)}</TableCell>
      <TableCell align="center">{formatHours(row.overtime8To11)}</TableCell>
      <TableCell align="center">{formatHours(row.doubleTime11Plus)}</TableCell>
      <TableCell align="center">{formatHours(row.ns1Regular)}</TableCell>
      <TableCell align="center">{formatHours(row.ns1Overtime)}</TableCell>
      <TableCell align="center">{formatHours(row.ns1DoubleTime)}</TableCell>
      <TableCell align="center">{formatHours(row.ns2Regular)}</TableCell>
      <TableCell align="center">{formatHours(row.ns2Overtime)}</TableCell>
      <TableCell align="center">{formatHours(row.ns2DoubleTime)}</TableCell>
      <TableCell align="center">
        {renderBooleanCell(row.mob != null && Number(row.mob) > 0)}
      </TableCell>
      <TableCell align="center">{renderBooleanCell(row.sub)}</TableCell>
      <TableCell align="center">{renderBooleanCell(row.loa)}</TableCell>
      <TableCell align="center">{renderBooleanCell(row.emergencyCallout)}</TableCell>
    </TableRow>
  );
}
