import { useCallback } from 'react';

import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { DatePicker } from '@mui/x-date-pickers/DatePicker/DatePicker';

//--------------------------------------------------------------------------------------

type Props = {
  filters: any;
  options: {
    services: any[];
    client: any[];
    region: any[];
  };
  dateError?: boolean;
};

export function InvoiceFilterToolbar({ filters, options, dateError }: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleFilters = useCallback(
    (name: string, value: any) => {
      updateFilters({ [name]: value });
    },
    [updateFilters]
  );

  const handleFilterService = useCallback(
    (event: SelectChangeEvent<string[]>) => {
      const newValue =
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;
      updateFilters({ ...updateFilters, service: newValue });
    },
    [updateFilters]
  );

  const handleFilterRegion = useCallback(
    (event: SelectChangeEvent<string[]>) => {
      const newValue =
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;
      updateFilters({ ...updateFilters, region: newValue });
    },
    [updateFilters]
  );

  const handleFilterClient = useCallback(
    (event: SelectChangeEvent<string[]>) => {
      const newValue =
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;
      updateFilters({ ...updateFilters, client: newValue });
    },
    [updateFilters]
  );

  return (
    <>
      <Box
        sx={{
          p: 2.5,
          gap: 2,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-end', md: 'center' },
        }}
      >
        {/*  Servives (LCT / TCP / HWY)*/}
        <FormControl sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 1 } }}>
          <InputLabel htmlFor="filter-type-select">Services</InputLabel>
          <Select
            multiple
            value={currentFilters.service}
            onChange={handleFilterService}
            input={<OutlinedInput label="Type" />}
            renderValue={(selected) =>
              selected
                .map(
                  (value) => options.services.find((type) => type.value === value)?.label || value
                )
                .join(', ')
            }
            inputProps={{ id: 'filter-type-select' }}
            MenuProps={{ PaperProps: { sx: { maxHeight: 240 } } }}
          >
            {options.services.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Checkbox
                  disableRipple
                  size="small"
                  checked={currentFilters.service.includes(option.value)}
                />
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Branches / Region */}
        <FormControl sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 1 } }}>
          <InputLabel htmlFor="filter-type-select">Region</InputLabel>
          <Select
            multiple
            value={currentFilters.region}
            onChange={handleFilterRegion}
            input={<OutlinedInput label="Type" />}
            renderValue={(selected) =>
              selected
                .map((value) => options.region.find((type) => type.value === value)?.label || value)
                .join(', ')
            }
            inputProps={{ id: 'filter-type-select' }}
            MenuProps={{ PaperProps: { sx: { maxHeight: 240 } } }}
          >
            {options.region.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Checkbox
                  disableRipple
                  size="small"
                  checked={currentFilters.region.includes(option.value)}
                />
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Client*/}
        <FormControl sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 1 } }}>
          <InputLabel htmlFor="filter-type-select">Client</InputLabel>
          <Select
            multiple
            value={currentFilters.client}
            onChange={handleFilterClient}
            input={<OutlinedInput label="Type" />}
            renderValue={(selected) =>
              selected
                .map((value) => options.client.find((type) => type.value === value)?.label || value)
                .join(', ')
            }
            inputProps={{ id: 'filter-type-select' }}
            MenuProps={{ PaperProps: { sx: { maxHeight: 240 } } }}
          >
            {options.client.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Checkbox
                  disableRipple
                  size="small"
                  checked={currentFilters.client.includes(option.value)}
                />
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <DatePicker
          label="Invoice Start date"
          value={currentFilters.startDate}
          onChange={(newValue) => handleFilters('startDate', newValue)}
          slotProps={{ textField: { fullWidth: true } }}
          sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 1 } }}
        />

        <DatePicker
          label="Invoice End date"
          value={currentFilters.endDate}
          onChange={(newValue) => handleFilters('endDate', newValue)}
          slotProps={{
            textField: {
              fullWidth: true,
              error: dateError,
              helperText: dateError ? 'End date must be later than start date' : null,
            },
          }}
          sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 1 } }}
        />
      </Box>
    </>
  );
}
