import type { TableHeadCellProps } from 'src/components/table';
import type { ISalesTrackerRow, ISalesTrackerTableFilters } from 'src/types/sales-tracker';

import dayjs from 'dayjs';
import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

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

import { Label } from 'src/components/label';
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
import { SalesTrackerTravelApprovalDialog } from '../sales-tracker-travel-approval-dialog';
import { type EmployeeGroup, SalesTrackerByEmployeeRow } from '../sales-tracker-by-employee-row';
import { getDefaultTwoWeekRange, SalesTrackerTableToolbar } from '../sales-tracker-table-toolbar';

// ----------------------------------------------------------------------

const TAB_VALUE_ALL = 'all';
const TAB_VALUE_PENDING_TRAVEL = 'pending_travel';
const TAB_VALUE_BY_EMPLOYEE = 'by_employee';

/** When By Employee tab is active we request this many rows so we can group by employee. */
const BY_EMPLOYEE_FETCH_SIZE = 5000;

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

const TABLE_HEAD_BY_EMPLOYEE: TableHeadCellProps[] = [
  { id: 'employee', label: 'Employee', width: 160 },
  { id: 'travel', label: 'Total Travel', width: 90, align: 'center', sortable: false },
  { id: 'reg', label: 'Total Reg (hrs)', width: 100, align: 'center', sortable: false },
  { id: 'ot_8_11', label: 'Total OT 8–11', width: 100, align: 'center', sortable: false },
  { id: 'dt_11_plus', label: 'DT 11+', width: 80, align: 'center', sortable: false },
  { id: 'ns1_reg', label: 'NS1 Reg', width: 70, align: 'center', sortable: false },
  { id: 'ns1_ot', label: 'NS1 OT', width: 70, align: 'center', sortable: false },
  { id: 'ns1_dt', label: 'NS1 DT', width: 70, align: 'center', sortable: false },
  { id: 'ns2_reg', label: 'NS2 Reg', width: 70, align: 'center', sortable: false },
  { id: 'ns2_ot', label: 'NS2 OT', width: 70, align: 'center', sortable: false },
  { id: 'ns2_dt', label: 'NS2 DT', width: 70, align: 'center', sortable: false },
  { id: 'mob', label: 'MOB', width: 60, align: 'center', sortable: false },
  { id: 'sub', label: 'SUB', width: 60, align: 'center', sortable: false },
  { id: 'loa', label: 'LOA', width: 60, align: 'center', sortable: false },
  { id: 'emergency', label: 'EOC', width: 80, align: 'center', sortable: false },
  { id: 'expand', label: '', width: 48, sortable: false },
];

// ----------------------------------------------------------------------

