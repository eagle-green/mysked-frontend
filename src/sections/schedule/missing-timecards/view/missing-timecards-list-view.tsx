import type { TableHeadCellProps } from 'src/components/table';

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
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  rowInPage,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { MissingTimecardsTableRow } from '../missing-timecards-table-row';
import { MissingTimecardsTableToolbar } from '../missing-timecards-table-toolbar';
import { MissingTimecardsTableFiltersResult } from '../missing-timecards-table-filters-result';

// ----------------------------------------------------------------------

export interface MissingTimecard {
  job_id: string;
  job_number: number;
  timeslip_number: string;
  timesheet_id: string | null;
  timesheet_status: string | null;
  timesheet_manager_id: string;
  timesheet_manager_name: string;
  timesheet_manager_email: string;
  timesheet_manager_photo_url: string | null;
  client_id: string | null;
  client_name: string | null;
  client_logo_url: string | null;
  site_id: string;
  site_name: string;
  site_address: string;
  company_id: string | null;
  company_name: string | null;
  company_logo_url: string | null;
  shift_date: string;
  shift_start_time: string;
  shift_end_time: string;
  expected_timesheet_date: string;
  missing_field_team_members: Array<{
    worker_id: string;
    worker_name: string;
    worker_email: string | null;
    worker_photo_url: string | null;
    position: string;
    start_time: string | null;
    end_time: string | null;
    job_worker_id: string;
  }>;
}

