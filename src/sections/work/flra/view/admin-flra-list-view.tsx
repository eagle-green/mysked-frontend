import type { IJobTableFilters } from 'src/types/job';
import type { TableHeadCellProps } from 'src/components/table';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSetState } from 'minimal-shared/hooks';

import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';

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

import { AdminFlraTableRow } from '../admin-flra-table-row';
import { AdminFlraTableToolbar } from '../admin-flra-table-toolbar';
import { AdminFlraTableFiltersResult } from '../admin-flra-table-filters-result';

// ----------------------------------------------------------------------

const FLRA_TAB_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'job_number', label: 'Job #', width: 100 },
  { id: 'client', label: 'Client', width: 200 },
  { id: 'site', label: 'Site', width: 200 },
  { id: 'job_date', label: 'Date', width: 120 },
  { id: 'status', label: 'Status', width: 120 },
  { id: 'submitted_by', label: 'Submitted By', width: 150 },
];

// ----------------------------------------------------------------------

export default function AdminFlraListView() {
  const table = useTable({
    defaultDense: true,
  });

  const filters = useSetState<IJobTableFilters>({
    query: '',
    region: [],
    status: 'all',
    client: [],
    company: [],
    site: [],
    startDate: null,
    endDate: null,
  });

  const [flraTab, setFlraTab] = useState('all');
  const { state: currentFilters, setState: updateFilters } = filters;

  // React Query for fetching FLRA list with pagination and filters
  const { data: flraResponse, isLoading } = useQuery({
    queryKey: [
      'admin-flra-list', 
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
      flraTab
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (table.page + 1).toString(),
        limit: table.rowsPerPage.toString(),
        orderBy: table.orderBy || 'created_at',
        order: table.order || 'desc',
      });

      // Add filter parameters
      if (currentFilters.query) params.append('search', currentFilters.query);
      if (currentFilters.status !== 'all') params.append('status', currentFilters.status);
      if (flraTab !== 'all') params.append('flraStatus', flraTab);
      if (currentFilters.client.length > 0) params.append('client', currentFilters.client.join(','));
      if (currentFilters.company.length > 0) params.append('company', currentFilters.company.join(','));
      if (currentFilters.site.length > 0) params.append('site', currentFilters.site.join(','));
      if (currentFilters.startDate) params.append('startDate', currentFilters.startDate.format('YYYY-MM-DD'));
      if (currentFilters.endDate) params.append('endDate', currentFilters.endDate.format('YYYY-MM-DD'));

      const response = await fetcher(`${endpoints.flra.list}/admin?${params}`);
      return response.data;
    },
  });

  const dataFiltered = flraResponse?.flra_forms || [];
  const totalCount = flraResponse?.total || 0;
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

  const handleChangeTab = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setFlraTab(newValue);
    table.onResetPage();
  }, [table]);

  const dateError = currentFilters.startDate && currentFilters.endDate && 
    currentFilters.startDate > currentFilters.endDate;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Field Level Risk Assessment"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Work Management', href: paths.work.root },
          { name: 'FLRA List' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Tabs
          value={flraTab}
          onChange={handleChangeTab}
          sx={{
            px: 2.5,
            boxShadow: (theme) => `inset 0 -2px 0 0 ${theme.palette.divider}`,
          }}
        >
          {FLRA_TAB_OPTIONS.map((tab) => (
            <Tab
              key={tab.value}
              iconPosition="end"
              value={tab.value}
              label={tab.label}
              icon={
                <Label
                  variant={
                    ((tab.value === 'all' || tab.value === flraTab) && 'filled') || 'soft'
                  }
                  color={
                    (tab.value === 'draft' && 'info') ||
                    (tab.value === 'submitted' && 'success') ||
                    (tab.value === 'approved' && 'success') ||
                    (tab.value === 'rejected' && 'error') ||
                    'default'
                  }
                >
                  {dataFiltered.filter((flra: any) => 
                    tab.value === 'all' ? true : flra.status === tab.value
                  ).length}
                </Label>
              }
            />
          ))}
        </Tabs>

        <AdminFlraTableToolbar
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
          <AdminFlraTableFiltersResult
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
                <AdminFlraTableRow
                  key={row.id}
                  row={row}
                  selected={false}
                  onSelectRow={() => {}}
                />
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
