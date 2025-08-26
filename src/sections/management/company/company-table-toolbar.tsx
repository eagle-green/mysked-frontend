import type { ICompanyTableFilters } from 'src/types/company';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { UseSetStateReturn } from 'minimal-shared/hooks';

import * as XLSX from 'xlsx';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePopover } from 'minimal-shared/hooks';

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
  filters: UseSetStateReturn<ICompanyTableFilters>;
  options: {
    regions: string[];
  };
};

export function CompanyTableToolbar({ filters, options, onResetPage }: Props) {
  const menuActions = usePopover();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const { state: currentFilters, setState: updateFilters } = filters;

  // Export query
  const { refetch: refetchCompanies, isFetching: isExporting } = useQuery({
    queryKey: ['companies-export', currentFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentFilters.query) params.set('search', currentFilters.query);
      if (currentFilters.region.length > 0) params.set('region', currentFilters.region.join(','));
      if (currentFilters.status && currentFilters.status !== 'all')
        params.set('status', currentFilters.status);

      const response = await fetcher(`/api/companies/export?${params.toString()}`);
      return response;
    },
    enabled: false, // Don't run automatically
  });

  const generateWorksheetData = useCallback((companies: any[]) => {
    const headers = [
      'Region',
      'Name',
      'Email',
      'Contact Number',
      'Unit Number',
      'Street Number',
      'Street Name',
      'City',
      'Province',
      'Postal Code',
      'Country',
      'Status',
    ];

    const rows = companies.map((company) => [
      company.region || '-',
      company.name || '-',
      company.email || '-',
      company.contact_number || '-',
      company.unit_number || '-',
      company.street_number || '-',
      company.street_name || '-',
      company.city || '-',
      company.province || '-',
      company.postal_code || '-',
      company.country || '-',
      company.status || '-',
    ]);

    return [headers, ...rows];
  }, []);

  const handleExport = useCallback(async () => {
    try {
      const response = await refetchCompanies();
      const data = response.data;

      if (!data || !data.companies || data.companies.length === 0) {
        toast.error('No company data found for export');
        return;
      }

      // Generate Excel workbook
      const workbook = XLSX.utils.book_new();

      // Generate worksheet data
      const worksheetData = generateWorksheetData(data.companies);

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      const columnWidths = [
        { wch: 15 }, // Region
        { wch: 25 }, // Name
        { wch: 25 }, // Email
        { wch: 15 }, // Contact Number
        { wch: 12 }, // Unit Number
        { wch: 12 }, // Street Number
        { wch: 20 }, // Street Name
        { wch: 15 }, // City
        { wch: 15 }, // Province
        { wch: 12 }, // Postal Code
        { wch: 15 }, // Country
        { wch: 12 }, // Status
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Companies');

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `companies_export_${date}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      // Close dialog and show success message
      setExportDialogOpen(false);
      toast.success(`Excel file exported successfully with ${data.companies.length} companies!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export companies data');
    }
  }, [refetchCompanies, generateWorksheetData]);

  const handleFilterQuery = useCallback(
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
        </MenuItem>

        <MenuItem onClick={() => menuActions.onClose()}>
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
          Export Companies
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
        <DialogTitle>Export Companies</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Export company data based on current filters:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Search: {currentFilters.query || 'All companies'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Region:{' '}
            {currentFilters.region.length > 0 ? currentFilters.region.join(', ') : 'All regions'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Status: {currentFilters.status === 'all' ? 'All statuses' : currentFilters.status}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            • Format: Excel (.xlsx)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Columns: Region, Name, Email, Contact Number, Unit Number, Street Number, Street Name,
            City, Province, Postal Code, Country, Status
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
