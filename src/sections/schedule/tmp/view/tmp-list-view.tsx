import type { IJobTableFilters } from 'src/types/job';
import type { TableHeadCellProps } from 'src/components/table';

import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { useSetState } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { fDate } from 'src/utils/format-time';

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
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { useAuthContext } from 'src/auth/hooks';

import { TmpTableRow } from '../tmp-table-row';
import { TmpTableToolbar } from '../tmp-table-toolbar';
import { TmpTableFiltersResult } from '../tmp-table-filters-result';

// ----------------------------------------------------------------------

const TMP_TAB_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'job_number', label: 'Job #', width: 100 },
  { id: 'site', label: 'Site', width: 200 },
  { id: 'client', label: 'Client', width: 200 },
  { id: 'job_date', label: 'Date', width: 120 },
  { id: 'tmp_count', label: 'TMPs', width: 80 },
  { id: 'confirmed', label: 'Status', width: 120 },
];

// ----------------------------------------------------------------------

export function TmpListView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthContext();
  
  const table = useTable({
    defaultDense: (searchParams.get('dense') === 'true') || true,
    defaultOrder: (searchParams.get('order') as 'asc' | 'desc') || 'asc',
    defaultOrderBy: searchParams.get('orderBy') || 'start_time',
    defaultRowsPerPage: parseInt(searchParams.get('rowsPerPage') || '25', 10),
    defaultCurrentPage: parseInt(searchParams.get('page') || '1', 10) - 1,
  });

  const filters = useSetState<IJobTableFilters>({
    query: searchParams.get('search') || '',
    region: [],
    status: searchParams.get('status') || 'all',
    client: searchParams.get('client') ? searchParams.get('client')!.split(',') : [],
    company: searchParams.get('company') ? searchParams.get('company')!.split(',') : [],
    site: searchParams.get('site') ? searchParams.get('site')!.split(',') : [],
    startDate: searchParams.get('startDate') ? dayjs(searchParams.get('startDate')!) : null,
    endDate: searchParams.get('endDate') ? dayjs(searchParams.get('endDate')!) : null,
  });

  const [tmpTab, setTmpTab] = useState(searchParams.get('tmpTab') || 'all');
  const { state: currentFilters, setState: updateFilters } = filters;

  // Update URL when table or filter state changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', (table.page + 1).toString());
    params.set('rowsPerPage', table.rowsPerPage.toString());
    params.set('orderBy', table.orderBy || 'start_time');
    params.set('order', table.order || 'asc');
    params.set('dense', table.dense.toString());
    if (currentFilters.query) params.set('search', currentFilters.query);
    if (tmpTab !== 'all') params.set('tmpTab', tmpTab);
    
    router.replace(`${paths.schedule.work.tmp.list}?${params.toString()}`);
  }, [table.page, table.rowsPerPage, table.orderBy, table.order, table.dense, currentFilters.query, tmpTab, router]);

  // Fetch TMP list for worker
  const { data: tmpResponse, isLoading } = useQuery({
    queryKey: [
      'worker-tmp-list',
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
      tmpTab,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (table.page + 1).toString(),
        limit: table.rowsPerPage.toString(),
        orderBy: table.orderBy || 'start_time',
        order: table.order || 'asc',
      });

      if (currentFilters.client.length > 0) params.set('client', currentFilters.client.join(','));
      if (currentFilters.company.length > 0) params.set('company', currentFilters.company.join(','));
      if (currentFilters.site.length > 0) params.set('site', currentFilters.site.join(','));
      if (currentFilters.startDate) params.set('startDate', currentFilters.startDate.toISOString());
      if (currentFilters.endDate) params.set('endDate', currentFilters.endDate.toISOString());
      if (tmpTab !== 'all') params.set('confirmStatus', tmpTab);

      const response = await fetcher(`${endpoints.tmp.list}?${params}`);
      return response.data;
    },
  });

  const tmpList = tmpResponse?.tmp_forms || [];
  const totalCount = tmpResponse?.total || 0;

  // Fetch counts for each tab
  const { data: allCountData } = useQuery({
    queryKey: ['worker-tmp-count-all', user?.id],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '1' });
      const response = await fetcher(`${endpoints.tmp.list}?${params}`);
      return response.data?.total || 0;
    },
  });

  const { data: confirmedCountData } = useQuery({
    queryKey: ['worker-tmp-count-confirmed', user?.id],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '1', confirmStatus: 'confirmed' });
      const response = await fetcher(`${endpoints.tmp.list}?${params}`);
      return response.data?.total || 0;
    },
  });

  const { data: pendingCountData } = useQuery({
    queryKey: ['worker-tmp-count-pending', user?.id],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '1', confirmStatus: 'pending' });
      const response = await fetcher(`${endpoints.tmp.list}?${params}`);
      return response.data?.total || 0;
    },
  });

  const tabCounts = {
    all: allCountData || 0,
    confirmed: confirmedCountData || 0,
    pending: pendingCountData || 0,
  };

  const notFound = !isLoading && !tmpList.length;
  const canReset = !!currentFilters.query || currentFilters.client.length > 0 || currentFilters.company.length > 0 || currentFilters.site.length > 0 || !!currentFilters.startDate || !!currentFilters.endDate;

  const handleViewRow = useCallback(
    (id: string) => {
      router.push(paths.schedule.work.tmp.detail(id));
    },
    [router]
  );

  const handleFilterQuery = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateFilters({ query: event.target.value });
    },
    [updateFilters]
  );

  const handleResetFilters = useCallback(() => {
    updateFilters({
      query: '',
      region: [],
      status: 'all',
      client: [],
      company: [],
      site: [],
      startDate: null,
      endDate: null,
    });
  }, [updateFilters]);

  const handleFilterClient = useCallback(
    (newValue: string[]) => {
      updateFilters({ client: newValue });
    },
    [updateFilters]
  );

  const handleFilterCompany = useCallback(
    (newValue: string[]) => {
      updateFilters({ company: newValue });
    },
    [updateFilters]
  );

  const handleFilterSite = useCallback(
    (newValue: string[]) => {
      updateFilters({ site: newValue });
    },
    [updateFilters]
  );

  const handleFilterStartDate = useCallback(
    (newValue: any) => {
      updateFilters({ startDate: newValue });
    },
    [updateFilters]
  );

  const handleFilterEndDate = useCallback(
    (newValue: any) => {
      updateFilters({ endDate: newValue });
    },
    [updateFilters]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Traffic Management Plans"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'My Schedule', href: paths.schedule.root },
          { name: 'TMP' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Tabs
          value={tmpTab}
          onChange={(e, newValue) => setTmpTab(newValue)}
          sx={{
            px: 2.5,
            boxShadow: (theme) => `inset 0 -2px 0 0 ${theme.vars.palette.divider}`,
          }}
        >
          {TMP_TAB_OPTIONS.map((tab) => (
            <Tab
              key={tab.value}
              iconPosition="end"
              value={tab.value}
              label={tab.label}
              icon={
                <Label
                  variant={((tab.value === 'all' || tmpTab === tab.value) && 'filled') || 'soft'}
                  color={
                    (tab.value === 'confirmed' && 'success') ||
                    (tab.value === 'pending' && 'warning') ||
                    'default'
                  }
                >
                  {tabCounts[tab.value as keyof typeof tabCounts]}
                </Label>
              }
            />
          ))}
        </Tabs>

        <TmpTableToolbar
          filters={currentFilters}
          onResetFilters={handleResetFilters}
          onFilterQuery={handleFilterQuery}
          onFilterClient={handleFilterClient}
          onFilterCompany={handleFilterCompany}
          onFilterSite={handleFilterSite}
          onFilterStartDate={handleFilterStartDate}
          onFilterEndDate={handleFilterEndDate}
        />

        {canReset && (
          <TmpTableFiltersResult
            filters={currentFilters}
            totalResults={totalCount}
            onResetFilters={handleResetFilters}
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
                headCells={TABLE_HEAD}
                onSort={table.onSort}
              />

              <TableBody>
                {isLoading ? (
                  [...Array(table.rowsPerPage)].map((_, index) => (
                    <TmpTableRow key={index} row={null} onViewRow={() => {}} />
                  ))
                ) : (
                  tmpList.map((row: any) => (
                    <TmpTableRow
                      key={row.id}
                      row={row}
                      onViewRow={() => handleViewRow(row.id)}
                    />
                  ))
                )}

                <TableEmptyRows
                  height={table.dense ? 56 : 76}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, totalCount)}
                />

                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

        {/* Mobile Card View */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <Stack spacing={2} sx={{ p: 1 }}>
            {isLoading ? (
              [...Array(table.rowsPerPage)].map((_, index) => (
                <Card key={index} sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Skeleton variant="text" width="40%" height={24} />
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="50%" />
                  </Stack>
                </Card>
              ))
            ) : (
              <>
                {tmpList.map((row: any) => (
                  <TmpMobileCard key={row.id} row={row} onViewRow={() => handleViewRow(row.id)} />
                ))}

                {tmpList.length === 0 && (
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
                        }
                      }} 
                    />
                  </Box>
                )}
              </>
            )}
          </Stack>
        </Box>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={totalCount}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

