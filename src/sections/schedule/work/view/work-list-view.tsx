import type { TableHeadCellProps } from 'src/components/table';
import type { IJob, IJobWorker, IJobTableFilters } from 'src/types/job';

import dayjs from 'dayjs';
import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import Collapse from '@mui/material/Collapse';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { fDate, fTime, fIsAfter } from 'src/utils/format-time';
import { formatPhoneNumberSimple } from 'src/utils/format-number';
import { getWorkerStatusLabel, getWorkerStatusColor } from 'src/utils/format-role';

import { regionList } from 'src/assets/data';
import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { JOB_POSITION_OPTIONS, JOB_EQUIPMENT_OPTIONS } from 'src/assets/data/job';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
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
import { WorkResponseDialog } from '../work-response-dialog';
import { JobTableFiltersResult } from '../work-table-filters-result';
import { IncidentReportForm } from '../../incident-report/incident-report-form';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'completed', label: 'Completed' },
  { value: 'missing_timesheet', label: 'Missing Timesheet' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'no_show', label: 'No Show' },
  { value: 'called_in_sick', label: 'Called in Sick' },
  { value: 'cancelled', label: 'Cancelled' },
];

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

export default function WorkListView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const table = useTable({
    defaultDense: true,
    defaultOrder: (searchParams.get('order') as 'asc' | 'desc') || 'asc',
    defaultOrderBy: searchParams.get('orderBy') || 'start_time',
    defaultRowsPerPage: parseInt(searchParams.get('rowsPerPage') || '25', 10),
    defaultCurrentPage: parseInt(searchParams.get('page') || '1', 10) - 1,
  });
  const { user } = useAuthContext();
  const confirmDialog = useBoolean();
  const [isDeleting, setIsDeleting] = useState(false);

  const filters = useSetState<IJobTableFilters>({
    query: searchParams.get('search') || '',
    region: searchParams.get('region') ? searchParams.get('region')!.split(',') : [],
    name: searchParams.get('name') || '',
    status: searchParams.get('status') || 'all',
    client: searchParams.get('client')
      ? searchParams
          .get('client')!
          .split(',')
          .map((id) => ({ id, name: '' }))
      : [],
    company: searchParams.get('company')
      ? searchParams
          .get('company')!
          .split(',')
          .map((id) => ({ id, name: '' }))
      : [],
    site: searchParams.get('site')
      ? searchParams
          .get('site')!
          .split(',')
          .map((id) => ({ id, name: '' }))
      : [],
    endDate: searchParams.get('endDate') ? dayjs(searchParams.get('endDate')!) : null,
    startDate: searchParams.get('startDate') ? dayjs(searchParams.get('startDate')!) : null,
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  // React Query for fetching job list with pagination
  const {
    data: jobResponse,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: [
      'jobs',
      table.page,
      table.rowsPerPage,
      table.orderBy,
      table.order,
      currentFilters.query,
      currentFilters.status,
      currentFilters.region.join(','),
      currentFilters.client.map((c) => c.id).join(','),
      currentFilters.company.map((c) => c.id).join(','),
      currentFilters.site.map((s) => s.id).join(','),
      currentFilters.startDate?.toISOString(),
      currentFilters.endDate?.toISOString(),
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (table.page + 1).toString(),
        limit: table.rowsPerPage.toString(),
        orderBy: table.orderBy || 'start_time',
        order: table.order || 'asc',
      });

      // Add all filters to backend API call
      if (currentFilters.query) {
        params.set('search', currentFilters.query);
      }
      if (currentFilters.status && currentFilters.status !== 'all') {
        params.set('status', currentFilters.status);
      }
      if (currentFilters.region.length > 0) {
        params.set('region', currentFilters.region.join(','));
      }
      if (currentFilters.client.length > 0) {
        params.set('client', currentFilters.client.map((c) => c.id).join(','));
      }
      if (currentFilters.company.length > 0) {
        params.set('company', currentFilters.company.map((c) => c.id).join(','));
      }
      if (currentFilters.site.length > 0) {
        params.set('site', currentFilters.site.map((s) => s.id).join(','));
      }
      if (currentFilters.startDate) {
        // Send dates as YYYY-MM-DD format to avoid timezone conversion issues
        params.set('startDate', currentFilters.startDate.format('YYYY-MM-DD'));
      }
      if (currentFilters.endDate) {
        // Send dates as YYYY-MM-DD format to avoid timezone conversion issues
        params.set('endDate', currentFilters.endDate.format('YYYY-MM-DD'));
      }

      const response = await fetcher(`${endpoints.work.job}/user?${params}`);
      return response.data;
    },
  });

  const dateError = fIsAfter(currentFilters.startDate, currentFilters.endDate);

  // Update URL when table state changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', (table.page + 1).toString());
    params.set('rowsPerPage', table.rowsPerPage.toString());
    params.set('orderBy', table.orderBy);
    params.set('order', table.order);
    params.set('dense', table.dense.toString());

    // Add filter parameters
    if (currentFilters.query) params.set('search', currentFilters.query);
    if (currentFilters.status !== 'all') params.set('status', currentFilters.status);
    if (currentFilters.region.length > 0) params.set('region', currentFilters.region.join(','));
    if (currentFilters.name) params.set('name', currentFilters.name);
    if (currentFilters.client.length > 0)
      params.set('client', currentFilters.client.map((c) => c.id).join(','));
    if (currentFilters.company.length > 0)
      params.set('company', currentFilters.company.map((c) => c.id).join(','));
    if (currentFilters.site.length > 0)
      params.set('site', currentFilters.site.map((s) => s.id).join(','));
    if (currentFilters.startDate) params.set('startDate', currentFilters.startDate.format('YYYY-MM-DD'));
    if (currentFilters.endDate) params.set('endDate', currentFilters.endDate.format('YYYY-MM-DD'));

    const currentPath = window.location.pathname;
    router.replace(`${currentPath}?${params.toString()}`);
  }, [
    table.page,
    table.rowsPerPage,
    table.orderBy,
    table.order,
    table.dense,
    currentFilters,
    router,
  ]);

  // Filter jobs based on user role
  // Note: Backend already filters by worker, so this is mainly for safety
  const filteredJobs = useMemo(() => {
    if (!jobResponse?.jobs) return [];

    // For workers, show jobs where they are assigned and have any valid status
    return jobResponse.jobs.filter((job: IJob) => {
      const workerAssignment = job.workers.find((w: IJobWorker) => w.id === user?.id);
      return (
        workerAssignment &&
        (workerAssignment.status === 'pending' ||
          workerAssignment.status === 'accepted' ||
          workerAssignment.status === 'rejected' ||
          workerAssignment.status === 'cancelled' ||
          workerAssignment.status === 'no_show' ||
          workerAssignment.status === 'called_in_sick')
      );
    });
  }, [jobResponse?.jobs, user?.id]);

  // Calculate tab counts from backend status counts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const statusCounts = jobResponse?.statusCounts || {};

    // Calculate "All" as the sum of all status counts (including cancelled worker status for "My Job List page")
    // Note: accepted (future) and completed (past) are mutually exclusive, so we include both
    // missing_timesheet is a subset of completed, so we don't include it separately
    const allCount =
      (statusCounts.pending || 0) +
      (statusCounts.accepted || 0) +
      (statusCounts.completed || 0) +
      (statusCounts.rejected || 0) +
      (statusCounts.cancelled || 0) +
      (statusCounts.no_show || 0) +
      (statusCounts.called_in_sick || 0);

    STATUS_OPTIONS.forEach((tab) => {
      if (tab.value === 'all') {
        // "All" tab should always show the sum of all statuses
        // This number should remain constant regardless of which tab is selected
        counts[tab.value] = allCount;
      } else if (tab.value === 'pending') {
        counts[tab.value] = statusCounts.pending || 0;
      } else if (tab.value === 'accepted') {
        counts[tab.value] = statusCounts.accepted || 0;
      } else if (tab.value === 'completed') {
        counts[tab.value] = statusCounts.completed || 0;
      } else if (tab.value === 'missing_timesheet') {
        counts[tab.value] = statusCounts.missing_timesheet || 0;
      } else if (tab.value === 'rejected') {
        counts[tab.value] = statusCounts.rejected || 0;
      } else if (tab.value === 'cancelled') {
        counts[tab.value] = statusCounts.cancelled || 0;
      } else if (tab.value === 'no_show') {
        counts[tab.value] = statusCounts.no_show || 0;
      } else if (tab.value === 'called_in_sick') {
        counts[tab.value] = statusCounts.called_in_sick || 0;
      } else {
        counts[tab.value] = 0;
      }
    });

    return counts;
  }, [jobResponse?.statusCounts]);

  // Client-side filtering - only for query search (not sent to backend)
  // Other filters (status, region, company, site, client, dates) are handled by backend
  const dataFiltered = useMemo(() => {
    const { query } = currentFilters;
    let filtered = filteredJobs;

    // Only apply client-side filtering for query search (not sent to backend)
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (job: IJob) =>
          job.job_number?.toString().includes(q) ||
          job.client?.name?.toLowerCase().includes(q) ||
          job.company?.name?.toLowerCase().includes(q) ||
          job.company?.region?.toLowerCase().includes(q) ||
          job.site?.name?.toLowerCase().includes(q) ||
          (job.workers &&
            job.workers.some(
              (w: IJobWorker) =>
                w.first_name?.toLowerCase().includes(q) || w.last_name?.toLowerCase().includes(q)
            ))
      );
    }

    // Note: status, region, company, site, client, and date filters are handled by backend
    // The backend already returns filtered and paginated results

    return filtered;
  }, [filteredJobs, currentFilters]);

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  // Use filtered count for pagination when client-side-only filters are applied (like query search)
  // Otherwise use server-side total count from API
  // Note: Date filters, region, status, client, company, site are now sent to backend
  const hasClientSideOnlyFilters = !!currentFilters.query; // Only query search is client-side only
  const totalCount = hasClientSideOnlyFilters
    ? dataFiltered.length
    : (jobResponse?.pagination?.totalCount ?? dataFiltered.length ?? 0);

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
    } catch (error) {
      console.error(error);
      toast.dismiss(toastId);
      toast.error('Failed to delete some jobs.');
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
          heading="My Job List"
          links={[{ name: 'My Schedule' }, { name: 'Work' }, { name: 'List' }]}
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
                      (tab.value === 'completed' && 'success') ||
                      (tab.value === 'missing_timesheet' && 'warning') ||
                      (tab.value === 'rejected' && 'error') ||
                      (tab.value === 'cancelled' && 'error') ||
                      (tab.value === 'no_show' && 'error') ||
                      (tab.value === 'called_in_sick' && 'warning') ||
                      'default'
                    }
                  >
                    {tabCounts[tab.value] || 0}
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

          <Box sx={{ position: 'relative', display: { xs: 'none', md: 'block' } }}>
            <Scrollbar sx={{ maxHeight: { xs: 600, md: 800 } }}>
              <Table
                size={table.dense ? 'small' : 'medium'}
                sx={{ minWidth: 960, display: { xs: 'none', md: 'table' } }}
              >
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headCells={TABLE_HEAD}
                  onSort={table.onSort}
                />

                <TableBody>
                  {isLoading ? (
                    // Skeleton loading rows
                    Array.from({ length: table.rowsPerPage }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell>
                          <Skeleton variant="text" width="80%" />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width="60%" />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Skeleton variant="circular" width={32} height={32} />
                            <Skeleton variant="text" width="70%" />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width="80%" />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width="90%" />
                        </TableCell>
                        <TableCell>
                          <Skeleton
                            variant="rectangular"
                            width={60}
                            height={24}
                            sx={{ borderRadius: 1 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width="50%" />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="circular" width={32} height={32} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <>
                      {/* Use dataFiltered directly since pagination is handled server-side */}
                      {dataFiltered
                        .filter((row: IJob) => row && row.id)
                        .map((row: IJob) => (
                          <JobTableRow key={row.id} row={row} />
                        ))}

                      <TableEmptyRows
                        height={table.dense ? 56 : 56 + 20}
                        emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                      />

                      <TableNoData notFound={notFound} />
                    </>
                  )}
                </TableBody>
              </Table>
            </Scrollbar>
          </Box>

          {/* Mobile Card View */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Stack spacing={2} sx={{ p: 2 }}>
              {isLoading ? (
                // Skeleton loading cards
                Array.from({ length: 5 }).map((_, index) => (
                  <Card key={`skeleton-card-${index}`} sx={{ p: 2 }}>
                    <Stack spacing={2}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Skeleton variant="text" width="30%" />
                        <Skeleton
                          variant="rectangular"
                          width={60}
                          height={24}
                          sx={{ borderRadius: 1 }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Skeleton variant="circular" width={32} height={32} />
                        <Box>
                          <Skeleton variant="text" width="80%" />
                          <Skeleton variant="text" width="60%" />
                        </Box>
                      </Box>
                      <Box>
                        <Skeleton variant="text" width="70%" />
                        <Skeleton variant="text" width="90%" />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Skeleton variant="text" width="20%" />
                        <Skeleton variant="circular" width={24} height={24} />
                        <Skeleton variant="text" width="40%" />
                      </Box>
                    </Stack>
                  </Card>
                ))
              ) : (
                <>
                  {dataFiltered
                    .filter((row: IJob) => row && row.id)
                    .map((row: IJob) => (
                      <WorkMobileCard key={row.id} row={row} />
                    ))}

                  {totalCount === 0 && (
                    <Box sx={{ width: '100%', py: 4 }}>
                      <EmptyContent
                        filled
                        title="No data"
                        sx={{
                          width: '100%',
                          maxWidth: 'none',
                          '& img': {
                            width: '100%',
                            maxWidth: 'none',
                          },
                        }}
                      />
                    </Box>
                  )}
                </>
              )}
            </Stack>
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

// ----------------------------------------------------------------------

type WorkMobileCardProps = {
  row: IJob;
};

const formatEquipmentType = (type: string) => {
  const option = JOB_EQUIPMENT_OPTIONS.find((opt) => opt.value === type);
  return option?.label || type;
};

function WorkMobileCard({ row }: WorkMobileCardProps) {
  const router = useRouter();
  const { user } = useAuthContext();
  const showWorkers = useBoolean();
  const incidentReportDialog = useBoolean();
  const responseDialog = useBoolean();
  const [flraWarningOpen, setFlraWarningOpen] = useState(false);

  const currentUserWorker = row.workers?.find((w) => w.id === user?.id);
  const isTimesheetManager = row.timesheet_manager_id === user?.id;
  const hasAccepted = currentUserWorker?.status === 'accepted';

  // Check if job only has TCP workers (no LCT workers)
  const isTcpOnlyJob = useMemo(() => {
    if (!row.workers || row.workers.length === 0) {
      // If no workers, check job quantities as fallback
      const quantityLct = row.quantity_lct ?? null;
      const quantityTcp = row.quantity_tcp ?? null;
      return (quantityLct === 0 || quantityLct === null) && 
             (quantityTcp !== null && quantityTcp !== undefined && quantityTcp > 0);
    }
    
    // Check all assigned positions - if all are TCP, it's TCP-only
    const allPositions = row.workers
      .map((w: IJobWorker) => w.position?.toLowerCase())
      .filter(Boolean);
    
    if (allPositions.length === 0) {
      // Fallback to job quantities if no positions found
      const quantityLct = row.quantity_lct ?? null;
      const quantityTcp = row.quantity_tcp ?? null;
      return (quantityLct === 0 || quantityLct === null) && 
             (quantityTcp !== null && quantityTcp !== undefined && quantityTcp > 0);
    }
    
    // Check if any position is LCT or LCT/TCP
    const hasLctPosition = allPositions.some((pos: string) => 
      pos === 'lct' || pos === 'lct/tcp' || pos === 'hwy'
    );
    
    // If no LCT positions and at least one TCP position, it's TCP-only
    return !hasLctPosition && allPositions.some((pos: string) => pos === 'tcp');
  }, [row.workers, row.quantity_lct, row.quantity_tcp]);

  // Use status data from job object (included in API response to avoid N+1 queries)
  const flraStatusData = row.flra_status;
  const timesheetStatusData = row.timesheet_status;
  const tmpStatus = row.tmp_status;

  const flraStatus = flraStatusData?.status || 'not_started';
  const timesheetStatus = timesheetStatusData?.status || 'not_started';
  const flraSubmitted = flraStatus === 'submitted' || flraStatus === 'approved';

  // Calculate TMP status based on worker confirmations and PDF count
  const tmpConfirmed = tmpStatus?.worker_confirmed || false;
  const tmpPdfCount = tmpStatus?.pdf_count || 0;

  const getTmpStatusColor = () => {
    if (tmpPdfCount === 0) {
      return 'info'; // Draft
    }
    return tmpConfirmed ? 'success' : 'warning'; // Confirmed or Pending
  };

  const getTmpStatusLabel = () => {
    if (tmpPdfCount === 0) {
      return 'Draft';
    }
    return tmpConfirmed ? 'Confirmed' : 'Pending';
  };

  const getStatusColor = (status: string) => 
    // Use the utility function for consistent color coding across the app
     getWorkerStatusColor(status)
  ;

  const getFlraTimesheetStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'approved':
        return 'success';
      case 'draft':
        return 'info';
      case 'rejected':
        return 'error';
      case 'in_progress':
        return 'warning';
      case 'not_started':
        return 'default';
      default:
        return 'default';
    }
  };

  const getFlraTimesheetStatusLabel = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Submitted';
      case 'approved':
        return 'Approved';
      case 'draft':
        return 'Draft';
      case 'rejected':
        return 'Rejected';
      case 'in_progress':
        return 'In Progress';
      case 'not_started':
        return 'Not Started';
      default:
        return status;
    }
  };

  const handleTimesheetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TCP-only jobs don't require FLRA, so skip the check
    if (isTcpOnlyJob) {
      // Use timesheet ID, not job ID
      const timesheetId = timesheetStatusData?.id || row.id;
      router.push(paths.schedule.work.timesheet.edit(timesheetId));
      return;
    }
    
    // For jobs with LCT workers, FLRA is required
    if (!flraSubmitted) {
      setFlraWarningOpen(true);
    } else {
      // Use timesheet ID, not job ID
      const timesheetId = timesheetStatusData?.id || row.id;
      router.push(paths.schedule.work.timesheet.edit(timesheetId));
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Toggle the detail section on card click (expand/close)
    showWorkers.onToggle();
  };

  const renderIncidentReportForm = () => (
    <IncidentReportForm
      open={incidentReportDialog.value}
      onClose={incidentReportDialog.onFalse}
      onUpdateSuccess={incidentReportDialog.onFalse}
    />
  );

  return (
    <>
      <Card
        onClick={handleCardClick}
        sx={{
          p: 2,
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: (theme) => theme.shadows[4],
          },
        }}
      >
        <Stack spacing={2}>
          {/* Job Number and Worker Status */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Stack direction="row" alignItems="center" gap={1}>
                <Typography variant="subtitle2" color="primary">
                  Job #{row.job_number}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {(() => {
                  const startTime = currentUserWorker?.start_time || row.start_time;
                  const endTime = currentUserWorker?.end_time || row.end_time;
                  const dateFormatted = fDate(row.start_time);

                  if (startTime && endTime) {
                    const startTimeFormatted = fTime(startTime);
                    const endTimeFormatted = fTime(endTime);
                    const startDateFormatted = fDate(startTime);
                    const endDateFormatted = fDate(endTime);

                    // Check if it's overnight (different dates)
                    if (startDateFormatted !== endDateFormatted) {
                      return `${dateFormatted} ${startTimeFormatted} - ${endDateFormatted} ${endTimeFormatted}`;
                    } else {
                      return `${dateFormatted} ${startTimeFormatted} - ${endTimeFormatted}`;
                    }
                  }

                  return dateFormatted;
                })()}
              </Typography>
            </Box>
            {currentUserWorker?.status === 'pending' ? (
              <Button
                variant="contained"
                onClick={(e) => {
                  e.stopPropagation();
                  responseDialog.onTrue();
                }}
                size="small"
              >
                Respond
              </Button>
            ) : (
              <Label variant="soft" color={getStatusColor(currentUserWorker?.status || '')}>
                {getWorkerStatusLabel(currentUserWorker?.status)}
              </Label>
            )}
          </Box>

          {/* Timesheet Manager Actions - Only show if user is timesheet manager and has accepted */}
          {isTimesheetManager && hasAccepted && (
            <>
              <Divider />
              <Stack spacing={1}>
                {/* FLRA Row - Only show if job has LCT workers (not TCP-only) */}
                {!isTcpOnlyJob && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<Iconify icon="solar:file-text-bold" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Use FLRA ID if it exists, otherwise use job ID to create new
                        const flraId = flraStatusData?.id || row.id;
                        router.push(paths.schedule.work.flra.edit(flraId));
                      }}
                      sx={{ flex: 1 }}
                    >
                      FLRA
                    </Button>
                    <Label
                      variant="soft"
                      color={getFlraTimesheetStatusColor(flraStatus)}
                      sx={{ fontSize: '0.625rem', minWidth: 70 }}
                    >
                      {getFlraTimesheetStatusLabel(flraStatus)}
                    </Label>
                  </Box>
                )}

                {/* TMP Row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<Iconify icon="solar:danger-triangle-bold" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (tmpStatus?.id) {
                        router.push(paths.schedule.work.tmp.detail(tmpStatus.id));
                      }
                    }}
                    sx={{ flex: 1 }}
                  >
                    TMP
                  </Button>
                  <Label
                    variant="soft"
                    color={getTmpStatusColor()}
                    sx={{ fontSize: '0.625rem', minWidth: 70 }}
                  >
                    {getTmpStatusLabel()}
                  </Label>
                </Box>

                {/* Timesheet Row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<Iconify icon="solar:clock-circle-bold" />}
                    onClick={handleTimesheetClick}
                    sx={{ flex: 1 }}
                  >
                    Timesheet
                  </Button>
                  <Label
                    variant="soft"
                    color={getFlraTimesheetStatusColor(timesheetStatus)}
                    sx={{ fontSize: '0.625rem', minWidth: 70 }}
                  >
                    {getFlraTimesheetStatusLabel(timesheetStatus)}
                  </Label>
                </Box>

                {/* Report Job Row */}
                <Box>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Iconify icon="solar:danger-triangle-bold" />}
                    onClick={() => router.push(paths.schedule.incident_report.create(row.id))}
                    fullWidth
                  >
                    Report Job
                  </Button>
                </Box>
              </Stack>
            </>
          )}

          <Divider />

          {/* Client Row */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
              <Avatar
                src={row.client?.logo_url}
                alt={row.client?.name}
                sx={{ width: 32, height: 32, fontSize: '0.875rem', flexShrink: 0 }}
              >
                {row.client?.name?.charAt(0)?.toUpperCase() || 'C'}
              </Avatar>
              <Typography variant="body2" fontWeight="medium">
                {row.client?.name}
              </Typography>
            </Box>
            {/* Show contact number only to timesheet manager */}
            {row.client?.contact_number && isTimesheetManager && (
              <Link
                href={`tel:${row.client.contact_number}`}
                variant="caption"
                color="primary"
                sx={{ 
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  display: 'block',
                  ml: 5
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {formatPhoneNumberSimple(row.client.contact_number)}
              </Link>
            )}
          </Box>

          {/* Site Information */}
          <Box>
            <Typography variant="body2" fontWeight="medium" sx={{ mb: 0.5 }}>
              {row.site?.name}
            </Typography>
            {(row.site?.display_address ||
              (row.site?.street_number && row.site?.street_name && row.site?.city)) &&
              (() => {
                // Helper to build full address if not available
                const buildAddress = () => {
                  if (row.site.display_address) {
                    return row.site.display_address;
                  }
                  // Build from individual fields
                  return [
                    row.site?.unit_number,
                    row.site?.street_number,
                    row.site?.street_name,
                    row.site?.city,
                    row.site?.province,
                    row.site?.postal_code,
                    row.site?.country,
                  ]
                    .filter(Boolean)
                    .join(', ');
                };

                // Format address like "919 292 Sterret, Vancouver BC B1T 2G2"
                const formatAddressDisplay = (address: string) => {
                  // Split by comma
                  const parts = address
                    .split(',')
                    .map((p) => p.trim())
                    .filter(Boolean);

                  // Group parts: [street_parts, city + province + postal]
                  let streetPart = '';
                  let locationPart = '';

                  // Identify where the city part begins by looking for cities
                  const commonCities = [
                    'Vancouver',
                    'Surrey',
                    'Burnaby',
                    'Richmond',
                    'Toronto',
                    'Montreal',
                    'Calgary',
                    'Edmonton',
                    'Ottawa',
                    'Winnipeg',
                    'Quebec City',
                    'Hamilton',
                    'Waterloo',
                    'Halifax',
                    'London',
                  ];
                  let foundCity = false;

                  for (const part of parts) {
                    // Check if this part is likely a city
                    const isCity = commonCities.some(
                      (city) =>
                        part.includes(city) || part.toLowerCase().includes(city.toLowerCase())
                    );

                    if (!foundCity) {
                      if (isCity) {
                        foundCity = true;
                        locationPart = part;
                      } else {
                        if (streetPart) streetPart += ' ';
                        streetPart += part;
                      }
                    } else {
                      if (locationPart) locationPart += ' ';
                      locationPart += part.replace('British Columbia', 'BC').replace('Canada', '');
                    }
                  }

                  // Clean up
                  locationPart = locationPart.replace(/BC BC/g, 'BC').trim();

                  // If we could not split properly, return formatted original
                  if (!foundCity) {
                    return address
                      .replace('British Columbia', 'BC')
                      .replace('Canada', '')
                      .replace(/,\s*,/g, ',')
                      .replace(/^\s*,|,\s*$/g, '')
                      .replace(/,/g, ', ')
                      .replace(/\s+/g, ' ')
                      .trim();
                  }

                  // Join with single comma
                  return `${streetPart}, ${locationPart}`.trim();
                };

                const displayText = formatAddressDisplay(buildAddress());

                // Check if we have complete address fields for Google Maps
                const hasCompleteAddress =
                  row.site.street_number &&
                  row.site.street_name &&
                  row.site.city &&
                  row.site.province &&
                  row.site.postal_code;

                if (hasCompleteAddress) {
                  return (
                    <Link
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        [
                          row.site.unit_number,
                          row.site.street_number,
                          row.site.street_name,
                          row.site.city,
                          row.site.province,
                          row.site.postal_code,
                          row.site.country,
                        ]
                          .filter(Boolean)
                          .join(', ')
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="hover"
                      variant="caption"
                    >
                      {displayText}
                    </Link>
                  );
                }

                return (
                  <Typography variant="caption" color="text.secondary">
                    {displayText}
                  </Typography>
                );
              })()}
          </Box>

          {/* Company Information */}
          {row.company?.name && (
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 0.5 }}
              >
                Customer
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar alt={row.company?.name} sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                  {row.company.name?.charAt(0)?.toUpperCase() || 'C'}
                </Avatar>
                <Typography variant="body2">{row.company.name}</Typography>
              </Box>
            </Box>
          )}

          {/* Job Details and Workers Toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Detail
            </Typography>
            {row.workers && row.workers.length > 0 && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  showWorkers.onToggle();
                }}
                sx={{
                  width: 28,
                  height: 28,
                  p: 0,
                  transform: showWorkers.value ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease-in-out',
                }}
              >
                <Iconify icon="eva:arrow-ios-downward-fill" width={16} />
              </IconButton>
            )}
          </Box>

          {/* Workers Section - Expandable on Mobile */}
          <Collapse in={showWorkers.value}>
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: 'background.neutral',
                borderRadius: 1,
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Typography
                variant="caption"
                fontWeight="medium"
                color="text.primary"
                sx={{ mb: 1.5, display: 'block' }}
              >
                Workers
              </Typography>

              {/* Render workers similar to desktop */}
              {row.workers
                ?.filter((worker) => {
                  const currentUserWorkerStatus = row.workers.find(
                    (w) => w.id === user?.id
                  )?.status;
                  return (
                    worker.id === user?.id ||
                    (currentUserWorkerStatus !== 'rejected' && worker.status === 'accepted')
                  );
                })
                ?.map((item) => {
                  const vehicle = row.vehicles?.find((v) => v.operator?.id === item.id);
                  const positionLabel =
                    JOB_POSITION_OPTIONS.find((option) => option.value === item.position)?.label ||
                    item.position;

                  return (
                    <Box
                      key={item.id}
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: 'background.paper',
                        border: 1,
                        borderColor: 'divider',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                      }}
                    >
                      {/* Worker Header with Avatar Left, Name Center, Position Right */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          src={item?.photo_url ?? undefined}
                          alt={item?.first_name}
                          sx={{ width: 32, height: 32, flexShrink: 0 }}
                        >
                          {item?.first_name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                            <Typography variant="body2" fontWeight="medium">
                              {`${item.first_name || ''} ${item.last_name || ''}`.trim()}
                            </Typography>
                            {item.id === row.timesheet_manager_id && (
                              <Chip
                                label="TM"
                                size="small"
                                color="info"
                                variant="soft"
                                sx={{
                                  height: 18,
                                  fontSize: '0.65rem',
                                  px: 0.5,
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                        <Label variant="soft" color="info">
                          {positionLabel}
                        </Label>
                      </Box>

                      {/* Worker Details - Structured format */}
                      <Box sx={{ mt: 1 }}>
                        {/* Contact */}
                        <Box sx={{ mb: 1 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mb: 0.5 }}
                          >
                            Contact
                          </Typography>
                          <Link
                            href={`tel:${item?.phone_number}`}
                            sx={{ textDecoration: 'none', fontSize: '0.875rem' }}
                          >
                            {formatPhoneNumberSimple(item?.phone_number)}
                          </Link>
                        </Box>

                        {/* Shift */}
                        <Box sx={{ mb: 1 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mb: 0.5 }}
                          >
                            Shift
                          </Typography>
                          <Typography variant="body2">
                            {fTime(item.start_time)} - {fTime(item.end_time)}
                          </Typography>
                        </Box>

                        {/* Vehicle (if assigned) */}
                        {vehicle && (
                          <Box sx={{ mb: 1 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', mb: 0.5 }}
                            >
                              Vehicle
                            </Typography>
                            <Typography variant="body2">
                              {`${vehicle.license_plate || ''} ${vehicle.unit_number ? `- ${vehicle.unit_number}` : ''}`.trim() ||
                                'Not assigned'}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  );
                })}

              {/* Equipment Section - After Workers */}
              {row.equipments && row.equipments.length > 0 && (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 1, fontWeight: 'medium' }}
                  >
                    Equipment
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 1, mb: 0.5 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 'medium' }}
                    >
                      Type
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 'medium' }}
                    >
                      Quantity
                    </Typography>
                  </Box>
                  <Stack spacing={1}>
                    {row.equipments.map((equipment, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {formatEquipmentType(equipment.type)}
                        </Typography>
                        <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'right' }}>
                          {equipment.quantity}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Job Notes Section - After Equipment */}
              {(row.note || row.notes) && (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 1, fontWeight: 'medium' }}
                  >
                    Job Notes
                  </Typography>
                  <Typography variant="body2">{row.note || row.notes}</Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </Stack>

        {/* FLRA Warning Dialog */}
        <Dialog
          open={flraWarningOpen}
          onClose={() => setFlraWarningOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>FLRA Required</DialogTitle>
          <DialogContent>
            <Typography variant="body2">
              You need to submit the FLRA (Field Level Risk Assessment) first before accessing the
              timesheet.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFlraWarningOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              onClick={() => {
                setFlraWarningOpen(false);
                // Use FLRA ID if it exists, otherwise use job ID
                const flraId = flraStatusData?.id || row.id;
                router.push(paths.schedule.work.flra.edit(flraId));
              }}
              variant="contained"
            >
              Go to FLRA
            </Button>
          </DialogActions>
        </Dialog>

        <WorkResponseDialog
          open={responseDialog.value}
          onClose={responseDialog.onFalse}
          jobId={row.id}
          workerId={user?.id || ''}
        />
      </Card>
      {renderIncidentReportForm()}
    </>
  );
}
