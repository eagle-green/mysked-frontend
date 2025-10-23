import type { TableHeadCellProps } from 'src/components/table';

import dayjs from 'dayjs';
import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { fetcher } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  useRejectTimeOffRequest,
  useApproveTimeOffRequest,
  useAdminDeleteTimeOffRequest,
} from 'src/actions/timeOff';

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

import { TIME_OFF_TYPES, TIME_OFF_STATUSES } from 'src/types/timeOff';

import { TimeOffTableRow } from '../time-off-table-row';
import { TimeOffTableToolbar } from '../time-off-table-toolbar';
import { TimeOffTableFiltersResult } from '../time-off-table-filters-result';

// ----------------------------------------------------------------------

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'employee', label: 'Employee' },
  { id: 'type', label: 'Type' },
  { id: 'dateRange', label: 'Date Range' },
  { id: 'status', label: 'Status' },
  { id: 'confirmedBy', label: 'Confirmed By' },
  { id: '', width: 88 },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

// ----------------------------------------------------------------------

const colorByName = (name?: string) => {
  const charAt = name?.charAt(0).toLowerCase();

  if (['a', 'c', 'f'].includes(charAt!)) return 'primary';
  if (['e', 'd', 'h'].includes(charAt!)) return 'secondary';
  if (['i', 'k', 'l'].includes(charAt!)) return 'info';
  if (['m', 'n', 'p'].includes(charAt!)) return 'success';
  if (['q', 's', 't'].includes(charAt!)) return 'warning';
  if (['v', 'x', 'y'].includes(charAt!)) return 'error';

  return 'grey';
};

// ----------------------------------------------------------------------

