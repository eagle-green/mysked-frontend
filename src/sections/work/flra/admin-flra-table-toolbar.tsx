import type { IJobTableFilters } from 'src/types/job';
import type { IDatePickerControl } from 'src/types/common';
import type { UseSetStateReturn } from 'minimal-shared/hooks';

import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import React, { memo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  dateError: boolean;
  onResetPage: () => void;
  filters: UseSetStateReturn<IJobTableFilters>;
};

function AdminFlraTableToolbarComponent({ filters, dateError, onResetPage }: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;
  const [query, setQuery] = useState<string>(currentFilters.query || '');
  const [showFilters, setShowFilters] = useState(false);

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

  // Fetch sites from API
  const { data: sitesData } = useQuery({
    queryKey: ['sites-all'],
    queryFn: async () => {
      const response = await fetcher(endpoints.management.siteAll);
      return response.sites;
    },
  });

  // Fetch clients from API
  const { data: clientsData } = useQuery({
    queryKey: ['clients-all'],
    queryFn: async () => {
      const response = await fetcher(endpoints.management.clientAll);
      return response.clients;
    },
  });

  // Fetch companies from API
  const { data: companiesData } = useQuery({
    queryKey: ['companies-all'],
    queryFn: async () => {
      const response = await fetcher(endpoints.management.companyAll);
      return response.companies;
    },
  });

  // Deduplicate by id
  const clientOptions = clientsData?.reduce((acc: any[], client: any) => {
    if (!acc.find(c => c.id === client.id)) {
      acc.push({ 
        id: client.id, 
        name: client.name,
        region: client.region,
        city: client.city
      });
    }
    return acc;
  }, []) || [];
  
  const companyOptions = companiesData?.reduce((acc: any[], company: any) => {
    if (!acc.find(c => c.id === company.id)) {
      acc.push({ 
        id: company.id, 
        name: company.name,
        region: company.region,
        city: company.city
      });
    }
    return acc;
  }, []) || [];
  
  const siteOptions = sitesData?.reduce((acc: any[], site: any) => {
    if (!acc.find(s => s.id === site.id)) {
      acc.push({ 
        id: site.id, 
        name: site.name
      });
    }
    return acc;
  }, []) || [];

  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setQuery(newValue); // Update local state immediately
      // Parent update is debounced via useEffect above
    },
    []
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
      {/* Mobile: search + gear button to expand filters */}
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
          onChange={handleFilterName}
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
        <Button
          variant="outlined"
          size="small"
          onClick={() => setShowFilters(!showFilters)}
          sx={{ ml: 1, minWidth: 'auto', width: 40, height: 40, px: 0 }}
        >
          <Iconify icon="solar:settings-bold" />
        </Button>
      </Box>

      {/* Collapsible filters for mobile */}
      <Collapse in={showFilters}>
        <Box
          sx={{
            p: 2,
            gap: 2,
            display: 'flex',
            flexDirection: 'column',
            borderBottom: { xs: 1, md: 0 },
            borderColor: 'divider',
          }}
        >
          <Autocomplete
            multiple
            options={companyOptions}
            value={currentFilters.company || []}
            onChange={(event, newValue) => {
              onResetPage();
              updateFilters({ company: newValue });
            }}
            getOptionLabel={(option) => option?.name || ''}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            renderInput={(params) => (
              <TextField {...params} label="Company" placeholder="Search company..." />
            )}
            renderTags={() => []}
            renderOption={(props, option, { selected }) => (
              <Box component="li" {...props} key={option?.id}>
                <Checkbox disableRipple size="small" checked={selected} />
                {option?.name}
              </Box>
            )}
            filterOptions={(options, { inputValue }) => {
              if (!inputValue) return options;
              return options.filter((option) =>
                option?.name?.toLowerCase().includes(inputValue.toLowerCase())
              );
            }}
            sx={{ width: 1 }}
          />
          <Autocomplete
            multiple
            options={siteOptions}
            value={currentFilters.site || []}
            onChange={(event, newValue) => {
              onResetPage();
              updateFilters({ site: newValue });
            }}
            getOptionLabel={(option) => option?.name || ''}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            renderInput={(params) => (
              <TextField {...params} label="Site" placeholder="Search site..." />
            )}
            renderTags={() => []}
            renderOption={(props, option, { selected }) => (
              <Box component="li" {...props} key={option?.id}>
                <Checkbox disableRipple size="small" checked={selected} />
                {option?.name}
              </Box>
            )}
            filterOptions={(options, { inputValue }) => {
              if (!inputValue) return options;
              return options.filter((option) =>
                option?.name?.toLowerCase().includes(inputValue.toLowerCase())
              );
            }}
            sx={{ width: 1 }}
          />
          <Autocomplete
            multiple
            options={clientOptions}
            value={currentFilters.client || []}
            onChange={(event, newValue) => {
              onResetPage();
              updateFilters({ client: newValue });
            }}
            getOptionLabel={(option) => option?.name || ''}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            renderInput={(params) => (
              <TextField {...params} label="Client" placeholder="Search client..." />
            )}
            renderTags={() => []}
            renderOption={(props, option, { selected }) => (
              <Box component="li" {...props} key={option?.id}>
                <Checkbox disableRipple size="small" checked={selected} />
                {option?.name}
              </Box>
            )}
            filterOptions={(options, { inputValue }) => {
              if (!inputValue) return options;
              return options.filter((option) =>
                option?.name?.toLowerCase().includes(inputValue.toLowerCase())
              );
            }}
            sx={{ width: 1 }}
          />
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

      {/* Desktop filters */}
      <Box
        sx={{
          p: 2.5,
          gap: 2,
          display: { xs: 'none', md: 'flex' },
          pr: 1,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Autocomplete
          multiple
          options={companyOptions}
          value={currentFilters.company || []}
          onChange={(event, newValue) => {
            onResetPage();
            updateFilters({ company: newValue });
          }}
          getOptionLabel={(option) => option?.name || ''}
          isOptionEqualToValue={(option, value) => option?.id === value?.id}
          renderInput={(params) => (
            <TextField {...params} label="Company" placeholder="Search company..." />
          )}
          renderTags={() => []}
          renderOption={(props, option, { selected }) => (
            <Box component="li" {...props} key={option?.id}>
              <Checkbox disableRipple size="small" checked={selected} />
              {option?.name}
            </Box>
          )}
          filterOptions={(options, { inputValue }) => {
            if (!inputValue) return options;
            return options.filter((option) =>
              option?.name?.toLowerCase().includes(inputValue.toLowerCase())
            );
          }}
          sx={{ width: '100%', maxWidth: 300 }}
        />
        <Autocomplete
          multiple
          options={siteOptions}
          value={currentFilters.site || []}
          onChange={(event, newValue) => {
            onResetPage();
            updateFilters({ site: newValue });
          }}
          getOptionLabel={(option) => option?.name || ''}
          isOptionEqualToValue={(option, value) => option?.id === value?.id}
          renderInput={(params) => (
            <TextField {...params} label="Site" placeholder="Search site..." />
          )}
          renderTags={() => []}
          renderOption={(props, option, { selected }) => (
            <Box component="li" {...props} key={option?.id}>
              <Checkbox disableRipple size="small" checked={selected} />
              {option?.name}
            </Box>
          )}
          filterOptions={(options, { inputValue }) => {
            if (!inputValue) return options;
            return options.filter((option) =>
              option?.name?.toLowerCase().includes(inputValue.toLowerCase())
            );
          }}
          sx={{ width: '100%', maxWidth: 300 }}
        />
        <Autocomplete
          multiple
          options={clientOptions}
          value={currentFilters.client || []}
          onChange={(event, newValue) => {
            onResetPage();
            updateFilters({ client: newValue });
          }}
          getOptionLabel={(option) => option?.name || ''}
          isOptionEqualToValue={(option, value) => option?.id === value?.id}
          renderInput={(params) => (
            <TextField {...params} label="Client" placeholder="Search client..." />
          )}
          renderTags={() => []}
          renderOption={(props, option, { selected }) => (
            <Box component="li" {...props} key={option?.id}>
              <Checkbox disableRipple size="small" checked={selected} />
              {option?.name}
            </Box>
          )}
          filterOptions={(options, { inputValue }) => {
            if (!inputValue) return options;
            return options.filter((option) =>
              option?.name?.toLowerCase().includes(inputValue.toLowerCase())
            );
          }}
          sx={{ width: '100%', maxWidth: 300 }}
        />
        <DatePicker
          label="Start date"
          value={currentFilters.startDate}
          onChange={handleFilterStartDate}
          slotProps={{ textField: { fullWidth: true } }}
          sx={{ width: '100%', maxWidth: 180 }}
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
          sx={{ width: '100%', maxWidth: 180 }}
        />
        <Box sx={{ gap: 2, width: 1, flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            value={query}
            onChange={handleFilterName}
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
    </Box>
  );
}

export const AdminFlraTableToolbar = memo(AdminFlraTableToolbarComponent);
