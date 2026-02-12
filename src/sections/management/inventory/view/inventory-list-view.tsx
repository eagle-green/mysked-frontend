import type { TableHeadCellProps } from 'src/components/table';
import type { IInventoryItem, IInventoryTableFilters } from 'src/types/inventory';

import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useSetState } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

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

import { InventoryTableToolbar } from '../inventory-table-toolbar';
import { InventoryTableRow } from '../inventory-table-row-component';
import { InventoryTableFiltersResult } from '../inventory-table-filters-result';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
];

// Category options removed - now using dynamic inventory types from API

const TAB_OPTIONS = [
  { value: 'all', label: 'All' },
];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'name', label: 'Product Name' },
  { id: 'type', label: 'Type' },
  { id: 'quantity', label: 'Qty' },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function InventoryListView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const table = useTable({
    defaultDense: true,
    defaultOrder: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
    defaultOrderBy: searchParams.get('orderBy') || 'created_at',
    defaultRowsPerPage: parseInt(searchParams.get('rowsPerPage') || '25', 10),
    defaultCurrentPage: parseInt(searchParams.get('page') || '1', 10) - 1,
  });

  const [currentTab, setCurrentTab] = useState('all');

  // Initialize filters from URL parameters
  const filters = useSetState<IInventoryTableFilters>({
    query: searchParams.get('search') || '',
    status: [],
    category: searchParams.get('category') ? searchParams.get('category')!.split(',').filter(Boolean) : [],
  });

  const { state: currentFilters } = filters;

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
      if (currentFilters.category.length > 0) params.set('category', currentFilters.category.join(','));

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
    currentFilters.category,
  ]);

  // Reset page when filters change (but not when page itself changes)
  useEffect(() => {
    table.onResetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilters.query, currentFilters.category]);

  // React Query for fetching inventory list with pagination and filters
  const { data: inventoryListData, refetch, isLoading } = useQuery({
    queryKey: [
      'inventory-list',
      table.page,
      table.rowsPerPage,
      table.orderBy,
      table.order,
      (currentFilters.query || '').trim(),
      currentFilters.category.join(','),
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(table.page + 1),
        rowsPerPage: String(table.rowsPerPage),
        orderBy: table.orderBy,
        order: table.order,
      });
      const trimmedQuery = (currentFilters.query || '').trim();
      if (trimmedQuery) params.set('search', trimmedQuery);
      if (currentFilters.category.length > 0) params.set('category', currentFilters.category.join(','));
      
      const url = `${endpoints.management.inventory || '/api/inventory'}?${params.toString()}`;
      const res = await fetcher([url, { method: 'GET' }]);
      return res;
    },
    staleTime: 0,
    placeholderData: (previousData: any) => previousData,
  });

  // Use the fetched data or fallback to empty values
  const tableData = inventoryListData?.data?.inventory || [];
  const totalCount = inventoryListData?.data?.pagination?.totalCount || 0;

  const canReset =
    !!currentFilters.query ||
    currentFilters.category.length > 0;

  const notFound = (!tableData.length && canReset) || !tableData.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      const toastId = toast.loading('Deleting inventory item...');
      try {
        await fetcher([`${endpoints.management.inventory || '/api/inventory'}/${id}`, { method: 'DELETE' }]);
        toast.dismiss(toastId);
        toast.success('Delete success!');
        refetch();
        table.onUpdatePageDeleteRow(tableData.length);
      } catch (deleteError) {
        toast.dismiss(toastId);
        console.error(deleteError);
        toast.error('Failed to delete the inventory item.');
        throw deleteError;
      }
    },
    [tableData.length, table, refetch]
  );

  const handleChangeTab = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  }, []);

  return (
    <DashboardContent>
        <CustomBreadcrumbs
          heading="Inventory"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Management', href: paths.dashboard.root },
            { name: 'Inventory' },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.management.inventory.create}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              Add Inventory
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Tabs
            value={currentTab}
            onChange={handleChangeTab}
            sx={[
              (theme) => ({
                px: 2.5,
                boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
              }),
            ]}
          >
            {TAB_OPTIONS.map((tab) => (
              <Tab
                key={tab.value}
                iconPosition="end"
                value={tab.value}
                label={tab.label}
                icon={
                  <Label
                    variant={(tab.value === 'all' || tab.value === currentTab) ? 'filled' : 'soft'}
                    color="default"
                  >
                    {totalCount}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <InventoryTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            options={{ status: STATUS_OPTIONS }}
          />

          {canReset && (
            <InventoryTableFiltersResult
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
                  {isLoading ? (
                    // Skeleton loading rows
                    Array.from({ length: table.rowsPerPage }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        {/* Product Name */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Skeleton variant="rectangular" width={64} height={64} sx={{ borderRadius: 1 }} />
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Skeleton variant="text" width="60%" height={24} />
                                <Skeleton variant="rectangular" width={40} height={20} sx={{ borderRadius: 0.5 }} />
                              </Box>
                              <Skeleton variant="text" width="50%" height={16} />
                              <Skeleton variant="text" width="40%" height={16} sx={{ mt: 0.5 }} />
                            </Box>
                          </Box>
                        </TableCell>
                        {/* Type */}
                        <TableCell>
                          <Skeleton variant="text" width="70%" height={24} />
                        </TableCell>
                        {/* Quantity */}
                        <TableCell>
                          <Skeleton variant="text" width="40%" height={24} />
                        </TableCell>
                        {/* Actions */}
                        <TableCell>
                          <Skeleton variant="circular" width={32} height={32} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <>
                      {tableData.map((row: IInventoryItem) => (
                        <InventoryTableRow
                          key={row.id}
                          row={row}
                          onDeleteRow={() => handleDeleteRow(row.id)}
                          editHref={paths.management.inventory.edit(row.id)}
                          detailHref={paths.management.inventory.detail(row.id)}
                        />
                      ))}

                      <TableEmptyRows
                        height={0}
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
