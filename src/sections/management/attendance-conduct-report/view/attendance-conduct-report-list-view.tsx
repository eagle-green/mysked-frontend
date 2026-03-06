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
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { useSearchParams } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { AttendanceConductReportTableRow } from '../attendance-conduct-report-table-row';
import { AttendanceConductReportTableFiltersResult } from '../attendance-conduct-report-table-filters-result';
import { AttendanceConductReportTableToolbar } from '../attendance-conduct-report-table-toolbar';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'employee', label: 'Employee', width: 160 },
  { id: 'position', label: 'Position', width: 120 },
  { id: 'score', label: 'Score', width: 70, align: 'center', sortable: false },
  { id: 'noShowUnpaid', label: 'No Show (Unpaid)', width: 110, align: 'center', sortable: false },
  { id: 'sentHomeNoPpe', label: 'Sent home from site (no PPE)', width: 180, align: 'center', sortable: false },
  { id: 'leftEarlyNoNotice', label: 'Left Early No Notice', width: 140, align: 'center', sortable: false },
  { id: 'vacationDayUnpaid', label: 'Vacation Day (Unpaid)', width: 140, align: 'center', sortable: false },
  { id: 'sickLeaveUnpaid', label: 'Sick Leave (Unpaid)', width: 130, align: 'center', sortable: false },
  { id: 'personalDayOffUnpaid', label: 'Personal Day Off (Unpaid)', width: 170, align: 'center', sortable: false },
  { id: 'vacationDay10', label: 'Vacation Day (10)', width: 120, align: 'center', sortable: false },
  { id: 'refusalOfShifts', label: 'Refusal of shift', width: 120, align: 'center', sortable: false },
  { id: 'unauthorizedDriving', label: 'Unauthorized Driving', width: 140, align: 'center', sortable: false },
  { id: 'unapprovePayoutWithoutDayOff', label: 'Unapprove Payout without day Off', width: 200, align: 'center', sortable: false },
  { id: 'unapprovedDaysOffShortNotice', label: 'Unapproved Days Off / Short Notice', width: 220, align: 'center', sortable: false },
  { id: 'drivingInfractions', label: 'Driving Infractions', width: 120, align: 'center', sortable: false },
  { id: 'sickLeave5', label: 'Sick Leave (5)', width: 100, align: 'center', sortable: false },
  { id: 'verbalWarningsWriteUp', label: 'Verbal Warnings / Write Up', width: 160, align: 'center', sortable: false },
  { id: 'status', label: 'Status', width: 90 },
];

function mapUserToReportRow(user: any): IAttendanceConductReportRow {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.email || user.id;
  return {
    id: user.id,
    employee: name,
    photo_url: user.photo_url ?? null,
    position: user.role ?? '',
    score: 100, // default until score logic is implemented
    noShowUnpaid: 0,
    sentHomeNoPpe: 0,
    leftEarlyNoNotice: 0,
    vacationDayUnpaid: 0,
    sickLeaveUnpaid: 0,
    personalDayOffUnpaid: 0,
    vacationDay10: 0,
    refusalOfShifts: 0,
    unauthorizedDriving: 0,
    unapprovePayoutWithoutDayOff: 0,
    unapprovedDaysOffShortNotice: 0,
    drivingInfractions: 0,
    sickLeave5: 0,
    verbalWarningsWriteUp: 0,
    status: user.status ?? 'active',
  };
}

// ----------------------------------------------------------------------

export function AttendanceConductReportListView() {
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
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  useEffect(() => {
    table.onResetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilters.query, currentFilters.status, currentFilters.employee?.length]);

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
      const orderBy = orderByMap[table.orderBy] ?? table.orderBy ?? 'first_name';
      const params = new URLSearchParams({
        page: (table.page + 1).toString(),
        rowsPerPage: table.rowsPerPage.toString(),
        orderBy,
        order: table.order,
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
    return users.map(mapUserToReportRow);
  }, [userListResponse?.users]);

  const totalCount = userListResponse?.pagination?.totalCount ?? 0;
  const statusCounts = statusCountsResponse?.data ?? statusCountsResponse ?? { all: 0, active: 0, inactive: 0 };

  const dataFiltered = tableData;
  const canReset =
    !!currentFilters.query ||
    (currentFilters.employee?.length ?? 0) > 0 ||
    currentFilters.status !== 'all';
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
          { name: 'Attendance & Conduct Report' },
        ]}
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
                  : dataFiltered.map((row) => (
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
