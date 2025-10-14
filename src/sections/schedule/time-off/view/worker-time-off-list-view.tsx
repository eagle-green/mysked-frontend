import type { TableHeadCellProps } from 'src/components/table';

import dayjs from 'dayjs';
import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useBoolean, usePopover, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { fDate } from 'src/utils/format-time';

import { fetcher } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetUserTimeOffDates ,
  useDeleteTimeOffRequest,
} from 'src/actions/timeOff';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { CustomPopover } from 'src/components/custom-popover';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { TimeOffTableToolbar } from 'src/sections/management/time-off/time-off-table-toolbar';
import { TimeOffTableFiltersResult } from 'src/sections/management/time-off/time-off-table-filters-result';

import { TIME_OFF_TYPES, TIME_OFF_STATUSES } from 'src/types/timeOff';

import { WorkerTimeOffTableRow } from '../worker-time-off-table-row';
import { WorkerTimeOffQuickEditForm } from '../worker-time-off-quick-edit-form';

// ----------------------------------------------------------------------

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'type', label: 'Type' },
  { id: 'dateRange', label: 'Date Range' },
  { id: 'reason', label: 'Reason' },
  { id: 'created_at', label: 'Requested' },
  { id: 'status', label: 'Status' },
  { id: '', width: 88 },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

// ----------------------------------------------------------------------

