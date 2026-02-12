import type { Dayjs } from 'dayjs';
import type { TableHeadCellProps } from 'src/components/table';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, Fragment, useCallback } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import Collapse from '@mui/material/Collapse';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';

import { fDate, fTime } from 'src/utils/format-time';
import { formatPhoneNumberSimple } from 'src/utils/format-number';

import { fetcher, endpoints } from 'src/lib/axios';
import { VEHICLE_TYPE_OPTIONS } from 'src/assets/data';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import {
  useTable,
  rowInPage,
  emptyRows,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { JobDetailsDialog } from 'src/sections/work/calendar/job-details-dialog';

import type { VehicleDashboardRegion } from './vehicle-dashboard-region-table';

// ----------------------------------------------------------------------

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'jobNumber', label: 'Job #', width: 120 },
  { id: 'client', label: 'Client', width: 160 },
  { id: 'location', label: 'Location', width: 200 },
  { id: 'lctCount', label: 'LCT', width: 70 },
  { id: 'hwyCount', label: 'HWY', width: 70 },
  { id: 'createdBy', label: 'Created By', width: 150 },
  { id: 'expand', label: '', width: 48 },
];

type VehicleOnJob = {
  type: string;
  license_plate: string;
  unit_number: string;
  info?: string;
  year?: number;
  shift?: string | null;
  assigned_driver?: { id: string; first_name: string; last_name: string } | null;
  vehicle_id?: string;
};

type CreatedBy = {
  first_name: string;
  last_name: string;
  photo_url?: string;
};

type ActiveJobRow = {
  jobNumber: string;
  jobId: string;
  client: string;
  clientId: string;
  clientContactNumber?: string | null;
  location: string;
  lctCount: number;
  hwyCount: number;
  created_by?: CreatedBy | null;
  created_at?: string;
  vehicles: VehicleOnJob[];
  region?: VehicleDashboardRegion;
};

function getAvatarLetter(name: string): string {
  const firstWord = name.trim().split(/\s+/)[0];
  return firstWord?.charAt(0).toUpperCase() || name?.charAt(0).toUpperCase() || '?';
}

function formatVehicleType(type: string): string {
  if (type === 'lane_closure_truck') return 'LCT';
  if (type === 'highway_truck') return 'HWY';
  const opt = VEHICLE_TYPE_OPTIONS.find((o) => o.value === type);
  return opt?.label ?? type;
}

/** LCT = primary, HWY = error (same as job dashboard role labels). */
function getVehicleTypeLabelColor(type: string): { label: string; color: 'primary' | 'error' | 'default' } {
  if (type === 'lane_closure_truck') return { label: 'LCT', color: 'primary' };
  if (type === 'highway_truck') return { label: 'HWY', color: 'error' };
  return { label: formatVehicleType(type), color: 'default' };
}

// ----------------------------------------------------------------------

type VehicleDashboardActiveByJobTableProps = {
  region: VehicleDashboardRegion;
  title: string;
  asOf?: Dayjs;
  weekStart?: Dayjs;
};

