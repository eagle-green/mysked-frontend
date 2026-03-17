import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { IAttendanceConductReportTableFilters } from 'src/types/attendance-conduct-report';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

/** Columns from Score through Unapprove Payout without Day Off for column filters */
const COLUMN_FILTER_OPTIONS: { id: string; label: string }[] = [
  { id: 'score', label: 'Score' },
  { id: 'noShowUnpaid', label: 'No Show (Unpaid)' },
  { id: 'refusalOfShifts', label: 'Refusal of shift' },
  { id: 'sentHomeNoPpe', label: 'Sent home from site (No PPE)' },
  { id: 'leftEarlyNoNotice', label: 'Left Early No Notice' },
  { id: 'lateOnSite', label: 'Late on Site' },
  { id: 'unapprovedDaysOffShortNotice', label: 'Unapproved Days Off / Short Notice' },
  { id: 'calledInSick', label: 'Called in Sick' },
  { id: 'unauthorizedDriving', label: 'Unauthorized Driving' },
  { id: 'drivingInfractions', label: 'Driving Infractions' },
  { id: 'verbalWarningsWriteUp', label: 'Verbal Warnings / Write Up' },
  { id: 'sickLeaveUnpaid', label: 'Sick Leave (Unpaid)' },
  { id: 'sickLeave5', label: 'Sick Leave (5)' },
  { id: 'vacationDayUnpaid', label: 'Vacation Day (Unpaid)' },
  { id: 'vacationDay10', label: 'Vacation Day (10)' },
  { id: 'personalDayOffUnpaid', label: 'Personal Day Off (Unpaid)' },
  { id: 'unapprovePayoutWithoutDayOff', label: 'Unapprove Payout without Day Off' },
];

type Props = {
  onResetPage: () => void;
  filters: UseSetStateReturn<IAttendanceConductReportTableFilters>;
  /** When set, open the column filter popover anchored to this element (e.g. from column header click). */
  openColumnFilterFromHeader?: HTMLElement | null;
  onColumnFilterPopoverClose?: () => void;
};