export function TimeOffListView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize table state from URL parameters
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
    startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : null,
    endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : null,
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

  // Reset page when filters change (but not when table state changes)
  useEffect(() => {
    table.onResetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilters.query, currentFilters.status, currentFilters.type, currentFilters.startDate, currentFilters.endDate]);

  const confirmDialog = useBoolean();
  const detailsDialog = useBoolean();
  const deleteRowsDialog = useBoolean();
  const [selectedTimeOff, setSelectedTimeOff] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'delete' | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  // React Query for fetching time-off list with server-side pagination
  const { data: timeOffResponse } = useQuery({
    queryKey: [
      'all-time-off-requests',
      table.page,
      table.rowsPerPage,
      table.orderBy,
      table.order,
      currentFilters.query,
      currentFilters.status,
      currentFilters.type.join(','),
      currentFilters.startDate?.toISOString(),
      currentFilters.endDate?.toISOString()
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
      
      const response = await fetcher(`/api/time-off/admin/all?${params.toString()}`);
      return response.data;
    },
  });

  // Fetch status counts for tabs
  const { data: statusCountsResponse } = useQuery({
    queryKey: ['time-off-status-counts', currentFilters.query, currentFilters.type, currentFilters.startDate, currentFilters.endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(currentFilters.query && { search: currentFilters.query }),
        ...(currentFilters.type.length > 0 && { type: currentFilters.type.join(',') }),
        ...(currentFilters.startDate && { start_date: currentFilters.startDate.toISOString() }),
        ...(currentFilters.endDate && { end_date: currentFilters.endDate.toISOString() }),
      });
      
      const response = await fetcher(`/api/time-off/admin/counts/status?${params.toString()}`);
      return response;
    },
  });

  // Use the fetched data or fallback to empty array
  const tableData = useMemo(() => timeOffResponse?.timeOffRequests || [], [timeOffResponse]);
  const totalCount = timeOffResponse?.pagination?.totalCount || 0;
  const statusCounts = statusCountsResponse?.data || { all: 0, pending: 0, approved: 0, rejected: 0 };

  // Server-side pagination means no client-side filtering needed
  const dataFiltered = tableData;

  const dateError = !!(
    currentFilters.startDate &&
    currentFilters.endDate &&
    dayjs(currentFilters.startDate).isAfter(currentFilters.endDate)
  );

  const canReset =
    !!currentFilters.query || currentFilters.type.length > 0 || currentFilters.status !== 'all' || currentFilters.startDate || currentFilters.endDate;

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const approveTimeOffRequest = useApproveTimeOffRequest();
  const rejectTimeOffRequest = useRejectTimeOffRequest();
  const adminDeleteTimeOffRequest = useAdminDeleteTimeOffRequest();

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      filters.setState({ status: newValue });
      table.onResetPage();
    },
    [filters, table]
  );

  const handleView = useCallback(
    (timeOff: any) => {
      setSelectedTimeOff(timeOff);
      setAdminNotes('');
      detailsDialog.onTrue();
    },
    [detailsDialog]
  );

  const handleApprove = useCallback(() => {
    if (!selectedTimeOff) return;
    setActionType('approve');
    setActionId(selectedTimeOff.id);
    confirmDialog.onTrue();
  }, [selectedTimeOff, confirmDialog]);

  const handleReject = useCallback(() => {
    if (!selectedTimeOff) return;
    setActionType('reject');
    setActionId(selectedTimeOff.id);
    confirmDialog.onTrue();
  }, [selectedTimeOff, confirmDialog]);

  const handleDelete = useCallback((timeOffId: string) => {
    setActionType('delete');
    setActionId(timeOffId);
    confirmDialog.onTrue();
  }, [confirmDialog]);

  const handleDeleteRows = useCallback(async () => {
    if (table.selected.length === 0) return;

    // Close the dialog immediately to prevent showing "0 time-off request"
    deleteRowsDialog.onFalse();

    try {
      // Filter to only pending requests that can be deleted
      const selectedRequests = tableData.filter((request: any) => 
        table.selected.includes(request.id) && request.status === 'pending'
      );
      
      const nonPendingRequests = tableData.filter((request: any) => 
        table.selected.includes(request.id) && request.status !== 'pending'
      );

      if (nonPendingRequests.length > 0) {
        toast.error(`Cannot delete ${nonPendingRequests.length} request${nonPendingRequests.length > 1 ? 's' : ''} - only pending requests can be deleted.`);
        return;
      }

      if (selectedRequests.length === 0) {
        toast.error('No pending requests selected for deletion.');
        return;
      }

      // Delete each selected pending time-off request sequentially
      let successCount = 0;
      let errorCount = 0;
      
      for (const request of selectedRequests) {
        try {
          await adminDeleteTimeOffRequest.mutateAsync(request.id);
          successCount++;
        } catch (error) {
          console.error(`Error deleting time-off request ${request.id}:`, error);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} time-off request${successCount > 1 ? 's' : ''}`);
        table.onUpdatePageDeleteRows(dataFiltered.length, totalCount);
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to delete ${errorCount} time-off request${errorCount > 1 ? 's' : ''}. Please try again.`);
      }
    } catch (error) {
      console.error('Error in bulk delete operation:', error);
      toast.error('Failed to delete time-off requests. Please try again.');
    }
  }, [adminDeleteTimeOffRequest, table, dataFiltered.length, totalCount, tableData, deleteRowsDialog]);

  const handleConfirmAction = useCallback(async () => {
    if (!actionId || !actionType) return;

    try {
      if (actionType === 'approve') {
        await approveTimeOffRequest.mutateAsync({ id: actionId, admin_notes: adminNotes });
        toast.success('Time-off request approved successfully!');
      } else if (actionType === 'reject') {
        await rejectTimeOffRequest.mutateAsync({ id: actionId, admin_notes: adminNotes });
        toast.success('Time-off request rejected successfully!');
      } else if (actionType === 'delete') {
        await adminDeleteTimeOffRequest.mutateAsync(actionId);
        toast.success('Time-off request deleted successfully!');
      }
      confirmDialog.onFalse();
      detailsDialog.onFalse();
      setActionType(null);
      setActionId(null);
      setSelectedTimeOff(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error processing time-off request:', error);
      toast.error('Failed to process time-off request. Please try again.');
    }
  }, [
    actionId,
    actionType,
    adminNotes,
    approveTimeOffRequest,
    rejectTimeOffRequest,
    adminDeleteTimeOffRequest,
    confirmDialog,
    detailsDialog,
  ]);

  // const handleFilters = useCallback(
  //   (name: string, value: string) => {
  //     table.onResetPage();
  //     filters.setState({ [name]: value });
  //   },
  //   [filters, table]
  // );

  // const handleResetFilters = useCallback(() => {
  //   filters.setState({ query: '', type: [], status: 'all' });
  //   table.onResetPage();
  // }, [filters, table]);

  const denseHeight = table.dense ? 52 : 72;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Time Off Request"
        links={[{ name: 'Management', href: paths.management.root }, { name: 'Time Off Request' }]}
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
                  {statusCounts[tab.value as keyof typeof statusCounts] || 0}
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

        <Box sx={{ position: 'relative' }}>
          <TableSelectedAction
            dense={table.dense}
            numSelected={table.selected.length}
            rowCount={dataFiltered.filter((row: any) => row.status === 'rejected').length}
            onSelectAllRows={(checked) => {
              // Only select/deselect rows with rejected status
              const selectableRowIds = dataFiltered
                .filter((row: any) => row.status === 'rejected')
                .map((row: any) => row.id);
              
              if (checked) {
                // Select all rejected rows
                table.onSelectAllRows(true, selectableRowIds);
              } else {
                // Deselect all rows
                table.onSelectAllRows(false, []);
              }
            }}
            action={
              <Tooltip title="Delete">
                <IconButton 
                  color="primary" 
                  onClick={() => {
                    if (table.selected.length > 0) {
                      deleteRowsDialog.onTrue();
                    }
                  }}
                >
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
                rowCount={totalCount}
                numSelected={table.selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked) => {
                  // Only select/deselect rows with rejected status
                  const selectableRowIds = dataFiltered
                    .filter((row: any) => row.status === 'rejected')
                    .map((row: any) => row.id);
                  
                  if (checked) {
                    // Select all rejected rows
                    table.onSelectAllRows(true, selectableRowIds);
                  } else {
                    // Deselect all rows
                    table.onSelectAllRows(false, []);
                  }
                }}
              />

              <TableBody>
                {dataFiltered.map((row: any) => (
                  <TimeOffTableRow
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

      {/* Confirm Dialog */}
      <TimeOffConfirmDialog
        open={confirmDialog.value}
        onClose={confirmDialog.onFalse}
        actionType={actionType}
        onConfirm={handleConfirmAction}
        loading={approveTimeOffRequest.isPending || rejectTimeOffRequest.isPending || adminDeleteTimeOffRequest.isPending}
      />

      {/* Details Dialog */}
      <TimeOffDetailsDialog
        open={detailsDialog.value}
        onClose={detailsDialog.onFalse}
        timeOff={selectedTimeOff}
        adminNotes={adminNotes}
        onAdminNotesChange={setAdminNotes}
        onApprove={handleApprove}
        onReject={handleReject}
        loading={approveTimeOffRequest.isPending || rejectTimeOffRequest.isPending}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={deleteRowsDialog.value} onClose={deleteRowsDialog.onFalse}>
        <DialogTitle>Delete Time-Off Requests</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{table.selected.length}</strong> time-off request
            {table.selected.length > 1 ? 's' : ''}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={deleteRowsDialog.onFalse} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteRows}
            color="error"
            variant="contained"
            disabled={adminDeleteTimeOffRequest.isPending}
          >
            {adminDeleteTimeOffRequest.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function TimeOffConfirmDialog({
  open,
  onClose,
  actionType,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  actionType: 'approve' | 'reject' | 'delete' | null;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!actionType) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: open ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <Card
        sx={{
          p: 3,
          maxWidth: 400,
          width: '100%',
          mx: 2,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">
            {actionType === 'approve' ? 'Approve' : actionType === 'reject' ? 'Reject' : 'Delete'} Time-Off Request
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Are you sure you want to {actionType} this time-off request?
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={actionType === 'approve' ? 'success' : actionType === 'reject' ? 'error' : 'error'}
            onClick={onConfirm}
            loading={loading}
          >
            {actionType === 'approve' ? 'Approve' : actionType === 'reject' ? 'Reject' : 'Delete'}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}

// ----------------------------------------------------------------------

function TimeOffDetailsDialog({
  open,
  onClose,
  timeOff,
  adminNotes,
  onAdminNotesChange,
  onApprove,
  onReject,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  timeOff: any;
  adminNotes: string;
  onAdminNotesChange: (notes: string) => void;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
}) {
  if (!timeOff) return null;

  // const getTypeColor = (type: string) => {
  //   const timeOffType = TIME_OFF_TYPES.find((t) => t.value === type);
  //   return timeOffType?.color || '#9E9E9E';
  // };

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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Time Off Request Details</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Employee
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: (theme) => {
                      const paletteColor = (theme.palette as any)[colorByName(timeOff.first_name)];
                      return paletteColor?.main || theme.palette.grey[500];
                    },
                  }}
                >
                  {timeOff.first_name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="body1">
                    {timeOff.first_name} {timeOff.last_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {timeOff.email}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Type
              </Typography>
              <Typography variant="body1">
                {TIME_OFF_TYPES.find((t) => t.value === timeOff.type)?.label || timeOff.type}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Date Range
              </Typography>
              <Typography variant="body1">
                {dayjs(timeOff.start_date).isSame(dayjs(timeOff.end_date), 'day')
                  ? dayjs(timeOff.start_date).format('MMM DD, YYYY')
                  : `${dayjs(timeOff.start_date).format('MMM DD, YYYY')} - ${dayjs(timeOff.end_date).format('MMM DD, YYYY')}`}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Status
              </Typography>
              <Label variant="soft" color={getStatusColor(timeOff.status)}>
                {TIME_OFF_STATUSES.find((s) => s.value === timeOff.status)?.label || timeOff.status}
              </Label>
            </Box>

            {timeOff.status === 'approved' && timeOff.confirmed_by ? (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Confirmed By
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Avatar
                    src={timeOff.confirmed_by_photo_url}
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: '0.875rem',
                      bgcolor: (theme) => {
                        const paletteColor = (theme.palette as any)[
                          colorByName(timeOff.confirmed_by_first_name)
                        ];
                        return paletteColor?.main || theme.palette.grey[500];
                      },
                    }}
                  >
                    {timeOff.confirmed_by_first_name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="body2">
                    {timeOff.confirmed_by_first_name} {timeOff.confirmed_by_last_name}
                  </Typography>
                </Box>
              </Box>
            ) : timeOff.status === 'rejected' && timeOff.confirmed_by ? (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Confirmed By
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Avatar
                    src={timeOff.confirmed_by_photo_url}
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: '0.875rem',
                      bgcolor: (theme) => {
                        const paletteColor = (theme.palette as any)[
                          colorByName(timeOff.confirmed_by_first_name)
                        ];
                        return paletteColor?.main || theme.palette.grey[500];
                      },
                    }}
                  >
                    {timeOff.confirmed_by_first_name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="body2">
                    {timeOff.confirmed_by_first_name} {timeOff.confirmed_by_last_name}
                  </Typography>
                </Box>
              </Box>
            ) : null}
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Reason
            </Typography>
            <Typography
              variant="body1"
              sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}
            >
              {timeOff.reason}
            </Typography>
          </Box>

          {timeOff.status === 'pending' && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Admin Notes
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={adminNotes}
                onChange={(e) => onAdminNotesChange(e.target.value)}
                placeholder="Add notes (optional)..."
                variant="outlined"
              />
            </Box>
          )}

          {timeOff.status !== 'pending' && timeOff.admin_notes && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Admin Notes
              </Typography>
              <Typography
                variant="body1"
                sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}
              >
                {timeOff.admin_notes}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        {timeOff.status === 'pending' && (
          <>
            <Button variant="contained" color="error" onClick={onReject} disabled={loading}>
              Reject
            </Button>
            <Button variant="contained" color="success" onClick={onApprove} disabled={loading}>
              Approve
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
