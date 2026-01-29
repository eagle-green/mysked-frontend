import type { Dayjs } from 'dayjs';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { TableHeadCellProps } from 'src/components/table';

import { useState, useMemo, useCallback, useEffect, Fragment } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TableHead from '@mui/material/TableHead';
import Avatar from '@mui/material/Avatar';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';

import { varAlpha } from 'minimal-shared/utils';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { paths } from 'src/routes/paths';
import { getPositionColor } from 'src/utils/format-role';
import {
  useTable,
  rowInPage,
  emptyRows,
  TableNoData,
  getComparator,
  TableHeadCustom,
  TableEmptyRows,
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

const getRoleTabColor = (
  value: RoleTabValue
): 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' =>
  value === 'all' ? 'default' : getPositionColor(value === 'fs' ? 'field_supervisor' : value);

const TABLE_HEAD_WEEKLY_ACTIVE: TableHeadCellProps[] = [
  { id: 'name', label: 'Name', width: 200 },
  { id: 'role', label: 'Role', width: 100 },
  { id: 'phone', label: 'Phone number', width: 140 },
  { id: 'address', label: 'Address' },
  { id: 'totalShifts', label: 'Total Shifts', width: 100 },
  { id: 'totalHrs', label: 'Total Hrs', width: 90 },
  { id: 'expand', label: '', width: 48 },
];

/** Active view when a specific day is selected: flat job rows like main dashboard Active table */
const TABLE_HEAD_WEEKLY_ACTIVE_SINGLE_DAY: TableHeadCellProps[] = [
  { id: 'name', label: 'Name', width: 200 },
  { id: 'role', label: 'Role', width: 100 },
  { id: 'jobNumber', label: 'Job #', width: 100 },
  { id: 'assignedRole', label: 'Assigned Role', width: 120 },
  { id: 'client', label: 'Client', width: 160 },
  { id: 'location', label: 'Location', width: 180 },
  { id: 'shift', label: 'Shift', width: 200 },
  { id: 'hrs', label: 'Hrs', width: 70 },
];

const WEEKLY_DAY_HEADERS: TableHeadCellProps[] = [
  { id: 'mon', label: 'M', width: 40, align: 'center' },
  { id: 'tue', label: 'T', width: 40, align: 'center' },
  { id: 'wed', label: 'W', width: 40, align: 'center' },
  { id: 'thu', label: 'T', width: 40, align: 'center' },
  { id: 'fri', label: 'F', width: 40, align: 'center' },
  { id: 'sat', label: 'S', width: 40, align: 'center' },
  { id: 'sun', label: 'S', width: 40, align: 'center' },
];

const TABLE_HEAD_WEEKLY_AVAILABLE: TableHeadCellProps[] = [
  { id: 'name', label: 'Name', width: 200 },
  { id: 'role', label: 'Role', width: 100 },
  { id: 'phone', label: 'Phone number', width: 140 },
  { id: 'email', label: 'Email', width: 220 },
  { id: 'address', label: 'Address' },
  ...WEEKLY_DAY_HEADERS,
];

/** Available view when a single day is selected: no M–S columns */
const TABLE_HEAD_WEEKLY_AVAILABLE_SINGLE_DAY: TableHeadCellProps[] = [
  { id: 'name', label: 'Name', width: 200 },
  { id: 'role', label: 'Role', width: 100 },
  { id: 'phone', label: 'Phone number', width: 140 },
  { id: 'email', label: 'Email', width: 220 },
  { id: 'address', label: 'Address' },
];

type WeeklyJob = {
  jobNumber: string;
  assignedRole: string;
  client: string;
  clientId: string;
  location: string;
  shift: string;
  hrs: number;
};

type WeeklyRegion = 'Metro Vancouver' | 'Vancouver Island' | 'Interior BC';

type WeeklyEmployee = {
  id: string;
  name: string;
  role: 'tcp' | 'lct' | 'hwy' | 'field_supervisor';
  phone: string;
  address: string;
  totalHrs: number;
  jobs: WeeklyJob[];
  region?: WeeklyRegion;
  photo_url?: string;
};

const roleLabel: Record<WeeklyEmployee['role'], string> = {
  tcp: 'TCP',
  lct: 'LCT',
  hwy: 'HWY',
  field_supervisor: 'Field Supervisor',
};

const ASSIGNED_ROLE_TO_KEY: Record<string, WeeklyEmployee['role']> = {
  TCP: 'tcp',
  LCT: 'lct',
  HWY: 'hwy',
  FS: 'field_supervisor',
  'Field Supervisor': 'field_supervisor',
};

function getAssignedRoleColor(
  assignedRole: string
): 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' {
  const key = ASSIGNED_ROLE_TO_KEY[assignedRole];
  return key ? getPositionColor(key) : 'default';
}

