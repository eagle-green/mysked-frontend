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

import { useRouter, useSearchParams } from 'src/routes/hooks';

import { fDate, fTime, fIsAfter } from 'src/utils/format-time';
import { formatPhoneNumberSimple } from 'src/utils/format-number';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { regionList, WORK_STATUS_OPTIONS } from 'src/assets/data';
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

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  ...WORK_STATUS_OPTIONS,
  { value: 'cancelled', label: 'Cancelled' },
];

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

export default function WorkListView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const table = useTable({
    defaultDense: true,
    defaultOrder: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
    defaultOrderBy: searchParams.get('orderBy') || 'created_at',
    defaultRowsPerPage: parseInt(searchParams.get('rowsPerPage') || '25', 10),
    defaultCurrentPage: parseInt(searchParams.get('page') || '1', 10) - 1,
  });
  const { user } = useAuthContext();
  const confirmDialog = useBoolean();
  const [isDeleting, setIsDeleting] = useState(false);

  // React Query for fetching job list with pagination
  const {
    data: jobResponse,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ['jobs', table.page, table.rowsPerPage, table.orderBy, table.order],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (table.page + 1).toString(),
        limit: table.rowsPerPage.toString(),
        orderBy: table.orderBy || 'created_at',
        order: table.order || 'desc',
      });

      const response = await fetcher(`${endpoints.work.job}/user?is_open_job=false&${params}`);
      return response.data;
    },
  });

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

  const dateError = fIsAfter(currentFilters.startDate, currentFilters.endDate);
  const totalCount = jobResponse?.total || 0;

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
    if (currentFilters.client.length > 0) params.set('client', currentFilters.client.join(','));
    if (currentFilters.company.length > 0) params.set('company', currentFilters.company.join(','));
    if (currentFilters.site.length > 0) params.set('site', currentFilters.site.join(','));
    if (currentFilters.startDate) params.set('startDate', currentFilters.startDate.toISOString());
    if (currentFilters.endDate) params.set('endDate', currentFilters.endDate.toISOString());

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
  const filteredJobs = useMemo(() => {
    if (!jobResponse?.jobs) return [];

    // For workers, show jobs where they are assigned and status is pending, accepted, rejected, or cancelled
    return jobResponse.jobs.filter((job: IJob) => {
      const workerAssignment = job.workers.find((w: IJobWorker) => w.id === user?.id);
      return (
        workerAssignment &&
        (workerAssignment.status === 'pending' ||
          workerAssignment.status === 'accepted' ||
          workerAssignment.status === 'rejected' ||
          workerAssignment.status === 'cancelled')
      );
    });
  }, [jobResponse?.jobs, user?.id]);

  const dataFiltered = useMemo(() => {
    const { query, status, region, company, site, client, startDate, endDate } = currentFilters;

    let filtered = filteredJobs;

    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (job: IJob) =>
          job.client?.name?.toLowerCase().includes(q) ||
          job.company?.name?.toLowerCase().includes(q) ||
          job.company?.region?.toLowerCase().includes(q) ||
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
      filtered = filtered.filter((job: IJob) => region.includes(job.company?.region));
    }

    if (company.length > 0) {
      filtered = filtered.filter((job: IJob) =>
        company.some((selectedCompany: string) =>
          job.company?.name?.toLowerCase().includes(selectedCompany.toLowerCase())
        )
      );
    }

    if (site.length > 0) {
      filtered = filtered.filter((job: IJob) =>
        site.some((selectedSite: string) =>
          job.site?.name?.toLowerCase().includes(selectedSite.toLowerCase())
        )
      );
    }

    if (client.length > 0) {
      filtered = filtered.filter((job: IJob) =>
        client.some((selectedClient: string) =>
          job.client?.name?.toLowerCase().includes(selectedClient.toLowerCase())
        )
      );
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
                      (tab.value === 'cancelled' && 'error') ||
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
                        // For cancelled tab, we want to show jobs where the worker has been cancelled
                        if (tab.value === 'cancelled') {
                          return workerAssignment?.status === 'cancelled';
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

          <Box sx={{ position: 'relative', display: { xs: 'none', md: 'block' } }}>
            <Scrollbar>
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
                      </TableRow>
                    ))
                  ) : (
                    <>
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

                  {dataFiltered.length === 0 && (
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
  const { user } = useAuthContext();
  const showWorkers = useBoolean();
  const responseDialog = useBoolean();

  const currentUserWorker = row.workers?.find((w) => w.id === user?.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
      case 'cancelled':
        return 'error';
      case 'in_progress':
        return 'info';
      case 'completed':
        return 'success';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Toggle the detail section on card click (expand/close)
    showWorkers.onToggle();
  };

  return (
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
            <Typography variant="subtitle2" color="primary">
              Job #{row.job_number}
            </Typography>
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
              {currentUserWorker?.status
                ? currentUserWorker.status.charAt(0).toUpperCase() +
                  currentUserWorker.status.slice(1)
                : ''}
            </Label>
          )}
        </Box>

        <Divider />

        {/* Client Row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            src={row.client?.logo_url}
            alt={row.client?.name}
            sx={{ width: 32, height: 32, fontSize: '0.875rem' }}
          >
            {row.client?.name?.charAt(0)?.toUpperCase() || 'C'}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {row.client?.name}
            </Typography>
          </Box>
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
                    (city) => part.includes(city) || part.toLowerCase().includes(city.toLowerCase())
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
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
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
                const currentUserWorkerStatus = row.workers.find((w) => w.id === user?.id)?.status;
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
                        <Typography variant="body2" fontWeight="medium">
                          {`${item.first_name || ''} ${item.last_name || ''}`.trim()}
                        </Typography>
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
      <WorkResponseDialog
        open={responseDialog.value}
        onClose={responseDialog.onFalse}
        jobId={row.id}
        workerId={user?.id || ''}
      />
    </Card>
  );
}
