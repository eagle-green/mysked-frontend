import type { TableHeadCellProps } from 'src/components/table';
import type { IVehicleItem, IVehicleTableFilters } from 'src/types/vehicle';

import { useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { regionList, VEHICLE_TYPE_OPTIONS, VEHICLE_STATUS_OPTIONS } from 'src/assets/data';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
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
  { id: 'status', label: 'Status' },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function VehicleListView() {
  const table = useTable();
  const confirmDialog = useBoolean();

  // React Query for fetching vehicle list
  const { data: vehicleListData, refetch } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const response = await fetcher(endpoints.vehicle);
      return response.data.vehicles;
    },
  });

  // Use the fetched data or fallback to empty array
  const tableData = vehicleListData || [];

  const filters = useSetState<IVehicleTableFilters>({
    query: '',
    region: [],
    type: [],
    status: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!currentFilters.query ||
    currentFilters.region.length > 0 ||
    currentFilters.type.length > 0 ||
    currentFilters.status !== 'all';

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      const toastId = toast.loading('Deleting vehicle...');
      try {
        await fetcher([`${endpoints.vehicle}/${id}`, { method: 'DELETE' }]);
        toast.dismiss(toastId);
        toast.success('Delete success!');
        refetch();
        table.onUpdatePageDeleteRow(dataInPage.length);
      } catch (error) {
        toast.dismiss(toastId);
        console.error(error);
        toast.error('Failed to delete the vehicle.');
      }
    },
    [dataInPage.length, table, refetch]
  );

  const handleDeleteRows = useCallback(async () => {
    const toastId = toast.loading('Deleting vehicle...');
    try {
      await fetcher([
        endpoints.vehicle,
        {
          method: 'DELETE',
          data: { ids: table.selected },
        },
      ]);
      toast.dismiss(toastId);
      toast.success('Delete success!');
      refetch();
      table.onUpdatePageDeleteRows(dataInPage.length, dataFiltered.length);
    } catch (error) {
      console.error(error);
      toast.dismiss(toastId);
      toast.error('Failed to delete some vehicles.');
    }
  }, [dataFiltered.length, dataInPage.length, table, refetch]);

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title="Delete"
      content={
        <>
          Are you sure want to delete <strong> {table.selected.length} </strong> vehicles?
        </>
      }
      action={
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            handleDeleteRows();
            confirmDialog.onFalse();
          }}
        >
          Delete
        </Button>
      }
    />
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Vehicle List"
          links={[
            { name: 'Management' },
            { name: 'Resource' },
            { name: 'Vehicle' },
            { name: 'List' },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.resource.vehicle.create}
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
                      'default'
                    }
                  >
                    {['active', 'inactive'].includes(tab.value)
                      ? tableData.filter((vehicle: IVehicleItem) => vehicle.status === tab.value)
                          .length
                      : tableData.length}
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
                      <VehicleTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        editHref={paths.resource.vehicle.edit(row.id)}
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
  inputData: IVehicleItem[];
  filters: IVehicleTableFilters;
  comparator: (a: any, b: any) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { query, status, region, type } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (query) {
    const q = query.toLowerCase();

    inputData = inputData.filter((item) => (
        item.type?.toLowerCase().includes(q) ||
        item.license_plate?.toLowerCase().includes(q) ||
        item.unit_number?.toLowerCase().includes(q) ||
        item.region?.toLowerCase().includes(q) ||
        item.assigned_driver.first_name?.toLowerCase().includes(q) ||
        item.assigned_driver.last_name?.toLowerCase().includes(q)
      ));
  }

  if (status !== 'all') {
    inputData = inputData.filter((vehicle) => vehicle.status === status);
  }

  if (type.length) {
    inputData = inputData.filter((vehicle) => type.includes(vehicle.type));
  }

  if (region.length) {
    inputData = inputData.filter((vehicle) => region.includes(vehicle.region));
  }

  return inputData;
}
