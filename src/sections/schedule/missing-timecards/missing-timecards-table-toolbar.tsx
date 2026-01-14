import type { UseSetStateReturn } from 'minimal-shared/hooks';

import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { usePopover } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { fetcher, endpoints } from 'src/lib/axios';
import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';

import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

import type { MissingTimecardsFilters } from './view/missing-timecards-list-view';

// ----------------------------------------------------------------------

type Props = {
  dateError: boolean;
  onResetPage: () => void;
  filters: UseSetStateReturn<MissingTimecardsFilters>;
  onFilters: (name: string, value: any) => void;
  onResetFilters: () => void;
  summary?: {
    totalMissing: number;
    missingThisWeek: number;
    missingByClient: Array<{ client_name: string; count: number }>;
    missingByTimesheetManager: Array<{
      manager_name: string;
      manager_email: string;
      count: number;
    }>;
    missingByDate: Array<{ date: string; count: number }>;
    urgentMissing: number;
  } | null;
};

export function MissingTimecardsTableToolbar({
  filters,
  onFilters,
  onResetFilters,
  dateError,
  onResetPage,
  summary,
}: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;
  const [query, setQuery] = useState<string>(currentFilters.query || '');
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingSimple, setIsExportingSimple] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [simpleExportDialogOpen, setSimpleExportDialogOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<dayjs.Dayjs | null>(null);
  const [exportEndDate, setExportEndDate] = useState<dayjs.Dayjs | null>(null);
  const [simpleExportStartDate, setSimpleExportStartDate] = useState<dayjs.Dayjs | null>(null);
  const [simpleExportEndDate, setSimpleExportEndDate] = useState<dayjs.Dayjs | null>(null);
  const [exportDateError, setExportDateError] = useState(false);
  const [simpleExportDateError, setSimpleExportDateError] = useState(false);
  const menuActions = usePopover();

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
      return response.clients || [];
    },
  });

  const clientOptions =
    clientsData?.map((client: any) => ({
      id: client.id,
      name: client.name,
    })) || [];


  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setQuery(newValue); // Update local state immediately
      // Parent update is debounced via useEffect above
    },
    []
  );

  const handleFilterStartDate = useCallback(
    (newValue: dayjs.Dayjs | null) => {
      onResetPage();
      if (!newValue) {
        updateFilters({ startDate: null, endDate: null });
        return;
      }

      const normalizedStart = newValue.startOf('day');
      const normalizedEnd = newValue.endOf('day');

      // Automatically set end date to same as start date for single-day filtering
      updateFilters({ startDate: normalizedStart, endDate: normalizedEnd });
    },
    [onResetPage, updateFilters]
  );

  const handleFilterEndDate = useCallback(
    (newValue: dayjs.Dayjs | null) => {
      onResetPage();
      updateFilters({ endDate: newValue ? newValue.endOf('day') : null });
    },
    [onResetPage, updateFilters]
  );

  // Calculate current week (Monday to Sunday)
  const getCurrentWeekRange = useCallback(() => {
    const today = dayjs();
    const dayOfWeek = today.day(); // 0 = Sunday, 1 = Monday, etc.

    // Calculate days to subtract to get to this Monday
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If today is Sunday, go back 6 days, otherwise go back (dayOfWeek - 1) days

    const thisMonday = today.subtract(daysToMonday, 'day').startOf('day');
    const thisSunday = thisMonday.add(6, 'day').endOf('day');

    return { start: thisMonday, end: thisSunday };
  }, []);

  // Calculate week ranges for current month (Week 1, 2, 3, 4)
  const getWeekRange = useCallback((weekNumber: number) => {
    const today = dayjs();
    const firstDayOfMonth = today.startOf('month');
    const firstMonday =
      firstDayOfMonth.day() === 1
        ? firstDayOfMonth
        : firstDayOfMonth.add(8 - firstDayOfMonth.day(), 'day');

    // Calculate the start of the requested week
    const weekStart = firstMonday.add((weekNumber - 1) * 7, 'day');
    const weekEnd = weekStart.add(6, 'day').endOf('day');

    return { start: weekStart, end: weekEnd };
  }, []);

  const handleOpenExportDialog = useCallback(() => {
    setExportDialogOpen(true);
    // Initialize with current week (Monday to Sunday)
    const currentWeek = getCurrentWeekRange();
    setExportStartDate(currentWeek.start);
    setExportEndDate(currentWeek.end);
    setExportDateError(false);
  }, [getCurrentWeekRange]);

  const handleCloseExportDialog = useCallback(() => {
    setExportDialogOpen(false);
    setExportDateError(false);
  }, []);

  const handleExportConfirm = useCallback(async () => {
    // Validate dates
    if (!exportStartDate || !exportEndDate) {
      setExportDateError(true);
      toast.error('Please select both start and end dates');
      return;
    }

    if (exportStartDate.isAfter(exportEndDate)) {
      setExportDateError(true);
      toast.error('Start date must be before end date');
      return;
    }

    setIsExporting(true);
    setExportDialogOpen(false);

    try {
      const params = new URLSearchParams({
        startDate: exportStartDate.format('YYYY-MM-DD'),
        endDate: exportEndDate.format('YYYY-MM-DD'),
        include_field_team: 'true',
        status: 'overdue', // Only export overdue timesheets
      });

      // Fetch missing timecards data (not the export endpoint, we need full data)
      const response = await fetcher(
        `${endpoints.work.missingTimecards}?${params.toString()}`
      );

      const missingTimecards: any[] = response?.data || [];

      if (missingTimecards.length === 0) {
        toast.error('No overdue missing timesheets found for export');
        setIsExporting(false);
        return;
      }

      // Filter for overdue only (shift_date < today)
      const today = dayjs().format('YYYY-MM-DD');
      const overdueTimecards = missingTimecards.filter(
        (tc) => tc.shift_date < today
      );

      if (overdueTimecards.length === 0) {
        toast.error('No overdue missing timesheets found for export');
        setIsExporting(false);
        return;
      }

      // Group by job_id
      const jobsMap = new Map<string, any>();
      overdueTimecards.forEach((tc) => {
        const jobId = tc.job_id;
        if (!jobsMap.has(jobId)) {
          jobsMap.set(jobId, {
            job_id: tc.job_id,
            job_number: tc.job_number,
            po_number: tc.po_number,
            nw_number: tc.nw_number,
            site_name: tc.site_name,
            site_address: tc.site_address,
            client_name: tc.client_name,
            company_name: tc.company_name,
            shift_date: tc.shift_date,
            timesheet_manager_name: tc.timesheet_manager_name,
            job_notes: tc.job_notes,
            workers: [],
          });
        }
        // Add workers to this job
        if (tc.missing_field_team_members && tc.missing_field_team_members.length > 0) {
          jobsMap.get(jobId)!.workers.push(...tc.missing_field_team_members);
        }
      });

      // Generate Excel workbook
      const workbook = XLSX.utils.book_new();

      // Create one sheet per job
      jobsMap.forEach((jobData, jobId) => {
        const sheetName = String(jobData.job_number).replace(/[/\\?*[\]]/g, '_').substring(0, 31); // Excel sheet name limit is 31 chars

        // Header row
        const headers = [
          'Job Number',
          'PO | NW',
          'Site',
          'Site Address',
          'Client',
          'Customer',
          'Job Date',
          'Timesheet Manager',
        ];

        // Job info row (single row with job details)
        const jobInfoRow = [
          jobData.job_number || '',
          jobData.po_number || jobData.nw_number || '',
          jobData.site_name || 'N/A',
          jobData.site_address || 'N/A',
          jobData.client_name || 'N/A',
          jobData.company_name || 'N/A',
          jobData.shift_date ? dayjs(jobData.shift_date).format('MMM DD, YYYY') : 'N/A',
          jobData.timesheet_manager_name || 'N/A',
        ];

        // Worker headers
        const workerHeaders = ['Position', 'Employee', 'Start Time', 'End Time'];

        // Worker rows
        const workerRows = jobData.workers.map((worker: any) => {
          // Format position label
          const positionLabel =
            JOB_POSITION_OPTIONS.find((option) => option.value === worker.position)?.label ||
            worker.position ||
            'N/A';

          return [
            positionLabel,
            worker.worker_name || 'N/A',
            worker.start_time ? dayjs(worker.start_time).format('h:mm A') : 'N/A',
            worker.end_time ? dayjs(worker.end_time).format('h:mm A') : 'N/A',
          ];
        });

        // Combine all rows
        const allRows = [
          headers,
          jobInfoRow,
          [], // Empty row separator
          workerHeaders,
          ...workerRows,
        ];

        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(allRows);

        // Set column widths
        worksheet['!cols'] = [
          { wch: 12 }, // Job Number
          { wch: 12 }, // PO | NW
          { wch: 25 }, // Site
          { wch: 40 }, // Site Address
          { wch: 20 }, // Client
          { wch: 20 }, // Customer
          { wch: 15 }, // Job Date
          { wch: 25 }, // Timesheet Manager
        ];

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });

      // Generate filename
      const filename = `Missing_Timesheets_${exportStartDate.format('YYYY-MM-DD')}_to_${exportEndDate.format('YYYY-MM-DD')}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      toast.success(`Exported ${jobsMap.size} overdue missing timesheets to Excel successfully!`);
    } catch (error: any) {
      console.error('Export error:', error);
      const errorMessage = error?.error || error?.message || 'Failed to export missing timesheets';
      toast.error(errorMessage);
    } finally {
      setIsExporting(false);
    }
  }, [exportStartDate, exportEndDate]);

  const handleOpenSimpleExportDialog = useCallback(() => {
    setSimpleExportDialogOpen(true);
    // Initialize with current week (Monday to Sunday)
    const currentWeek = getCurrentWeekRange();
    setSimpleExportStartDate(currentWeek.start);
    setSimpleExportEndDate(currentWeek.end);
    setSimpleExportDateError(false);
  }, [getCurrentWeekRange]);

  const handleCloseSimpleExportDialog = useCallback(() => {
    setSimpleExportDialogOpen(false);
    setSimpleExportDateError(false);
  }, []);

  const handleSimpleExportConfirm = useCallback(async () => {
    // Validate dates
    if (!simpleExportStartDate || !simpleExportEndDate) {
      setSimpleExportDateError(true);
      toast.error('Please select both start and end dates');
      return;
    }

    if (simpleExportStartDate.isAfter(simpleExportEndDate)) {
      setSimpleExportDateError(true);
      toast.error('Start date must be before end date');
      return;
    }

    setIsExportingSimple(true);
    setSimpleExportDialogOpen(false);

    try {
      const params = new URLSearchParams({
        startDate: simpleExportStartDate.format('YYYY-MM-DD'),
        endDate: simpleExportEndDate.format('YYYY-MM-DD'),
        include_field_team: 'true',
        status: 'overdue', // Only export overdue timesheets
      });

      // Fetch missing timecards data
      const response = await fetcher(
        `${endpoints.work.missingTimecards}?${params.toString()}`
      );

      const missingTimecards: any[] = response?.data || [];

      if (missingTimecards.length === 0) {
        toast.error('No overdue missing timesheets found for export');
        setIsExportingSimple(false);
        return;
      }

      // Filter for overdue only (shift_date < today)
      const today = dayjs().format('YYYY-MM-DD');
      const overdueTimecards = missingTimecards.filter(
        (tc) => tc.shift_date < today
      );

      if (overdueTimecards.length === 0) {
        toast.error('No overdue missing timesheets found for export');
        setIsExportingSimple(false);
        return;
      }

      // Prepare data for simple export with grouping by job number
      const exportData: any[] = [];
      let previousJobNumber = '';

      overdueTimecards.forEach((tc) => {
        if (tc.missing_field_team_members && tc.missing_field_team_members.length > 0) {
          // Add empty row between different job numbers for grouping
          if (previousJobNumber && previousJobNumber !== tc.job_number) {
            exportData.push({
              'Customer': '',
              'Job Shift Date': '',
              'Job Notes': '',
              'Timesheet #': '',
              'Assigned Employee': '',
            });
          }
          previousJobNumber = tc.job_number;

          tc.missing_field_team_members.forEach((worker: any) => {
            exportData.push({
              'Customer': tc.company_name || 'N/A',
              'Job Shift Date': tc.shift_date ? dayjs(tc.shift_date).format('MMM DD, YYYY') : 'N/A',
              'Job Notes': tc.job_notes || '',
              'Timesheet #': tc.job_number || 'N/A',
              'Assigned Employee': worker.worker_name || 'N/A',
            });
          });
        }
      });

      if (exportData.length === 0) {
        toast.error('No workers found in missing timesheets');
        setIsExportingSimple(false);
        return;
      }

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Missing Timesheets');

      // Auto-size columns
      const maxWidth = 50;
      const columnWidths = Object.keys(exportData[0] || {}).map((key) => {
        const maxLength = Math.max(
          key.length,
          ...exportData.map((row) => String(row[key] || '').length)
        );
        return { wch: Math.min(maxLength + 2, maxWidth) };
      });
      worksheet['!cols'] = columnWidths;

      // Generate filename
      const filename = `Missing_Timesheets_Simple_${simpleExportStartDate.format('YYYY-MM-DD')}_to_${simpleExportEndDate.format('YYYY-MM-DD')}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      toast.success(`Exported ${exportData.length} missing timesheet entries to Excel successfully!`);
    } catch (error: any) {
      console.error('Simple export error:', error);
      const errorMessage = error?.error || error?.message || 'Failed to export missing timesheets';
      toast.error(errorMessage);
    } finally {
      setIsExportingSimple(false);
    }
  }, [simpleExportStartDate, simpleExportEndDate]);

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
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option?.id}>
            {option?.name}
          </Box>
        )}
        filterOptions={(options, { inputValue }) => {
          const filtered = options.filter((option) =>
            option?.name?.toLowerCase().includes(inputValue.toLowerCase())
          );
          return Array.from(new Set(filtered));
        }}
        sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 300 } }}
      />

      <DatePicker
        label="Start Date"
        value={currentFilters.startDate}
        onChange={handleFilterStartDate}
        slotProps={{ textField: { fullWidth: true } }}
        sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 180 } }}
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
          sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%' } }}
          value={query}
          onChange={handleFilterName}
          placeholder="Search job, manager, client..."
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

      <CustomPopover
        open={menuActions.open}
        anchorEl={menuActions.anchorEl}
        onClose={menuActions.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              handleOpenExportDialog();
              menuActions.onClose();
            }}
            disabled={isExporting}
          >
            <Iconify icon="solar:export-bold" />
            Export Missing Timesheets (Detailed)
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleOpenSimpleExportDialog();
              menuActions.onClose();
            }}
            disabled={isExportingSimple}
          >
            <Iconify icon="solar:file-text-bold" />
            Missing Timesheets
          </MenuItem>
        </MenuList>
      </CustomPopover>

      {/* Export Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={handleCloseExportDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Iconify icon="solar:export-bold" />
            Export Missing Timesheets
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Quick Select:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const today = dayjs().startOf('day');
                  setExportStartDate(today);
                  setExportEndDate(today);
                  setExportDateError(false);
                }}
                sx={{ minWidth: 80 }}
              >
                Today
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const week1 = getWeekRange(1);
                  setExportStartDate(week1.start);
                  setExportEndDate(week1.end);
                  setExportDateError(false);
                }}
                sx={{ minWidth: 80 }}
              >
                Week 1
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const week2 = getWeekRange(2);
                  setExportStartDate(week2.start);
                  setExportEndDate(week2.end);
                  setExportDateError(false);
                }}
                sx={{ minWidth: 80 }}
              >
                Week 2
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const week3 = getWeekRange(3);
                  setExportStartDate(week3.start);
                  setExportEndDate(week3.end);
                  setExportDateError(false);
                }}
                sx={{ minWidth: 80 }}
              >
                Week 3
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const week4 = getWeekRange(4);
                  setExportStartDate(week4.start);
                  setExportEndDate(week4.end);
                  setExportDateError(false);
                }}
                sx={{ minWidth: 80 }}
              >
                Week 4
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Date Range*:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <DatePicker
                label="Start Date*"
                value={exportStartDate}
                onChange={(newValue) => {
                  setExportStartDate(newValue);
                  setExportDateError(false);
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: exportDateError && !exportStartDate,
                    helperText: exportDateError && !exportStartDate ? 'Start date is required' : '',
                  },
                }}
              />
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  height: '56px',
                  color: 'text.secondary',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                to
              </Box>
              <DatePicker
                label="End Date*"
                value={exportEndDate}
                onChange={(newValue) => {
                  setExportEndDate(newValue);
                  setExportDateError(false);
                }}
                minDate={exportStartDate || undefined}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!(exportDateError && (!exportEndDate || (exportStartDate && exportEndDate && exportStartDate.isAfter(exportEndDate)))),
                    helperText: exportDateError && exportStartDate && exportEndDate && exportStartDate.isAfter(exportEndDate)
                      ? 'End date must be later than start date'
                      : exportDateError && !exportEndDate
                      ? 'End date is required'
                      : '',
                  },
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Export overdue missing timesheets. Each job will be exported as a separate sheet.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={handleCloseExportDialog} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleExportConfirm}
            disabled={isExporting || !exportStartDate || !exportEndDate || (exportStartDate && exportEndDate && exportStartDate.isAfter(exportEndDate))}
            startIcon={isExporting ? undefined : <Iconify icon="solar:export-bold" />}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Simple Export Dialog */}
      <Dialog
        open={simpleExportDialogOpen}
        onClose={handleCloseSimpleExportDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Iconify icon="solar:file-text-bold" />
            Export Missing Timesheets
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Quick Select:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const today = dayjs().startOf('day');
                  setSimpleExportStartDate(today);
                  setSimpleExportEndDate(today);
                  setSimpleExportDateError(false);
                }}
                sx={{ minWidth: 80 }}
              >
                Today
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const week1 = getWeekRange(1);
                  setSimpleExportStartDate(week1.start);
                  setSimpleExportEndDate(week1.end);
                  setSimpleExportDateError(false);
                }}
                sx={{ minWidth: 80 }}
              >
                Week 1
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const week2 = getWeekRange(2);
                  setSimpleExportStartDate(week2.start);
                  setSimpleExportEndDate(week2.end);
                  setSimpleExportDateError(false);
                }}
                sx={{ minWidth: 80 }}
              >
                Week 2
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const week3 = getWeekRange(3);
                  setSimpleExportStartDate(week3.start);
                  setSimpleExportEndDate(week3.end);
                  setSimpleExportDateError(false);
                }}
                sx={{ minWidth: 80 }}
              >
                Week 3
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const week4 = getWeekRange(4);
                  setSimpleExportStartDate(week4.start);
                  setSimpleExportEndDate(week4.end);
                  setSimpleExportDateError(false);
                }}
                sx={{ minWidth: 80 }}
              >
                Week 4
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Date Range*:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <DatePicker
                label="Start Date*"
                value={simpleExportStartDate}
                onChange={(newValue) => {
                  setSimpleExportStartDate(newValue);
                  setSimpleExportDateError(false);
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: simpleExportDateError && !simpleExportStartDate,
                    helperText: simpleExportDateError && !simpleExportStartDate ? 'Start date is required' : '',
                  },
                }}
              />
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  height: '56px',
                  color: 'text.secondary',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                to
              </Box>
              <DatePicker
                label="End Date*"
                value={simpleExportEndDate}
                onChange={(newValue) => {
                  setSimpleExportEndDate(newValue);
                  setSimpleExportDateError(false);
                }}
                minDate={simpleExportStartDate || undefined}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!(simpleExportDateError && (!simpleExportEndDate || (simpleExportStartDate && simpleExportEndDate && simpleExportStartDate.isAfter(simpleExportEndDate)))),
                    helperText: simpleExportDateError && simpleExportStartDate && simpleExportEndDate && simpleExportStartDate.isAfter(simpleExportEndDate)
                      ? 'End date must be later than start date'
                      : simpleExportDateError && !simpleExportEndDate
                      ? 'End date is required'
                      : '',
                  },
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Export will include: Customer, Job Shift Date, Job Notes, Timesheet #, and Assigned Employee.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={handleCloseSimpleExportDialog} disabled={isExportingSimple}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSimpleExportConfirm}
            disabled={isExportingSimple || !simpleExportStartDate || !simpleExportEndDate || (simpleExportStartDate && simpleExportEndDate && simpleExportStartDate.isAfter(simpleExportEndDate))}
            startIcon={isExportingSimple ? undefined : <Iconify icon="solar:export-bold" />}
          >
            {isExportingSimple ? 'Exporting...' : 'Export'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
