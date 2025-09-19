import type { IJobTableFilters } from 'src/types/job';
import type { IDatePickerControl } from 'src/types/common';
import type { UseSetStateReturn } from 'minimal-shared/hooks';

import React from 'react';
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
  filters: UseSetStateReturn<IJobTableFilters>;
  onFilterQuery: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFilterStatus: (event: React.SyntheticEvent, newValue: string) => void;
  onFilterStartDate: (newValue: IDatePickerControl) => void;
  onFilterEndDate: (newValue: IDatePickerControl) => void;
  onFilterClient: (newValue: string[]) => void;
  onFilterCompany: (newValue: string[]) => void;
  onFilterSite: (newValue: string[]) => void;
  onResetFilters: () => void;
};

export function AdminFlraTableToolbar({
  filters,
  dateError,
  onFilterQuery,
  onFilterStatus,
  onFilterStartDate,
  onFilterEndDate,
  onFilterClient,
  onFilterCompany,
  onFilterSite,
  onResetFilters,
}: Props) {
  const { state: currentFilters } = filters;

  // Fetch sites from API
  const { data: sitesData } = useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const response = await fetcher(endpoints.management.site);
      return response.data.sites;
    },
  });

  // Fetch clients from API
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await fetcher(endpoints.management.client);
      return response.data.clients;
    },
  });

  // Fetch companies from API
  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await fetcher(endpoints.management.company);
      return response.data.companies;
    },
  });

  const clientOptions = clientsData?.map((client: any) => client.name) || [];
  const companyOptions = companiesData?.map((company: any) => company.name) || [];
  const siteOptions = sitesData?.map((site: any) => site.name) || [];

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

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
      <TextField
        fullWidth
        value={currentFilters.query}
        onChange={onFilterQuery}
        placeholder="Search FLRAs..."
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          },
        }}
        sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 300 } }}
      />

      <Autocomplete
        options={statusOptions}
        value={statusOptions.find(option => option.value === currentFilters.status) || statusOptions[0]}
        onChange={(event, newValue) => {
          onFilterStatus(event, newValue?.value || 'all');
        }}
        renderInput={(params) => (
          <TextField {...params} label="Status" placeholder="Select status..." />
        )}
        sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 200 } }}
      />

      <Autocomplete
        multiple
        options={companyOptions}
        value={currentFilters.company || []}
        onChange={(event, newValue) => {
          onFilterCompany(newValue);
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
          return Array.from(new Set(filtered));
        }}
        sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 200 } }}
      />

      <Autocomplete
        multiple
        options={siteOptions}
        value={currentFilters.site || []}
        onChange={(event, newValue) => {
          onFilterSite(newValue);
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
          return Array.from(new Set(filtered));
        }}
        sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 200 } }}
      />

      <Autocomplete
        multiple
        options={clientOptions}
        value={currentFilters.client || []}
        onChange={(event, newValue) => {
          onFilterClient(newValue);
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
          return Array.from(new Set(filtered));
        }}
        sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 200 } }}
      />

      <DatePicker
        label="Start date"
        value={currentFilters.startDate}
        onChange={onFilterStartDate}
        slotProps={{ textField: { fullWidth: true } }}
        sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 180 } }}
      />

      <DatePicker
        label="End date"
        value={currentFilters.endDate}
        onChange={onFilterEndDate}
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
    </Box>
  );
}
