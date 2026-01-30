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
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';

import { fDate, fTime } from 'src/utils/format-time';
import { getRoleDisplayInfo } from 'src/utils/format-role';
import { formatPhoneNumberSimple } from 'src/utils/format-number';

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

import { JobDetailsDialog } from 'src/sections/work/calendar/job-details-dialog';

import type { DashboardRegion } from './job-dashboard-available-table';

// ----------------------------------------------------------------------

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'jobNumber', label: 'Job #', width: 120 },
  { id: 'client', label: 'Client', width: 160 },
  { id: 'location', label: 'Location', width: 200 },
  { id: 'tcpCount', label: 'TCP', width: 70 },
  { id: 'lctCount', label: 'LCT', width: 70 },
  { id: 'hwyCount', label: 'HWY', width: 70 },
  { id: 'fieldSupervisorCount', label: 'Field Supervisor', width: 70 },
  { id: 'createdBy', label: 'Created by', width: 150 },
  { id: 'updatedBy', label: 'Updated by', width: 150 },
  { id: 'expand', label: '', width: 48 },
];

type CrewMember = {
  id: string;
  name: string;
  assignedRole: 'tcp' | 'lct' | 'hwy' | 'field_supervisor';
  contact: string;
  vehicle: string;
  shift: string;
  status: string;
};

type CreatedUpdatedBy = {
  first_name: string;
  last_name: string;
  photo_url?: string;
};

type ActiveJobRow = {
  jobNumber: string;
  jobId: string;
  client: string;
  clientId: string;
  location: string;
  tcpCount: number;
  lctCount: number;
  hwyCount: number;
  fieldSupervisorCount: number;
  created_by?: CreatedUpdatedBy | null;
  created_at?: string;
  updated_by?: CreatedUpdatedBy | null;
  updated_at?: string;
  crew: CrewMember[];
  region?: DashboardRegion;
};

function getAvatarLetter(name: string): string {
  const firstWord = name.trim().split(/\s+/)[0];
  return firstWord?.charAt(0).toUpperCase() || name?.charAt(0).toUpperCase() || '?';
}

/** Worker/assignment status label – same as Job List (Work Management → Job → List) expanded worker status */
function getWorkerStatusLabel(status: string): string {
  const normalized = (status || '').toLowerCase();
  switch (normalized) {
    case 'pending':
      return 'Pending';
    case 'accepted':
      return 'Accepted';
    case 'rejected':
      return 'Rejected';
    case 'cancelled':
      return 'Cancelled';
    case 'draft':
      return 'Draft';
    case 'no_show':
      return 'No Show';
    case 'called_in_sick':
      return 'Called in Sick';
    default:
      if (!status) return 'Unknown';
      return status
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
  }
}

/** Worker/assignment status color – same as Job List */
function getWorkerStatusColor(
  status: string
): 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'accepted') return 'success';
  if (normalized === 'rejected' || normalized === 'cancelled' || normalized === 'no_show') return 'error';
  if (normalized === 'pending' || normalized === 'called_in_sick') return 'warning';
  return 'default';
}

