import type { IVehicleTableFilters } from 'src/types/vehicle';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { UseSetStateReturn } from 'minimal-shared/hooks';

import * as XLSX from 'xlsx';
import { useQuery } from '@tanstack/react-query';
import { usePopover } from 'minimal-shared/hooks';
import { memo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import OutlinedInput from '@mui/material/OutlinedInput';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { fetcher } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  onResetPage: () => void;
  filters: UseSetStateReturn<IVehicleTableFilters>;
  options: {
    regions: string[];
    types: Array<{ value: string; label: string }>;
  };
};

function VehicleTableToolbarComponent({ filters, options, onResetPage }: Props) {
  const menuActions = usePopover();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const { state: currentFilters, setState: updateFilters } = filters;
  const [query, setQuery] = useState<string>(currentFilters.query || '');

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

  // Export query
  const { refetch: refetchVehicles, isFetching: isExporting } = useQuery({
    queryKey: ['vehicles-export', currentFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentFilters.query) params.set('search', currentFilters.query);
      if (currentFilters.status && currentFilters.status !== 'all')
        params.set('status', currentFilters.status);
      if (currentFilters.type.length > 0) params.set('type', currentFilters.type.join(','));
      if (currentFilters.region.length > 0) params.set('region', currentFilters.region.join(','));

      const response = await fetcher(`/api/vehicles/export?${params.toString()}`);
      return response;
    },
    enabled: false, // Don't run automatically
  });

  const generateWorksheetData = useCallback((vehicles: any[]) => {
    const headers = [
      'License Plate',
      'Type',
      'Region',
      'Unit Number',
      'Status',
      'Info',
      'Year',
      'Location',
      'Spare Key',
      'Winter Tires',
      'Tow Hitch',
      'Notes',
      'Assigned Driver',
    ];

    const rows = vehicles.map((vehicle) => [
      vehicle.license_plate || '',
      vehicle.type ? vehicle.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : '',
      vehicle.region || '',
      vehicle.unit_number || '',
      vehicle.status || '',
      vehicle.info || '',
      vehicle.year || '',
      vehicle.location || '',
      vehicle.is_spare_key ? 'Yes' : 'No',
      vehicle.is_winter_tire ? 'Yes' : 'No',
      vehicle.is_tow_hitch ? 'Yes' : 'No',
      vehicle.note || '',
      vehicle.assigned_driver_first_name && vehicle.assigned_driver_last_name
        ? `${vehicle.assigned_driver_first_name} ${vehicle.assigned_driver_last_name}`
        : '',
    ]);

    return [headers, ...rows];
  }, []);

  const handleExport = useCallback(async () => {
    try {
      const response = await refetchVehicles();
      const data = response.data;

      if (!data || !data.vehicles || data.vehicles.length === 0) {
        toast.error('No vehicle data found for export');
        return;
      }

      // Generate Excel workbook
      const workbook = XLSX.utils.book_new();

      // Generate worksheet data
      const worksheetData = generateWorksheetData(data.vehicles);

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      const columnWidths = [
        { wch: 15 }, // License Plate
        { wch: 15 }, // Type
        { wch: 15 }, // Region
        { wch: 12 }, // Unit Number
        { wch: 12 }, // Status
        { wch: 20 }, // Info
        { wch: 10 }, // Year
        { wch: 20 }, // Location
        { wch: 12 }, // Spare Key
        { wch: 12 }, // Winter Tires
        { wch: 12 }, // Tow Hitch
        { wch: 30 }, // Notes
        { wch: 20 }, // Assigned Driver
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Vehicles');

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `vehicles_export_${date}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      // Close dialog and show success message
      setExportDialogOpen(false);
      toast.success(`Excel file exported successfully with ${data.vehicles.length} vehicles!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export vehicles data');
    }
  }, [refetchVehicles, generateWorksheetData]);

  const handleFilterQuery = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setQuery(newValue); // Update local state immediately
      // Parent update is debounced via useEffect above
    },
    []
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

  const handleFilterType = useCallback(
    (event: SelectChangeEvent<string[]>) => {
      const newValue =
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;

      onResetPage();
      updateFilters({ type: newValue });
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
        {/* <MenuItem onClick={() => menuActions.onClose()}>
          <Iconify icon="solar:printer-minimalistic-bold" />
          Print
        </MenuItem> */}

        {/* <MenuItem onClick={() => menuActions.onClose()}>
          <Iconify icon="solar:import-bold" />
          Import
        </MenuItem> */}

        <MenuItem
          onClick={() => {
            setExportDialogOpen(true);
            menuActions.onClose();
          }}
        >
          <Iconify icon="solar:export-bold" />
          Export Vehicles
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

        <FormControl sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 200 } }}>
          <InputLabel htmlFor="filter-type-select">Type</InputLabel>
          <Select
            multiple
            value={currentFilters.type}
            onChange={handleFilterType}
            input={<OutlinedInput label="Type" />}
            renderValue={(selected) =>
              selected
                .map(
                  (value) => options.types.find((option) => option.value === value)?.label || value
                )
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
            value={query}
            onChange={handleFilterQuery}
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

          <IconButton onClick={menuActions.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </Box>
      </Box>

      {renderMenuActions()}

      {/* Export Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Export Vehicles</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Export vehicle data based on current filters:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Search: {currentFilters.query || 'All vehicles'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Status: {currentFilters.status === 'all' ? 'All statuses' : currentFilters.status}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Type: {currentFilters.type.length > 0 ? currentFilters.type.join(', ') : 'All types'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Region:{' '}
            {currentFilters.region.length > 0 ? currentFilters.region.join(', ') : 'All regions'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            • Format: Excel (.xlsx)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Columns: License Plate, Type, Region, Unit Number, Status, Info, Year, Location, Spare
            Key, Winter Tires, Tow Hitch, Notes, Assigned Driver
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={isExporting}
            startIcon={
              isExporting ? <CircularProgress size={20} /> : <Iconify icon="solar:export-bold" />
            }
          >
            {isExporting ? 'Exporting...' : 'Export Excel'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export const VehicleTableToolbar = memo(VehicleTableToolbarComponent);
