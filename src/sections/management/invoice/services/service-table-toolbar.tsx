import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { SelectChangeEvent } from '@mui/material/Select';

import { memo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface ServiceTableFilters {
  query: string;
  status: string;
  category: string[];
  type: string[];
}

type FilterOption = {
  value: string;
  label: string;
};

type Props = {
  onResetPage: () => void;
  filters: UseSetStateReturn<ServiceTableFilters>;
  options: {
    categories: FilterOption[];
    types: FilterOption[];
  };
};

function ServiceTableToolbarComponent({ filters, onResetPage, options }: Props) {
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

  const handleFilterQuery = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setQuery(newValue); // Update local state immediately
      // Parent update is debounced via useEffect above
    },
    []
  );

  const handleFilterCategory = useCallback(
    (event: SelectChangeEvent<string[]>) => {
      const newValue =
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;

      onResetPage();
      updateFilters({ category: newValue });
    },
    [onResetPage, updateFilters]
  );

  const handleFilterType = useCallback(
    (event: SelectChangeEvent<string[]>) => {
      const newValue =
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;

      onResetPage();
      updateFilters({ type: newValue });
    },
    [onResetPage, updateFilters]
  );

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
      <FormControl sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 200 } }}>
        <InputLabel htmlFor="filter-category-select">Category</InputLabel>
        <Select
          multiple
          value={currentFilters.category}
          onChange={handleFilterCategory}
          input={<OutlinedInput label="Category" />}
          renderValue={(selected) =>
            selected
              .map((value) => options.categories.find((cat) => cat.value === value)?.label || value)
              .join(', ')
          }
          inputProps={{ id: 'filter-category-select' }}
          MenuProps={{ PaperProps: { sx: { maxHeight: 240 } } }}
        >
          {options.categories.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              <Checkbox
                disableRipple
                size="small"
                checked={currentFilters.category.includes(option.value)}
              />
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 200 } }}>
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
          value={query}
          onChange={handleFilterQuery}
          placeholder="Search services..."
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
  );
}

export const ServiceTableToolbar = memo(ServiceTableToolbarComponent);