export function AttendanceConductReportTableToolbar({
  filters,
  onResetPage,
  openColumnFilterFromHeader = null,
  onColumnFilterPopoverClose,
}: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;
  const [query, setQuery] = useState<string>(currentFilters.query ?? '');
  const [columnFilterAnchor, setColumnFilterAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (openColumnFilterFromHeader) {
      setColumnFilterAnchor(openColumnFilterFromHeader);
    }
  }, [openColumnFilterFromHeader]);
  const [scoreMinInput, setScoreMinInput] = useState<string>(
    currentFilters.scoreMin != null ? String(currentFilters.scoreMin) : ''
  );
  const [scoreMaxInput, setScoreMaxInput] = useState<string>(
    currentFilters.scoreMax != null ? String(currentFilters.scoreMax) : ''
  );

  useEffect(() => {
    setQuery(currentFilters.query ?? '');
  }, [currentFilters.query]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query !== (currentFilters.query ?? '')) {
        onResetPage();
        updateFilters({ query });
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query, currentFilters.query, onResetPage, updateFilters]);

  useEffect(() => {
    setScoreMinInput(currentFilters.scoreMin != null ? String(currentFilters.scoreMin) : '');
    setScoreMaxInput(currentFilters.scoreMax != null ? String(currentFilters.scoreMax) : '');
  }, [currentFilters.scoreMin, currentFilters.scoreMax]);

  const handleOpenColumnFilters = useCallback((e: React.MouseEvent<HTMLElement>) => {
    setColumnFilterAnchor(e.currentTarget);
  }, []);
  const handleCloseColumnFilters = useCallback(() => {
    setColumnFilterAnchor(null);
    onColumnFilterPopoverClose?.();
  }, [onColumnFilterPopoverClose]);
  const handleApplyColumnFilters = useCallback(() => {
    onResetPage();
    const min = scoreMinInput.trim() === '' ? undefined : parseInt(scoreMinInput, 10);
    const max = scoreMaxInput.trim() === '' ? undefined : parseInt(scoreMaxInput, 10);
    updateFilters({
      scoreMin: scoreMinInput.trim() === '' ? undefined : Number.isNaN(min) ? undefined : min,
      scoreMax: scoreMaxInput.trim() === '' ? undefined : Number.isNaN(max) ? undefined : max,
    });
    handleCloseColumnFilters();
  }, [scoreMinInput, scoreMaxInput, onResetPage, updateFilters, handleCloseColumnFilters]);
  const handleColumnAtLeastOneToggle = useCallback(
    (columnId: string, checked: boolean) => {
      onResetPage();
      const current = currentFilters.columnAtLeastOne ?? [];
      const next = checked
        ? [...current, columnId]
        : current.filter((c) => c !== columnId);
      updateFilters({ columnAtLeastOne: next });
    },
    [currentFilters.columnAtLeastOne, onResetPage, updateFilters]
  );
  const hasColumnFilters =
    currentFilters.scoreMin != null ||
    currentFilters.scoreMax != null ||
    (currentFilters.columnAtLeastOne?.length ?? 0) > 0;

  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
  const { data: usersList } = useQuery({
    queryKey: ['users-all-attendance-conduct-report'],
    queryFn: async () => {
      const response = await fetcher(
        `${endpoints.management.user}?page=1&rowsPerPage=500&orderBy=first_name&order=asc`
      );
      const data = response?.data ?? response;
      const users = data?.users ?? (Array.isArray(data) ? data : []);
      return Array.isArray(users) ? users : [];
    },
    enabled: employeeDropdownOpen,
  });

  const employeeOptions = useMemo(() => {
    if (!usersList || !Array.isArray(usersList)) return [];
    return (usersList as any[]).map((u: any) => ({
      id: u.id,
      name: [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.email || u.id,
    }));
  }, [usersList]);

  return (
    <Box
      sx={{
        p: 2.5,
        gap: 2,
        display: 'flex',
        pr: { xs: 2.5, md: 1 },
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'flex-end', md: 'center' },
      }}
    >
      <Autocomplete
        multiple
        open={employeeDropdownOpen}
        onOpen={() => setEmployeeDropdownOpen(true)}
        onClose={() => setEmployeeDropdownOpen(false)}
        options={employeeOptions}
        value={currentFilters.employee ?? []}
        onChange={(event, newValue) => {
          onResetPage();
          updateFilters({ employee: newValue });
        }}
        getOptionLabel={(option) => (typeof option === 'string' ? option : option?.name ?? '')}
        isOptionEqualToValue={(option, value) => option?.id === value?.id}
        renderInput={(params) => (
          <TextField {...params} label="Employee" placeholder="Search employee..." />
        )}
        renderTags={() => []}
        renderOption={(props, option, { selected }) => {
          const otherProps = { ...(props as any) };
          delete otherProps.key;
          return (
            <Box component="li" key={option.id} {...otherProps}>
              <Checkbox disableRipple size="small" checked={selected} />
              {option.name}
            </Box>
          );
        }}
        filterOptions={(options, { inputValue }) => {
          if (!inputValue) return options;
          return options.filter((opt) =>
            (opt.name ?? '').toLowerCase().includes(inputValue.toLowerCase())
          );
        }}
        sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 300 } }}
      />

      <Box sx={{ flexGrow: 1, minWidth: { xs: 0, md: 280 } }}>
        <TextField
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
          sx={{ width: '100%', minWidth: 0 }}
        />
      </Box>

      <Button
        variant={hasColumnFilters ? 'soft' : 'outlined'}
        color={hasColumnFilters ? 'primary' : 'inherit'}
        startIcon={<Iconify icon={"eva:options-2-fill" as any} />}
        onClick={handleOpenColumnFilters}
      >
        Column filters
      </Button>
      <Popover
        open={!!columnFilterAnchor}
        anchorEl={columnFilterAnchor}
        onClose={handleCloseColumnFilters}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 360, maxHeight: 480, p: 2 } } }}
      >
        <Stack spacing={2}>
          <Typography variant="subtitle2">Score range (current page)</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              type="number"
              size="small"
              label="Min"
              value={scoreMinInput}
              onChange={(e) => setScoreMinInput(e.target.value)}
              inputProps={{ min: 0, max: 100 }}
              sx={{ width: 100 }}
            />
            <Typography variant="body2" color="text.secondary">
              –
            </Typography>
            <TextField
              type="number"
              size="small"
              label="Max"
              value={scoreMaxInput}
              onChange={(e) => setScoreMaxInput(e.target.value)}
              inputProps={{ min: 0, max: 100 }}
              sx={{ width: 100 }}
            />
          </Stack>
          <Typography variant="subtitle2" sx={{ pt: 1 }}>
            Show only rows with at least 1 in:
          </Typography>
          <Box sx={{ maxHeight: 280, overflowY: 'auto' }}>
            <Stack spacing={0.5}>
              {COLUMN_FILTER_OPTIONS.filter((opt) => opt.id !== 'score').map((opt) => (
                <FormControlLabel
                  key={opt.id}
                  control={
                    <Checkbox
                      size="small"
                      checked={(currentFilters.columnAtLeastOne ?? []).includes(opt.id)}
                      onChange={(_, checked) => handleColumnAtLeastOneToggle(opt.id, checked)}
                    />
                  }
                  label={opt.label}
                />
              ))}
            </Stack>
          </Box>
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button size="small" onClick={handleCloseColumnFilters}>
              Cancel
            </Button>
            <Button size="small" variant="contained" onClick={handleApplyColumnFilters}>
              Apply score range
            </Button>
          </Stack>
        </Stack>
      </Popover>
    </Box>
  );
}
