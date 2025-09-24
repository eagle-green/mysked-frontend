import type { IJobTableFilters } from 'src/types/job';
import type { IDatePickerControl } from 'src/types/common';
import type { UseSetStateReturn } from 'minimal-shared/hooks';

import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CircularProgress from '@mui/material/CircularProgress';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  dateError: boolean;
  onResetPage: () => void;
  filters: UseSetStateReturn<IJobTableFilters>;
  onFilters: (name: string, value: any) => void;
  onResetFilters: () => void;
};

export function AdminTimesheetTableToolbar({
  filters,
  onFilters,
  onResetFilters,
  dateError,
  onResetPage,
}: Props) {
  const menuActions = usePopover();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportDateRange, setExportDateRange] = useState({
    startDate: null as IDatePickerControl,
    endDate: null as IDatePickerControl,
  });
  const [exportOnlyApproved, setExportOnlyApproved] = useState(true);

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

  // Fetch timesheet data for export
  const { refetch: refetchTimesheet } = useQuery({
    queryKey: ['timesheet-export', exportDateRange],
    queryFn: async () => {
      if (!exportDateRange.startDate || !exportDateRange.endDate) {
        return { workers: [] };
      }

      const params = new URLSearchParams();
      params.set('start_date', exportDateRange.startDate.format('YYYY-MM-DD'));
      params.set('end_date', exportDateRange.endDate.format('YYYY-MM-DD'));
      params.set('only_approved', exportOnlyApproved.toString());

      // Use the correct backend export endpoint
      const response = await fetcher(`/api/timesheets/export?${params.toString()}`);

      // Make sure we return the data properly
      if (response && response.success && response.workers) {
        return response;
      } else {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response structure from backend');
      }
    },
    enabled: false, // Don't fetch automatically
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

  const calculateTotals = useCallback(
    (entries: any[]) =>
      entries.reduce(
        (acc, entry) => ({
          // Convert minutes to hours for shift total
          shiftTotal:
            acc.shiftTotal + (entry.shift_total_minutes ? entry.shift_total_minutes / 60 : 0),
          // Use correct backend field names for travel distances
          travelTo: acc.travelTo + (parseFloat(entry.travel_to_km) || 0),
          travelDuring: acc.travelDuring + (parseFloat(entry.travel_during_km) || 0),
          travelFrom: acc.travelFrom + (parseFloat(entry.travel_from_km) || 0),
        }),
        {
          shiftTotal: 0,
          travelTo: 0,
          travelDuring: 0,
          travelFrom: 0,
        }
      ),
    []
  );

  const generateWorksheetData = useCallback(
    (entries: any[], workerName: string) => {
      const headers = [
        'Date',
        'Job Number',
        'Site Name',
        'Site Address',
        'Client',
        'Company',
        'Travel Start',
        'Shift Start',
        'Break Start',
        'Break End',
        'Shift End',
        'Travel End',
        'Shift Hours',
        'Travel To (km)',
        'Travel During (km)',
        'Travel From (km)',
        'Timesheet Manager',
        'Status',
        'Approved By',
      ];

      const rows = entries.map((entry: any) => {
        // Check if this entry has actual time data
        const hasTimeData =
          entry.shift_start || entry.shift_end || entry.travel_start || entry.travel_end;

        // Format date nicely
        const formatDate = (dateString: string) => {
          if (!dateString) return '';
          try {
            return dayjs(dateString).format('MMM DD, YYYY');
          } catch {
            return dateString;
          }
        };

        // Format time nicely
        const formatTime = (timeString: string) => {
          if (!timeString) return hasTimeData ? '-' : ''; // Empty cell instead of "Not Recorded"
          if (timeString === 'Draft - No Data') return ''; // Empty cell
          return timeString;
        };

        // Format shift hours
        const formatShiftHours = () => {
          if (entry.shift_total_minutes && entry.shift_total_minutes > 0) {
            return (entry.shift_total_minutes / 60).toFixed(2);
          }
          return hasTimeData ? '0.00' : '-'; // Show "-" for no data
        };

        return [
          formatDate(entry.timesheet_date),
          entry.job_number || '',
          entry.site_name || '',
          entry.site_address || '',
          entry.client_name || '',
          entry.company_name || '',
          formatTime(entry.travel_start),
          formatTime(entry.shift_start),
          formatTime(entry.break_start),
          formatTime(entry.break_end),
          formatTime(entry.shift_end),
          formatTime(entry.travel_end),
          formatShiftHours(),
          entry.travel_to_km || '0.00',
          entry.travel_during_km || '0.00',
          entry.travel_from_km || '0.00',
          entry.timesheet_manager || '',
          entry.timesheet_status || '',
          entry.approved_by || '',
        ];
      });

      // Add totals row with better formatting
      const totals = calculateTotals(entries);
      rows.push([
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        totals.shiftTotal > 0 ? totals.shiftTotal.toFixed(2) : '0.00',
        totals.travelTo > 0 ? totals.travelTo.toFixed(2) : '0.00',
        totals.travelDuring > 0 ? totals.travelDuring.toFixed(2) : '0.00',
        totals.travelFrom > 0 ? totals.travelFrom.toFixed(2) : '0.00',
        '',
        '',
        '', // Empty cells for Timesheet Manager, Status, and Approved By columns
      ]);

      return [headers, ...rows];
    },
    [calculateTotals]
  );

  // Export functionality
  const handleExportWorkHours = useCallback(async () => {
    if (!exportDateRange.startDate || !exportDateRange.endDate) {
      toast.error('Please select date range');
      return;
    }

    setExportLoading(true);
    try {
      let workers: any[] = [];
      try {
        const data = await refetchTimesheet();

        const responseData = data.data || data;

        workers = responseData?.workers || [];

        if (workers.length === 0) {
          console.error('🔍 Frontend: ERROR - Workers array is empty!');
          console.error('🔍 Frontend: Full response data for debugging:', data);
          toast.error('No timesheet data found for the selected criteria');
          return;
        }
      } catch (error) {
        console.error('🔍 Frontend: ERROR during refetchTimesheet:', error);
        toast.error('Failed to fetch timesheet data');
        return;
      }

      // Generate Excel file with multiple sheets (one per worker)
      const workbook = XLSX.utils.book_new();

      workers.forEach((worker: any) => {
        if (!worker.entries || worker.entries.length === 0) {
          return;
        }

        // Generate worksheet data for this worker
        const worksheetData = generateWorksheetData(
          worker.entries,
          `${worker.first_name} ${worker.last_name}`
        );

        // Create worksheet with explicit cell references for better styling control
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // Set column widths for better readability
        const columnWidths = [
          { wch: 12 }, // Date
          { wch: 10 }, // Job Number
          { wch: 15 }, // Site Name
          { wch: 30 }, // Site Address
          { wch: 20 }, // Client
          { wch: 20 }, // Company
          { wch: 12 }, // Travel Start
          { wch: 12 }, // Shift Start
          { wch: 12 }, // Break Start
          { wch: 12 }, // Break End
          { wch: 12 }, // Shift End
          { wch: 12 }, // Travel End
          { wch: 12 }, // Shift Hours
          { wch: 12 }, // Travel To (km)
          { wch: 12 }, // Travel During (km)
          { wch: 12 }, // Travel From (km)
          { wch: 20 }, // Timesheet Manager
          { wch: 12 }, // Status
          { wch: 20 }, // Approved By
        ];
        worksheet['!cols'] = columnWidths;

        // Add worksheet to workbook with worker name as sheet name (no underscore)
        const sheetName = `${worker.first_name} ${worker.last_name}`.substring(0, 31); // Excel sheet names limited to 31 chars
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });

      // Generate filename
      const filename = `work-hours-${exportDateRange.startDate?.format('YYYY-MM-DD')}-to-${exportDateRange.endDate?.format('YYYY-MM-DD')}.xlsx`;

      // Download Excel file with styling options
      const wopts = {
        bookType: 'xlsx' as const,
        bookSST: false,
        type: 'binary' as const,
        cellStyles: true,
      };

      XLSX.writeFile(workbook, filename, wopts);

      // Show appropriate success message
      if (workers.length === 0) {
        toast.success(`Export completed! No timesheet data found for the selected criteria.`);
      } else {
        const statusFilter = exportOnlyApproved ? 'approved' : 'all';
        toast.success(
          `Excel file exported successfully with ${workbook.SheetNames.length} sheets (one per employee) - ${statusFilter} timesheets!`
        );
      }
      setExportDialogOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export work hours');
    } finally {
      setExportLoading(false);
    }
  }, [exportDateRange, refetchTimesheet, generateWorksheetData, exportOnlyApproved]);

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <MenuItem
          onClick={() => {
            setExportDialogOpen(true);
            menuActions.onClose();
          }}
        >
          <Iconify icon="solar:export-bold" />
          Export work hrs
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
          label="Start Date"
          value={currentFilters.startDate}
          onChange={handleFilterStartDate}
          slotProps={{ textField: { fullWidth: true } }}
        />

        <DatePicker
          label="End Date"
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
            sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%' } }}
            value={currentFilters.query}
            onChange={handleFilterName}
            placeholder="Search timesheet..."
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
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Iconify icon="solar:export-bold" />
            Export Work Hours
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            {/* Date Range Selection */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Select Date Range
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <DatePicker
                  label="Start Date"
                  value={exportDateRange.startDate}
                  onChange={(newValue) =>
                    setExportDateRange((prev) => ({ ...prev, startDate: newValue }))
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                />
                <DatePicker
                  label="End Date"
                  value={exportDateRange.endDate}
                  onChange={(newValue) =>
                    setExportDateRange((prev) => ({ ...prev, endDate: newValue }))
                  }
                  minDate={exportDateRange.startDate || undefined}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Box>
            </Box>

            {/* Export Options */}
            <Box>
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
                  <Typography variant="body2">Only export approved timesheets</Typography>
                </label>
              </Box>
            </Box>

            {/* Export Preview */}
            {exportDateRange.startDate && exportDateRange.endDate && (
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Export Preview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Date Range: {exportDateRange.startDate.format('YYYY-MM-DD')} to{' '}
                  {exportDateRange.endDate.format('YYYY-MM-DD')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Employees: All employees with {exportOnlyApproved ? 'approved' : 'all'}{' '}
                  timesheets
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Format: Excel (one sheet per employee)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Note:{' '}
                  {exportOnlyApproved
                    ? 'Only approved timesheets are included'
                    : 'All timesheet statuses are included'}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleExportWorkHours}
            disabled={!exportDateRange.startDate || !exportDateRange.endDate || exportLoading}
            startIcon={
              exportLoading ? <CircularProgress size={16} /> : <Iconify icon="solar:export-bold" />
            }
          >
            {exportLoading ? 'Exporting...' : 'Export Excel'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
