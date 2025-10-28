import type { SelectChangeEvent } from '@mui/material/Select';

import { useCallback } from 'react';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import { DatePicker } from '@mui/x-date-pickers/DatePicker/DatePicker';

import { Iconify } from 'src/components/iconify/iconify';
import { CustomPopover } from 'src/components/custom-popover/custom-popover';

//--------------------------------------------------------------------------------------

type Props = {
  filters: any;
  onResetPage: VoidFunction;
  options: {
    types: any[];
    services: any[];
    region: any[];
    client: any[];
  };
  dateError?: boolean;
};

export function InvoiceToolbar({ filters, onResetPage, options, dateError }: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;
  const menuActions = usePopover();

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
      updateFilters({ ...updateFilters, type: newValue });
    },
    [onResetPage, updateFilters]
  );

  const handleFilterService = useCallback(
    (event: SelectChangeEvent<string[]>) => {
      const newValue =
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;

      onResetPage();
      updateFilters({ ...updateFilters, service: newValue });
    },
    [onResetPage, updateFilters]
  );

  const handleFilterRegion = useCallback(
    (event: SelectChangeEvent<string[]>) => {
      const newValue =
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;

      onResetPage();
      updateFilters({ ...updateFilters, region: newValue });
    },
    [onResetPage, updateFilters]
  );

  const handleFilterClient = useCallback(
    (event: SelectChangeEvent<string[]>) => {
      const newValue =
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;

      onResetPage();
      updateFilters({ ...updateFilters, client: newValue });
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
        {/* <MenuItem
          onClick={() => {
            menuActions.onClose();
          }}
        >
          <Iconify icon="solar:download-bold" />
          Generate Invoices
        </MenuItem>

        <MenuItem
          onClick={() => {
            menuActions.onClose();
          }}
        >
          <Iconify icon="solar:file-check-bold-duotone" />
          Preview Invoices
        </MenuItem> */}

        <MenuItem
          onClick={() => {
            menuActions.onClose();
          }}
        >
          <Iconify icon="solar:export-bold" />
          Export Invoices
        </MenuItem>

        {/* <MenuItem
          onClick={() => {
            menuActions.onClose();
          }}
        >
          <Iconify icon="custom:send-fill" />
          Send Invoices
        </MenuItem> */}
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
        {/* Invoice Type */}
        <FormControl sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: '100%' } }}>
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

        {/*  Servives (LCT / TCP / HWY)*/}
        <FormControl sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: '100%' } }}>
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
        <FormControl sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: '100%' } }}>
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
        <FormControl sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: '100%' } }}>
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
          sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: '100%' } }}
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
          sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: '100%' } }}
        />

        <Box
          sx={{
            gap: 2,
            width: 1,
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <IconButton onClick={menuActions.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </Box>
      </Box>
      {renderMenuActions()}
    </>
  );
}
