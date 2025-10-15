import type { TimeSheet } from 'src/types/timesheet';
import type { TableHeadCellProps } from 'src/components/table';
import type { TimesheetEntry, IJobTableFilters } from 'src/types/job';

import dayjs from 'dayjs';
import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useSetState } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { fDate, fIsAfter } from 'src/utils/format-time';
import { findInString } from 'src/utils/timecard-helpers';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { TIMESHEET_TABLE_HEADER, TIMESHEET_STATUS_OPTIONS } from 'src/assets/data';

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

import { TimeSheetStatus } from 'src/types/timecard';

import { FILTER_ALL } from '../constant';
import { TimeSheetTableRow } from '../timesheet-table-row';
import { TimeSheetToolBar } from '../timesheet-table-toolbar';
import { TimeSheetTableFiltersResult } from '../timesheet-table-filter-result';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [...TIMESHEET_STATUS_OPTIONS];
const TABLE_HEAD: TableHeadCellProps[] = TIMESHEET_TABLE_HEADER;

/**
 * Method use to render TimeSheetView
 * @returns JSX Elemement TimeSheetView
 */
export default function TimeSheelListView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [flraWarningOpen, setFlraWarningOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedFlraId, setSelectedFlraId] = useState<string | null>(null);
  
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
    client: searchParams.get('client') ? searchParams.get('client')!.split(',') : [],
    company: searchParams.get('company') ? searchParams.get('company')!.split(',') : [],
    site: searchParams.get('site') ? searchParams.get('site')!.split(',') : [],
    startDate: searchParams.get('startDate') ? dayjs(searchParams.get('startDate')!) : null,
    endDate: searchParams.get('endDate') ? dayjs(searchParams.get('endDate')!) : null,
  });
  const { state: currentFilters, setState: updateFilters} = filters;

  // React Query for fetching timesheet list with pagination and server-side filters (excluding search)
  const { data: timesheetResponse, isLoading } = useQuery({
    queryKey: [
      'timesheet-list-query', 
      table.page, 
      table.rowsPerPage, 
      table.orderBy, 
      table.order,
      currentFilters.status,
      currentFilters.startDate,
      currentFilters.endDate,
      currentFilters.company,
      currentFilters.client,
      currentFilters.site,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (table.page + 1).toString(),
        limit: table.rowsPerPage.toString(),
        orderBy: table.orderBy || 'created_at',
        order: table.order || 'desc',
      });

      // Add only server-side filter parameters (exclude search query)
      if (currentFilters.status && currentFilters.status !== 'all') {
        params.set('status', currentFilters.status);
      }
      if (currentFilters.startDate) {
        params.set('start_date', currentFilters.startDate.format('YYYY-MM-DD'));
      }
      if (currentFilters.endDate) {
        params.set('end_date', currentFilters.endDate.format('YYYY-MM-DD'));
      }
      if (currentFilters.company && currentFilters.company.length > 0) {
        // For multiple companies, we'll need to make multiple API calls or modify backend
        // For now, take the first company
        const companyId = currentFilters.company[0];
        params.set('company_id', companyId);
      }
      if (currentFilters.client && currentFilters.client.length > 0) {
        // For multiple clients, we'll need to make multiple API calls or modify backend
        // For now, take the first client
        const clientId = currentFilters.client[0];
        params.set('client_id', clientId);
      }
      if (currentFilters.site && currentFilters.site.length > 0) {
        // For multiple sites, we'll need to make multiple API calls or modify backend
        // For now, take the first site
        const siteId = currentFilters.site[0];
        params.set('site_id', siteId);
      }

      const response = await fetcher(`${endpoints.timesheet.list}?${params}`);
      return response.data;
    },
  });

  const dateError = fIsAfter(currentFilters.startDate, currentFilters.endDate);
  const timesheetList = timesheetResponse?.timesheets || [];
  const serverTotalCount = timesheetResponse?.pagination?.total || timesheetResponse?.total || 0;
  
  // Apply client-side filtering for search query only
  const dataFiltered = applyTimeSheetFilter({
    inputData: timesheetList,
    comparator: getComparator(table.order, table.orderBy),
    filters: {
      ...currentFilters,
      // Only apply search query client-side, other filters are server-side
      status: 'all', // Don't filter by status client-side since it's server-side
      startDate: null, // Don't filter by dates client-side since it's server-side
      endDate: null, // Don't filter by dates client-side since it's server-side
      company: [], // Don't filter by company client-side since it's server-side
      client: [], // Don't filter by client client-side since it's server-side
      site: [], // Don't filter by site client-side since it's server-side
    },
  });
  
  const totalCount = currentFilters.query ? dataFiltered.length : serverTotalCount;

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
    if (currentFilters.client.length > 0) params.set('client', currentFilters.client.join(','));
    if (currentFilters.company.length > 0) params.set('company', currentFilters.company.join(','));
    if (currentFilters.site.length > 0) params.set('site', currentFilters.site.join(','));
    if (currentFilters.startDate) params.set('startDate', currentFilters.startDate.toISOString());
    if (currentFilters.endDate) params.set('endDate', currentFilters.endDate.toISOString());

    const currentPath = window.location.pathname;
    router.replace(`${currentPath}?${params.toString()}`);
  }, [table.page, table.rowsPerPage, table.orderBy, table.order, table.dense, currentFilters, router]);
  const canReset = !!(
    currentFilters.query ||
    currentFilters.client.length > 0 ||
    currentFilters.company.length > 0 ||
    currentFilters.site.length > 0 ||
    currentFilters.startDate ||
    currentFilters.endDate
  );
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;
  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const handleFilters = useCallback(
    (name: string, value: any) => {
      table.onResetPage();
      updateFilters({ [name]: value });
    },
    [table, updateFilters]
  );

  const handleResetFilters = useCallback(() => {
    updateFilters({
      query: '',
      status: 'all',
      client: [],
      company: [],
      site: [],
      startDate: null,
      endDate: null,
    });
  }, [updateFilters]);

  // Handler to check FLRA status before navigation
  const handleJobNumberClick = useCallback(async (jobId: string, timesheetId: string) => {
    try {
      // Fetch FLRA status for this job
      const response = await fetcher(`${endpoints.flra.list}?job_id=${jobId}`);
      const flraData = response.data?.flra_forms?.[0] || response.flra_forms?.[0] || null;
      const flraStatus = flraData?.status || 'not_started';
      const flraSubmitted = flraStatus === 'submitted' || flraStatus === 'approved';
      
      if (!flraSubmitted) {
        // Show warning dialog
        setSelectedJobId(jobId);
        setSelectedFlraId(flraData?.id || jobId);
        setFlraWarningOpen(true);
      } else {
        // Navigate to timesheet
        router.push(paths.schedule.work.timesheet.edit(timesheetId));
      }
    } catch (error) {
      console.error('Error checking FLRA status:', error);
      // If error, allow navigation anyway
      router.push(paths.schedule.work.timesheet.edit(timesheetId));
    }
  }, [router]);

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Timesheet"
          links={[{ name: 'My Schedule' }, { name: 'Work' }, { name: 'Timesheet' }, { name: 'List' }]}
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
                      (tab.value === TimeSheetStatus.DRAFT && 'info') ||
                      (tab.value === TimeSheetStatus.SUBMITTED && 'success') ||
                      (tab.value === TimeSheetStatus.APPROVED && 'success') ||
                      (tab.value === TimeSheetStatus.REJECTED && 'error') ||
                      'default'
                    }
                  >
                    {
                      timesheetList.filter((tc: TimeSheet) =>
                        tab.value === FILTER_ALL ? true : tc.status === tab.value
                      ).length
                    }
                  </Label>
                }
              />
            ))}
          </Tabs>

          <TimeSheetToolBar
            filters={filters}
            onResetPage={table.onResetPage}
            dateError={dateError}
          />

          {canReset && (
            <TimeSheetTableFiltersResult
              filters={filters}
              onFilters={handleFilters}
              onResetFilters={handleResetFilters}
              onResetPage={table.onResetPage}
              totalResults={totalCount}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          {/* Desktop Table View */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'relative' }}>
            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headCells={TABLE_HEAD}
                  rowCount={totalCount}
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
                          <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width="50%" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <>
                      {dataFiltered
                        .filter((row) => row && row.id)
                        .map((row) => (
                          <TimeSheetTableRow
                            key={row.id}
                            row={row}
                            selected={table.selected.includes(row.id)}
                            recordingLink={paths.schedule.work.timesheet.edit(row.id)}
                            onJobNumberClick={(e) => {
                              e.preventDefault();
                              handleJobNumberClick(row.job.id, row.id);
                            }}
                          />
                        ))}

                      <TableEmptyRows
                        height={table.dense ? 56 : 56 + 20}
                        emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                      />

                      <TableNoData notFound={notFound} />
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
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Skeleton variant="text" width="30%" />
                        <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
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
                  {dataFiltered
                    .filter((row) => row && row.id)
                    .map((row) => (
                      <TimesheetMobileCard key={row.id} row={row} />
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
      
      {/* FLRA Warning Dialog */}
      <Dialog 
        open={flraWarningOpen} 
        onClose={() => setFlraWarningOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>FLRA Required</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            You need to submit the FLRA (Field Level Risk Assessment) first before accessing the timesheet.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFlraWarningOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={() => {
              setFlraWarningOpen(false);
              router.push(paths.schedule.work.flra.edit(selectedFlraId || selectedJobId || ''));
            }} 
            variant="contained"
          >
            Go to FLRA
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* {renderConfirmDialog()} */}
    </>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: TimesheetEntry[];
  filters: IJobTableFilters;
  comparator: (a: any, b: any) => number;
};

function applyTimeSheetFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { query, status, client, company, site, startDate, endDate } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (query) {
    //  inputData = inputData.filter(
    //    (timesheet) =>
    //      timesheet.worker_id?.toLowerCase().indexOf(query.toLowerCase()) !== -1 ||
    //      timesheet.job_worker_id?.toLowerCase().indexOf(query.toLowerCase()) !== -1
    //  );
    const q = query.toLowerCase();
    inputData = inputData.filter(
      (tc) =>
        findInString(q, tc.client.name) ||
        findInString(q, tc.company.name) ||
        findInString(q, tc.site.name) ||
        findInString(q, tc.job.job_number)
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((timesheet) => timesheet.status === status);
  }

  if (client.length > 0) {
    inputData = inputData.filter((timesheet) =>
      client.some((selectedClient: string) =>
        timesheet.client.name?.toLowerCase().includes(selectedClient.toLowerCase())
      )
    );
  }

  if (company.length > 0) {
    inputData = inputData.filter((timesheet) =>
      company.some((selectedCompany: string) =>
        timesheet.company.name?.toLowerCase().includes(selectedCompany.toLowerCase())
      )
    );
  }

  if (site.length > 0) {
    inputData = inputData.filter((timesheet) =>
      site.some((selectedSite: string) =>
        timesheet.site.name?.toLowerCase().includes(selectedSite.toLowerCase())
      )
    );
  }

  if (startDate && endDate) {
    inputData = inputData.filter((timesheet) => {
      // Try multiple date fields as fallbacks
      const timesheetDate =
        timesheet.original_start_time ||
        timesheet.timesheet_date ||
        timesheet.created_at ||
        timesheet.updated_at;

      if (!timesheetDate) {
        return false;
      }

      // Convert to Date objects for comparison
      const timesheetDateObj = new Date(timesheetDate);
      const start =
        startDate && typeof startDate === 'object' && 'toDate' in startDate
          ? startDate.toDate()
          : new Date(startDate as any);
      const end =
        endDate && typeof endDate === 'object' && 'toDate' in endDate
          ? endDate.toDate()
          : new Date(endDate as any);

      // Reset time to start of day for accurate date comparison
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999); // End of day
      timesheetDateObj.setHours(0, 0, 0, 0);

      const isInRange = timesheetDateObj >= start && timesheetDateObj <= end;

      return isInRange;
    });
  }

  return inputData;
}

// ----------------------------------------------------------------------

// Mobile Card Component
function TimesheetMobileCard({ row }: { row: TimesheetEntry }) {
  const router = useRouter();

  const handleViewTimesheet = () => {
    router.push(paths.schedule.work.timesheet.edit(row.id));
  };

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
        cursor: 'pointer',
        '&:hover': {
          boxShadow: (theme) => theme.customShadows.z8,
          transform: 'translateY(-1px)',
          transition: 'all 0.2s ease-in-out',
        }
      }}
      onClick={handleViewTimesheet}
    >
      <Stack spacing={2}>
        {/* Header Row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
              #{row.job?.job_number}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {fDate(row.timesheet_date || row.created_at)}
            </Typography>
          </Box>
          <Label variant="soft" color={getStatusColor(row.status || '')}>
            {row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : ''}
          </Label>
        </Box>

        <Divider />

        {/* Client Row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar 
            src={row.client?.logo_url} 
            alt={row.client?.name} 
            sx={{ width: 32, height: 32 }}
          >
            {row.client?.name?.charAt(0)?.toUpperCase() || 'C'}
          </Avatar>
          <Typography variant="subtitle2">
            {row.client?.name}
          </Typography>
        </Box>

        {/* Site Row */}
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
            {row.site?.name}
          </Typography>
          {row.site?.display_address && (() => {
            // Format address like "919 292 Sterret, Vancouver BC B1T 2G2"
            const formatAddressDisplay = (address: string) => {
              // Split by comma
              const parts = address.split(',').map(p => p.trim()).filter(Boolean);
              
              // Group parts: [street_parts, city + province + postal]
              let streetPart = '';
              let locationPart = '';
              
              // Identify where the city part begins by looking for cities
              const commonCities = ['Vancouver', 'Surrey', 'Burnaby', 'Richmond', 'Toronto', 'Montreal', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Waterloo', 'Halifax', 'London'];
              let foundCity = false;
              
              for (const part of parts) {
                // Check if this part is likely a city
                const isCity = commonCities.some(city => 
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

        {/* Company Row */}
        {row.company?.name && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Customer
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar 
                src={row.company?.logo_url} 
                alt={row.company?.name} 
                sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
              >
                {row.company.name?.charAt(0)?.toUpperCase() || 'C'}
              </Avatar>
              <Typography variant="body2">
                {row.company.name}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Timesheet Manager Row */}
        {row.timesheet_manager && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Timesheet Manager
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar 
                sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
              >
                {row.timesheet_manager.first_name?.charAt(0)?.toUpperCase() || 'M'}
              </Avatar>
              <Typography variant="body2">
                {row.timesheet_manager.first_name} {row.timesheet_manager.last_name}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Confirmed By Row */}
        {row.confirmed_by && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Confirmed By
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar 
                sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
              >
                {row.confirmed_by.first_name?.charAt(0)?.toUpperCase() || 'C'}
              </Avatar>
              <Typography variant="body2">
                {row.confirmed_by.first_name} {row.confirmed_by.last_name}
              </Typography>
            </Box>
          </Box>
        )}
      </Stack>
    </Card>
  );
}
