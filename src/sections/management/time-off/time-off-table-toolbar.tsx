import type { SelectChangeEvent } from '@mui/material/Select';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: any;
  onResetPage: VoidFunction;
  options: {
    types: any[];
  };
  dateError?: boolean;
};

export function TimeOffTableToolbar({ filters, onResetPage, options, dateError }: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;

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
      <FormControl sx={{ flexShrink: 0, width: { xs: 1, md: 200 } }}>
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
        label="Start date"
        value={currentFilters.startDate}
        onChange={(newValue) => handleFilters('startDate', newValue)}
        slotProps={{ textField: { fullWidth: true } }}
        sx={{ maxWidth: { md: 180 } }}
      />

      <DatePicker
        label="End date"
        value={currentFilters.endDate}
        onChange={(newValue) => handleFilters('endDate', newValue)}
        slotProps={{
          textField: {
            fullWidth: true,
            error: dateError,
            helperText: dateError ? 'End date must be later than start date' : null,
          },
        }}
        sx={{ maxWidth: { md: 180 } }}
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
          />
        </Box>
    </Box>
  );
} 