export function WorkerTimeOffListView() {
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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Quick edit form state
  const quickEditForm = useBoolean();
  const [currentTimeOff, setCurrentTimeOff] = useState<any>(null);

  const filters = useSetState({
    query: searchParams.get('search') || '',
    type: searchParams.get('type') ? searchParams.get('type')!.split(',') : [],
    status: searchParams.get('status') || 'all',
    startDate: searchParams.get('startDate') ? dayjs(searchParams.get('startDate')!) : null,
    endDate: searchParams.get('endDate') ? dayjs(searchParams.get('endDate')!) : null,
  });
  const { state: currentFilters } = filters;

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
    if (currentFilters.type.length > 0) params.set('type', currentFilters.type.join(','));
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
  }, [currentFilters.query, currentFilters.status, currentFilters.type, currentFilters.startDate, currentFilters.endDate, table]);

  // Alternative: try using the existing useGetUserTimeOffDates hook  
  const { data: userTimeOffData, isLoading: userTimeOffLoading } = useGetUserTimeOffDates();

  // React Query for fetching time-off list with server-side pagination
  const { data: timeOffResponse, isLoading, refetch } = useQuery({
    queryKey: ['time-off-requests', table.page, table.rowsPerPage, table.orderBy, table.order, currentFilters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (table.page + 1).toString(),
        rowsPerPage: table.rowsPerPage.toString(),
        orderBy: table.orderBy,
        order: table.order,
        ...(currentFilters.status !== 'all' && { status: currentFilters.status }),
        ...(currentFilters.query && { search: currentFilters.query }),
        ...(currentFilters.type.length > 0 && { type: currentFilters.type.join(',') }),
        ...(currentFilters.startDate && { startDate: currentFilters.startDate.toISOString() }),
        ...(currentFilters.endDate && { endDate: currentFilters.endDate.toISOString() }),
      });
      
      const response = await fetcher(`/api/time-off/user-dates?${params.toString()}`);
      return response; // Return the full response to check structure
    },
  });

  // Fall back to the alternative approach if primary is not working
  const timeOffRequests = useMemo(() => {
    // Use the complex filtering as primary
    if (timeOffResponse) {
      if (timeOffResponse.data && Array.isArray(timeOffResponse.data)) {
        return timeOffResponse.data;
      }
      if (Array.isArray(timeOffResponse)) {
        return timeOffResponse;
      }
    }
    // Fall back to the simpler approach
    if (userTimeOffData) {
      return Array.isArray(userTimeOffData) ? userTimeOffData : [];
    }
    return [];
  }, [timeOffResponse, userTimeOffData]);

  const totalCount = timeOffRequests.length;
  const isCurrentlyLoading = isLoading || userTimeOffLoading;

  // Server-side pagination means no client-side filtering needed
  const dataFiltered = timeOffRequests;

  const dateError: boolean = !!(
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

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      filters.setState({ status: newValue });
      table.onResetPage();
    },
    [filters, table]
  );

  const handleDeleteRow = useCallback(
    (id: string) => {
      setDeleteId(id);
      confirmDialog.onTrue();
    },
    [confirmDialog]
  );

  const handleQuickEdit = useCallback(
    (timeOff: any) => {
      setCurrentTimeOff(timeOff);
      quickEditForm.onTrue();
    },
    [quickEditForm]
  );

  const deleteTimeOffRequest = useDeleteTimeOffRequest();

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteId) return;

    try {
      await deleteTimeOffRequest.mutateAsync(deleteId);
      toast.success('Time-off request deleted successfully!');
      confirmDialog.onFalse();
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting time-off request:', error);
      toast.error('Failed to delete time-off request. Please try again.');
    }
  }, [deleteId, confirmDialog, deleteTimeOffRequest]);

  // const handleFilters = useCallback(
  //   (name: string, value: any) => {
  //     table.onResetPage();
  //     filters.setState({ [name]: value });
  //   },
  //   [filters, table]
  // );

  // const handleResetFilters = useCallback(() => {
  //   filters.setState({ query: '', type: [], status: 'all', startDate: null, endDate: null });
  //   table.onResetPage();
  // }, [filters, table]);

  const denseHeight = table.dense ? 52 : 72;

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const renderConfirmDialog = () => (
    <Dialog open={confirmDialog.value} onClose={confirmDialog.onFalse}>
      <DialogTitle>Delete Time-Off Request</DialogTitle>
      <DialogContent>
        <Typography>Are you sure you want to delete this time-off request?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={confirmDialog.onFalse}>Cancel</Button>
        <Button color="error" onClick={handleConfirmDelete}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );



  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="My Time Off Request"
          links={[{ name: 'My Schedule' }, { name: 'Time Off Request' }, { name: 'List' }]}
          action={
            <Button
              component={RouterLink}
              href={paths.schedule.timeOff.create}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              New Request
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
                      (tab.value === 'pending' && 'warning') ||
                      (tab.value === 'approved' && 'success') ||
                      (tab.value === 'rejected' && 'error') ||
                      'default'
                    }
                  >
                    {['pending', 'approved', 'rejected'].includes(tab.value)
                      ? timeOffRequests.filter((request: any) => request.status === tab.value)
                          .length
                      : timeOffRequests.length}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <TimeOffTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            options={{ types: TIME_OFF_TYPES }}
            dateError={!!dateError}
          />

          {canReset && (
            <TimeOffTableFiltersResult
              filters={filters}
              totalResults={totalCount}
              onResetPage={table.onResetPage}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          {/* Desktop Table Container */}
          <Box sx={{ position: 'relative', display: { xs: 'none', md: 'block' } }}>
            {/* Desktop Table View */}
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
                  {isCurrentlyLoading ? (
                    Array.from({ length: table.rowsPerPage }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell><Skeleton variant="text" width="80%" /></TableCell>
                        <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                        <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                        <TableCell><Skeleton variant="text" width="90%" /></TableCell>
                        <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                        <TableCell><Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} /></TableCell>
                        <TableCell><Skeleton variant="text" width="40%" /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <>
                      {dataFiltered.map((row: any) => (
                        <WorkerTimeOffTableRow
                          key={row.id}
                          row={row}
                          onDeleteRow={handleDeleteRow}
                        />
                      ))}
                      <TableEmptyRows
                        height={denseHeight}
                        emptyRows={emptyRows(0, table.rowsPerPage, dataFiltered.length)}
                      />
                      <TableNoData notFound={notFound} />
                    </>
                  )}
                </TableBody>
              </Table>
            </Scrollbar>
          </Box>

          {/* Mobile Card Container */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Stack spacing={2} sx={{ p: 2 }}>
              {isCurrentlyLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <Card key={`skeleton-card-${index}`} sx={{ p: 2 }}>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Skeleton variant="text" width="30%" />
                        <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
                      </Box>
                      <Box><Skeleton variant="text" width="70%" /></Box>
                      <Box><Skeleton variant="text" width="90%" /></Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Skeleton variant="text" width="40%" />
                        <Skeleton variant="text" width="20%" />
                      </Box>
                    </Stack>
                  </Card>
                ))
              ) : dataFiltered && dataFiltered.length > 0 ? (
                <>
                  {dataFiltered.map((row: any) => (
                    <TimeOffMobileCard
                      key={row.id}
                      row={row}
                      onDelete={handleDeleteRow}
                      onQuickEdit={handleQuickEdit}
                    />
                  ))}
                </>
              ) : (
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
                      }
                    }} 
                  />
                </Box>
              )}
            </Stack>
          </Box>

          <TablePaginationCustom
            page={table.page}
            dense={table.dense}
            count={totalCount}
            rowsPerPage={table.rowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            onPageChange={table.onChangePage}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      {renderConfirmDialog()}
      
      <WorkerTimeOffQuickEditForm
        currentTimeOff={currentTimeOff}
        open={quickEditForm.value}
        onClose={() => {
          quickEditForm.onFalse();
          setCurrentTimeOff(null);
        }}
        onUpdateSuccess={refetch}
      />
    </>
  );
}