type TmpMobileCardProps = {
  row: any;
  onViewRow: () => void;
};

function TmpMobileCard({ row, onViewRow }: TmpMobileCardProps) {
  const getStatusColor = (confirmed: boolean) => (confirmed ? 'success' : 'warning');

  return (
    <Card 
      onClick={onViewRow}
      sx={{ 
        p: 1.5, 
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: (theme) => theme.shadows[4],
        }
      }}
    >
      <Stack spacing={2}>
        {/* Job Number and Status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="subtitle2" color="primary">
              Job #{row.job?.job_number}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.job?.start_time ? fDate(row.job.start_time) : '-'}
            </Typography>
          </Box>
          <Label variant="soft" color={getStatusColor(row.worker_confirmed)}>
            {row.worker_confirmed ? 'Confirmed' : 'Pending'}
          </Label>
        </Box>

        <Divider />

        {/* Site */}
        <Box>
          <Typography variant="body2" fontWeight="medium" sx={{ mb: 0.5 }}>
            {row.site?.name || '-'}
          </Typography>
          {(row.site?.display_address || (row.site?.street_number && row.site?.street_name && row.site?.city)) && (() => {
            // Helper to build full address if not available
            const buildAddress = () => {
              if (row.site.display_address) {
                return row.site.display_address;
              }
              // Build from individual fields
              return [
                row.site?.unit_number,
                row.site?.street_number, 
                row.site?.street_name,
                row.site?.city,
                row.site?.province,
                row.site?.postal_code,
                row.site?.country
              ].filter(Boolean).join(', ');
            };

            // Format address like "919 292 Sterret, Vancouver BC B1T 2G2"
            const formatAddressDisplay = (address: string) => {
              // Remove "Unit X, " from the beginning
              const cleanAddress = address.replace(/^Unit\s+[^,]+,\s*/, '');
              
              // Split by comma
              const parts = cleanAddress.split(',').map((p: string) => p.trim()).filter(Boolean);
              
              // Group parts: [street_parts, city + province + postal]
              let streetPart = '';
              let locationPart = '';
              
              // Identify where the city part begins by looking for cities
              const commonCities = ['Vancouver', 'Surrey', 'Burnaby', 'Richmond', 'Toronto', 'Montreal', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Waterloo', 'Halifax', 'London'];
              let foundCity = false;
              
              for (const part of parts) {
                // Check if this part is likely a city
                const isCity = commonCities.some((city: string) => 
                  part.includes(city) || part.toLowerCase().includes(city.toLowerCase())
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
                  locationPart += part
                    .replace('British Columbia', 'BC')
                    .replace('Canada', '');
                }
              }
              
              // Clean up
              locationPart = locationPart.replace(/BC BC/g, 'BC').trim();
              
              // If we could not split properly, return formatted original
              if (!foundCity) {
                return cleanAddress
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

            const displayText = formatAddressDisplay(buildAddress());
            
            // Check if we have complete address fields for Google Maps
            const hasCompleteAddress = row.site.street_number && 
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
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
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

        {/* Client */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Client
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              src={row.client?.logo_url}
              alt={row.client?.name}
              sx={{ width: 32, height: 32 }}
            >
              {row.client?.name?.charAt(0)}
            </Avatar>
            <Typography variant="body2">
              {row.client?.name || '-'}
            </Typography>
          </Box>
        </Box>

        {/* TMPs Count */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            TMPs
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {row.pdf_count || 0}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}

