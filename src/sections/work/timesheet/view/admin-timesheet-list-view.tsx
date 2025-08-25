import type { TableHeadCellProps } from 'src/components/table';
import type { TimesheetEntry, IJobTableFilters } from 'src/types/job';

import dayjs from 'dayjs';
import { useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';

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
  getComparator,
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
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'rejected', label: 'Rejected' },
];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'job_number', label: 'Job #' },
  { id: 'site', label: 'Site' },
  { id: 'client', label: 'Client' },
  { id: 'company', label: 'Company' },
  { id: 'start_date', label: 'Start Date' },
  { id: 'end_date', label: 'End Date' },
  { id: 'submitted_by', label: 'Submitted By' },
  { id: 'status', label: 'Status' },
  { id: 'confirmed_by', label: 'Confirmed By' },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function AdminTimesheetListView() {
  const table = useTable();

  // React Query for fetching admin timesheet list
  const { data: timesheetListData } = useQuery({
    queryKey: ['admin-timesheets'],
    queryFn: async () => {
      const response = await fetcher(endpoints.timesheet.admin);
      return response.data.timesheets || [];
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
         const timesheetDate = response.data?.timesheet?.timesheet_date || response.data?.job?.start_time || new Date();
         
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
  const { state: currentFilters, setState: updateFilters } = filters;

  const timesheetList = timesheetListData || [];

  const dataFiltered = applyFilter({
    inputData: timesheetList,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
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
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Work Management', href: paths.work.root },
          { name: 'Timesheets' },
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
                    (tab.value === 'submitted' && 'secondary') ||
                    (tab.value === 'confirmed' && 'success') ||
                    (tab.value === 'rejected' && 'warning') ||
                    'default'
                  }
                >
                  {['draft', 'submitted', 'confirmed', 'rejected'].includes(tab.value)
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
                {dataFiltered
                  .slice(
                    table.page * table.rowsPerPage,
                    table.page * table.rowsPerPage + table.rowsPerPage
                  )
                  .map((row: TimesheetEntry) => (
                    <AdminTimesheetTableRow
                      key={row.id}
                      row={row}
                      onExportPDf={async (data) => await handleExportPDF(data)}
                    />
                  ))}

                <TableEmptyRows
                  height={52}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, timesheetList.length)}
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
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          dense={table.dense}
          onChangeDense={table.onChangeDense}
        />
      </Card>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: TimesheetEntry[];
  filters: IJobTableFilters;
  comparator: (a: any, b: any) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { query, status, client, company, site, startDate, endDate } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (query) {
    inputData = inputData.filter(
      (timesheet) =>
        timesheet.worker_id?.toLowerCase().indexOf(query.toLowerCase()) !== -1 ||
        timesheet.job_worker_id?.toLowerCase().indexOf(query.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((timesheet) => timesheet.status === status);
  }

  if (client.length > 0) {
    inputData = inputData.filter((timesheet) =>
      client.some((selectedClient: string) =>
        timesheet.client?.name?.toLowerCase().includes(selectedClient.toLowerCase())
      )
    );
  }

  if (company.length > 0) {
    inputData = inputData.filter((timesheet) =>
      company.some((selectedCompany: string) =>
        timesheet.company?.name?.toLowerCase().includes(selectedCompany.toLowerCase())
      )
    );
  }

  if (site.length > 0) {
    inputData = inputData.filter((timesheet) =>
      site.some((selectedSite: string) =>
        timesheet.site.name?.toLowerCase().includes(selectedSite.toLowerCase())
      )
    );
  }

  if (startDate && endDate) {
    inputData = inputData.filter((timesheet) => {
      // Try multiple date fields as fallbacks
      const timesheetDate =
        timesheet.original_start_time ||
        timesheet.timesheet_date ||
        timesheet.created_at ||
        timesheet.updated_at;

      if (!timesheetDate) {
        return false;
      }

      // Convert to Date objects for comparison
      const timesheetDateObj = new Date(timesheetDate);
      const start =
        startDate && typeof startDate === 'object' && 'toDate' in startDate
          ? startDate.toDate()
          : new Date(startDate as any);
      const end =
        endDate && typeof endDate === 'object' && 'toDate' in endDate
          ? endDate.toDate()
          : new Date(endDate as any);

      // Reset time to start of day for accurate date comparison
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999); // End of day
      timesheetDateObj.setHours(0, 0, 0, 0);

      const isInRange = timesheetDateObj >= start && timesheetDateObj <= end;

      return isInRange;
    });
  }

  return inputData;
}
