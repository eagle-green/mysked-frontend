import type { TableHeadCellProps } from 'src/components/table';

import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

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

import { VehicleUserAccessTableRow } from '../vehicle-user-access-table-row';
import { VehicleUserAccessTableToolbar } from '../vehicle-user-access-table-toolbar';
import { VehicleUserAccessTableFiltersResult } from '../vehicle-user-access-table-filters-result';

import type { VehicleUserAccessFilters } from '../vehicle-user-access-table-toolbar';

// ----------------------------------------------------------------------

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'user', label: 'User', width: '40%' },
  { id: 'role', label: 'Role', width: '25%' },
  { id: 'vehicle_access', label: 'Vehicle Access', width: '25%' },
  { id: 'actions', label: 'Actions', width: '10%', align: 'right' },
];

// ----------------------------------------------------------------------

interface VehicleUserAccessRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  photo_url?: string;
  vehicle_access?: boolean;
  access_id?: string;
}

function filterData(
  data: VehicleUserAccessRow[],
  filters: VehicleUserAccessFilters
): VehicleUserAccessRow[] {
  let result = data;

  if (filters.query?.trim()) {
    const q = filters.query.trim().toLowerCase();
    result = result.filter(
      (row) =>
        (row.first_name?.toLowerCase() || '').includes(q) ||
        (row.last_name?.toLowerCase() || '').includes(q) ||
        (row.email?.toLowerCase() || '').includes(q)
    );
  }

  if (filters.role?.length > 0) {
    result = result.filter((row) => filters.role.includes(row.role));
  }

  if (filters.vehicle_access === 'enabled') {
    result = result.filter((row) => row.vehicle_access === true);
  } else if (filters.vehicle_access === 'disabled') {
    result = result.filter((row) => row.vehicle_access !== true);
  }

  return result;
}

export function VehicleUserAccessListView() {
  const router = useRouter();
  const table = useTable({
    defaultDense: true,
    defaultOrderBy: 'last_name',
    defaultOrder: 'asc' as const,
    defaultRowsPerPage: 25,
  });

  const filters = useSetState<VehicleUserAccessFilters>({
    query: '',
    role: [],
    vehicle_access: 'all',
  });

  const { state: currentFilters } = filters;

  const { data: vehicleUsersResponse, isLoading, error } = useQuery({
    queryKey: ['vehicle-user-access'],
    queryFn: async () => {
      const response = await fetcher(endpoints.invoice.userAccess.vehicleUsers);
      return response.data || [];
    },
  });

  const dataFiltered = useMemo(() => {
    const tableData: VehicleUserAccessRow[] = Array.isArray(vehicleUsersResponse)
      ? vehicleUsersResponse
      : [];
    return filterData(tableData, currentFilters);
  }, [vehicleUsersResponse, currentFilters]);

  const totalCount = dataFiltered.length;
  const notFound = !dataFiltered.length;
  const paginatedItems = useMemo(
    () =>
      dataFiltered.slice(
        table.page * table.rowsPerPage,
        table.page * table.rowsPerPage + table.rowsPerPage
      ),
    [dataFiltered, table.page, table.rowsPerPage]
  );

  const canReset =
    !!currentFilters.query ||
    currentFilters.role.length > 0 ||
    currentFilters.vehicle_access !== 'all';

  const handleEdit = useCallback(
    (userId: string) => {
      router.push(paths.management.vehicle.userAccess.edit(userId));
    },
    [router]
  );

  if (isLoading) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Vehicle User Access"
          links={[
            { name: 'Management' },
            { name: 'Vehicle', href: paths.management.vehicle.list },
            { name: 'User Access' },
          ]}
          sx={{ mb: 3 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <Typography>Loading workers...</Typography>
        </Box>
      </DashboardContent>
    );
  }

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Vehicle User Access"
          links={[
            { name: 'Management' },
            { name: 'Vehicle', href: paths.management.vehicle.list },
            { name: 'User Access' },
          ]}
          sx={{ mb: 3 }}
        />
        <Box sx={{ py: 3 }}>
          <Typography variant="h4" gutterBottom>
            Error loading workers
          </Typography>
          <Typography variant="body1" color="error">
            {(error as Error)?.message || 'Failed to load vehicle user access list'}
          </Typography>
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Vehicle User Access"
        links={[
          { name: 'Management' },
          { name: 'Vehicle', href: paths.management.vehicle.list },
          { name: 'User Access' },
        ]}
        sx={{ mb: 3 }}
      />

      <Card>
        <VehicleUserAccessTableToolbar
          filters={filters}
          onResetPage={table.onResetPage}
        />

        {canReset && (
          <VehicleUserAccessTableFiltersResult
            filters={filters}
            totalResults={totalCount}
            onResetPage={table.onResetPage}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        <Box sx={{ position: 'relative' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ tableLayout: 'auto' }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headCells={TABLE_HEAD}
                rowCount={paginatedItems.length}
                numSelected={0}
                onSort={table.onSort}
              />

              <TableBody>
                {isLoading ? (
                  Array.from({ length: table.rowsPerPage }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton variant="circular" width={40} height={40} sx={{ display: 'inline-block' }} /><Skeleton variant="text" width="60%" sx={{ ml: 1, display: 'inline-block', verticalAlign: 'middle' }} /></TableCell>
                      <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                      <TableCell><Skeleton variant="rectangular" width={24} height={24} sx={{ borderRadius: 0.5 }} /></TableCell>
                      <TableCell align="right"><Skeleton variant="circular" width={32} height={32} sx={{ ml: 'auto' }} /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <>
                    {paginatedItems.map((row: VehicleUserAccessRow) => (
                      <VehicleUserAccessTableRow
                        key={row.id}
                        row={row}
                        onEdit={() => handleEdit(row.id)}
                      />
                    ))}
                    <TableEmptyRows
                      height={0}
                      emptyRows={emptyRows(table.page, table.rowsPerPage, totalCount)}
                    />
                    <TableNoData notFound={!!notFound} />
                  </>
                )}
              </TableBody>
            </Table>
          </Scrollbar>
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
    </DashboardContent>
  );
}
