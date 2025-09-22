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
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { fetcher } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  useDeleteTimeOffRequest,
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

import { TimeOffTableToolbar } from 'src/sections/management/time-off/time-off-table-toolbar';
import { TimeOffTableFiltersResult } from 'src/sections/management/time-off/time-off-table-filters-result';

import { TIME_OFF_TYPES } from 'src/types/timeOff';

import { WorkerTimeOffTableRow } from '../worker-time-off-table-row';

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
    defaultDense: searchParams.get('dense') === 'false' ? false : true,
    defaultOrder: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
    defaultOrderBy: searchParams.get('orderBy') || 'created_at',
    defaultRowsPerPage: parseInt(searchParams.get('rowsPerPage') || '25', 10),
    defaultCurrentPage: parseInt(searchParams.get('page') || '1', 10) - 1,
  });
  const confirmDialog = useBoolean();
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  // React Query for fetching time-off list with server-side pagination
  const { data: timeOffResponse } = useQuery({
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
      
      const response = await fetcher(`/api/time-off?${params.toString()}`);
      return response.data;
    },
  });

  // Use the fetched data or fallback to empty array
  const timeOffRequests = useMemo(() => timeOffResponse?.timeOffRequests || [], [timeOffResponse]);
  const totalCount = timeOffResponse?.pagination?.totalCount || 0;

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
          links={[{ name: 'My Schedule', href: paths.schedule.root }, { name: 'Time Off Request' }]}
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

          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={totalCount}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  dataFiltered.map((row: any) => row.id)
                )
              }
              action={
                <Tooltip title="Delete">
                  <IconButton color="primary" onClick={() => {}}>
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
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      dataFiltered.map((row: any) => row.id)
                    )
                  }
                />

                <TableBody>
                  {dataFiltered.map((row: any) => (
                    <WorkerTimeOffTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(row.id)}
                      onSelectRow={() => table.onSelectRow(row.id)}
                      onDeleteRow={handleDeleteRow}
                    />
                  ))}

                  <TableEmptyRows
                    height={denseHeight}
                    emptyRows={emptyRows(0, table.rowsPerPage, dataFiltered.length)}
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
            rowsPerPageOptions={[10, 25, 50, 100]}
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
