import type { TableHeadCellProps } from 'src/components/table';
import type { ProgressStep } from 'src/components/progress-dialog/types';

import { varAlpha } from 'minimal-shared/utils';
import { useSetState } from 'minimal-shared/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
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
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
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

import { ServiceTableToolbar } from '../service-table-toolbar';
import { ServiceTableFiltersResult } from '../service-table-filters-result';

// ----------------------------------------------------------------------

interface ServiceItem {
  id: string;
  name: string;
  sales_description: string | null;
  category: string | null;
  type: string | null;
  price: number | null;
  cost: number | null;
  status: string;
  qbo_item_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ServiceTableFilters {
  query: string;
  status: string;
  category: string[];
  type: string[];
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'name', label: 'Name' },
  { id: 'sales_description', label: 'Sales Description' },
  { id: 'category', label: 'Category' },
  { id: 'type', label: 'Type' },
  { id: 'price', label: 'Price' },
  { id: 'cost', label: 'Cost' },
  { id: 'status', label: 'Status' },
];

// ----------------------------------------------------------------------

export function ServiceListView() {
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

  const filters = useSetState<ServiceTableFilters>({
    query: searchParams.get('search') || '',
    status: searchParams.get('status') || 'all',
    category: searchParams.get('category') ? searchParams.get('category')!.split(',') : [],
    type: searchParams.get('type') ? searchParams.get('type')!.split(',') : [],
  });
  const { state: currentFilters } = filters;
   
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
    if (currentFilters.status !== 'all') params.set('status', currentFilters.status);
    if (currentFilters.category.length > 0) params.set('category', currentFilters.category.join(','));
    if (currentFilters.type.length > 0) params.set('type', currentFilters.type.join(','));

    const url = `?${params.toString()}`;
    router.replace(`${window.location.pathname}${url}`);
  }, [table.page, table.rowsPerPage, table.orderBy, table.order, table.dense, currentFilters, router]);

  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // React Query for fetching services list
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: serviceListResponse, refetch: _refetch, isLoading: isLoadingServices } = useQuery({
    queryKey: ['services', table.page, table.rowsPerPage, table.orderBy, table.order, currentFilters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (table.page + 1).toString(),
        rowsPerPage: table.rowsPerPage.toString(),
        orderBy: table.orderBy,
        order: table.order,
        ...(currentFilters.query && { search: currentFilters.query }),
        ...(currentFilters.status !== 'all' && { status: currentFilters.status }),
        ...(currentFilters.category.length > 0 && { category: currentFilters.category.join(',') }),
        ...(currentFilters.type.length > 0 && { type: currentFilters.type.join(',') }),
      });

      const response = await fetcher(`${endpoints.invoice.services}?${params.toString()}`);
      return response;
    },
  });

  // Fetch last sync time
  const { data: lastSyncResponse } = useQuery({
    queryKey: ['service-last-sync'],
    queryFn: async () => {
      const response = await fetcher(endpoints.invoice.servicesLastSync);
      return response;
    },
  });

  // Fetch all services to get unique categories and types for filters
  const { data: allServicesResponse } = useQuery({
    queryKey: ['all-services-for-filters'],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: '1',
        rowsPerPage: '10000',
      });
      const response = await fetcher(`${endpoints.invoice.services}?${params.toString()}`);
      return response;
    },
  });

  const tableData = (serviceListResponse?.data || []) as ServiceItem[];
  const totalCount = serviceListResponse?.pagination?.totalCount || 0;

  // Get unique categories and types for filter options
  const allServices = useMemo(() => (allServicesResponse?.data || []) as ServiceItem[], [allServicesResponse?.data]);
  const categoryOptions = useMemo(() => {
    const categories = new Set<string>();
    allServices.forEach((service) => {
      if (service.category) categories.add(service.category);
    });
    return Array.from(categories).sort().map((cat) => ({ value: cat, label: cat }));
  }, [allServices]);

  const typeOptions = useMemo(() => {
    const types = new Set<string>();
    allServices.forEach((service) => {
      if (service.type) types.add(service.type);
    });
    return Array.from(types).sort().map((type) => ({ value: type, label: type }));
  }, [allServices]);

  const dataFiltered = tableData;

  // Get status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allServices.length, active: 0, inactive: 0 };
    allServices.forEach((service) => {
      if (service.status === 'active') counts.active += 1;
      if (service.status === 'inactive') counts.inactive += 1;
    });
    return counts;
  }, [allServices]);

  const canReset =
    !!currentFilters.query ||
    currentFilters.status !== 'all' ||
    currentFilters.category.length > 0 ||
    currentFilters.type.length > 0;

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      _updateFilters({ status: newValue });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table]
  );

  const handleSyncFromQBO = useCallback(async () => {
    const steps: ProgressStep[] = [
      { label: 'Connecting to QuickBooks', description: 'Establishing secure connection', status: 'pending' },
      { label: 'Fetching Items', description: 'Retrieving product and service data from QBO', status: 'pending' },
      { label: 'Processing Data', description: 'Processing and validating item data', status: 'pending' },
      { label: 'Updating Database', description: 'Saving items', status: 'pending' },
      { label: 'Syncing Tax Codes', description: 'Importing tax codes from QuickBooks', status: 'pending' },
      { label: 'Syncing Terms', description: 'Importing payment terms from QuickBooks', status: 'pending' },
      { label: 'Refreshing View', description: 'Updating product and service list', status: 'pending' },
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
        endpoints.invoice.servicesImportQBO,
        {
          method: 'POST',
          data: {},
        },
      ]);

      // Update step 3 (Updating Database) to completed, move to step 4 (Syncing Tax Codes)
      setSyncSteps((prev) =>
        prev.map((step, idx) =>
          idx === 3 ? { ...step, status: 'completed' } : idx === 4 ? { ...step, status: 'active' } : step
        )
      );
      setCurrentSyncStep(4);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update step 4 (Syncing Tax Codes) to completed, move to step 5 (Syncing Terms)
      setSyncSteps((prev) =>
        prev.map((step, idx) =>
          idx === 4 ? { ...step, status: 'completed' } : idx === 5 ? { ...step, status: 'active' } : step
        )
      );
      setCurrentSyncStep(5);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update step 5 (Syncing Terms) to completed, move to step 6 (Refreshing View)
      setSyncSteps((prev) =>
        prev.map((step, idx) =>
          idx === 5 ? { ...step, status: 'completed' } : idx === 6 ? { ...step, status: 'active' } : step
        )
      );
      setCurrentSyncStep(6);

      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service-last-sync'] });
      queryClient.invalidateQueries({ queryKey: ['all-services-for-filters'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-tax-codes'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-terms'] });

      await new Promise((resolve) => setTimeout(resolve, 300));
      setSyncSteps((prev) => prev.map((step, idx) => (idx === 6 ? { ...step, status: 'completed' } : step)));

      const totalSynced = (response.data.summary?.imported || 0) + (response.data.summary?.updated || 0);
      const taxCodesSynced = (response.data.taxCodes?.imported || 0) + (response.data.taxCodes?.updated || 0);
      const termsSynced = (response.data.terms?.imported || 0) + (response.data.terms?.updated || 0);
      
      let toastMessage = `Successfully synced ${totalSynced} items from QuickBooks Online! (${response.data.summary?.imported || 0} new, ${response.data.summary?.updated || 0} updated)`;
      if (taxCodesSynced > 0) {
        toastMessage += ` Also synced ${taxCodesSynced} tax code${taxCodesSynced !== 1 ? 's' : ''}.`;
      }
      if (termsSynced > 0) {
        toastMessage += ` Also synced ${termsSynced} payment term${termsSynced !== 1 ? 's' : ''}.`;
      }
      
      toast.success(toastMessage);
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
          heading="Products & Services"
          links={[
            { name: 'Management', href: paths.management.root },
            { name: 'Invoice', href: paths.management.invoice.root },
            { name: 'Products & Services' },
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
                      (tab.value === 'active' && 'success') ||
                      (tab.value === 'inactive' && 'warning') ||
                      'default'
                    }
                  >
                    {statusCounts[tab.value as keyof typeof statusCounts] || 0}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <ServiceTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            options={{ categories: categoryOptions, types: typeOptions }}
          />

          {canReset && (
            <ServiceTableFiltersResult
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
                  {isLoadingServices ? (
                    Array.from({ length: table.rowsPerPage }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                        <TableCell><Skeleton variant="text" width="80%" /></TableCell>
                        <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                        <TableCell><Skeleton variant="text" width="40%" /></TableCell>
                        <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                        <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                        <TableCell><Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <>
                      {dataFiltered.map((row: ServiceItem) => (
                        <TableRow key={row.id} hover>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{row.sales_description || ''}</TableCell>
                          <TableCell>{row.category || ''}</TableCell>
                          <TableCell>{row.type || ''}</TableCell>
                          <TableCell>
                            {row.price !== null ? `$${Number(row.price).toFixed(2)}` : ''}
                          </TableCell>
                          <TableCell>
                            {row.cost !== null ? `$${Number(row.cost).toFixed(2)}` : ''}
                          </TableCell>
                          <TableCell>
                            <Label
                              variant="soft"
                              color={row.status === 'active' ? 'success' : row.status === 'inactive' ? 'warning' : 'default'}
                            >
                              {row.status === 'active' ? 'Active' : row.status === 'inactive' ? 'Inactive' : row.status}
                            </Label>
                          </TableCell>
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
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      {/* Sync Progress Dialog */}
      <QboSyncProgressDialog
        open={syncDialogOpen}
        steps={syncSteps}
        currentStep={currentSyncStep}
        onClose={handleCloseSyncDialog}
        title="Syncing Products & Services from QuickBooks"
        subtitle="Please wait while we sync products, services, tax codes, and payment terms from QuickBooks Online. This may take a few moments. Do not close this window or navigate away."
        allowClose={!isSyncing}
      />
    </>
  );
}
