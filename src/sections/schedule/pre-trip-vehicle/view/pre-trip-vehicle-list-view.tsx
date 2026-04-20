import dayjs from 'dayjs';
import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { usePopover, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks/use-router';
import { RouterLink } from 'src/routes/components/router-link';
import { useSearchParams } from 'src/routes/hooks/use-search-params';

import { fDate, fTime } from 'src/utils/format-time';

import { fetcher } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard/content';

import { Label } from 'src/components/label/label';
import { emptyRows } from 'src/components/table/utils';
import { Iconify } from 'src/components/iconify/iconify';
import { useTable } from 'src/components/table/use-table';
import { Scrollbar } from 'src/components/scrollbar/scrollbar';
import { TableNoData } from 'src/components/table/table-no-data';
import { TableEmptyRows } from 'src/components/table/table-empty-rows';
import { EmptyContent } from 'src/components/empty-content/empty-content';
import { CustomPopover } from 'src/components/custom-popover/custom-popover';
import { TablePaginationCustom } from 'src/components/table/table-pagination-custom';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';
import { TableHeadCellProps, TableHeadCustom } from 'src/components/table/table-head-custom';

import { PreTripTableToolbar } from '../pre-trip-vehicle-toolbar';
import { PreTripVehicleTableView } from '../pre-trip-vehicle-table-row';
import { PreTripVehicleFilterResult } from '../pre-trip-vehicle-filter-result';

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'job_number', label: 'Job #' },
  { id: 'driver_name', label: 'Driver Name' },
  { id: 'vehicle', label: 'Vehicle' },
  { id: 'open_defects', label: 'Open Defects' },
  { id: 'resolve_defects', label: 'Resolve Defects' },
  { id: 'type', label: 'Type' },
  { id: 'status', label: 'Status' },
  { id: 'created_at', label: 'Created Date' },
  { id: 'submitted_at', label: 'Submitted Date' },
  { id: '', width: 88 },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'submitted', label: 'Submitted' },
];

const TYPES = [{ value: 'Pre-Trip', label: 'Pre-Trip' }];

//-----------------------------------------------------------------------------
export function PreTripVehicleInspectionListView() {
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
    type: searchParams.get('type') ? searchParams.get('type')!.split(',') : [],
    vehicles: searchParams.get('vehicles') ? searchParams.get('vehicles')!.split(',') : [],
    status: searchParams.get('status') || 'all',
    startDate: searchParams.get('startDate') ? dayjs(searchParams.get('startDate')!) : null,
    endDate: searchParams.get('endDate') ? dayjs(searchParams.get('endDate')!) : null,
  });

  const { state: currentFilters } = filters;

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
    if (currentFilters.type.length > 0) params.set('type', currentFilters.type.join(','));
    if (currentFilters.vehicles.length > 0)
      params.set('vehicles', currentFilters.vehicles.join(','));
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
    currentFilters.type,
    currentFilters.vehicles,
    currentFilters.startDate,
    currentFilters.endDate,
  ]);

  // Alternative: try using the existing useGetUserTimeOffDates hook
  const { data: preTripVehicleData, isLoading: preTripVehicleLoading } = {
    data: [],
    isLoading: false,
  };

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
        ...(currentFilters.type.length > 0 && { type: currentFilters.type.join(',') }),
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
            submitted_at: null,
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
            submitted_at: null,
          },
          {
            id: 2,
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
            status: 'pending',
            created_at: dayjs().format('MM-DD-YYYY'),
            submitted_at: null,
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
    currentFilters.type.length > 0 ||
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

  const handleEditRow = useCallback(
    (id: string) => {
      console.log(id);
    },
    [null]
  );

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="My Vehicle Inspection"
          links={[
            { name: 'My Schedule' },
            { name: 'Work' },
            { name: 'Vehicle Inspection' },
            { name: 'List' },
          ]}
          //   action={
          //     <Button
          //       component={RouterLink}
          //       href={paths.schedule.work.pre_trip_vehicle.create}
          //       variant="contained"
          //       startIcon={<Iconify icon="mingcute:add-line" />}
          //     >
          //       Create Inspection
          //     </Button>
          //   }
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
                      (tab.value === 'pending' && 'warning') ||
                      (tab.value === 'submitted' && 'success') ||
                      'default'
                    }
                  >
                    {['pending', 'submitted'].includes(tab.value)
                      ? preTripVehicleRequests.filter(
                          (request: any) => request.status === tab.value
                        ).length
                      : preTripVehicleRequests.length}
                  </Label>
                }
              />
            ))}
          </Tabs>

          {/* Table toolbar */}
          <PreTripTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            options={{ types: TYPES, vehicles: [] }}
            dateError={!!dateError}
          />

          {/* Filter Results */}
          {canReset && (
            <PreTripVehicleFilterResult
              filters={filters}
              totalResults={totalCount}
              onResetPage={table.onResetPage}
              sx={{ p: 2.5, pt: 0 }}
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
                        <PreTripVehicleTableView key={row.id} row={row} onDelete={handleEditRow} />
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

          {/* Mobile Card Container */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Stack spacing={2} sx={{ p: 2 }}>
              {isCurrentlyLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <Card key={`skeleton-card-${index}`} sx={{ p: 2 }}>
                    <Stack spacing={2}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Skeleton variant="text" width="30%" />
                        <Skeleton
                          variant="rectangular"
                          width={60}
                          height={24}
                          sx={{ borderRadius: 1 }}
                        />
                      </Box>
                      <Box>
                        <Skeleton variant="text" width="70%" />
                      </Box>
                      <Box>
                        <Skeleton variant="text" width="90%" />
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Skeleton variant="text" width="40%" />
                        <Skeleton variant="text" width="20%" />
                      </Box>
                    </Stack>
                  </Card>
                ))
              ) : dataFiltered && dataFiltered.length > 0 ? (
                <>
                  {dataFiltered.map((row: any) => (
                    <PreTripVehicleMobileCardView row={row} />
                  ))}
                </>
              ) : (
                <Box sx={{ width: '100%', py: 4 }}>
                  <EmptyContent
                    filled
                    title="No data"
                    sx={{
                      width: '100%',
                      maxWidth: 'none',
                      '& img': {
                        width: '100%',
                        maxWidth: 'none',
                      },
                    }}
                  />
                </Box>
              )}
            </Stack>
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
    </>
  );
}

