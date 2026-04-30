import dayjs from 'dayjs';
import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useSetState } from 'minimal-shared/hooks';
import { useCallback, useEffect, useMemo } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';

import { useRouter } from 'src/routes/hooks/use-router';
import { useSearchParams } from 'src/routes/hooks/use-search-params';

import { endpoints, fetcher } from 'src/lib/axios';

import { Label } from 'src/components/label/label';
import { emptyRows } from 'src/components/table/utils';
import { useTable } from 'src/components/table/use-table';
import { Scrollbar } from 'src/components/scrollbar/scrollbar';
import { TableNoData } from 'src/components/table/table-no-data';
import { TableEmptyRows } from 'src/components/table/table-empty-rows';
import { TablePaginationCustom } from 'src/components/table/table-pagination-custom';
import { TableHeadCellProps, TableHeadCustom } from 'src/components/table/table-head-custom';

import { IUser } from 'src/types/user';

import { AdminPreTripTableToolbar } from './pre-trip-vehecle-table-toolbar';
import { AdminPreTripVehicleTableView } from './pre-trip-vehicle-table-row';
import { AdminPreTripVehicleFilterResult } from './pre-trip-vehicle-table-fitler-result';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'submitted', label: 'Submitted' },
];
const TYPES = [{ value: 'Pre-Trip', label: 'Pre-Trip' }];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'job_number', label: 'Job #' },
  { id: 'job_start_date', label: 'Job Start Date' },
  { id: 'job_start_end', label: 'Job End Date' },
  { id: 'driver_name', label: 'Driver Name' },
  { id: 'vehicle', label: 'Vehicle' },
  { id: 'type', label: 'Type' },
  { id: 'status', label: 'Status' },
  { id: 'submitted_by', label: 'Submitted By' },
  { id: '', width: 88 },
];

//-------------------------------------------------------------------------------

export function AdminPreTripVehicleListComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const table = useTable({
    defaultDense: true,
    defaultOrder: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
    defaultOrderBy: searchParams.get('orderBy') || 'created_at',
    defaultRowsPerPage: parseInt(searchParams.get('rowsPerPage') || '25', 10),
    defaultCurrentPage: parseInt(searchParams.get('page') || '1', 10) - 1,
  });

  // Filters
  const filters = useSetState({
    query: searchParams.get('search') || '',
    drivers: searchParams.get('drivers')
      ? searchParams
          .get('drivers')!
          .split(',')
          .map((value) => ({ value, name: '' }))
      : [],
    vehicles: searchParams.get('vehicles')
      ? searchParams
          .get('vehicles')!
          .split(',')
          .map((value) => ({ value, name: '' }))
      : [],
    status: searchParams.get('status') || 'all',
    startDate: searchParams.get('startDate') ? dayjs(searchParams.get('startDate')!) : null,
    endDate: searchParams.get('endDate') ? dayjs(searchParams.get('endDate')!) : null,
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
    if (currentFilters.drivers.length > 0)
      params.set(
        'drivers',
        currentFilters.drivers
          .filter((c) => c?.value)
          .map((c) => c.value)
          .join(',')
      );
    if (currentFilters.vehicles.length > 0)
      params.set(
        'vehicles',
        currentFilters.vehicles
          .filter((c) => c?.value)
          .map((c) => c.value)
          .join(',')
      );
    if (currentFilters.startDate)
      params.set('startDate', currentFilters.startDate.format('YYYY-MM-DD'));
    if (currentFilters.endDate) params.set('endDate', currentFilters.endDate.format('YYYY-MM-DD'));

    const url = `?${params.toString()}`;
    router.replace(`${window.location.pathname}${url}`);
  }, [
    table.page,
    table.rowsPerPage,
    table.orderBy,
    table.order,
    table.dense,
    currentFilters,
    router,
  ]);

  // Update URL when relevant state changes
  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // Reset page when filters change (but not when table state changes)
  useEffect(() => {
    table.onResetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentFilters.query,
    currentFilters.status,
    currentFilters.drivers,
    currentFilters.vehicles,
    currentFilters.startDate,
    currentFilters.endDate,
  ]);

  // Prepare pre trip vehicle data
  const { data: preTripVehicleData, isLoading: preTripVehicleLoading } = {
    data: [],
    isLoading: false,
  };

  // Fetch user list for employee autocomplete
  const { data: userList } = useQuery({
    queryKey: ['users', 'pre-trip-vehicle', 'pre-trip-vehicle-list'],
    queryFn: async () => {
      try {
        const response = await fetcher(`${endpoints.management.user}/job-creation`);

        if (!response) {
          throw new Error('No response received');
        }

        if (!response.data?.users) {
          throw new Error('No users in response');
        }
        return response.data.users;
      } catch (error) {
        console.error('Error fetching users (quick edit):', error);
        throw error;
      }
    },
    enabled: true, // Explicitly enable the query
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
    retry: 3, // Retry failed requests
  });

  const employeeOptions = useMemo(() => {
    if (!userList) {
      return [];
    }
    if (userList.length === 0) {
      return [];
    }

    const positions = ['tcp', 'lct', 'lct/tcp', 'field_supervisor', 'HWY'];

    const options = userList
      .filter((x: IUser) => positions.includes(x.role.toLowerCase()))
      .map((user: IUser) => ({
        label: `${user.first_name} ${user.last_name}`,
        value: user.id,
        photo_url: user.photo_url,
        first_name: user.first_name,
        last_name: user.last_name,
        licenseStatus: user.driver_license_expiry,
      }));

    return options;
  }, [userList]);

  useEffect(() => {
    if (
      employeeOptions &&
      currentFilters.drivers.some((c: { value: string; name: string }) => !c.value)
    ) {
      const updatedDrivers = currentFilters.drivers.map((driver) => {
        const driverData = employeeOptions.find((c: any) => c.value === driver.value);
        return driverData
          ? { value: driverData.value, name: `${driverData.first_name} ${driverData.last_name}` }
          : driver;
      });
      if (JSON.stringify(updatedDrivers) !== JSON.stringify(currentFilters.drivers)) {
        updateFilters({ drivers: updatedDrivers });
      }
    }
  }, [employeeOptions, currentFilters.drivers, updateFilters]);

  // Fetch vehicles from API
  const { data: vehicleList } = useQuery({
    queryKey: ['companies-all'],
    queryFn: async () => {
      const response = await fetcher(endpoints.management.vehicle);
      return response?.data?.vehicles || [];
    },
  });

  useEffect(() => {
    if (
      vehicleList?.length &&
      currentFilters.vehicles.some((c: { value: string; name: string }) => !c.value)
    ) {
      const vehicles = currentFilters.vehicles.map((vehicle) => {
        const vehicleData = employeeOptions.find((c: any) => c.value === vehicle.value);
        return vehicleData
          ? { value: vehicleData.value, name: `${vehicleData.first_name} ${vehicleData.last_name}` }
          : vehicle;
      });
      if (JSON.stringify(vehicles) !== JSON.stringify(currentFilters.vehicles)) {
        updateFilters({ vehicles });
      }
    }
  }, [vehicleList, currentFilters.vehicles, updateFilters]);

  // React Query for fetching list with server-side pagination
  const {
    data: preTripVehicleResponse,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      'time-off-requests',
      table.page,
      table.rowsPerPage,
      table.orderBy,
      table.order,
      currentFilters,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (table.page + 1).toString(),
        rowsPerPage: table.rowsPerPage.toString(),
        orderBy: table.orderBy,
        order: table.order,
        ...(currentFilters.status !== 'all' && { status: currentFilters.status }),
        ...(currentFilters.query && { search: currentFilters.query }),
        ...(currentFilters.drivers.length > 0 && { driver: currentFilters.drivers.join(',') }),
        ...(currentFilters.vehicles.length > 0 && { vehicles: currentFilters.vehicles.join(',') }),
        ...(currentFilters.startDate && {
          startDate: currentFilters.startDate.format('YYYY-MM-DD'),
        }),
        ...(currentFilters.endDate && { endDate: currentFilters.endDate.format('YYYY-MM-DD') }),
      });

      //const response = await fetcher(`/api/pre-trip-vehicle?${params.toString()}`);
      const response = {
        data: [
          {
            id: 1,
            job: {
              job_number: 'JO-202604',
              job_start: dayjs().format('MM-DD-YYYY'),
              job_end: dayjs().format('MM-DD-YYYY'),
            },
            driver: {
              displayName: 'Jerwin Fortillano',
              role: 'LCT',
              photo_url: null,
            },
            vehicle: {
              license_plate: 'SR1384',
              info: 'Ford F150',
              year: '2016',
            },
            open_defects: 0,
            resolve_defects: 0,
            type: 'Pre-Trip',
            status: 'pending',
            created_at: dayjs().format('MM-DD-YYYY'),
            submitted_by: null,
          },
          {
            id: 2,
            job: {
              job_number: 'JO-202606',
              job_start: dayjs().add(2, 'day').format('MM-DD-YYYY'),
              job_end: dayjs().format('MM-DD-YYYY'),
            },
            driver: {
              displayName: 'Kiwoon',
              role: 'LCT',
              photo_url: null,
            },
            vehicle: {
              license_plate: 'SR1385',
              info: 'Ford F150',
              year: '2016',
            },
            open_defects: 0,
            resolve_defects: 0,
            type: 'Pre-Trip',
            status: 'pending',
            created_at: dayjs().format('MM-DD-YYYY'),
            submitted_by: null,
          },
          {
            id: 3,
            job: {
              job_number: 'JO-202607',
              job_start: dayjs().add(5, 'day').format('MM-DD-YYYY'),
              job_end: dayjs().format('MM-DD-YYYY'),
            },
            driver: {
              displayName: 'Kesia',
              role: 'LCT',
              photo_url: null,
            },
            vehicle: {
              license_plate: 'SR1389',
              info: 'Ford F150',
              year: '2016',
            },
            open_defects: 0,
            resolve_defects: 0,
            type: 'Pre-Trip',
            status: 'submitted',
            created_at: dayjs().format('MM-DD-YYYY'),
            submitted_by: {
              photo_url: null,
              first_name: 'Jerwin',
              last_name: 'Fortillano',
              submitted_at: dayjs().format('MM-DD-YYYY'),
            },
          },
        ],
      };
      return response; // Return the full response to check structure
    },
  });

  // Fall back to the alternative approach if primary is not working
  const preTripVehicleRequests = useMemo(() => {
    // Use the complex filtering as primary
    if (preTripVehicleResponse) {
      if (preTripVehicleResponse.data && Array.isArray(preTripVehicleResponse.data)) {
        return preTripVehicleResponse.data;
      }
      if (Array.isArray(preTripVehicleResponse)) {
        return preTripVehicleResponse;
      }
    }
    // Fall back to the simpler approach
    if (preTripVehicleData) {
      return Array.isArray(preTripVehicleData) ? preTripVehicleData : [];
    }
    return [];
  }, [preTripVehicleResponse, preTripVehicleData]);

  const totalCount = preTripVehicleRequests.length;
  const isCurrentlyLoading = isLoading || preTripVehicleLoading;

  // Server-side pagination means no client-side filtering needed
  const dataFiltered = preTripVehicleRequests;

  const dateError: boolean = !!(
    currentFilters.startDate &&
    currentFilters.endDate &&
    dayjs(currentFilters.startDate).isAfter(currentFilters.endDate)
  );

  const canReset = !!(
    currentFilters.query ||
    currentFilters.drivers.length > 0 ||
    currentFilters.vehicles.length > 0 ||
    currentFilters.status !== 'all' ||
    currentFilters.startDate ||
    currentFilters.endDate
  );

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      filters.setState({ status: newValue });
      table.onResetPage();
    },
    [filters, table]
  );

  const handleEditRow = useCallback((id: string) => {}, [null]);

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  return (
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
                  (tab.value === 'submitted' && 'success') ||
                  'default'
                }
              >
                {['pending', 'submitted'].includes(tab.value)
                  ? preTripVehicleRequests.filter((request: any) => request.status === tab.value)
                      .length
                  : preTripVehicleRequests.length}
              </Label>
            }
          />
        ))}
      </Tabs>

      {/* Table Toolbar */}
      <AdminPreTripTableToolbar
        filters={filters}
        onResetPage={table.onResetPage}
        options={{ drivers: employeeOptions, vehicles: vehicleList }}
        dateError={!!dateError}
      />

      {/* Filter Results */}
      {canReset && (
        <AdminPreTripVehicleFilterResult
          filters={filters}
          totalResults={totalCount}
          onResetPage={table.onResetPage}
          sx={{ p: 2.5, pt: 0 }}
          options={employeeOptions}
        />
      )}

      {/* Desktop Table Container */}
      <Box sx={{ position: 'relative', display: { xs: 'none', md: 'block' } }}>
        {/* Desktop Table View */}
        <Scrollbar>
          <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
            <TableHeadCustom
              order={table.order}
              orderBy={table.orderBy}
              headCells={TABLE_HEAD}
              rowCount={totalCount}
              //   onSort={table.onSort}
            />

            <TableBody>
              {isCurrentlyLoading ? (
                Array.from({ length: table.rowsPerPage }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell>
                      <Skeleton variant="text" width="80%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="60%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="70%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="90%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="50%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton
                        variant="rectangular"
                        width={60}
                        height={24}
                        sx={{ borderRadius: 1 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="40%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="40%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="40%" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <>
                  {dataFiltered.map((row: any) => (
                    <AdminPreTripVehicleTableView key={row.id} row={row} onDelete={handleEditRow} />
                  ))}
                  <TableEmptyRows
                    height={0}
                    emptyRows={emptyRows(0, table.rowsPerPage, dataFiltered.length)}
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
        rowsPerPageOptions={[10, 25, 50, 100]}
        onPageChange={table.onChangePage}
        onChangeDense={table.onChangeDense}
        onRowsPerPageChange={table.onChangeRowsPerPage}
      />
    </Card>
  );
}
