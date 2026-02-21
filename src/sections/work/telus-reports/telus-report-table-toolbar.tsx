import type { IDatePickerControl } from 'src/types/common';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { UseSetStateReturn } from 'minimal-shared/hooks';

import dayjs from 'dayjs';
import { memo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { Iconify } from 'src/components/iconify';

import type { ITelusReportFilters } from './types';

// ----------------------------------------------------------------------

type Props = {
  filters: UseSetStateReturn<ITelusReportFilters>;
  dateError?: boolean;
  onResetPage: () => void;
};

const REPORT_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

function TelusReportTableToolbarComponent({ filters, dateError, onResetPage }: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;
  const [query, setQuery] = useState<string>(currentFilters.query || '');

  // Sync local query with filters when filters change externally (e.g., reset)
  useEffect(() => {
    setQuery(currentFilters.query || '');
  }, [currentFilters.query]);

  // Debounce parent filter updates to prevent re-renders on every keystroke
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query !== currentFilters.query) {
        onResetPage();
        updateFilters({ query });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [query, currentFilters.query, updateFilters, onResetPage]);

  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setQuery(newValue); // Update local state immediately
      // Parent update is debounced via useEffect above
    },
    []
  );

  const handleFilterType = useCallback(
    (event: SelectChangeEvent<string>) => {
      onResetPage();
      updateFilters({ reportType: event.target.value });
    },
    [onResetPage, updateFilters]
  );

  const handleFilterStartDate = useCallback(
    (newValue: IDatePickerControl) => {
      onResetPage();
      if (!newValue) {
        updateFilters({ startDate: null, endDate: null });
        return;
      }
      const normalizedStart = newValue.startOf('day');
      const end = currentFilters.endDate ? dayjs(currentFilters.endDate).startOf('day') : null;
      const shouldUpdateEnd = !end || normalizedStart.isAfter(end);
      updateFilters({
        startDate: normalizedStart,
        ...(shouldUpdateEnd ? { endDate: newValue.endOf('day') } : {}),
      });
    },
    [onResetPage, updateFilters, currentFilters.endDate]
  );

  const handleFilterEndDate = useCallback(
    (newValue: IDatePickerControl) => {
      onResetPage();
      updateFilters({ endDate: newValue ? newValue.endOf('day') : null });
    },
    [onResetPage, updateFilters]
  );

  return (
    <Box
      gap={2}
      display="flex"
      flexWrap="wrap"
      sx={{ p: 2.5 }}
    >
      <FormControl sx={{ width: { xs: 1, sm: 120 } }}>
        <InputLabel>Type</InputLabel>
        <Select
          label="Type"
          value={currentFilters.reportType || 'all'}
          onChange={handleFilterType}
        >
          {REPORT_TYPE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <DatePicker
        label="Start Date"
        value={currentFilters.startDate}
        onChange={handleFilterStartDate}
        slotProps={{ textField: { fullWidth: true } }}
        sx={{ width: { xs: 1, sm: 150 } }}
      />

      <DatePicker
        label="End Date"
        value={currentFilters.endDate}
        onChange={handleFilterEndDate}
        minDate={currentFilters.startDate || undefined}
        slotProps={{
          textField: {
            fullWidth: true,
            error: dateError,
            helperText: dateError ? 'End date must be later than start date' : null,
          },
        }}
        sx={{ width: { xs: 1, sm: 150 } }}
      />

      <Box sx={{ flex: 1, minWidth: { xs: 1, sm: 200 } }}>
        <TextField
          fullWidth
          value={query}
          onChange={handleFilterName}
          placeholder="Search by ReportID, Admin Name..."
          slotProps={{
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
    </Box>
  );
}

export const TelusReportTableToolbar = memo(TelusReportTableToolbarComponent);
