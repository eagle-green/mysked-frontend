import type { IJobTableFilters } from 'src/types/job';
import type { IDatePickerControl } from 'src/types/common';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { UseSetStateReturn } from 'minimal-shared/hooks';

import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);
import { useQuery } from '@tanstack/react-query';
import { usePopover } from 'minimal-shared/hooks';
import { memo, useMemo, useState, useEffect, useCallback } from 'react';

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
import Autocomplete from '@mui/material/Autocomplete';
import OutlinedInput from '@mui/material/OutlinedInput';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CircularProgress from '@mui/material/CircularProgress';
import { formHelperTextClasses } from '@mui/material/FormHelperText';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
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

function JobTableToolbarComponent({ filters, options, dateError, onResetPage }: Props) {
  const menuActions = usePopover();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportListDialogOpen, setExportListDialogOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<'telus' | 'lts' | null>(null);
  const [reportWeekStart, setReportWeekStart] = useState<dayjs.Dayjs | null>(null);
  const [reportWeekEnd, setReportWeekEnd] = useState<dayjs.Dayjs | null>(null);
  const [listExportStart, setListExportStart] = useState<dayjs.Dayjs | null>(null);
  const [listExportEnd, setListExportEnd] = useState<dayjs.Dayjs | null>(null);
  const [exportDateError, setExportDateError] = useState(false);
  const [listExportDateError, setListExportDateError] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingList, setIsExportingList] = useState(false);
  const [query, setQuery] = useState<string>(filters.state.query || '');

  // Sync local query with filters when filters change externally (e.g., reset)
  useEffect(() => {
    setQuery(filters.state.query || '');
  }, [filters.state.query]);

  // Debounce parent filter updates to prevent re-renders on every keystroke
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query !== filters.state.query) {
        onResetPage();
        filters.setState({ query });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [query, filters, onResetPage]);

  // Calculate current week (Monday to Sunday)
  const getCurrentWeekRange = () => {
    const today = dayjs();
    const dayOfWeek = today.day(); // 0 = Sunday, 1 = Monday, etc.

    // Calculate days to subtract to get to this Monday
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If today is Sunday, go back 6 days, otherwise go back (dayOfWeek - 1) days

    const thisMonday = today.subtract(daysToMonday, 'day').startOf('day');
    const thisSunday = thisMonday.add(6, 'day').endOf('day');

    return { start: thisMonday, end: thisSunday };
  };

  // Calculate week ranges for current month (Week 1, 2, 3, 4)
  const getWeekRange = (weekNumber: number) => {
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
  };

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

  // Helper function to format region names
  const formatRegion = (region: string | undefined) => {
    if (!region) return '';
    const regionMap: Record<string, string> = {
      'lower_mainland': 'Lower Mainland',
      'island': 'Island',
      'interior': 'Interior',
      'north': 'North',
    };
    return regionMap[region.toLowerCase()] || region;
  };

  // Create options - backend now handles deduplication
  // Add region/location info to help differentiate items with same names
  const clientOptions = useMemo(() => {
    if (!clientsData) return [];
    return clientsData.map((client: any) => ({ 
      id: client.id, 
      name: client.name,
      region: formatRegion(client.region),
      city: client.city,
    }));
  }, [clientsData]);

  const companyOptions = useMemo(() => {
    if (!companiesData) return [];
    return companiesData.map((company: any) => ({ 
      id: company.id, 
      name: company.name,
      region: formatRegion(company.region),
      city: company.city,
    }));
  }, [companiesData]);

  const siteOptions = useMemo(() => {
    if (!sitesData) return [];
    return sitesData.map((site: any) => ({ 
      id: site.id, 
      name: site.name,
    }));
  }, [sitesData]);

  // Export function
  const exportJobs = useCallback(
    async (reportType: 'telus' | 'lts') => {
      const params = new URLSearchParams();
      if (currentFilters.query) params.set('search', currentFilters.query);
      if (currentFilters.region.length > 0) params.set('regions', currentFilters.region.join(','));
      if (currentFilters.company && currentFilters.company.length > 0)
        params.set('companies', currentFilters.company.filter(c => c?.id).map(c => c.id).join(','));
      if (currentFilters.site && currentFilters.site.length > 0)
        params.set('sites', currentFilters.site.filter(s => s?.id).map(s => s.id).join(','));
      if (currentFilters.client && currentFilters.client.length > 0)
        params.set('clients', currentFilters.client.filter(c => c?.id).map(c => c.id).join(','));

      // Use report week dates if provided, otherwise use current filters
      if (reportWeekStart && reportWeekEnd) {
        params.set('start_date', reportWeekStart.format('YYYY-MM-DD'));
        params.set('end_date', reportWeekEnd.format('YYYY-MM-DD'));
      } else {
        if (currentFilters.startDate)
          params.set('start_date', dayjs(currentFilters.startDate).format('YYYY-MM-DD'));
        if (currentFilters.endDate)
          params.set('end_date', dayjs(currentFilters.endDate).format('YYYY-MM-DD'));
      }

      params.set('client_type', reportType);

      const response = await fetcher(`/api/works/jobs/export?${params.toString()}`);
      return response;
    },
    [currentFilters, reportWeekStart, reportWeekEnd]
  );

  const handleFilterName = useCallback(
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

  const handleFilterStartDate = useCallback(
    (newValue: IDatePickerControl) => {
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
    (newValue: IDatePickerControl) => {
      onResetPage();
      updateFilters({ endDate: newValue ? newValue.endOf('day') : null });
    },
    [onResetPage, updateFilters]
  );

  const generateTELUSWorksheetData = useCallback((jobs: any[]) => {
    const headers = [
      'Date of Work',
      'Company Invoiced',
      'Build Partner',
      'Additional Build Partner',
      'Onsite Contact Name',
      'Phone Number',
      'Physical work location',
      'City',
      'Region',
      'Network or PMOR Code or 3PD number & Activity Code',
      'Approver',
      'COID/FAS or Feeder if applicable',
      'Quantity of LCT (Arrow Board Truck with Driver)',
      'Quantity of additional TCP',
      'Quantity of Highway Truck',
      'Quantity of Crash/Barrel Truck',
      "AFAD's (automated flagging)",
      'Start Time',
      'Request Cancelled',
      'Date Cancelled',
      'Time Cancelled',
    ];

    const rows = jobs.map((job) => {
      // Format date as "August 15th, 2025"
      const formatDate = (dateString: string) => {
        const date = dayjs(dateString).tz('America/Los_Angeles');
        const day = date.date();
        const suffix =
          day === 1 || day === 21 || day === 31
            ? 'st'
            : day === 2 || day === 22
              ? 'nd'
              : day === 3 || day === 23
                ? 'rd'
                : 'th';
        return `${date.format('MMMM')} ${day}${suffix}, ${date.format('YYYY')}`;
      };

      // Format date as "August 11, 2025" (for cancelled dates)
      const formatCancelledDate = (dateString: string) => dayjs(dateString).tz('America/Los_Angeles').format('MMMM D, YYYY');

      // Format time as "8:00 AM"
      const formatTime = (dateString: string) => dayjs(dateString).tz('America/Los_Angeles').format('h:mm A');

      // Use the global formatRegion function

      // Format phone number from client data
      const formatPhoneNumber = (phoneNumber: string) => {
        if (!phoneNumber) return '';
        // Remove any non-digit characters and format as 123-123-1234
        const digits = phoneNumber.replace(/\D/g, '');
        if (digits.length === 11 && digits.startsWith('1')) {
          // Handle +1 country code: remove the leading 1 and format as 123-123-1234
          const withoutCountryCode = digits.slice(1);
          return `${withoutCountryCode.slice(0, 3)}-${withoutCountryCode.slice(3, 6)}-${withoutCountryCode.slice(6)}`;
        } else if (digits.length === 10) {
          // Handle 10-digit numbers: format as 123-123-1234
          return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
        }
        return phoneNumber; // Return original if not 10 or 11 digits
      };

      // Format address from site data (excluding city, postal_code, country)
      const formatAddress = (jobData: any) => {
        const addressParts = [];
        if (jobData.site_unit_number) addressParts.push(jobData.site_unit_number);
        if (jobData.site_street_number) addressParts.push(jobData.site_street_number);
        if (jobData.site_street_name) addressParts.push(jobData.site_street_name);
        return addressParts.join(' ').trim() || '';
      };

      // Empty for 0, null, undefined, or '-' so Excel shows nothing instead of 0 or dash
      const getValue = (value: any) => {
        if (value === 0 || value === null || value === undefined) return '';
        if (typeof value === 'string' && value.trim() === '-') return '';
        return value;
      };

      return [
        job.start_time ? formatDate(job.start_time) : '', // Date of Work
        'Telus', // Company Invoiced (always Telus)
        getValue(job.build_partner), // Build Partner
        getValue(job.additional_build_partner), // Additional Build Partner
        getValue(job.client_name), // Onsite Contact Name (using client name as contact)
        formatPhoneNumber(job.client_contact_number), // Phone Number (from client)
        formatAddress(job), // Physical work location (address without city/postcode/country)
        getValue(job.site_city), // City
        formatRegion(job.region), // Region (formatted)
        getValue(job.po_number), // Network or PMOR Code or 3PD number & Activity Code (using PO number)
        getValue(job.approver), // Approver
        getValue(job.coid_fas_feeder), // COID/FAS or Feeder if applicable
        getValue(job.quantity_lct), // Quantity of LCT (Arrow Board Truck with Driver)
        getValue(job.quantity_tcp), // Quantity of additional TCP
        getValue(job.quantity_highway_truck), // Quantity of Highway Truck
        getValue(job.quantity_crash_barrel_truck), // Quantity of Crash/Barrel Truck
        getValue(job.afad), // AFAD's (automated flagging)
        job.start_time ? formatTime(job.start_time) : '', // Start Time (formatted)
        job.status === 'cancelled' ? 'Yes' : '', // Request Cancelled (only show Yes, not No)
        job.status === 'cancelled' && job.cancelled_at ? formatCancelledDate(job.cancelled_at) : '', // Date Cancelled
        job.status === 'cancelled' && job.cancelled_at ? formatTime(job.cancelled_at) : '', // Time Cancelled
      ];
    });

    return [headers, ...rows];
  }, []);

  const generateLTSWorksheetData = useCallback((jobs: any[]) => {
    const headers = [
      'Date of Work',
      'Cancelled',
      'Emergency call out',
      'Project',
      'Vendor',
      'Build Partner',
      'Onsite Contact',
      'Phone Number',
      'Physical Work Location',
      'City',
      'Region',
      'Network# (NGM) | LTS Number (MXU)',
      'FSA or Feeder',
      'LTS Approver',
      'Flagging Slip',
      'Description of Scope of Work/Activity',
      'Changing locations or Stationary work',
      'Additional Information',
      'Notes from EG',
    ];

    const rows = jobs.map((job) => {
      // Format date as "11-Aug-2025"
      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };

      // Format phone number from client data
      const formatPhoneNumber = (phoneNumber: string) => {
        if (!phoneNumber) return '';
        // Remove any non-digit characters and format as 123-123-1234
        const digits = phoneNumber.replace(/\D/g, '');
        if (digits.length === 11 && digits.startsWith('1')) {
          // Handle +1 country code: remove the leading 1 and format as 123-123-1234
          const withoutCountryCode = digits.slice(1);
          return `${withoutCountryCode.slice(0, 3)}-${withoutCountryCode.slice(3, 6)}-${withoutCountryCode.slice(6)}`;
        } else if (digits.length === 10) {
          // Handle 10-digit numbers: format as 123-123-1234
          return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
        }
        return phoneNumber; // Return original if not 10 or 11 digits
      };

      // Use the global formatRegion function

      // Format address from site data (excluding city, postal_code, country)
      const formatAddress = (jobData: any) => {
        const addressParts = [];
        if (jobData.site_unit_number) addressParts.push(jobData.site_unit_number);
        if (jobData.site_street_number) addressParts.push(jobData.site_street_number);
        if (jobData.site_street_name) addressParts.push(jobData.site_street_name);
        return addressParts.join(' ').trim() || '';
      };

      // Helper function to return empty string instead of '-' for empty values
      const getValue = (value: any) => value || '';

      return [
        job.start_time ? formatDate(job.start_time) : '', // Date of Work
        job.status === 'cancelled' ? 'Y' : '', // Cancelled (only show Y, not N)
        '', // Emergency call out (not implemented yet)
        getValue(job.project), // Project
        getValue(job.vendor), // Vendor
        getValue(job.build_partner_lts), // Build Partner
        getValue(job.client_name), // Onsite Contact (using client name as contact)
        formatPhoneNumber(job.client_contact_number), // Phone Number (from client)
        formatAddress(job), // Physical Work Location (address without city/postcode/country)
        getValue(job.site_city), // City
        formatRegion(job.region_lts), // Region (formatted)
        getValue(job.po_number), // Network# (NGM) | LTS Number (MXU) (using PO number)
        getValue(job.fsa_feeder), // FSA or Feeder
        getValue(job.approver), // LTS Approver
        getValue(job.flagging_slip), // Flagging Slip
        getValue(job.description_scope), // Description of Scope of Work/Activity
        getValue(job.changing_location), // Changing locations or Stationary work
        getValue(job.additional_information), // Additional Information
        getValue(job.notes_from_eg), // Notes from EG
      ];
    });

    return [headers, ...rows];
  }, []);

  const handleExportList = useCallback(async () => {
    // Helper function to format position names
    const formatPosition = (position: string) => {
      if (!position) return '';
      // Split by underscore and capitalize appropriately
      return position
        .split('_')
        .map(word => {
          // Keep common acronyms in uppercase
          const acronyms = ['lct', 'tcp', 'nw', 'po', 'tm', 'qc', 'qa', 'hr', 'it', 'ceo', 'cfo', 'cto'];
          if (acronyms.includes(word.toLowerCase())) {
            return word.toUpperCase();
          }
          // Otherwise capitalize first letter
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
    };
    // Validate date range
    if (!listExportStart || !listExportEnd) {
      setListExportDateError(true);
      toast.error('Date range is required');
      return;
    }

    setListExportDateError(false);
    setIsExportingList(true);

    try {
      toast.info('Preparing export...');
      
      // Fetch all jobs with date range
      // Send dates as YYYY-MM-DD format to avoid timezone conversion issues
      const params = new URLSearchParams({
        page: '1',
        rowsPerPage: '10000', // Get all jobs
        orderBy: 'job_number',
        order: 'asc',
        startDate: listExportStart.format('YYYY-MM-DD'),
        endDate: listExportEnd.format('YYYY-MM-DD'),
      });

      if (currentFilters.status !== 'all') params.set('status', currentFilters.status);
      if (currentFilters.query) params.set('search', currentFilters.query);
      if (currentFilters.region.length > 0) params.set('region', currentFilters.region.join(','));
      if (currentFilters.client.length > 0)
        params.set('client', currentFilters.client.filter((c) => c?.id).map((c) => c.id).join(','));
      if (currentFilters.company.length > 0)
        params.set('company', currentFilters.company.filter((c) => c?.id).map((c) => c.id).join(','));
      if (currentFilters.site.length > 0)
        params.set('site', currentFilters.site.filter((s) => s?.id).map((s) => s.id).join(','));

      const response = await fetcher(`${endpoints.work.job}?${params.toString()}&is_open_job=false`);
      const jobs = response.data?.jobs || [];

      if (jobs.length === 0) {
        toast.error('No jobs found to export');
        setIsExportingList(false);
        return;
      }

      // Fetch timesheet entries for jobs with submitted timesheets
      // Create a map: job_id -> worker_id -> timesheet entry
      const timesheetEntriesMap: Record<string, Record<string, any>> = {};
      
      // Get all jobs with submitted timesheets
      const jobsWithSubmittedTimesheets = jobs.filter(
        (job: any) =>
          job.timesheet_status?.status === 'submitted' ||
          job.timesheet_status?.status === 'approved' ||
          job.timesheet_status?.status === 'confirmed'
      );

      // Fetch timesheet data for each job with submitted timesheet
      if (jobsWithSubmittedTimesheets.length > 0) {
        toast.info('Fetching timesheet data...');
        const timesheetPromises = jobsWithSubmittedTimesheets.map(async (job: any) => {
          try {
            const timesheetResponse = await fetcher(
              `${endpoints.timesheet.list}/${job.timesheet_status.id}`
            );
            const timesheet = timesheetResponse.data || timesheetResponse;
            
            if (timesheet.entries && Array.isArray(timesheet.entries)) {
              // Initialize map for this job
              if (!timesheetEntriesMap[job.id]) {
                timesheetEntriesMap[job.id] = {};
              }
              
              // Map entries by worker_id
              timesheet.entries.forEach((entry: any) => {
                if (entry.worker_id) {
                  timesheetEntriesMap[job.id][entry.worker_id] = entry;
                }
              });
            }
          } catch (error) {
            console.warn(`Failed to fetch timesheet for job ${job.job_number}:`, error);
            // Continue with other jobs even if one fails
          }
        });

        await Promise.all(timesheetPromises);
      }

      // Prepare data for export with grouping
      const exportData: any[] = [];
      let previousJobNumber = '';
      
      jobs.forEach((job: any) => {
        // Add empty row between different job numbers for grouping
        if (previousJobNumber && previousJobNumber !== job.job_number) {
          exportData.push({
            'Job Number': '',
            'PO | NW': '',
            'Site': '',
            'Site Address': '',
            'Client': '',
            'Customer': '',
            'Job Date': '',
            'Employee': '',
            'Position': '',
            'Vehicle': '',
            'Start Time': '',
            'Break Time': '',
            'End Time': '',
            'Total Work Hours': '',
            'Timesheet Manager': '',
            'Timesheet Submit': '',
          });
        }
        previousJobNumber = job.job_number;

        // Get timesheet status - check if timesheet is submitted
        const timesheetStatus = (job.timesheet_status?.status === 'submitted' || 
                                 job.timesheet_status?.status === 'approved' || 
                                 job.timesheet_status?.status === 'confirmed') ? 'Yes' : '';

        // For each worker in the job
        if (job.workers && job.workers.length > 0) {
          job.workers.forEach((worker: any) => {
            const vehicle = job.vehicles?.find((v: any) => v.operator?.id === worker.id);
            const vehicleDisplay = vehicle
              ? `${vehicle.license_plate || ''}${vehicle.unit_number ? ` - ${vehicle.unit_number}` : ''}`.trim()
              : '';

            // Check if timesheet is submitted and has entry for this worker
            const timesheetEntry = timesheetEntriesMap[job.id]?.[worker.id];
            const useTimesheetData = timesheetStatus === 'Yes' && timesheetEntry;

            // Use timesheet data if available, otherwise use job worker data
            const startTimeValue = useTimesheetData && timesheetEntry.shift_start
              ? timesheetEntry.shift_start
              : worker.start_time;
            const endTimeValue = useTimesheetData && timesheetEntry.shift_end
              ? timesheetEntry.shift_end
              : worker.end_time;

            // Calculate total work hours
            // If using timesheet data, use shift_total_minutes if available
            let totalHours = '0.00';
            if (useTimesheetData && timesheetEntry.shift_total_minutes) {
              totalHours = (timesheetEntry.shift_total_minutes / 60).toFixed(2);
            } else {
              const startTime = dayjs(startTimeValue);
              const endTime = dayjs(endTimeValue);
            const totalMinutes = endTime.diff(startTime, 'minute');
              totalHours = (totalMinutes / 60).toFixed(2);
            }

            // Build site address
            const siteAddress = [
              job.site.unit_number,
              job.site.street_number,
              job.site.street_name,
              job.site.city,
              job.site.province,
              job.site.postal_code,
              job.site.country,
            ]
              .filter(Boolean)
              .join(', ');

            exportData.push({
              'Job Number': job.job_number || '',
              'PO | NW': job.po_number || job.network_number || '',
              'Site': job.site?.name || '',
              'Site Address': siteAddress || '',
              'Client': job.client?.name || '',
              'Customer': job.company?.name || '',
              'Job Date': dayjs(job.start_time).format('MMM DD, YYYY'),
              'Employee': `${worker.first_name || ''} ${worker.last_name || ''}`.trim(),
              'Position': formatPosition(worker.position || ''),
              'Vehicle': vehicleDisplay,
              'Start Time': startTimeValue
                ? (useTimesheetData
                    ? dayjs.utc(startTimeValue).tz('America/Vancouver').format('h:mm A')
                    : dayjs(startTimeValue).tz('America/Vancouver').format('h:mm A'))
                : '',
              'Break Time': useTimesheetData && timesheetEntry.break_total_minutes
                ? (timesheetEntry.break_total_minutes / 60).toFixed(2)
                : '', // Show break time from timesheet if available
              'End Time': endTimeValue
                ? (useTimesheetData
                    ? dayjs.utc(endTimeValue).tz('America/Vancouver').format('h:mm A')
                    : dayjs(endTimeValue).tz('America/Vancouver').format('h:mm A'))
                : '',
              'Total Work Hours': totalHours,
              'Timesheet Manager': worker.id === job.timesheet_manager_id ? 'Yes' : '',
              'Timesheet Submit': timesheetStatus,
            });
          });
        } else {
          // Job with no workers
          const siteAddress = [
            job.site.unit_number,
            job.site.street_number,
            job.site.street_name,
            job.site.city,
            job.site.province,
            job.site.postal_code,
            job.site.country,
          ]
            .filter(Boolean)
            .join(', ');

          exportData.push({
            'Job Number': job.job_number || '',
            'PO | NW': job.po_number || job.nw_number || '',
            'Site': job.site?.name || '',
            'Site Address': siteAddress || '',
            'Client': job.client?.name || '',
            'Customer': job.company?.name || '',
            'Job Date': dayjs(job.start_time).format('MMM DD, YYYY'),
            'Employee': '',
            'Position': '',
            'Vehicle': '',
            'Start Time': '',
            'Break Time': '',
            'End Time': '',
            'Total Work Hours': '',
            'Timesheet Manager': '',
            'Timesheet Submit': timesheetStatus,
          });
        }
      });

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Job List');

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

      // Generate filename based on selected date range
      let filename: string;
      if (listExportStart && listExportEnd) {
        const startDateStr = listExportStart.format('YYYY-MM-DD');
        const endDateStr = listExportEnd.format('YYYY-MM-DD');
        if (startDateStr === endDateStr) {
          // Single date: Job_List_2025-12-17
          filename = `Job_List_${startDateStr}.xlsx`;
        } else {
          // Date range: Job_List_2025-12-17-2025-12-19
          filename = `Job_List_${startDateStr}-${endDateStr}.xlsx`;
        }
      } else {
        // Fallback to timestamp if dates are not available
      const timestamp = dayjs().format('YYYY-MM-DD_HHmmss');
        filename = `Job_List_${timestamp}.xlsx`;
      }

      // Write file
      XLSX.writeFile(workbook, filename);

      toast.success(`Excel file exported successfully with ${jobs.length} jobs!`);
      setExportListDialogOpen(false);
      setIsExportingList(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export job list');
      setIsExportingList(false);
    }
  }, [listExportStart, listExportEnd, currentFilters]);

  const handleExport = useCallback(
    async (reportType: 'telus' | 'lts') => {
      // Validate date range
      if (!reportWeekStart || !reportWeekEnd) {
        setExportDateError(true);
        toast.error('Date range is required');
        return;
      }

      setExportDateError(false);
      setIsExporting(true);

      try {
        setSelectedReportType(reportType);
        const response = await exportJobs(reportType);

        const data = response; // fetcher already returns res.data, so response IS the data

        if (!data || !data.jobs || data.jobs.length === 0) {
          toast.error(`No ${reportType.toUpperCase()} job data found for export`);
          setIsExporting(false);
          return;
        }

        // Generate Excel workbook
        const workbook = XLSX.utils.book_new();

        // Generate worksheet data based on report type
        const worksheetData =
          reportType === 'telus'
            ? generateTELUSWorksheetData(data.jobs)
            : generateLTSWorksheetData(data.jobs);

        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // Set column widths
        const columnWidths =
          reportType === 'telus'
            ? [
                { wch: 12 }, // Date of Work
                { wch: 20 }, // Company Invoiced
                { wch: 20 }, // Build Partner
                { wch: 20 }, // Additional Build Partner
                { wch: 20 }, // Onsite Contact Name
                { wch: 15 }, // Phone Number
                { wch: 25 }, // Physical work location
                { wch: 15 }, // City
                { wch: 15 }, // Region
                { wch: 35 }, // Network or PMOR Code or 3PD number & Activity Code
                { wch: 15 }, // Approver
                { wch: 25 }, // COID/FAS or Feeder if applicable
                { wch: 35 }, // Quantity of LCT (Arrow Board Truck with Driver)
                { wch: 25 }, // Quantity of additional TCP
                { wch: 20 }, // Quantity of Highway Truck
                { wch: 25 }, // Quantity of Crash/Barrel Truck
                { wch: 25 }, // AFAD's (automated flagging)
                { wch: 15 }, // Start Time
                { wch: 15 }, // Request Cancelled
                { wch: 15 }, // Date Cancelled
                { wch: 15 }, // Time Cancelled
              ]
            : [
                { wch: 12 }, // Date of Work
                { wch: 12 }, // Cancelled
                { wch: 15 }, // Emergency call out
                { wch: 20 }, // Project
                { wch: 20 }, // Vendor
                { wch: 20 }, // Build Partner
                { wch: 20 }, // Onsite Contact
                { wch: 15 }, // Phone Number
                { wch: 25 }, // Physical Work Location
                { wch: 15 }, // City
                { wch: 15 }, // Region
                { wch: 30 }, // Network# (NGM) | LTS Number (MXU)
                { wch: 20 }, // FSA or Feeder
                { wch: 15 }, // LTS Approver
                { wch: 15 }, // Flagging Slip
                { wch: 35 }, // Description of Scope of Work/Activity
                { wch: 25 }, // Changing locations or Stationary work
                { wch: 25 }, // Additional Information
                { wch: 20 }, // Notes from EG
              ];
        worksheet['!cols'] = columnWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, `${reportType.toUpperCase()} Jobs`);

        // Generate filename with week date if available
        const date = reportWeekStart
          ? reportWeekStart.format('YYYY-MM-DD')
          : dayjs().format('YYYY-MM-DD');
        const filename = `${reportType}_jobs_export_${date}.xlsx`;

        // Download file
        XLSX.writeFile(workbook, filename);

        // Close dialog and show success message
        setExportDialogOpen(false);
        setSelectedReportType(null);
        setReportWeekStart(null);
        setReportWeekEnd(null);
        setExportDateError(false);
        setIsExporting(false);
        toast.success(
          `${reportType.toUpperCase()} Excel file exported successfully with ${data.jobs.length} jobs!`
        );
      } catch (error) {
        console.error('Export error:', error);
        toast.error(`Failed to export ${reportType.toUpperCase()} jobs data`);
        setSelectedReportType(null);
        setExportDateError(false);
        setIsExporting(false);
      }
    },
    [
      exportJobs,
      generateTELUSWorksheetData,
      generateLTSWorksheetData,
      reportWeekStart,
      reportWeekEnd,
    ]
  );

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
            const currentWeek = getCurrentWeekRange();
            setReportWeekStart(currentWeek.start);
            setReportWeekEnd(currentWeek.end);
            setExportDateError(false);
            setExportDialogOpen(true);
            menuActions.onClose();
          }}
        >
          <Iconify icon="solar:export-bold" />
          Export Report
        </MenuItem>
        <MenuItem
          onClick={() => {
            // Set default date to today
            const today = dayjs();
            setListExportStart(today.startOf('day'));
            setListExportEnd(today.endOf('day'));
            setListExportDateError(false);
            setExportListDialogOpen(true);
            menuActions.onClose();
          }}
        >
          <Iconify icon="solar:file-text-bold" />
          Export List
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
          getOptionLabel={(option) => {
            // Return only name for filtering/matching
            if (typeof option === 'string') return option;
            return option?.name || '';
          }}
          isOptionEqualToValue={(option, value) => {
            if (typeof option === 'string' && typeof value === 'string') return option === value;
            return option?.id === value?.id;
          }}
          renderInput={(params) => (
            <TextField {...params} label="Customer" placeholder="Search customer..." />
          )}
          renderTags={() => []}
          renderOption={(props, option, { selected }) => {
            const { key, ...otherProps } = props;
            // Show only name in dropdown
            const displayText = typeof option === 'string' ? option : option.name;
            // Use ID as key to avoid duplicate key warnings
            const uniqueKey = typeof option === 'string' ? key : option.id;
            return (
              <Box component="li" key={uniqueKey} {...otherProps}>
                <Checkbox disableRipple size="small" checked={selected} />
                {displayText}
              </Box>
            );
          }}
          filterOptions={(filterOptions, state) => {
            const { inputValue } = state;
            
            // If no input, return all options
            if (!inputValue) return filterOptions;
            
            // Filter by name only
            const filtered = filterOptions.filter((option) => {
              const name = typeof option === 'string' ? option : (option?.name || '');
              return name.toLowerCase().includes(inputValue.toLowerCase());
            });
            
            // Remove duplicates by ID
            const seen = new Set();
            return filtered.filter((option) => {
              const id = typeof option === 'string' ? option : option?.id;
              if (!id || seen.has(id)) return false;
              seen.add(id);
              return true;
            });
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
          getOptionLabel={(option) => {
            if (typeof option === 'string') return option;
            return option?.name || '';
          }}
          isOptionEqualToValue={(option, value) => {
            if (typeof option === 'string' && typeof value === 'string') return option === value;
            return option?.id === value?.id;
          }}
          renderInput={(params) => (
            <TextField {...params} label="Site" placeholder="Search site..." />
          )}
          renderTags={() => []}
          renderOption={(props, option, { selected }) => {
            const { key, ...otherProps } = props;
            // Show only name in dropdown
            const displayText = typeof option === 'string' ? option : option.name;
            // Use ID as key to avoid duplicate key warnings
            const uniqueKey = typeof option === 'string' ? key : option.id;
            return (
              <Box component="li" key={uniqueKey} {...otherProps}>
                <Checkbox disableRipple size="small" checked={selected} />
                {displayText}
              </Box>
            );
          }}
          filterOptions={(filterOptions, state) => {
            const { inputValue } = state;
            
            // If no input, return all options
            if (!inputValue) return filterOptions;
            
            // Filter by name only
            const filtered = filterOptions.filter((option) => {
              const name = typeof option === 'string' ? option : option.name;
              return name.toLowerCase().includes(inputValue.toLowerCase());
            });
            // Remove duplicates by ID
            const seen = new Set();
            return filtered.filter((option) => {
              const id = typeof option === 'string' ? option : option.id;
              if (seen.has(id)) return false;
              seen.add(id);
              return true;
            });
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
          getOptionLabel={(option) => {
            // Return only name for filtering/matching
            if (typeof option === 'string') return option;
            return option?.name || '';
          }}
          isOptionEqualToValue={(option, value) => {
            if (typeof option === 'string' && typeof value === 'string') return option === value;
            return option?.id === value?.id;
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              label="Client" 
              placeholder="Search client..." 
            />
          )}
          renderTags={() => []}
          renderOption={(props, option, { selected }) => {
            const { key, ...otherProps } = props;
            // Show only name in dropdown
            const displayText = typeof option === 'string' ? option : option.name;
            // Use ID as key to avoid duplicate key warnings
            const uniqueKey = typeof option === 'string' ? key : option.id;
            return (
              <Box component="li" key={uniqueKey} {...otherProps}>
                <Checkbox disableRipple size="small" checked={selected} />
                {displayText}
              </Box>
            );
          }}
          filterOptions={(filterOptions, state) => {
            const { inputValue } = state;
            
            // If no input, return all options
            if (!inputValue) return filterOptions;
            
            // Filter by name only
            const filtered = filterOptions.filter((option) => {
              const name = typeof option === 'string' ? option : (option?.name || '');
              return name.toLowerCase().includes(inputValue.toLowerCase());
            });
            
            // Remove duplicates by ID
            const seen = new Set();
            return filtered.filter((option) => {
              const id = typeof option === 'string' ? option : option?.id;
              if (!id || seen.has(id)) return false;
              seen.add(id);
              return true;
            });
          }}
          freeSolo={false}
          disableClearable={false}
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
            width: { xs: 1, md: '100%' },
            maxWidth: { xs: '100%', md: 180 },
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
            value={query}
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

          <IconButton onClick={menuActions.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </Box>
      </Box>

      {renderMenuActions()}

      {/* Export Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => {
          setExportDialogOpen(false);
          setReportWeekStart(null);
          setReportWeekEnd(null);
          setExportDateError(false);
          setSelectedReportType(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Export Job Reports</DialogTitle>
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
                  setReportWeekStart(today);
                  setReportWeekEnd(today);
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
                  setReportWeekStart(week1.start);
                  setReportWeekEnd(week1.end);
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
                  setReportWeekStart(week2.start);
                  setReportWeekEnd(week2.end);
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
                  setReportWeekStart(week3.start);
                  setReportWeekEnd(week3.end);
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
                  setReportWeekStart(week4.start);
                  setReportWeekEnd(week4.end);
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
                value={reportWeekStart}
                onChange={(newValue) => {
                  setReportWeekStart(newValue);
                  setExportDateError(false);
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: exportDateError && !reportWeekStart,
                    helperText: exportDateError && !reportWeekStart ? 'Start date is required' : '',
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
                value={reportWeekEnd}
                onChange={(newValue) => {
                  setReportWeekEnd(newValue);
                  setExportDateError(false);
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: exportDateError && !reportWeekEnd,
                    helperText: exportDateError && !reportWeekEnd ? 'End date is required' : '',
                  },
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Or manually select start and end dates below
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Choose the report type to export:
          </Typography>
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', gap: 1, p: 3 }}>
          <Button
            onClick={() => handleExport('telus')}
            variant="contained"
            disabled={isExporting}
            startIcon={
              isExporting && selectedReportType === 'telus' ? (
                <CircularProgress size={20} />
              ) : (
                <Iconify icon="solar:export-bold" />
              )
            }
            sx={{ width: '100%', ml: '12px' }}
          >
            {isExporting && selectedReportType === 'telus'
              ? 'Exporting TELUS...'
              : 'Export TELUS Report'}
          </Button>
          <Button
            onClick={() => handleExport('lts')}
            variant="contained"
            color="secondary"
            disabled={isExporting}
            startIcon={
              isExporting && selectedReportType === 'lts' ? (
                <CircularProgress size={20} />
              ) : (
                <Iconify icon="solar:export-bold" />
              )
            }
            sx={{ width: '100%' }}
          >
            {isExporting && selectedReportType === 'lts' ? 'Exporting LTS...' : 'Export LTS Report'}
          </Button>
          <Button
            onClick={() => setExportDialogOpen(false)}
            variant="outlined"
            sx={{ width: '100%', mt: 1 }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export List Dialog */}
      <Dialog
        open={exportListDialogOpen}
        onClose={() => {
          setExportListDialogOpen(false);
          setListExportDateError(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Export Job List</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select date range to export job list with all workers:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: 'row' }}>
              <DatePicker
                label="Start Date"
                value={listExportStart}
                onChange={(newValue) => {
                  setListExportStart(newValue);
                  setListExportDateError(false);
                }}
                slotProps={{
                  textField: {
                    sx: { width: '50%' },
                    error: listExportDateError && !listExportStart,
                    helperText: listExportDateError && !listExportStart ? 'Required' : '',
                  },
                }}
              />
              <DatePicker
                label="End Date"
                value={listExportEnd}
                onChange={(newValue) => {
                  setListExportEnd(newValue);
                  setListExportDateError(false);
                }}
                slotProps={{
                  textField: {
                    sx: { width: '50%' },
                    error: listExportDateError && !listExportEnd,
                    helperText: listExportDateError && !listExportEnd ? 'Required' : '',
                  },
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              The export will include: Job Number, PO | NW, Site, Site Address, Client, Customer, Job Date, Employee, Position, Vehicle, Start Time, Break Time, End Time, Total Work Hours, Timesheet Manager, and Timesheet Submit.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleExportList}
            variant="contained"
            disabled={isExportingList}
            startIcon={
              isExportingList ? (
                <CircularProgress size={20} />
              ) : (
                <Iconify icon="solar:export-bold" />
              )
            }
            sx={{ width: '100%' }}
          >
            {isExportingList ? 'Exporting...' : 'Export Job List'}
          </Button>
          <Button
            onClick={() => setExportListDialogOpen(false)}
            variant="outlined"
            disabled={isExportingList}
            sx={{ width: '100%' }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export const JobTableToolbar = memo(JobTableToolbarComponent);
