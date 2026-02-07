import type { Dayjs } from 'dayjs';
import type { IVehicleItem } from 'src/types/vehicle';
import type { TableHeadCellProps } from 'src/components/table';

import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { fetcher, endpoints } from 'src/lib/axios';
import { VEHICLE_TYPE_OPTIONS } from 'src/assets/data';

import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import {
  useTable,
  rowInPage,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

// ----------------------------------------------------------------------

export type VehicleDashboardRegion = 'Metro Vancouver' | 'Vancouver Island' | 'Interior BC';

const TYPE_TABS = [
  { value: 'all', label: 'All' },
  { value: 'lct', label: 'LCT' },
  { value: 'hwy', label: 'HWY' },
] as const;

type TypeTabValue = (typeof TYPE_TABS)[number]['value'];

const LCT_TYPE = 'lane_closure_truck';
const HWY_TYPE = 'highway_truck';

function getTypeTabColor(value: TypeTabValue): 'default' | 'primary' | 'error' {
  if (value === 'all') return 'default';
  if (value === 'lct') return 'primary';
  return 'error';
}

const TABLE_HEAD_AVAILABLE: TableHeadCellProps[] = [
  { id: 'type', label: 'Type', width: 140 },
  { id: 'license_plate', label: 'License Plate', width: 160 },
  { id: 'unit_number', label: 'Unit Number', width: 100 },
  { id: 'assigned_driver', label: 'Assigned Driver', width: 180 },
  { id: 'location', label: 'Location', width: 180 },
];

const TABLE_HEAD_ACTIVE: TableHeadCellProps[] = [
  { id: 'type', label: 'Type', width: 140 },
  { id: 'license_plate', label: 'License Plate', width: 160 },
  { id: 'unit_number', label: 'Unit Number', width: 100 },
  { id: 'assigned_driver', label: 'Assigned Driver', width: 180 },
  { id: 'job_number', label: 'Job #', width: 120 },
  { id: 'shift', label: 'Shift', width: 160 },
];

/** Vehicle row with optional job info for active tab */
type VehicleRow = IVehicleItem & { job_number?: string; shift?: string };

/** Display LCT, HWY (short labels) instead of full names */
function formatVehicleType(type: string): string {
  if (type === 'lane_closure_truck') return 'LCT';
  if (type === 'highway_truck') return 'HWY';
  const opt = VEHICLE_TYPE_OPTIONS.find((o) => o.value === type);
  return opt?.label ?? type;
}

/** LCT = primary, HWY = error (same as job dashboard). */
function getVehicleTypeLabelColor(type: string): { label: string; color: 'primary' | 'error' | 'default' } {
  if (type === 'lane_closure_truck') return { label: 'LCT', color: 'primary' };
  if (type === 'highway_truck') return { label: 'HWY', color: 'error' };
  return { label: formatVehicleType(type), color: 'default' };
}

function getAvatarLetter(name: string): string {
  const firstWord = name.trim().split(/\s+/)[0];
  return firstWord?.charAt(0).toUpperCase() || name.charAt(0).toUpperCase() || '?';
}

type VehicleDashboardRegionTableProps = {
  region: VehicleDashboardRegion;
  title: string;
  viewTab?: 'available' | 'active' | 'weekly';
  activeViewMode?: 'by_vehicle' | 'by_job';
  weeklySubTab?: 'available' | 'active';
  weeklySelectedDay?: number | null;
  dashboardDate?: Dayjs;
  weeklyWeekStart?: Dayjs;
};

function mapApiRowToVehicleRow(row: Record<string, unknown>): VehicleRow {
  const assigned_driver = row.assigned_driver as
    | { id: string; first_name?: string; last_name?: string; photo_url?: string }
    | null
    | undefined;
  return {
    id: String(row.id ?? ''),
    type: String(row.type ?? ''),
    license_plate: String(row.license_plate ?? ''),
    unit_number: String(row.unit_number ?? ''),
    region: String(row.region ?? ''),
    status: String(row.status ?? 'active'),
    info: row.info != null ? String(row.info) : undefined,
    year: row.year != null ? Number(row.year) : undefined,
    location: row.location != null ? String(row.location) : undefined,
    assigned_driver: assigned_driver
      ? {
          id: assigned_driver.id,
          first_name: assigned_driver.first_name ?? '',
          last_name: assigned_driver.last_name ?? '',
          photo_url: assigned_driver.photo_url,
        }
      : null,
    job_number: row.job_number != null ? String(row.job_number) : undefined,
    shift: row.shift != null ? String(row.shift) : undefined,
  };
}

export function VehicleDashboardRegionTable({
  region,
  title,
  viewTab = 'available',
  activeViewMode = 'by_vehicle',
  weeklySubTab = 'available',
  weeklySelectedDay = null,
  dashboardDate,
  weeklyWeekStart,
}: VehicleDashboardRegionTableProps) {
  const [currentTab, setCurrentTab] = useState<TypeTabValue>('all');

  const table = useTable({
    defaultDense: true,
    defaultOrderBy: 'license_plate',
    defaultOrder: 'asc',
    defaultRowsPerPage: 10,
    defaultCurrentPage: 0,
  });

  const isActiveTab = viewTab === 'active';
  const tableHead = isActiveTab ? TABLE_HEAD_ACTIVE : TABLE_HEAD_AVAILABLE;

  const isWeekly = viewTab === 'weekly';
  const useAvailable = !isActiveTab && (isWeekly ? weeklySubTab === 'available' : true);
  const useActive = isActiveTab || (isWeekly && weeklySubTab === 'active');
  const dateStr = dashboardDate?.format('YYYY-MM-DD');
  const weekStartStr = weeklyWeekStart?.format('YYYY-MM-DD');

  const availableUrl =
    dateStr && useAvailable && !isWeekly
      ? `${endpoints.management.vehicleDashboard}/available?date=${encodeURIComponent(dateStr)}&region=${encodeURIComponent(region)}`
      : null;
  const activeUrl =
    dateStr && useActive && !isWeekly
      ? `${endpoints.management.vehicleDashboard}/active?date=${encodeURIComponent(dateStr)}&region=${encodeURIComponent(region)}`
      : null;
  const weeklyAvailableUrl =
    weekStartStr && isWeekly && weeklySubTab === 'available'
      ? `${endpoints.management.vehicleDashboard}/weekly/available?weekStart=${encodeURIComponent(weekStartStr)}&region=${encodeURIComponent(region)}`
      : null;
  const weeklyActiveUrl =
    weekStartStr && isWeekly && weeklySubTab === 'active'
      ? `${endpoints.management.vehicleDashboard}/weekly/active?weekStart=${encodeURIComponent(weekStartStr)}&region=${encodeURIComponent(region)}`
      : null;

  const { data: availableData, isLoading: isLoadingAvailable } = useQuery({
    queryKey: ['vehicle-dashboard-available', dateStr, region],
    queryFn: async () => {
      const res = await fetcher(availableUrl!);
      return (res as { data: Record<string, unknown>[] }).data?.map(mapApiRowToVehicleRow) ?? [];
    },
    enabled: !!availableUrl,
    staleTime: 60 * 1000,
  });

  const { data: activeData, isLoading: isLoadingActive } = useQuery({
    queryKey: ['vehicle-dashboard-active', dateStr, region],
    queryFn: async () => {
      const res = await fetcher(activeUrl!);
      return (res as { data: Record<string, unknown>[] }).data?.map(mapApiRowToVehicleRow) ?? [];
    },
    enabled: !!activeUrl,
    staleTime: 60 * 1000,
  });

  const { data: weeklyAvailableRaw, isLoading: isLoadingWeeklyAvailable } = useQuery({
    queryKey: ['vehicle-dashboard-weekly-available', weekStartStr, region],
    queryFn: async () => {
      const res = await fetcher(weeklyAvailableUrl!);
      return (res as { data: Record<string, unknown>[] }).data ?? [];
    },
    enabled: !!weeklyAvailableUrl,
    staleTime: 60 * 1000,
  });

  const { data: weeklyActiveRaw, isLoading: isLoadingWeeklyActive } = useQuery({
    queryKey: ['vehicle-dashboard-weekly-active', weekStartStr, region],
    queryFn: async () => {
      const res = await fetcher(weeklyActiveUrl!);
      return (res as { data: Record<string, unknown>[] }).data ?? [];
    },
    enabled: !!weeklyActiveUrl,
    staleTime: 60 * 1000,
  });

  const vehiclesByRegion = useMemo((): VehicleRow[] => {
    if (viewTab === 'weekly') {
      const rawAvailable = weeklyAvailableRaw ?? [];
      const rawActive = weeklyActiveRaw ?? [];
      if (weeklySubTab === 'available') {
        if (weeklySelectedDay !== null && weeklySelectedDay !== undefined) {
          const filtered = rawAvailable.filter(
            (row) => (row.availableDays as number[] | undefined)?.includes(weeklySelectedDay)
          );
          return filtered.map(mapApiRowToVehicleRow);
        }
        return rawAvailable.map(mapApiRowToVehicleRow);
      }
      if (weeklySelectedDay !== null && weeklySelectedDay !== undefined) {
        const filtered = rawActive.filter(
          (row) => (row.dayIndex as number | undefined) === weeklySelectedDay
        );
        return filtered.map(mapApiRowToVehicleRow);
      }
      return rawActive.map(mapApiRowToVehicleRow);
    }
    if (viewTab === 'active') return activeData ?? [];
    return availableData ?? [];
  }, [viewTab, weeklySubTab, weeklySelectedDay, availableData, activeData, weeklyAvailableRaw, weeklyActiveRaw]);

  const isLoading =
    (viewTab === 'weekly' && weeklySubTab === 'available' && isLoadingWeeklyAvailable) ||
    (viewTab === 'weekly' && weeklySubTab === 'active' && isLoadingWeeklyActive) ||
    (viewTab === 'active' && isLoadingActive) ||
    (viewTab === 'available' && isLoadingAvailable);

  const vehicles = useMemo(() => {
    if (currentTab === 'all') return vehiclesByRegion;
    if (currentTab === 'lct') return vehiclesByRegion.filter((v) => v.type === LCT_TYPE);
    if (currentTab === 'hwy') return vehiclesByRegion.filter((v) => v.type === HWY_TYPE);
    return vehiclesByRegion;
  }, [vehiclesByRegion, currentTab]);

  const dataInPage = useMemo(
    () => rowInPage(vehicles, table.page, table.rowsPerPage),
    [vehicles, table.page, table.rowsPerPage]
  );

  const totalCount = vehicles.length;
  const notFound = vehicles.length === 0;

  const getTabCount = useCallback(
    (tabValue: TypeTabValue) => {
      if (tabValue === 'all') return vehiclesByRegion.length;
      if (tabValue === 'lct') return vehiclesByRegion.filter((v) => v.type === LCT_TYPE).length;
      if (tabValue === 'hwy') return vehiclesByRegion.filter((v) => v.type === HWY_TYPE).length;
      return 0;
    },
    [vehiclesByRegion]
  );

  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, v: TypeTabValue | null) => {
      if (v != null) {
        setCurrentTab(v);
        table.onResetPage();
      }
    },
    [table]
  );

  if (!isLoading && vehiclesByRegion.length === 0) {
    return null;
  }

  return (
    <>
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      <Card>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={[
            (sxTheme) => ({
              px: 2.5,
              boxShadow: `inset 0 -2px 0 0 ${varAlpha(sxTheme.vars.palette.grey['500Channel'], 0.08)}`,
            }),
          ]}
        >
          {TYPE_TABS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              iconPosition="end"
              icon={
                <Label
                  variant={tab.value === 'all' || tab.value === currentTab ? 'filled' : 'soft'}
                  color={getTypeTabColor(tab.value)}
                >
                  {getTabCount(tab.value)}
                </Label>
              }
            />
          ))}
        </Tabs>
        <Box sx={{ position: 'relative' }}>
          <Scrollbar>
            <Table size="small" sx={{ minWidth: 640 }}>
              <TableHeadCustom headCells={tableHead} />
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell><Skeleton variant="text" width={60} /></TableCell>
                      <TableCell><Skeleton variant="text" width={100} /></TableCell>
                      <TableCell><Skeleton variant="text" width={80} /></TableCell>
                      <TableCell><Skeleton variant="text" width={120} /></TableCell>
                      {isActiveTab ? (
                        <>
                          <TableCell><Skeleton variant="text" width={80} /></TableCell>
                          <TableCell><Skeleton variant="text" width={120} /></TableCell>
                        </>
                      ) : (
                        <TableCell><Skeleton variant="text" width={100} /></TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                <>
                {dataInPage.map((row) => {
                  const driverName = row.assigned_driver
                    ? [row.assigned_driver.first_name, row.assigned_driver.last_name].filter(Boolean).join(' ') || ''
                    : '';
                  const driverId = row.assigned_driver?.id;
                  const vehicleInfoLine = [row.info, row.year ? `(${row.year})` : ''].filter(Boolean).join(' ');
                  const vehicleRow = row as VehicleRow;
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {(() => {
                          const { label, color } = getVehicleTypeLabelColor(row.type);
                          return (
                            <Label variant="soft" color={color}>
                              {label}
                            </Label>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <Stack sx={{ typography: 'body2', alignItems: 'flex-start' }}>
                          <Link
                            href={paths.management.vehicle.edit(row.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            underline="hover"
                            sx={{ fontWeight: 'bold', color: 'primary.main', cursor: 'pointer' }}
                          >
                            {row.license_plate ?? ''}
                          </Link>
                          {vehicleInfoLine ? (
                            <Box sx={{ typography: 'caption', color: 'text.secondary' }}>
                              {vehicleInfoLine}
                            </Box>
                          ) : null}
                        </Stack>
                      </TableCell>
                      <TableCell>{row.unit_number ?? ''}</TableCell>
                      <TableCell>
                        {driverName ? (
                          <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              src={(row.assigned_driver as { photo_url?: string })?.photo_url ?? undefined}
                              alt={driverName}
                              sx={{ width: 32, height: 32 }}
                            >
                              {getAvatarLetter(driverName)}
                            </Avatar>
                            {driverId ? (
                              <Link
                                href={paths.management.user.edit(driverId)}
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
                      {isActiveTab ? (
                        <>
                          <TableCell>{vehicleRow.job_number ?? ''}</TableCell>
                          <TableCell>{vehicleRow.shift ?? ''}</TableCell>
                        </>
                      ) : (
                        <TableCell>{row.location ?? ''}</TableCell>
                      )}
                    </TableRow>
                  );
                })}
                <TableEmptyRows
                  height={table.dense ? 52 : 72}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, totalCount)}
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
      </Card>
    </>
  );
}