// ----------------------------------------------------------------------
// Mobile Card Component

type TimeOffMobileCardProps = {
  row: any;
  onDelete: (id: string) => void;
  onQuickEdit: (timeOff: any) => void;
};

function TimeOffMobileCard({ row, onDelete, onQuickEdit }: TimeOffMobileCardProps) {
  const router = useRouter();
  const menuActions = usePopover();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTypeInfo = (type: string) => TIME_OFF_TYPES.find((t) => t.value === type) || { label: type, color: '#666' };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = fDate(startDate);
    const end = fDate(endDate);

    if (start === end) {
      return start;
    }
    return `${start} - ${end}`;
  };

  const handleEdit = () => {
    router.push(paths.schedule.timeOff.edit(row.id));
    menuActions.onClose();
  };

  const handleDelete = () => {
    onDelete(row.id);
    menuActions.onClose();
  };

  const isPending = row.status === 'pending';

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <MenuItem onClick={handleEdit}>
          <Iconify icon="solar:pen-bold" />
          Edit
        </MenuItem>

        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Iconify icon="solar:trash-bin-trash-bold" />
          Delete
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  return (
    <Card sx={{ 
      p: 2, 
      cursor: 'default', 
      transition: 'all 0.2s',
      '&:hover': {
        boxShadow: (theme) => theme.shadows[4],
      }
    }}>
      <Stack spacing={2}>
        {/* Header with Type, Status, and Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="subtitle2" color="primary">
              {getTypeInfo(row.type).label}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Label variant="soft" color={getStatusColor(row.status)}>
              {TIME_OFF_STATUSES.find((s) => s.value === row.status)?.label || row.status}
            </Label>
            {isPending && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <Tooltip title="Quick Edit" placement="top" arrow>
                  <IconButton
                    size="small"
                    color="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickEdit(row);
                    }}
                  >
                    <Iconify icon="solar:pen-bold" />
                  </IconButton>
                </Tooltip>

                <IconButton 
                  size="small"
                  color={menuActions.open ? 'inherit' : 'default'} 
                  onClick={(e) => {
                    e.stopPropagation();
                    menuActions.onOpen(e);
                  }}
                >
                  <Iconify icon="eva:more-vertical-fill" />
                </IconButton>
              </Box>
            )}
          </Box>
        </Box>

        <Divider />

        {/* Date Range */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Date Range
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {formatDateRange(row.start_date, row.end_date)}
          </Typography>
        </Box>

        {/* Reason */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Reason
          </Typography>
          <Typography 
            variant="body2"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {row.reason || 'No reason provided'}
          </Typography>
        </Box>

        {/* Request Date */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Requested: {fDate(row.created_at)}
          </Typography>
        </Box>
      </Stack>
      {isPending && renderMenuActions()}
    </Card>
  );
}
