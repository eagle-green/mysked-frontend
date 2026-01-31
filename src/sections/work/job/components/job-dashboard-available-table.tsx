import type { Dayjs } from 'dayjs';
import type { TableHeadCellProps } from 'src/components/table';

import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';

import { formatPhoneNumberSimple } from 'src/utils/format-number';
import { getPositionColor, getRoleDisplayInfo } from 'src/utils/format-role';

import { fetcher, endpoints } from 'src/lib/axios';

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

// ----------------------------------------------------------------------

const ROLE_TABS = [
  { value: 'all', label: 'All' },
  { value: 'tcp', label: 'TCP' },
  { value: 'lct', label: 'LCT' },
  { value: 'hwy', label: 'HWY' },
  { value: 'fs', label: 'Field Supervisor' },
] as const;

type RoleTabValue = (typeof ROLE_TABS)[number]['value'];

const getRoleTabColor = (value: RoleTabValue): 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' =>
  value === 'all' ? 'default' : getPositionColor(value === 'fs' ? 'field_supervisor' : value);

const TABLE_HEAD_AVAILABLE: TableHeadCellProps[] = [
  { id: 'name', label: 'Name', width: 200 },
  { id: 'role', label: 'Role', width: 100 },
  { id: 'phone', label: 'Phone number', width: 140 },
  { id: 'email', label: 'Email', width: 220 },
  { id: 'address', label: 'Address' },
];

const TABLE_HEAD_ACTIVE: TableHeadCellProps[] = [
  { id: 'name', label: 'Name', width: 200 },
  { id: 'role', label: 'Role', width: 100 },
  { id: 'phone', label: 'Phone number', width: 140 },
  { id: 'jobNumber', label: 'Job #', width: 100 },
  { id: 'assignedRole', label: 'Assigned Role', width: 120 },
  { id: 'client', label: 'Client', width: 160 },
  { id: 'location', label: 'Location', width: 180 },
  { id: 'shift', label: 'Shift', width: 200 },
  { id: 'hours', label: 'Hrs', width: 70 },
];

export type DashboardRegion = 'Metro Vancouver' | 'Vancouver Island' | 'Interior BC';

type AvailableWorker = {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  address: string;
  region?: DashboardRegion;
  photo_url?: string;
};

type ActiveWorker = {
  id: string;
  name: string;
  role: string;
  phone: string;
  jobNumber: string;
  assignedRole: string;
  client: string;
  clientId: string;
  location: string;
  shift: string;
  hours: number;
  region?: DashboardRegion;
  photo_url?: string;
};

// Mock data - replace with API when backend is ready. Workers split by region.
const MOCK_AVAILABLE_WORKERS: AvailableWorker[] = [
  { id: '1', name: 'Alex Johnson', role: 'tcp', phone: '(604) 555-0101', email: 'alex.j@example.com', address: '123 Main St, Vancouver, BC', region: 'Metro Vancouver' },
  { id: '2', name: 'Sam Williams', role: 'tcp', phone: '(604) 555-0102', email: 'sam.w@example.com', address: '456 Oak Ave, Burnaby, BC', region: 'Metro Vancouver' },
  { id: '3', name: 'Jordan Lee', role: 'lct', phone: '(604) 555-0103', email: 'jordan.l@example.com', address: '789 Pine Rd, Surrey, BC', region: 'Metro Vancouver' },
  { id: '4', name: 'Morgan Davis', role: 'lct', phone: '(604) 555-0104', email: 'morgan.d@example.com', address: '321 Elm St, Coquitlam, BC', region: 'Metro Vancouver' },
  { id: '5', name: 'Casey Brown', role: 'hwy', phone: '(604) 555-0105', email: 'casey.b@example.com', address: '654 Cedar Ln, Richmond, BC', region: 'Metro Vancouver' },
  { id: '7', name: 'Taylor Martinez', role: 'field_supervisor', phone: '(604) 555-0107', email: 'taylor.m@example.com', address: '147 Maple Dr, Vancouver, BC', region: 'Metro Vancouver' },
  { id: '6', name: 'Riley Wilson', role: 'hwy', phone: '(604) 555-0106', email: 'riley.w@example.com', address: '987 Birch Blvd, Delta, BC', region: 'Vancouver Island' },
  { id: '8', name: 'Jamie Anderson', role: 'field_supervisor', phone: '(604) 555-0108', email: 'jamie.a@example.com', address: '258 Spruce Way, New Westminster, BC', region: 'Vancouver Island' },
  { id: '9', name: 'Drew Campbell', role: 'tcp', phone: '(250) 555-0201', email: 'drew.c@example.com', address: '100 Harbor Rd, Victoria, BC', region: 'Vancouver Island' },
  { id: '10', name: 'Sam Taylor', role: 'lct', phone: '(250) 555-0202', email: 'sam.t@example.com', address: '200 Ocean Dr, Nanaimo, BC', region: 'Vancouver Island' },
  { id: '11', name: 'Quinn Moore', role: 'tcp', phone: '(250) 555-0301', email: 'quinn.m@example.com', address: '500 Bernard Ave, Kelowna, BC', region: 'Interior BC' },
  { id: '12', name: 'Pat Kelly', role: 'lct', phone: '(250) 555-0302', email: 'pat.k@example.com', address: '200 Victoria St, Kamloops, BC', region: 'Interior BC' },
  { id: '13', name: 'Robin Chen', role: 'hwy', phone: '(250) 555-0303', email: 'robin.c@example.com', address: '100 Seymour St, Vernon, BC', region: 'Interior BC' },
];

