import type { IJobTableFilters } from 'src/types/job';
import type { IDatePickerControl } from 'src/types/common';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { UseSetStateReturn } from 'minimal-shared/hooks';

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Autocomplete from '@mui/material/Autocomplete';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { formHelperTextClasses } from '@mui/material/FormHelperText';

import { fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  dateError: boolean;
  onResetPage: () => void;
  filters: UseSetStateReturn<IJobTableFilters>;
  options: {
    regions: string[];
  };
};

export function JobTableToolbar({ filters, options, dateError, onResetPage }: Props) {
  const menuActions = usePopover();

  const { state: currentFilters, setState: updateFilters } = filters;

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

  // Fetch sites from API
  const { data: sitesData } = useQuery({
    queryKey: ['sites-all'],
    queryFn: async () => {
      const response = await fetcher(endpoints.management.siteAll);
      return response.sites;
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

  const handleFilterRegion = useCallback(
    (event: SelectChangeEvent<string[]>) => {
      const newValue =
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;

      onResetPage();
      updateFilters({ region: newValue });
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

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <MenuItem onClick={() => menuActions.onClose()}>
          <Iconify icon="solar:printer-minimalistic-bold" />
          Print
        </MenuItem>

        <MenuItem onClick={() => menuActions.onClose()}>
          <Iconify icon="solar:import-bold" />
          Import
        </MenuItem>

        <MenuItem onClick={() => menuActions.onClose()}>
          <Iconify icon="solar:export-bold" />
          Export
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  return (
    <>
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
          <InputLabel htmlFor="filter-region-select">Region</InputLabel>
          <Select
            multiple
            value={currentFilters.region}
            onChange={handleFilterRegion}
            input={<OutlinedInput label="Region" />}
            renderValue={(selected) => selected.map((value) => value).join(', ')}
            inputProps={{ id: 'filter-region-select' }}
            MenuProps={{ PaperProps: { sx: { maxHeight: 240 } } }}
          >
            {options.regions.map((option) => (
              <MenuItem key={option} value={option}>
                <Checkbox
                  disableRipple
                  size="small"
                  checked={currentFilters.region.includes(option)}
                />
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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
          filterOptions={(filterOptions, { inputValue }) => {
            const filtered = filterOptions.filter((option) =>
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
          filterOptions={(filterOptions, { inputValue }) => {
            const filtered = filterOptions.filter((option) =>
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
          filterOptions={(filterOptions, { inputValue }) => {
            const filtered = filterOptions.filter((option) =>
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
          sx={{
            width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 180 },
            [`& .${formHelperTextClasses.root}`]: {
              bottom: { md: -40 },
              position: { md: 'absolute' },
            },
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

          {/* <IconButton onClick={menuActions.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton> */}
        </Box>
      </Box>

      {renderMenuActions()}
    </>
  );
}
