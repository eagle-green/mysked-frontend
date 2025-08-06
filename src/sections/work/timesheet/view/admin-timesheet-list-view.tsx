import type { TableHeadCellProps } from 'src/components/table';
import type { TimesheetEntry, IJobTableFilters } from 'src/types/job';

import { useState, useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { fIsAfter } from 'src/utils/format-time';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
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
  { value: 'approved', label: 'Approved' },
  { value: 'holding', label: 'Holding' },
];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'job_number', label: 'Job #', width: 100 },
  { id: 'company', label: 'Company', width: 150 },
  { id: 'site', label: 'Site', width: 150 },
  { id: 'client', label: 'Client', width: 150 },
  { id: 'start_date', label: 'Start Date', width: 120 },
  { id: 'end_date', label: 'End Date', width: 120 },
  { id: 'status', label: 'Status', width: 100 },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------



// ----------------------------------------------------------------------

export function AdminTimesheetListView() {
  const table = useTable();
  const confirmDialog = useBoolean();
  const [isDeleting, setIsDeleting] = useState(false);

  // React Query for fetching timesheet list
  const { data: timesheetListData, refetch } = useQuery({
    queryKey: ['admin-timesheets'],
    queryFn: async () => {
      const response = await fetcher(endpoints.timesheet);
      return response.data.timesheets || [];
    },
  });

  const filters = useSetState<IJobTableFilters>({
    query: '',
    status: 'all',
    region: [],
    client: [],
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

  const canReset = !!(currentFilters.query || currentFilters.client.length > 0 || currentFilters.startDate || currentFilters.endDate);

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
      startDate: null,
      endDate: null,
    });
  }, [updateFilters]);

  const handleOpenConfirm = useCallback(() => {
    confirmDialog.onTrue();
  }, [confirmDialog]);

  const handleDeleteRow = useCallback(
    async (id: string) => {
      setIsDeleting(true);
      try {
        await fetcher([`${endpoints.timesheet}/${id}`, { method: 'DELETE' }]);
        toast.success('Timesheet deleted successfully');
        refetch();
      } catch (error) {
        console.error('Error deleting timesheet:', error);
        toast.error('Failed to delete timesheet');
      } finally {
        setIsDeleting(false);
      }
    },
    [refetch]
  );



  const handleDeleteRows = useCallback(() => {
    const deleteRows = table.selected.map((rowId) => handleDeleteRow(rowId));
    Promise.all(deleteRows).then(() => {
      const dataInPage = dataFiltered.slice(
        table.page * table.rowsPerPage,
        table.page * table.rowsPerPage + table.rowsPerPage
      );
      table.onUpdatePageDeleteRows(dataInPage.length, dataFiltered.length);
      table.onSelectAllRows(false, []);
    });
  }, [handleDeleteRow, table, dataFiltered]);





  const renderConfirmDialog = () => (
    <Dialog open={confirmDialog.value} onClose={confirmDialog.onFalse} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Timesheets</DialogTitle>
      <DialogContent>
        Are you sure you want to delete <strong>{table.selected.length}</strong> timesheet
        {table.selected.length > 1 ? 's' : ''}?
      </DialogContent>
      <DialogActions>
        <Button onClick={confirmDialog.onFalse} disabled={isDeleting} sx={{ mr: 1 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDeleteRows}
          disabled={isDeleting}
          startIcon={isDeleting ? <CircularProgress size={16} /> : null}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Timesheet Management"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Management', href: paths.management.root },
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
                    (tab.value === 'submitted' && 'warning') ||
                    (tab.value === 'approved' && 'success') ||
                    (tab.value === 'holding' && 'secondary') ||
                    'default'
                  }
                >
                  {[
                    'draft',
                    'submitted',
                    'approved',
                    'holding',
                  ].includes(tab.value)
                    ? timesheetList.filter((timesheet: TimesheetEntry) => timesheet.status === tab.value).length
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
          dateError={!!(currentFilters.startDate && currentFilters.endDate && !fIsAfter(currentFilters.endDate, currentFilters.startDate))}
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
          <TableSelectedAction
            dense={table.dense}
            numSelected={table.selected.length}
            rowCount={dataFiltered.length}
            onSelectAllRows={(checked) =>
              table.onSelectAllRows(
                checked,
                dataFiltered.map((row) => row.id)
              )
            }
            action={
              <Tooltip title="Delete">
                <IconButton color="primary" onClick={handleOpenConfirm}>
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
                rowCount={timesheetList.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    timesheetList.map((row: TimesheetEntry) => row.id)
                  )
                }
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
                      selected={table.selected.includes(row.id)}
                      onSelectRow={() => table.onSelectRow(row.id)}
                      onDeleteRow={() => handleDeleteRow(row.id)}
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

      {renderConfirmDialog()}
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
  const { query, status, client, startDate, endDate } = filters;

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
        timesheet.client.name?.toLowerCase().includes(selectedClient.toLowerCase())
      )
    );
  }



  if (startDate && endDate) {
    inputData = inputData.filter(
      (timesheet) =>
        fIsAfter(timesheet.original_start_time, startDate) &&
        fIsAfter(endDate, timesheet.original_start_time)
    );
  }

  return inputData;
} 