import type { IJobTableFilters } from 'src/types/job';
import type { IDatePickerControl } from 'src/types/common';
import type { UseSetStateReturn } from 'minimal-shared/hooks';

import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { pdf } from '@react-pdf/renderer';
import { useQuery } from '@tanstack/react-query';
import { usePopover } from 'minimal-shared/hooks';
import { memo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
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
import TimesheetPDF from 'src/pages/template/timesheet-pdf';

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

function AdminTimesheetTableToolbarComponent({
  filters,
  onFilters,
  onResetFilters,
  dateError,
  onResetPage,
}: Props) {
  const menuActions = usePopover();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportPDFDialogOpen, setExportPDFDialogOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportPDFLoading, setExportPDFLoading] = useState(false);
  const [exportDateRange, setExportDateRange] = useState({
    startDate: null as IDatePickerControl,
    endDate: null as IDatePickerControl,
  });
  const [exportPDFDateRange, setExportPDFDateRange] = useState({
    startDate: null as IDatePickerControl,
    endDate: null as IDatePickerControl,
  });

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
      params.set('status', 'submitted'); // Only export submitted timesheets

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

  const clientOptions =
    clientsData?.map((client: any) => ({
      id: client.id,
      name: client.name,
      region: client.region,
      city: client.city,
    })) || [];
  const companyOptions =
    companiesData?.map((company: any) => ({
      id: company.id,
      name: company.name,
      region: company.region,
      city: company.city,
    })) || [];
  const siteOptions =
    sitesData?.map((site: any) => ({
      id: site.id,
      name: site.name,
    })) || [];

  const handleFilterName = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setQuery(newValue); // Update local state immediately
    // Parent update is debounced via useEffect above
  }, []);

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
          // Convert minutes to hours for break total
          breakTotal:
            acc.breakTotal + (entry.break_total_minutes ? entry.break_total_minutes / 60 : 0),
        }),
        {
          shiftTotal: 0,
          breakTotal: 0,
        }
      ),
    []
  );

  const generateWorksheetData = useCallback(
    (entries: any[], workerName: string) => {
      const headers = [
        'Date',
        'Job Number',
        'Site Address',
        'Client',
        'Customer',
        'Shift Start',
        'Break',
        'Shift End',
        'Shift Hours',
        'Timesheet Manager',
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

        // Format break duration in hours
        const formatBreak = () => {
          if (entry.break_total_minutes && entry.break_total_minutes > 0) {
            return (entry.break_total_minutes / 60).toFixed(2);
          }
          return hasTimeData ? '0.00' : '-';
        };

        return [
          formatDate(entry.timesheet_date),
          entry.job_number || '',
          entry.site_address || '',
          entry.client_name || '',
          entry.company_name || '',
          formatTime(entry.shift_start),
          formatBreak(),
          formatTime(entry.shift_end),
          formatShiftHours(),
          entry.timesheet_manager || '',
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
        totals.breakTotal > 0 ? totals.breakTotal.toFixed(2) : '0.00',
        '',
        totals.shiftTotal > 0 ? totals.shiftTotal.toFixed(2) : '0.00',
        '',
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
          { wch: 30 }, // Site Address
          { wch: 20 }, // Client
          { wch: 20 }, // Customer
          { wch: 12 }, // Shift Start
          { wch: 12 }, // Break
          { wch: 12 }, // Shift End
          { wch: 12 }, // Shift Hours
          { wch: 20 }, // Timesheet Manager
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
        toast.success(
          `Excel file exported successfully with ${workbook.SheetNames.length} sheets (one per employee) - submitted timesheets!`
        );
      }
      setExportDialogOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export work hours');
    } finally {
      setExportLoading(false);
    }
  }, [exportDateRange, refetchTimesheet, generateWorksheetData]);

  // Export multiple timesheets as one PDF
  const handleExportPDFs = useCallback(async () => {
    if (!exportPDFDateRange.startDate || !exportPDFDateRange.endDate) {
      toast.error('Please select date range');
      return;
    }

    setExportPDFLoading(true);
    try {
      // Fetch all timesheets in the date range
      const params = new URLSearchParams({
        start_date: exportPDFDateRange.startDate.format('YYYY-MM-DD'),
        end_date: exportPDFDateRange.endDate.format('YYYY-MM-DD'),
        status: 'submitted',
        limit: '10000', // Get all timesheets
      });

      const response = await fetcher(`${endpoints.timesheet.admin}?${params.toString()}`);
      const timesheets = response.data?.timesheets || [];

      if (timesheets.length === 0) {
        toast.error('No timesheets found for the selected date range');
        setExportPDFLoading(false);
        return;
      }

      // Sort timesheets by job start date
      const sortedTimesheets = [...timesheets].sort((a: any, b: any) => {
        const dateA = a.job_start_time ? new Date(a.job_start_time).getTime() : 0;
        const dateB = b.job_start_time ? new Date(b.job_start_time).getTime() : 0;
        return dateA - dateB;
      });

      // Fetch PDF data for each timesheet
      const pdfDataPromises = sortedTimesheets.map(async (timesheet: any) => {
        try {
          const pdfResponse = await fetcher(
            endpoints.timesheet.exportPDF.replace(':id', timesheet.id)
          );
          if (pdfResponse.success && pdfResponse.data) {
            // Debug: Check if entries exist
            if (!pdfResponse.data.entries || pdfResponse.data.entries.length === 0) {
              console.warn(
                `⚠️ Timesheet ${timesheet.id} (Job ${pdfResponse.data.job?.job_number}) has no entries - PDF will show empty table`
              );
            }
            return pdfResponse.data;
          }
          return null;
        } catch (error) {
          console.error(`Error fetching PDF data for timesheet ${timesheet.id}:`, error);
          return null;
        }
      });

      const pdfDataArray = await Promise.all(pdfDataPromises);
      const validPdfData = pdfDataArray.filter((data) => data !== null);

      if (validPdfData.length === 0) {
        toast.error('Failed to fetch timesheet data for PDF export');
        setExportPDFLoading(false);
        return;
      }

      // Generate individual PDFs and merge them into one using pdf-lib
      // First, try to use pdf-lib if available
      let blob: Blob;

      try {
        // Try to import pdf-lib
        const pdfLib = await import('pdf-lib');
        const { PDFDocument: PDFLibDocument } = pdfLib;

        // Generate individual PDFs as blobs
        const pdfBlobs = await Promise.all(
          validPdfData.map(async (data: any) => {
            // Verify entries data structure before generating PDF
            if (!data.entries || !Array.isArray(data.entries) || data.entries.length === 0) {
              console.warn(
                `[PDF Generation] Job ${data.job?.job_number} has no entries or entries array is invalid:`,
                data.entries
              );
            }
            const singleBlob = await pdf(<TimesheetPDF timesheetData={data} />).toBlob();
            return singleBlob;
          })
        );

        // Merge all PDFs into one
        const mergedPdf = await PDFLibDocument.create();

        for (const pdfBlob of pdfBlobs) {
          const pdfBytes = await pdfBlob.arrayBuffer();
          const loadedPdf = await PDFLibDocument.load(pdfBytes);
          const pages = await mergedPdf.copyPages(loadedPdf, loadedPdf.getPageIndices());
          pages.forEach((page: any) => mergedPdf.addPage(page));
        }

        // Generate final merged PDF blob
        const mergedPdfBytes = await mergedPdf.save();
        blob = new Blob([mergedPdfBytes as BlobPart], { type: 'application/pdf' });
      } catch (error) {
        // pdf-lib not available - fallback: generate first PDF only
        console.warn('pdf-lib not available, exporting first timesheet only:', error);
        blob = await pdf(<TimesheetPDF timesheetData={validPdfData[0]} />).toBlob();
        toast.warning(
          'PDF merging library not available. Only first timesheet exported. Please install pdf-lib: yarn add pdf-lib'
        );
        setExportPDFDialogOpen(false);
        setExportPDFLoading(false);
        return;
      }

      // Download the merged PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `timesheets-${exportPDFDateRange.startDate.format('YYYY-MM-DD')}-to-${exportPDFDateRange.endDate.format('YYYY-MM-DD')}.pdf`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 300);

      toast.success(
        `PDF file exported successfully with ${validPdfData.length} timesheet(s) in one file!`
      );
      setExportPDFDialogOpen(false);
    } catch (error) {
      console.error('Export PDF error:', error);
      toast.error('Failed to export timesheets as PDF');
    } finally {
      setExportPDFLoading(false);
    }
  }, [exportPDFDateRange]);

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
        <MenuItem
          onClick={() => {
            setExportPDFDialogOpen(true);
            menuActions.onClose();
          }}
        >
          <Iconify icon="solar:export-bold" />
          Export Timesheets
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
          getOptionLabel={(option) => option?.name || ''}
          isOptionEqualToValue={(option, value) => option?.id === value?.id}
          renderInput={(params) => (
            <TextField {...params} label="Company" placeholder="Search company..." />
          )}
          renderTags={() => []}
          renderOption={(props, option, { selected }) => (
            <Box component="li" {...props} key={option?.id}>
              {option?.name}
            </Box>
          )}
          filterOptions={(options, { inputValue }) => {
            const filtered = options.filter((option) =>
              option?.name?.toLowerCase().includes(inputValue.toLowerCase())
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
          getOptionLabel={(option) => option?.name || ''}
          isOptionEqualToValue={(option, value) => option?.id === value?.id}
          renderInput={(params) => (
            <TextField {...params} label="Site" placeholder="Search site..." />
          )}
          renderTags={() => []}
          renderOption={(props, option, { selected }) => (
            <Box component="li" {...props} key={option?.id}>
              {option?.name}
            </Box>
          )}
          filterOptions={(options, { inputValue }) => {
            const filtered = options.filter((option) =>
              option?.name?.toLowerCase().includes(inputValue.toLowerCase())
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
          getOptionLabel={(option) => option?.name || ''}
          isOptionEqualToValue={(option, value) => option?.id === value?.id}
          renderInput={(params) => (
            <TextField {...params} label="Client" placeholder="Search client..." />
          )}
          renderTags={() => []}
          renderOption={(props, option, { selected }) => (
            <Box component="li" {...props} key={option?.id}>
              {option?.name}
            </Box>
          )}
          filterOptions={(options, { inputValue }) => {
            const filtered = options.filter((option) =>
              option?.name?.toLowerCase().includes(inputValue.toLowerCase())
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
            value={query}
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
                  • Employees: All employees with submitted timesheets
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Format: Excel (one sheet per employee)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Note: Only submitted timesheets are included
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

      {/* Export PDF Dialog */}
      <Dialog
        open={exportPDFDialogOpen}
        onClose={() => setExportPDFDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Iconify icon="solar:export-bold" />
            Export Timesheets as PDF
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
                  value={exportPDFDateRange.startDate}
                  onChange={(newValue) =>
                    setExportPDFDateRange((prev) => ({ ...prev, startDate: newValue }))
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                />
                <DatePicker
                  label="End Date"
                  value={exportPDFDateRange.endDate}
                  onChange={(newValue) =>
                    setExportPDFDateRange((prev) => ({ ...prev, endDate: newValue }))
                  }
                  minDate={exportPDFDateRange.startDate || undefined}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Box>
            </Box>

            {/* Export Preview */}
            {exportPDFDateRange.startDate && exportPDFDateRange.endDate && (
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Export Preview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Date Range: {exportPDFDateRange.startDate.format('YYYY-MM-DD')} to{' '}
                  {exportPDFDateRange.endDate.format('YYYY-MM-DD')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Format: PDF (one file with all timesheets)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Order: Sorted by job start date
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Note: Only submitted timesheets are included
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setExportPDFDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleExportPDFs}
            disabled={
              !exportPDFDateRange.startDate || !exportPDFDateRange.endDate || exportPDFLoading
            }
            startIcon={
              exportPDFLoading ? (
                <CircularProgress size={16} />
              ) : (
                <Iconify icon="solar:export-bold" />
              )
            }
          >
            {exportPDFLoading ? 'Exporting...' : 'Export PDF'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export const AdminTimesheetTableToolbar = memo(AdminTimesheetTableToolbarComponent);