export function VehicleDashboardActiveByJobTable({ region, title, asOf, weekStart }: VehicleDashboardActiveByJobTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [jobDetailsOpen, setJobDetailsOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const openJobDetails = useCallback((jobId: string) => {
    setSelectedJobId(jobId);
    setJobDetailsOpen(true);
  }, []);

  const closeJobDetails = useCallback(() => {
    setJobDetailsOpen(false);
    setSelectedJobId(null);
  }, []);

  const table = useTable({
    defaultDense: true,
    defaultOrderBy: 'jobNumber',
    defaultOrder: 'asc',
    defaultRowsPerPage: 10,
    defaultCurrentPage: 0,
  });

  const useWeek = !!weekStart;
  const dateStr = asOf?.format('YYYY-MM-DD');
  const weekStartStr = weekStart?.format('YYYY-MM-DD');
  const params = new URLSearchParams();
  if (useWeek && weekStartStr) params.set('weekStart', weekStartStr);
  else if (dateStr) params.set('date', dateStr);
  params.set('region', region);
  const activeByJobUrl = (useWeek && weekStartStr) || dateStr ? `${endpoints.management.vehicleDashboard}/active-by-job?${params.toString()}` : null;

  const { data: apiJobs, isLoading } = useQuery({
    queryKey: ['vehicle-dashboard-active-by-job', dateStr, weekStartStr, region],
    queryFn: async () => {
      const res = await fetcher(activeByJobUrl!);
      return (res as { data: ActiveJobRow[] }).data ?? [];
    },
    enabled: !!activeByJobUrl,
    staleTime: 60 * 1000,
  });

  const jobs = useMemo(() => apiJobs ?? [], [apiJobs]);

  const dataSorted = useMemo(() => {
    const comparator = getComparator(table.order, table.orderBy as keyof ActiveJobRow);
    return [...jobs].sort(comparator as unknown as (a: ActiveJobRow, b: ActiveJobRow) => number);
  }, [jobs, table.order, table.orderBy]);

  const dataInPage = useMemo(
    () => rowInPage(dataSorted, table.page, table.rowsPerPage),
    [dataSorted, table.page, table.rowsPerPage]
  );

  const totalCount = dataSorted.length;
  const notFound = jobs.length === 0;

  const toggleExpanded = useCallback((jobNumber: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(jobNumber)) next.delete(jobNumber);
      else next.add(jobNumber);
      return next;
    });
  }, []);

  const handleSort = useCallback(
    (id: string) => {
      if (id === 'expand') return;
      table.onSort(id);
    },
    [table]
  );

  if (!isLoading && jobs.length === 0) {
    return null;
  }

  return (
    <>
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      <Card>
        <Box sx={{ position: 'relative' }}>
          <Scrollbar>
            <Table size="small" sx={{ minWidth: 900 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headCells={TABLE_HEAD}
                rowCount={totalCount}
                onSort={handleSort}
              />
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell><Skeleton variant="text" width={80} /></TableCell>
                      <TableCell><Skeleton variant="text" width={100} /></TableCell>
                      <TableCell><Skeleton variant="text" width={140} /></TableCell>
                      <TableCell><Skeleton variant="text" width={40} /></TableCell>
                      <TableCell><Skeleton variant="text" width={40} /></TableCell>
                      <TableCell><Skeleton variant="text" width={100} /></TableCell>
                      <TableCell><Skeleton variant="text" width={32} /></TableCell>
                    </TableRow>
                  ))
                ) : (
                <>
                {dataInPage.map((row) => {
                  const isExpanded = expandedRows.has(row.jobNumber);
                  const hasVehicles = row.vehicles.length > 0;
                  return (
                    <Fragment key={row.jobNumber}>
                      <TableRow hover>
                        <TableCell sx={{ minWidth: 120 }}>
                          <Link
                            component="button"
                            type="button"
                            onClick={() => openJobDetails(row.jobId)}
                            color="primary"
                            underline="hover"
                            sx={{ typography: 'body2', fontWeight: 700, cursor: 'pointer' }}
                          >
                            {row.jobNumber}
                          </Link>
                        </TableCell>
                        <TableCell sx={{ minWidth: 160 }}>
                          <Stack spacing={0.25}>
                            <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
                              <Avatar alt={row.client} sx={{ width: 32, height: 32 }}>
                                {getAvatarLetter(row.client)}
                              </Avatar>
                              <Link
                                href={paths.management.client.edit(row.clientId)}
                                target="_blank"
                                rel="noopener noreferrer"
                                underline="hover"
                                sx={{ typography: 'body2', fontWeight: 500, color: 'text.primary' }}
                              >
                                {row.client}
                              </Link>
                            </Box>
                            {row.clientContactNumber && (
                              <Link
                                href={`tel:${row.clientContactNumber.replace(/\D/g, '')}`}
                                variant="caption"
                                color="primary"
                                sx={{
                                  textDecoration: 'none',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                               
                                }}
                              >
                                <Iconify icon="solar:phone-bold" width={14} />
                                {formatPhoneNumberSimple(row.clientContactNumber)}
                              </Link>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ minWidth: 200 }}>{row.location}</TableCell>
                        <TableCell sx={{ minWidth: 70 }}>{row.lctCount}</TableCell>
                        <TableCell sx={{ minWidth: 70 }}>{row.hwyCount}</TableCell>
                        <TableCell sx={{ minWidth: 150 }}>
                          {row.created_by ? (
                            <ListItemText
                              primary={
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Avatar
                                    src={row.created_by.photo_url ?? undefined}
                                    alt={`${row.created_by.first_name} ${row.created_by.last_name}`}
                                    sx={{ width: 32, height: 32 }}
                                  >
                                    {row.created_by.first_name?.charAt(0)?.toUpperCase()}
                                  </Avatar>
                                  <Typography variant="body2" noWrap>
                                    {`${row.created_by.first_name} ${row.created_by.last_name}`}
                                  </Typography>
                                </Stack>
                              }
                              secondary={row.created_at ? `${fDate(row.created_at)} ${fTime(row.created_at)}` : undefined}
                              slotProps={{
                                primary: { sx: { typography: 'body2' } },
                                secondary: { sx: { mt: 0.5, typography: 'caption' } },
                              }}
                            />
                          ) : null}
                        </TableCell>
                        <TableCell sx={{ width: 48 }}>
                          {hasVehicles ? (
                            <IconButton
                              size="small"
                              color={isExpanded ? 'inherit' : 'default'}
                              onClick={() => toggleExpanded(row.jobNumber)}
                              sx={{ ...(isExpanded && { bgcolor: 'action.hover' }) }}
                              aria-label={isExpanded ? 'Collapse' : 'Expand'}
                            >
                              <Iconify
                                icon={isExpanded ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
                                width={20}
                              />
                            </IconButton>
                          ) : null}
                        </TableCell>
                      </TableRow>
                      {hasVehicles && (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ py: 0, border: 0 }}>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box sx={{ py: 2, px: 1 }}>
                                <Table size="small" sx={{ width: '100%' }}>
                                  <TableBody>
                                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                                      <TableCell sx={{ fontWeight: 600 }}>License Plate</TableCell>
                                      <TableCell sx={{ fontWeight: 600 }}>Unit Number</TableCell>
                                      <TableCell sx={{ fontWeight: 600 }}>Assigned Driver</TableCell>
                                      <TableCell sx={{ fontWeight: 600 }}>Shift</TableCell>
                                    </TableRow>
                                    {row.vehicles.map((v, idx) => {
                                      const driverName = v.assigned_driver
                                        ? [v.assigned_driver.first_name, v.assigned_driver.last_name].filter(Boolean).join(' ') || ''
                                        : '';
                                      const vehicleInfoLine = [v.info, v.year ? `(${v.year})` : ''].filter(Boolean).join(' ');
                                      return (
                                        <TableRow key={`${row.jobNumber}-${v.license_plate}-${idx}`}>
                                          <TableCell>
                                            {(() => {
                                              const { label, color } = getVehicleTypeLabelColor(v.type);
                                              return (
                                                <Label variant="soft" color={color}>
                                                  {label}
                                                </Label>
                                              );
                                            })()}
                                          </TableCell>
                                          <TableCell>
                                            <Stack sx={{ typography: 'body2', alignItems: 'flex-start' }}>
                                              {v.vehicle_id ? (
                                                <Link
                                                  href={paths.management.vehicle.edit(v.vehicle_id)}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  underline="hover"
                                                  sx={{ fontWeight: 'bold', color: 'primary.main', cursor: 'pointer' }}
                                                >
                                                  {v.license_plate}
                                                </Link>
                                              ) : (
                                                <Box component="span" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                                                  {v.license_plate}
                                                </Box>
                                              )}
                                              {vehicleInfoLine ? (
                                                <Box sx={{ typography: 'caption', color: 'text.secondary' }}>
                                                  {vehicleInfoLine}
                                                </Box>
                                              ) : null}
                                            </Stack>
                                          </TableCell>
                                          <TableCell>{v.unit_number ?? ''}</TableCell>
                                          <TableCell>
                                            {driverName ? (
                                              <Box sx={{ gap: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <Avatar alt={driverName} sx={{ width: 32, height: 32 }}>
                                                  {getAvatarLetter(driverName)}
                                                </Avatar>
                                                {v.assigned_driver?.id ? (
                                                  <Link
                                                    href={paths.management.user.edit(v.assigned_driver.id)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    underline="hover"
                                                    sx={{ typography: 'body2', fontWeight: 500, color: 'text.primary' }}
                                                  >
                                                    {driverName}
                                                  </Link>
                                                ) : (
                                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{driverName}</Typography>
                                                )}
                                              </Box>
                                            ) : null}
                                          </TableCell>
                                          <TableCell>{v.shift ?? ''}</TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
                <TableEmptyRows
                  height={0}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, dataSorted.length)}
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
          rowsPerPageOptions={[10, 25, 50]}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          labelRowsPerPage="Rows per page:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
        />

        {selectedJobId && (
          <JobDetailsDialog
            open={jobDetailsOpen}
            onClose={closeJobDetails}
            jobId={selectedJobId}
          />
        )}
      </Card>
    </>
  );
}
