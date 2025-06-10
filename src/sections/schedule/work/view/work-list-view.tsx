import type { TableHeadCellProps } from 'src/components/table';
import type { IJob, IJobWorker, IJobTableFilters } from 'src/types/job';

import dayjs from 'dayjs';
import { useMemo, useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';

import { fIsAfter } from 'src/utils/format-time';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { regionList, WORK_STATUS_OPTIONS } from 'src/assets/data';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  rowInPage,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { useAuthContext } from 'src/auth/hooks';

import { JobTableRow } from '../work-table-row';
import { JobTableToolbar } from '../work-table-toolbar';
import { JobTableFiltersResult } from '../work-table-filters-result';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [{ value: 'all', label: 'All' }, ...WORK_STATUS_OPTIONS];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'job_number', label: 'Job #', width: 80 },
  { id: 'site_name', label: 'Site Name' },
  { id: 'site_region', label: 'Region' },
  { id: 'client', label: 'Client' },
  { id: 'start_date', label: 'Start Date' },
  { id: 'end_date', label: 'End Date' },
  { id: 'status', label: 'Status' },
  { id: '', width: 50 },
];

// ----------------------------------------------------------------------

export default function WorkListView() {
  const table = useTable();
  const { user } = useAuthContext();
  const confirmDialog = useBoolean();

  // React Query for fetching job list
  const { data: jobListData, refetch } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await fetcher(endpoints.work.job + '/user');

      return response.data.jobs;
    },
  });

  const filters = useSetState<IJobTableFilters>({
    query: '',
    region: [],
    name: '',
    status: 'all',
    endDate: null,
    startDate: null,
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const dateError = fIsAfter(currentFilters.startDate, currentFilters.endDate);

  // Filter jobs based on user role
  const filteredJobs = useMemo(() => {
    if (!jobListData) return [];

    // For workers, show jobs where they are assigned and status is pending or accepted
    return jobListData.filter((job: IJob) => {
      const workerAssignment = job.workers.find((w: IJobWorker) => w.id === user?.id);
      return (
        workerAssignment &&
        (workerAssignment.status === 'pending' ||
          workerAssignment.status === 'accepted' ||
          workerAssignment.status === 'rejected')
      );
    });
  }, [jobListData, user?.id]);

  const dataFiltered = useMemo(() => {
    const { query, status, region, startDate, endDate } = currentFilters;

    let filtered = filteredJobs;

    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (job: IJob) =>
          job.client?.name?.toLowerCase().includes(q) ||
          job.site?.name?.toLowerCase().includes(q) ||
          job.site?.region?.toLowerCase().includes(q) ||
          (job.workers &&
            job.workers.some(
              (w: IJobWorker) =>
                w.first_name?.toLowerCase().includes(q) || w.last_name?.toLowerCase().includes(q)
            ))
      );
    }

    if (status !== 'all') {
      filtered = filtered.filter((job: IJob) => {
        const workerAssignment = job.workers.find((w: IJobWorker) => w.id === user?.id);
        // For rejected status, we want to show jobs where the worker has rejected
        if (status === 'rejected') {
          return workerAssignment?.status === 'rejected';
        }
        // For other statuses, show based on worker's status
        return workerAssignment?.status === status;
      });
    }

    if (region.length) {
      filtered = filtered.filter((job: IJob) => region.includes(job.site?.region));
    }

    // Date filtering
    if (!dateError && startDate && endDate) {
      filtered = filtered.filter((job: IJob) => {
        const workerAssignment = job.workers.find((w: IJobWorker) => w.id === user?.id);
        if (!workerAssignment) return false;
        return (
          (dayjs(workerAssignment.end_time).isAfter(startDate, 'day') ||
            dayjs(workerAssignment.end_time).isSame(startDate, 'day')) &&
          (dayjs(workerAssignment.start_time).isBefore(endDate, 'day') ||
            dayjs(workerAssignment.start_time).isSame(endDate, 'day'))
        );
      });
    }

    return filtered;
  }, [filteredJobs, currentFilters, dateError, user?.id]);

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!currentFilters.query || currentFilters.region.length > 0 || currentFilters.status !== 'all';

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRows = useCallback(async () => {
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
    } catch (error) {
      console.error(error);
      toast.dismiss(toastId);
      toast.error('Failed to delete some jobs.');
    }
  }, [dataFiltered.length, dataInPage.length, table, refetch]);

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title="Delete"
      content={
        <>
          Are you sure want to delete <strong> {table.selected.length} </strong> jobs?
        </>
      }
      action={
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            handleDeleteRows();
            confirmDialog.onFalse();
          }}
        >
          Delete
        </Button>
      }
    />
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Job List"
          links={[{ name: 'Schedule' }, { name: 'List' }]}
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
                      (tab.value === 'accepted' && 'success') ||
                      (tab.value === 'rejected' && 'error') ||
                      'default'
                    }
                  >
                    {
                      filteredJobs.filter((job: IJob) => {
                        const workerAssignment = job.workers.find(
                          (w: IJobWorker) => w.id === user?.id
                        );
                        // For rejected tab, we want to show jobs where the worker has rejected
                        if (tab.value === 'rejected') {
                          return workerAssignment?.status === 'rejected';
                        }
                        // For other tabs, show based on worker's status
                        return tab.value === 'all' ? true : workerAssignment?.status === tab.value;
                      }).length
                    }
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
            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headCells={TABLE_HEAD}
                  rowCount={dataFiltered.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                />

                <TableBody>
                  {dataFiltered
                    .slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .filter((row: IJob) => row && row.id)
                    .map((row: IJob) => (
                      <JobTableRow key={row.id} row={row} />
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
