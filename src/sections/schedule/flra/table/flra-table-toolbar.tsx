import type { IJobTableFilters } from 'src/types/job';
import type { IDatePickerControl } from 'src/types/common';
import type { UseSetStateReturn } from 'minimal-shared/hooks';

import { useQuery } from '@tanstack/react-query';
import React, { useState, useCallback } from 'react';

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

export function FlraTableToolbar({ filters, dateError, onResetPage }: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;
  const [showFilters, setShowFilters] = useState(false);

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

  const clientOptions = clientsData?.map((client: any) => ({ 
    id: client.id, 
    name: client.name,
    region: client.region,
    city: client.city
  })) || [];
  const companyOptions = companiesData?.map((company: any) => ({ 
    id: company.id, 
    name: company.name,
    region: company.region,
    city: company.city
  })) || [];
  const siteOptions = sitesData?.map((site: any) => ({ 
    id: site.id, 
    name: site.name
  })) || [];

  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onResetPage();
      updateFilters({ query: event.target.value });
    },
    [onResetPage, updateFilters]
  );

  const handleFilterStartDate = useCallback(
    (newValue: IDatePickerControl) => {
      onResetPage();
      updateFilters({ startDate: newValue });
    },
    [onResetPage, updateFilters]
  );

  const handleFilterEndDate = useCallback(
    (newValue: IDatePickerControl) => {
      onResetPage();
      updateFilters({ endDate: newValue });
    },
    [onResetPage, updateFilters]
  );

  return (
    <Box>
      {/* Mobile filter toggle button */}
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
          value={currentFilters.query}
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
          sx={{ 
            ml: 1, 
            minWidth: 'auto', 
            width: 40,
            height: 40,
            px: 0,
          }}
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
              <TextField {...params} label="Customer" placeholder="Search customer..." />
            )}
            renderTags={() => []}
            renderOption={(props, option, { selected }) => (
              <Box component="li" {...props} key={option?.id}>
                <Checkbox disableRipple size="small" checked={selected} />
                {option?.name}
              </Box>
            )}
            filterOptions={(options, { inputValue }) => {
              const filtered = options.filter((option) =>
                option?.name?.toLowerCase().includes(inputValue.toLowerCase())
              );
              return Array.from(new Set(filtered));
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
              const filtered = options.filter((option) =>
                option?.name?.toLowerCase().includes(inputValue.toLowerCase())
              );
              return Array.from(new Set(filtered));
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
              const filtered = options.filter((option) =>
                option?.name?.toLowerCase().includes(inputValue.toLowerCase())
              );
              return Array.from(new Set(filtered));
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
            <TextField {...params} label="Customer" placeholder="Search customer..." />
          )}
          renderTags={() => []}
            renderOption={(props, option, { selected }) => (
              <Box component="li" {...props} key={option?.id}>
                <Checkbox disableRipple size="small" checked={selected} />
                {option?.name}
              </Box>
            )}
          filterOptions={(options, { inputValue }) => {
            const filtered = options.filter((option) =>
              option?.name?.toLowerCase().includes(inputValue.toLowerCase())
            );
            return Array.from(new Set(filtered));
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
            const filtered = options.filter((option) =>
              option?.name?.toLowerCase().includes(inputValue.toLowerCase())
            );
            return Array.from(new Set(filtered));
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
            const filtered = options.filter((option) =>
              option?.name?.toLowerCase().includes(inputValue.toLowerCase())
            );
            return Array.from(new Set(filtered));
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
