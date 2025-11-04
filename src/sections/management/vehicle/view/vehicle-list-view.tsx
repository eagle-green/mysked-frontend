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
import TableBody from '@mui/material/TableBody';

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

const STATUS_OPTIONS = [{ value: 'all', label: 'All' }, ...VEHICLE_STATUS_OPTIONS];

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
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function VehicleListView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const table = useTable({
    defaultDense: true,
    defaultOrder: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
    defaultOrderBy: searchParams.get('orderBy') || 'created_at',
    defaultRowsPerPage: parseInt(searchParams.get('rowsPerPage') || '25', 10),
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

  // Update URL when filters or table state changes (debounced to prevent too many updates)
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
  ]);

  // Reset page when filters change (but not when page itself changes)
  useEffect(() => {
    table.onResetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilters.query, currentFilters.region, currentFilters.type, currentFilters.status]);

  // React Query for fetching vehicle list with pagination and filters
  const { data: vehicleListData, refetch } = useQuery({
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

      // Sorting parameters
      if (table.orderBy) params.set('orderBy', table.orderBy);
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
  const statusCounts = statusCountsData || { all: 0, active: 0, inactive: 0, repair: 0 };

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
        toast.error('Failed to delete the vehicle.');
        throw deleteError; // Re-throw to be caught by the table row component
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
                onSort={table.onSort}
              />

              <TableBody>
                {tableData.map((row: IVehicleItem) => (
                  <VehicleTableRow
                    key={row.id}
                    row={row}
                    onDeleteRow={() => handleDeleteRow(row.id)}
                    editHref={paths.management.vehicle.edit(row.id)}
                  />
                ))}

                <TableEmptyRows
                  height={table.dense ? 56 : 56 + 20}
                  emptyRows={emptyRows(0, table.rowsPerPage, tableData.length)}
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
