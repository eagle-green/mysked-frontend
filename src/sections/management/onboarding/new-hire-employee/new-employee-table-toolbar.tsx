import type { IDatePickerControl } from 'src/types/common';
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
import { formHelperTextClasses } from '@mui/material/FormHelperText';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type RoleOption = { value: string; label: string };

type Props = {
  filters: any;
  onResetPage: VoidFunction;
  options: {
    positions: RoleOption[];
  };
  dateError?: boolean;
};

function NewEmployeeTableToolbarComponent({ filters, onResetPage, options, dateError }: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState<string>(currentFilters.query || '');

  useEffect(() => {
    setQuery(currentFilters.query || '');
  }, [currentFilters.query]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query !== currentFilters.query) {
        onResetPage();
        updateFilters({ query });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, currentFilters.query, updateFilters, onResetPage]);

  const handleFilters = useCallback(
    (name: string, value: any) => {
      onResetPage();
      updateFilters({ [name]: value });
    },
    [onResetPage, updateFilters]
  );

  const handleFilterPosition = useCallback(
    (event: SelectChangeEvent<string[]>) => {
      const newValue =
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;

      onResetPage();
      updateFilters({ position: newValue });
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
    <Box>
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
          placeholder="Search email or position..."
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
        <FormControl sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 200 } }}>
          <InputLabel htmlFor="filter-position-select">Position</InputLabel>
          <Select
            multiple
            value={currentFilters.position}
            onChange={handleFilterPosition}
            input={<OutlinedInput label="Position" />}
            renderValue={(selected) =>
              selected
                .map(
                  (value) =>
                    options.positions.find((p) => p.value === value)?.label || value
                )
                .join(', ')
            }
            inputProps={{ id: 'filter-position-select' }}
            MenuProps={{ PaperProps: { sx: { maxHeight: 240 } } }}
          >
            {options.positions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Checkbox
                  disableRipple
                  size="small"
                  checked={currentFilters.position.includes(option.value)}
                />
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <DatePicker
          label="Start date"
          value={currentFilters.startDate}
          onChange={handleFilterStartDate}
          slotProps={{ textField: { fullWidth: true } }}
          sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 180 } }}
        />

        <DatePicker
          label="End date"
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
          sx={{
            width: { xs: 1, md: '100%' },
            maxWidth: { xs: '100%', md: 180 },
            [`& .${formHelperTextClasses.root}`]: {
              bottom: { md: -40 },
              position: { md: 'absolute' },
            },
          }}
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
            placeholder="Search email or position..."
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
            <InputLabel htmlFor="filter-position-select-mobile">Position</InputLabel>
            <Select
              multiple
              value={currentFilters.position}
              onChange={handleFilterPosition}
              input={<OutlinedInput label="Position" />}
              renderValue={(selected) =>
                selected
                  .map(
                    (value) =>
                      options.positions.find((p) => p.value === value)?.label || value
                  )
                  .join(', ')
              }
              inputProps={{ id: 'filter-position-select-mobile' }}
              MenuProps={{ PaperProps: { sx: { maxHeight: 240 } } }}
            >
              {options.positions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Checkbox
                    disableRipple
                    size="small"
                    checked={currentFilters.position.includes(option.value)}
                  />
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <DatePicker
            label="Start date"
            value={currentFilters.startDate}
            onChange={handleFilterStartDate}
            slotProps={{ textField: { fullWidth: true } }}
            sx={{ width: 1 }}
          />

          <DatePicker
            label="End date"
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
            sx={{ width: 1 }}
          />
        </Box>
      </Collapse>
    </Box>
  );
}

export const NewEmployeeTableToolbar = memo(NewEmployeeTableToolbarComponent);
