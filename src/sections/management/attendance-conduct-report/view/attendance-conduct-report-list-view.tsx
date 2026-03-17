import type { TableHeadCellProps } from 'src/components/table';
import type { IAttendanceConductReportRow, IAttendanceConductReportTableFilters } from 'src/types/attendance-conduct-report';

import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { AttendanceConductReportTableRow } from '../attendance-conduct-report-table-row';
import { AttendanceConductReportTableToolbar } from '../attendance-conduct-report-table-toolbar';
import { AttendanceConductReportTableFiltersResult } from '../attendance-conduct-report-table-filters-result';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

/** Column order matches tab: score-impacting first, then sick leave / vacation / payout later. All columns sortable (up/down arrow). */
const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'employee', label: 'Employee', width: 160 },
  { id: 'position', label: 'Position', width: 120 },
  { id: 'score', label: 'Score', width: 70, align: 'center' },
  { id: 'noShowUnpaid', label: 'No Show (Unpaid)', width: 110, align: 'center' },
  { id: 'refusalOfShifts', label: 'Refusal of shift', width: 120, align: 'center' },
  { id: 'sentHomeNoPpe', label: 'Sent home from site (No PPE)', width: 180, align: 'center' },
  { id: 'leftEarlyNoNotice', label: 'Left Early No Notice', width: 140, align: 'center' },
  { id: 'lateOnSite', label: 'Late on Site', width: 100, align: 'center' },
  { id: 'unapprovedDaysOffShortNotice', label: 'Unapproved Days Off / Short Notice', width: 220, align: 'center' },
  { id: 'calledInSick', label: 'Called in Sick', width: 110, align: 'center' },
  { id: 'unauthorizedDriving', label: 'Unauthorized Driving', width: 140, align: 'center' },
  { id: 'drivingInfractions', label: 'Driving Infractions', width: 120, align: 'center' },
  { id: 'verbalWarningsWriteUp', label: 'Verbal Warnings / Write Up', width: 160, align: 'center' },
  { id: 'sickLeaveUnpaid', label: 'Sick Leave (Unpaid)', width: 130, align: 'center' },
  { id: 'sickLeave5', label: 'Sick Leave (5)', width: 100, align: 'center' },
  { id: 'vacationDayUnpaid', label: 'Vacation Day (Unpaid)', width: 140, align: 'center' },
  { id: 'vacationDay10', label: 'Vacation Day (10)', width: 120, align: 'center' },
  { id: 'personalDayOffUnpaid', label: 'Personal Day Off (Unpaid)', width: 170, align: 'center' },
  { id: 'unapprovePayoutWithoutDayOff', label: 'Unapprove Payout without Day Off', width: 200, align: 'center' },
  { id: 'status', label: 'Status', width: 90 },
];

/** Columns that sort by number (score and count columns). Used for reliable numeric sort. */
const NUMERIC_SORT_COLUMN_IDS = new Set([
  'score',
  'noShowUnpaid',
  'refusalOfShifts',
  'sentHomeNoPpe',
  'leftEarlyNoNotice',
  'lateOnSite',
  'unapprovedDaysOffShortNotice',
  'calledInSick',
  'unauthorizedDriving',
  'drivingInfractions',
  'verbalWarningsWriteUp',
  'sickLeaveUnpaid',
  'sickLeave5',
  'vacationDayUnpaid',
  'vacationDay10',
  'personalDayOffUnpaid',
  'unapprovePayoutWithoutDayOff',
]);

function mapUserToReportRow(
  user: any,
  counts?: Record<string, number>,
  scores?: Record<string, number>
): IAttendanceConductReportRow {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.email || user.id;
  const c = counts ?? {};
  const userIdKey = user.id != null ? String(user.id) : '';
  const computedScore = userIdKey ? (scores?.[userIdKey] ?? scores?.[user.id]) : undefined;
  const score =
    computedScore != null
      ? Number(computedScore)
      : user.conduct_score != null
        ? Number(user.conduct_score)
        : user.score != null
          ? Number(user.score)
          : 100;
  return {
    id: user.id,
    employee: name,
    photo_url: user.photo_url ?? null,
    position: user.role ?? '',
    score,
    noShowUnpaid: c.noShowUnpaid ?? 0,
    sentHomeNoPpe: c.sentHomeNoPpe ?? 0,
    leftEarlyNoNotice: c.leftEarlyNoNotice ?? 0,
    lateOnSite: c.lateOnSite ?? 0,
    vacationDayUnpaid: c.vacationDayUnpaid ?? 0,
    sickLeaveUnpaid: c.sickLeaveUnpaid ?? 0,
    personalDayOffUnpaid: c.personalDayOffUnpaid ?? 0,
    vacationDay10: c.vacationDay10 ?? 0,
    sickLeave5: c.sickLeave5 ?? 0,
    calledInSick: c.calledInSick ?? 0,
    refusalOfShifts: c.refusalOfShifts ?? 0,
    unapprovedDaysOffShortNotice: c.unapprovedDaysOffShortNotice ?? 0,
    unauthorizedDriving: c.unauthorizedDriving ?? 0,
    drivingInfractions: c.drivingInfractions ?? 0,
    unapprovePayoutWithoutDayOff: c.unapprovePayoutWithoutDayOff ?? 0,
    verbalWarningsWriteUp: c.verbalWarningsWriteUp ?? 0,
    status: user.status ?? 'active',
  };
}

