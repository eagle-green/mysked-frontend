import type { TableHeadCellProps} from 'src/components/table/table-head-custom';

import dayjs from 'dayjs';
import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';

import { useRouter, useSearchParams } from 'src/routes/hooks';

import { fetcher } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard/content';

import { Label } from 'src/components/label/label';
import { emptyRows } from 'src/components/table/utils';
import { useTable } from 'src/components/table/use-table';
import { Scrollbar } from 'src/components/scrollbar/scrollbar';
import { TableNoData } from 'src/components/table/table-no-data';
import { TableEmptyRows } from 'src/components/table/table-empty-rows';
import { TableHeadCustom } from 'src/components/table/table-head-custom';
import { TablePaginationCustom } from 'src/components/table/table-pagination-custom';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { AdminIncidentReportTableRow } from '../admin-incident-report-row';
import { AdminIncidentReportTableToolbar } from '../admin-incident-report-toolbar';
import { AdminIncidentReportTableFilterResult } from '../admin-incident-report-table-filter';

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

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'id', label: 'ID' },
  { id: 'jobNumber', label: 'Job #' },
  { id: 'jobDate', label: 'Job Date' },
  { id: 'incidentType', label: 'Incident Type' },
  { id: 'incidentSeverity', label: 'Severity' },
  { id: 'customer', label: 'Customer' },
  { id: 'site', label: 'Site' },
  { id: 'client', label: 'Client' },
  { id: 'incidentTime', label: 'Incident Time' },
  { id: 'reportedBy', label: 'Reported By' },
  { id: 'status', label: 'Status' },
  { id: '', width: 88 },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_review', label: 'In Review' },
  { value: 'resolved', label: 'Resolved' },
];
export function AdminIncidentReportListView() {
  const router = useRouter();
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

  // Update URL when table state or filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams();

      // Always include page (convert from 0-based to 1-based)
      params.set('page', String(table.page + 1));

      // Always include rowsPerPage
      params.set('rowsPerPage', String(table.rowsPerPage));

      // Always include orderBy and order
      params.set('orderBy', table.orderBy);
      params.set('order', table.order);

      // Include filters only if they have values
      const trimmedQuery = (currentFilters.query || '').trim();
      if (trimmedQuery) params.set('search', trimmedQuery);
      if (currentFilters.status !== 'all') params.set('status', currentFilters.status);
      if (currentFilters.type.length > 0) params.set('type', currentFilters.type.join(','));
      if (currentFilters.startDate) params.set('startDate', currentFilters.startDate.toISOString());
      if (currentFilters.endDate) params.set('endDate', currentFilters.endDate.toISOString());

      const newURL = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      router.replace(newURL);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [
    router,
    table.page,
    table.rowsPerPage,
    table.orderBy,
    table.order,
    currentFilters.query,
    currentFilters.status,
    currentFilters.type,
    currentFilters.startDate,
    currentFilters.endDate,
  ]);

  // Reset page when filters change (but not when page itself changes)
  useEffect(() => {
    table.onResetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilters.query, currentFilters.status, currentFilters.type, currentFilters.startDate, currentFilters.endDate]);

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

      const response = await fetcher(`/api/incident-report/admin?${params.toString()}`);
      
      // Debug: Log response structure
      console.log('Admin incident report list response:', response);
      console.log('Response data:', response?.data);
      console.log('Response pagination:', response?.pagination);
      
      // The fetcher already returns res.data, so response is { success: true, data: [...], pagination: {...} }
      // Return the full response object so we can access .data and .pagination
      return response;
    },
  });

  // Fetch status counts for tabs
  const { data: status } = useQuery({
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

      const response = await fetcher(`/api/incident-report/admin/counts/status?${params.toString()}`);
      return response.data || { all: 0, pending: 0, in_review: 0, resolved: 0 };
    },
  });

  const tableData = useMemo(() => {
    // The response structure is { success: true, data: [...], pagination: {...} }
    // Since fetcher returns res.data, incidentReportList is already the data object
    const data = incidentReportList?.data || [];
    console.log('Admin table data:', data);
    console.log('Admin incident report list:', incidentReportList);
    console.log('Admin total count:', incidentReportList?.pagination?.totalCount);
    return data;
  }, [incidentReportList]);
  const totalCount = incidentReportList?.pagination?.totalCount || 0;
  const statusCounts = status || { all: 0, pending: 0, in_review: 0, resolved: 0 };

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
    <DashboardContent>
        <CustomBreadcrumbs
          heading="Incident Report List"
          links={[{ name: 'Work Management' }, { name: 'Incident Report' }, { name: 'List' }]}
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
                      (tab.value === 'in_review' && 'error') ||
                      (tab.value === 'resolved' && 'success') ||
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
          <AdminIncidentReportTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            options={{ types: INCIDENT_REPORT_TYPES }}
            dateError={dateError}
          />

          {/* Filter Results */}
          {canReset && (
            <AdminIncidentReportTableFilterResult
              filters={filters}
              totalResults={totalCount}
              onResetPage={table.onResetPage}
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
                  rowCount={totalCount}
                  onSort={table.onSort}
                />

                <TableBody>
                  {dataFiltered.map((row: any) => (
                    <AdminIncidentReportTableRow
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
  );
}
