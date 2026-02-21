import type { TableHeadCellProps } from 'src/components/table/table-head-custom';

import dayjs from 'dayjs';
import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo , useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import axios, { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard/content';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label/label';
import { emptyRows } from 'src/components/table/utils';
import { useTable } from 'src/components/table/use-table';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { Scrollbar } from 'src/components/scrollbar/scrollbar';
import { TableNoData } from 'src/components/table/table-no-data';
import { TableEmptyRows } from 'src/components/table/table-empty-rows';
import { TableHeadCustom } from 'src/components/table/table-head-custom';
import { EmptyContent } from 'src/components/empty-content/empty-content';
import { TablePaginationCustom } from 'src/components/table/table-pagination-custom';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { AdminIncidentReportTableRow } from '../admin-incident-report-row';
import { AdminIncidentReportTableToolbar } from '../admin-incident-report-toolbar';
import { AdminIncidentReportMobileCard } from '../admin-incident-report-mobile-card';
import { AdminIncidentReportTableFilterResult } from '../admin-incident-report-table-filter';

//----------------------------------------------------------------------------------------------------------

export const INCIDENT_REPORT_TYPES: { value: string; label: string }[] = [
  { label: 'Traffic Accident', value: 'traffic accident' },
  { label: 'Equipment Malfunction', value: 'equipment malfunction' },
  { label: 'Safety Violation', value: 'safety violation' },
  { label: 'Unauthorized Access', value: 'unauthorized access' },
  { label: 'Construction Site Disruption', value: 'construction site disruption' },
  { label: 'Weather/Environmental Incident', value: 'wetaher incident' },
  { label: 'Personnel Injury/Accident', value: 'personnel accident' },
  { label: 'Traffic Signal Failure', value: 'traffic signal failure' },
  { label: 'Road Blockage/Obstruction', value: 'road obstruction' },
  { label: 'Work Zone Inadequacy', value: 'work zone inadequacy' },
  { label: 'Public Interaction or Dispute', value: 'public interaction' },
  { label: 'Other', value: 'others' },
];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'id', label: 'ID' },
  { id: 'jobNumber', label: 'Job #' },
  { id: 'jobDate', label: 'Date' },
  { id: 'incidentType', label: 'Incident Type' },
  { id: 'incidentSeverity', label: 'Severity' },
  { id: 'customer', label: 'Customer' },
  { id: 'site', label: 'Site' },
  { id: 'client', label: 'Client' },
  { id: 'incidentTime', label: 'Incident Time' },
  { id: 'reportedBy', label: 'Reported By' },
  { id: 'status', label: 'Status' },
  { id: '', width: 88 },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_review', label: 'In Review' },
  { value: 'resolved', label: 'Resolved' },
];
export function AdminIncidentReportListView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [incidentReportIdToDelete, setIncidentReportIdToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deleteConfirmDialog = useBoolean();

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
    startDate: searchParams.get('startDate') ? dayjs(searchParams.get('startDate')!) : null,
    endDate: searchParams.get('endDate') ? dayjs(searchParams.get('endDate')!) : null,
  });
  const { state: currentFilters } = filters;

  // Update URL when table state or filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams();

      // Always include page (convert from 0-based to 1-based)
      params.set('page', String(table.page + 1));

      // Always include rowsPerPage
      params.set('rowsPerPage', String(table.rowsPerPage));

      // Always include orderBy and order
      params.set('orderBy', table.orderBy);
      params.set('order', table.order);

      // Include filters only if they have values
      const trimmedQuery = (currentFilters.query || '').trim();
      if (trimmedQuery) params.set('search', trimmedQuery);
      if (currentFilters.status !== 'all') params.set('status', currentFilters.status);
      if (currentFilters.type.length > 0) params.set('type', currentFilters.type.join(','));
      if (currentFilters.startDate) params.set('startDate', dayjs(currentFilters.startDate).format('YYYY-MM-DD'));
      if (currentFilters.endDate) params.set('endDate', dayjs(currentFilters.endDate).format('YYYY-MM-DD'));

      const newURL = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      router.replace(newURL);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [
    router,
    table.page,
    table.rowsPerPage,
    table.orderBy,
    table.order,
    currentFilters.query,
    currentFilters.status,
    currentFilters.type,
    currentFilters.startDate,
    currentFilters.endDate,
  ]);

  // Reset page when filters change (but not when page itself changes)
  useEffect(() => {
    table.onResetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentFilters.query,
    currentFilters.status,
    currentFilters.type,
    currentFilters.startDate,
    currentFilters.endDate,
  ]);

  const { data: incidentReportList, isLoading: isLoadingList } = useQuery({
    queryKey: [
      'all-incident-report-requests',
      table.page,
      table.rowsPerPage,
      table.orderBy,
      table.order,
      currentFilters.query,
      currentFilters.status,
      currentFilters.type.join(','),
      currentFilters.startDate?.format('YYYY-MM-DD'),
      currentFilters.endDate?.format('YYYY-MM-DD'),
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
        ...(currentFilters.startDate && { start_date: dayjs(currentFilters.startDate).format('YYYY-MM-DD') }),
        ...(currentFilters.endDate && { end_date: dayjs(currentFilters.endDate).format('YYYY-MM-DD') }),
      });

      const response = await fetcher(`/api/incident-report/admin?${params.toString()}`);

      // The fetcher already returns res.data, so response is { success: true, data: [...], pagination: {...} }
      // Return the full response object so we can access .data and .pagination
      return response;
    },
  });

  // Fetch status counts for tabs
  const { data: status } = useQuery({
    queryKey: [
      'incident-report-severity-counts',
      currentFilters.query,
      currentFilters.type,
      currentFilters.startDate,
      currentFilters.endDate,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(currentFilters.query && { search: currentFilters.query }),
        ...(currentFilters.type.length > 0 && { type: currentFilters.type.join(',') }),
        ...(currentFilters.startDate && { start_date: dayjs(currentFilters.startDate).format('YYYY-MM-DD') }),
        ...(currentFilters.endDate && { end_date: dayjs(currentFilters.endDate).format('YYYY-MM-DD') }),
      });

      const response = await fetcher(
        `/api/incident-report/admin/counts/status?${params.toString()}`
      );
      return response.data || { all: 0, pending: 0, in_review: 0, resolved: 0 };
    },
  });

  const tableData = useMemo(() => {
    // The response structure is { success: true, data: [...], pagination: {...} }
    // Since fetcher returns res.data, incidentReportList is already the data object
    const data = incidentReportList?.data || [];
    return data;
  }, [incidentReportList]);
  const totalCount = incidentReportList?.pagination?.totalCount || 0;
  const statusCounts = status || { all: 0, pending: 0, in_review: 0, resolved: 0 };

  // Server-side pagination means no client-side filtering needed
  const dataFiltered = tableData;

  const dateError = !!(
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

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      filters.setState({ status: newValue });
      table.onResetPage();
    },
    [filters, table]
  );

  const handleView = useCallback((data: any) => data, []);

  const handleDelete = useCallback((id: string) => {
    setIncidentReportIdToDelete(id);
    deleteConfirmDialog.onTrue();
  }, [deleteConfirmDialog]);

  const handleConfirmDelete = useCallback(async () => {
    if (!incidentReportIdToDelete) return;
    setDeleting(true);
    try {
      await axios.delete(endpoints.incidentReport.delete(incidentReportIdToDelete));
      toast.success('Incident report deleted.');
      queryClient.invalidateQueries({ queryKey: ['all-incident-report-requests'] });
      queryClient.invalidateQueries({ queryKey: ['incident-report-status-counts'] });
      queryClient.invalidateQueries({ queryKey: ['incident-report-severity-counts'] });
      setIncidentReportIdToDelete(null);
      deleteConfirmDialog.onFalse();
    } catch (e: unknown) {
      console.error(e);
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || 'Failed to delete incident report.');
    } finally {
      setDeleting(false);
    }
  }, [incidentReportIdToDelete, queryClient, deleteConfirmDialog]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Incident Report List"
        links={[{ name: 'Work Management' }, { name: 'Incident Report' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => router.push(paths.work.incident_report.create)}
          >
            Add Incident Report
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
                    (tab.value === 'in_review' && 'error') ||
                    (tab.value === 'resolved' && 'success') ||
                    'default'
                  }
                >
                  {statusCounts[tab.value as keyof typeof statusCounts] || 0}
                </Label>
              }
            />
          ))}
        </Tabs>

        {/* Toolbar */}
        <AdminIncidentReportTableToolbar
          filters={filters}
          onResetPage={table.onResetPage}
          options={{ types: INCIDENT_REPORT_TYPES }}
          dateError={dateError}
        />

        {/* Filter Results */}
        {canReset && (
          <AdminIncidentReportTableFilterResult
            filters={filters}
            totalResults={totalCount}
            onResetPage={table.onResetPage}
            typeOptions={INCIDENT_REPORT_TYPES}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        {/* Desktop Table View */}
        <Box sx={{ position: 'relative', display: { xs: 'none', md: 'block' } }}>
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
                {isLoadingList ? (
                  Array.from({ length: table.rowsPerPage }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="80%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="40%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                      <TableCell><Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} /></TableCell>
                      <TableCell align="right"><Skeleton variant="circular" width={32} height={32} sx={{ ml: 'auto' }} /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <>
                    {dataFiltered.map((row: any) => (
                      <AdminIncidentReportTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onView={handleView}
                        onDelete={handleDelete}
                      />
                    ))}
                    <TableEmptyRows
                      height={0}
                      emptyRows={emptyRows(0, table.rowsPerPage, tableData.length)}
                    />
                    <TableNoData notFound={!!notFound} />
                  </>
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

        {/* Mobile Card View */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <Stack spacing={2} sx={{ p: 2 }}>
            {isLoadingList ? (
              Array.from({ length: 5 }).map((_, index) => (
                <Card key={`skeleton-card-${index}`} sx={{ p: 2 }}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Skeleton variant="text" width="30%" />
                      <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
                    </Box>
                    <Box>
                      <Skeleton variant="text" width="70%" />
                    </Box>
                    <Box>
                      <Skeleton variant="text" width="90%" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Skeleton variant="text" width="40%" />
                      <Skeleton variant="text" width="20%" />
                    </Box>
                  </Stack>
                </Card>
              ))
            ) : dataFiltered && dataFiltered.length > 0 ? (
              dataFiltered.map((row: any) => (
                <AdminIncidentReportMobileCard key={row.id} row={row} onDelete={handleDelete} />
              ))
            ) : (
              <Box sx={{ width: '100%', py: 4 }}>
                <EmptyContent
                  filled
                  title="No data"
                  sx={{
                    width: '100%',
                    maxWidth: 'none',
                    '& img': { width: '100%', maxWidth: 'none' },
                  }}
                />
              </Box>
            )}
          </Stack>
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

      <ConfirmDialog
        open={deleteConfirmDialog.value}
        onClose={deleteConfirmDialog.onFalse}
        title="Delete incident report"
        content="Are you sure you want to delete this incident report? All attachments (images and PDFs) will be permanently removed. This cannot be undone."
        action={
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleting}
            startIcon={deleting ? null : <Iconify icon="solar:trash-bin-trash-bold" />}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        }
        disableCancel={deleting}
      />
    </DashboardContent>
  );
}
