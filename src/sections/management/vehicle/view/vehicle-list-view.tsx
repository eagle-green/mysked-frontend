import type { TableHeadCellProps } from 'src/components/table';
import type { IVehicleItem, IVehicleTableFilters } from 'src/types/vehicle';

import { useEffect, useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useSetState } from 'minimal-shared/hooks';

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

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { regionList, VEHICLE_TYPE_OPTIONS, VEHICLE_STATUS_OPTIONS } from 'src/assets/data';

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

import { VehicleTableRow } from '../vehicle-table-row';
import { VehicleTableToolbar } from '../vehicle-table-toolbar';
import { VehicleTableFiltersResult } from '../vehicle-table-filters-result';
// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  ...VEHICLE_STATUS_OPTIONS,
  { value: 'inadequate_inventory', label: 'Inventory issues' },
];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'type', label: 'Type' },
  { id: 'license_plate', label: 'License Plate' },
  { id: 'unit_number', label: 'Unit Number' },
  { id: 'assigned_driver', label: 'Assigned Driver' },
  { id: 'region', label: 'Region' },
  { id: 'spare_key', label: 'Spare Key', align: 'center' },
  { id: 'winter_tire', label: 'Winter Tire', align: 'center' },
  { id: 'tow_hitch', label: 'Tow Hitch', align: 'center' },
  { id: 'status', label: 'Status' },
  { id: 'inventory_status', label: '', width: 48, align: 'center' },
  { id: '', width: 88 },
];

// Map frontend column IDs to backend sortable field names
const SORTABLE_COLUMNS: Record<string, string> = {
  type: 'type',
  license_plate: 'license_plate',
  assigned_driver: 'assigned_driver_first_name',
  region: 'region',
  status: 'status',
  created_at: 'created_at',
  unit_number: 'unit_number',
  spare_key: 'is_spare_key',
  winter_tire: 'is_winter_tire',
  tow_hitch: 'is_tow_hitch',
};

// Columns that are not sortable (inventory_status badge column and actions column)
const NON_SORTABLE_COLUMNS = ['inventory_status', ''];

// ----------------------------------------------------------------------

