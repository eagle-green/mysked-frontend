import type { TimeSheet } from 'src/types/timesheet';
import type { ITimeSheetFilter} from 'src/types/timecard';
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

import { fIsAfter } from 'src/utils/format-time';
import { isDevMode, findInString } from 'src/utils/timecard-helpers';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { TIMESHEET_TABLE_HEADER, TIMESHEET_STATUS_OPTIONS } from 'src/assets/data';

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
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { useAuthContext } from 'src/auth/hooks';

import { TimeSheetStatus } from 'src/types/timecard';
import { IJobTableFilters, TimesheetEntry } from 'src/types/job';

import { FILTER_ALL } from '../constant';
import { TimeSheetTableRow } from '../timesheet-table-row';
import { TimeSheetToolBar } from "../timesheet-table-toolbar";
import { TimeSheetTableFiltersResult } from '../timesheet-table-filter-result';

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
   // const [isDeleting, setIsDeleting] = useState(false);

   // React Query for fetching timesheet list
   const { data: timesheetData, refetch } = useQuery({
      queryKey: ['timesheet-list-query'],
      queryFn: async () => {
         const response = await fetcher(endpoints.timesheet.list);
         return response.data.timesheets;
      }
   });

 const filters = useSetState<IJobTableFilters>({
      query: '',
      status: 'all',
      region: [],
      client: [],
      company: [],
      site: [],
      startDate: null,
      endDate: null,
  });

   const { state: currentFilters, setState: updateFilters } = filters;

   const dateError = fIsAfter(currentFilters.startDate, currentFilters.endDate);

   // Filter timesheet based on user role
   const filterTimeCard = useMemo(() => {
      if (!timesheetData) return [];
      // For workers, show timesheet where they are assigned and regardless of status
      return timesheetData.filter((ts: TimeSheet) => {
         const timesheet = ts.timesheet_manager_id === user?.id;
         return timesheet !== null;
      });
   }, [timesheetData, user?.id]);

   const dataFiltered = applyTimeSheetFilter({
      
      inputData: filterTimeCard,
      comparator: getComparator(table.order, table.orderBy),
      filters: currentFilters
   });

  const canReset = !!(
    currentFilters.query ||
    currentFilters.client.length > 0 ||
    currentFilters.company.length > 0 ||
    currentFilters.site.length > 0 ||
    currentFilters.startDate ||
    currentFilters.endDate
  );

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

   const handleFilterStatus = useCallback(
      (event: React.SyntheticEvent, newValue: string) => {
         table.onResetPage();
         updateFilters({ status: newValue });
      },
      [updateFilters, table]
   );

   const handleFilters = useCallback(
      (name: string, value: any) => {
         table.onResetPage();
         updateFilters({ [name]: value });
         },
      [table, updateFilters]
   );

   const handleResetFilters = useCallback(() => {
      updateFilters({
         query: '',
         status: 'all',
         client: [],
         company: [],
         site: [],
         startDate: null,
         endDate: null,
      });
   }, [updateFilters]);

   return(
      <>
         <DashboardContent>
            <CustomBreadcrumbs
               heading="Timesheet"
               links={[
                  { name: 'Schedule' }, 
                  { name: 'List' }
               ]}
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
                              (tab.value === TimeSheetStatus.DRAFT && 'info') ||
                              (tab.value === TimeSheetStatus.SUBMITTED && 'secondary') ||
                              (tab.value === TimeSheetStatus.APPROVED && 'success') ||
                              (tab.value === TimeSheetStatus.REJECTED && 'error') ||
                              'default'
                           }
                        >
                           {
                              filterTimeCard.filter(
                                 (tc: TimeSheet) => tab.value === FILTER_ALL ? true : tc.status === tab.value
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
                     onFilters={handleFilters}
                     onResetFilters={handleResetFilters}
                     onResetPage={table.onResetPage}
                     totalResults={dataFiltered.length}
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
                           // numSelected={table.selected.length}
                           onSort={table.onSort}
                           // onSelectAllRows={(checked) =>
                           //    table.onSelectAllRows(
                           //       checked,
                           //       dataFiltered.map((row) => row.id)
                           //    )
                           // }
                        />
                        
                        <TableBody>
                           {dataFiltered
                              .slice(
                                 table.page * table.rowsPerPage,
                                 table.page * table.rowsPerPage + table.rowsPerPage
                              )
                              .filter((row) => row && row.id)
                              .map((row) => (
                                 <TimeSheetTableRow 
                                    key={row.id} row={row}
                                    selected={table.selected.includes(row.id)}
                                    recordingLink={paths.schedule.timesheet.edit(row.id)}
                                    // onSelectRow={() => table.onSelectRow(row.id)}
                                    // onDeleteRow={() => handleDeleteRow(row.id)}
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
         {/* {renderConfirmDialog()} */}
      </>
   );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: TimesheetEntry[];
  filters: IJobTableFilters;
  comparator: (a: any, b: any) => number;
};

function applyTimeSheetFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { query, status, client, company, site, startDate, endDate } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (query) {
   //  inputData = inputData.filter(
   //    (timesheet) =>
   //      timesheet.worker_id?.toLowerCase().indexOf(query.toLowerCase()) !== -1 ||
   //      timesheet.job_worker_id?.toLowerCase().indexOf(query.toLowerCase()) !== -1
   //  );
   const q = query.toLowerCase();
    inputData = inputData.filter(
      (tc) =>
         findInString(q, tc.client.name) ||
         findInString(q, tc.company.name) ||
         findInString(q, tc.site.name) ||
         findInString(q, `JO-${tc.job.job_number}`));
  }

  if (status !== 'all') {
    inputData = inputData.filter((timesheet) => timesheet.status === status);
  }

  if (client.length > 0) {
    inputData = inputData.filter((timesheet) =>
      client.some((selectedClient: string) =>
        timesheet.client.name?.toLowerCase().includes(selectedClient.toLowerCase())
      )
    );
  }

  if (company.length > 0) {
    inputData = inputData.filter((timesheet) =>
      company.some((selectedCompany: string) =>
        timesheet.company.name?.toLowerCase().includes(selectedCompany.toLowerCase())
      )
    );
  }

  if (site.length > 0) {
    inputData = inputData.filter((timesheet) =>
      site.some((selectedSite: string) =>
        timesheet.site.name?.toLowerCase().includes(selectedSite.toLowerCase())
      )
    );
  }

  if (startDate && endDate) {
    inputData = inputData.filter((timesheet) => {
      // Try multiple date fields as fallbacks
      const timesheetDate =
        timesheet.original_start_time ||
        timesheet.timesheet_date ||
        timesheet.created_at ||
        timesheet.updated_at;

      if (!timesheetDate) {
        return false;
      }

      // Convert to Date objects for comparison
      const timesheetDateObj = new Date(timesheetDate);
      const start =
        startDate && typeof startDate === 'object' && 'toDate' in startDate
          ? startDate.toDate()
          : new Date(startDate as any);
      const end =
        endDate && typeof endDate === 'object' && 'toDate' in endDate
          ? endDate.toDate()
          : new Date(endDate as any);

      // Reset time to start of day for accurate date comparison
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999); // End of day
      timesheetDateObj.setHours(0, 0, 0, 0);

      const isInRange = timesheetDateObj >= start && timesheetDateObj <= end;

      return isInRange;
    });
  }

  return inputData;
}