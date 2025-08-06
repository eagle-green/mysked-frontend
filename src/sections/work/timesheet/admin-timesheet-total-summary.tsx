import type { BoxProps } from '@mui/material/Box';
import type { Theme, SxProps } from '@mui/material/styles';

import Box from '@mui/material/Box';

import { fPercent } from 'src/utils/format-number';

// ----------------------------------------------------------------------

type AdminTimesheetTotalSummaryProps = BoxProps & {
  totalTimesheets?: number;
  draftCount?: number;
  submittedCount?: number;
  confirmedCount?: number;
  rejectedCount?: number;
  totalHours?: number;
  totalDistance?: number;
};

export function AdminTimesheetTotalSummary({
  sx,
  totalTimesheets = 0,
  draftCount = 0,
  submittedCount = 0,
  confirmedCount = 0,
  rejectedCount = 0,
  totalHours = 0,
  totalDistance = 0,
  ...other
}: AdminTimesheetTotalSummaryProps) {
  const rowStyles: SxProps<Theme> = {
    display: 'flex',
    alignItems: 'center',
  };

  const labelStyles: SxProps<Theme> = {
    color: 'text.secondary',
  };

  const valueStyles: SxProps<Theme> = {
    width: 160,
  };

  const draftPercent = totalTimesheets > 0 ? (draftCount / totalTimesheets) * 100 : 0;
  const submittedPercent = totalTimesheets > 0 ? (submittedCount / totalTimesheets) * 100 : 0;
  const confirmedPercent = totalTimesheets > 0 ? (confirmedCount / totalTimesheets) * 100 : 0;
  const rejectedPercent = totalTimesheets > 0 ? (rejectedCount / totalTimesheets) * 100 : 0;

  return (
    <Box
      sx={[
        {
          mt: 3,
          gap: 2,
          display: 'flex',
          textAlign: 'right',
          typography: 'body2',
          alignItems: 'flex-end',
          flexDirection: 'column',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box sx={rowStyles}>
        <Box component="span" sx={labelStyles}>
          Total Timesheets
        </Box>
        <Box component="span" sx={[valueStyles, { fontWeight: 'fontWeightSemiBold' }]}>
          {totalTimesheets}
        </Box>
      </Box>

      <Box sx={rowStyles}>
        <Box component="span" sx={labelStyles}>
          Draft
        </Box>
        <Box component="span" sx={valueStyles}>
          {draftCount} ({fPercent(draftPercent)})
        </Box>
      </Box>

      <Box sx={rowStyles}>
        <Box component="span" sx={labelStyles}>
          Submitted
        </Box>
        <Box component="span" sx={valueStyles}>
          {submittedCount} ({fPercent(submittedPercent)})
        </Box>
      </Box>

      <Box sx={rowStyles}>
        <Box component="span" sx={labelStyles}>
          Confirmed
        </Box>
        <Box component="span" sx={valueStyles}>
          {confirmedCount} ({fPercent(confirmedPercent)})
        </Box>
      </Box>

      <Box sx={rowStyles}>
        <Box component="span" sx={labelStyles}>
          Rejected
        </Box>
        <Box component="span" sx={valueStyles}>
          {rejectedCount} ({fPercent(rejectedPercent)})
        </Box>
      </Box>

      <Box sx={[rowStyles, { typography: 'subtitle1' }]}>
        <Box component="span">Total Hours</Box>
        <Box component="span" sx={valueStyles}>
          {totalHours.toFixed(1)}h
        </Box>
      </Box>

      <Box sx={[rowStyles, { typography: 'subtitle1' }]}>
        <Box component="span">Total Distance</Box>
        <Box component="span" sx={valueStyles}>
          {totalDistance.toFixed(1)} km
        </Box>
      </Box>
    </Box>
  );
} 