// Mock active workers (on job) - replace with API when backend is ready
const MOCK_ACTIVE_WORKERS: ActiveWorker[] = [
  { id: 'a1', name: 'Alex Johnson', role: 'tcp', phone: '(604) 555-0101', jobNumber: 'J-2024-081', assignedRole: 'tcp', client: 'Acme Corp', clientId: 'c1', location: '123 Main St, Vancouver', shift: '9:00 AM – 5:00 PM', hours: 8, region: 'Metro Vancouver' },
  { id: 'a2', name: 'Jordan Lee', role: 'lct', phone: '(604) 555-0103', jobNumber: 'J-2024-082', assignedRole: 'lct', client: 'Beta Inc', clientId: 'c2', location: '456 Oak Ave, Burnaby', shift: '7:00 AM – 3:30 PM', hours: 8.5, region: 'Metro Vancouver' },
  { id: 'a3', name: 'Casey Brown', role: 'hwy', phone: '(604) 555-0105', jobNumber: 'J-2024-083', assignedRole: 'hwy', client: 'Acme Corp', clientId: 'c1', location: '789 Pine Rd, Surrey', shift: '8:00 AM – 4:00 PM', hours: 8, region: 'Metro Vancouver' },
  { id: 'a4', name: 'Taylor Martinez', role: 'field_supervisor', phone: '(604) 555-0107', jobNumber: 'J-2024-081', assignedRole: 'field_supervisor', client: 'Acme Corp', clientId: 'c1', location: '123 Main St, Vancouver', shift: '9:00 AM – 5:00 PM', hours: 8, region: 'Metro Vancouver' },
  { id: 'a5', name: 'Sam Williams', role: 'tcp', phone: '(604) 555-0102', jobNumber: 'J-2024-084', assignedRole: 'tcp', client: 'Gamma Ltd', clientId: 'c3', location: '321 Elm St, Coquitlam', shift: '6:00 AM – 2:00 PM', hours: 8, region: 'Metro Vancouver' },
  { id: 'a6', name: 'Morgan Davis', role: 'lct', phone: '(604) 555-0104', jobNumber: 'J-2024-084', assignedRole: 'lct', client: 'Gamma Ltd', clientId: 'c3', location: '321 Elm St, Coquitlam', shift: '6:00 AM – 2:00 PM', hours: 8, region: 'Metro Vancouver' },
  { id: 'a7', name: 'Riley Wilson', role: 'hwy', phone: '(604) 555-0106', jobNumber: 'J-2024-085', assignedRole: 'hwy', client: 'Island Co', clientId: 'c4', location: '50 Harbor Rd, Victoria', shift: '8:00 AM – 4:00 PM', hours: 8, region: 'Vancouver Island' },
  { id: 'a8', name: 'Drew Campbell', role: 'tcp', phone: '(250) 555-0201', jobNumber: 'J-2024-086', assignedRole: 'tcp', client: 'Coastal Ltd', clientId: 'c5', location: '200 Ocean Dr, Nanaimo', shift: '7:30 AM – 3:30 PM', hours: 8, region: 'Vancouver Island' },
  { id: 'a9', name: 'Quinn Moore', role: 'tcp', phone: '(250) 555-0301', jobNumber: 'J-2024-087', assignedRole: 'tcp', client: 'Interior Power Co', clientId: 'c6', location: '500 Bernard Ave, Kelowna', shift: '7:00 AM – 3:00 PM', hours: 8, region: 'Interior BC' },
  { id: 'a10', name: 'Pat Kelly', role: 'lct', phone: '(250) 555-0302', jobNumber: 'J-2024-088', assignedRole: 'lct', client: 'Valley Services', clientId: 'c7', location: '200 Victoria St, Kamloops', shift: '8:00 AM – 4:30 PM', hours: 8.5, region: 'Interior BC' },
];

