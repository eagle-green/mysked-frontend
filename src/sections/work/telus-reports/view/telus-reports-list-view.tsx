import type { TableHeadCellProps } from 'src/components/table';

import dayjs from 'dayjs';
import { useMemo, useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

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
  TablePaginationCustom,
} from 'src/components/table';

import { TelusReportTableRow } from '../telus-report-table-row';
import { TelusReportCreateDialog } from '../telus-report-create-dialog';
import { TelusReportTableToolbar } from '../telus-report-table-toolbar';
import { TelusReportTableFiltersResult } from '../telus-report-table-filters-result';

import type { ITelusReportFilters } from '../types';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'sent', label: 'Sent' },
];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'id', label: 'ID', width: 80 },
  { id: 'report_type', label: 'Type', width: 100 },
  { id: 'report_period', label: 'Report Period', width: 200 },
  { id: 'job_count', label: 'Jobs', width: 80 },
  { id: 'status', label: 'Status', width: 120 },
  { id: 'reviewed_by', label: 'Reviewed By', width: 200 },
  { id: 'sent_by', label: 'Sent By', width: 200 },
  { id: 'created_by', label: 'Created By', width: 150 },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function TelusReportsListView() {
  const table = useTable({
    defaultDense: true,
    defaultOrder: 'desc',
    defaultOrderBy: 'created_at',
    defaultRowsPerPage: 25,
  });

  const createDialog = useBoolean();
  const queryClient = useQueryClient();

  const filters = useSetState<ITelusReportFilters>({
    status: 'all',
    reportType: 'all',
    startDate: null,
    endDate: null,
    query: '',
  });

  const { state: currentFilters, setState: updateFilters } = filters;

  // Check for date errors
  const dateError = useMemo(() => {
    if (currentFilters.startDate && currentFilters.endDate) {
      return dayjs(currentFilters.endDate).isBefore(dayjs(currentFilters.startDate));
    }
    return false;
  }, [currentFilters.startDate, currentFilters.endDate]);

  // Fetch TELUS reports
  const { data: reportsResponse, isLoading } = useQuery({
    queryKey: ['telus-reports', table.page, table.rowsPerPage, table.orderBy, table.order, currentFilters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (table.page + 1).toString(),
        rowsPerPage: table.rowsPerPage.toString(),
        orderBy: table.orderBy,
        order: table.order,
      });

      if (currentFilters.status !== 'all') params.set('status', currentFilters.status);
      if (currentFilters.reportType !== 'all') params.set('reportType', currentFilters.reportType);
      if (currentFilters.startDate) {
        params.set('startDate', dayjs(currentFilters.startDate).format('YYYY-MM-DD'));
      }
      if (currentFilters.endDate) {
        params.set('endDate', dayjs(currentFilters.endDate).format('YYYY-MM-DD'));
      }
      if (currentFilters.query) {
        params.set('query', currentFilters.query);
      }

      const response = await fetcher(`${endpoints.work.telusReports.list}?${params.toString()}`);
      return response;
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const tableData = useMemo(() => reportsResponse?.reports || [], [reportsResponse]);
  const totalCount = reportsResponse?.pagination?.totalCount || 0;

  const dataFiltered = tableData;

  const canReset = 
    currentFilters.status !== 'all' || 
    currentFilters.reportType !== 'all' ||
    currentFilters.startDate !== null ||
    currentFilters.endDate !== null ||
    currentFilters.query !== '';

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      const toastId = toast.loading('Deleting report...');
      try {
        await fetcher([endpoints.work.telusReports.delete(id), { method: 'DELETE' }]);
        toast.dismiss(toastId);
        toast.success('Report deleted successfully!');
        
        queryClient.invalidateQueries({ queryKey: ['telus-reports'] });
        table.onUpdatePageDeleteRow(dataFiltered.length);
      } catch (error: any) {
        toast.dismiss(toastId);
        console.error(error);
        toast.error(error?.error || 'Failed to delete report');
      }
    },
    [dataFiltered.length, table, queryClient]
  );

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="TELUS Reports"
          links={[{ name: 'Work Management' }, { name: 'Job' }, { name: 'TELUS Reports' }]}
          action={
            <Button
              onClick={createDialog.onTrue}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              Create Report
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
                      (tab.value === 'reviewed' && 'primary') ||
                      (tab.value === 'sent' && 'success') ||
                      'default'
                    }
                  >
                    {['draft', 'reviewed', 'sent'].includes(tab.value)
                      ? tableData.filter((report: any) => report.status === tab.value).length
                      : tableData.length}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <TelusReportTableToolbar
            filters={filters}
            dateError={dateError}
            onResetPage={table.onResetPage}
          />

          {canReset && (
            <TelusReportTableFiltersResult
              filters={filters}
              totalResults={totalCount}
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
                  rowCount={totalCount}
                  onSort={table.onSort}
                />

                <TableBody>
                  {isLoading ? (
                    Array.from({ length: table.rowsPerPage }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell>
                          <Skeleton variant="text" width={48} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width="70%" />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width="60%" />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width={40} />
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
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Skeleton variant="circular" width={32} height={32} />
                            <Skeleton variant="text" width="70%" />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Skeleton variant="circular" width={32} height={32} />
                            <Skeleton variant="text" width="70%" />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Skeleton variant="circular" width={32} height={32} />
                            <Skeleton variant="text" width="70%" />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="rectangular" width={32} height={32} sx={{ borderRadius: 1 }} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <>
                      {dataFiltered
                        .filter((row: any) => row && row.id)
                        .map((row: any) => (
                          <TelusReportTableRow
                            key={row.id}
                            row={row}
                            reportNumber={row.display_id || row.displayId || '-'}
                            onDeleteRow={() => handleDeleteRow(row.id)}
                          />
                        ))}

                      <TableEmptyRows
                        height={table.dense ? 56 : 56 + 20}
                        emptyRows={emptyRows(0, table.rowsPerPage, tableData.length)}
                      />

                      <TableNoData notFound={notFound} />
                    </>
                  )}
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

      <TelusReportCreateDialog
        open={createDialog.value}
        onClose={createDialog.onFalse}
        onSuccess={() => {
          createDialog.onFalse();
          queryClient.invalidateQueries({ queryKey: ['telus-reports'] });
        }}
      />
    </>
  );
}