// Mobile Card Component
type PreTripVehicleMobileCardProps = {
  row: any;
};

function PreTripVehicleMobileCardView({ row }: PreTripVehicleMobileCardProps) {
  const router = useRouter();
  const menuActions = usePopover();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'submitted':
        return 'success';
      default:
        return 'default';
    }
  };

  const getTypeInfo = (type: string) =>
    TYPES.find((t) => t.value === type) || { label: type, color: '#666' };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = fDate(startDate);
    const end = fDate(endDate);

    if (start === end) {
      return start;
    }
    return `${start} - ${end}`;
  };

  const handleEdit = () => {
    router.push(paths.schedule.work.pre_trip_vehicle.edit(row.id));
    menuActions.onClose();
  };

  const isPending = row.status === 'pending';

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <MenuItem onClick={handleEdit}>
          <Iconify icon="solar:pen-bold" />
          Edit
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  return (
    <Card
      sx={{
        p: 2,
        cursor: 'default',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: (theme) => theme.shadows[4],
        },
      }}
    >
      <Stack spacing={2}>
        {/* Header with Type, Status, and Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="subtitle2" color="primary">
              {row?.job?.job_number}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Label variant="soft" color={getStatusColor(row.status)}>
              {STATUS_OPTIONS.find((s) => s.value === row.status)?.label || row.status}
            </Label>
            {isPending && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <IconButton
                  size="small"
                  color={menuActions.open ? 'inherit' : 'default'}
                  onClick={(e) => {
                    e.stopPropagation();
                    menuActions.onOpen(e);
                  }}
                >
                  <Iconify icon="eva:more-vertical-fill" />
                </IconButton>
              </Box>
            )}
          </Box>
        </Box>

        <Divider />

        {/* Driver Name */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Driver Name
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              src={row?.driver?.photo_url ?? undefined}
              alt={row?.driver?.displayName}
              sx={{ width: 32, height: 32 }}
            >
              {row?.driver?.displayName?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2">{row?.driver?.displayName}</Typography>
              <Label variant="soft" color="primary">
                {row?.driver?.role}
              </Label>
            </Box>
          </Box>
        </Box>

        {/* Reason */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Reason
          </Typography>
          <Typography
            variant="body2"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {row.reason || 'No reason provided'}
          </Typography>
        </Box>

        {/* Request Date */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Requested
          </Typography>
          {row.created_at ? (
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {fDate(row.created_at)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {fTime(row.created_at)}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              N/A
            </Typography>
          )}
        </Box>
      </Stack>
      {isPending && renderMenuActions()}
    </Card>
  );
}