export interface MissingTimecardsFilters {
  query: string;
  client: Array<{ id: string; name: string }>;
  timesheet_manager: Array<{ id: string; name: string }>;
  status: string;
  startDate: dayjs.Dayjs | null;
  endDate: dayjs.Dayjs | null;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'overdue', label: 'Overdue' },
];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'job_number', label: 'Job #' },
  { id: 'site_name', label: 'Site' },
  { id: 'client_name', label: 'Client' },
  { id: 'company_name', label: 'Customer' },
  { id: 'shift_date', label: 'Date' },
  { id: 'timesheet_manager_name', label: 'Timesheet Manager' },
  { id: 'missing_workers', label: 'Missing Workers' },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export default function MissingTimecardsListView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize date range to current week (Monday to Sunday)
  const now = dayjs();
  // Get Monday of current week (dayjs weeks start on Sunday by default, so we need to adjust)
  const weekStart = now.day() === 0 ? now.subtract(6, 'day').startOf('day') : now.startOf('week').add(1, 'day');
  // Get Sunday of current week
  const weekEnd = weekStart.add(6, 'day').endOf('day');

  const table = useTable({
    defaultDense: true,
    defaultOrder: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
    defaultOrderBy: searchParams.get('orderBy') || 'shift_date',
    defaultRowsPerPage: parseInt(searchParams.get('rowsPerPage') || '25', 10),
    defaultCurrentPage: parseInt(searchParams.get('page') || '1', 10) - 1,
  });

  const filters = useSetState<MissingTimecardsFilters>({
    query: searchParams.get('search') || '',
    status: searchParams.get('status') || 'all',
    client: searchParams.get('client')
      ? searchParams.get('client')!.split(',').map((id) => ({ id, name: '' }))
      : [],
    timesheet_manager: searchParams.get('timesheet_manager')
      ? searchParams.get('timesheet_manager')!.split(',').map((id) => ({ id, name: '' }))
      : [],
    startDate: searchParams.get('startDate')
      ? dayjs(searchParams.get('startDate')!)
      : weekStart,
    endDate: searchParams.get('endDate') ? dayjs(searchParams.get('endDate')!) : weekEnd,
  });

  const { state: currentFilters, setState: updateFilters } = filters;

  // React Query for fetching missing timecards
  const { data: missingTimecardsResponse, isLoading } = useQuery({
    queryKey: ['missing-timecards', currentFilters],
    queryFn: async () => {
      const params = new URLSearchParams({
        include_field_team: 'true',
      });

      // Only add date params if they exist
      if (currentFilters.startDate) {
        params.set('startDate', currentFilters.startDate.format('YYYY-MM-DD'));
      }
      if (currentFilters.endDate) {
        params.set('endDate', currentFilters.endDate.format('YYYY-MM-DD'));
      }

      // Don't send status filter to backend - we handle 'all' and 'overdue' client-side
      // Backend only understands 'draft' and 'not_submitted' which we removed from tabs

      if (currentFilters.client.length > 0) {
        params.set('client_id', currentFilters.client.map((c) => c.id).join(','));
      }

      if (currentFilters.timesheet_manager.length > 0) {
        params.set(
          'timesheet_manager_id',
          currentFilters.timesheet_manager.map((m) => m.id).join(',')
        );
      }

      const response = await fetcher(`${endpoints.work.missingTimecards}?${params.toString()}`);
      return response;
    },
  });

  // Fetch summary statistics
  const { data: summaryResponse } = useQuery({
    queryKey: ['missing-timecards-summary', currentFilters.startDate, currentFilters.endDate],
    queryFn: async () => {
      const params = new URLSearchParams();

      // Only add date params if they exist
      if (currentFilters.startDate) {
        params.set('startDate', currentFilters.startDate.format('YYYY-MM-DD'));
      }
      if (currentFilters.endDate) {
        params.set('endDate', currentFilters.endDate.format('YYYY-MM-DD'));
      }

      const response = await fetcher(
        `${endpoints.work.missingTimecards}/summary?${params.toString()}`
      );
      return response.data;
    },
  });

  const missingTimecards: MissingTimecard[] = useMemo(
    () => missingTimecardsResponse?.data || [],
    [missingTimecardsResponse?.data]
  );

  // Update URL when filters or table state changes
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();

    params.set('page', (table.page + 1).toString());
    params.set('rowsPerPage', table.rowsPerPage.toString());
    params.set('orderBy', table.orderBy);
    params.set('order', table.order);

    if (currentFilters.query) params.set('search', currentFilters.query);
    if (currentFilters.status !== 'all') params.set('status', currentFilters.status);
    if (currentFilters.client.length > 0)
      params.set('client', currentFilters.client.map((c) => c.id).join(','));
    if (currentFilters.timesheet_manager.length > 0)
      params.set(
        'timesheet_manager',
        currentFilters.timesheet_manager.map((m) => m.id).join(',')
      );
    if (currentFilters.startDate)
      params.set('startDate', currentFilters.startDate.format('YYYY-MM-DD'));
    if (currentFilters.endDate)
      params.set('endDate', currentFilters.endDate.format('YYYY-MM-DD'));

    const url = `?${params.toString()}`;
    router.replace(`${window.location.pathname}${url}`);
  }, [
    table.page,
    table.rowsPerPage,
    table.orderBy,
    table.order,
    currentFilters,
    router,
  ]);

  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // Reset page when filters change
  useEffect(() => {
    table.onResetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentFilters.query,
    currentFilters.status,
    currentFilters.client,
    currentFilters.timesheet_manager,
    currentFilters.startDate,
    currentFilters.endDate,
  ]);

  // Client-side filtering for search query and status
  const dataFiltered = useMemo(() => {
    let filtered = missingTimecards;
    const today = dayjs().format('YYYY-MM-DD');

    // Apply status filter
    if (currentFilters.status === 'overdue') {
      filtered = filtered.filter((tc) => tc.shift_date < today);
    }

    // Apply search query filter
    if (currentFilters.query) {
      const query = currentFilters.query.toLowerCase();
      filtered = filtered.filter((tc) => {
        // Check job number, timesheet manager, client, site
        const matchesBasicFields =
          tc.job_number.toString().includes(query) ||
          tc.timesheet_manager_name.toLowerCase().includes(query) ||
          tc.client_name?.toLowerCase().includes(query) ||
          tc.site_name.toLowerCase().includes(query);

        // Check worker names in missing_field_team_members
        const matchesWorkerName =
          tc.missing_field_team_members?.some((worker) =>
            worker.worker_name?.toLowerCase().includes(query)
          ) || false;

        return matchesBasicFields || matchesWorkerName;
      });
    }

    // Apply sorting
    const comparator = getComparator(table.order, table.orderBy);
    const sorted = [...filtered].sort(comparator as unknown as (a: MissingTimecard, b: MissingTimecard) => number);

    return sorted;
  }, [missingTimecards, currentFilters.query, currentFilters.status, table.order, table.orderBy]);

  // Apply pagination
  const dataInPage = useMemo(
    () => rowInPage(dataFiltered, table.page, table.rowsPerPage),
    [dataFiltered, table.page, table.rowsPerPage]
  );

  const canReset = !!(
    currentFilters.query ||
    currentFilters.client.length > 0 ||
    currentFilters.timesheet_manager.length > 0 ||
    currentFilters.status !== 'all' ||
    (currentFilters.startDate && !currentFilters.startDate.isSame(weekStart, 'day')) ||
    (currentFilters.endDate && !currentFilters.endDate.isSame(weekEnd, 'day'))
  );

  const notFound = (!dataFiltered.length && canReset) || (!dataFiltered.length && !isLoading);

  const handleFilters = useCallback(
    (name: string, value: any) => {
      table.onResetPage();
      updateFilters({ [name]: value });
    },
    [table, updateFilters]
  );

  const handleResetFilters = useCallback(() => {
    updateFilters({
      query: '',
      status: 'all',
      client: [],
      timesheet_manager: [],
      startDate: weekStart,
      endDate: weekEnd,
    });
  }, [updateFilters, weekStart, weekEnd]);

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Missing Timesheets"
        links={[
          { name: 'Work Management' },
          { name: 'Job', href: paths.work.job.list },
          { name: 'Timesheet', href: paths.work.job.timesheet.list },
          { name: 'Missing Timesheets' },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
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
          {STATUS_OPTIONS.map((tab) => {
            // Calculate count for each status
            const today = dayjs().format('YYYY-MM-DD');
            let count = 0;
            if (tab.value === 'all') {
              count = missingTimecards.length;
            } else if (tab.value === 'overdue') {
              count = missingTimecards.filter((tc) => tc.shift_date < today).length;
            }

            return (
              <Tab
                key={tab.value}
                iconPosition="end"
                value={tab.value}
                label={tab.label}
                icon={
                  <Label
                    variant={((tab.value === 'all' || tab.value === currentFilters.status) && 'filled') || 'soft'}
                    color={
                      (tab.value === 'overdue' && 'error') ||
                      'default'
                    }
                  >
                    {count}
                  </Label>
                }
              />
            );
          })}
        </Tabs>

        <MissingTimecardsTableToolbar
          filters={filters}
          onFilters={handleFilters}
          onResetFilters={handleResetFilters}
          onResetPage={table.onResetPage}
          summary={summaryResponse}
          dateError={
            !!(
              currentFilters.startDate &&
              currentFilters.endDate &&
              currentFilters.endDate < currentFilters.startDate
            )
          }
        />

        {canReset && (
          <MissingTimecardsTableFiltersResult
            filters={filters}
            onFilters={handleFilters}
            onResetFilters={handleResetFilters}
            onResetPage={table.onResetPage}
            totalResults={dataFiltered.length}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        <Box sx={{ position: 'relative' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headCells={TABLE_HEAD}
                rowCount={dataFiltered.length}
                onSort={table.onSort}
              />

              <TableBody>
                {dataInPage.map((row: MissingTimecard) => (
                  <MissingTimecardsTableRow key={row.job_id} row={row} />
                ))}

                <TableEmptyRows
                  height={52}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                />

                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

        <TablePaginationCustom
          count={dataFiltered.length}
          page={table.page}
          rowsPerPage={table.rowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          dense={table.dense}
          onChangeDense={table.onChangeDense}
        />
      </Card>
    </DashboardContent>
  );
}

