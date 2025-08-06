import type { IJob, IJobTableFilters } from 'src/types/job';
import type { TableHeadCellProps } from 'src/components/table';

import dayjs from 'dayjs';
import { useLocation } from 'react-router';
import { useState, useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
import { RouterLink } from 'src/routes/components';

import { fIsAfter } from 'src/utils/format-time';

import { regionList } from 'src/assets/data';
import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { JOB_STATUS_OPTIONS } from 'src/assets/data/job';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
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
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { JobTableRow } from '../job-table-row';
import { JobTableToolbar } from '../job-table-toolbar';
import { JobTableFiltersResult } from '../job-table-filters-result';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [{ value: 'all', label: 'All' }, ...JOB_STATUS_OPTIONS];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'job_number', label: 'Job #', width: 80 },
  { id: 'site_name', label: 'Site Name' },
  { id: 'site_region', label: 'Region' },
  { id: 'client', label: 'Client' },
  { id: 'start_date', label: 'Start Date' },
  { id: 'end_date', label: 'End Date' },
  { id: 'status', label: 'Status' },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

const shouldShowWarning = (job: IJob): boolean => {
  const now = dayjs();
  const startTime = dayjs(job.start_time);
  const hoursUntilStart = startTime.diff(now, 'hour');

  // Show warning if job starts in less than 48 hours and status is not ready
  return hoursUntilStart <= 48 && hoursUntilStart > 0 && job.status !== 'ready';
};

// ----------------------------------------------------------------------