/** Display label for assigned role in expanded job row */
function getAssignedRoleLabel(assignedRole: string): string {
  return assignedRole === 'FS' ? 'Field Supervisor' : assignedRole;
}

/** Extract time range from shift string e.g. "Mon–Wed 8:00 AM – 4:00 PM" → "8:00 AM – 4:00 PM" */
function formatShiftTimeOnly(shift: string): string {
  const m = shift.match(/\d{1,2}:\d{2}\s*[AP]M\s*[–-]\s*\d{1,2}:\d{2}\s*[AP]M/i);
  return m ? m[0] : shift;
}

/** One row per job when Active + specific day selected (flat table like main dashboard Active) */
type FlattenedActiveJobRow = {
  workerId: string;
  name: string;
  role: WeeklyEmployee['role'];
  photo_url?: string;
  jobNumber: string;
  assignedRole: string;
  client: string;
  clientId: string;
  location: string;
  shift: string;
  hrs: number;
};

// Mock data – replace with API when backend is ready (scope by weekStart)
const MOCK_WEEKLY_EMPLOYEES: WeeklyEmployee[] = [
  {
    id: 'w1',
    name: 'Alex Johnson',
    role: 'tcp',
    phone: '(604) 555-0101',
    address: '123 Main St, Vancouver, BC',
    totalHrs: 32,
    region: 'Metro Vancouver',
    jobs: [
      { jobNumber: 'J-2024-081', assignedRole: 'TCP', client: 'Acme Corp', clientId: 'c1', location: '123 Main St, Vancouver', shift: 'Mon–Tue 9:00 AM – 5:00 PM', hrs: 16 },
      { jobNumber: 'J-2024-084', assignedRole: 'TCP', client: 'Gamma Ltd', clientId: 'c3', location: '321 Elm St, Coquitlam', shift: 'Wed–Thu 6:00 AM – 2:00 PM', hrs: 16 },
    ],
  },
  {
    id: 'w2',
    name: 'Jordan Lee',
    role: 'lct',
    phone: '(604) 555-0103',
    address: '789 Pine Rd, Surrey, BC',
    totalHrs: 40,
    region: 'Metro Vancouver',
    jobs: [{ jobNumber: 'J-2024-082', assignedRole: 'LCT', client: 'Beta Inc', clientId: 'c2', location: '456 Oak Ave, Burnaby', shift: 'Mon–Fri 7:00 AM – 3:30 PM', hrs: 40 }],
  },
  {
    id: 'w3',
    name: 'Casey Brown',
    role: 'hwy',
    phone: '(604) 555-0105',
    address: '654 Cedar Ln, Richmond, BC',
    totalHrs: 24,
    region: 'Metro Vancouver',
    jobs: [{ jobNumber: 'J-2024-083', assignedRole: 'HWY', client: 'Acme Corp', clientId: 'c1', location: '789 Pine Rd, Surrey', shift: 'Mon–Wed 8:00 AM – 4:00 PM', hrs: 24 }],
  },
  {
    id: 'w4',
    name: 'Taylor Martinez',
    role: 'field_supervisor',
    phone: '(604) 555-0107',
    address: '147 Maple Dr, Vancouver, BC',
    totalHrs: 40,
    region: 'Metro Vancouver',
    jobs: [{ jobNumber: 'J-2024-081', assignedRole: 'FS', client: 'Acme Corp', clientId: 'c1', location: '123 Main St, Vancouver', shift: 'Mon–Fri 9:00 AM – 5:00 PM', hrs: 40 }],
  },
  {
    id: 'w5',
    name: 'Sam Williams',
    role: 'tcp',
    phone: '(604) 555-0102',
    address: '456 Oak Ave, Burnaby, BC',
    totalHrs: 16,
    region: 'Metro Vancouver',
    jobs: [{ jobNumber: 'J-2024-084', assignedRole: 'TCP', client: 'Gamma Ltd', clientId: 'c3', location: '321 Elm St, Coquitlam', shift: 'Thu–Fri 6:00 AM – 2:00 PM', hrs: 16 }],
  },
  {
    id: 'w6',
    name: 'Riley Wilson',
    role: 'hwy',
    phone: '(250) 555-0201',
    address: '100 Harbor Rd, Victoria, BC',
    totalHrs: 40,
    region: 'Vancouver Island',
    jobs: [{ jobNumber: 'J-2024-085', assignedRole: 'HWY', client: 'Island Co', clientId: 'c4', location: '50 Harbor Rd, Victoria', shift: 'Mon–Fri 8:00 AM – 4:00 PM', hrs: 40 }],
  },
  {
    id: 'w7',
    name: 'Drew Campbell',
    role: 'tcp',
    phone: '(250) 555-0202',
    address: '200 Ocean Dr, Nanaimo, BC',
    totalHrs: 24,
    region: 'Vancouver Island',
    jobs: [{ jobNumber: 'J-2024-086', assignedRole: 'TCP', client: 'Coastal Ltd', clientId: 'c5', location: '200 Ocean Dr, Nanaimo', shift: 'Mon–Wed 7:30 AM – 3:30 PM', hrs: 24 }],
  },
  {
    id: 'w8',
    name: 'Quinn Moore',
    role: 'tcp',
    phone: '(250) 555-0301',
    address: '500 Bernard Ave, Kelowna, BC',
    totalHrs: 40,
    region: 'Interior BC',
    jobs: [{ jobNumber: 'J-2024-087', assignedRole: 'TCP', client: 'Interior Power Co', clientId: 'c6', location: '500 Bernard Ave, Kelowna', shift: 'Mon–Fri 7:00 AM – 3:00 PM', hrs: 40 }],
  },
  {
    id: 'w9',
    name: 'Pat Kelly',
    role: 'lct',
    phone: '(250) 555-0302',
    address: '200 Victoria St, Kamloops, BC',
    totalHrs: 32,
    region: 'Interior BC',
    jobs: [{ jobNumber: 'J-2024-088', assignedRole: 'LCT', client: 'Valley Services', clientId: 'c7', location: '200 Victoria St, Kamloops', shift: 'Mon–Thu 8:00 AM – 4:30 PM', hrs: 32 }],
  },
];

