import type { TableHeadCellProps } from 'src/components/table';

import dayjs from 'dayjs';
import { useState, useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';
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
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  useGetTimeOffRequests,
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
  rowInPage,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { TimeOffTableToolbar } from 'src/sections/management/time-off/time-off-table-toolbar';
import { TimeOffTableFiltersResult } from 'src/sections/management/time-off/time-off-table-filters-result';

import { TIME_OFF_TYPES } from 'src/types/timeOff';

import { WorkerTimeOffTableRow } from './worker-time-off-table-row';

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

function applyFilter({
  inputData,
  comparator,
  filters,
}: {
  inputData: any[];
  comparator: (a: any, b: any) => number;
  filters: any;
}) {
  const { query, status, type, startDate, endDate } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (query) {
    inputData = inputData.filter(
      (request) =>
        request.reason.toLowerCase().includes(query.toLowerCase()) ||
        request.type.toLowerCase().includes(query.toLowerCase())
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((request) => request.status === status);
  }

  if (type.length) {
    inputData = inputData.filter((request) => type.includes(request.type));
  }

  if (startDate && endDate) {
    inputData = inputData.filter((request) => {
      const requestStart = dayjs(request.start_date);
      const requestEnd = dayjs(request.end_date);
      const filterStart = dayjs(startDate);
      const filterEnd = dayjs(endDate);

      return (
        ((requestStart.isSame(filterStart) || requestStart.isAfter(filterStart)) &&
          (requestStart.isSame(filterEnd) || requestStart.isBefore(filterEnd))) ||
        ((requestEnd.isSame(filterStart) || requestEnd.isAfter(filterStart)) &&
          (requestEnd.isSame(filterEnd) || requestEnd.isBefore(filterEnd))) ||
        (requestStart.isBefore(filterStart) && requestEnd.isAfter(filterEnd))
      );
    });
  }

  return inputData;
}

// ----------------------------------------------------------------------

export function WorkerTimeOffListView() {
  const table = useTable();
  const confirmDialog = useBoolean();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { timeOffRequests } = useGetTimeOffRequests();
  const deleteTimeOffRequest = useDeleteTimeOffRequest();
  // const updateTimeOffRequest = useUpdateTimeOffRequest();

  const filters = useSetState({
    query: '',
    type: [],
    status: 'all',
    startDate: null,
    endDate: null,
  });
  const { state: currentFilters } = filters;

  const dateError =
    currentFilters.startDate &&
    currentFilters.endDate &&
    dayjs(currentFilters.startDate).isAfter(currentFilters.endDate);

  const dataFiltered = applyFilter({
    inputData: timeOffRequests,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!currentFilters.query ||
    currentFilters.type.length > 0 ||
    currentFilters.status !== 'all' ||
    currentFilters.startDate ||
    currentFilters.endDate;

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
  }, [deleteId, deleteTimeOffRequest, confirmDialog]);

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
                  {dataInPage.map((row) => (
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
