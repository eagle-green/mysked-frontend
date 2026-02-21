import type { IJobTableFilters } from 'src/types/job';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

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
  filters: IJobTableFilters;
  /** Immediate value for search input (debounced value lives in filters.query) */
  searchInputValue?: string;
  onResetFilters: () => void;
  onFilterQuery: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFilterClient: (newValue: Array<{ id: string; name: string; region?: string; city?: string }>) => void;
  onFilterCompany: (newValue: Array<{ id: string; name: string; region?: string; city?: string }>) => void;
  onFilterSite: (newValue: Array<{ id: string; name: string }>) => void;
  onFilterStartDate: (newValue: any) => void;
  onFilterEndDate: (newValue: any) => void;
};

export function TmpTableToolbar({
  filters,
  searchInputValue,
  onResetFilters,
  onFilterQuery,
  onFilterClient,
  onFilterCompany,
  onFilterSite,
  onFilterStartDate,
  onFilterEndDate,
}: Props) {
  const searchValue = searchInputValue !== undefined ? searchInputValue : filters.query;
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

  const clientOptions = clientsData?.map((client: any) => ({ id: client.id, name: client.name })) || [];
  const siteOptions = sitesData?.map((site: any) => ({ id: site.id, name: site.name })) || [];

  const dateError = filters.startDate && filters.endDate ? filters.endDate < filters.startDate : false;

  return (
    <>
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
          value={searchValue}
          onChange={onFilterQuery}
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
            display: { xs: 'flex', md: 'none' },
            flexDirection: 'column',
            borderBottom: { xs: 1, md: 0 },
            borderColor: 'divider',
          }}
        >
          <Autocomplete
            multiple
            options={siteOptions}
            value={siteOptions.filter((option: any) => 
              filters.site?.some((site: any) => 
                typeof site === 'string' ? site === option.name : site.id === option.id
              )
            )}
            onChange={(event, newValue) => {
              onFilterSite(newValue.map(option => option.id));
            }}
            renderInput={(params) => (
              <TextField {...params} label="Site" placeholder="Search site..." />
            )}
            renderTags={() => []}
            renderOption={(props, option, { selected }) => (
              <Box component="li" {...props} key={option.id}>
                <Checkbox disableRipple size="small" checked={selected} />
                {option.name}
              </Box>
            )}
            filterOptions={(options, { inputValue }) => {
              const filtered = options.filter((option) =>
                option.name.toLowerCase().includes(inputValue.toLowerCase())
              );
              return Array.from(new Set(filtered));
            }}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />

          <Autocomplete
            multiple
            options={clientOptions}
            value={clientOptions.filter((option: any) => 
              filters.client?.some((client: any) => 
                typeof client === 'string' ? client === option.name : client.id === option.id
              )
            )}
            onChange={(event, newValue) => {
              onFilterClient(newValue.map(option => option.id));
            }}
            renderInput={(params) => (
              <TextField {...params} label="Client" placeholder="Search client..." />
            )}
            renderTags={() => []}
            renderOption={(props, option, { selected }) => (
              <Box component="li" {...props} key={option.id}>
                <Checkbox disableRipple size="small" checked={selected} />
                {option.name}
              </Box>
            )}
            filterOptions={(options, { inputValue }) => {
              const filtered = options.filter((option) =>
                option.name.toLowerCase().includes(inputValue.toLowerCase())
              );
              return Array.from(new Set(filtered));
            }}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />

          <DatePicker
            label="Start date"
            value={filters.startDate}
            onChange={onFilterStartDate}
            slotProps={{ textField: { fullWidth: true } }}
          />

          <DatePicker
            label="End date"
            value={filters.endDate}
            onChange={onFilterEndDate}
            minDate={filters.startDate || undefined}
            slotProps={{
              textField: {
                fullWidth: true,
                error: dateError,
                helperText: dateError ? 'End date must be later than start date' : null,
              },
            }}
          />
        </Box>
      </Collapse>

      {/* Desktop Layout */}
      <Box
        sx={{
          p: 2.5,
          gap: 2,
          display: { xs: 'none', md: 'flex' },
          pr: { xs: 2.5, md: 1 },
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Autocomplete
          multiple
          options={siteOptions}
          value={siteOptions.filter((option: any) => 
            filters.site?.some((site: any) => 
              typeof site === 'string' ? site === option.name : site.id === option.id
            )
          )}
          onChange={(event, newValue) => {
            onFilterSite(newValue.map(option => option.id));
          }}
          renderInput={(params) => (
            <TextField {...params} label="Site" placeholder="Search site..." />
          )}
          renderTags={() => []}
            renderOption={(props, option, { selected }) => (
              <Box component="li" {...props} key={option.id}>
                <Checkbox disableRipple size="small" checked={selected} />
                {option.name}
              </Box>
            )}
          filterOptions={(options, { inputValue }) => {
            const filtered = options.filter((option) =>
              option.name.toLowerCase().includes(inputValue.toLowerCase())
            );
            return Array.from(new Set(filtered));
          }}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          sx={{ width: '100%', maxWidth: 300 }}
        />

        <Autocomplete
          multiple
          options={clientOptions}
          value={clientOptions.filter((option: any) => 
            filters.client?.some((client: any) => 
              typeof client === 'string' ? client === option.name : client.id === option.id
            )
          )}
          onChange={(event, newValue) => {
            onFilterClient(newValue.map(option => option.id));
          }}
          renderInput={(params) => (
            <TextField {...params} label="Client" placeholder="Search client..." />
          )}
          renderTags={() => []}
            renderOption={(props, option, { selected }) => (
              <Box component="li" {...props} key={option.id}>
                <Checkbox disableRipple size="small" checked={selected} />
                {option.name}
              </Box>
            )}
          filterOptions={(options, { inputValue }) => {
            const filtered = options.filter((option) =>
              option.name.toLowerCase().includes(inputValue.toLowerCase())
            );
            return Array.from(new Set(filtered));
          }}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          sx={{ width: '100%', maxWidth: 300 }}
        />

        <DatePicker
          label="Start date"
          value={filters.startDate}
          onChange={onFilterStartDate}
          slotProps={{ textField: { fullWidth: true } }}
          sx={{ width: '100%', maxWidth: 180 }}
        />

        <DatePicker
          label="End date"
          value={filters.endDate}
          onChange={onFilterEndDate}
          minDate={filters.startDate || undefined}
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
            value={searchValue}
            onChange={onFilterQuery}
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
    </>
  );
}
