import type { SelectChangeEvent } from '@mui/material/Select';

import dayjs from 'dayjs';
import { memo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { Iconify } from 'src/components/iconify/iconify';

//-----------------------------------------------------------------
type Props = {
  filters: any;
  onResetPage: VoidFunction;
  options: {
    types: any[];
  };
  dateError?: boolean;
};

function AdminIncidentReportTableToolbarView({ filters, onResetPage, options, dateError }: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;
  const [showFilters, setShowFilters] = useState(false);
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

  const handleFilterType = useCallback(
    (event: SelectChangeEvent<string[]>) => {
      const newValue =
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;

      onResetPage();
      updateFilters({ type: newValue });
    },
    [onResetPage, updateFilters]
  );

  const handleFilters = useCallback(
    (name: string, value: any) => {
      onResetPage();

      if (name === 'startDate' && value) {
        const normalizedStart = value.startOf('day');
        const end = currentFilters.endDate ? dayjs(currentFilters.endDate).startOf('day') : null;
        const shouldUpdateEnd = !end || normalizedStart.isAfter(end);
        updateFilters({
          startDate: normalizedStart,
          ...(shouldUpdateEnd ? { endDate: value.endOf('day') } : {}),
        });
      } else if (name === 'startDate' && !value) {
        updateFilters({ startDate: null, endDate: null });
      } else if (name === 'endDate' && value) {
        updateFilters({ endDate: value.endOf('day') });
      } else {
        updateFilters({ [name]: value });
      }
    },
    [onResetPage, updateFilters, currentFilters.endDate]
  );

  return (
    <Box>
      {/* Mobile */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <TextField
          fullWidth
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search..."
          size="small"
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

        <Box
          sx={{
            ml: 1,
            minWidth: 'auto',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Iconify icon="solar:settings-bold" />
        </Box>
      </Box>

      {/* Desktop */}
      <Box
        sx={{
          p: 2.5,
          gap: 2,
          display: { xs: 'none', md: 'flex' },
          pr: { xs: 2.5, md: 1 },
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-end', md: 'center' },
        }}
      >
        <FormControl sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 300 } }}>
          <InputLabel htmlFor="filter-type-select">Type</InputLabel>
          <Select
            multiple
            value={currentFilters.type}
            onChange={handleFilterType}
            input={<OutlinedInput label="Type" />}
            renderValue={(selected) =>
              selected
                .map((value) => options.types.find((type) => type.value === value)?.label || value)
                .join(', ')
            }
            inputProps={{ id: 'filter-type-select' }}
            MenuProps={{ PaperProps: { sx: { maxHeight: 240 } } }}
          >
            {options.types.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Checkbox
                  disableRipple
                  size="small"
                  checked={currentFilters.type.includes(option.value)}
                />
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <DatePicker
          label="Date From"
          value={currentFilters.startDate}
          onChange={(newValue) => handleFilters('startDate', newValue)}
          slotProps={{ textField: { fullWidth: true } }}
          sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 180 } }}
        />

        <DatePicker
          label="Date To"
          value={currentFilters.endDate}
          onChange={(newValue) => handleFilters('endDate', newValue)}
          slotProps={{
            textField: {
              fullWidth: true,
              error: dateError,
              helperText: dateError ? 'End date must be later than start date' : null,
            },
          }}
          sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 180 } }}
        />

        <Box
          sx={{
            gap: 2,
            width: 1,
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <TextField
            fullWidth
            value={currentFilters.query}
            onChange={(event) => handleFilters('query', event.target.value)}
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
            sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%' } }}
          />
        </Box>
      </Box>

      {/* Mobile Collapsible Filters */}
      <Collapse in={showFilters}>
        <Box
          sx={{
            p: 2,
            gap: 2,
            display: { xs: 'flex', md: 'none' },
            flexDirection: 'column',
          }}
        >
          <FormControl sx={{ width: 1 }}>
            <InputLabel htmlFor="filter-type-select-mobile">Type</InputLabel>
            <Select
              multiple
              value={currentFilters.type}
              onChange={handleFilterType}
              input={<OutlinedInput label="Type" />}
              renderValue={(selected) =>
                selected
                  .map(
                    (value) => options.types.find((type) => type.value === value)?.label || value
                  )
                  .join(', ')
              }
              inputProps={{ id: 'filter-type-select-mobile' }}
              MenuProps={{ PaperProps: { sx: { maxHeight: 240 } } }}
            >
              {options.types.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Checkbox
                    disableRipple
                    size="small"
                    checked={currentFilters.type.includes(option.value)}
                  />
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <DatePicker
            label="Date From"
            value={currentFilters.startDate}
            onChange={(newValue) => handleFilters('startDate', newValue)}
            slotProps={{ textField: { fullWidth: true } }}
            sx={{ width: 1 }}
          />

          <DatePicker
            label="Date To"
            value={currentFilters.endDate}
            onChange={(newValue) => handleFilters('endDate', newValue)}
            slotProps={{
              textField: {
                fullWidth: true,
                error: dateError,
                helperText: dateError ? 'Date to must be later than start date' : null,
              },
            }}
            sx={{ width: 1 }}
          />
        </Box>
      </Collapse>
    </Box>
  );
}

export const AdminIncidentReportTableToolbar = memo(AdminIncidentReportTableToolbarView);
