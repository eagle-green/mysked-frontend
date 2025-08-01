import type { IJobWorker } from 'src/types/job';
import type { TableHeadCellProps } from 'src/components/table';

import dayjs from 'dayjs';
import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useCallback } from 'react';
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
import { RouterLink } from 'src/routes/components';

import { fIsAfter } from 'src/utils/format-time';
import { findInString, isDevMode } from 'src/utils/timecard-helpers';

import { _timesheet } from 'src/_mock/_timesheet';
import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { TIMESHEET_STATUS_OPTIONS, TIMESHEET_TABLE_HEADER } from 'src/assets/data';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from "src/components/custom-breadcrumbs";
import {
  useTable,
  emptyRows,
  rowInPage,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
  TableSelectedAction,
  getComparator,
} from 'src/components/table';

import { useAuthContext } from 'src/auth/hooks';

import { ITimeCardFilters, TimecardEntry, TimeCardStatus, ITimeSheetTableView } from 'src/types/timecard';

import { TimeSheetTableRow } from '../timesheet-table-row';
import { TimeSheetToolBar } from "../timesheet-table-toolbar";
import { TimeSheetTableFiltersResult } from '../timesheet-table-filter-result';
import { DELETE_INPROGRESS, DELETE_METHOD, DELETE_SUCCESS, ERROR_DELETE_MESSAGE, FILTER_ALL } from '../constant';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [...TIMESHEET_STATUS_OPTIONS];
const TABLE_HEAD: TableHeadCellProps[] = TIMESHEET_TABLE_HEADER;

/**
 * Method use to render TimeSheetView
 * @returns JSX Elemement TimeSheetView
 */
