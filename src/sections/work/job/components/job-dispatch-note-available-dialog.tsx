import type { Dayjs } from 'dayjs';
import type { TableHeadCellProps } from 'src/components/table';

import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Link from '@mui/material/Link';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
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

import type { DashboardRegion } from './job-dashboard-available-table';

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

// Mock data - replace with API when backend is ready
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

type Props = {
  open: boolean;
  onClose: () => void;
  asOf?: Dayjs;
  region?: DashboardRegion;
  title?: string;
};

export function JobDispatchNoteAvailableDialog({ open, onClose, asOf, region, title }: Props) {
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

  const { data: availableData, isLoading } = useQuery({
    queryKey: ['job-dashboard-available', dateStr, region],
    queryFn: async () => {
      const res = await fetcher(availableUrl!);
      return (res as { data: AvailableWorker[] }).data ?? [];
    },
    enabled: !!availableUrl && open,
    staleTime: 60 * 1000,
  });

  const workers = useMemo(() => {
    if (availableData) return availableData;
    const list = MOCK_AVAILABLE_WORKERS;
    if (!region) return list;
    return list.filter((w) => w.region === region);
  }, [region, availableData]);

  const filteredByRole = useMemo(() => {
    if (currentTab === 'all') return workers;
    const role = roleMap[currentTab];
    if (!role) return workers;
    return workers.filter((w) => matchesRoleTab(w.role, role));
  }, [workers, currentTab]);

  const dataFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredByRole;
    const safeStr = (s: string | undefined) => (s ?? '').toLowerCase();
    const phoneDigits = (s: string | undefined) => (s ?? '').replace(/\D/g, '');
    const qPhone = phoneDigits(searchQuery);
    const matchPhone = qPhone.length > 0;
    return filteredByRole.filter(
      (w) =>
        safeStr(w.name).includes(q) ||
        safeStr(w.email).includes(q) ||
        (matchPhone && phoneDigits(w.phone).includes(qPhone)) ||
        safeStr(w.address).includes(q)
    );
  }, [filteredByRole, searchQuery]);

  const dataSorted = useMemo(() => {
    const comparator = getComparator(
      table.order,
      table.orderBy as keyof AvailableWorker
    );
    return [...dataFiltered].sort(comparator as (a: AvailableWorker, b: AvailableWorker) => number);
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
      return workers.filter((w) => matchesRoleTab(w.role, role)).length;
    },
    [workers]
  );

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

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setCurrentTab('all');
      table.onResetPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            {title ? `Available Workers - ${title}` : 'Available Workers'}
          </Typography>
          <Button
            onClick={onClose}
            color="inherit"
            sx={{ minWidth: 'auto', p: 1 }}
          >
            <Iconify icon="mingcute:close-line" width={24} />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={[
            (theme) => ({
              px: 2.5,
              flexShrink: 0,
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

        <Box sx={{ p: 2.5, flexShrink: 0 }}>
          <TextField
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(String(e?.target?.value ?? ''))}
            placeholder="Search by employee name, email, phone, or address..."
            slotProps={{
              htmlInput: { autoComplete: 'off' },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        <Box sx={{ flexGrow: 1, overflow: 'auto', minHeight: 0 }}>
          <Scrollbar sx={{ height: '100%' }}>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 720 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headCells={TABLE_HEAD_AVAILABLE}
                rowCount={totalCount}
                onSort={table.onSort}
              />

              <TableBody>
                {isLoading ? (
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
                      <TableCell sx={{ minWidth: 220 }}>
                        <Skeleton variant="text" width="80%" />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width="90%" />
                      </TableCell>
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

        <Box>
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
        </Box>
      </DialogContent>
    </Dialog>
  );
}
