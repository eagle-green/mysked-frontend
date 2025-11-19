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
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import { useSearchParams } from 'src/routes/hooks/use-search-params';

import { fetcher } from 'src/lib/axios';
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

import { IncidentReportTableRow } from '../incident-report-table-row';
import { IncidentReportTableToolbar } from '../incident-report-table-toolbar';
import { IncidentReportTableFilterResult } from '../incident-report-table-filter-result';

//----------------------------------------------------------------------------------------------------------

export const INCIDENT_REPORT_TYPES: { value: string; label: string }[] = [
  { label: 'Traffic Accident', value: 'traffic accident' },
  { label: 'Equipment Malfunction', value: 'equipment malfunction' },
  { label: 'Safety Violation', value: 'safety violation' },
  { label: 'Unauthorized Access', value: 'unauthorized access' },
  { label: 'Construction Site Disruption', value: 'construction site disruption' },
  { label: 'Weather/Environmental Incident', value: 'wetaher incident' },
  { label: 'Personnel Injury/Accident', value: 'personnel accident' },
  { label: 'Traffic Signal Failure', value: 'traffic signal failure' },
  { label: 'Road Blockage/Obstruction', value: 'road obstruction' },
  { label: 'Work Zone Inadequacy', value: 'work zone inadequacy' },
  { label: 'Public Interaction or Dispute', value: 'public interaction' },
  { label: 'Other', value: 'others' },
];

const TEST_DATA = {
  pagination: {},
  data: [
    {
      id: 1,
      jobNumber: '25-10232',
      incidentType: 'Traffic Accident',
      incidentDate: new Date(),
      reportDescription: 'Sample report description',
      reportDate: new Date(),
      reportedBy: 'Jerwin Fortillano',
      incidentSeverity: 'minor',
    },
  ],
};

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'jobNumber', label: 'Job #' },
  { id: 'incidentType', label: 'Incident Type' },
  { id: 'incidentDate', label: 'Incident Date' },
  { id: 'reportDescription', label: 'Description' },
  { id: 'reportDate', label: 'Report Date' },
  { id: 'reportedBy', label: 'Reported By' },
  { id: 'incidentSeverity', label: 'Incident Severity' },
];

const SEVERITY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'minor', label: 'Minor' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
];

