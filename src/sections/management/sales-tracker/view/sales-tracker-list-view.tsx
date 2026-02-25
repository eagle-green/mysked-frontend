import type { ISalesTrackerRow, ISalesTrackerTableFilters } from 'src/types/sales-tracker';
import type { TableHeadCellProps } from 'src/components/table';

import { varAlpha } from 'minimal-shared/utils';
import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Skeleton from '@mui/material/Skeleton';

import { paths } from 'src/routes/paths';

import { fIsAfter } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { SalesTrackerTableRow } from '../sales-tracker-table-row';
import { SalesTrackerTableToolbar } from '../sales-tracker-table-toolbar';
import { SalesTrackerTableFiltersResult } from '../sales-tracker-table-filters-result';

// ----------------------------------------------------------------------

const TAB_VALUE_ALL = 'all';

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'service', label: 'Service', width: 100 },
  { id: 'customer', label: 'Customer', width: 160 },
  { id: 'date', label: 'Date', width: 100 },
  { id: 'network_po', label: 'Network / PO #', width: 110 },
  { id: 'time_card', label: 'Timesheet #', width: 100 },
  { id: 'timesheet_status', label: 'Timesheet Status', width: 120 },
  { id: 'employee', label: 'Employee', width: 140 },
  {
    id: 'travel_time',
    label: 'Travel',
    width: 70,
    align: 'right',
    tooltip: 'Travel time hours',
  },
  { id: 'regular_hours', label: 'Reg (hrs)', width: 80, align: 'right' },
  {
    id: 'ot_8_11',
    label: 'OT 8–11',
    width: 80,
    align: 'right',
    tooltip: 'Overtime hours between 8 and 11 hours worked',
  },
  {
    id: 'dt_11_plus',
    label: 'DT 11+',
    width: 80,
    align: 'right',
    tooltip: 'Double time for hours worked beyond 11 hours',
  },
  {
    id: 'late_night',
    label: 'Late Night',
    width: 80,
    align: 'right',
    tooltip: 'Hours worked between 12:00 AM and 3:00 AM',
  },
  {
    id: 'ns_reg',
    label: 'NS Reg',
    width: 70,
    align: 'right',
    tooltip: 'Night shift regular hours (before 12:00 AM)',
  },
  {
    id: 'ns_ot',
    label: 'NS OT',
    width: 70,
    align: 'right',
    tooltip: 'Night shift overtime (before 12:00 AM)',
  },
  {
    id: 'ns_dt',
    label: 'NS DT',
    width: 70,
    align: 'right',
    tooltip: 'Night shift double time (before 12:00 AM)',
  },
  { id: 'mob', label: 'MOB', width: 60, align: 'right' },
  { id: 'sub', label: 'SUB', width: 60, align: 'right' },
  { id: 'loa', label: 'LOA', width: 60, align: 'right' },
  { id: 'emergency', label: 'Emergency', width: 80, align: 'right' },
];

// ----------------------------------------------------------------------

export function SalesTrackerListView() {
  const table = useTable({
    defaultDense: true,
    defaultOrder: 'desc',
    defaultOrderBy: 'date',
    defaultRowsPerPage: 25,
    defaultCurrentPage: 0,
  });

  const filters = useSetState<ISalesTrackerTableFilters>({
    query: '',
    service: 'all',
    customer: [],
    employee: [],
    startDate: null,
    endDate: null,
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const tabValue = TAB_VALUE_ALL;
  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, value: string) => {
      table.onResetPage();
      // Future: updateFilters or separate tab state when more tabs are added
    },
    [table]
  );

  // Placeholder: no API yet — use empty data; replace with useQuery when backend is ready
  const isLoading = false;
  const tableData: ISalesTrackerRow[] = useMemo(() => [], []);
  const totalCount = 0;

  const dataFiltered = tableData;
  const dateError = fIsAfter(currentFilters.startDate, currentFilters.endDate);

  const canReset =
    !!(currentFilters.query ?? '').trim() ||
    currentFilters.service !== 'all' ||
    (currentFilters.customer?.length ?? 0) > 0 ||
    (currentFilters.employee?.length ?? 0) > 0 ||
    !!currentFilters.startDate ||
    !!currentFilters.endDate;

  const notFound = !isLoading && dataFiltered.length === 0;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Sales Tracker"
        links={[
          { name: 'Management', href: paths.management.root },
          { name: 'Sales Tracker', href: paths.management.salesTracker.list },
          { name: 'List' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={[
            (theme) => ({
              px: 2.5,
              boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            }),
          ]}
        >
          <Tab value={TAB_VALUE_ALL} label="All" />
        </Tabs>

        <SalesTrackerTableToolbar
          filters={filters}
          onResetPage={table.onResetPage}
          dateError={!!dateError}
        />

        {canReset && (
          <SalesTrackerTableFiltersResult
            filters={filters}
            totalResults={totalCount}
            onResetPage={table.onResetPage}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        <Box sx={{ position: 'relative' }}>
          <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
            <TableHeadCustom
              order={table.order}
              orderBy={table.orderBy}
              headCells={TABLE_HEAD}
              rowCount={totalCount}
              onSort={table.onSort}
            />
            <TableBody>
              {isLoading ? (
                Array.from({ length: table.rowsPerPage }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="80%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width={32} sx={{ ml: 'auto' }} /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width={32} sx={{ ml: 'auto' }} /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width={32} sx={{ ml: 'auto' }} /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width={32} sx={{ ml: 'auto' }} /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width={32} sx={{ ml: 'auto' }} /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width={32} sx={{ ml: 'auto' }} /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width={32} sx={{ ml: 'auto' }} /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width={32} sx={{ ml: 'auto' }} /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width={32} sx={{ ml: 'auto' }} /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width={32} sx={{ ml: 'auto' }} /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width={32} sx={{ ml: 'auto' }} /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width={32} sx={{ ml: 'auto' }} /></TableCell>
                  </TableRow>
                ))
              ) : (
                <>
                  {dataFiltered.map((row) => (
                    <SalesTrackerTableRow key={row.id} row={row} />
                  ))}
                  <TableEmptyRows
                    height={0}
                    emptyRows={emptyRows(0, table.rowsPerPage, tableData.length)}
                  />
                  <TableNoData notFound={notFound} colSpan={TABLE_HEAD.length} />
                </>
              )}
            </TableBody>
          </Table>
        </Box>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={totalCount}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}
