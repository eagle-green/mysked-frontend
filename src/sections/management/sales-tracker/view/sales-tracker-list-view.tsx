import type { TableHeadCellProps } from 'src/components/table';
import type { ISalesTrackerRow, ISalesTrackerTableFilters } from 'src/types/sales-tracker';

import dayjs from 'dayjs';
import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { fIsAfter } from 'src/utils/format-time';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Scrollbar } from 'src/components/scrollbar';
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
import { SalesTrackerTableFiltersResult } from '../sales-tracker-table-filters-result';
import { getDefaultTwoWeekRange, SalesTrackerTableToolbar } from '../sales-tracker-table-toolbar';

// ----------------------------------------------------------------------

const TAB_VALUE_ALL = 'all';

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'service', label: 'Service', width: 100 },
  { id: 'customer', label: 'Customer', width: 160 },
  { id: 'date', label: 'Date', width: 100 },
  { id: 'network_po', label: 'Network / PO #', width: 110 },
  { id: 'time_card', label: 'Timesheet #', width: 100 },
  { id: 'timesheet_status', label: 'Timesheet Status', width: 120 },
  { id: 'submitted_by', label: 'Submitted By', width: 140 },
  { id: 'employee', label: 'Employee', width: 140 },
  {
    id: 'travel_time',
    label: 'Travel',
    width: 70,
    align: 'center',
    tooltip: 'Travel time hours',
    sortable: false,
  },
  { id: 'regular_hours', label: 'Reg (hrs)', width: 80, align: 'center', sortable: false },
  {
    id: 'ot_8_11',
    label: 'OT 8–11',
    width: 80,
    align: 'center',
    tooltip: 'Overtime hours between 8 and 11 hours worked',
    sortable: false,
  },
  {
    id: 'dt_11_plus',
    label: 'DT 11+',
    width: 80,
    align: 'center',
    tooltip: 'Double time for hours worked beyond 11 hours',
    sortable: false,
  },
  {
    id: 'ns1_reg',
    label: 'NS1 Reg',
    width: 70,
    align: 'center',
    tooltip: 'Night shift 1 regular hours (5PM-12AM shift)',
    sortable: false,
  },
  {
    id: 'ns1_ot',
    label: 'NS1 OT',
    width: 70,
    align: 'center',
    tooltip: 'Night shift 1 overtime (5PM-12AM shift)',
    sortable: false,
  },
  {
    id: 'ns1_dt',
    label: 'NS1 DT',
    width: 70,
    align: 'center',
    tooltip: 'Night shift 1 double time (5PM-12AM shift)',
    sortable: false,
  },
  {
    id: 'ns2_reg',
    label: 'NS2 Reg',
    width: 70,
    align: 'center',
    tooltip: 'Night shift 2 regular hours (12AM-5:59AM shift)',
    sortable: false,
  },
  {
    id: 'ns2_ot',
    label: 'NS2 OT',
    width: 70,
    align: 'center',
    tooltip: 'Night shift 2 overtime (12AM-5:59AM shift)',
    sortable: false,
  },
  {
    id: 'ns2_dt',
    label: 'NS2 DT',
    width: 70,
    align: 'center',
    tooltip: 'Night shift 2 double time (12AM-5:59AM shift)',
    sortable: false,
  },
  {
    id: 'mob',
    label: 'MOB',
    width: 60,
    align: 'center',
    sortable: false,
    tooltip: 'Mobilization',
  },
  {
    id: 'sub',
    label: 'SUB',
    width: 60,
    align: 'center',
    sortable: false,
    tooltip: 'Subcontractor',
  },
  {
    id: 'loa',
    label: 'LOA',
    width: 60,
    align: 'center',
    sortable: false,
    tooltip: 'Living Out Allowance',
  },
  {
    id: 'emergency',
    label: 'EOC',
    width: 80,
    align: 'center',
    sortable: false,
    tooltip: 'Emergency callout',
  },
];

// ----------------------------------------------------------------------

