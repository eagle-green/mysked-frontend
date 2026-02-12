import type { IJobTableFilters } from 'src/types/job';
import type { TableHeadCellProps } from 'src/components/table';

import dayjs from 'dayjs';
import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useSetState } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { useRouter, useSearchParams } from 'src/routes/hooks';

import { fDate, fIsAfter } from 'src/utils/format-time';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { FlraTableRow } from '../table/flra-table-row';
import { FlraTableToolbar } from '../table/flra-table-toolbar';
import { FlraTableFiltersResult } from '../table/flra-table-filter-result';

// ----------------------------------------------------------------------

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'job_number', label: 'Job #', width: 100 },
  { id: 'site', label: 'Site', width: 200 },
  { id: 'client', label: 'Client', width: 200 },
  { id: 'job_date', label: 'Date', width: 120 },
  { id: 'status', label: 'Status', width: 120 },
  { id: 'submitted_by', label: 'Submitted By', width: 150 },
];

const FLRA_TAB_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
];

// ----------------------------------------------------------------------

export default function FlraListView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const table = useTable({
    defaultDense: true,
    defaultOrder: (searchParams.get('order') as 'asc' | 'desc') || 'asc',
    defaultOrderBy: searchParams.get('orderBy') || 'start_time',
    defaultRowsPerPage: parseInt(searchParams.get('rowsPerPage') || '25', 10),
    defaultCurrentPage: parseInt(searchParams.get('page') || '1', 10) - 1,
  });

  const filters = useSetState<IJobTableFilters>({
    query: searchParams.get('search') || '',
    status: searchParams.get('status') || 'all',
    region: [],
    client: searchParams.get('client') ? searchParams.get('client')!.split(',').map(id => ({ id, name: '' })) : [],
    company: searchParams.get('company') ? searchParams.get('company')!.split(',').map(id => ({ id, name: '' })) : [],
    site: searchParams.get('site') ? searchParams.get('site')!.split(',').map(id => ({ id, name: '' })) : [],
    startDate: searchParams.get('startDate') ? dayjs(searchParams.get('startDate')!) : null,
    endDate: searchParams.get('endDate') ? dayjs(searchParams.get('endDate')!) : null,
  });

  const [flraTab, setFlraTab] = useState(searchParams.get('flraTab') || 'all');

  const { state: currentFilters, setState: updateFilters } = filters;

  // React Query for fetching FLRA forms list with pagination and server-side filters (including search)
  const {
    data: flraResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      'flra-forms-list',
      table.page,
      table.rowsPerPage,
      table.orderBy,
      table.order,
      currentFilters.query,
      currentFilters.client,
      currentFilters.company,
      currentFilters.site,
      currentFilters.startDate,
      currentFilters.endDate,
      flraTab,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (table.page + 1).toString(),
        limit: table.rowsPerPage.toString(),
        orderBy: table.orderBy || 'start_time',
        order: table.order || 'asc',
      });

      // Add all filter parameters including search
      if (currentFilters.query) params.set('search', currentFilters.query);
      if (currentFilters.client.length > 0) params.set('client', currentFilters.client.map(c => c.id).join(','));
      if (currentFilters.company.length > 0)
        params.set('company', currentFilters.company.map(c => c.id).join(','));
      if (currentFilters.site.length > 0) params.set('site', currentFilters.site.map(s => s.id).join(','));
      if (currentFilters.startDate) params.set('startDate', currentFilters.startDate.format('YYYY-MM-DD'));
      if (currentFilters.endDate) params.set('endDate', currentFilters.endDate.format('YYYY-MM-DD'));
      if (flraTab !== 'all') params.set('status', flraTab);

      const response = await fetcher(`${endpoints.flra.list}?${params}`);
      return response.data;
    },
  });
  const dateError = fIsAfter(currentFilters.startDate, currentFilters.endDate);
  const flraFormsList = flraResponse?.flra_forms || [];
  const serverTotalCount = flraResponse?.pagination?.total || flraResponse?.total || 0;

  // Apply client-side sorting only (all filtering is now server-side)
  const dataFiltered = flraFormsList.sort(getComparator(table.order, table.orderBy));

  const totalCount = serverTotalCount;

  // Update URL when table state changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', (table.page + 1).toString());
    params.set('rowsPerPage', table.rowsPerPage.toString());
    params.set('orderBy', table.orderBy);
    params.set('order', table.order);
    params.set('dense', table.dense.toString());

    // Add filter parameters
    if (currentFilters.query) params.set('search', currentFilters.query);
    if (currentFilters.status !== 'all') params.set('status', currentFilters.status);
    if (currentFilters.client.length > 0) params.set('client', currentFilters.client.map(c => c.id).join(','));
    if (currentFilters.company.length > 0) params.set('company', currentFilters.company.map(c => c.id).join(','));
    if (currentFilters.site.length > 0) params.set('site', currentFilters.site.map(s => s.id).join(','));
    if (currentFilters.startDate) params.set('startDate', dayjs(currentFilters.startDate).format('YYYY-MM-DD'));
    if (currentFilters.endDate) params.set('endDate', dayjs(currentFilters.endDate).format('YYYY-MM-DD'));
    if (flraTab !== 'all') params.set('flraTab', flraTab);

    const currentPath = window.location.pathname;
    router.replace(`${currentPath}?${params.toString()}`);
  }, [
    table.page,
    table.rowsPerPage,
    table.orderBy,
    table.order,
    table.dense,
    currentFilters,
    flraTab,
    router,
  ]);

  const canReset = !!(
    currentFilters.query ||
    currentFilters.client.length > 0 ||
    currentFilters.company.length > 0 ||
    currentFilters.site.length > 0 ||
    currentFilters.startDate ||
    currentFilters.endDate ||
    flraTab !== 'all'
  );

  const notFound =
    (!isLoading && dataFiltered.length === 0) || (flraFormsList.length === 0 && canReset);

  const handleResetFilters = useCallback(() => {
    updateFilters({
      query: '',
      status: 'all',
      region: [],
      client: [],
      company: [],
      site: [],
      startDate: null,
      endDate: null,
    });
  }, [updateFilters]);

  const handleFlraTabChange = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      setFlraTab(newValue);
      table.onResetPage();
    },
    [table]
  );

  if (error) {
    return (
      <DashboardContent>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="error" gutterBottom>
            Error loading jobs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error.message}
          </Typography>
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Field Level Risk Assessment"
        links={[{ name: 'My Schedule' }, { name: 'Work' }, { name: 'Field Level Risk Assessment' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Tabs
          value={flraTab}
          onChange={handleFlraTabChange}
          sx={[
            (theme) => ({
              px: 2.5,
              boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            }),
          ]}
        >
          {FLRA_TAB_OPTIONS.map((tab) => (
            <Tab
              key={tab.value}
              iconPosition="end"
              value={tab.value}
              label={tab.label}
              icon={
                <Label
                  variant={((tab.value === 'all' || tab.value === flraTab) && 'filled') || 'soft'}
                  color={
                    (tab.value === 'draft' && 'info') ||
                    (tab.value === 'submitted' && 'success') ||
                    'default'
                  }
                >
                  {
                    flraFormsList.filter((form: any) =>
                      tab.value === 'all' ? true : form.status === tab.value
                    ).length
                  }
                </Label>
              }
            />
          ))}
        </Tabs>

        <FlraTableToolbar filters={filters} dateError={dateError} onResetPage={table.onResetPage} />

        {canReset && (
          <FlraTableFiltersResult
            filters={filters}
            onResetFilters={handleResetFilters}
            totalResults={totalCount}
            onResetPage={table.onResetPage}
            onFilters={() => {}}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        {/* Desktop Table View */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headCells={TABLE_HEAD || []}
                rowCount={dataFiltered.length}
                numSelected={0}
                onSort={table.onSort}
              />

              <TableBody>
                {isLoading ? (
                  // Skeleton loading rows
                  Array.from({ length: table.rowsPerPage }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell>
                        <Skeleton variant="text" width="80%" />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width="60%" />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Skeleton variant="circular" width={32} height={32} />
                          <Skeleton variant="text" width="70%" />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width="80%" />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width="90%" />
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
                        <Skeleton variant="text" width="50%" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <>
                    {dataFiltered.map((row: any) => (
                      <FlraTableRow
                        key={row.id}
                        row={row}
                        selected={false}
                        onSelectRow={() => {}}
                      />
                    ))}

                    <TableEmptyRows
                      height={0}
                      emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                    />

                    {notFound && <TableNoData notFound={notFound} />}
                  </>
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

        {/* Mobile Card View */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <Stack spacing={2} sx={{ p: 2 }}>
            {isLoading ? (
              // Skeleton loading cards
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Skeleton variant="circular" width={32} height={32} />
                      <Box>
                        <Skeleton variant="text" width="80%" />
                        <Skeleton variant="text" width="60%" />
                      </Box>
                    </Box>
                    <Box>
                      <Skeleton variant="text" width="70%" />
                      <Skeleton variant="text" width="90%" />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Skeleton variant="text" width="20%" />
                      <Skeleton variant="circular" width={24} height={24} />
                      <Skeleton variant="text" width="40%" />
                    </Box>
                  </Stack>
                </Card>
              ))
            ) : (
              <>
                {dataFiltered.map((row: any) => (
                  <FlraMobileCard key={row.id} row={row} />
                ))}

                {dataFiltered.length === 0 && (
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
              </>
            )}
          </Stack>
        </Box>

        <TablePaginationCustom
          count={totalCount}
          page={table.page}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          dense={table.dense}
          onChangeDense={table.onChangeDense}
        />
      </Card>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

// Mobile Card Component
function FlraMobileCard({ row }: { row: any }) {
  const router = useRouter();
  const { user } = useAuthContext();

  const handleViewFlra = () => {
    if (row.status === 'submitted') {
      router.push(`/schedules/work/flra/pdf/${row.id}`);
    } else {
      router.push(`/schedules/work/flra/${row.id}`);
    }
  };

  const isTimesheetManager = row.timesheet_manager?.id === user?.id;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'info';
      case 'submitted':
        return 'success';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Card
      sx={{
        p: 2,
        cursor: isTimesheetManager ? 'pointer' : 'default',
        '&:hover': isTimesheetManager
          ? {
              boxShadow: (theme) => theme.customShadows.z8,
              transform: 'translateY(-1px)',
              transition: 'all 0.2s ease-in-out',
            }
          : {},
      }}
      onClick={isTimesheetManager ? handleViewFlra : undefined}
    >
      <Stack spacing={2}>
        {/* Header Row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
              #{row.job?.job_number}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {fDate(row.job?.start_time) || '-'}
            </Typography>
          </Box>
          <Label variant="soft" color={getStatusColor(row.status)}>
            {row.status?.charAt(0).toUpperCase() + row.status?.slice(1)}
          </Label>
        </Box>

        <Divider />

        {/* Client Row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar src={row.client?.logo_url} alt={row.client?.name} sx={{ width: 32, height: 32 }}>
            {row.client?.name?.charAt(0)?.toUpperCase() || 'C'}
          </Avatar>
          <Typography variant="subtitle2">{row.client?.name}</Typography>
        </Box>

        {/* Site Row */}
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
            {row.site?.name}
          </Typography>
          {row.site?.display_address &&
            (() => {
              // Format address like "919 292 Sterret, Vancouver BC B1T 2G2"
              const formatAddressDisplay = (address: string) => {
                // Split by comma
                const parts = address
                  .split(',')
                  .map((p) => p.trim())
                  .filter(Boolean);

                // Group parts: [street_parts, city + province + postal]
                let streetPart = '';
                let locationPart = '';

                // Identify where the city part begins by looking for cities
                const commonCities = [
                  'Vancouver',
                  'Surrey',
                  'Burnaby',
                  'Richmond',
                  'Toronto',
                  'Montreal',
                  'Calgary',
                  'Edmonton',
                  'Ottawa',
                  'Winnipeg',
                  'Quebec City',
                  'Hamilton',
                  'Waterloo',
                  'Halifax',
                  'London',
                ];
                let foundCity = false;

                for (const part of parts) {
                  // Check if this part is likely a city
                  const isCity = commonCities.some(
                    (city) => part.includes(city) || part.toLowerCase().includes(city.toLowerCase())
                  );

                  if (!foundCity) {
                    if (isCity) {
                      foundCity = true;
                      locationPart = part;
                    } else {
                      if (streetPart) streetPart += ' ';
                      streetPart += part;
                    }
                  } else {
                    if (locationPart) locationPart += ' ';
                    locationPart += part.replace('British Columbia', 'BC').replace('Canada', '');
                  }
                }

                // Clean up
                locationPart = locationPart.replace(/BC BC/g, 'BC').trim();

                // If we could not split properly, return formatted original
                if (!foundCity) {
                  return address
                    .replace('British Columbia', 'BC')
                    .replace('Canada', '')
                    .replace(/,\s*,/g, ',')
                    .replace(/^\s*,|,\s*$/g, '')
                    .replace(/,/g, ', ')
                    .replace(/\s+/g, ' ')
                    .trim();
                }

                // Join with single comma
                return `${streetPart}, ${locationPart}`.trim();
              };

              const displayText = formatAddressDisplay(row.site.display_address);

              // Check if we have complete address fields for Google Maps
              const hasCompleteAddress =
                row.site.street_number &&
                row.site.street_name &&
                row.site.city &&
                row.site.province &&
                row.site.postal_code;

              if (hasCompleteAddress) {
                return (
                  <Link
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      [
                        row.site.unit_number,
                        row.site.street_number,
                        row.site.street_name,
                        row.site.city,
                        row.site.province,
                        row.site.postal_code,
                        row.site.country,
                      ]
                        .filter(Boolean)
                        .join(', ')
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    variant="caption"
                  >
                    {displayText}
                  </Link>
                );
              }

              return (
                <Typography variant="caption" color="text.secondary">
                  {displayText}
                </Typography>
              );
            })()}
        </Box>

        {/* Submitted By Row */}
        {row.submitted_by && (
          <>
            <Divider />
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 0.5 }}
              >
                Submitted By
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                  {row.submitted_by.first_name?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                <Typography variant="body2">
                  {row.submitted_by.first_name} {row.submitted_by.last_name}
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

// Removed unused applyFlraFilter function - filtering is now done server-side
