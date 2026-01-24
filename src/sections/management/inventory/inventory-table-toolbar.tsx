import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { IInventoryTableFilters } from 'src/types/inventory';

import { memo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';

import { useInventoryTypes } from 'src/hooks/use-inventory-types';

import { Iconify } from 'src/components/iconify';


// ----------------------------------------------------------------------

type FilterOption = {
  value: string;
  label: string;
};

type Props = {
  onResetPage: () => void;
  filters: UseSetStateReturn<IInventoryTableFilters>;
  options: {
    status: FilterOption[];
  };
};

function InventoryTableToolbarComponent({
  options,
  filters,
  onResetPage,
}: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;
  const { data: inventoryTypesData = [] } = useInventoryTypes();
  const inventoryTypes = Array.isArray(inventoryTypesData) ? inventoryTypesData : [];
  
  // Format inventory types for the filter dropdown
  const formatTypeLabel = (value: string) =>
    value
      .split('_')
      .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
      .join(' ');

  const typeOptions = inventoryTypes.map((t) => ({
    value: t.value,
    label: formatTypeLabel(t.value),
  }));

  const [category, setCategory] = useState<string[]>(currentFilters.category || []);
  const [query, setQuery] = useState<string>(currentFilters.query || '');

  // Sync local state with filters when filters change externally (e.g., reset or chip removal)
  useEffect(() => {
    setQuery(currentFilters.query || '');
  }, [currentFilters.query]);

  // Sync local category state with filters when filters change externally
  useEffect(() => {
    setCategory(currentFilters.category || []);
  }, [currentFilters.category]);

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
        <FilterSelect
          label="Type"
          value={category}
          options={typeOptions}
          onChange={(event) => {
            const value = event.target.value;
            const parsedValue = typeof value === 'string' ? value.split(',') : value;
            setCategory(parsedValue);
            onResetPage();
            updateFilters({ category: parsedValue });
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
            value={query}
            onChange={handleFilterQuery}
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
  );
}

export const InventoryTableToolbar = memo(InventoryTableToolbarComponent);

// ----------------------------------------------------------------------

type FilterSelectProps = {
  label: string;
  value: string[];
  options: FilterOption[];
  onChange: (event: SelectChangeEvent<string[]>) => void;
};

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  const id = `filter-${label.toLowerCase()}-select`;

  return (
    <FormControl sx={{ flexShrink: 0, width: { xs: 1, md: 200 } }}>
      <InputLabel htmlFor={id}>{label}</InputLabel>
      <Select
        multiple
        label={label}
        value={value}
        onChange={onChange}
        renderValue={(selected) => {
          // Maintain selection order when displaying in the select field
          const output = selected
            .map((val) => {
              const option = options.find((opt) => opt.value === val);
              return option?.label || val;
            })
            .filter(Boolean);

          return output.join(', ');
        }}
        inputProps={{ id }}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 300,
              width: 250,
            },
          },
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            <Checkbox
              disableRipple
              size="small"
              checked={value.includes(option.value)}
              slotProps={{ input: { id: `${option.value}-checkbox` } }}
            />
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
