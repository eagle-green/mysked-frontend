import type { IJob, IJobTableFilters } from 'src/types/job';
import type { TableHeadCellProps } from 'src/components/table';

import dayjs from 'dayjs';
import { useLocation } from 'react-router';
import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useEffect, useCallback } from 'react';

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
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

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
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { JobTableRow } from '../job-table-row';
import { JobTableToolbar } from '../job-table-toolbar';
import { JobTableFiltersResult } from '../job-table-filters-result';

// ----------------------------------------------------------------------

// Helper function to get the current query key for jobs
const getJobsQueryKey = (
  page: number,
  rowsPerPage: number,
  orderBy: string,
  order: string,
  filters: IJobTableFilters,
  isScheduleView: boolean
) => ['jobs', page, rowsPerPage, orderBy, order, filters, isScheduleView];

// Helper function to invalidate all job-related queries
const invalidateAllJobQueries = (queryClient: any) => {
  queryClient.invalidateQueries({ queryKey: ['jobs'] });
};

const STATUS_OPTIONS = [{ value: 'all', label: 'All' }, ...JOB_STATUS_OPTIONS];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'job_number', label: 'Job #', width: 80 },
  { id: 'customer', label: 'Customer', width: 200 },
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const table = useTable({
    defaultDense: true,
    defaultOrder: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
    defaultOrderBy: searchParams.get('orderBy') || 'created_at',
    defaultRowsPerPage: parseInt(searchParams.get('rowsPerPage') || '25', 10),
    defaultCurrentPage: parseInt(searchParams.get('page') || '1', 10) - 1,
  });
  const confirmDialog = useBoolean();
  const location = useLocation();
  const isScheduleView = location.pathname.startsWith('/schedules');
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const filters = useSetState<IJobTableFilters>({
    query: searchParams.get('search') || '',
    region: searchParams.get('region') ? searchParams.get('region')!.split(',') : [],
    name: searchParams.get('name') || '',
    status: searchParams.get('status') || 'all',
    client: searchParams.get('client') ? searchParams.get('client')!.split(',') : [],
    company: searchParams.get('company') ? searchParams.get('company')!.split(',') : [],
    site: searchParams.get('site') ? searchParams.get('site')!.split(',') : [],
    endDate: searchParams.get('endDate') ? dayjs(searchParams.get('endDate')!) : null,
    startDate: searchParams.get('startDate') ? dayjs(searchParams.get('startDate')!) : null,
  });
  const { state: currentFilters, setState: updateFilters } = filters;

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
    if (currentFilters.name) params.set('name', currentFilters.name);
    if (currentFilters.client.length > 0) params.set('client', currentFilters.client.join(','));
    if (currentFilters.company.length > 0) params.set('company', currentFilters.company.join(','));
    if (currentFilters.site.length > 0) params.set('site', currentFilters.site.join(','));
    if (currentFilters.startDate) params.set('startDate', currentFilters.startDate.toISOString());
    if (currentFilters.endDate) params.set('endDate', currentFilters.endDate.toISOString());
    
    const url = `?${params.toString()}`;
    router.replace(`${window.location.pathname}${url}`);
  }, [table.page, table.rowsPerPage, table.orderBy, table.order, table.dense, currentFilters, router]);

  // Update URL when relevant state changes
  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // Reset page when filters change
  useEffect(() => {
    table.onResetPage();
  }, [currentFilters.query, currentFilters.status, currentFilters.region, currentFilters.name, currentFilters.client, currentFilters.company, currentFilters.site, currentFilters.startDate, currentFilters.endDate, table]);

  // React Query for fetching job list with server-side pagination
  const { data: jobResponse } = useQuery({
    queryKey: getJobsQueryKey(table.page, table.rowsPerPage, table.orderBy, table.order, currentFilters, isScheduleView),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (table.page + 1).toString(),
        rowsPerPage: table.rowsPerPage.toString(),
        orderBy: table.orderBy,
        order: table.order,
        ...(currentFilters.status !== 'all' && { status: currentFilters.status }),
        ...(currentFilters.query && { search: currentFilters.query }),
        ...(currentFilters.region.length > 0 && { region: currentFilters.region.join(',') }),
        ...(currentFilters.name && { name: currentFilters.name }),
        ...(currentFilters.client.length > 0 && { client: currentFilters.client.join(',') }),
        ...(currentFilters.company.length > 0 && { company: currentFilters.company.join(',') }),
        ...(currentFilters.site.length > 0 && { site: currentFilters.site.join(',') }),
        ...(currentFilters.startDate && { startDate: currentFilters.startDate.toISOString() }),
        ...(currentFilters.endDate && { endDate: currentFilters.endDate.toISOString() }),
      });
      
      const response = await fetcher(
        isScheduleView ? `${endpoints.work.job}/user?${params.toString()}&is_open_job=false` : `${endpoints.work.job}?${params.toString()}&is_open_job=false`
      );
      return response.data;
    },
    staleTime: 0, // Always consider data stale
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Use the fetched data or fallback to empty array
  const tableData = useMemo(() => jobResponse?.jobs || [], [jobResponse]);
  const totalCount = jobResponse?.pagination?.totalCount || 0;

  // Server-side pagination means no client-side filtering needed
  const dataFiltered = tableData;

  const dateError = fIsAfter(currentFilters.startDate, currentFilters.endDate);

  const canReset =
    !!currentFilters.query ||
    currentFilters.region.length > 0 ||
    currentFilters.status !== 'all' ||
    currentFilters.client.length > 0 ||
    currentFilters.company.length > 0 ||
    currentFilters.site.length > 0 ||
    !!currentFilters.startDate ||
    !!currentFilters.endDate;

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      const toastId = toast.loading('Deleting job...');
      try {
        await fetcher([`${endpoints.work.job}/${id}`, { method: 'DELETE' }]);
        toast.dismiss(toastId);
        toast.success('Delete success!');
        
        // Update the cache to remove the deleted job
        try {
          queryClient.setQueryData(
            getJobsQueryKey(table.page, table.rowsPerPage, table.orderBy, table.order, currentFilters, isScheduleView),
            (oldData: any) => {
              if (!oldData) return oldData;
              
              // Handle different possible data structures
              if (Array.isArray(oldData)) {
                // If oldData is an array, filter it directly
                return oldData.filter((job: any) => job.id !== id);
              }
              
              if (oldData.jobs && Array.isArray(oldData.jobs)) {
                // Safely handle pagination data with fallbacks
                const currentTotalCount = oldData.pagination?.totalCount || oldData.jobs.length;
                const newTotalCount = Math.max(0, currentTotalCount - 1);
                
                return {
                  ...oldData,
                  jobs: oldData.jobs.filter((job: any) => job.id !== id),
                  pagination: {
                    ...oldData.pagination,
                    totalCount: newTotalCount,
                  },
                };
              }
              
              // If structure is unexpected, return as is
              console.warn('Unexpected cache data structure for jobs:', oldData);
              return oldData;
            }
          );
        } catch (cacheError) {
          console.warn('Failed to update cache for single delete:', cacheError);
          // Fallback: invalidate all job queries if cache update fails
          invalidateAllJobQueries(queryClient);
        }
        
        table.onUpdatePageDeleteRow(dataFiltered.length);
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
    [dataFiltered.length, table, queryClient, currentFilters, isScheduleView]
  );

  const handleCancelRow = useCallback(
    async (id: string, cancellationReason?: string) => {
      const toastId = toast.loading('Cancelling job...');
      try {
        await fetcher([
          `${endpoints.work.job}/${id}`,
          {
            method: 'PUT',
            data: { 
              status: 'cancelled',
              cancellation_reason: cancellationReason || null
            },
          },
        ]);
        toast.dismiss(toastId);
        toast.success('Job cancelled successfully!');

        // Update the cache directly with the new job data
        queryClient.setQueryData(
          getJobsQueryKey(table.page, table.rowsPerPage, table.orderBy, table.order, currentFilters, isScheduleView),
          (oldData: any) => {
            if (!oldData || !oldData.jobs) return oldData;
            return {
              ...oldData,
              jobs: oldData.jobs.map((job: any) => 
                job.id === id ? { ...job, status: 'cancelled' } : job
              ),
            };
          }
        );
        
        // Fallback: invalidate all job queries if cache update fails
        if (!queryClient.getQueryData(getJobsQueryKey(table.page, table.rowsPerPage, table.orderBy, table.order, currentFilters, isScheduleView))) {
          invalidateAllJobQueries(queryClient);
        }
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
    [queryClient, currentFilters, isScheduleView, table]
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
      
      // Update the cache to remove the deleted jobs
      try {
        queryClient.setQueryData(
          getJobsQueryKey(table.page, table.rowsPerPage, table.orderBy, table.order, currentFilters, isScheduleView),
          (oldData: any) => {
            if (!oldData) return oldData;
            
            // Handle different possible data structures
            if (Array.isArray(oldData)) {
              // If oldData is an array, filter it directly
              return oldData.filter((job: any) => !table.selected.includes(job.id));
            }
            
            if (oldData.jobs && Array.isArray(oldData.jobs)) {
              // Safely handle pagination data with fallbacks
              const currentTotalCount = oldData.pagination?.totalCount || oldData.jobs.length;
              const newTotalCount = Math.max(0, currentTotalCount - table.selected.length);
              
              return {
                ...oldData,
                jobs: oldData.jobs.filter((job: any) => !table.selected.includes(job.id)),
                pagination: {
                  ...oldData.pagination,
                  totalCount: newTotalCount,
                },
              };
            }
            
            // If structure is unexpected, return as is
            console.warn('Unexpected cache data structure for jobs:', oldData);
            return oldData;
          }
        );
      } catch (cacheError) {
        console.warn('Failed to update cache for batch delete:', cacheError);
        // Fallback: invalidate all job queries if cache update fails
        invalidateAllJobQueries(queryClient);
      }
      
      table.onUpdatePageDeleteRows(dataFiltered.length, dataFiltered.length);
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
  }, [dataFiltered.length, table, queryClient, currentFilters, isScheduleView, confirmDialog]);

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
      <DialogTitle>Delete Cancelled Jobs</DialogTitle>
      <DialogContent>
        Are you sure you want to delete <strong>{table.selected.length}</strong> cancelled job
        {table.selected.length > 1 ? 's' : ''}?
        <br />
        <br />
        <Typography variant="body2" color="text.secondary">
          This action cannot be undone. Only cancelled jobs can be deleted.
        </Typography>
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
              href={paths.work.job.create}
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
              totalResults={totalCount}
              onResetPage={table.onResetPage}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered.filter((job: IJob) => job.status === 'cancelled').length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  dataFiltered
                    .filter((job: IJob) => job.status === 'cancelled')
                                            .map((row: IJob) => row.id)
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
                  rowCount={dataFiltered.filter((job: IJob) => job.status === 'cancelled').length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      dataFiltered
                        .filter((job: IJob) => job.status === 'cancelled')
                        .map((row: IJob) => row.id)
                    )
                  }
                />

                <TableBody>
                  {dataFiltered
                    .filter((row: IJob) => row && row.id)
                    .map((row: IJob) => (
                      <JobTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        onCancelRow={(cancellationReason) => handleCancelRow(row.id, cancellationReason)}
                        detailsHref={paths.work.job.edit(row.id)}
                        editHref={paths.work.job.edit(row.id)}
                        showWarning={shouldShowWarning(row)}
                      />
                    ))}

                  <TableEmptyRows
                    height={table.dense ? 56 : 56 + 20}
                    emptyRows={emptyRows(0, table.rowsPerPage, tableData.length)}
                  />

                  <TableNoData notFound={notFound} />
                </TableBody>
              </Table>
            </Scrollbar>
          </Box>

          <TablePaginationCustom
            page={table.page}
            dense={table.dense}
            count={totalCount}
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