/** 0 = Mon, 1 = Tue, ... 6 = Sun */
type WeeklyAvailableWorker = {
  id: string;
  name: string;
  role: 'tcp' | 'lct' | 'hwy' | 'field_supervisor';
  phone: string;
  email: string;
  address: string;
  /** Indices of days available this week (0=Mon … 6=Sun) */
  availableDays: number[];
  region?: WeeklyRegion;
  photo_url?: string;
};

// Mock weekly available – replace with API when backend is ready (scope by weekStart)
const MOCK_WEEKLY_AVAILABLE: WeeklyAvailableWorker[] = [
  { id: 'wa1', name: 'Alex Johnson', role: 'tcp', phone: '(604) 555-0101', email: 'alex.j@example.com', address: '123 Main St, Vancouver, BC', availableDays: [0, 1, 2, 3, 4], region: 'Metro Vancouver' },
  { id: 'wa2', name: 'Sam Williams', role: 'tcp', phone: '(604) 555-0102', email: 'sam.w@example.com', address: '456 Oak Ave, Burnaby, BC', availableDays: [2, 6], region: 'Metro Vancouver' },
  { id: 'wa3', name: 'Jordan Lee', role: 'lct', phone: '(604) 555-0103', email: 'jordan.l@example.com', address: '789 Pine Rd, Surrey, BC', availableDays: [0, 1, 2, 3, 4, 5], region: 'Metro Vancouver' },
  { id: 'wa4', name: 'Morgan Davis', role: 'lct', phone: '(604) 555-0104', email: 'morgan.d@example.com', address: '321 Elm St, Coquitlam, BC', availableDays: [0, 2, 4], region: 'Metro Vancouver' },
  { id: 'wa5', name: 'Casey Brown', role: 'hwy', phone: '(604) 555-0105', email: 'casey.b@example.com', address: '654 Cedar Ln, Richmond, BC', availableDays: [1, 3, 5], region: 'Metro Vancouver' },
  { id: 'wa6', name: 'Riley Wilson', role: 'hwy', phone: '(604) 555-0106', email: 'riley.w@example.com', address: '987 Birch Blvd, Delta, BC', availableDays: [0, 1, 2, 3, 4], region: 'Vancouver Island' },
  { id: 'wa7', name: 'Taylor Martinez', role: 'field_supervisor', phone: '(604) 555-0107', email: 'taylor.m@example.com', address: '147 Maple Dr, Vancouver, BC', availableDays: [0, 1, 2, 3, 4, 5, 6], region: 'Metro Vancouver' },
  { id: 'wa8', name: 'Jamie Anderson', role: 'field_supervisor', phone: '(604) 555-0108', email: 'jamie.a@example.com', address: '258 Spruce Way, New Westminster, BC', availableDays: [3, 4, 5, 6], region: 'Vancouver Island' },
  { id: 'wa9', name: 'Drew Campbell', role: 'tcp', phone: '(250) 555-0201', email: 'drew.c@example.com', address: '100 Harbor Rd, Victoria, BC', availableDays: [0, 1, 2, 3, 4], region: 'Vancouver Island' },
  { id: 'wa10', name: 'Sam Taylor', role: 'lct', phone: '(250) 555-0202', email: 'sam.t@example.com', address: '200 Ocean Dr, Nanaimo, BC', availableDays: [1, 2, 3, 4, 5], region: 'Vancouver Island' },
  { id: 'wa11', name: 'Quinn Moore', role: 'tcp', phone: '(250) 555-0301', email: 'quinn.m@example.com', address: '500 Bernard Ave, Kelowna, BC', availableDays: [0, 1, 2, 3, 4], region: 'Interior BC' },
  { id: 'wa12', name: 'Pat Kelly', role: 'lct', phone: '(250) 555-0302', email: 'pat.k@example.com', address: '200 Victoria St, Kamloops, BC', availableDays: [1, 2, 3, 4, 5], region: 'Interior BC' },
  { id: 'wa13', name: 'Robin Chen', role: 'hwy', phone: '(250) 555-0303', email: 'robin.c@example.com', address: '100 Seymour St, Vernon, BC', availableDays: [0, 2, 4], region: 'Interior BC' },
];

