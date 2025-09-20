import type { TableHeadCellProps } from 'src/components/table';
import type { IClient, IClientTableFilters } from 'src/types/client';

import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

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
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { regionList } from 'src/assets/data';
import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { CLIENT_STATUS_OPTIONS } from 'src/assets/data/client';

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
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { ClientTableRow } from '../client-table-row';
import { ClientTableToolbar } from '../client-table-toolbar';
import { ClientTableFiltersResult } from '../client-table-filters-result';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [{ value: 'all', label: 'All' }, ...CLIENT_STATUS_OPTIONS];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'name', label: 'Name' },
  { id: 'region', label: 'Region' },
  { id: 'contact_number', label: 'Contact Number' },
  { id: 'email', label: 'Email' },
  { id: 'status', label: 'Status' },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function ClientListView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize table state from URL parameters
  const table = useTable({
    defaultDense: searchParams.get('dense') === 'false' ? false : true,
    defaultOrder: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
    defaultOrderBy: searchParams.get('orderBy') || 'created_at',
    defaultRowsPerPage: parseInt(searchParams.get('rowsPerPage') || '25', 10),
    defaultCurrentPage: parseInt(searchParams.get('page') || '1', 10) - 1,
  });

  const filters = useSetState<IClientTableFilters>({ 
    query: searchParams.get('search') || '', 
    region: searchParams.get('region') ? searchParams.get('region')!.split(',') : [],
    status: searchParams.get('status') || 'all' 
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  // Update URL when table state changes
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    
    // Always add pagination and sorting params to make URLs shareable
    params.set('page', (table.page + 1).toString());
    params.set('rowsPerPage', table.rowsPerPage.toString());
    params.set('orderBy', table.orderBy);
    params.set('order', table.order);
    params.set('dense', table.dense.toString());
    
    // Add filter params
    if (currentFilters.query) params.set('search', currentFilters.query);
    if (currentFilters.status !== 'all') params.set('status', currentFilters.status);
    if (currentFilters.region.length > 0) params.set('region', currentFilters.region.join(','));
    
    const url = `?${params.toString()}`;
    router.replace(`${window.location.pathname}${url}`);
  }, [table.page, table.rowsPerPage, table.orderBy, table.order, table.dense, currentFilters, router]);

  // Update URL when relevant state changes
  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // Reset page when filters change
  useEffect(() => {
    table.onResetPage();
  }, [currentFilters.query, currentFilters.status, currentFilters.region, table]);

  const confirmDialog = useBoolean();
  const [isDeleting, setIsDeleting] = useState(false);

  // React Query for fetching client list with server-side pagination
  const { data: clientListResponse, refetch, error, isLoading } = useQuery({
    queryKey: [
      'clients',
      table.page,
      table.rowsPerPage,
      table.orderBy,
      table.order,
      currentFilters.query,
      currentFilters.status,
      currentFilters.region.join(',')
    ],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          page: (table.page + 1).toString(),
          rowsPerPage: table.rowsPerPage.toString(),
          orderBy: table.orderBy,
          order: table.order,
          ...(currentFilters.status !== 'all' && { status: currentFilters.status }),
          ...(currentFilters.query && { search: currentFilters.query }),
          ...(currentFilters.region.length > 0 && { region: currentFilters.region.join(',') }),
        });
        
        const response = await fetcher(`${endpoints.management.client}?${params.toString()}`);
        return response.data;
      } catch (fetchError: any) {
        console.error('Error fetching clients:', fetchError);
        toast.error('Failed to fetch clients');
        return { clients: [], pagination: { totalCount: 0 } };
      }
    },
  });

  // Fetch status counts for tabs
  const { data: statusCountsResponse } = useQuery({
    queryKey: ['client-status-counts', currentFilters.query, currentFilters.region.join(',')],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(currentFilters.query && { search: currentFilters.query }),
        ...(currentFilters.region.length > 0 && { region: currentFilters.region.join(',') }),
      });
      
      const response = await fetcher(`${endpoints.management.client}/counts/status?${params.toString()}`);
      return response;
    },
  });

  // Use the fetched data or fallback to empty array
  const tableData = useMemo(() => clientListResponse?.clients || [], [clientListResponse]);
  const totalCount = clientListResponse?.pagination?.totalCount || 0;
  const statusCounts = statusCountsResponse?.data || { all: 0, active: 0, inactive: 0 };

  // Server-side pagination means no client-side filtering needed
  const dataFiltered = tableData;

  const canReset = !!currentFilters.query || currentFilters.region.length > 0 || currentFilters.status !== 'all';

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      const toastId = toast.loading('Deleting client...');
      try {
        await fetcher([`${endpoints.management.client}/${id}`, { method: 'DELETE' }]);
        toast.dismiss(toastId);
        toast.success('Delete success!');
        refetch();
        table.onUpdatePageDeleteRow(dataFiltered.length);
      } catch (deleteError) {
        console.error(deleteError);
        toast.dismiss(toastId);
        toast.error('Failed to delete the client.');
      }
    },
    [dataFiltered.length, table, refetch]
  );

  const handleDeleteRows = useCallback(async () => {
    setIsDeleting(true);
    const toastId = toast.loading('Deleting clients...');
    try {
      await fetcher([
        endpoints.management.client,
        {
          method: 'DELETE',
          data: { ids: table.selected },
        },
      ]);

      toast.dismiss(toastId);
      toast.success('Delete success!');
      refetch();
      table.onUpdatePageDeleteRows(dataFiltered.length, totalCount);
    } catch (deleteRowsError) {
      console.error(deleteRowsError);
      toast.dismiss(toastId);
      toast.error('Failed to delete some clients.');
    } finally {
      setIsDeleting(false);
      confirmDialog.onFalse();
    }
  }, [dataFiltered.length, totalCount, table, refetch, confirmDialog]);

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const renderConfirmDialog = () => (
    <Dialog open={confirmDialog.value} onClose={confirmDialog.onFalse} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Clients</DialogTitle>
      <DialogContent>
        Are you sure you want to delete <strong>{table.selected.length}</strong> client
        {table.selected.length > 1 ? 's' : ''}?
      </DialogContent>
      <DialogActions>
        <Button onClick={confirmDialog.onFalse} disabled={isDeleting} sx={{ mr: 1 }}>
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

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Client List"
          links={[
            { name: 'Management' },
            { name: 'Contact' },
            { name: 'Client' },
            { name: 'List' },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.management.client.create}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              New Client
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          {/* Debug info */}
          {error && (
            <Box sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
              Error loading clients: {JSON.stringify(error)}
            </Box>
          )}
          {isLoading && (
            <Box sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
              Loading clients...
            </Box>
          )}

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
                      'default'
                    }
                  >
                    {statusCounts[tab.value as keyof typeof statusCounts] || 0}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <ClientTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            options={{ regions: regionList }}
          />

          {canReset && (
            <ClientTableFiltersResult
              filters={filters}
              totalResults={totalCount}
              onResetPage={table.onResetPage}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered.filter((row: IClient) => row.status === 'inactive').length}
              onSelectAllRows={(checked) => {
                // Only select/deselect rows with inactive status
                const selectableRowIds = dataFiltered
                  .filter((row: IClient) => row.status === 'inactive')
                  .map((row: IClient) => row.id);
                
                if (checked) {
                  // Select all inactive rows
                  table.onSelectAllRows(true, selectableRowIds);
                } else {
                  // Deselect all rows
                  table.onSelectAllRows(false, []);
                }
              }}
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
                  rowCount={totalCount}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) => {
                    // Only select/deselect rows with inactive status
                    const selectableRowIds = dataFiltered
                      .filter((row: IClient) => row.status === 'inactive')
                      .map((row: IClient) => row.id);
                    
                    if (checked) {
                      // Select all inactive rows
                      table.onSelectAllRows(true, selectableRowIds);
                    } else {
                      // Deselect all rows
                      table.onSelectAllRows(false, []);
                    }
                  }}
                />

                <TableBody>
                  {dataFiltered.map((row: IClient) => (
                      <ClientTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        editHref={paths.management.client.edit(row.id)}
                      />
                    ))}

                  <TableEmptyRows
                    height={table.dense ? 56 : 56 + 20}
                    emptyRows={emptyRows(table.page, table.rowsPerPage, totalCount)}
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
            rowsPerPageOptions={[10, 25, 50, 100]}
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
