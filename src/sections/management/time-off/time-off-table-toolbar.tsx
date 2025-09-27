import type { SelectChangeEvent } from '@mui/material/Select';

import * as XLSX from 'xlsx';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CircularProgress from '@mui/material/CircularProgress';

import { fetcher } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  filters: any;
  onResetPage: VoidFunction;
  options: {
    types: any[];
  };
  dateError?: boolean;
};

export function TimeOffTableToolbar({ 
  filters, 
  onResetPage, 
  options, 
  dateError 
}: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;
  const menuActions = usePopover();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportOnlyApproved, setExportOnlyApproved] = useState(true); // Default to approved only
  const [showFilters, setShowFilters] = useState(false);


  // Export query
  const { refetch: refetchTimeOff, isFetching: isExporting } = useQuery({
    queryKey: ['time-off-export', currentFilters, exportOnlyApproved],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentFilters.query) params.set('search', currentFilters.query);
      if (currentFilters.status && currentFilters.status !== 'all') params.set('status', currentFilters.status);
      if (currentFilters.type.length > 0) params.set('type', currentFilters.type.join(','));
      if (currentFilters.startDate) params.set('start_date', currentFilters.startDate.toISOString());
      if (currentFilters.endDate) params.set('end_date', currentFilters.endDate.toISOString());
      params.set('only_approved', exportOnlyApproved.toString());
      
      const response = await fetcher(`/api/time-off/admin/export?${params.toString()}`);
      return response;
    },
    enabled: false, // Don't run automatically
  });

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
      updateFilters({ type: newValue });
    },
    [onResetPage, updateFilters]
  );

  const generateWorksheetData = useCallback((timeOffRequests: any[]) => {
    // Use appropriate header based on export filter
    const approverHeader = exportOnlyApproved ? 'Approved By' : 'Confirmed By';
    const headers = [
      'Employee', 'Type', 'Date Range', 'Status', approverHeader, 'Reason', 'Admin Notes', 'Submit Date'
    ];
    const rows = timeOffRequests.map((request) => [
      `${request.requester_first_name} ${request.requester_last_name}`,
      request.type || '-',
      request.start_date === request.end_date 
        ? new Date(request.start_date).toLocaleDateString()
        : `${new Date(request.start_date).toLocaleDateString()} - ${new Date(request.end_date).toLocaleDateString()}`,
      request.status || '-',
      request.confirmed_by || '-',
      request.reason || '-',
      request.admin_notes || '-',
      new Date(request.submit_date).toLocaleDateString(),
    ]);
    return [headers, ...rows];
  }, [exportOnlyApproved]);

  const handleExport = useCallback(async () => {
    try {
      const response = await refetchTimeOff();
      const data = response.data;

      if (!data || !data.timeOffRequests || data.timeOffRequests.length === 0) {
        toast.error('No time-off data found for export');
        return;
      }

      // Generate Excel workbook
      const workbook = XLSX.utils.book_new();

      // Generate worksheet data
      const worksheetData = generateWorksheetData(data.timeOffRequests);

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      const columnWidths = [
        { wch: 20 }, // Employee
        { wch: 15 }, // Type
        { wch: 20 }, // Date Range
        { wch: 12 }, // Status
        { wch: 15 }, // Confirmed/Approved By
        { wch: 30 }, // Reason
        { wch: 30 }, // Admin Notes
        { wch: 20 }, // Submit Date
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Time Off Requests');

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `time_off_export_${date}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      // Close dialog and show success message
      setExportDialogOpen(false);
      toast.success(`Excel file exported successfully with ${data.timeOffRequests.length} time-off requests!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export time-off requests. Please try again.');
    }
  }, [refetchTimeOff, generateWorksheetData]);



  return (
    <>
      {/* Mobile Search Bar */}
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
          value={currentFilters.query || ''}
          onChange={(event) => handleFilters('query', event.target.value)}
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

      {/* Desktop Filters */}
      <Box
        sx={{
          p: 2.5,
          gap: 2,
          display: { xs: 'none', md: 'flex' },
          pr: { xs: 2.5, md: 1 },
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-end', md: 'center' },
        }}
      >
      <FormControl sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 200 } }}>
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

      <DatePicker
        label="Start date"
        value={currentFilters.startDate}
        onChange={(newValue) => handleFilters('startDate', newValue)}
        slotProps={{ textField: { fullWidth: true } }}
        sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 180 } }}
      />

      <DatePicker
        label="End date"
        value={currentFilters.endDate}
        onChange={(newValue) => handleFilters('endDate', newValue)}
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
          onChange={(event) => handleFilters('query', event.target.value)}
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

      {/* Mobile Collapsible Filters */}
      <Collapse in={showFilters}>
        <Box
          sx={{
            p: 2,
            gap: 2,
            display: { xs: 'flex', md: 'none' },
            flexDirection: 'column',
          }}
        >
          <FormControl sx={{ width: 1 }}>
            <InputLabel htmlFor="filter-type-select-mobile">Type</InputLabel>
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
              inputProps={{ id: 'filter-type-select-mobile' }}
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

          <DatePicker
            label="Start date"
            value={currentFilters.startDate}
            onChange={(newValue) => handleFilters('startDate', newValue)}
            slotProps={{ textField: { fullWidth: true } }}
            sx={{ width: 1 }}
          />

          <DatePicker
            label="End date"
            value={currentFilters.endDate}
            onChange={(newValue) => handleFilters('endDate', newValue)}
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

      <CustomPopover
        open={menuActions.open}
        anchorEl={menuActions.anchorEl}
        onClose={menuActions.onClose}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              setExportDialogOpen(true);
              menuActions.onClose();
            }}
          >
            <Iconify icon="solar:export-bold" />
            Export Time Off
          </MenuItem>
        </MenuList>
      </CustomPopover>

      {/* Export Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Export Time Off Requests</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Export time-off request data based on current filters:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Search: {currentFilters.query || 'All requests'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Status: {currentFilters.status === 'all' ? 'All statuses' : currentFilters.status}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Type: {currentFilters.type.length > 0 ? currentFilters.type.join(', ') : 'All types'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Date Range: {currentFilters.startDate && currentFilters.endDate 
              ? `${currentFilters.startDate.toLocaleDateString()} - ${currentFilters.endDate.toLocaleDateString()}`
              : 'All dates'}
          </Typography>
          
          {/* Export Options */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Export Options
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Checkbox
                id="exportOnlyApproved"
                checked={exportOnlyApproved}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setExportOnlyApproved(e.target.checked)
                }
                sx={{ p: 0 }}
              />
              <label
                htmlFor="exportOnlyApproved"
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <Typography variant="body2">Only export approved requests</Typography>
              </label>
            </Box>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            • Format: Excel (.xlsx)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Columns: Employee, Type, Date Range, Status, {exportOnlyApproved ? 'Approved By' : 'Confirmed By'}, Reason, Admin Notes, Submit Date
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