import type { IJobTableFilters } from 'src/types/job';
import type { TableHeadCellProps } from 'src/components/table';

import { useState, useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { fIsAfter } from 'src/utils/format-time';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { FlraTableRow } from '../table/flra-table-row';
import { FlraTableToolbar } from '../table/flra-table-toolbar';
import { FlraTableFiltersResult } from '../table/flra-table-filter-result';

// ----------------------------------------------------------------------

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'job_number', label: 'Job #', width: 100 },
  { id: 'client', label: 'Client', width: 200 },
  { id: 'site', label: 'Site', width: 200 },
  { id: 'job_date', label: 'Date', width: 120 },
  { id: 'status', label: 'Status', width: 120 },
  { id: 'submitted_by', label: 'Submitted By', width: 150 },
];

const FLRA_TAB_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
];

// ----------------------------------------------------------------------

export default function FlraListView() {
  const table = useTable();

  // React Query for fetching FLRA forms list
  const {
    data: flraData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['flra-forms-list'],
    queryFn: async () => {
      const response = await fetcher(endpoints.flra.list);
      return response.data.flra_forms;
    },
  });

  const filters = useSetState<IJobTableFilters>({
    query: '',
    status: 'all',
    region: [],
    client: [],
    company: [],
    site: [],
    startDate: null,
    endDate: null,
  });

  const [flraTab, setFlraTab] = useState('all');

  const { state: currentFilters, setState: updateFilters } = filters;
  const dateError = fIsAfter(currentFilters.startDate, currentFilters.endDate);
  const flraFormsList = flraData || [];

  const dataFiltered = applyFlraFilter({
    inputData: flraFormsList || [],
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
    flraTab,
  });

  const canReset = !!(
    currentFilters.query ||
    currentFilters.client.length > 0 ||
    currentFilters.company.length > 0 ||
    currentFilters.site.length > 0 ||
    currentFilters.startDate ||
    currentFilters.endDate
  );

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;


  const handleResetFilters = useCallback(() => {
    updateFilters({
      query: '',
      status: 'all',
      region: [],
      client: [],
      company: [],
      site: [],
      startDate: null,
      endDate: null,
    });
  }, [updateFilters]);


  const handleFlraTabChange = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      setFlraTab(newValue);
      table.onResetPage();
    },
    [table]
  );

  if (isLoading) {
    return (
      <DashboardContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Typography>Loading...</Typography>
        </Box>
      </DashboardContent>
    );
  }

  if (error) {
    return (
      <DashboardContent>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="error" gutterBottom>
            Error loading jobs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error.message}
          </Typography>
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Field Level Risk Assessment"
        links={[
          { name: 'My Schedule', href: paths.schedule.root },
          { name: 'Field Level Risk Assessment' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Tabs
          value={flraTab}
          onChange={handleFlraTabChange}
          sx={[
            (theme) => ({
              px: 2.5,
              boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            }),
          ]}
        >
          {FLRA_TAB_OPTIONS.map((tab) => (
            <Tab
              key={tab.value}
              iconPosition="end"
              value={tab.value}
              label={tab.label}
              icon={
                <Label
                  variant={((tab.value === 'all' || tab.value === flraTab) && 'filled') || 'soft'}
                  color={
                    (tab.value === 'draft' && 'info') ||
                    (tab.value === 'submitted' && 'success') ||
                    'default'
                  }
                >
                  {
                    flraFormsList.filter((form: any) =>
                      tab.value === 'all' ? true : form.status === tab.value
                    ).length
                  }
                </Label>
              }
            />
          ))}
        </Tabs>

        <FlraTableToolbar
          filters={filters}
          dateError={dateError}
          onResetPage={table.onResetPage}
        />

        {canReset && (
          <FlraTableFiltersResult
            filters={filters}
            onResetFilters={handleResetFilters}
            totalResults={dataFiltered.length}
            onResetPage={table.onResetPage}
            onFilters={() => {}}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        <Table>
          <TableHeadCustom
            order={table.order}
            orderBy={table.orderBy}
            headCells={TABLE_HEAD || []}
            rowCount={dataFiltered.length}
            numSelected={0}
            onSort={table.onSort}
          />

          <TableBody>
            {dataFiltered
              .slice(
                table.page * table.rowsPerPage,
                table.page * table.rowsPerPage + table.rowsPerPage
              )
              .map((row) => (
                <FlraTableRow
                  key={row.id}
                  row={row}
                  selected={false}
                  onSelectRow={() => {}}
                />
              ))}

            <TableEmptyRows
              height={56}
              emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
            />

            {notFound && <TableNoData notFound={notFound} />}
          </TableBody>
        </Table>

        <TablePaginationCustom
          count={dataFiltered.length}
          page={table.page}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function applyFlraFilter({
  inputData,
  comparator,
  filters,
  flraTab,
}: {
  inputData: any[];
  comparator: (a: any, b: any) => number;
  filters: IJobTableFilters;
  flraTab: string;
}) {
  const { query, status, region, client, company, site, startDate, endDate } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (query) {
    inputData = inputData.filter(
      (form) =>
        form.job?.job_number?.toString().toLowerCase().indexOf(query.toLowerCase()) !== -1 ||
        form.client?.name?.toLowerCase().indexOf(query.toLowerCase()) !== -1 ||
        form.site?.name?.toLowerCase().indexOf(query.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((form) => form.job?.status === status);
  }

  if (region.length > 0) {
    inputData = inputData.filter((form) => region.includes(form.site?.region));
  }

  if (client.length > 0) {
    inputData = inputData.filter((form) => client.includes(form.client?.name));
  }

  if (company.length > 0) {
    inputData = inputData.filter((form) => company.includes(form.company?.name));
  }

  if (site.length > 0) {
    inputData = inputData.filter((form) => site.includes(form.site?.name));
  }

  if (startDate && endDate) {
    inputData = inputData.filter((form) => {
      const formDate = new Date(form.created_at);
      return formDate >= startDate.toDate() && formDate <= endDate.toDate();
    });
  }

  // Filter by FLRA status tab
  if (flraTab !== 'all') {
    inputData = inputData.filter((form) => form.status === flraTab);
  }

  return inputData;
}
