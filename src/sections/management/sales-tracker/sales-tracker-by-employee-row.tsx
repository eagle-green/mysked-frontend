import type { TableHeadCellProps } from 'src/components/table';
import type { ISalesTrackerRow } from 'src/types/sales-tracker';

import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';
import { TableHeadCustom } from 'src/components/table';

import { SalesTrackerTableRow } from './sales-tracker-table-row';

// ----------------------------------------------------------------------

function formatHours(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const n = Number(value);
  if (Number.isNaN(n) || n === 0) return '';
  return String(Math.round(n * 100) / 100);
}

function formatTravel(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const n = Number(value);
  if (Number.isNaN(n) || n === 0) return '';
  return String(Math.round(n * 100) / 100);
}

function formatCount(value: number): string {
  if (value == null || value <= 0) return '';
  return String(value);
}

export type EmployeeGroup = {
  employeeKey: string;
  employeeName: string;
  employeePhotoUrl: string | null;
  rows: ISalesTrackerRow[];
  hasPendingTravelApproval: boolean;
  hasApprovedTravel: boolean;
  totals: {
    travel: number;
    regularHours: number;
    overtime8To11: number;
    doubleTime11Plus: number;
    ns1Regular: number;
    ns1Overtime: number;
    ns1DoubleTime: number;
    ns2Regular: number;
    ns2Overtime: number;
    ns2DoubleTime: number;
    countMob: number;
    countSub: number;
    countLoa: number;
    countEoc: number;
  };
};

type Props = {
  group: EmployeeGroup;
  detailTableHead: TableHeadCellProps[];
  onTravelCellClick?: (row: ISalesTrackerRow) => void;
};

export function SalesTrackerByEmployeeRow({ group, detailTableHead, onTravelCellClick }: Props) {
  const expanded = useBoolean(false);
  const { employeeName, employeePhotoUrl, rows, totals, hasPendingTravelApproval, hasApprovedTravel } = group;

  return (
    <>
      <TableRow hover>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              alt={employeeName}
              src={employeePhotoUrl || undefined}
              sx={{ width: 32, height: 32 }}
            >
              {employeeName?.trim().split(/\s+/)[0]?.charAt(0)?.toUpperCase() ?? '?'}
            </Avatar>
            <span>{employeeName || '—'}</span>
          </Box>
        </TableCell>
        <TableCell align="center">
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            {hasPendingTravelApproval && (
              <Tooltip title="Travel time pending approval">
                <Iconify icon={"eva:alert-triangle-fill" as any} width={18} sx={{ color: 'warning.main' }} />
              </Tooltip>
            )}
            {hasApprovedTravel && !hasPendingTravelApproval && (
              <Tooltip title="Travel time approved">
                <Iconify icon={"eva:checkmark-circle-fill" as any} width={18} sx={{ color: 'success.main' }} />
              </Tooltip>
            )}
            {formatTravel(totals.travel)}
          </Box>
        </TableCell>
        <TableCell align="center">{formatHours(totals.regularHours)}</TableCell>
        <TableCell align="center">{formatHours(totals.overtime8To11)}</TableCell>
        <TableCell align="center">{formatHours(totals.doubleTime11Plus)}</TableCell>
        <TableCell align="center">{formatHours(totals.ns1Regular)}</TableCell>
        <TableCell align="center">{formatHours(totals.ns1Overtime)}</TableCell>
        <TableCell align="center">{formatHours(totals.ns1DoubleTime)}</TableCell>
        <TableCell align="center">{formatHours(totals.ns2Regular)}</TableCell>
        <TableCell align="center">{formatHours(totals.ns2Overtime)}</TableCell>
        <TableCell align="center">{formatHours(totals.ns2DoubleTime)}</TableCell>
        <TableCell align="center">{formatCount(totals.countMob)}</TableCell>
        <TableCell align="center">{formatCount(totals.countSub)}</TableCell>
        <TableCell align="center">{formatCount(totals.countLoa)}</TableCell>
        <TableCell align="center">{formatCount(totals.countEoc)}</TableCell>
        <TableCell sx={{ width: 48 }}>
          <IconButton
            color={expanded.value ? 'inherit' : 'default'}
            onClick={expanded.onToggle}
            sx={{ ...(expanded.value && { bgcolor: 'action.hover' }) }}
          >
            <Iconify
              icon={expanded.value ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
            />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell sx={{ p: 0, border: 'none' }} colSpan={16}>
          <Collapse in={expanded.value} timeout="auto" unmountOnExit sx={{ bgcolor: 'background.neutral' }}>
            <Box sx={{ py: 1, px: 1.5 }}>
              <Table size="small" sx={{ minWidth: 1400 }}>
                <TableHeadCustom headCells={detailTableHead} rowCount={rows.length} />
                <TableBody>
                  {rows.map((row) => (
                    <SalesTrackerTableRow
                      key={row.id}
                      row={row}
                      onTravelCellClick={onTravelCellClick}
                    />
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}
