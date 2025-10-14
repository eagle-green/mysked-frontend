import type { IJobTableFilters } from 'src/types/job';
import type { IDatePickerControl } from 'src/types/common';
import type { UseSetStateReturn } from 'minimal-shared/hooks';

import React, { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
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

export function AdminTmpTableToolbar({ filters, dateError, onResetPage }: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;

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

  const clientOptions = clientsData?.map((client: any) => client.name) || [];
  const companyOptions = companiesData?.map((company: any) => company.name) || [];
  const siteOptions = sitesData?.map((site: any) => site.name) || [];

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
      <Autocomplete
        multiple
        options={companyOptions}
        value={currentFilters.company || []}
        onChange={(event, newValue) => {
          onResetPage();
          updateFilters({ company: newValue });
        }}
        renderInput={(params) => (
          <TextField {...params} label="Company" placeholder="Search company..." />
        )}
        renderTags={() => []}
        renderOption={(props, option, { selected }) => {
          const { key, ...otherProps } = props;
          return (
            <Box component="li" key={key} {...otherProps}>
              <Checkbox disableRipple size="small" checked={selected} />
              {option}
            </Box>
          );
        }}
        filterOptions={(options, { inputValue }) => {
          const filtered = options.filter((option) =>
            option.toLowerCase().includes(inputValue.toLowerCase())
          );
          // Remove duplicates while preserving order
          return Array.from(new Set(filtered));
        }}
        sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 300 } }}
      />

      <Autocomplete
        multiple
        options={siteOptions}
        value={currentFilters.site || []}
        onChange={(event, newValue) => {
          onResetPage();
          updateFilters({ site: newValue });
        }}
        renderInput={(params) => (
          <TextField {...params} label="Site" placeholder="Search site..." />
        )}
        renderTags={() => []}
        renderOption={(props, option, { selected }) => {
          const { key, ...otherProps } = props;
          return (
            <Box component="li" key={key} {...otherProps}>
              <Checkbox disableRipple size="small" checked={selected} />
              {option}
            </Box>
          );
        }}
        filterOptions={(options, { inputValue }) => {
          const filtered = options.filter((option) =>
            option.toLowerCase().includes(inputValue.toLowerCase())
          );
          // Remove duplicates while preserving order
          return Array.from(new Set(filtered));
        }}
        sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 300 } }}
      />

      <Autocomplete
        multiple
        options={clientOptions}
        value={currentFilters.client || []}
        onChange={(event, newValue) => {
          onResetPage();
          updateFilters({ client: newValue });
        }}
        renderInput={(params) => (
          <TextField {...params} label="Client" placeholder="Search client..." />
        )}
        renderTags={() => []}
        renderOption={(props, option, { selected }) => {
          const { key, ...otherProps } = props;
          return (
            <Box component="li" key={key} {...otherProps}>
              <Checkbox disableRipple size="small" checked={selected} />
              {option}
            </Box>
          );
        }}
        filterOptions={(options, { inputValue }) => {
          const filtered = options.filter((option) =>
            option.toLowerCase().includes(inputValue.toLowerCase())
          );
          // Remove duplicates while preserving order
          return Array.from(new Set(filtered));
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
          sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%' } }}
        />
      </Box>
    </Box>
  );
}
