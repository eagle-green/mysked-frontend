import type { SelectChangeEvent } from '@mui/material/Select';
import type { UseSetStateReturn } from 'minimal-shared/hooks';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';

import { roleList } from 'src/assets/data';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type VehicleUserAccessFilters = {
  query: string;
  role: string[];
  vehicle_access: 'all' | 'enabled' | 'disabled';
};

const VEHICLE_ACCESS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'enabled', label: 'Enabled' },
  { value: 'disabled', label: 'Disabled' },
];

// Vehicle-eligible roles only (LCT, LCT/TCP, Field Supervisor, HWY, Manager)
const VEHICLE_ROLE_OPTIONS = roleList.filter((r) =>
  ['lct', 'lct/tcp', 'field_supervisor', 'hwy', 'manager'].includes(r.value)
);

type Props = {
  onResetPage: () => void;
  filters: UseSetStateReturn<VehicleUserAccessFilters>;
};

export function VehicleUserAccessTableToolbar({ filters, onResetPage }: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;
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

  const handleFilterQuery = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  }, []);

  const handleFilterRole = useCallback(
    (event: SelectChangeEvent<string[]>) => {
      const newValue =
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;
      onResetPage();
      updateFilters({ role: newValue });
    },
    [onResetPage, updateFilters]
  );

  const handleFilterVehicleAccess = useCallback(
    (event: SelectChangeEvent<string>) => {
      const newValue = event.target.value as 'all' | 'enabled' | 'disabled';
      onResetPage();
      updateFilters({ vehicle_access: newValue });
    },
    [onResetPage, updateFilters]
  );

  return (
    <Box
      sx={{
        p: 2.5,
        gap: 2,
        display: 'flex',
        pr: { xs: 2.5 },
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'flex-end', md: 'center' },
      }}
    >
      <FormControl sx={{ width: { xs: 1, md: 180 }, minWidth: 140 }}>
        <InputLabel id="filter-vehicle-access-label">Vehicle Access</InputLabel>
        <Select
          labelId="filter-vehicle-access-label"
          value={currentFilters.vehicle_access}
          onChange={handleFilterVehicleAccess}
          input={<OutlinedInput label="Vehicle Access" />}
        >
          {VEHICLE_ACCESS_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ width: { xs: 1, md: 220 }, minWidth: 180 }}>
        <InputLabel id="filter-role-label">Role</InputLabel>
        <Select
          multiple
          labelId="filter-role-label"
          value={currentFilters.role}
          onChange={handleFilterRole}
          input={<OutlinedInput label="Role" />}
          renderValue={(selected) =>
            selected
              .map((v) => VEHICLE_ROLE_OPTIONS.find((o) => o.value === v)?.label || v)
              .join(', ')
          }
          MenuProps={{ PaperProps: { sx: { maxHeight: 240 } } }}
        >
          {VEHICLE_ROLE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              <Checkbox
                disableRipple
                size="small"
                checked={currentFilters.role.includes(opt.value)}
              />
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ flexGrow: 1, display: 'flex', width: '100%', minWidth: 0 }}>
        <TextField
          fullWidth
          value={query}
          onChange={handleFilterQuery}
          placeholder="Search by name..."
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
    </Box>
  );
}