export function SalesTrackerListView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const table = useTable({
    defaultDense: searchParams.get('dense') !== 'false',
    defaultOrder: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
    defaultOrderBy: searchParams.get('orderBy') || 'date',
    defaultRowsPerPage: parseInt(searchParams.get('rowsPerPage') || '25', 10),
    defaultCurrentPage: Math.max(0, parseInt(searchParams.get('page') || '1', 10) - 1),
  });

  const defaultDateRange = useMemo(() => getDefaultTwoWeekRange(), []);
  const filters = useSetState<ISalesTrackerTableFilters>({
    query: searchParams.get('search') || '',
    service: (searchParams.get('service') as ISalesTrackerTableFilters['service']) || 'all',
    customer: searchParams.get('customer') ? searchParams.get('customer')!.split(',').filter(Boolean).map((id) => ({ id, name: '' })) : [],
    employee: searchParams.get('employee') ? searchParams.get('employee')!.split(',').filter(Boolean).map((id) => ({ id, name: '' })) : [],
    startDate: searchParams.get('startDate')
      ? dayjs(searchParams.get('startDate')).startOf('day')
      : defaultDateRange.start,
    endDate: searchParams.get('endDate')
      ? dayjs(searchParams.get('endDate')).endOf('day')
      : defaultDateRange.end,
  });
  const { state: currentFilters } = filters;

  // Update URL when table state or filters change (shareable / bookmarkable list state)
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', (table.page + 1).toString());
    params.set('rowsPerPage', table.rowsPerPage.toString());
    params.set('orderBy', table.orderBy);
    params.set('order', table.order);
    params.set('dense', table.dense.toString());
    if ((currentFilters.query ?? '').trim()) params.set('search', (currentFilters.query ?? '').trim());
    if (currentFilters.service && currentFilters.service !== 'all') params.set('service', currentFilters.service);
    if (currentFilters.customer?.length) params.set('customer', currentFilters.customer.map((c) => c.id).join(','));
    if (currentFilters.employee?.length) params.set('employee', currentFilters.employee.map((e) => e.id).join(','));
    if (currentFilters.startDate) params.set('startDate', dayjs(currentFilters.startDate).format('YYYY-MM-DD'));
    if (currentFilters.endDate) params.set('endDate', dayjs(currentFilters.endDate).format('YYYY-MM-DD'));
    const url = `?${params.toString()}`;
    router.replace(`${window.location.pathname}${url}`);
  }, [table.page, table.rowsPerPage, table.orderBy, table.order, table.dense, currentFilters, router]);

  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // Reset to first page when filters change (do not include table — it would reset page on every pagination)
  const startDateDep = currentFilters.startDate?.valueOf?.() ?? currentFilters.startDate;
  const endDateDep = currentFilters.endDate?.valueOf?.() ?? currentFilters.endDate;
  useEffect(() => {
    table.onResetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset when filter values change, not when table ref changes
  }, [
    currentFilters.query,
    currentFilters.service,
    currentFilters.customer?.length,
    currentFilters.employee?.length,
    startDateDep,
    endDateDep,
  ]);

  const tabValue = TAB_VALUE_ALL;
  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, value: string) => {
      table.onResetPage();
      // Future: updateFilters or separate tab state when more tabs are added
    },
    [table]
  );

  // Fetch sales tracker data from API
  const { data: salesTrackerResponse, isLoading } = useQuery({
    queryKey: [
      'sales-tracker',
      table.page,
      table.rowsPerPage,
      table.orderBy,
      table.order,
      currentFilters.query,
      currentFilters.service,
      currentFilters.customer.map((c) => c.id).join(','),
      currentFilters.employee.map((e) => e.id).join(','),
      currentFilters.startDate?.toISOString?.(),
      currentFilters.endDate?.toISOString?.(),
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (table.page + 1).toString(),
        rowsPerPage: table.rowsPerPage.toString(),
        orderBy: table.orderBy || 'start_time',
        order: table.order || 'desc',
      });
      if ((currentFilters.query ?? '').trim()) {
        params.set('search', (currentFilters.query ?? '').trim());
      }
      if (currentFilters.service && currentFilters.service !== 'all') {
        params.set('service', currentFilters.service);
      }
      if (currentFilters.customer?.length) {
        params.set('customer', currentFilters.customer.map((c) => c.id).join(','));
      }
      if (currentFilters.employee?.length) {
        params.set('employee', currentFilters.employee.map((e) => e.id).join(','));
      }
      if (currentFilters.startDate) {
        params.set('startDate', dayjs(currentFilters.startDate).format('YYYY-MM-DD'));
      }
      if (currentFilters.endDate) {
        params.set('endDate', dayjs(currentFilters.endDate).format('YYYY-MM-DD'));
      }
      const res = await fetcher(`${endpoints.management.salesTracker}?${params.toString()}`);
      return res;
    },
    staleTime: 0,
  });

  const tableData: ISalesTrackerRow[] = useMemo(
    () => (salesTrackerResponse?.data ?? []) as ISalesTrackerRow[],
    [salesTrackerResponse?.data]
  );
  const totalCount = salesTrackerResponse?.pagination?.totalCount ?? 0;

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
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 1400 }}>
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
          </Scrollbar>
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
