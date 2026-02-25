import type { ISalesTrackerTableFilters } from 'src/types/sales-tracker';
import type { UseSetStateReturn } from 'minimal-shared/hooks';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import Autocomplete from '@mui/material/Autocomplete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { formHelperTextClasses } from '@mui/material/FormHelperText';

import { Iconify } from 'src/components/iconify';

import { fetcher, endpoints } from 'src/lib/axios';

import { SALES_TRACKER_SERVICE_OPTIONS } from 'src/types/sales-tracker';

// ----------------------------------------------------------------------

type Props = {
  dateError: boolean;
  onResetPage: () => void;
  filters: UseSetStateReturn<ISalesTrackerTableFilters>;
};

export function SalesTrackerTableToolbar({ filters, dateError, onResetPage }: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;
  const [query, setQuery] = useState<string>(currentFilters.query ?? '');

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
  }, [query, onResetPage, updateFilters]);

  const { data: companiesData } = useQuery({
    queryKey: ['companies-all'],
    queryFn: async () => {
      const response = await fetcher(endpoints.management.companyAll);
      return response.companies ?? [];
    },
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-all-sales-tracker'],
    queryFn: async () => {
      const response = await fetcher(
        `${endpoints.management.user}?page=1&rowsPerPage=500&orderBy=first_name&order=asc`
      );
      const data = response?.data ?? response;
      return Array.isArray(data) ? data : (data?.users ?? []);
    },
  });

  const customerOptions = useMemo(() => {
    if (!companiesData) return [];
    return (companiesData as any[]).map((c: any) => ({ id: c.id, name: c.name ?? '' }));
  }, [companiesData]);

  const employeeOptions = useMemo(() => {
    if (!usersData) return [];
    const list = Array.isArray(usersData) ? usersData : [];
    return list.map((u: any) => ({
      id: u.id,
      name: [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.email || u.id,
    }));
  }, [usersData]);

  const handleServiceChange = (event: any) => {
    onResetPage();
    updateFilters({ service: event.target.value as ISalesTrackerTableFilters['service'] });
  };

  const handleFilterStartDate = (newValue: any) => {
    onResetPage();
    updateFilters({ startDate: newValue });
  };

  const handleFilterEndDate = (newValue: any) => {
    onResetPage();
    updateFilters({ endDate: newValue });
  };

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
        <InputLabel id="sales-tracker-service-label">Service</InputLabel>
        <Select
          labelId="sales-tracker-service-label"
          value={currentFilters.service}
          onChange={handleServiceChange}
          label="Service"
          input={<OutlinedInput label="Service" />}
        >
          {SALES_TRACKER_SERVICE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Autocomplete
        multiple
        options={customerOptions}
        value={currentFilters.customer ?? []}
        onChange={(event, newValue) => {
          onResetPage();
          updateFilters({ customer: newValue });
        }}
        getOptionLabel={(option) => (typeof option === 'string' ? option : option?.name ?? '')}
        isOptionEqualToValue={(option, value) => option?.id === value?.id}
        renderInput={(params) => (
          <TextField {...params} label="Customer" placeholder="Search customer..." />
        )}
        renderTags={() => []}
        renderOption={(props, option, { selected }) => {
          const { key, ...otherProps } = props as any;
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

      <Autocomplete
        multiple
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
          const { key, ...otherProps } = props as any;
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

      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
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
          sx={{ width: '100%' }}
        />
      </Box>
    </Box>
  );
}
