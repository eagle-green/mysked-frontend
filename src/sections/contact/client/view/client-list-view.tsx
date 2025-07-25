import type { TableHeadCellProps } from 'src/components/table';
import type { IClient, IClientTableFilters } from 'src/types/client';

import { useState, useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
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
import { RouterLink } from 'src/routes/components';

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
  rowInPage,
  TableNoData,
  getComparator,
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
  const table = useTable();
  const confirmDialog = useBoolean();
  const [isDeleting, setIsDeleting] = useState(false);

  // React Query for fetching client lilst
  const { data: clientListData, refetch } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await fetcher(endpoints.client);
      return response.data.clients;
    },
  });

  // Use the fetched data or fallback to empty array
  const tableData = clientListData || [];

  const filters = useSetState<IClientTableFilters>({ query: '', region: [], status: 'all' });
  const { state: currentFilters, setState: updateFilters } = filters;

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!currentFilters.query || currentFilters.region.length > 0 || currentFilters.status !== 'all';

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      const toastId = toast.loading('Deleting client...');
      try {
        const publicId = `clients/${id}/logo_${id}`;
        await fetcher([`${endpoints.client}/${id}`, { method: 'DELETE' }]);

        // Prepare for Cloudinary deletion
        const timestamp = Math.floor(Date.now() / 1000);
        const query = new URLSearchParams({
          public_id: publicId,
          timestamp: timestamp.toString(),
          action: 'destroy',
        }).toString();

        const { signature, api_key, cloud_name } = await fetcher([
          `${endpoints.cloudinary}/signature?${query}`,
          { method: 'GET' },
        ]);

        const formData = new FormData();
        formData.append('public_id', publicId);
        formData.append('api_key', api_key);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);

        // Actually delete the image on Cloudinary
        await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/destroy`, {
          method: 'POST',
          body: formData,
        });

        toast.dismiss(toastId);
        toast.success('Delete success!');
        refetch();
        table.onUpdatePageDeleteRow(dataInPage.length);
      } catch (error) {
        toast.dismiss(toastId);
        console.error(error);
        toast.error('Failed to delete the client.');
        throw error; // Re-throw to be caught by the table row component
      }
    },
    [dataInPage.length, table, refetch]
  );

  const handleDeleteRows = useCallback(async () => {
    setIsDeleting(true);
    const toastId = toast.loading('Deleting clients...');
    try {
      await fetcher([
        endpoints.client,
        {
          method: 'DELETE',
          data: { ids: table.selected },
        },
      ]);
      toast.dismiss(toastId);
      toast.success('Delete success!');
      refetch();
      table.onUpdatePageDeleteRows(dataInPage.length, dataFiltered.length);
      confirmDialog.onFalse();
    } catch (error) {
      console.error(error);
      toast.dismiss(toastId);
      toast.error('Failed to delete some clients.');
    } finally {
      setIsDeleting(false);
    }
  }, [dataFiltered.length, dataInPage.length, table, refetch, confirmDialog]);

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const renderConfirmDialog = () => (
    <Dialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Delete Clients</DialogTitle>
      <DialogContent>
        Are you sure you want to delete <strong>{table.selected.length}</strong> client{table.selected.length > 1 ? 's' : ''}?
      </DialogContent>
      <DialogActions>
        <Button
          onClick={confirmDialog.onFalse}
          disabled={isDeleting}
          sx={{ mr: 1 }}
        >
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
              href={paths.contact.client.create}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              New Client
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
                      'default'
                    }
                  >
                    {['active', 'inactive'].includes(tab.value)
                      ? tableData.filter((client: IClient) => client.status === tab.value).length
                      : tableData.length}
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
              totalResults={dataFiltered.length}
              onResetPage={table.onResetPage}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered.length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  dataFiltered.map((row) => row.id)
                )
              }
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
                  rowCount={dataFiltered.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      dataFiltered.map((row) => row.id)
                    )
                  }
                />

                <TableBody>
                  {dataFiltered
                    .slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .map((row) => (
                      <ClientTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        editHref={paths.contact.client.edit(row.id)}
                      />
                    ))}

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

      {renderConfirmDialog()}
    </>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: IClient[];
  filters: IClientTableFilters;
  comparator: (a: any, b: any) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { query, status, region } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (query) {
    const q = query.toLowerCase();

    inputData = inputData.filter(
      (client) =>
        client.name?.toLowerCase().includes(q) ||
        client.email?.toLowerCase().includes(q) ||
        client.contact_number?.toLowerCase().includes(q) ||
        client.region?.toLowerCase().includes(q)
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((client) => client.status === status);
  }

  if (region.length) {
    inputData = inputData.filter((client) => region.includes(client.region));
  }

  return inputData;
}
