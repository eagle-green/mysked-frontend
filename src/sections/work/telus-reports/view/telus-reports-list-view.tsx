import type { TableHeadCellProps } from 'src/components/table';
import type { IDatePickerControl } from 'src/types/common';

import dayjs from 'dayjs';
import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TableBody from '@mui/material/TableBody';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

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
import { TelusReportTableFiltersResult } from '../telus-report-table-filters-result';
import { TelusReportTableToolbar } from '../telus-report-table-toolbar';

// ----------------------------------------------------------------------

interface ITelusReportFilters {
  status: string;
  reportType: string;
  startDate: IDatePickerControl | null;
  endDate: IDatePickerControl | null;
  query: string;
}

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
  const [isGeneratingDaily, setIsGeneratingDaily] = useState(false);
  const [isGeneratingWeekly, setIsGeneratingWeekly] = useState(false);

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

  const handleGenerateDaily = useCallback(async () => {
    setIsGeneratingDaily(true);
    const toastId = toast.loading('Generating daily TELUS report...');

    try {
      const response = await fetcher([
        endpoints.work.telusReports.generateDaily,
        { method: 'POST' },
      ]);

      toast.dismiss(toastId);
      
      if (response.skipped) {
        toast.info(response.message || 'Daily report already exists for this date');
      } else {
        toast.success(`Daily TELUS report generated successfully! (${response.jobCount || 0} jobs)`);
      }

      queryClient.invalidateQueries({ queryKey: ['telus-reports'] });
    } catch (error: any) {
      toast.dismiss(toastId);
      console.error('Generate daily error:', error);
      toast.error(error?.error || 'Failed to generate daily TELUS report');
    } finally {
      setIsGeneratingDaily(false);
    }
  }, [queryClient]);

  const handleGenerateWeekly = useCallback(async () => {
    setIsGeneratingWeekly(true);
    const toastId = toast.loading('Generating weekly TELUS report...');

    try {
      const response = await fetcher([
        endpoints.work.telusReports.generateWeekly,
        { method: 'POST' },
      ]);

      toast.dismiss(toastId);
      
      if (response.skipped) {
        toast.info(response.message || 'Weekly report already exists for this period');
      } else {
        toast.success(`Weekly TELUS report generated successfully! (${response.jobCount || 0} jobs)`);
      }

      queryClient.invalidateQueries({ queryKey: ['telus-reports'] });
    } catch (error: any) {
      toast.dismiss(toastId);
      console.error('Generate weekly error:', error);
      toast.error(error?.error || 'Failed to generate weekly TELUS report');
    } finally {
      setIsGeneratingWeekly(false);
    }
  }, [queryClient]);


  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="TELUS Reports"
          links={[{ name: 'Work Management' }, { name: 'Job' }, { name: 'TELUS Reports' }]}
          action={
            <Stack direction="row" spacing={1.5}>
              <Button
                onClick={handleGenerateDaily}
                variant="outlined"
                color="info"
                disabled={isGeneratingDaily || isGeneratingWeekly}
                startIcon={
                  isGeneratingDaily ? (
                    <CircularProgress size={16} />
                  ) : (
                    <Iconify icon="solar:calendar-mark-bold" />
                  )
                }
              >
                {isGeneratingDaily ? 'Generating...' : 'Generate Daily'}
              </Button>
              <Button
                onClick={handleGenerateWeekly}
                variant="outlined"
                color="primary"
                disabled={isGeneratingDaily || isGeneratingWeekly}
                startIcon={
                  isGeneratingWeekly ? (
                    <CircularProgress size={16} />
                  ) : (
                    <Iconify icon="solar:calendar-mark-bold" />
                  )
                }
              >
                {isGeneratingWeekly ? 'Generating...' : 'Generate Weekly'}
              </Button>
              <Button
                onClick={createDialog.onTrue}
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                Create Report
              </Button>
            </Stack>
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
                    <TableEmptyRows height={table.dense ? 56 : 56 + 20} emptyRows={table.rowsPerPage} />
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
