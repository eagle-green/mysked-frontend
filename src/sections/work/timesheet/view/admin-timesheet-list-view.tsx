import type { TableHeadCellProps } from 'src/components/table';
import type { TimesheetEntry, IJobTableFilters } from 'src/types/job';

import dayjs from 'dayjs';
import { pdf } from '@react-pdf/renderer';
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

import { useRouter, useSearchParams } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import TimesheetPDF from 'src/pages/template/timesheet-pdf';

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

import { AdminTimesheetTableRow } from '../admin-timesheet-table-row';
import { AdminTimesheetTableToolbar } from '../admin-timesheet-table-toolbar';
import { AdminTimesheetTableFiltersResult } from '../admin-timesheet-table-filters-result';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'job_number', label: 'Job #' },
  { id: 'site', label: 'Site' },
  { id: 'client', label: 'Client' },
  { id: 'company', label: 'Customer' },
  { id: 'start_date', label: 'Start Date' },
  { id: 'end_date', label: 'End Date' },
  { id: 'submitted_by', label: 'Submitted By' },
  { id: 'status', label: 'Status' },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function AdminTimesheetListView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const table = useTable({
    defaultDense: true,
    defaultOrder: (searchParams.get('order') as 'asc' | 'desc') || 'asc',
    defaultOrderBy: searchParams.get('orderBy') || 'start_time',
    defaultRowsPerPage: parseInt(searchParams.get('rowsPerPage') || '25', 10),
    defaultCurrentPage: parseInt(searchParams.get('page') || '1', 10) - 1,
  });

  const filters = useSetState<IJobTableFilters>({
    query: searchParams.get('search') || '',
    status: searchParams.get('status') || 'all',
    region: searchParams.get('region') ? searchParams.get('region')!.split(',') : [],
    client: searchParams.get('client') ? searchParams.get('client')!.split(',').map(id => ({ id, name: '' })) : [],
    company: searchParams.get('company') ? searchParams.get('company')!.split(',').map(id => ({ id, name: '' })) : [],
    site: searchParams.get('site') ? searchParams.get('site')!.split(',').map(id => ({ id, name: '' })) : [],
    startDate: searchParams.get('startDate') ? dayjs(searchParams.get('startDate')!) : null,
    endDate: searchParams.get('endDate') ? dayjs(searchParams.get('endDate')!) : null,
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  // React Query for fetching admin timesheet list with server-side pagination
  const { data: timesheetResponse } = useQuery({
    queryKey: [
      'admin-timesheets',
      table.page,
      table.rowsPerPage,
      table.orderBy,
      table.order,
      currentFilters,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (table.page + 1).toString(),
        rowsPerPage: table.rowsPerPage.toString(),
        orderBy: table.orderBy,
        order: table.order,
        ...(currentFilters.status !== 'all' && { status: currentFilters.status }),
        ...(currentFilters.query && { search: currentFilters.query }),
        ...(currentFilters.client.length > 0 && { client: currentFilters.client.map(c => c.id).join(',') }),
        ...(currentFilters.company.length > 0 && { company: currentFilters.company.map(c => c.id).join(',') }),
        ...(currentFilters.site.length > 0 && { site: currentFilters.site.map(s => s.id).join(',') }),
        ...(currentFilters.startDate && { startDate: currentFilters.startDate.toISOString() }),
        ...(currentFilters.endDate && { endDate: currentFilters.endDate.toISOString() }),
      });

      const response = await fetcher(`${endpoints.timesheet.admin}?${params.toString()}`);
      return response.data;
    },
  });

  const handleExportPDF = async (data: TimesheetEntry) => {
    try {
      // Fetch the complete timesheet data from the backend
      const response = await fetcher(endpoints.timesheet.exportPDF.replace(':id', data.id));

      if (response.success && response.data) {
        // Create PDF with the real data from backend
        try {
          const blob = await pdf(<TimesheetPDF timesheetData={response.data} />).toBlob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;

          // Generate filename with safety checks
          const clientName = response.data?.client?.name || 'unknown';
          const jobNumber = response.data?.job?.job_number || 'unknown';
          const timesheetDate =
            response.data?.timesheet?.timesheet_date ||
            response.data?.job?.start_time ||
            new Date();

          // Format client name: remove spaces, convert to lowercase
          const formattedClientName = clientName.replace(/\s+/g, '-').toLowerCase();

          const filename = `timesheet-job-${jobNumber}-${formattedClientName}-${dayjs(timesheetDate).format('MM-DD-YYYY')}.pdf`;

          link.download = filename;
          document.body.appendChild(link);
          link.click();

          // Cleanup after downloading the file
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }, 300);
        } catch (pdfError) {
          console.error('Error generating PDF:', pdfError);
          throw new Error('Failed to generate PDF');
        }
      } else {
        console.error('Failed to fetch timesheet data for PDF export');
      }
    } catch (error) {
      console.error('Error exporting timesheet PDF:', error);
    }
  };

  // Update URL when table state changes
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();

    // Always add pagination and sorting params to make URLs shareable
    params.set('page', (table.page + 1).toString());
    params.set('rowsPerPage', table.rowsPerPage.toString());
    params.set('orderBy', table.orderBy);
    params.set('order', table.order);
    params.set('dense', table.dense.toString());

    // Add filter params
    if (currentFilters.query) params.set('search', currentFilters.query);
    if (currentFilters.status !== 'all') params.set('status', currentFilters.status);
    if (currentFilters.region.length > 0) params.set('region', currentFilters.region.join(','));
    if (currentFilters.client.length > 0) params.set('client', currentFilters.client.map(c => c.id).join(','));
    if (currentFilters.company.length > 0) params.set('company', currentFilters.company.map(c => c.id).join(','));
    if (currentFilters.site.length > 0) params.set('site', currentFilters.site.map(s => s.id).join(','));
    if (currentFilters.startDate) params.set('startDate', currentFilters.startDate.toISOString());
    if (currentFilters.endDate) params.set('endDate', currentFilters.endDate.toISOString());

    const url = `?${params.toString()}`;
    router.replace(`${window.location.pathname}${url}`);
  }, [
    table.page,
    table.rowsPerPage,
    table.orderBy,
    table.order,
    table.dense,
    currentFilters,
    router,
  ]);

  // Update URL when relevant state changes
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
    currentFilters.region,
    currentFilters.client,
    currentFilters.company,
    currentFilters.site,
    currentFilters.startDate,
    currentFilters.endDate,
  ]);

  // Use the fetched data or fallback to empty array
  const timesheetList = useMemo(() => timesheetResponse?.timesheets || [], [timesheetResponse]);
  const totalCount = timesheetResponse?.pagination?.total || 0;

  // Server-side pagination means no client-side filtering needed
  const dataFiltered = timesheetList;

  const canReset = !!(
    currentFilters.query ||
    currentFilters.client.length > 0 ||
    currentFilters.company.length > 0 ||
    currentFilters.site.length > 0 ||
    currentFilters.startDate ||
    currentFilters.endDate
  );

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleFilters = useCallback(
    (name: string, value: any) => {
      table.onResetPage();
      updateFilters({ [name]: value });
    },
    [table, updateFilters]
  );

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const handleResetFilters = useCallback(() => {
    updateFilters({
      query: '',
      status: 'all',
      client: [],
      company: [],
      site: [],
      startDate: null,
      endDate: null,
    });
  }, [updateFilters]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Timesheet Management"
        links={[
          { name: 'Work Management' },
          { name: 'Timesheet' },
          { name: 'List' },
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
                    (tab.value === 'draft' && 'info') ||
                    (tab.value === 'submitted' && 'success') ||
                    'default'
                  }
                >
                  {['draft', 'submitted'].includes(tab.value)
                    ? timesheetList.filter(
                        (timesheet: TimesheetEntry) => timesheet.status === tab.value
                      ).length
                    : timesheetList.length}
                </Label>
              }
            />
          ))}
        </Tabs>

        <AdminTimesheetTableToolbar
          filters={filters}
          onFilters={handleFilters}
          onResetFilters={handleResetFilters}
          onResetPage={table.onResetPage}
          dateError={
            !!(
              currentFilters.startDate &&
              currentFilters.endDate &&
              currentFilters.endDate < currentFilters.startDate
            )
          }
        />

        {canReset && (
          <AdminTimesheetTableFiltersResult
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
                rowCount={timesheetList.length}
                onSort={table.onSort}
              />

              <TableBody>
                {dataFiltered.map((row: TimesheetEntry) => (
                  <AdminTimesheetTableRow
                    key={row.id}
                    row={row}
                    onExportPDf={async (data) => await handleExportPDF(data)}
                  />
                ))}

                <TableEmptyRows
                  height={52}
                  emptyRows={emptyRows(0, table.rowsPerPage, timesheetList.length)}
                />

                <TableNoData notFound={notFound} />
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
