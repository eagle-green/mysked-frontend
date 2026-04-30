import type { SelectChangeEvent } from '@mui/material/Select';

import { memo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Autocomplete from '@mui/material/Autocomplete';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: any;
  onResetPage: VoidFunction;
  options: {
    drivers: any[];
    vehicles: any[];
  };
  dateError?: boolean;
};

function AdminPreTripTableToolbarComponent({ filters, onResetPage, options, dateError }: Props) {
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

  const handleFilters = useCallback(
    (name: string, value: any) => {
      onResetPage();
      updateFilters({ [name]: value });
    },
    [onResetPage, updateFilters]
  );

  const handleFilterType = useCallback(
    (event: SelectChangeEvent<string[]>) => {
      const newValue =
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;
      console.log(newValue);
      onResetPage();
      updateFilters({ drivers: newValue });
    },
    [onResetPage, updateFilters]
  );

  const handleFilterVehicle = useCallback(
    (event: SelectChangeEvent<string[]>) => {
      const newValue =
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;

      onResetPage();
      updateFilters({ vehicles: newValue });
    },
    [onResetPage, updateFilters]
  );

  return (
    <Box>
      {/* Mobile Search Bar */}
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

      {/* Desktop Filters */}
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
        {/* <FormControl sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 200 } }}>
          <InputLabel htmlFor="filter-type-select">Vehicles</InputLabel>
          <Select
            multiple
            value={currentFilters.vehicles}
            onChange={handleFilterVehicle}
            input={<OutlinedInput label="Vehicles" />}
            renderValue={(selected) =>
              selected
                .map(
                  (value) =>
                    options.vehicles.find((vehicle) => vehicle.value === value)?.label || value
                )
                .join(', ')
            }
            inputProps={{ id: 'filter-type-select' }}
            MenuProps={{ PaperProps: { sx: { maxHeight: 240 } } }}
          >
            {options.vehicles.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Checkbox
                  disableRipple
                  size="small"
                  checked={currentFilters.vehicles.includes(option.value)}
                />
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl> */}

        <Autocomplete
          multiple
          options={options?.vehicles?.map((item) => ({
            value: item.id,
            name: `${item.license_plate}`,
          }))}
          value={currentFilters.vehicles || []}
          onChange={(event, newValue) => {
            onResetPage();
            updateFilters({ vehicles: newValue });
          }}
          getOptionLabel={(option) => {
            // Return only name for filtering/matching
            if (typeof option === 'string') return option;
            return option?.name || '';
          }}
          isOptionEqualToValue={(option, value) => {
            if (typeof option === 'string' && typeof value === 'string') return option === value;
            return option?.value === value?.value;
          }}
          renderInput={(params) => (
            <TextField {...params} label="Vehicles" placeholder="Search vehicle..." />
          )}
          renderTags={() => []}
          renderOption={(props, option, { selected }) => {
            const { key, ...otherProps } = props;
            // Show only name in dropdown
            const displayText = typeof option === 'string' ? option : option.name;
            // Use ID as key to avoid duplicate key warnings
            const uniqueKey = typeof option === 'string' ? key : option.value;
            return (
              <Box component="li" key={uniqueKey} {...otherProps}>
                <Checkbox disableRipple size="small" checked={selected} />
                {displayText}
              </Box>
            );
          }}
          filterOptions={(filterOptions, state) => {
            const { inputValue } = state;

            // If no input, return all options
            if (!inputValue) return filterOptions;

            // Filter by name only
            const filtered = filterOptions.filter((option) => {
              const name = typeof option === 'string' ? option : option?.name || '';
              return name.toLowerCase().includes(inputValue.toLowerCase());
            });

            // Remove duplicates by ID
            const seen = new Set();
            return filtered.filter((option) => {
              const id = typeof option === 'string' ? option : option?.value;
              if (!id || seen.has(id)) return false;
              seen.add(id);
              return true;
            });
          }}
          sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 300 } }}
        />

        <Autocomplete
          multiple
          options={options.drivers.map((item) => ({
            value: item.value,
            name: `${item.first_name}  ${item.last_name}`,
          }))}
          value={currentFilters.drivers || []}
          onChange={(event, newValue) => {
            onResetPage();
            updateFilters({ drivers: newValue });
          }}
          getOptionLabel={(option) => {
            // Return only name for filtering/matching
            if (typeof option === 'string') return option;
            return option?.name || '';
          }}
          isOptionEqualToValue={(option, value) => {
            if (typeof option === 'string' && typeof value === 'string') return option === value;
            return option?.value === value?.value;
          }}
          renderInput={(params) => (
            <TextField {...params} label="Drivers" placeholder="Search driver name..." />
          )}
          renderTags={() => []}
          renderOption={(props, option, { selected }) => {
            const { key, ...otherProps } = props;
            // Show only name in dropdown
            const displayText = typeof option === 'string' ? option : option.name;
            // Use ID as key to avoid duplicate key warnings
            const uniqueKey = typeof option === 'string' ? key : option.value;
            return (
              <Box component="li" key={uniqueKey} {...otherProps}>
                <Checkbox disableRipple size="small" checked={selected} />
                {displayText}
              </Box>
            );
          }}
          filterOptions={(filterOptions, state) => {
            const { inputValue } = state;

            // If no input, return all options
            if (!inputValue) return filterOptions;

            // Filter by name only
            const filtered = filterOptions.filter((option) => {
              const name = typeof option === 'string' ? option : option?.name || '';
              return name.toLowerCase().includes(inputValue.toLowerCase());
            });

            // Remove duplicates by ID
            const seen = new Set();
            return filtered.filter((option) => {
              const id = typeof option === 'string' ? option : option?.value;
              if (!id || seen.has(id)) return false;
              seen.add(id);
              return true;
            });
          }}
          sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 300 } }}
        />

        <DatePicker
          label="Submitted Start Date"
          value={currentFilters.startDate}
          onChange={(newValue) => handleFilters('startDate', newValue)}
          slotProps={{ textField: { fullWidth: true } }}
          sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 180 } }}
        />

        <DatePicker
          label="Submitted End Date"
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
          <Autocomplete
            multiple
            options={options?.vehicles?.map((item) => ({
              value: item.id,
              name: `${item.license_plate}`,
            }))}
            value={currentFilters.vehicles || []}
            onChange={(event, newValue) => {
              onResetPage();
              updateFilters({ vehicles: newValue });
            }}
            getOptionLabel={(option) => {
              // Return only name for filtering/matching
              if (typeof option === 'string') return option;
              return option?.name || '';
            }}
            isOptionEqualToValue={(option, value) => {
              if (typeof option === 'string' && typeof value === 'string') return option === value;
              return option?.value === value?.value;
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Vehicles"
                placeholder="Search vehicle plate number..."
              />
            )}
            renderTags={() => []}
            renderOption={(props, option, { selected }) => {
              const { key, ...otherProps } = props;
              // Show only name in dropdown
              const displayText = typeof option === 'string' ? option : option.name;
              // Use ID as key to avoid duplicate key warnings
              const uniqueKey = typeof option === 'string' ? key : option.value;
              return (
                <Box component="li" key={uniqueKey} {...otherProps}>
                  <Checkbox disableRipple size="small" checked={selected} />
                  {displayText}
                </Box>
              );
            }}
            filterOptions={(filterOptions, state) => {
              const { inputValue } = state;

              // If no input, return all options
              if (!inputValue) return filterOptions;

              // Filter by name only
              const filtered = filterOptions.filter((option) => {
                const name = typeof option === 'string' ? option : option?.name || '';
                return name.toLowerCase().includes(inputValue.toLowerCase());
              });

              // Remove duplicates by ID
              const seen = new Set();
              return filtered.filter((option) => {
                const id = typeof option === 'string' ? option : option?.value;
                if (!id || seen.has(id)) return false;
                seen.add(id);
                return true;
              });
            }}
            sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 300 } }}
          />

          <Autocomplete
            multiple
            options={options.drivers.map((item) => ({
              value: item.value,
              name: `${item.first_name}  ${item.last_name}`,
            }))}
            value={currentFilters.drivers || []}
            onChange={(event, newValue) => {
              onResetPage();
              updateFilters({ drivers: newValue });
            }}
            getOptionLabel={(option) => {
              // Return only name for filtering/matching
              if (typeof option === 'string') return option;
              return option?.name || '';
            }}
            isOptionEqualToValue={(option, value) => {
              if (typeof option === 'string' && typeof value === 'string') return option === value;
              return option?.value === value?.value;
            }}
            renderInput={(params) => (
              <TextField {...params} label="Drivers" placeholder="Search driver name..." />
            )}
            renderTags={() => []}
            renderOption={(props, option, { selected }) => {
              const { key, ...otherProps } = props;
              // Show only name in dropdown
              const displayText = typeof option === 'string' ? option : option.name;
              // Use ID as key to avoid duplicate key warnings
              const uniqueKey = typeof option === 'string' ? key : option.value;
              return (
                <Box component="li" key={uniqueKey} {...otherProps}>
                  <Checkbox disableRipple size="small" checked={selected} />
                  {displayText}
                </Box>
              );
            }}
            filterOptions={(filterOptions, state) => {
              const { inputValue } = state;

              // If no input, return all options
              if (!inputValue) return filterOptions;

              // Filter by name only
              const filtered = filterOptions.filter((option) => {
                const name = typeof option === 'string' ? option : option?.name || '';
                return name.toLowerCase().includes(inputValue.toLowerCase());
              });

              // Remove duplicates by ID
              const seen = new Set();
              return filtered.filter((option) => {
                const id = typeof option === 'string' ? option : option?.value;
                if (!id || seen.has(id)) return false;
                seen.add(id);
                return true;
              });
            }}
            sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 300 } }}
          />

          <DatePicker
            label="Submitted Start Date"
            value={currentFilters.startDate}
            onChange={(newValue) => handleFilters('startDate', newValue)}
            slotProps={{ textField: { fullWidth: true } }}
            sx={{ width: 1 }}
          />

          <DatePicker
            label="Submitted End Date"
            value={currentFilters.endDate}
            onChange={(newValue) => handleFilters('endDate', newValue)}
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

export const AdminPreTripTableToolbar = memo(AdminPreTripTableToolbarComponent);