export function VehicleListView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Map backend field name from URL to frontend column ID (or keep backend field name if no mapping exists)
  const getFrontendOrderBy = (backendField: string | null): string => {
    if (!backendField) return 'created_at';
    // Find frontend column ID that maps to this backend field
    const frontendId = Object.entries(SORTABLE_COLUMNS).find(
      ([, backend]) => backend === backendField
    )?.[0];
    // If no mapping found, it's already a backend field name (like 'created_at'), keep it as is
    return frontendId || backendField;
  };

  const table = useTable({
    defaultDense: true,
    defaultOrder: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
    defaultOrderBy: getFrontendOrderBy(searchParams.get('orderBy')),
    defaultRowsPerPage: parseInt(searchParams.get('rowsPerPage') || '25', 10) || 25,
    defaultCurrentPage: parseInt(searchParams.get('page') || '1', 10) - 1,
  });

  // Initialize filters from URL parameters
  const filters = useSetState<IVehicleTableFilters>({
    query: searchParams.get('search') || '',
    region: searchParams.get('region')
      ? searchParams.get('region')!.split(',').filter(Boolean)
      : [],
    type: searchParams.get('type') ? searchParams.get('type')!.split(',').filter(Boolean) : [],
    status: searchParams.get('status') || 'all',
  });

  const { state: currentFilters, setState: updateFilters } = filters;

  // Get backend field name for API call
  const getBackendOrderBy = useCallback(() => {
    const orderBy = table.orderBy;
    // If it's a frontend column ID, map it to backend field name
    if (SORTABLE_COLUMNS[orderBy]) {
      return SORTABLE_COLUMNS[orderBy];
    }
    // If it's already a backend field name (like 'created_at'), use it directly
    return orderBy || 'created_at';
  }, [table.orderBy]);

  // Update URL when filters or table state changes (debounced to prevent too many updates)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams();

      // Always include page (convert from 0-based to 1-based)
      params.set('page', String(table.page + 1));

      // Always include rowsPerPage
      params.set('rowsPerPage', String(table.rowsPerPage));

      // Always include orderBy and order - map frontend column ID to backend field name
      const backendOrderBy = getBackendOrderBy();
      params.set('orderBy', backendOrderBy);
      params.set('order', table.order);

      // Always include dense
      params.set('dense', table.dense ? 'true' : 'false');

      // Include filters only if they have values - trim search query
      const trimmedQuery = (currentFilters.query || '').trim();
      if (trimmedQuery) params.set('search', trimmedQuery);
      if (currentFilters.region.length > 0) params.set('region', currentFilters.region.join(','));
      if (currentFilters.type.length > 0) params.set('type', currentFilters.type.join(','));
      if (currentFilters.status !== 'all') params.set('status', currentFilters.status);

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
    table.dense,
    currentFilters.query,
    currentFilters.region,
    currentFilters.type,
    currentFilters.status,
    getBackendOrderBy,
  ]);

  // Reset page when filters change (but not when page itself changes)
  useEffect(() => {
    table.onResetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilters.query, currentFilters.region, currentFilters.type, currentFilters.status]);

  // React Query for fetching vehicle list with pagination and filters
  const { data: vehicleListData, refetch, isLoading } = useQuery({
    queryKey: [
      'vehicles',
      table.page,
      table.rowsPerPage,
      table.orderBy,
      table.order,
      (currentFilters.query || '').trim(),
      currentFilters.region.join(','),
      currentFilters.type.join(','),
      currentFilters.status,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();

      // Pagination parameters
      params.set('page', String(table.page + 1));
      params.set('rowsPerPage', String(table.rowsPerPage));

      // Sorting parameters - map frontend column ID to backend field name
      const backendOrderBy = getBackendOrderBy();
      if (backendOrderBy) params.set('orderBy', backendOrderBy);
      if (table.order) params.set('order', table.order);

      // Filter parameters - trim search query to remove leading/trailing whitespace
      const trimmedQuery = (currentFilters.query || '').trim();
      if (trimmedQuery) params.set('search', trimmedQuery);
      if (currentFilters.region.length > 0) params.set('region', currentFilters.region.join(','));
      if (currentFilters.type.length > 0) params.set('type', currentFilters.type.join(','));
      if (currentFilters.status !== 'all') params.set('status', currentFilters.status);

      const response = await fetcher(`${endpoints.management.vehicle}?${params.toString()}`);
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  // React Query for fetching vehicle status counts
  const { data: statusCountsData } = useQuery({
    queryKey: [
      'vehicle-status-counts',
      (currentFilters.query || '').trim(),
      currentFilters.region.join(','),
      currentFilters.type.join(','),
    ],
    queryFn: async () => {
      const params = new URLSearchParams();

      const trimmedQuery = (currentFilters.query || '').trim();
      if (trimmedQuery) params.set('search', trimmedQuery);
      if (currentFilters.type.length > 0) params.set('type', currentFilters.type.join(','));
      if (currentFilters.region.length > 0) params.set('region', currentFilters.region.join(','));

      const response = await fetcher(
        `${endpoints.management.vehicle}/counts/status?${params.toString()}`
      );
      return response.data;
    },
  });

  // Use the fetched data or fallback to empty values
  const tableData = vehicleListData?.vehicles || [];
  const totalCount = vehicleListData?.pagination?.totalCount || 0;
  const statusCounts = statusCountsData || {
    all: 0,
    active: 0,
    inactive: 0,
    repair: 0,
    inadequate_inventory: 0,
  };

  const canReset =
    !!currentFilters.query ||
    currentFilters.region.length > 0 ||
    currentFilters.type.length > 0 ||
    currentFilters.status !== 'all';

  const notFound = (!tableData.length && canReset) || !tableData.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      const toastId = toast.loading('Deleting vehicle...');
      try {
        await fetcher([`${endpoints.management.vehicle}/${id}`, { method: 'DELETE' }]);
        toast.dismiss(toastId);
        toast.success('Delete success!');
        refetch();
        table.onUpdatePageDeleteRow(tableData.length);
      } catch (deleteError) {
        toast.dismiss(toastId);
        console.error(deleteError);

        // Build a specific error message to be shown in a dialog by the caller
        const backendMessage =
          (deleteError as any)?.error ||
          (deleteError as any)?.message ||
          (deleteError as any)?.response?.data?.error;

        const activeJobsCount =
          (deleteError as any)?.details?.activeJobsCount ??
          (deleteError as any)?.response?.data?.details?.activeJobsCount;

        const errorMessage =
          activeJobsCount && backendMessage
            ? `${backendMessage} (Active jobs: ${activeJobsCount})`
            : backendMessage || 'Failed to delete the vehicle.';

        // Re-throw a normalized error so the row component can decide how to display it (e.g., dialog)
        throw { __vehicleDeleteError: true, message: errorMessage };
      }
    },
    [tableData.length, table, refetch]
  );

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  // Custom sort handler that maps frontend column IDs to backend field names
  const handleSort = useCallback(
    (id: string) => {
      // Don't sort if column is not sortable (empty string for actions column)
      if (NON_SORTABLE_COLUMNS.includes(id)) {
        return;
      }

      // Use the table's onSort with the frontend column ID
      // We'll map it to backend field name when making the API call
      table.onSort(id);
    },
    [table]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Vehicle List"
        links={[{ name: 'Management' }, { name: 'Vehicle' }, { name: 'List' }]}
        action={
          <Button
            component={RouterLink}
            href={paths.management.vehicle.create}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            New Vehicle
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
                    (tab.value === 'active' && 'success') ||
                    (tab.value === 'inactive' && 'error') ||
                    (tab.value === 'repair' && 'warning') ||
                    (tab.value === 'inadequate_inventory' && 'warning') ||
                    'default'
                  }
                >
                  {statusCounts[tab.value as keyof typeof statusCounts] || 0}
                </Label>
              }
            />
          ))}
        </Tabs>

        <VehicleTableToolbar
          filters={filters}
          onResetPage={table.onResetPage}
          options={{ types: VEHICLE_TYPE_OPTIONS, regions: regionList }}
        />

        {canReset && (
          <VehicleTableFiltersResult
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
                onSort={handleSort}
              />

              <TableBody>
                {isLoading ? (
                  Array.from({ length: table.rowsPerPage }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="80%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Skeleton variant="circular" width={32} height={32} />
                          <Skeleton variant="text" width="60%" />
                        </Box>
                      </TableCell>
                      <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                      <TableCell align="center"><Skeleton variant="rectangular" width={24} height={24} sx={{ borderRadius: 0.5, mx: 'auto' }} /></TableCell>
                      <TableCell align="center"><Skeleton variant="rectangular" width={24} height={24} sx={{ borderRadius: 0.5, mx: 'auto' }} /></TableCell>
                      <TableCell align="center"><Skeleton variant="rectangular" width={24} height={24} sx={{ borderRadius: 0.5, mx: 'auto' }} /></TableCell>
                      <TableCell><Skeleton variant="rectangular" width={64} height={24} sx={{ borderRadius: 1 }} /></TableCell>
                      <TableCell align="center"><Skeleton variant="circular" width={24} height={24} sx={{ mx: 'auto' }} /></TableCell>
                      <TableCell><Skeleton variant="circular" width={32} height={32} /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <>
                    {tableData.map((row: IVehicleItem) => (
                      <VehicleTableRow
                        key={row.id}
                        row={row}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        editHref={paths.management.vehicle.edit(row.id)}
                        showExpandableInventory={currentFilters.status === 'inadequate_inventory'}
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
          onPageChange={(event, newPage) => {
            table.onChangePage(event, newPage);
          }}
          onChangeDense={(event) => {
            table.onChangeDense(event);
          }}
          onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            table.onChangeRowsPerPage(event);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="Rows per page:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
        />
      </Card>
    </DashboardContent>
  );
}