// Mock: built from same assignments as MOCK_ACTIVE_WORKERS, grouped by job. Replace with API when backend is ready.
function buildMockJobRows(): ActiveJobRow[] {
  type Assignment = Omit<CrewMember, 'assignedRole'> & {
    assignedRole: CrewMember['assignedRole'];
    jobNumber: string;
    client: string;
    clientId: string;
    location: string;
    region?: DashboardRegion;
  };
  const jobNumberToId: Record<string, string> = {
    'J-2024-081': 'a93fab03-15b6-4762-a1fb-0cb7378d9db2',
    'J-2024-082': 'b84ebc14-26c7-5873-b2gc-1dc848ae0ec3',
    'J-2024-083': 'c95fcd25-37d8-6984-c3hd-2ed959bf1fd4',
    'J-2024-084': 'd06gde36-48e9-7a95-d4ie-3fe06ac02ge5',
    'J-2024-085': 'e17hef47-59f0-8ba6-e5jf-4gf17bd13hf6',
    'J-2024-086': 'f28ifg58-6ag1-9cb7-f6kg-5hg28ce24ig7',
    'J-2024-087': 'g39jgh69-7bh2-adc8-g7lh-6ih39df35jh8',
    'J-2024-088': 'h4akhi7a-8ci3-bed9-h8mi-7ji4aeg46ki9',
  };

  const assignments: Assignment[] = [
    { id: 'a1', jobNumber: 'J-2024-081', client: 'Acme Corp', clientId: 'c1', location: '123 Main St, Vancouver', name: 'Alex Johnson', assignedRole: 'tcp', contact: '(604) 555-0101', vehicle: 'ABC 123 - Unit 1', shift: '9:00 AM – 5:00 PM', status: 'accepted', region: 'Metro Vancouver' },
    { id: 'a4', jobNumber: 'J-2024-081', client: 'Acme Corp', clientId: 'c1', location: '123 Main St, Vancouver', name: 'Taylor Martinez', assignedRole: 'field_supervisor', contact: '(604) 555-0107', vehicle: 'DEF 456 - Unit 2', shift: '9:00 AM – 5:00 PM', status: 'accepted', region: 'Metro Vancouver' },
    { id: 'a2', jobNumber: 'J-2024-082', client: 'Beta Inc', clientId: 'c2', location: '456 Oak Ave, Burnaby', name: 'Jordan Lee', assignedRole: 'lct', contact: '(604) 555-0103', vehicle: 'GHI 789 - Unit 1', shift: '7:00 AM – 3:30 PM', status: 'accepted', region: 'Metro Vancouver' },
    { id: 'a3', jobNumber: 'J-2024-083', client: 'Acme Corp', clientId: 'c1', location: '789 Pine Rd, Surrey', name: 'Casey Brown', assignedRole: 'hwy', contact: '(604) 555-0105', vehicle: 'JKL 012 - Unit 3', shift: '8:00 AM – 4:00 PM', status: 'pending', region: 'Metro Vancouver' },
    { id: 'a5', jobNumber: 'J-2024-084', client: 'Gamma Ltd', clientId: 'c3', location: '321 Elm St, Coquitlam', name: 'Sam Williams', assignedRole: 'tcp', contact: '(604) 555-0102', vehicle: 'MNO 345 - Unit 1', shift: '6:00 AM – 2:00 PM', status: 'accepted', region: 'Metro Vancouver' },
    { id: 'a6', jobNumber: 'J-2024-084', client: 'Gamma Ltd', clientId: 'c3', location: '321 Elm St, Coquitlam', name: 'Morgan Davis', assignedRole: 'lct', contact: '(604) 555-0104', vehicle: 'PQR 678 - Unit 2', shift: '6:00 AM – 2:00 PM', status: 'accepted', region: 'Metro Vancouver' },
    { id: 'a7', jobNumber: 'J-2024-085', client: 'Island Co', clientId: 'c4', location: '50 Harbor Rd, Victoria', name: 'Riley Wilson', assignedRole: 'hwy', contact: '(604) 555-0106', vehicle: 'STU 901 - Unit 1', shift: '8:00 AM – 4:00 PM', status: 'accepted', region: 'Vancouver Island' },
    { id: 'a8', jobNumber: 'J-2024-086', client: 'Coastal Ltd', clientId: 'c5', location: '200 Ocean Dr, Nanaimo', name: 'Drew Campbell', assignedRole: 'tcp', contact: '(250) 555-0201', vehicle: 'VWX 234 - Unit 2', shift: '7:30 AM – 3:30 PM', status: 'no_show', region: 'Vancouver Island' },
    { id: 'a9', jobNumber: 'J-2024-087', client: 'Interior Power Co', clientId: 'c6', location: '500 Bernard Ave, Kelowna', name: 'Quinn Moore', assignedRole: 'tcp', contact: '(250) 555-0301', vehicle: 'YZA 567 - Unit 1', shift: '7:00 AM – 3:00 PM', status: 'accepted', region: 'Interior BC' },
    { id: 'a10', jobNumber: 'J-2024-088', client: 'Valley Services', clientId: 'c7', location: '200 Victoria St, Kamloops', name: 'Pat Kelly', assignedRole: 'lct', contact: '(250) 555-0302', vehicle: 'BCD 890 - Unit 1', shift: '8:00 AM – 4:30 PM', status: 'called_in_sick', region: 'Interior BC' },
  ];

  const byJob = new Map<string, typeof assignments>();
  for (const a of assignments) {
    const list = byJob.get(a.jobNumber) ?? [];
    list.push(a);
    byJob.set(a.jobNumber, list);
  }

  const rows: ActiveJobRow[] = [];
  byJob.forEach((list, jobNumber) => {
    const first = list[0];
    const tcpCount = list.filter((c) => c.assignedRole === 'tcp').length;
    const lctCount = list.filter((c) => c.assignedRole === 'lct').length;
    const hwyCount = list.filter((c) => c.assignedRole === 'hwy').length;
    const fieldSupervisorCount = list.filter((c) => c.assignedRole === 'field_supervisor').length;
    rows.push({
      jobNumber,
      jobId: jobNumberToId[jobNumber] ?? jobNumber,
      client: first.client,
      clientId: first.clientId,
      location: first.location,
      tcpCount,
      lctCount,
      hwyCount,
      fieldSupervisorCount,
      created_by: { first_name: 'Jane', last_name: 'Smith' },
      created_at: '2024-01-15T09:00:00Z',
      updated_by: { first_name: 'John', last_name: 'Doe' },
      updated_at: '2024-01-20T14:30:00Z',
      crew: list.map((c) => ({ id: c.id, name: c.name, assignedRole: c.assignedRole, contact: c.contact, vehicle: c.vehicle, shift: c.shift, status: c.status })),
      region: first.region,
    });
  });
  return rows.sort((a, b) => a.jobNumber.localeCompare(b.jobNumber));
}