// ----------------------------------------------------------------------

export function AttendanceConductReportListView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const table = useTable({
    defaultDense: searchParams.get('dense') !== 'false',
    defaultOrder: (searchParams.get('order') as 'asc' | 'desc') || 'asc',
    defaultOrderBy: searchParams.get('orderBy') || 'employee',
    defaultRowsPerPage: parseInt(searchParams.get('rowsPerPage') || '25', 10),
    defaultCurrentPage: Math.max(0, parseInt(searchParams.get('page') || '1', 10) - 1),
  });

  const filters = useSetState<IAttendanceConductReportTableFilters>({
    query: searchParams.get('search') || '',
    status: (searchParams.get('status') as IAttendanceConductReportTableFilters['status']) || 'all',
    employee: searchParams.get('employee')
      ? searchParams.get('employee')!.split(',').filter(Boolean).map((id) => ({ id, name: '' }))
      : [],
    scoreMin: undefined,
    scoreMax: undefined,
    columnAtLeastOne: [],
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', (table.page + 1).toString());
    params.set('rowsPerPage', table.rowsPerPage.toString());
    params.set('orderBy', table.orderBy);
    params.set('order', table.order);
    params.set('dense', table.dense.toString());
    if (currentFilters.query) params.set('search', currentFilters.query);
    if (currentFilters.status !== 'all') params.set('status', currentFilters.status);
    if ((currentFilters.employee ?? []).length > 0) {
      params.set('employee', (currentFilters.employee ?? []).map((e) => e.id).join(','));
    }
    const url = `?${params.toString()}`;
    router.replace(`${window.location.pathname}${url}`);
  }, [table.page, table.rowsPerPage, table.orderBy, table.order, table.dense, currentFilters.query, currentFilters.status, currentFilters.employee, router]);

  useEffect(() => {
    updateURL();
  }, [updateURL]);

  const columnAtLeastOneKey = (currentFilters.columnAtLeastOne ?? []).join(',');
  useEffect(() => {
    table.onResetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentFilters.query,
    currentFilters.status,
    currentFilters.employee?.length,
    currentFilters.scoreMin,
    currentFilters.scoreMax,
    columnAtLeastOneKey,
  ]);

  const { data: userListResponse, isLoading } = useQuery({
    queryKey: [
      'attendance-conduct-report',
      table.page,
      table.rowsPerPage,
      table.orderBy,
      table.order,
      currentFilters.query,
      currentFilters.status,
      (currentFilters.employee ?? []).map((e) => e.id).join(','),
    ],
    queryFn: async () => {
      const orderByMap: Record<string, string> = {
        employee: 'first_name',
        position: 'role',
        status: 'status',
      };
      const orderBy = NUMERIC_SORT_COLUMN_IDS.has(table.orderBy ?? '')
        ? (table.orderBy as string)
        : (orderByMap[table.orderBy ?? ''] ?? 'first_name');
      const params = new URLSearchParams({
        page: (table.page + 1).toString(),
        rowsPerPage: table.rowsPerPage.toString(),
        orderBy,
        order: table.order,
        include: 'conductCounts',
        ...(currentFilters.status !== 'all' && { status: currentFilters.status }),
        ...(currentFilters.query && { search: currentFilters.query }),
      });
      if ((currentFilters.employee ?? []).length > 0) {
        params.set('ids', (currentFilters.employee ?? []).map((e) => e.id).join(','));
      }
      const response = await fetcher(`${endpoints.management.user}?${params.toString()}`);
      return response?.data ?? response;
    },
  });

  const countsByUser = useMemo(
    () => userListResponse?.counts ?? {},
    [userListResponse?.counts]
  );
  const scoresByUser = useMemo(
    () => userListResponse?.scores ?? {},
    [userListResponse?.scores]
  );

  const { data: statusCountsResponse } = useQuery({
    queryKey: [
      'attendance-conduct-report-status-counts',
      currentFilters.query,
      (currentFilters.employee ?? []).map((e) => e.id).join(','),
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentFilters.query) params.set('search', currentFilters.query);
      if ((currentFilters.employee ?? []).length > 0) {
        params.set('ids', (currentFilters.employee ?? []).map((e) => e.id).join(','));
      }
      const response = await fetcher(`${endpoints.management.user}/counts/status?${params.toString()}`);
      return response?.data ?? response;
    },
  });

  const tableData = useMemo(() => {
    const users = userListResponse?.users ?? [];
    return users.map((u: any) => mapUserToReportRow(u, countsByUser[u.id], scoresByUser));
  }, [userListResponse?.users, countsByUser, scoresByUser]);

  const totalCount = userListResponse?.pagination?.totalCount ?? 0;
  const statusCounts = statusCountsResponse?.data ?? statusCountsResponse ?? { all: 0, active: 0, inactive: 0 };

  const dataFiltered = useMemo(() => {
    let rows = tableData;
    const { scoreMin, scoreMax, columnAtLeastOne } = currentFilters;
    if (scoreMin != null && Number.isFinite(scoreMin)) {
      rows = rows.filter((r: IAttendanceConductReportRow) => (r.score ?? 100) >= scoreMin);
    }
    if (scoreMax != null && Number.isFinite(scoreMax)) {
      rows = rows.filter((r: IAttendanceConductReportRow) => (r.score ?? 100) <= scoreMax);
    }
    if (columnAtLeastOne?.length) {
      rows = rows.filter((r: IAttendanceConductReportRow) =>
        columnAtLeastOne.every((col) => (r as unknown as Record<string, number>)[col] >= 1)
      );
    }
    return rows;
  }, [tableData, currentFilters]);

  const dataSorted = useMemo(() => {
    const { orderBy, order } = table;
    const key = orderBy ?? 'employee';
    const isNumeric = NUMERIC_SORT_COLUMN_IDS.has(key);
    return [...dataFiltered].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[key];
      const bVal = (b as Record<string, unknown>)[key];
      if (isNumeric) {
        const aNum = typeof aVal === 'number' ? aVal : Number(aVal);
        const bNum = typeof bVal === 'number' ? bVal : Number(bVal);
        const aFinite = Number.isFinite(aNum) ? aNum : -Infinity;
        const bFinite = Number.isFinite(bNum) ? bNum : -Infinity;
        return order === 'desc' ? bFinite - aFinite : aFinite - bFinite;
      }
      const aStr = String(aVal ?? '');
      const bStr = String(bVal ?? '');
      const cmp = aStr.localeCompare(bStr, undefined, { numeric: true });
      return order === 'desc' ? -cmp : cmp;
    });
  }, [dataFiltered, table]);

  const hasColumnFilters =
    currentFilters.scoreMin != null ||
    currentFilters.scoreMax != null ||
    (currentFilters.columnAtLeastOne?.length ?? 0) > 0;
  const canReset =
    !!currentFilters.query ||
    (currentFilters.employee?.length ?? 0) > 0 ||
    currentFilters.status !== 'all' ||
    hasColumnFilters;
  const notFound = !isLoading && dataFiltered.length === 0;

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue as IAttendanceConductReportTableFilters['status'] });
    },
    [updateFilters, table]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Attendance & Conduct Report"
        links={[
          { name: 'Management', href: paths.management.root },
          { name: 'Employee', href: paths.management.user.list },
          { name: 'Attendance & Conduct Report', href: paths.management.user.attendanceConductReport },
          { name: 'List' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.management.user.attendanceConductReportCreate}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Add Report
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Tabs
          value={currentFilters.status}
          onChange={handleFilterStatus}
          sx={[
            (theme) => ({
              px: 2.5,
              boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            }),
          ]}
        >
          {STATUS_OPTIONS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              icon={
                <Label
                  variant={(tab.value === currentFilters.status && 'filled') || 'soft'}
                  color={
                    (tab.value === 'active' && 'success') ||
                    (tab.value === 'inactive' && 'error') ||
                    'default'
                  }
                >
                  {statusCounts[tab.value as keyof typeof statusCounts] ?? 0}
                </Label>
              }
              iconPosition="end"
            />
          ))}
        </Tabs>

        <AttendanceConductReportTableToolbar
          filters={filters}
          onResetPage={table.onResetPage}
        />

        {canReset && (
          <AttendanceConductReportTableFiltersResult
            filters={filters}
            totalResults={totalCount}
            onResetPage={table.onResetPage}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        <Box sx={{ position: 'relative' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 1800 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headCells={TABLE_HEAD}
                rowCount={totalCount}
                onSort={table.onSort}
              />
              <TableBody>
                {isLoading
                  ? Array.from({ length: table.rowsPerPage }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell colSpan={TABLE_HEAD.length}>
                          <Skeleton variant="text" width="100%" height={24} />
                        </TableCell>
                      </TableRow>
                    ))
                  : dataSorted.map((row: IAttendanceConductReportRow) => (
                      <AttendanceConductReportTableRow key={row.id} row={row} />
                    ))}
                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={totalCount}
          rowsPerPage={table.rowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}