function buildEmployeeGroups(rows: ISalesTrackerRow[]): EmployeeGroup[] {
  const map = new Map<string, ISalesTrackerRow[]>();
  for (const row of rows) {
    const key = row.employeeId || row.employee?.trim() || row.id;
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  const groups: EmployeeGroup[] = [];
  map.forEach((list, key) => {
    const sorted = [...list].sort((a, b) => {
      const dA = a.date ? dayjs(a.date).valueOf() : 0;
      const dB = b.date ? dayjs(b.date).valueOf() : 0;
      return dA - dB;
    });
    const first = sorted[0];
    const employeeName = first?.employee?.trim() || '—';
    const employeePhotoUrl = first?.employeePhotoUrl ?? null;
    let travel = 0;
    let regularHours = 0;
    let overtime8To11 = 0;
    let doubleTime11Plus = 0;
    let ns1Regular = 0;
    let ns1Overtime = 0;
    let ns1DoubleTime = 0;
    let ns2Regular = 0;
    let ns2Overtime = 0;
    let ns2DoubleTime = 0;
    let countMob = 0;
    let countSub = 0;
    let countLoa = 0;
    let countEoc = 0;
    let hasPendingTravelApproval = false;
    let hasApprovedTravel = false;
    for (const r of sorted) {
      travel += Number(r.travelTime) || 0;
      regularHours += Number(r.regularHours) || 0;
      overtime8To11 += Number(r.overtime8To11) || 0;
      doubleTime11Plus += Number(r.doubleTime11Plus) || 0;
      ns1Regular += Number(r.ns1Regular) || 0;
      ns1Overtime += Number(r.ns1Overtime) || 0;
      ns1DoubleTime += Number(r.ns1DoubleTime) || 0;
      ns2Regular += Number(r.ns2Regular) || 0;
      ns2Overtime += Number(r.ns2Overtime) || 0;
      ns2DoubleTime += Number(r.ns2DoubleTime) || 0;
      if (r.mob != null && Number(r.mob) > 0) countMob += 1;
      if (r.sub === true) countSub += 1;
      if (r.loa === true) countLoa += 1;
      if (r.emergencyCallout === true) countEoc += 1;
      if (r.travelTimePendingApproval === true) hasPendingTravelApproval = true;
      if (r.travelTimeApprovedMinutes != null && r.travelTimeApprovedMinutes > 0) hasApprovedTravel = true;
    }
    groups.push({
      employeeKey: key,
      employeeName,
      employeePhotoUrl,
      rows: sorted,
      hasPendingTravelApproval,
      hasApprovedTravel,
      totals: {
        travel,
        regularHours,
        overtime8To11,
        doubleTime11Plus,
        ns1Regular,
        ns1Overtime,
        ns1DoubleTime,
        ns2Regular,
        ns2Overtime,
        ns2DoubleTime,
        countMob,
        countSub,
        countLoa,
        countEoc,
      },
    });
  });
  groups.sort((a, b) => a.employeeName.localeCompare(b.employeeName, undefined, { sensitivity: 'base' }));
  return groups;
}

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

  const [tabValue, setTabValue] = useState<string>(TAB_VALUE_ALL);
  const [travelApprovalEntryId, setTravelApprovalEntryId] = useState<string | null>(null);
  const travelApprovalOpen = travelApprovalEntryId !== null;

  const handleTravelCellClick = useCallback((row: ISalesTrackerRow) => {
    if (row.timesheetEntryId) setTravelApprovalEntryId(row.timesheetEntryId);
  }, []);

  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, value: string) => {
      setTabValue(value);
      table.onResetPage();
    },
    [table]
  );

  const isByEmployeeTab = tabValue === TAB_VALUE_BY_EMPLOYEE;
  const fetchPage = isByEmployeeTab ? 1 : table.page + 1;
  const fetchRowsPerPage = isByEmployeeTab ? BY_EMPLOYEE_FETCH_SIZE : table.rowsPerPage;

  // Fetch sales tracker data from API
  const { data: salesTrackerResponse, isLoading } = useQuery({
    queryKey: [
      'sales-tracker',
      tabValue,
      isByEmployeeTab ? 1 : table.page,
      isByEmployeeTab ? BY_EMPLOYEE_FETCH_SIZE : table.rowsPerPage,
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
        page: fetchPage.toString(),
        rowsPerPage: fetchRowsPerPage.toString(),
        orderBy: table.orderBy || 'start_time',
        order: table.order || 'desc',
      });
      if (tabValue === TAB_VALUE_PENDING_TRAVEL) {
        params.set('tab', TAB_VALUE_PENDING_TRAVEL);
      }
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
  const allTabCount = salesTrackerResponse?.pagination?.allTabCount ?? totalCount;
  const pendingTravelTimeCount =
    salesTrackerResponse?.pagination?.pendingTravelTimeCount ?? 0;

  const employeeGroups = useMemo(() => buildEmployeeGroups(tableData), [tableData]);
  const employeeCount = employeeGroups.length;
  const employeeGroupsPaginated = useMemo(() => {
    if (!isByEmployeeTab) return [];
    const start = table.page * table.rowsPerPage;
    return employeeGroups.slice(start, start + table.rowsPerPage);
  }, [isByEmployeeTab, employeeGroups, table.page, table.rowsPerPage]);

  const dataFiltered = tableData;
  const dateError = fIsAfter(currentFilters.startDate, currentFilters.endDate);

  const canReset =
    !!(currentFilters.query ?? '').trim() ||
    currentFilters.service !== 'all' ||
    (currentFilters.customer?.length ?? 0) > 0 ||
    (currentFilters.employee?.length ?? 0) > 0 ||
    !!currentFilters.startDate ||
    !!currentFilters.endDate;

  const notFound = !isLoading && (isByEmployeeTab ? employeeCount === 0 : dataFiltered.length === 0);
  const paginationCount = isByEmployeeTab ? employeeCount : totalCount;

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
          <Tab
            value={TAB_VALUE_ALL}
            label="All"
            iconPosition="end"
            icon={
              <Label variant="filled" color="default">
                {allTabCount}
              </Label>
            }
          />
          <Tab
            value={TAB_VALUE_PENDING_TRAVEL}
            label="Pending Travel Time"
            iconPosition="end"
            icon={
              <Label
                variant={tabValue === TAB_VALUE_PENDING_TRAVEL ? 'filled' : 'soft'}
                color="warning"
              >
                {pendingTravelTimeCount}
              </Label>
            }
          />
          <Tab
            value={TAB_VALUE_BY_EMPLOYEE}
            label="By Employee"
            iconPosition="end"
            icon={
              <Label
                variant={tabValue === TAB_VALUE_BY_EMPLOYEE ? 'filled' : 'soft'}
                color="primary"
              >
                {employeeCount}
              </Label>
            }
          />
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
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: isByEmployeeTab ? 1200 : 1400 }}>
            {isByEmployeeTab ? (
              <>
                <TableHeadCustom headCells={TABLE_HEAD_BY_EMPLOYEE} rowCount={paginationCount} />
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: table.rowsPerPage }).map((_, index) => (
                      <TableRow key={`skeleton-by-emp-${index}`}>
                        <TableCell><Skeleton variant="text" width={32} /></TableCell>
                        <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                        <TableCell align="center"><Skeleton variant="text" width={32} /></TableCell>
                        <TableCell align="center"><Skeleton variant="text" width={32} /></TableCell>
                        <TableCell align="center"><Skeleton variant="text" width={32} /></TableCell>
                        <TableCell align="center"><Skeleton variant="text" width={32} /></TableCell>
                        <TableCell align="center"><Skeleton variant="text" width={32} /></TableCell>
                        <TableCell align="center"><Skeleton variant="text" width={32} /></TableCell>
                        <TableCell align="center"><Skeleton variant="text" width={32} /></TableCell>
                        <TableCell align="center"><Skeleton variant="text" width={32} /></TableCell>
                        <TableCell align="center"><Skeleton variant="text" width={32} /></TableCell>
                        <TableCell align="center"><Skeleton variant="text" width={32} /></TableCell>
                        <TableCell align="center"><Skeleton variant="text" width={32} /></TableCell>
                        <TableCell align="center"><Skeleton variant="text" width={32} /></TableCell>
                        <TableCell align="center"><Skeleton variant="text" width={32} /></TableCell>
                        <TableCell align="center"><Skeleton variant="text" width={32} /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <>
                      {employeeGroupsPaginated.map((group) => (
                        <SalesTrackerByEmployeeRow
                          key={group.employeeKey}
                          group={group}
                          detailTableHead={TABLE_HEAD}
                          onTravelCellClick={handleTravelCellClick}
                        />
                      ))}
                      <TableEmptyRows
                        height={0}
                        emptyRows={emptyRows(0, table.rowsPerPage, employeeCount)}
                      />
                      <TableNoData notFound={notFound} colSpan={TABLE_HEAD_BY_EMPLOYEE.length} />
                    </>
                  )}
                </TableBody>
              </>
            ) : (
              <>
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
                    <SalesTrackerTableRow
                      key={row.id}
                      row={row}
                      onTravelCellClick={handleTravelCellClick}
                    />
                  ))}
                  <TableEmptyRows
                    height={0}
                    emptyRows={emptyRows(0, table.rowsPerPage, tableData.length)}
                  />
                  <TableNoData notFound={notFound} colSpan={TABLE_HEAD.length} />
                </>
              )}
                </TableBody>
              </>
            )}
          </Table>
          </Scrollbar>
        </Box>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={paginationCount}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>

      <SalesTrackerTravelApprovalDialog
        open={travelApprovalOpen}
        onClose={() => setTravelApprovalEntryId(null)}
        entryId={travelApprovalEntryId}
        onSuccess={() => setTravelApprovalEntryId(null)}
      />
    </DashboardContent>
  );
}