export function JobListView() {
  const table = useTable();
  const confirmDialog = useBoolean();
  const location = useLocation();
  const isScheduleView = location.pathname.startsWith('/schedules');
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  // React Query for fetching job list
  const { data: jobListData, refetch } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await fetcher(
        isScheduleView ? `${endpoints.work.job}/user` : endpoints.work.job
      );
      return response.data.jobs;
    },
    staleTime: 0, // Always consider data stale
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Use the fetched data or fallback to empty array
  const tableData = jobListData || [];

  const filters = useSetState<IJobTableFilters>({
    query: '',
    region: [],
    name: '',
    status: 'all',
    client: [],
    endDate: null,
    startDate: null,
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const dateError = fIsAfter(currentFilters.startDate, currentFilters.endDate);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!currentFilters.query || currentFilters.region.length > 0 || currentFilters.status !== 'all';

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      const toastId = toast.loading('Deleting job...');
      try {
        await fetcher([`${endpoints.work.job}/${id}`, { method: 'DELETE' }]);
        toast.dismiss(toastId);
        toast.success('Delete success!');
        refetch();
        table.onUpdatePageDeleteRow(dataInPage.length);
      } catch (error: any) {
        toast.dismiss(toastId);
        console.error(error);

        // Extract error message from backend response
        let errorMessage = 'Failed to delete the job.';
        if (error?.error) {
          errorMessage = error.error;
        } else if (error?.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }

        toast.error(errorMessage);
        throw error; // Re-throw to be caught by the table row component
      }
    },
    [dataInPage.length, table, refetch]
  );

  const handleCancelRow = useCallback(
    async (id: string) => {
      const toastId = toast.loading('Cancelling job...');
      try {
        await fetcher([
          `${endpoints.work.job}/${id}`,
          {
            method: 'PUT',
            data: { status: 'cancelled' },
          },
        ]);
        toast.dismiss(toastId);
        toast.success('Job cancelled successfully!');

        // Update the cache directly with the new job data
        queryClient.setQueryData(['jobs'], (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((job: any) => (job.id === id ? { ...job, status: 'cancelled' } : job));
        });
      } catch (error: any) {
        toast.dismiss(toastId);
        console.error('Cancel job error:', error);

        // Extract error message from backend response
        let errorMessage = 'Failed to cancel the job.';
        if (error?.error) {
          errorMessage = error.error;
        } else if (error?.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }

        toast.error(errorMessage);
        throw error; // Re-throw to be caught by the table row component
      }
    },
    [queryClient]
  );

  const handleDeleteRows = useCallback(async () => {
    setIsDeleting(true);
    const toastId = toast.loading('Deleting jobs...');
    try {
      await fetcher([
        endpoints.work.job,
        {
          method: 'DELETE',
          data: { ids: table.selected },
        },
      ]);

      toast.dismiss(toastId);
      toast.success('Delete success!');
      refetch();
      table.onUpdatePageDeleteRows(dataInPage.length, dataFiltered.length);
      confirmDialog.onFalse();
    } catch (error: any) {
      console.error(error);
      toast.dismiss(toastId);

      // Extract error message from backend response
      let errorMessage = 'Failed to delete some jobs.';
      if (error?.error) {
        errorMessage = error.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  }, [dataFiltered.length, dataInPage.length, table, refetch, confirmDialog]);

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const handleOpenConfirm = useCallback(() => {
    confirmDialog.onTrue();
  }, [confirmDialog]);

  const renderConfirmDialog = () => (
    <Dialog open={confirmDialog.value} onClose={confirmDialog.onFalse} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Jobs</DialogTitle>
      <DialogContent>
        Are you sure you want to delete <strong>{table.selected.length}</strong> job
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
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Job List"
          links={[{ name: 'Work Management' }, { name: 'Job' }, { name: 'List' }]}
          action={
            <Button
              component={RouterLink}
              href={paths.work.job.multiCreate}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              Add Job
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
                      (tab.value === 'draft' && 'info') ||
                      (tab.value === 'pending' && 'warning') ||
                      (tab.value === 'ready' && 'primary') ||
                      (tab.value === 'in_progress' && 'secondary') ||
                      (tab.value === 'completed' && 'success') ||
                      (tab.value === 'cancelled' && 'error') ||
                      'default'
                    }
                  >
                    {[
                      'draft',
                      'pending',
                      'ready',
                      'in_progress',
                      'completed',
                      'cancelled',
                    ].includes(tab.value)
                      ? tableData.filter((job: IJob) => job.status === tab.value).length
                      : tableData.length}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <JobTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            options={{ regions: regionList }}
            dateError={dateError}
          />

          {canReset && (
            <JobTableFiltersResult
              filters={filters}
              totalResults={dataFiltered.length}
              onResetPage={table.onResetPage}
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
                !isScheduleView && (
                  <Tooltip title="Delete">
                    <IconButton color="primary" onClick={handleOpenConfirm}>
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Tooltip>
                )
              }
            />

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headCells={TABLE_HEAD}
                  rowCount={dataFiltered.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      dataFiltered.map((row) => row.id)
                    )
                  }
                />

                <TableBody>
                  {dataFiltered
                    .slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .filter((row: IJob) => row && row.id)
                    .map((row: IJob) => (
                      <JobTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        onCancelRow={() => handleCancelRow(row.id)}
                        detailsHref={paths.work.job.edit(row.id)}
                        editHref={paths.work.job.edit(row.id)}
                        showWarning={shouldShowWarning(row)}
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
          </Box>

          <TablePaginationCustom
            page={table.page}
            dense={table.dense}
            count={dataFiltered.length}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      {renderConfirmDialog()}
    </>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: IJob[];
  filters: IJobTableFilters;
  comparator: (a: any, b: any) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { query, status, region, startDate, endDate } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (query) {
    const q = query.toLowerCase();
    inputData = inputData.filter(
      (job) =>
        job.client?.name?.toLowerCase().includes(q) ||
        job.company?.name?.toLowerCase().includes(q) ||
        job.company?.region?.toLowerCase().includes(q) ||
        (job.workers &&
          job.workers.some(
            (w) => w.first_name?.toLowerCase().includes(q) || w.last_name?.toLowerCase().includes(q)
          ))
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((job) => job.status === status);
  }

  if (region.length) {
    inputData = inputData.filter((job) => region.includes(job.company?.region));
  }

  // Date filtering
  const dateError = fIsAfter(startDate, endDate);
  if (!dateError && startDate && endDate) {
    inputData = inputData.filter(
      (job) =>
        (dayjs(job.end_time).isAfter(startDate, 'day') ||
          dayjs(job.end_time).isSame(startDate, 'day')) &&
        (dayjs(job.start_time).isBefore(endDate, 'day') ||
          dayjs(job.start_time).isSame(endDate, 'day'))
    );
  }

  return inputData;
}
