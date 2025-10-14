import type { IJobTableFilters } from 'src/types/job';
import type { TableHeadCellProps } from 'src/components/table';

import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { useSetState } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
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
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { AdminTmpTableRow } from '../admin-tmp-table-row';
import { AdminTmpTableToolbar } from '../admin-tmp-table-toolbar';
import { AdminTmpTableFiltersResult } from '../admin-tmp-table-filters-result';

// ----------------------------------------------------------------------

const TMP_TAB_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'job_number', label: 'Job #', width: 100 },
  { id: 'site', label: 'Site', width: 200 },
  { id: 'client', label: 'Client', width: 200 },
  { id: 'job_date', label: 'Date', width: 120 },
  { id: 'status', label: 'Status', width: 120 },
];

// ----------------------------------------------------------------------

export function AdminTmpListView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const table = useTable({
    defaultDense: (searchParams.get('dense') === 'true') || true,
    defaultOrder: (searchParams.get('order') as 'asc' | 'desc') || 'asc',
    defaultOrderBy: searchParams.get('orderBy') || 'start_time',
    defaultRowsPerPage: parseInt(searchParams.get('rowsPerPage') || '25', 10),
    defaultCurrentPage: parseInt(searchParams.get('page') || '1', 10) - 1,
  });

  const filters = useSetState<IJobTableFilters>({
    query: searchParams.get('search') || '',
    region: [],
    status: searchParams.get('status') || 'all',
    client: searchParams.get('client') ? searchParams.get('client')!.split(',') : [],
    company: searchParams.get('company') ? searchParams.get('company')!.split(',') : [],
    site: searchParams.get('site') ? searchParams.get('site')!.split(',') : [],
    startDate: searchParams.get('startDate') ? dayjs(searchParams.get('startDate')!) : null,
    endDate: searchParams.get('endDate') ? dayjs(searchParams.get('endDate')!) : null,
  });

  const [tmpTab, setTmpTab] = useState(searchParams.get('tmpTab') || 'all');
  const { state: currentFilters, setState: updateFilters } = filters;

  // Update URL when table or filter state changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', (table.page + 1).toString());
    params.set('rowsPerPage', table.rowsPerPage.toString());
    params.set('orderBy', table.orderBy || 'start_time');
    params.set('order', table.order || 'asc');
    params.set('dense', table.dense.toString());
    if (currentFilters.query) params.set('search', currentFilters.query);
    if (tmpTab !== 'all') params.set('tmpTab', tmpTab);
    
    router.replace(`${paths.work.tmp.list}?${params.toString()}`);
  }, [table.page, table.rowsPerPage, table.orderBy, table.order, table.dense, currentFilters.query, tmpTab, router]);

  // React Query for fetching FLRA list with pagination and filters
  const { data: tmpResponse, isLoading } = useQuery({
    queryKey: [
      'admin-tmp-list',
      table.page,
      table.rowsPerPage,
      table.orderBy,
      table.order,
      currentFilters.query,
      currentFilters.status,
      currentFilters.client,
      currentFilters.company,
      currentFilters.site,
      currentFilters.startDate,
      currentFilters.endDate,
      tmpTab,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (table.page + 1).toString(),
        limit: table.rowsPerPage.toString(),
        orderBy: table.orderBy || 'start_time',
        order: table.order || 'asc',
      });

      // Add filter parameters
      if (currentFilters.query) params.append('search', currentFilters.query);
      if (currentFilters.status !== 'all') params.append('status', currentFilters.status);
      if (tmpTab !== 'all') params.append('tmpStatus', tmpTab);
      if (currentFilters.client.length > 0)
        params.append('client', currentFilters.client.join(','));
      if (currentFilters.company.length > 0)
        params.append('company', currentFilters.company.join(','));
      if (currentFilters.site.length > 0) params.append('site', currentFilters.site.join(','));
      if (currentFilters.startDate)
        params.append('startDate', currentFilters.startDate.format('YYYY-MM-DD'));
      if (currentFilters.endDate)
        params.append('endDate', currentFilters.endDate.format('YYYY-MM-DD'));

      const response = await fetcher(`${endpoints.tmp.list}/admin?${params}`);
      return response.data;
    },
  });

  const tmpList = tmpResponse?.tmp_forms || [];
  const totalCount = tmpResponse?.total || 0;

  // Fetch counts for each tab (without filters)
  const { data: allCountData } = useQuery({
    queryKey: ['admin-tmp-count-all'],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '1' });
      const response = await fetcher(`${endpoints.tmp.list}/admin?${params}`);
      return response.data?.total || 0;
    },
  });

  const { data: confirmedCountData } = useQuery({
    queryKey: ['admin-tmp-count-confirmed'],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '1', tmpStatus: 'confirmed' });
      const response = await fetcher(`${endpoints.tmp.list}/admin?${params}`);
      return response.data?.total || 0;
    },
  });

  const { data: pendingCountData } = useQuery({
    queryKey: ['admin-tmp-count-pending'],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '1', tmpStatus: 'pending' });
      const response = await fetcher(`${endpoints.tmp.list}/admin?${params}`);
      return response.data?.total || 0;
    },
  });

  const tabCounts = {
    all: allCountData || 0,
    confirmed: confirmedCountData || 0,
    pending: pendingCountData || 0,
  };

  const dataFiltered = tmpList;
  const notFound = !dataFiltered.length && !isLoading;

  const handleResetFilters = useCallback(() => {
    updateFilters({
      query: '',
      region: [],
      status: 'all',
      client: [],
      company: [],
      site: [],
      startDate: null,
      endDate: null,
    });
  }, [updateFilters]);

  const handleChangeTab = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      setTmpTab(newValue);
      table.onResetPage();
    },
    [table]
  );

  const dateError =
    currentFilters.startDate &&
    currentFilters.endDate &&
    currentFilters.startDate > currentFilters.endDate;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Traffic Management Plan"
        links={[{ name: 'Work Management' }, { name: 'TMP' }, { name: 'List' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Tabs
          value={tmpTab}
          onChange={handleChangeTab}
          sx={{
            px: 2.5,
            boxShadow: (theme) => `inset 0 -2px 0 0 ${theme.palette.divider}`,
          }}
        >
          {TMP_TAB_OPTIONS.map((tab) => (
            <Tab
              key={tab.value}
              iconPosition="end"
              value={tab.value}
              label={tab.label}
              icon={
                <Label
                  variant={((tab.value === 'all' || tab.value === tmpTab) && 'filled') || 'soft'}
                  color={
                    (tab.value === 'confirmed' && 'success') ||
                    (tab.value === 'pending' && 'warning') ||
                    'default'
                  }
                >
                  {tabCounts[tab.value as keyof typeof tabCounts]}
                </Label>
              }
            />
          ))}
        </Tabs>

        <AdminTmpTableToolbar
          filters={filters}
          dateError={!!dateError}
          onResetPage={table.onResetPage}
        />

        {!!currentFilters.query ||
        currentFilters.status !== 'all' ||
        currentFilters.client.length > 0 ||
        currentFilters.company.length > 0 ||
        currentFilters.site.length > 0 ||
        currentFilters.startDate ||
        currentFilters.endDate ? (
          <AdminTmpTableFiltersResult
            filters={filters}
            onResetFilters={handleResetFilters}
            totalResults={dataFiltered.length}
            sx={{ p: 2.5, pt: 0 }}
          />
        ) : null}

        <Scrollbar>
          <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
            <TableHeadCustom
              order={table.order}
              orderBy={table.orderBy}
              headCells={TABLE_HEAD}
              rowCount={dataFiltered.length}
              numSelected={0}
              onSort={table.onSort}
            />

            <TableBody>
              {dataFiltered.map((row: any) => (
                <AdminTmpTableRow key={row.id} row={row} selected={false} onSelectRow={() => {}} />
              ))}

              <TableEmptyRows
                height={table.dense ? 56 : 56 + 20}
                emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
              />

              <TableNoData notFound={notFound} />
            </TableBody>
          </Table>
        </Scrollbar>

        <TablePaginationCustom
          page={table.page}
          count={totalCount}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          dense={table.dense}
          onChangeDense={table.onChangeDense}
        />
      </Card>
    </DashboardContent>
  );
}