const roleMap: Record<RoleTabValue, WeeklyEmployee['role'] | undefined> = {
  all: undefined,
  tcp: 'tcp',
  lct: 'lct',
  hwy: 'hwy',
  fs: 'field_supervisor',
};

function getAvatarLetter(name: string): string {
  const firstWord = name.trim().split(/\s+/)[0];
  return firstWord?.charAt(0).toUpperCase() || name.charAt(0).toUpperCase() || '?';
}

// ----------------------------------------------------------------------

type WeeklyTableMode = 'available' | 'active';

/** null = full week; 0 = Mon, 1 = Tue, ... 6 = Sun */
export type WeeklySelectedDay = number | null;

type JobDashboardWeeklyTableProps = {
  /** Monday of the week (Mon–Sun) */
  weekStart: Dayjs;
  /** 'available' = crew available that week; 'active' = crew on jobs with expandable job list */
  mode?: WeeklyTableMode;
  /** Called when user switches between Available and Active (updates summary cards in parent) */
  onModeChange?: (mode: WeeklyTableMode) => void;
  /** Selected day within the week: null = full week, 0 = Mon ... 6 = Sun. Optional controlled value. */
  selectedDay?: WeeklySelectedDay;
  /** Called when user selects a different day (parent can refetch by date) */
  onDayChange?: (day: WeeklySelectedDay) => void;
  /** When set, only workers in this region are shown (Metro Vancouver / Vancouver Island / Interior BC) */
  region?: WeeklyRegion;
  /** When true, hide the View (Available|Active) and Day dropdown; use shared toolbar above both tables */
  hideViewDayToolbar?: boolean;
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const DAY_COLUMN_IDS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

type ActiveViewMode = 'by_employee' | 'by_job';

/** Shared toolbar: Crew (Available|Active), Group by (By Employee|By Job when Active), Day dropdown */
export function JobDashboardWeeklyViewDayToolbar({
  weekStart,
  mode,
  onModeChange,
  activeViewMode,
  onActiveViewModeChange,
  selectedDay,
  onDayChange,
}: {
  weekStart: Dayjs;
  mode: WeeklyTableMode;
  onModeChange?: (mode: WeeklyTableMode) => void;
  activeViewMode?: ActiveViewMode;
  onActiveViewModeChange?: (v: ActiveViewMode) => void;
  selectedDay: WeeklySelectedDay;
  onDayChange?: (day: WeeklySelectedDay) => void;
}) {
  const dayOptions = useMemo(() => {
    const base = weekStart.startOf('day');
    return [
      { value: 'full' as const, label: 'Full week' },
      ...DAY_LABELS.map((label, i) => ({
        value: i as number,
        label: `${label} ${base.add(i, 'day').format('MMM D')}`,
      })),
    ];
  }, [weekStart]);

  const handleDayChange = useCallback(
    (event: SelectChangeEvent<number | 'full'>) => {
      const v = event.target.value;
      onDayChange?.(v === 'full' ? null : (v as number));
    },
    [onDayChange]
  );

  const handleCrewChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, value: WeeklyTableMode | null) => {
      if (value !== null && onModeChange) onModeChange(value);
    },
    [onModeChange]
  );

  const handleGroupByChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, value: ActiveViewMode | null) => {
      if (value !== null && onActiveViewModeChange) onActiveViewModeChange(value);
    },
    [onActiveViewModeChange]
  );

  const toggleButtonSx = {
    '& .MuiToggleButtonGroup-grouped': { px: 1.5, py: 0.5 },
    '& .MuiToggleButtonGroup-grouped.Mui-selected': {
      backgroundColor: 'primary.main',
      color: 'primary.contrastText',
      '&:hover': {
        backgroundColor: 'primary.dark',
        color: 'primary.contrastText',
      },
    },
  };

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      divider={
        <Divider
          orientation="vertical"
          flexItem
          sx={{ borderColor: 'divider', display: { xs: 'none', sm: 'block' } }}
        />
      }
      spacing={2.5}
      sx={{
        px: 2.5,
        py: 2,
        borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', flexShrink: 0 }}>
          Crew
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={mode}
          onChange={handleCrewChange}
          aria-label="Crew: available or active"
          sx={toggleButtonSx}
        >
          <ToggleButton value="available">Available</ToggleButton>
          <ToggleButton value="active">Active</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {mode === 'active' && activeViewMode != null && onActiveViewModeChange && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', flexShrink: 0 }}>
            Group by
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={activeViewMode}
            onChange={handleGroupByChange}
            aria-label="Group table by employee or job"
            sx={toggleButtonSx}
          >
            <ToggleButton value="by_employee">By Employee</ToggleButton>
            <ToggleButton value="by_job">By Job</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', flexShrink: 0 }}>
          Day
        </Typography>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="weekly-day-label">Day</InputLabel>
          <Select
            labelId="weekly-day-label"
            value={selectedDay === null ? 'full' : selectedDay}
            onChange={handleDayChange}
            label="Day"
          >
            {dayOptions.map((opt) => (
              <MenuItem key={String(opt.value)} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Stack>
  );
}

export function JobDashboardWeeklyTable({
  weekStart,
  mode = 'active',
  onModeChange,
  selectedDay: controlledDay,
  onDayChange,
  region,
  hideViewDayToolbar = false,
}: JobDashboardWeeklyTableProps) {
  const [currentTab, setCurrentTab] = useState<RoleTabValue>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [internalDay, setInternalDay] = useState<WeeklySelectedDay>(null);

  const selectedDay = controlledDay !== undefined ? controlledDay : internalDay;
  const setSelectedDay = useCallback(
    (day: WeeklySelectedDay) => {
      if (controlledDay === undefined) setInternalDay(day);
      onDayChange?.(day);
    },
    [controlledDay, onDayChange]
  );

  const table = useTable({
    defaultDense: true,
    defaultOrderBy: 'name',
    defaultOrder: 'asc',
    defaultRowsPerPage: 10,
    defaultCurrentPage: 0,
  });

  const workers = useMemo(() => {
    const list = mode === 'active' ? MOCK_WEEKLY_EMPLOYEES : MOCK_WEEKLY_AVAILABLE;
    if (!region) return list;
    return list.filter((w) => (w as WeeklyEmployee & WeeklyAvailableWorker).region === region);
  }, [mode, region]);

  const isActiveSingleDay = mode === 'active' && selectedDay !== null;

  const activeFlattenedRows = useMemo((): FlattenedActiveJobRow[] => {
    if (!isActiveSingleDay) return [];
    return (workers as WeeklyEmployee[]).flatMap((w) =>
      w.jobs.map((j) => ({
        workerId: w.id,
        name: w.name,
        role: w.role,
        photo_url: w.photo_url,
        jobNumber: j.jobNumber,
        assignedRole: j.assignedRole,
        client: j.client,
        clientId: j.clientId,
        location: j.location,
        shift: j.shift,
        hrs: j.hrs,
      }))
    );
  }, [workers, isActiveSingleDay]);

  const filteredByRole = useMemo(() => {
    if (currentTab === 'all') return workers;
    const role = roleMap[currentTab];
    return role ? workers.filter((w) => w.role === role) : workers;
  }, [workers, currentTab]);

  const dataFiltered = useMemo(() => {
    if (isActiveSingleDay) {
      const byRole =
        currentTab === 'all'
          ? activeFlattenedRows
          : activeFlattenedRows.filter((r) => roleMap[currentTab] === r.role);
      const q = searchQuery.trim().toLowerCase();
      if (!q) return byRole;
      return byRole.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.jobNumber.toLowerCase().includes(q) ||
          r.client.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q)
      );
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredByRole;
    if (mode === 'active') {
      return (filteredByRole as WeeklyEmployee[]).filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
          w.address.toLowerCase().includes(q)
      );
    }
    return (filteredByRole as WeeklyAvailableWorker[]).filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.email.toLowerCase().includes(q) ||
        w.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
        w.address.toLowerCase().includes(q)
    );
  }, [
    isActiveSingleDay,
    activeFlattenedRows,
    currentTab,
    searchQuery,
    filteredByRole,
    mode,
  ]);

  const dataSorted = useMemo(() => {
    const key = table.orderBy as string;
    if (mode === 'active' && selectedDay === null && (key === 'jobs' || key === 'totalShifts'))
      return dataFiltered;
    if (
      mode === 'available' &&
      (key === 'totalHrs' ||
        key === 'expand' ||
        key === 'jobs' ||
        (DAY_COLUMN_IDS as readonly string[]).includes(key))
    )
      return dataFiltered;
    const comparator = getComparator(table.order, key);
    return [...dataFiltered].sort((a, b) =>
      (
        comparator as unknown as (
          a: WeeklyEmployee | WeeklyAvailableWorker | FlattenedActiveJobRow,
          b: WeeklyEmployee | WeeklyAvailableWorker | FlattenedActiveJobRow
        ) => number
      )(a, b)
    );
  }, [dataFiltered, table.order, table.orderBy, mode, selectedDay]);

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
      return role ? workers.filter((w) => w.role === role).length : 0;
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

  const toggleExpanded = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSort = useCallback(
    (id: string) => {
      if (
        id === 'expand' ||
        id === 'totalShifts' ||
        DAY_COLUMN_IDS.includes(id as (typeof DAY_COLUMN_IDS)[number])
      )
        return;
      table.onSort(id);
    },
    [table]
  );

  useEffect(() => {
    table.onResetPage();
  }, [searchQuery]);

  useEffect(() => {
    setExpandedRows(new Set());
    table.onResetPage();
  }, [mode]);

  useEffect(() => {
    table.onResetPage();
  }, [selectedDay]);

  const headCells =
    mode === 'active'
      ? selectedDay === null
        ? TABLE_HEAD_WEEKLY_ACTIVE
        : TABLE_HEAD_WEEKLY_ACTIVE_SINGLE_DAY
      : selectedDay === null
        ? TABLE_HEAD_WEEKLY_AVAILABLE
        : TABLE_HEAD_WEEKLY_AVAILABLE_SINGLE_DAY;

  const handleViewChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, value: WeeklyTableMode | null) => {
      if (value !== null && onModeChange) onModeChange(value);
    },
    [onModeChange]
  );

  const dayOptions = useMemo(() => {
    const base = weekStart.startOf('day');
    return [
      { value: 'full' as const, label: 'Full week' },
      ...DAY_LABELS.map((label, i) => ({
        value: i as number,
        label: `${label} ${base.add(i, 'day').format('MMM D')}`,
      })),
    ];
  }, [weekStart]);

  const handleDayChange = useCallback(
    (event: SelectChangeEvent<number | 'full'>) => {
      const v = event.target.value;
      setSelectedDay(v === 'full' ? null : (v as number));
    },
    [setSelectedDay]
  );

  return (
    <Card>
      {!hideViewDayToolbar && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          divider={
            <Divider
              orientation="vertical"
              flexItem
              sx={{ borderColor: 'divider', display: { xs: 'none', sm: 'block' } }}
            />
          }
          spacing={2.5}
          sx={{
            px: 2.5,
            py: 2,
            borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', flexShrink: 0, width: 36 }}>
              View
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={mode}
              onChange={handleViewChange}
              aria-label="weekly view: available or active"
              sx={{
                '& .MuiToggleButtonGroup-grouped': { px: 1.5, py: 0.5 },
                '& .MuiToggleButtonGroup-grouped.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <ToggleButton value="available" aria-label="Available">Available</ToggleButton>
              <ToggleButton value="active" aria-label="Active">Active</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', flexShrink: 0, width: 36 }}>
              Day
            </Typography>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="weekly-day-label">Day</InputLabel>
              <Select
                labelId="weekly-day-label"
                value={selectedDay === null ? 'full' : selectedDay}
                onChange={handleDayChange}
                label="Day"
              >
                {dayOptions.map((opt) => (
                  <MenuItem key={String(opt.value)} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Stack>
      )}

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
                variant={tab.value === 'all' || tab.value === currentTab ? 'filled' : 'soft'}
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
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
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
          <Table
            size={table.dense ? 'small' : 'medium'}
            sx={{
              minWidth: isActiveSingleDay ? 1130 : mode === 'active' ? 720 : selectedDay === null ? 1000 : 720,
            }}
          >
            <TableHeadCustom
              order={table.order}
              orderBy={table.orderBy}
              headCells={headCells}
              rowCount={totalCount}
              onSort={handleSort}
            />

            <TableBody>
              {mode === 'available'
                ? (dataInPage as WeeklyAvailableWorker[]).map((row) => (
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
                        <Label variant="soft" color={getPositionColor(row.role)}>
                          {roleLabel[row.role]}
                        </Label>
                      </TableCell>
                      <TableCell sx={{ minWidth: 140 }}>
                        <Link
                          href={`tel:${row.phone.replace(/\s/g, '')}`}
                          color="primary"
                          underline="hover"
                          sx={{ typography: 'body2' }}
                        >
                          {row.phone}
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
                      {selectedDay === null &&
                        [0, 1, 2, 3, 4, 5, 6].map((d) => (
                          <TableCell key={d} align="center" sx={{ width: 40, minWidth: 40 }}>
                            {row.availableDays.includes(d) ? (
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  bgcolor: 'primary.main',
                                  mx: 'auto',
                                }}
                              />
                            ) : null}
                          </TableCell>
                        ))}
                    </TableRow>
                  ))
                : isActiveSingleDay
                  ? (dataInPage as FlattenedActiveJobRow[]).map((row) => (
                      <TableRow key={`${row.workerId}-${row.jobNumber}`} hover>
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
                              href={paths.management.user.edit(row.workerId)}
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
                          <Label variant="soft" color={getPositionColor(row.role)}>
                            {roleLabel[row.role]}
                          </Label>
                        </TableCell>
                        <TableCell sx={{ minWidth: 100 }}>{row.jobNumber}</TableCell>
                        <TableCell sx={{ minWidth: 120 }}>
                          <Label
                            variant="soft"
                            color={getAssignedRoleColor(row.assignedRole)}
                          >
                            {getAssignedRoleLabel(row.assignedRole)}
                          </Label>
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
                        <TableCell sx={{ minWidth: 200 }}>
                          {formatShiftTimeOnly(row.shift)}
                        </TableCell>
                        <TableCell sx={{ minWidth: 70 }}>{row.hrs}</TableCell>
                      </TableRow>
                    ))
                  : (dataInPage as WeeklyEmployee[]).map((row) => {
                    const isExpanded = expandedRows.has(row.id);
                    const hasJobs = row.jobs.length > 0;
                    return (
                      <Fragment key={row.id}>
                        <TableRow hover>
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
                            <Label variant="soft" color={getPositionColor(row.role)}>
                              {roleLabel[row.role]}
                            </Label>
                          </TableCell>
                          <TableCell sx={{ minWidth: 140 }}>
                            <Link
                              href={`tel:${row.phone.replace(/\s/g, '')}`}
                              color="primary"
                              underline="hover"
                              sx={{ typography: 'body2' }}
                            >
                              {row.phone}
                            </Link>
                          </TableCell>
                          <TableCell>{row.address}</TableCell>
                          <TableCell sx={{ minWidth: 100 }}>{row.jobs.length}</TableCell>
                          <TableCell sx={{ minWidth: 90 }}>{row.totalHrs}</TableCell>
                          <TableCell sx={{ width: 48 }}>
                            {hasJobs ? (
                              <IconButton
                                size="small"
                                color={isExpanded ? 'inherit' : 'default'}
                                onClick={() => toggleExpanded(row.id)}
                                sx={{ ...(isExpanded && { bgcolor: 'action.hover' }) }}
                                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                              >
                                <Iconify
                                  icon={
                                    isExpanded
                                      ? 'eva:arrow-ios-upward-fill'
                                      : 'eva:arrow-ios-downward-fill'
                                  }
                                  width={20}
                                />
                              </IconButton>
                            ) : null}
                          </TableCell>
                        </TableRow>
                        {hasJobs && (
                          <TableRow>
                            <TableCell colSpan={7} sx={{ py: 0, border: 0 }}>
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <Box sx={{ py: 2, px: 1 }}>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>Job #</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>
                                          Assigned Role
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Client</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Shift</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Hrs</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {row.jobs.map((job) => (
                                        <TableRow key={`${row.id}-${job.jobNumber}`}>
                                          <TableCell>{job.jobNumber}</TableCell>
                                          <TableCell>
                                            <Label
                                              variant="soft"
                                              color={getAssignedRoleColor(job.assignedRole)}
                                            >
                                              {getAssignedRoleLabel(job.assignedRole)}
                                            </Label>
                                          </TableCell>
                                          <TableCell>
                                            <Box
                                              sx={{ gap: 1, display: 'flex', alignItems: 'center' }}
                                            >
                                              <Avatar
                                                alt={job.client}
                                                sx={{ width: 32, height: 32 }}
                                              >
                                                {getAvatarLetter(job.client)}
                                              </Avatar>
                                              <Link
                                                href={paths.management.client.edit(job.clientId)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                underline="hover"
                                                sx={{ typography: 'body2', fontWeight: 500, color: 'text.primary' }}
                                              >
                                                {job.client}
                                              </Link>
                                            </Box>
                                          </TableCell>
                                          <TableCell>{job.location}</TableCell>
                                          <TableCell>{formatShiftTimeOnly(job.shift)}</TableCell>
                                          <TableCell>{job.hrs}</TableCell>
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
                  })}

              <TableEmptyRows
                height={table.dense ? 52 : 72}
                emptyRows={emptyRows(table.page, table.rowsPerPage, dataSorted.length)}
              />

              <TableNoData notFound={notFound} />
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
  );
}
