import dayjs from 'dayjs';
import { useCallback, useMemo } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks/use-router';
import { RouterLink } from 'src/routes/components/router-link';
import { useSearchParams } from 'src/routes/hooks/use-search-params';

import { DashboardContent } from 'src/layouts/dashboard/content';

import { Label } from 'src/components/label/label';
import { emptyRows } from 'src/components/table/utils';
import { Iconify } from 'src/components/iconify/iconify';
import { useTable } from 'src/components/table/use-table';
import { Scrollbar } from 'src/components/scrollbar/scrollbar';
import { TableNoData } from 'src/components/table/table-no-data';
import { TableEmptyRows } from 'src/components/table/table-empty-rows';
import { TableSelectedAction } from 'src/components/table/table-selected-action';
import { TablePaginationCustom } from 'src/components/table/table-pagination-custom';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';
import { TableHeadCellProps, TableHeadCustom } from 'src/components/table/table-head-custom';

import { IClient } from 'src/types/client';

import { CompanyWideMemoTableRow } from '../memo-table-row';
import { CompanyWideMemoToolbar } from '../memo-table-toolbar';
import { CompanyWideMemoTableFiltersResult } from '../memo-table-filters-result';
//--------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'title', label: 'Memo Title' },
  { id: 'publishedBy', label: 'Published By' },
  { id: 'publishDate', label: 'Publish Date' },
  { id: 'status', label: 'Status' },
  { id: 'progress', label: 'Progress' },
  { id: '', width: 88 },
];

const MEMO_TEST_DATA = [
  {
    id: 'd66da964-5f11-48ac-98c9-45fa87c04aa7',
    memo_title: 'Implement Incident Report Features',
    published_date: new Date(),
    due_date: new Date(),
    published_by: {
      first_name: 'Kiwoon Jung',
      client_logo_url: null,
      client_name: null,
    },
    status: 'done',
    pendingItemDone: 5,
    pendingItemCounts: 5,
  },
  {
    id: 'd66da964-5f11-48ac-98c9-45fa87c04aa8',
    memo_title: 'Implement Company Wide Memo Features',
    published_date: new Date(),
    due_date: new Date(),
    published_by: {
      first_name: 'Jerwin Fortillano',
      client_logo_url: null,
      client_name: null,
    },
    status: 'in_progress',
    pendingItemDone: 2,
    pendingItemCounts: 5,
  },
];

export function CompanyWideMemoListView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const client: IClient[] = [];
  const table = useTable({
    defaultDense: true,
    defaultOrder: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
    defaultOrderBy: searchParams.get('orderBy') || 'created_at',
    defaultRowsPerPage: parseInt(searchParams.get('rowsPerPage') || '25', 10),
    defaultCurrentPage: parseInt(searchParams.get('page') || '1', 10) - 1,
  });

  const filters = useSetState({
    query: searchParams.get('search') || '',
    client: searchParams.get('type') ? searchParams.get('type')!.split(',') : [],
    status: searchParams.get('status') || 'all',
    startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : null,
    endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : null,
  });
  const { state: currentFilters } = filters;

  const { data: memoResponse } = useQuery({
    queryKey: [
      'memo-list',
      table.page,
      table.rowsPerPage,
      table.orderBy,
      table.order,
      currentFilters.query,
      currentFilters.status,
      currentFilters.client.join(','),
      currentFilters.startDate?.toISOString(),
      currentFilters.endDate?.toISOString(),
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (table.page + 1).toString(),
        rowsPerPage: table.rowsPerPage.toString(),
        orderBy: table.orderBy,
        order: table.order,
        ...(currentFilters.status !== 'all' && { status: currentFilters.status }),
        ...(currentFilters.query && { search: currentFilters.query }),
        ...(currentFilters.client.length > 0 && { type: currentFilters.client.join(',') }),
        ...(currentFilters.startDate && { start_date: currentFilters.startDate.toISOString() }),
        ...(currentFilters.endDate && { end_date: currentFilters.endDate.toISOString() }),
      });

      // const response = await fetcher(`/memo?${params.toString()}`);
      return { data: MEMO_TEST_DATA, pagination: { totalCount: 0 } };
    },
  });
  console.log(memoResponse);
  const tableData = useMemo(() => memoResponse?.data || [], [memoResponse]);
  const totalCount = memoResponse?.pagination?.totalCount || tableData.length;

  const dataFiltered = tableData;

  const dateError = !!(
    currentFilters.startDate &&
    currentFilters.endDate &&
    dayjs(currentFilters.startDate).isAfter(currentFilters.endDate)
  );

  const canReset =
    !!currentFilters.query ||
    currentFilters.client.length > 0 ||
    currentFilters.status !== 'all' ||
    currentFilters.startDate ||
    currentFilters.endDate;

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;
  const denseHeight = table.dense ? 52 : 72;

  // Fetch status counts for tabs
  const { data: statusCountsResponse } = useQuery({
    queryKey: [
      'comapny-wide-memo',
      currentFilters.query,
      currentFilters.client,
      currentFilters.startDate,
      currentFilters.endDate,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(currentFilters.query && { search: currentFilters.query }),
        ...(currentFilters.client.length > 0 && { client: currentFilters.client.join(',') }),
        ...(currentFilters.startDate && { start_date: currentFilters.startDate.toISOString() }),
        ...(currentFilters.endDate && { end_date: currentFilters.endDate.toISOString() }),
      });

      //   const response = await fetcher(`/memo?${params.toString()}`);
      return {
        all: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      };
    },
  });

  const statusCounts = statusCountsResponse || {
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  };

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      filters.setState({ status: newValue });
      table.onResetPage();
    },
    [filters, table]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Company Wide Memo List"
        links={[
          { name: 'Management', href: paths.management.root },
          { name: 'Company Wide Memo List' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.management.memo.create}
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
          >
            Publish Memo
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
              iconPosition="end"
              value={tab.value}
              label={tab.label}
              icon={
                <Label
                  variant={
                    ((tab.value === 'all' || tab.value === currentFilters.status) && 'filled') ||
                    'soft'
                  }
                  color={
                    (tab.value === 'pending' && 'warning') ||
                    (tab.value === 'done' && 'success') ||
                    (tab.value === 'in_progress' && 'info') ||
                    'default'
                  }
                >
                  {statusCounts[tab.value as keyof typeof statusCounts] || 0}
                </Label>
              }
            />
          ))}
        </Tabs>

        <CompanyWideMemoToolbar
          filters={filters}
          onResetPage={table.onResetPage}
          options={{ client: client }}
          dateError={!!dateError}
        />

        {canReset && (
          <CompanyWideMemoTableFiltersResult
            filters={filters}
            totalResults={totalCount}
            onResetPage={table.onResetPage}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        {/* Desktop Table Container */}
        <Box sx={{ position: 'relative', display: { xs: 'none', md: 'block' } }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headCells={TABLE_HEAD}
                rowCount={totalCount}
                numSelected={table.selected.length}
                onSort={table.onSort}
              />

              <TableBody>
                {dataFiltered.map((row: any) => (
                  <CompanyWideMemoTableRow
                    key={row.id}
                    row={row}
                    selected={table.selected.includes(row.id)}
                    onSelectRow={() => table.onSelectRow(row.id)}
                    onView={() => {}}
                    onDelete={() => {}}
                  />
                ))}

                <TableEmptyRows
                  height={denseHeight}
                  emptyRows={emptyRows(0, table.rowsPerPage, tableData.length)}
                />

                <TableNoData notFound={!!notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

        <TablePaginationCustom
          count={totalCount}
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