export default function TimeSheelListView() {
   const table = useTable();
   const { user } = useAuthContext();
   const confirmDialog = useBoolean();
   const [isDeleting, setIsDeleting] = useState(false);

   // React Query for fetching job list
   const { data: timesheetData, refetch } = useQuery({
      queryKey: ['timesheets'],
      queryFn: async () => {
         //TODO:: [MYS-49] - Removing this mock data if the API is ready
         if (isDevMode()) {
            return new Promise<ITimeSheetTableView[]>((resolve, reject) => {
               try {
                  const mock = _timesheet as unknown as TimecardEntry[];
                  const mapped = mock.map((tc: TimecardEntry) => {
                     const { job } = tc;
                     const worker = job.workers.find((w: IJobWorker) => w.user_id === w.id);
                     const data = {
                     id: tc.id,
                     siteName: job.company.name,
                     clientName: job?.client?.name || '',
                     clientLogo: job?.client?.logo_url ?? undefined,
                     jobNumber: job.job_number,
                     startDate: worker?.start_time || job.start_time,
                     endDate: worker?.end_time || job.end_time,
                     duration: tc.shiftTotalHrs || 0,
                     status: tc.status,
                     job,
                     company: job.company
                     };
                     return data;
                  });
                  resolve(mapped);
               } catch (err) {
                  console.error('Failed to process mock data:', err);
                  reject(err);
               }
            });
         } else {
            const response = await fetcher(endpoints.timesheet + '/user');
            return response.data.timesheets;
         }
      }
   });

   const filters = useSetState<ITimeCardFilters>({
      query: '',
      status: 'all',
      endDate: null,
      startDate: null,
   });

   const { state: currentFilters, setState: updateFilters } = filters;

   const dateError = fIsAfter(currentFilters.startDate, currentFilters.endDate);

   // Filter timesheet based on user role
   const filterTimeCard = useMemo(() => {
      if (!timesheetData) return [];
      // For workers, show timesheet where they are assigned and regardless of status
      return timesheetData.filter((ts: ITimeSheetTableView) => {
         //[TODO]:: remove user filter if using mock data for testing purposes
         const timesheet = ts.job.workers.find((w: IJobWorker) => w.user_id === w.id);
         return timesheet !== null;
      }) as ITimeSheetTableView[];
   }, [timesheetData, user?.id]);

   const dataFiltered = applyTimeSheetFilter({
      inputData: filterTimeCard,
      comparator: getComparator(table.order, table.orderBy),
      filters: currentFilters
   });
      
   const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

   const canReset =
      !!currentFilters.query || currentFilters.status !== FILTER_ALL;

   const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

   const handleDeleteRows = useCallback(async () => {
      setIsDeleting(true);
      const toastId = toast.loading(DELETE_INPROGRESS);
      try {
         if (!isDevMode()) {
            await fetcher([
               endpoints.timesheet,
               {
                  method: DELETE_METHOD,
                  data: { ids: table.selected },
               },
            ]);
         }
         toast.dismiss(toastId);
         toast.success(DELETE_SUCCESS);
         refetch();
         table.onUpdatePageDeleteRows(dataInPage.length, dataFiltered.length);
         confirmDialog.onFalse();
      } catch (error) {
         console.error(error);
         toast.dismiss(toastId);
         toast.error(ERROR_DELETE_MESSAGE);
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
      <Dialog
         open={confirmDialog.value}
         onClose={confirmDialog.onFalse}
         maxWidth="xs"
         fullWidth
      >
      <DialogTitle>Delete Timesheet</DialogTitle>
         <DialogContent>
            Are you sure you want to delete <strong>{table.selected.length}</strong> timesheet 
            {table.selected.length > 1 ? 's' : ''}?
         </DialogContent>
      <DialogActions>
         <Button
            onClick={confirmDialog.onFalse}
            disabled={isDeleting}
            sx={{ mr: 1 }}
         >
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

   const handleDeleteRow = useCallback(
      async (id: string) => {
      const toastId = toast.loading(DELETE_INPROGRESS);
      try {
         const response = await fetcher([`${endpoints.timesheet}/${id}`, { method: DELETE_METHOD }]);
         toast.dismiss(toastId);
         toast.success(DELETE_SUCCESS);
         setTimeout(() => {
            if (response.deletedSelf) {
            window.location.href = '/';
            return;
            }
         }, 1000);

         refetch();
         table.onUpdatePageDeleteRow(dataInPage.length);
      } catch (error) {
         console.error(error);
         toast.dismiss(toastId);
         toast.error(ERROR_DELETE_MESSAGE);
      }
      },
      [dataInPage.length, table, refetch]
   );

   return(
      <>
         <DashboardContent>
            <CustomBreadcrumbs
               heading="Timesheet"
               links={[
                  { name: 'Schedule' }, 
                  { name: 'List' }
               ]}
               // action={
               //    <Button
               //    component={RouterLink}
               //    href={paths.schedule.timesheet.recording}
               //    variant="contained"
               //    startIcon={<Iconify icon="mingcute:add-line" />}
               //    >
               //    New Timesheet
               //    </Button>
               // }
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
                              (tab.value === TimeCardStatus.DRAFT && 'secondary') ||
                              (tab.value === TimeCardStatus.SUBMITTED && 'info') ||
                              (tab.value === TimeCardStatus.APPROVED && 'success') ||
                              (tab.value === TimeCardStatus.REJECTED && 'error') ||
                              'default'
                           }
                        >
                           {
                              filterTimeCard.filter(
                                 (tc: ITimeSheetTableView) => tab.value === FILTER_ALL ? true : tc.status === tab.value
                              ).length
                           }
                        </Label>
                     }
                  />
                  ))}
               </Tabs>

               <TimeSheetToolBar
                  filters={filters}
                  onResetPage={table.onResetPage}
                  dateError={dateError}
               />

               {canReset && (
                  <TimeSheetTableFiltersResult
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
                           <IconButton color="primary" onClick={confirmDialog.onTrue}>
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
                           {dataFiltered
                              .slice(
                                 table.page * table.rowsPerPage,
                                 table.page * table.rowsPerPage + table.rowsPerPage
                              )
                              .filter((row: ITimeSheetTableView) => row && row.id)
                              .map((row: ITimeSheetTableView) => (
                                 <TimeSheetTableRow 
                                    key={row.id} row={row}
                                    selected={table.selected.includes(row.id)}
                                    recordingLink={paths.schedule.timesheet.edit(row.id)}
                                    onSelectRow={() => table.onSelectRow(row.id)}
                                    onDeleteRow={() => handleDeleteRow(row.id)}
                                 />
                              ))
                           }
                     
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
  inputData: ITimeSheetTableView[];
  filters: ITimeCardFilters;
  comparator: (a: any, b: any) => number;
};

/**
 * Method to apply timesheet filters & sorting
 * @param { ApplyFilterProps }
 * @returns 
 */
function applyTimeSheetFilter({ inputData, comparator, filters }: ApplyFilterProps) {

   const { query, status, startDate, endDate } = filters;

   const dateError = fIsAfter(startDate, endDate);

   const timesheetTableData = inputData.map((el, index) => [el, index] as const);

   const sortedTimeSheetData = timesheetTableData.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
   });

   let filtered: ITimeSheetTableView[] = sortedTimeSheetData.map((el) => el[0]);

   if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
         (tc: ITimeSheetTableView) => (
         findInString(q, tc.clientName) ||
         findInString(q, tc.company?.region) ||
         findInString(q, tc.siteName) ||
         findInString(q, tc.jobNumber) ||
         (tc.job.workers.length && tc.job.workers.some(
            (w: IJobWorker) => findInString(q, w.first_name) ||
            findInString(q, w.last_name)
         )
      )))
   }

   if (status !== 'all') {
      filtered = filtered.filter((tc: ITimeSheetTableView) => tc.status === status);
   }

   // Date filtering (Will change base on the requirements when to get the date filter)
   if (!dateError && startDate && endDate) {
      filtered = filtered.filter((tc: ITimeSheetTableView) => (
            (dayjs(tc.endDate).isAfter(startDate, 'day') ||
            dayjs(tc.endDate).isSame(startDate, 'day')) &&
            (dayjs(tc.startDate).isBefore(endDate, 'day') ||
            dayjs(tc.startDate).isSame(endDate, 'day'))
         ));
   }

   return filtered;
}