/** LCT/TCP counts as LCT for filtering. */
function matchesRoleTab(workerRole: string, tabRole: string): boolean {
  if (tabRole === 'lct') return workerRole === 'lct' || workerRole === 'lct/tcp';
  return workerRole === tabRole;
}

/** First letter of first name only, matching Employee List avatar fallback */
function getAvatarLetter(name: string): string {
  const firstWord = name.trim().split(/\s+/)[0];
  return firstWord?.charAt(0).toUpperCase() || name.charAt(0).toUpperCase() || '?';
}

// ----------------------------------------------------------------------

const roleMap: Record<RoleTabValue, AvailableWorker['role'] | undefined> = {
  all: undefined,
  tcp: 'tcp',
  lct: 'lct',
  hwy: 'hwy',
  fs: 'field_supervisor',
};

type JobDashboardAvailableTableProps = {
  asOf?: Dayjs;
  mode?: 'available' | 'active';
  region?: DashboardRegion;
  title?: string;
};

export function JobDashboardAvailableTable({ asOf, mode = 'available', region, title }: JobDashboardAvailableTableProps) {
  const [currentTab, setCurrentTab] = useState<RoleTabValue>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const table = useTable({
    defaultDense: true,
    defaultOrderBy: 'name',
    defaultOrder: 'asc',
    defaultRowsPerPage: 10,
    defaultCurrentPage: 0,
  });

  const dateStr = asOf?.format('YYYY-MM-DD');
  const params = new URLSearchParams();
  if (dateStr) params.set('date', dateStr);
  if (region) params.set('region', region);
  const availableUrl = dateStr ? `${endpoints.work.jobDashboard}/available?${params.toString()}` : null;
  const activeUrl = dateStr ? `${endpoints.work.jobDashboard}/active?${params.toString()}` : null;

  const { data: availableData, isLoading: isLoadingAvailable } = useQuery({
    queryKey: ['job-dashboard-available', dateStr, region],
    queryFn: async () => {
      const res = await fetcher(availableUrl!);
      return (res as { data: AvailableWorker[] }).data ?? [];
    },
    enabled: !!availableUrl && mode === 'available',
  });

  const { data: activeData, isLoading: isLoadingActive } = useQuery({
    queryKey: ['job-dashboard-active', dateStr, region],
    queryFn: async () => {
      const res = await fetcher(activeUrl!);
      return (res as { data: ActiveWorker[] }).data ?? [];
    },
    enabled: !!activeUrl && mode === 'active',
  });

  const isLoading = mode === 'available' ? isLoadingAvailable : isLoadingActive;

  const workers = useMemo(() => {
    if (mode === 'available' && availableData) return availableData;
    if (mode === 'active' && activeData) return activeData;
    const list = mode === 'active' ? MOCK_ACTIVE_WORKERS : MOCK_AVAILABLE_WORKERS;
    if (!region) return list;
    return list.filter((w) => (w as AvailableWorker & ActiveWorker).region === region);
  }, [mode, region, availableData, activeData]);

  const filteredByRole = useMemo(() => {
    if (currentTab === 'all') return workers;
    const role = roleMap[currentTab];
    if (!role) return workers;
    if (mode === 'active') {
      return (workers as ActiveWorker[]).filter((w) => matchesRoleTab(w.assignedRole, role));
    }
    return (workers as AvailableWorker[]).filter((w) => matchesRoleTab(w.role, role));
  }, [workers, currentTab, mode]);

  const dataFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredByRole;
    const safeStr = (s: string | undefined) => (s ?? '').toLowerCase();
    const phoneDigits = (s: string | undefined) => (s ?? '').replace(/\D/g, '');
    const qPhone = phoneDigits(searchQuery);
    // Only match by phone when query has digits; otherwise "" matches every phone
    const matchPhone = qPhone.length > 0;
    if (mode === 'active') {
      return (filteredByRole as ActiveWorker[]).filter(
        (w) =>
          safeStr(w.name).includes(q) ||
          safeStr(w.jobNumber).includes(q) ||
          safeStr(w.client).includes(q) ||
          safeStr(w.location).includes(q) ||
          safeStr(w.assignedRole).includes(q) ||
          (matchPhone && phoneDigits(w.phone).includes(qPhone))
      );
    }
    return (filteredByRole as AvailableWorker[]).filter(
      (w) =>
        safeStr(w.name).includes(q) ||
        safeStr(w.email).includes(q) ||
        (matchPhone && phoneDigits(w.phone).includes(qPhone)) ||
        safeStr(w.address).includes(q)
    );
  }, [filteredByRole, searchQuery, mode]);

  const dataSorted = useMemo(() => {
    const comparator = getComparator(
      table.order,
      table.orderBy as keyof AvailableWorker & keyof ActiveWorker
    );
    return [...dataFiltered].sort(comparator as (a: AvailableWorker | ActiveWorker, b: AvailableWorker | ActiveWorker) => number);
  }, [dataFiltered, table.order, table.orderBy]);

  const dataInPage = useMemo(
    () => rowInPage(dataSorted, table.page, table.rowsPerPage),
    [dataSorted, table.page, table.rowsPerPage]
  );

  const totalCount = dataSorted.length;
  const notFound = !dataFiltered.length;

  const getTabCount = useCallback(
    (tabValue: RoleTabValue) => {
      if (tabValue === 'all') return workers.length;
      const role = roleMap[tabValue];
      if (!role) return 0;
      if (mode === 'active') {
        return (workers as ActiveWorker[]).filter((w) => matchesRoleTab(w.assignedRole, role)).length;
      }
      return (workers as AvailableWorker[]).filter((w) => matchesRoleTab(w.role, role)).length;
    },
    [workers, mode]
  );

  const tableHead = mode === 'active' ? TABLE_HEAD_ACTIVE : TABLE_HEAD_AVAILABLE;

  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, v: RoleTabValue) => {
      setCurrentTab(v);
      table.onResetPage();
    },
    [table]
  );

  useEffect(() => {
    table.onResetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    table.onResetPage();
    table.setOrderBy(mode === 'active' ? 'name' : 'name');
    table.setOrder('asc');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Hide table if not loading and no data
  if (!isLoading && workers.length === 0) {
    return null;
  }

  return (
    <>
      {title && (
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          {title}
        </Typography>
      )}
      <Card>
      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        sx={[
          (theme) => ({
            px: 2.5,
            boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
          }),
        ]}
      >
        {ROLE_TABS.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            label={tab.label}
            iconPosition="end"
            icon={
              <Label
                variant={(tab.value === 'all' || tab.value === currentTab) ? 'filled' : 'soft'}
                color={getRoleTabColor(tab.value)}
              >
                {getTabCount(tab.value)}
              </Label>
            }
          />
        ))}
      </Tabs>

      <Box
        sx={{
          p: 2.5,
          gap: 2,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-end', md: 'center' },
        }}
      >
        <TextField
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(String(e?.target?.value ?? ''))}
          placeholder={
            mode === 'active'
              ? 'Search by employee name, Job #, Client, or Location...'
              : 'Search by employee name, email, phone, or address...'
          }
          slotProps={{
            htmlInput: { autoComplete: 'off', 'data-testid': 'dashboard-table-search' },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ width: '100%', minWidth: 0 }}
        />
      </Box>

      <Box sx={{ position: 'relative' }}>
        <Scrollbar>
          <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: mode === 'active' ? 960 : 720 }}>
            <TableHeadCustom
              order={table.order}
              orderBy={table.orderBy}
              headCells={tableHead}
              rowCount={totalCount}
              onSort={table.onSort}
            />

            <TableBody>
              {isLoading ? (
                // Skeleton loading rows
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell sx={{ minWidth: 200 }}>
                      <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
                        <Skeleton variant="circular" width={32} height={32} />
                        <Skeleton variant="text" width="70%" />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ minWidth: 100 }}>
                      <Skeleton variant="rectangular" width={50} height={24} sx={{ borderRadius: 1 }} />
                    </TableCell>
                    <TableCell sx={{ minWidth: 140 }}>
                      <Skeleton variant="text" width="80%" />
                    </TableCell>
                    {mode === 'active' ? (
                      <>
                        <TableCell sx={{ minWidth: 100 }}>
                          <Skeleton variant="text" width="60%" />
                        </TableCell>
                        <TableCell sx={{ minWidth: 120 }}>
                          <Skeleton variant="rectangular" width={50} height={24} sx={{ borderRadius: 1 }} />
                        </TableCell>
                        <TableCell sx={{ minWidth: 160 }}>
                          <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
                            <Skeleton variant="circular" width={32} height={32} />
                            <Skeleton variant="text" width="60%" />
                          </Box>
                        </TableCell>
                        <TableCell sx={{ minWidth: 180 }}>
                          <Skeleton variant="text" width="80%" />
                        </TableCell>
                        <TableCell sx={{ minWidth: 200 }}>
                          <Skeleton variant="text" width="90%" />
                        </TableCell>
                        <TableCell sx={{ minWidth: 70 }}>
                          <Skeleton variant="text" width="40%" />
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell sx={{ minWidth: 220 }}>
                          <Skeleton variant="text" width="80%" />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width="90%" />
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              ) : mode === 'active' ? (
                (dataInPage as ActiveWorker[]).map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ minWidth: 200 }}>
                        <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            src={row.photo_url ?? undefined}
                            alt={row.name}
                            sx={{ width: 32, height: 32 }}
                          >
                            {getAvatarLetter(row.name)}
                          </Avatar>
                          <Link
                            href={paths.management.user.edit(row.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            underline="hover"
                            sx={{ typography: 'body2', fontWeight: 500, color: 'text.primary' }}
                          >
                            {row.name}
                          </Link>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ minWidth: 100 }}>
                        {(() => {
                          const { label, color } = getRoleDisplayInfo(row.role);
                          return (
                            <Label variant="soft" color={color}>
                              {label}
                            </Label>
                          );
                        })()}
                      </TableCell>
                      <TableCell sx={{ minWidth: 140 }}>
                        <Link
                          href={`tel:${row.phone.replace(/\D/g, '')}`}
                          color="primary"
                          underline="hover"
                          sx={{ typography: 'body2' }}
                        >
                          {formatPhoneNumberSimple(row.phone) || row.phone}
                        </Link>
                      </TableCell>
                      <TableCell sx={{ minWidth: 100 }}>{row.jobNumber}</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>
                        {(() => {
                          const { label, color } = getRoleDisplayInfo(row.assignedRole);
                          return (
                            <Label variant="soft" color={color}>
                              {label}
                            </Label>
                          );
                        })()}
                      </TableCell>
                      <TableCell sx={{ minWidth: 160 }}>
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
                      </TableCell>
                      <TableCell sx={{ minWidth: 180 }}>{row.location}</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>{row.shift}</TableCell>
                      <TableCell sx={{ minWidth: 70 }}>{row.hours}</TableCell>
                    </TableRow>
                  ))
              ) : (
                (dataInPage as AvailableWorker[]).map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ minWidth: 200 }}>
                        <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            src={row.photo_url ?? undefined}
                            alt={row.name}
                            sx={{ width: 32, height: 32 }}
                          >
                            {getAvatarLetter(row.name)}
                          </Avatar>
                          <Link
                            href={paths.management.user.edit(row.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            underline="hover"
                            sx={{ typography: 'body2', fontWeight: 500, color: 'text.primary' }}
                          >
                            {row.name}
                          </Link>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ minWidth: 100 }}>
                        {(() => {
                          const { label, color } = getRoleDisplayInfo(row.role);
                          return (
                            <Label variant="soft" color={color}>
                              {label}
                            </Label>
                          );
                        })()}
                      </TableCell>
                      <TableCell sx={{ minWidth: 140 }}>
                        <Link
                          href={`tel:${row.phone.replace(/\D/g, '')}`}
                          color="primary"
                          underline="hover"
                          sx={{ typography: 'body2' }}
                        >
                          {formatPhoneNumberSimple(row.phone) || row.phone}
                        </Link>
                      </TableCell>
                      <TableCell sx={{ minWidth: 220 }}>
                        <Link
                          href={`mailto:${row.email}`}
                          color="primary"
                          underline="hover"
                          sx={{ typography: 'body2' }}
                        >
                          {row.email}
                        </Link>
                      </TableCell>
                      <TableCell>{row.address}</TableCell>
                    </TableRow>
                  ))
              )}

              {!isLoading && (
                <>
                  <TableEmptyRows
                    height={table.dense ? 52 : 72}
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
        rowsPerPageOptions={[5, 10, 25, 50]}
        onPageChange={table.onChangePage}
        onChangeDense={table.onChangeDense}
        onRowsPerPageChange={table.onChangeRowsPerPage}
      />
    </Card>
    </>
  );
}
