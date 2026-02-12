import type { TableHeadCellProps } from 'src/components/table';
import type { ProgressStep } from 'src/components/progress-dialog/types';

import { useSetState } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { QboSyncProgressDialog } from 'src/components/progress-dialog/qbo-sync-progress-dialog';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { CustomerTableToolbar } from '../customer-table-toolbar';
import { CustomerTableFiltersResult } from '../customer-table-filters-result';

// ----------------------------------------------------------------------

interface CustomerItem {
  id: string;
  name: string;
  company_name: string | null;
  phone: string | null;
  qbo_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CustomerTableFilters {
  query: string;
}

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'name', label: 'Name' },
  { id: 'company_name', label: 'Company Name' },
  { id: 'phone', label: 'Phone' },
];

// ----------------------------------------------------------------------

export function CustomerListView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncSteps, setSyncSteps] = useState<ProgressStep[]>([]);
  const [currentSyncStep, setCurrentSyncStep] = useState(0);

  // Initialize table state from URL parameters
  const table = useTable({
    defaultDense: searchParams.get('dense') === 'false' ? false : true,
    defaultOrder: (searchParams.get('order') as 'asc' | 'desc') || 'asc',
    defaultOrderBy: searchParams.get('orderBy') || 'name',
    defaultRowsPerPage: parseInt(searchParams.get('rowsPerPage') || '25', 10),
    defaultCurrentPage: parseInt(searchParams.get('page') || '1', 10) - 1,
  });

  const filters = useSetState<CustomerTableFilters>({
    query: searchParams.get('search') || '',
  });
  const { state: currentFilters } = filters;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _updateFilters = filters.setState;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _resetFilters = filters.resetState;

  // Update URL when table state changes
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();

    params.set('page', (table.page + 1).toString());
    params.set('rowsPerPage', table.rowsPerPage.toString());
    params.set('orderBy', table.orderBy);
    params.set('order', table.order);
    params.set('dense', table.dense.toString());

    if (currentFilters.query) params.set('search', currentFilters.query);

    const url = `?${params.toString()}`;
    router.replace(`${window.location.pathname}${url}`);
  }, [table.page, table.rowsPerPage, table.orderBy, table.order, table.dense, currentFilters, router]);

  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // React Query for fetching customers list
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: customerListResponse, refetch: _refetch, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers', table.page, table.rowsPerPage, table.orderBy, table.order, currentFilters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (table.page + 1).toString(),
        rowsPerPage: table.rowsPerPage.toString(),
        orderBy: table.orderBy,
        order: table.order,
        ...(currentFilters.query && { search: currentFilters.query }),
      });

      const response = await fetcher(`${endpoints.invoice.customers}?${params.toString()}`);
      return response;
    },
  });

  // Fetch last sync time
  const { data: lastSyncResponse } = useQuery({
    queryKey: ['customer-last-sync'],
    queryFn: async () => {
      const response = await fetcher(endpoints.invoice.customersLastSync);
      return response;
    },
  });

  const tableData = (customerListResponse?.data || []) as CustomerItem[];
  const totalCount = customerListResponse?.pagination?.totalCount || 0;

  const dataFiltered = tableData;

  const canReset = !!currentFilters.query;

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleSyncFromQBO = useCallback(async () => {
    const steps: ProgressStep[] = [
      { label: 'Connecting to QuickBooks', description: 'Establishing secure connection', status: 'pending' },
      { label: 'Fetching Customers', description: 'Retrieving customer data from QBO', status: 'pending' },
      { label: 'Processing Data', description: 'Processing and validating customer data', status: 'pending' },
      { label: 'Updating Database', description: 'Saving customers to local database', status: 'pending' },
      { label: 'Refreshing View', description: 'Updating customer list and status', status: 'pending' },
    ];

    setSyncSteps(steps);
    setCurrentSyncStep(0);
    setSyncDialogOpen(true);
    setIsSyncing(true);

    try {
      setSyncSteps((prev) => prev.map((step, idx) => (idx === 0 ? { ...step, status: 'active' } : step)));
      setCurrentSyncStep(0);

      await new Promise((resolve) => setTimeout(resolve, 500));
      setSyncSteps((prev) =>
        prev.map((step, idx) =>
          idx === 0 ? { ...step, status: 'completed' } : idx === 1 ? { ...step, status: 'active' } : step
        )
      );
      setCurrentSyncStep(1);

      await new Promise((resolve) => setTimeout(resolve, 300));
      setSyncSteps((prev) =>
        prev.map((step, idx) =>
          idx === 1 ? { ...step, status: 'completed' } : idx === 2 ? { ...step, status: 'active' } : step
        )
      );
      setCurrentSyncStep(2);

      await new Promise((resolve) => setTimeout(resolve, 300));
      setSyncSteps((prev) =>
        prev.map((step, idx) =>
          idx === 2 ? { ...step, status: 'completed' } : idx === 3 ? { ...step, status: 'active' } : step
        )
      );
      setCurrentSyncStep(3);

      const response = await fetcher([
        endpoints.invoice.customersImportQBO,
        {
          method: 'POST',
          data: {},
        },
      ]);

      setSyncSteps((prev) =>
        prev.map((step, idx) =>
          idx === 3 ? { ...step, status: 'completed' } : idx === 4 ? { ...step, status: 'active' } : step
        )
      );
      setCurrentSyncStep(4);

      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-last-sync'] });

      await new Promise((resolve) => setTimeout(resolve, 300));
      setSyncSteps((prev) => prev.map((step, idx) => (idx === 4 ? { ...step, status: 'completed' } : step)));

      toast.success(
        `Successfully synced ${response.data.summary?.imported || 0} customers from QuickBooks Online!`
      );
    } catch (error) {
      console.error('Sync error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      setSyncSteps((prev) => {
        const currentActiveIndex = prev.findIndex((s) => s.status === 'active');
        return prev.map((step, idx) =>
          idx === currentActiveIndex ? { ...step, status: 'error', error: errorMessage } : step
        );
      });

      toast.error('Failed to sync from QuickBooks Online');
    } finally {
      setIsSyncing(false);
    }
  }, [queryClient]);

  const handleCloseSyncDialog = useCallback(() => {
    if (!isSyncing) {
      setSyncDialogOpen(false);
      setSyncSteps([]);
      setCurrentSyncStep(0);
    }
  }, [isSyncing]);

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Customers"
          links={[
            { name: 'Management', href: paths.management.root },
            { name: 'Invoice', href: paths.management.invoice.root },
            { name: 'Customers' },
          ]}
          action={
            <Stack direction="row" spacing={4} alignItems="flex-start">
              <Stack spacing={1} alignItems="center">
                <Button
                  variant="contained"
                  startIcon={
                    isSyncing ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <Iconify icon={"solar:refresh-bold" as any} />
                    )
                  }
                  onClick={handleSyncFromQBO}
                  disabled={isSyncing}
                >
                  {isSyncing ? 'Syncing...' : 'Sync from QBO'}
                </Button>
                {lastSyncResponse?.data?.lastSyncTime && (
                  <Typography variant="caption" color="text.secondary" align="center">
                    Last sync: {new Date(lastSyncResponse.data.lastSyncTime).toLocaleString()}
                  </Typography>
                )}
                {!lastSyncResponse?.data?.lastSyncTime && lastSyncResponse && (
                  <Typography variant="caption" color="text.secondary" align="center">
                    No sync completed yet
                  </Typography>
                )}
              </Stack>
            </Stack>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <CustomerTableToolbar filters={filters} onResetPage={table.onResetPage} />

          {canReset && (
            <CustomerTableFiltersResult
              filters={filters}
              totalResults={totalCount}
              onResetPage={table.onResetPage}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative', display: 'block', overflow: 'visible' }}>
            <Scrollbar fillContent={false}>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headCells={TABLE_HEAD}
                  rowCount={totalCount}
                  numSelected={0}
                  onSort={table.onSort}
                />

                <TableBody>
                  {isLoadingCustomers ? (
                    Array.from({ length: table.rowsPerPage }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                        <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                        <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <>
                      {dataFiltered.map((row: CustomerItem) => (
                        <TableRow key={row.id} hover>
                          <TableCell>
                            <Link
                              component={RouterLink}
                              href={paths.management.invoice.customers.details(row.id)}
                              color="primary"
                              variant="subtitle2"
                              sx={{
                                textDecoration: 'none',
                                fontWeight: 600,
                                cursor: 'pointer',
                                '&:hover': {
                                  textDecoration: 'underline',
                                },
                              }}
                            >
                              {row.name || ''}
                            </Link>
                          </TableCell>
                          <TableCell>{row.company_name || ''}</TableCell>
                          <TableCell>{row.phone || ''}</TableCell>
                        </TableRow>
                      ))}
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
          />
        </Card>
      </DashboardContent>

      {/* Sync Progress Dialog */}
      <QboSyncProgressDialog
        open={syncDialogOpen}
        steps={syncSteps}
        currentStep={currentSyncStep}
        onClose={handleCloseSyncDialog}
        title="Syncing Customers from QuickBooks"
        subtitle="Please wait while we sync all customers from QuickBooks Online. This may take a few moments. Do not close this window or navigate away."
        allowClose={!isSyncing}
      />
    </>
  );
}