const MOCK_JOB_ROWS = buildMockJobRows();

// ----------------------------------------------------------------------

type JobDashboardActiveByJobTableProps = {
  /** Single date (used when viewing a specific day, e.g. Weekly + selected day). */
  asOf?: Dayjs;
  /** Monday of the week (used when Weekly + Full week). When provided, API returns jobs active any day that week. */
  weekStart?: Dayjs;
  region?: DashboardRegion;
  /** Optional title to show above the table (hidden if table is empty) */
  title?: string;
  /** When true, show mock data (e.g. for meeting/demo). Use ?mock=1 in URL. */
  useMockData?: boolean;
};

export function JobDashboardActiveByJobTable({ asOf, weekStart, region, title, useMockData }: JobDashboardActiveByJobTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
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

  const dateStr = asOf?.format('YYYY-MM-DD');
  const weekStartStr = weekStart?.format('YYYY-MM-DD');
  const params = new URLSearchParams();
  if (weekStartStr) params.set('weekStart', weekStartStr);
  else if (dateStr) params.set('date', dateStr);
  if (region) params.set('region', region);
  const activeByJobUrl = weekStartStr || dateStr
    ? `${endpoints.work.jobDashboard}/active-by-job?${params.toString()}`
    : null;

  const { data: apiJobs, isLoading } = useQuery({
    queryKey: ['job-dashboard-active-by-job', weekStartStr ?? dateStr, region, useMockData],
    queryFn: async () => {
      const res = await fetcher(activeByJobUrl!);
      return (res as { data: ActiveJobRow[] }).data ?? [];
    },
    enabled: !!activeByJobUrl && !useMockData,
  });

  const jobs = useMemo(() => {
    if (useMockData) {
      if (!region) return MOCK_JOB_ROWS;
      return MOCK_JOB_ROWS.filter((row) => row.region === region);
    }
    if (apiJobs) return apiJobs;
    if (!region) return MOCK_JOB_ROWS;
    return MOCK_JOB_ROWS.filter((row) => row.region === region);
  }, [useMockData, region, apiJobs]);

  const dataFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      (row) =>
        row.jobNumber.toLowerCase().includes(q) ||
        row.client.toLowerCase().includes(q) ||
        row.location.toLowerCase().includes(q) ||
        row.crew.some((c) => c.name.toLowerCase().includes(q))
    );
  }, [jobs, searchQuery]);

  const dataSorted = useMemo(() => {
    const comparator = getComparator(table.order, table.orderBy as keyof ActiveJobRow);
    return [...dataFiltered].sort(
      comparator as unknown as (a: ActiveJobRow, b: ActiveJobRow) => number
    );
  }, [dataFiltered, table.order, table.orderBy]);

  const dataInPage = useMemo(
    () => rowInPage(dataSorted, table.page, table.rowsPerPage),
    [dataSorted, table.page, table.rowsPerPage]
  );

  const totalCount = dataSorted.length;
  const notFound = !dataFiltered.length;

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

  // Hide table if not loading and no data (after all hooks)
  if (!isLoading && jobs.length === 0) {
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
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Job #, Client, Location, or crew name..."
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ width: '100%' }}
        />
      </Box>

      <Box sx={{ position: 'relative' }}>
        <Scrollbar>
          <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 1200 }}>
            <TableHeadCustom
              order={table.order}
              orderBy={table.orderBy}
              headCells={TABLE_HEAD}
              rowCount={totalCount}
              onSort={handleSort}
            />
            <TableBody>
              {isLoading ? (
                // Skeleton loading rows
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell sx={{ minWidth: 120 }}>
                      <Skeleton variant="text" width="70%" />
                    </TableCell>
                    <TableCell sx={{ minWidth: 160 }}>
                      <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
                        <Skeleton variant="circular" width={32} height={32} />
                        <Skeleton variant="text" width="60%" />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                      <Skeleton variant="text" width="80%" />
                    </TableCell>
                    <TableCell sx={{ minWidth: 70 }}>
                      <Skeleton variant="text" width="30%" />
                    </TableCell>
                    <TableCell sx={{ minWidth: 70 }}>
                      <Skeleton variant="text" width="30%" />
                    </TableCell>
                    <TableCell sx={{ minWidth: 70 }}>
                      <Skeleton variant="text" width="30%" />
                    </TableCell>
                    <TableCell sx={{ minWidth: 70 }}>
                      <Skeleton variant="text" width="30%" />
                    </TableCell>
                    <TableCell sx={{ minWidth: 150 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Skeleton variant="circular" width={32} height={32} />
                        <Box sx={{ flex: 1 }}>
                          <Skeleton variant="text" width="70%" />
                          <Skeleton variant="text" width="50%" height={12} />
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ minWidth: 150 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Skeleton variant="circular" width={32} height={32} />
                        <Box sx={{ flex: 1 }}>
                          <Skeleton variant="text" width="70%" />
                          <Skeleton variant="text" width="50%" height={12} />
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ width: 48 }}>
                      <Skeleton variant="circular" width={24} height={24} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                dataInPage.map((row) => {
                const isExpanded = expandedRows.has(row.jobNumber);
                const hasCrew = row.crew.length > 0;
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
                      <TableCell sx={{ minWidth: 200 }}>{row.location}</TableCell>
                      <TableCell sx={{ minWidth: 70 }}>{row.tcpCount}</TableCell>
                      <TableCell sx={{ minWidth: 70 }}>{row.lctCount}</TableCell>
                      <TableCell sx={{ minWidth: 70 }}>{row.hwyCount}</TableCell>
                      <TableCell sx={{ minWidth: 70 }}>{row.fieldSupervisorCount}</TableCell>
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
                      <TableCell sx={{ minWidth: 150 }}>
                        {row.updated_by ? (
                          <ListItemText
                            primary={
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Avatar
                                  src={row.updated_by.photo_url ?? undefined}
                                  alt={`${row.updated_by.first_name} ${row.updated_by.last_name}`}
                                  sx={{ width: 32, height: 32 }}
                                >
                                  {row.updated_by.first_name?.charAt(0)?.toUpperCase()}
                                </Avatar>
                                <Typography variant="body2" noWrap>
                                  {`${row.updated_by.first_name} ${row.updated_by.last_name}`}
                                </Typography>
                              </Stack>
                            }
                            secondary={row.updated_at ? `${fDate(row.updated_at)} ${fTime(row.updated_at)}` : undefined}
                            slotProps={{
                              primary: { sx: { typography: 'body2' } },
                              secondary: { sx: { mt: 0.5, typography: 'caption' } },
                            }}
                          />
                        ) : null}
                      </TableCell>
                      <TableCell sx={{ width: 48 }}>
                        {hasCrew ? (
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
                    {hasCrew && (
                      <TableRow>
                        <TableCell colSpan={10} sx={{ py: 0, border: 0 }}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ py: 2, px: 1 }}>
                              <Table size="small" sx={{ width: '100%' }}>
                                <TableBody>
                                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                                    <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Assigned Role</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Vehicle</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Shift</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                  </TableRow>
                                  {row.crew.map((member) => (
                                    <TableRow key={`${row.jobNumber}-${member.id}`}>
                                      <TableCell>
                                        <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
                                          <Avatar alt={member.name} sx={{ width: 32, height: 32 }}>
                                            {getAvatarLetter(member.name)}
                                          </Avatar>
                                          <Link
                                            href={paths.management.user.edit(member.id)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            underline="hover"
                                            sx={{ typography: 'body2', fontWeight: 500, color: 'text.primary' }}
                                          >
                                            {member.name}
                                          </Link>
                                        </Box>
                                      </TableCell>
                                      <TableCell>
                                        {(() => {
                                          const { label, color } = getRoleDisplayInfo(member.assignedRole);
                                          return (
                                            <Label variant="soft" color={color}>
                                              {label}
                                            </Label>
                                          );
                                        })()}
                                      </TableCell>
                                      <TableCell>
                                        <Link
                                          href={`tel:${member.contact.replace(/\D/g, '')}`}
                                          color="primary"
                                          underline="hover"
                                          sx={{ typography: 'body2' }}
                                        >
                                          {formatPhoneNumberSimple(member.contact) || member.contact}
                                        </Link>
                                      </TableCell>
                                      <TableCell>{member.vehicle}</TableCell>
                                      <TableCell>{member.shift}</TableCell>
                                      <TableCell>
                                        <Label variant="soft" color={getWorkerStatusColor(member.status)}>
                                          {getWorkerStatusLabel(member.status)}
                                        </Label>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
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