export function IncidentReportListView() {
  const searchParams = useSearchParams();

  const table = useTable({
    defaultDense: true,
    defaultOrder: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
    defaultOrderBy: searchParams.get('orderBy') || 'created_at',
    defaultRowsPerPage: parseInt(searchParams.get('rowsPerPage') || '25', 10),
    defaultCurrentPage: parseInt(searchParams.get('page') || '1', 10) - 1,
  });

  const filters = useSetState({
    query: searchParams.get('search') || '',
    type: searchParams.get('type') ? searchParams.get('type')!.split(',') : [],
    status: searchParams.get('status') || 'all',
    startDate: searchParams.get('startDate') ? dayjs(searchParams.get('startDate')!) : null,
    endDate: searchParams.get('endDate') ? dayjs(searchParams.get('endDate')!) : null,
  });
  const { state: currentFilters } = filters;

  const { data: incidentReportList } = useQuery({
    queryKey: [
      'all-incident-report-requests',
      table.page,
      table.rowsPerPage,
      table.orderBy,
      table.order,
      currentFilters.query,
      currentFilters.status,
      currentFilters.type.join(','),
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
        ...(currentFilters.type.length > 0 && { type: currentFilters.type.join(',') }),
        ...(currentFilters.startDate && { start_date: currentFilters.startDate.toISOString() }),
        ...(currentFilters.endDate && { end_date: currentFilters.endDate.toISOString() }),
      });

      // const response = await fetcher(`/api/endpoint${params.toString()}`);
      // return response.data;
      return TEST_DATA as any;
    },
  });

  // Fetch status counts for tabs
  const { data: severityResponse } = useQuery({
    queryKey: [
      'incident-report-severity-counts',
      currentFilters.query,
      currentFilters.type,
      currentFilters.startDate,
      currentFilters.endDate,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(currentFilters.query && { search: currentFilters.query }),
        ...(currentFilters.type.length > 0 && { type: currentFilters.type.join(',') }),
        ...(currentFilters.startDate && { start_date: currentFilters.startDate.toISOString() }),
        ...(currentFilters.endDate && { end_date: currentFilters.endDate.toISOString() }),
      });

      // const response = await fetcher(`/api/incident-report/admin/counts/severity?${params.toString()}`);
      return { all: 0, minor: 1, moderate: 0, severe: 0 };
    },
  });

  const tableData = useMemo(() => incidentReportList?.data || [], [incidentReportList]);
  const totalCount = incidentReportList?.pagination?.totalCount || 0;
  const statusCounts = severityResponse || { all: 0, minor: 0, moderate: 0, severe: 0 };

  // Server-side pagination means no client-side filtering needed
  const dataFiltered = tableData;

  const dateError = !!(
    currentFilters.startDate &&
    currentFilters.endDate &&
    dayjs(currentFilters.startDate).isAfter(currentFilters.endDate)
  );

  const canReset = !!(
    currentFilters.query ||
    currentFilters.type.length > 0 ||
    currentFilters.status !== 'all' ||
    currentFilters.startDate ||
    currentFilters.endDate
  );

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      filters.setState({ status: newValue });
      table.onResetPage();
    },
    [filters, table]
  );

  const handleView = useCallback((data: any) => data, []);
  const handleDelete = useCallback((data: any) => data, []);

  const denseHeight = table.dense ? 52 : 72;

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Incident Report List"
          links={[{ name: 'My Schedule' }, { name: 'Incident Report' }, { name: 'List' }]}
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
            {SEVERITY_OPTIONS.map((tab) => (
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
                      (tab.value === 'moderate' && 'warning') ||
                      (tab.value === 'minor' && 'info') ||
                      (tab.value === 'severe' && 'error') ||
                      'default'
                    }
                  >
                    {statusCounts[tab.value as keyof typeof statusCounts] || 0}
                  </Label>
                }
              />
            ))}
          </Tabs>

          {/* Toolbar */}
          <IncidentReportTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            options={{ types: INCIDENT_REPORT_TYPES }}
            dateError={dateError}
          />

          {/* Filter Results */}
          {canReset && (
            <IncidentReportTableFilterResult
              filters={filters}
              totalResults={totalCount}
              onResetPage={table.onResetPage}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered.length}
              onSelectAllRows={(checked) => {
                // Only select/deselect rows with rejected status
                const selectableRowIds = dataFiltered.map((row: any) => row.id);

                if (checked) {
                  // Select all rejected rows
                  table.onSelectAllRows(true, selectableRowIds);
                } else {
                  // Deselect all rows
                  table.onSelectAllRows(false, []);
                }
              }}
              action={
                <Tooltip title="Delete">
                  <IconButton
                    color="primary"
                    onClick={() => {
                      if (table.selected.length > 0) {
                        // deleteRowsDialog.onTrue();
                      }
                    }}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Tooltip>
              }
            />

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headCells={TABLE_HEAD}
                  rowCount={totalCount}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) => {
                    // Only select/deselect rows with rejected status
                    const selectableRowIds = dataFiltered.map((row: any) => row.id);

                    if (checked) {
                      // Select all rejected rows
                      table.onSelectAllRows(true, selectableRowIds);
                    } else {
                      // Deselect all rows
                      table.onSelectAllRows(false, []);
                    }
                  }}
                />

                <TableBody>
                  {dataFiltered.map((row: any) => (
                    <IncidentReportTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(row.id)}
                      onSelectRow={() => table.onSelectRow(row.id)}
                      onView={handleView}
                      onDelete={handleDelete}
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
    </>
  );
}
