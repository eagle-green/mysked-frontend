import type { IInvoiceItem } from 'src/types/invoice';

import dayjs from 'dayjs';
import { useBoolean } from 'minimal-shared/hooks';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRef, useMemo, Fragment, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Step from '@mui/material/Step';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Radio from '@mui/material/Radio';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Stepper from '@mui/material/Stepper';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import Collapse from '@mui/material/Collapse';
import StepLabel from '@mui/material/StepLabel';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import RadioGroup from '@mui/material/RadioGroup';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';
import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';
import axiosInstance, { fetcher, endpoints } from 'src/lib/axios';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { type ProgressStep, InvoiceCreationProgressDialog } from 'src/components/progress-dialog';

import { CustomerRateAssignment } from 'src/sections/management/invoice/customers/customer-rate-assignment';
import {
  type InvoiceFormRef,
  InvoiceCreateEditForm,
} from 'src/sections/management/invoice/invoice-create-edit-form';

// ----------------------------------------------------------------------

const STEPS = [
  'Search Job',
  'Select Customer',
  'Verify Timesheets',
  'Validate Rates',
  'Confirm Items',
  'Review & Generate',
];

interface Job {
  id: string;
  job_number: string;
  po_number: string | null;
  network_number: string | null;
  start_time: string;
  end_time: string;
  company_id: string;
  company_name: string;
  company_logo_url: string | null;
  site_id: string | null;
  site_name: string | null;
  site_address: string | null;
  client_name: string | null;
  client_logo_url: string | null;
  created_by_first_name: string | null;
  created_by_last_name: string | null;
  created_by_photo_url: string | null;
  updated_by_first_name: string | null;
  updated_by_last_name: string | null;
  updated_by_photo_url: string | null;
  status: string;
  timesheet_status: string | null;
}

interface JobWorker {
  id: string;
  job_id: string;
  user_id: string; // Backend returns user_id from job_workers table
  position: string;
  start_time: string;
  end_time: string;
  status: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface TimesheetEntry {
  id: string;
  timesheet_id: string;
  worker_id: string;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  position: string | null;
  shift_start: string | null;
  shift_end: string | null;
  break_minutes: number | null;
  break_total_minutes: number | null;
  shift_total_minutes: number | null;
  total_work_minutes: number | null;
  travel_to_minutes: number | null;
  travel_from_minutes: number | null;
  travel_during_minutes: number | null;
  total_travel_minutes: number | null;
  mob: boolean | null;
}

interface Timesheet {
  id: string;
  job_id: string;
  status: string;
  submitted_at: string | null;
  notes: string | null; // Manager note
  admin_notes: string | null; // Admin note
  entries?: TimesheetEntry[];
}

interface Vehicle {
  id: string;
  job_id: string;
  vehicle_id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  operator_id: string | null;
}

interface JobDetail extends Job {
  workers: JobWorker[];
  timesheets: Array<Timesheet & { entries: TimesheetEntry[] }>;
  vehicles: Vehicle[];
  timesheet_manager_id: string | null;
  manager_first_name: string | null;
  manager_last_name: string | null;
  manager_photo_url: string | null;
}

interface Customer {
  id: string;
  name: string;
  company_name: string | null;
  phone: string | null;
  email: string | null;
  qbo_customer_id: string | null;
}

interface CustomerRate {
  id: string;
  customer_id: string;
  position: string;
  service_id: string;
  service_name: string;
  service_category: string | null;
  service_price: number | null;
  weekday_regular_service_id: string | null;
  weekday_regular_service_name: string | null;
  weekday_regular_service_category: string | null;
  weekday_regular_service_price: number | null;
  weekday_regular_service_tax_code_id: string | null;
  weekday_overtime_service_id: string | null;
  weekday_overtime_service_name: string | null;
  weekday_overtime_service_category: string | null;
  weekday_overtime_service_price: number | null;
  weekday_overtime_service_tax_code_id: string | null;
  weekday_double_time_service_id: string | null;
  weekday_double_time_service_name: string | null;
  weekday_double_time_service_category: string | null;
  weekday_double_time_service_price: number | null;
  weekday_double_time_service_tax_code_id: string | null;
  saturday_overtime_service_id: string | null;
  saturday_overtime_service_name: string | null;
  saturday_overtime_service_category: string | null;
  saturday_overtime_service_price: number | null;
  saturday_overtime_service_tax_code_id: string | null;
  saturday_double_time_service_id: string | null;
  saturday_double_time_service_name: string | null;
  saturday_double_time_service_category: string | null;
  saturday_double_time_service_price: number | null;
  saturday_double_time_service_tax_code_id: string | null;
  sunday_holiday_double_time_service_id: string | null;
  sunday_holiday_double_time_service_name: string | null;
  sunday_holiday_double_time_service_category: string | null;
  sunday_holiday_double_time_service_price: number | null;
  sunday_holiday_double_time_service_tax_code_id: string | null;
  mobilization_service_id: string | null;
  mobilization_service_name: string | null;
  mobilization_service_category: string | null;
  mobilization_service_price: number | null;
  mobilization_service_tax_code_id: string | null;
}

export function InvoiceGenerateView() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [isGeneratingItems, setIsGeneratingItems] = useState(false);

  const [poNumber, setPoNumber] = useState('');
  const [networkNumber, setNetworkNumber] = useState('');
  const [searchType, setSearchType] = useState<'po' | 'network'>('po');
  const [lastSearchedType, setLastSearchedType] = useState<'po' | 'network' | null>(null);

  // Calculate current week (Monday to Sunday) for default dates
  // This calculation runs once when component mounts
  const getCurrentWeekRange = () => {
    const today = dayjs();
    const dayOfWeek = today.day(); // 0 = Sunday, 1 = Monday, etc.

    // Calculate days to subtract to get to this Monday
    // If today is Sunday (0), go back 6 days, otherwise go back (dayOfWeek - 1) days
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const thisMonday = today.subtract(daysToMonday, 'day').startOf('day');
    const thisSunday = thisMonday.add(6, 'day').endOf('day');

    return { start: thisMonday, end: thisSunday };
  };

  const currentWeekRange = getCurrentWeekRange();
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(currentWeekRange.start);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(currentWeekRange.end);
  const [foundJobs, setFoundJobs] = useState<Job[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [jobDetails, setJobDetails] = useState<JobDetail[]>([]);
  const [customerRates, setCustomerRates] = useState<CustomerRate[]>([]);
  const [missingRates, setMissingRates] = useState<string[]>([]);
  const [missingRateTypes, setMissingRateTypes] = useState<
    Array<{ position: string; rateType: string }>
  >([]);
  const [showIncompleteJobsDialog, setShowIncompleteJobsDialog] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());

  // Progress dialog state
  const progressDialog = useBoolean();
  const [currentStep, setCurrentStep] = useState(0);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);

  // Ref to access form methods
  const formRef = useRef<InvoiceFormRef | null>(null);

  // Step 1: Search for jobs
  const searchJobsMutation = useMutation({
    mutationFn: async ({
      searchType: currentSearchType,
      poNumber: currentPoNumber,
      networkNumber: currentNetworkNumber,
      startDate: currentStartDate,
      endDate: currentEndDate,
    }: {
      searchType: 'po' | 'network';
      poNumber: string;
      networkNumber: string;
      startDate: dayjs.Dayjs | null;
      endDate: dayjs.Dayjs | null;
    }) => {
      const params = new URLSearchParams();
      if (currentSearchType === 'po' && currentPoNumber) {
        params.append('poNumber', currentPoNumber);
      } else if (currentSearchType === 'network' && currentNetworkNumber) {
        params.append('networkNumber', currentNetworkNumber);
      }
      if (currentStartDate) {
        params.append('startDate', currentStartDate.startOf('day').toISOString());
      }
      if (currentEndDate) {
        params.append('endDate', currentEndDate.endOf('day').toISOString());
      }

      const response = await axiosInstance.get(
        `${endpoints.invoice.generateSearchJobs}?${params.toString()}`,
        {
          validateStatus: (status) => status === 200 || status === 404, // Don't throw on 404
        }
      );

      // Handle 404 as "no jobs found" - return empty data
      if (response.status === 404) {
        return { data: [] };
      }

      return response.data;
    },
    onSuccess: (data, variables) => {
      // Track which search type was used
      setLastSearchedType(variables.searchType);

      if (data.data && data.data.length > 0) {
        setFoundJobs(data.data);
        // Select all jobs by default
        setSelectedJobIds(new Set(data.data.map((job: Job) => job.id)));
        const jobNumbers = data.data.map((job: Job) => `#${job.job_number}`).join(', ');
        toast.success(`Found ${data.data.length} job(s): ${jobNumbers}`);
        // Don't automatically move to next step - let user click Next button
      } else {
        // No jobs found - error state will be handled by UI Alert
        setFoundJobs([]);
        setSelectedJobIds(new Set());
      }
    },
    onError: (error: any) => {
      // Only show error for actual server errors (not 404, which is handled in mutationFn)
      toast.error(
        error?.response?.data?.error ||
          'A server error occurred. Please check your connection and try again.'
      );
      setFoundJobs([]);
    },
  });

  // Step 2: Get customers from selected jobs
  const { data: customersResponse, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['invoice-generate-customers', Array.from(selectedJobIds)],
    queryFn: async () => {
      const response = await axiosInstance.post(endpoints.invoice.generateCustomers, {
        jobIds: Array.from(selectedJobIds),
      });
      return response.data;
    },
    enabled: selectedJobIds.size > 0 && activeStep >= 1,
  });

  const customers = useMemo(
    () => (customersResponse?.data || []) as Customer[],
    [customersResponse?.data]
  );

  // Step 3: Get job details and customer rates
  const getJobDetailsMutation = useMutation({
    mutationFn: async () => {
      // Send only selected job IDs
      const jobIds = Array.from(selectedJobIds);

      if (jobIds.length === 0) {
        throw new Error('No jobs selected');
      }

      const [jobDetailsResponse, ratesResponse] = await Promise.all([
        axiosInstance.post(endpoints.invoice.generateJobDetails, { jobIds }),
        axiosInstance.get(endpoints.invoice.customerRates(selectedCustomerId)),
      ]);

      return {
        jobDetails: jobDetailsResponse.data.data,
        rates: ratesResponse.data.data,
      };
    },
    onSuccess: (data) => {
      setJobDetails(data.jobDetails);
      setCustomerRates(data.rates);

      // Check for missing rates
      const requiredPositions = new Set<string>();
      data.jobDetails.forEach((job: JobDetail) => {
        job.workers.forEach((worker) => {
          requiredPositions.add(worker.position);
        });
      });

      const assignedPositions = new Set(data.rates.map((r: CustomerRate) => r.position));
      const missing = Array.from(requiredPositions).filter((pos) => !assignedPositions.has(pos));
      setMissingRates(missing);

      // Only advance to step 2 if we're currently at step 1 (coming from Select Customer)
      // Don't reset the step if user is already at a later step (e.g., when rates are refetched)
      setActiveStep((prevStep) => {
        if (prevStep === 1) {
          return 2; // Go to Verify Timesheets (step 2)
        }
        return prevStep; // Keep current step if already past step 1
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to load job details and rates');
    },
  });

  // Refetch rates when they're updated (for inline assignment)
  // Use the same query key as CustomerRateAssignment component
  // Fetch services to get tax codes
  const { data: servicesResponse } = useQuery({
    queryKey: ['invoice-services-for-generation'],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: '1',
        rowsPerPage: '10000',
        status: 'active',
      });
      const response = await fetcher(`${endpoints.invoice.services}?${params.toString()}`);
      return response;
    },
  });

  const services = useMemo(
    () =>
      (servicesResponse?.data || []) as Array<{
        id: string;
        name: string;
        category: string | null;
        tax_code_id: string | null;
      }>,
    [servicesResponse?.data]
  );

  // Fetch terms to get default term
  const { data: termsResponse } = useQuery({
    queryKey: ['invoice-terms-for-generation'],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: '1',
        rowsPerPage: '100',
        active: 'true',
      });
      const response = await fetcher(`${endpoints.invoice.terms}?${params.toString()}`);
      return response;
    },
  });

  const terms = useMemo(
    () =>
      (termsResponse?.data || []) as Array<{
        id: string;
        name: string;
      }>,
    [termsResponse?.data]
  );
  const defaultTerm = useMemo(
    () => terms.find((term) => term.name === 'Net 30') || terms[0] || null,
    [terms]
  );

  // Sort found jobs by start_time (older first) for display
  const sortedFoundJobs = useMemo(
    () =>
      [...foundJobs].sort((a, b) => {
        const dateA = dayjs(a.start_time);
        const dateB = dayjs(b.start_time);
        return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0;
      }),
    [foundJobs]
  );

  // Debug logging for terms
  useEffect(() => {}, [termsResponse, terms, defaultTerm]);

  const { data: updatedRatesResponse, refetch: refetchRates } = useQuery({
    queryKey: ['customerRates', selectedCustomerId],
    queryFn: () => axiosInstance.get(endpoints.invoice.customerRates(selectedCustomerId)),
    enabled: !!selectedCustomerId && activeStep >= 3,
    refetchOnWindowFocus: false, // Disable auto-refetch on window focus to prevent step resets
  });

  // Update customer rates when refetched
  const currentRates = (updatedRatesResponse?.data?.data || customerRates) as CustomerRate[];

  // Helper function to determine rate type based on job date and worker times
  const getRequiredRateType = (
    jobStartTime: string,
    workerStartTime: string,
    workerEndTime: string
  ): string => {
    const jobDate = new Date(jobStartTime);
    const dayOfWeek = jobDate.getDay(); // 0 = Sunday, 6 = Saturday
    const startHour = new Date(workerStartTime).getHours();
    const endHour = new Date(workerEndTime).getHours();

    // Sunday or Statutory Holiday (we'll treat Sunday as holiday for now)
    if (dayOfWeek === 0) {
      return 'sunday_holiday_double_time';
    }

    // Saturday
    if (dayOfWeek === 6) {
      // Saturday 6am-5pm: Overtime
      if (startHour >= 6 && endHour < 17) {
        return 'saturday_overtime';
      }
      // Saturday 5pm-6am: Double Time
      return 'saturday_double_time';
    }

    // Weekday (Monday-Friday)
    // Weekday 6am-5pm: Regular
    if (startHour >= 6 && endHour < 17) {
      return 'weekday_regular';
    }
    // Weekday 5pm-10pm: Overtime
    if (startHour >= 17 && endHour < 22) {
      return 'weekday_overtime';
    }
    // Weekday 10pm-6am: Double Time
    return 'weekday_double_time';
  };

  // Helper function to determine ALL required rate types based on work hours and time of day
  // This accounts for different splitting logic per day type:
  // - Weekday: Split by total hours (8h regular, 4h overtime, remaining double time)
  // - Saturday: Split by time of day (6am-5pm overtime, 5pm-6am double time)
  // - Sunday/Holiday: All double time
  const getRequiredRateTypes = (
    jobStartTime: string,
    totalWorkMinutes: number | null,
    shiftStart?: string,
    shiftEnd?: string
  ): string[] => {
    const jobDate = new Date(jobStartTime);
    const dayOfWeek = jobDate.getDay(); // 0 = Sunday, 6 = Saturday

    // Calculate total hours
    const totalHours = totalWorkMinutes ? totalWorkMinutes / 60 : 8;

    const rateTypes: string[] = [];

    // Sunday or Statutory Holiday: All hours are double time ONLY
    if (dayOfWeek === 0) {
      rateTypes.push('sunday_holiday_double_time');
      return rateTypes;
    }

    // Saturday: Split by TIME OF DAY (not total hours)
    // Saturday Overtime: 6am-5pm
    // Saturday Double Time: 5pm-6am
    if (dayOfWeek === 6) {
      // For Saturday, check if work spans both overtime and double time windows
      // We need both rates if the worker works across the 5pm boundary
      if (shiftStart && shiftEnd) {
        const start = new Date(shiftStart);
        const end = new Date(shiftEnd);

        // Define Saturday overtime window: 6am-5pm (17:00)
        const overtimeStart = new Date(start);
        overtimeStart.setHours(6, 0, 0, 0);
        const overtimeEnd = new Date(start);
        overtimeEnd.setHours(17, 0, 0, 0);

        // Check if any work falls in overtime window (6am-5pm)
        if (start < overtimeEnd && end > overtimeStart) {
          rateTypes.push('saturday_overtime');
        }

        // Check if any work falls outside overtime window (before 6am or after 5pm)
        if (start < overtimeStart || end > overtimeEnd) {
          rateTypes.push('saturday_double_time');
        }
      } else {
        // Fallback: assume both rates may be needed
        rateTypes.push('saturday_overtime');
        if (totalHours > 11) {
          rateTypes.push('saturday_double_time');
        }
      }
      return rateTypes;
    }

    // Weekday: Split by TOTAL HOURS
    // Regular hours (first 8 hours)
    if (totalHours > 0) {
      rateTypes.push('weekday_regular');
    }
    // Overtime hours (hours 9-12)
    if (totalHours > 8) {
      rateTypes.push('weekday_overtime');
    }
    // Double time hours (hours 13+)
    if (totalHours > 12) {
      rateTypes.push('weekday_double_time');
    }

    return rateTypes;
  };

  // Helper function to get position display name
  const getPositionDisplayName = (position: string): string => {
    const normalizedPosition = position.toLowerCase().replace(/\s+/g, '_');
    const positionOption = JOB_POSITION_OPTIONS.find((opt) => opt.value === normalizedPosition);
    return positionOption?.label || position;
  };

  // Generate invoice items from job details
  const generateInvoiceItems = useCallback((): IInvoiceItem[] => {
    if (jobDetails.length === 0 || currentRates.length === 0) {
      return [];
    }

    const items: IInvoiceItem[] = [];
    let itemIdCounter = 1;

    // Helper function to get tax code for a service
    const getServiceTaxCode = (serviceName: string, serviceCategory: string | null): string => {
      // Try to find service by name and category
      const serviceDisplay = serviceCategory ? `${serviceCategory}:${serviceName}` : serviceName;
      const foundService = services.find((s) => {
        const sDisplay = s.category ? `${s.category}:${s.name}` : s.name;
        return sDisplay === serviceDisplay || s.name === serviceName;
      });
      return foundService?.tax_code_id || '';
    };

    // Get mobilization service info (shared across all workers)
    const rateWithMobilization = currentRates.find(
      (r: CustomerRate) => r.mobilization_service_name
    );
    const mobilizationServiceName = rateWithMobilization?.mobilization_service_name || '';
    const mobilizationServiceCategory = rateWithMobilization?.mobilization_service_category || '';
    const mobilizationServicePrice = rateWithMobilization?.mobilization_service_price || 0;
    const mobilizationTaxCodeId = rateWithMobilization?.mobilization_service_tax_code_id || '';

    jobDetails.forEach((job: JobDetail) => {
      // Extract date from job.start_time without timezone conversion
      // If job.start_time is already in YYYY-MM-DD format, use it directly
      // Otherwise, extract the date part to avoid timezone issues
      const jobDateStr = job.start_time.includes('T')
        ? job.start_time.split('T')[0]
        : job.start_time.split(' ')[0];
      const jobDate = jobDateStr; // Keep as string in YYYY-MM-DD format
      const jobNumber = job.job_number;

      // Track which workers have been processed (to avoid duplicates)
      const processedWorkers = new Set<string>();

      // Create a set of worker IDs who have vehicles assigned
      const workersWithVehicles = new Set(
        job.vehicles.filter((v) => v.operator_id).map((v) => v.operator_id!)
      );

      // Create a map of worker IDs to mob flag from timesheet entries
      const workersWithMob = new Set<string>();
      job.timesheets.forEach((timesheet) => {
        timesheet.entries?.forEach((entry) => {
          if (entry.worker_id && entry.mob === true) {
            workersWithMob.add(entry.worker_id);
          }
        });
      });

      // Helper function to check if a worker needs mobilization
      const workerNeedsMobilization = (workerId: string, position: string): boolean => {
        const normalizedPosition = position.toUpperCase().replace(/\s+/g, '_');
        // Only LCT, HWY, and Field Supervisor can have mobilization
        if (!['LCT', 'HWY', 'FIELD_SUPERVISOR'].includes(normalizedPosition)) {
          return false;
        }
        // Check if worker has vehicle or mob flag
        return workersWithVehicles.has(workerId) || workersWithMob.has(workerId);
      };

      // Helper function to add mobilization item for a specific worker
      const addMobilizationItem = (workerId: string, position: string, workerName?: string) => {
        if (!workerNeedsMobilization(workerId, position) || !mobilizationServiceName) {
          return;
        }

        const mobServiceDisplay = mobilizationServiceCategory
          ? `${mobilizationServiceCategory}:${mobilizationServiceName}`
          : mobilizationServiceName;

        // Find the actual vehicle type from job vehicles
        let vehicleType = '';
        const vehicle = job.vehicles?.find((v: any) => v.operator_id === workerId);
        if (vehicle) {
          const rawType = (vehicle as any).type;
          // Format vehicle type: "highway_truck" -> "Highway Truck"
          vehicleType = rawType
            .split('_')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        }

        // Simple description without metadata (stored in separate fields now)
        const mobDescription = `Mobilization-${jobNumber}`;

        items.push({
          id: `item-${itemIdCounter++}`,
          title: mobilizationServiceName,
          description: mobDescription,
          service: mobServiceDisplay,
          serviceDate: jobDate,
          price: mobilizationServicePrice,
          quantity: 1,
          tax:
            mobilizationTaxCodeId ||
            getServiceTaxCode(mobilizationServiceName, mobilizationServiceCategory),
          total: mobilizationServicePrice,
          // Store worker/position info in separate fields
          workerName: workerName || '',
          position: 'Mobilization',
          vehicleType: vehicleType || '',
          shiftTimes: '',
        });
      };

      // Helper function to add service item for a worker
      // This function now splits hours into regular, overtime, and double time
      const addWorkerServiceItem = (
        workerId: string,
        position: string,
        rateType: string,
        positionRate: any,
        workerName?: string,
        shiftStart?: string,
        shiftEnd?: string,
        totalWorkMinutes?: number | null,
        breakMinutes?: number | null,
        travelMinutes?: number | null
      ) => {
        // Determine base rate type prefix (weekday, saturday, or sunday_holiday)
        // Check in order: sunday_holiday first (since it contains 'saturday'), then saturday, then default to weekday
        let ratePrefix = 'weekday';
        if (rateType.includes('sunday') || rateType.includes('holiday')) {
          ratePrefix = 'sunday_holiday';
        } else if (rateType.includes('saturday')) {
          ratePrefix = 'saturday';
        }

        // Calculate total work hours from minutes
        let totalHours = 8; // Default to 8 hours
        if (totalWorkMinutes !== null && totalWorkMinutes !== undefined) {
          totalHours = totalWorkMinutes / 60;
          // Round to 2 decimal places to avoid floating point issues
          totalHours = Math.round(totalHours * 100) / 100;
        }

        // Split hours into regular, overtime, and double time
        // The splitting logic depends on the day type:
        // - Weekday: Based on total hours (8h regular, then overtime, then double time)
        // - Saturday: Based on TIME OF DAY (6am-5pm overtime, 5pm-6am double time)
        // - Sunday/Holiday: All hours are double time

        let regularHours = 0;
        let overtimeHours = 0;
        let doubleTimeHours = 0;

        if (ratePrefix === 'sunday_holiday') {
          // Sunday/Holiday: All hours are double time
          doubleTimeHours = totalHours;
        } else if (ratePrefix === 'saturday') {
          // Saturday: Split by TIME OF DAY, not total hours
          // Saturday Overtime: 6am-5pm
          // Saturday Double Time: 5pm-6am (next day) OR before 6am
          // Break deduction: Subtract breaks from the LATER time period (double time first, then overtime)
          if (shiftStart && shiftEnd) {
            const start = new Date(shiftStart);
            const end = new Date(shiftEnd);

            // Define Saturday overtime window: 6am-5pm
            const overtimeStart = new Date(start);
            overtimeStart.setHours(6, 0, 0, 0);
            const overtimeEnd = new Date(start);
            overtimeEnd.setHours(17, 0, 0, 0); // 5pm

            // Calculate RAW time in each window
            const actualStart = start < overtimeStart ? overtimeStart : start;
            const actualEnd = end > overtimeEnd ? overtimeEnd : end;

            let rawOvertimeHours = 0;
            if (actualStart < actualEnd) {
              rawOvertimeHours = (actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60);
            }

            const totalShiftHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            const rawDoubleTimeHours = totalShiftHours - rawOvertimeHours;

            // Calculate break hours
            const breakHours = totalShiftHours - totalHours;

            // Deduct breaks from double time first, then from overtime if needed
            if (breakHours > 0) {
              if (breakHours <= rawDoubleTimeHours) {
                // Break fits entirely in double time period
                doubleTimeHours = rawDoubleTimeHours - breakHours;
                overtimeHours = rawOvertimeHours;
              } else {
                // Break spans both periods - deduct from double time first, then overtime
                doubleTimeHours = 0;
                overtimeHours = rawOvertimeHours - (breakHours - rawDoubleTimeHours);
              }
            } else {
              // No breaks
              overtimeHours = rawOvertimeHours;
              doubleTimeHours = rawDoubleTimeHours;
            }

            // Round to 2 decimal places
            overtimeHours = Math.round(overtimeHours * 100) / 100;
            doubleTimeHours = Math.round(doubleTimeHours * 100) / 100;
          } else {
            // Fallback if no shift times: use total hours as overtime
            overtimeHours = totalHours;
          }
        } else {
          // Weekday: Split by TOTAL HOURS
          // Regular: first 8 hours (6am-5pm typically)
          // Overtime: hours 9-12 (5pm-10pm typically)
          // Double time: hours 13+ (10pm-6am typically)
          regularHours = Math.min(totalHours, 8);
          overtimeHours = Math.min(Math.max(totalHours - 8, 0), 4);
          doubleTimeHours = Math.max(totalHours - 12, 0);
        }

        // Format shift times for display
        let formattedShiftTimes = '';
        if (shiftStart && shiftEnd) {
          const startTime = new Date(shiftStart).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
          const endTime = new Date(shiftEnd).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
          formattedShiftTimes = `${startTime} - ${endTime}`;
        }

        // Helper function to add a single service item
        const addServiceItem = (hours: number, rateTypeKey: string, descriptionSuffix: string) => {
          if (hours <= 0) return;

          let serviceName = '';
          let serviceCategory = '';
          let servicePrice = 0;
          let serviceTaxCodeId = '';

          // Get service details based on rate type
          // If the specific rate type doesn't exist for the day type, fall back to weekday rates
          const getRateValue = (prefix: string, suffix: string): any => {
            const key = `${prefix}_${suffix}`;
            const value = positionRate[key];

            // Convert price strings to numbers if needed
            if (suffix.includes('price') && typeof value === 'string') {
              return parseFloat(value) || 0;
            }
            return value || null;
          };

          // Try to get rate for the current prefix, fallback to weekday if not found
          const tryGetRate = (typeKey: string) => {
            // First try the determined prefix (saturday/sunday_holiday/weekday)
            let name = getRateValue(ratePrefix, `${typeKey}_service_name`);
            let category = getRateValue(ratePrefix, `${typeKey}_service_category`);
            let price = getRateValue(ratePrefix, `${typeKey}_service_price`);
            let taxCode = getRateValue(ratePrefix, `${typeKey}_service_tax_code_id`);

            // Final fallback: If still not found and it's a regular rate, use base service
            if ((!name || !price || price === 0) && typeKey === 'regular') {
              console.warn(
                'Regular rate not found in weekday rates, using base service as final fallback'
              );
              name = positionRate.service_name || '';
              category = positionRate.service_category || null;
              price = positionRate.service_price || 0;
              // Convert price to number if it's a string
              if (typeof price === 'string') {
                price = parseFloat(price) || 0;
              }
              taxCode = positionRate.service_tax_code_id || '';
            }

            return {
              name: name || '',
              category: category || '',
              price: price || 0,
              taxCode: taxCode || '',
            };
          };

          switch (rateTypeKey) {
            case 'regular': {
              // Regular rate: Try weekday first (since Saturday doesn't have regular in DB)
              // The tryGetRate function will automatically fallback to weekday if Saturday regular doesn't exist
              const regularRate = tryGetRate('regular');
              serviceName = regularRate.name;
              serviceCategory = regularRate.category;
              servicePrice = regularRate.price;
              serviceTaxCodeId = regularRate.taxCode;
              break;
            }
            case 'overtime': {
              const overtimeRate = tryGetRate('overtime');
              serviceName = overtimeRate.name;
              serviceCategory = overtimeRate.category;
              servicePrice = overtimeRate.price;
              serviceTaxCodeId = overtimeRate.taxCode;
              // Fallback to regular if overtime not configured
              if (!serviceName || servicePrice === 0) {
                const fallbackRegularRate = tryGetRate('regular');
                serviceName = fallbackRegularRate.name;
                serviceCategory = fallbackRegularRate.category;
                servicePrice = fallbackRegularRate.price;
                serviceTaxCodeId = fallbackRegularRate.taxCode;
              }
              break;
            }
            case 'double_time': {
              const doubleTimeRate = tryGetRate('double_time');
              serviceName = doubleTimeRate.name;
              serviceCategory = doubleTimeRate.category;
              servicePrice = doubleTimeRate.price;
              serviceTaxCodeId = doubleTimeRate.taxCode;
              // Fallback to overtime, then regular if double time not configured
              if (!serviceName || servicePrice === 0) {
                const fallbackOvertimeRate = tryGetRate('overtime');
                serviceName = fallbackOvertimeRate.name;
                serviceCategory = fallbackOvertimeRate.category;
                servicePrice = fallbackOvertimeRate.price;
                serviceTaxCodeId = fallbackOvertimeRate.taxCode;
                // If overtime also not configured, use regular
                if (!serviceName || servicePrice === 0) {
                  const fallbackRegularRate = tryGetRate('regular');
                  serviceName = fallbackRegularRate.name;
                  serviceCategory = fallbackRegularRate.category;
                  servicePrice = fallbackRegularRate.price;
                  serviceTaxCodeId = fallbackRegularRate.taxCode;
                }
              }
              break;
            }
            default:
              // No-op for unknown rate types
              break;
          }

          // Skip if no service name found (shouldn't happen with fallbacks, but safety check)
          // Convert servicePrice to number if it's a string
          const numericPrice =
            typeof servicePrice === 'string' ? parseFloat(servicePrice) : servicePrice;
          if (!serviceName || !numericPrice || numericPrice === 0) {
            console.warn(
              `No service/price found for ${rateTypeKey} rate type for position ${position}`,
              {
                ratePrefix,
                rateTypeKey,
                serviceName,
                servicePrice,
                numericPrice,
                positionRate: {
                  regular_name: positionRate[`${ratePrefix}_regular_service_name`],
                  regular_price: positionRate[`${ratePrefix}_regular_service_price`],
                  weekday_regular_name: positionRate[`weekday_regular_service_name`],
                  weekday_regular_price: positionRate[`weekday_regular_service_price`],
                  overtime_name: positionRate[`${ratePrefix}_overtime_service_name`],
                  overtime_price: positionRate[`${ratePrefix}_overtime_service_price`],
                  double_time_name: positionRate[`${ratePrefix}_double_time_service_name`],
                  double_time_price: positionRate[`${ratePrefix}_double_time_service_price`],
                },
              }
            );
            return;
          }

          // Use numeric price
          servicePrice = numericPrice;

          const serviceDisplay = serviceCategory
            ? `${serviceCategory}:${serviceName}`
            : serviceName;

          const description = `${serviceName}-${jobNumber}${descriptionSuffix}`;

          // Use tax code from customer rate, or fallback to service's tax code
          const finalTaxCodeId =
            serviceTaxCodeId || getServiceTaxCode(serviceName, serviceCategory);

          // Calculate total and round to 2 decimal places to avoid floating point issues
          const itemTotal = Math.round(servicePrice * hours * 100) / 100;

          const newItem = {
            id: `item-${itemIdCounter++}`,
            title: serviceName,
            description,
            service: serviceDisplay,
            serviceDate: jobDate,
            price: servicePrice,
            quantity: hours,
            tax: finalTaxCodeId,
            total: itemTotal,
            // Store worker/position info in separate fields
            workerName: workerName || '',
            position: getPositionDisplayName(position),
            shiftTimes: formattedShiftTimes,
            vehicleType: '',
            breakMinutes: breakMinutes ?? null,
            travelMinutes: travelMinutes ?? null,
          };

          items.push(newItem);
        };

        // Add regular hours item (if any)
        if (regularHours > 0) {
          addServiceItem(regularHours, 'regular', '');
        }

        // Add overtime hours item (if any)
        if (overtimeHours > 0) {
          addServiceItem(overtimeHours, 'overtime', ' (OT)');
        }

        // Add double time hours item (if any)
        if (doubleTimeHours > 0) {
          addServiceItem(doubleTimeHours, 'double_time', ' (DT)');
        }

        // Add mobilization if this worker needs it (only once per worker)
        if (regularHours > 0 || overtimeHours > 0 || doubleTimeHours > 0) {
          addMobilizationItem(workerId, position, workerName);
        }
      };

      // First, process timesheet entries (if available)
      job.timesheets.forEach((timesheet) => {
        timesheet.entries?.forEach((entry) => {
          if (!entry.worker_id || !entry.position) return;

          // Skip if already processed
          if (processedWorkers.has(entry.worker_id)) return;

          const normalizedPosition = entry.position.toUpperCase().replace(/\s+/g, '_');
          const positionRate = currentRates.find((r) => {
            const ratePosition = r.position.toUpperCase().replace(/\s+/g, '_');
            return ratePosition === normalizedPosition;
          });

          if (!positionRate) {
            console.warn(
              `No rate found for position: ${entry.position} (normalized: ${normalizedPosition})`,
              {
                availablePositions: currentRates.map((r) => r.position),
                normalizedPositions: currentRates.map((r) =>
                  r.position.toUpperCase().replace(/\s+/g, '_')
                ),
              }
            );
            return;
          }

          // Get worker name from entry
          const workerName =
            entry.first_name && entry.last_name
              ? `${entry.first_name} ${entry.last_name}`
              : entry.first_name || entry.last_name || undefined;

          // Determine rate type and shift times from timesheet entry
          let rateType = 'weekday_regular';
          let shiftStart: string | undefined = entry.shift_start ?? undefined;
          let shiftEnd: string | undefined = entry.shift_end ?? undefined;

          if (entry.shift_start && entry.shift_end) {
            // Use timesheet entry times
            rateType = getRequiredRateType(job.start_time, entry.shift_start, entry.shift_end);
          } else {
            // Fallback to worker schedule
            const worker = job.workers.find((w) => w.user_id === entry.worker_id);
            if (worker && worker.start_time && worker.end_time) {
              rateType = getRequiredRateType(job.start_time, worker.start_time, worker.end_time);
              shiftStart = worker.start_time;
              shiftEnd = worker.end_time;
            }
          }

          // Get total work minutes from timesheet entry (accounts for breaks)
          const totalWorkMinutes = entry.total_work_minutes || entry.shift_total_minutes || null;

          // Get break minutes from timesheet entry
          const breakMinutes = entry.break_minutes || entry.break_total_minutes || null;

          // Calculate total travel minutes from timesheet entry
          const travelMinutes =
            entry.total_travel_minutes ||
            (entry.travel_to_minutes || 0) +
              (entry.travel_from_minutes || 0) +
              (entry.travel_during_minutes || 0) ||
            null;

          // Add service item and mobilization (if needed) for this worker
          addWorkerServiceItem(
            entry.worker_id,
            entry.position,
            rateType,
            positionRate,
            workerName,
            shiftStart,
            shiftEnd,
            totalWorkMinutes,
            breakMinutes,
            travelMinutes
          );
          processedWorkers.add(entry.worker_id);
        });
      });

      // Process workers without timesheet entries (use schedule)
      job.workers.forEach((worker) => {
        if (worker.status !== 'accepted' || !worker.position) return;
        if (processedWorkers.has(worker.user_id)) return;

        const normalizedPosition = worker.position.toUpperCase().replace(/\s+/g, '_');
        const positionRate = currentRates.find((r) => {
          const ratePosition = r.position.toUpperCase().replace(/\s+/g, '_');
          return ratePosition === normalizedPosition;
        });

        if (!positionRate || !worker.start_time || !worker.end_time) return;

        // Get worker name
        const workerName =
          worker.first_name && worker.last_name
            ? `${worker.first_name} ${worker.last_name}`
            : worker.first_name || worker.last_name || undefined;

        // Determine rate type from worker schedule
        const rateType = getRequiredRateType(job.start_time, worker.start_time, worker.end_time);

        // Add service item and mobilization (if needed) for this worker
        // No timesheet entry, so no break or travel time data
        addWorkerServiceItem(
          worker.user_id,
          worker.position,
          rateType,
          positionRate,
          workerName,
          worker.start_time,
          worker.end_time,
          null, // totalWorkMinutes
          null, // breakMinutes
          null // travelMinutes
        );
        processedWorkers.add(worker.user_id);
      });
    });

    // Sort items by service date (job date) - oldest first
    items.sort((a, b) => {
      const dateA = a.serviceDate ? new Date(a.serviceDate).getTime() : 0;
      const dateB = b.serviceDate ? new Date(b.serviceDate).getTime() : 0;
      return dateA - dateB;
    });

    return items;
  }, [jobDetails, currentRates, services]);

  // Recalculate missing rates when rates or job details change
  // Check timesheet entries for actual work times and mobilization
  useEffect(() => {
    if (jobDetails.length === 0) {
      setMissingRates([]);
      setMissingRateTypes([]);
      return;
    }

    const missingPositions = new Set<string>();
    const missingRateTypesMap = new Map<string, Set<string>>(); // position -> Set of rate types
    const positionsNeedingMobilization = new Set<string>();

    jobDetails.forEach((job: JobDetail) => {
      // First, collect which workers have timesheet entries WITH shift times
      // (We need shift_start/shift_end to determine rate types from timesheet entries)
      const workersWithCompleteTimesheetEntries = new Set<string>();
      job.timesheets.forEach((timesheet) => {
        timesheet.entries?.forEach((entry) => {
          // Only count as "complete" if it has shift_start and shift_end
          if (entry.worker_id && entry.shift_start && entry.shift_end) {
            workersWithCompleteTimesheetEntries.add(entry.worker_id);
          }
        });
      });

      // Then check all accepted workers from job.workers
      // Use worker schedules as fallback when timesheet entries are not available or incomplete
      job.workers.forEach((worker) => {
        if (worker.status === 'accepted' && worker.position) {
          // Skip if this worker has complete timesheet entries (we'll check those separately)
          if (workersWithCompleteTimesheetEntries.has(worker.user_id)) {
            return;
          }

          // Normalize position: uppercase and replace spaces with underscores
          const normalizedPosition = worker.position.toUpperCase().replace(/\s+/g, '_');
          const positionRate = currentRates.find((r) => {
            // Match position with normalized format (case-insensitive, handle spaces/underscores)
            const ratePosition = r.position.toUpperCase().replace(/\s+/g, '_');
            return ratePosition === normalizedPosition;
          });

          // Use worker schedule to determine which rate types are needed
          if (worker.start_time && worker.end_time) {
            // Calculate total work hours to determine ALL required rate types
            const startTime = new Date(worker.start_time);
            const endTime = new Date(worker.end_time);
            const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

            // Get all required rate types based on hour splitting logic
            // Pass shift times for Saturday time-of-day splitting
            const requiredRateTypes = getRequiredRateTypes(
              job.start_time,
              totalMinutes,
              worker.start_time,
              worker.end_time
            );

            if (!positionRate) {
              // No rate exists at all for this position
              missingPositions.add(normalizedPosition);
              if (!missingRateTypesMap.has(normalizedPosition)) {
                missingRateTypesMap.set(normalizedPosition, new Set());
              }
              requiredRateTypes.forEach((rt) =>
                missingRateTypesMap.get(normalizedPosition)!.add(rt)
              );
            } else {
              // Position has rates, but check if specific rate types are missing
              requiredRateTypes.forEach((rateType) => {
                let isMissing = false;

                switch (rateType) {
                  case 'weekday_regular':
                    isMissing = !positionRate.weekday_regular_service_id;
                    break;
                  case 'weekday_overtime':
                    isMissing = !positionRate.weekday_overtime_service_id;
                    break;
                  case 'weekday_double_time':
                    isMissing = !positionRate.weekday_double_time_service_id;
                    break;
                  case 'saturday_overtime':
                    isMissing = !positionRate.saturday_overtime_service_id;
                    break;
                  case 'saturday_double_time':
                    isMissing = !positionRate.saturday_double_time_service_id;
                    break;
                  case 'sunday_holiday_double_time':
                    isMissing = !positionRate.sunday_holiday_double_time_service_id;
                    break;
                  default:
                    isMissing = false;
                }

                if (isMissing) {
                  missingPositions.add(normalizedPosition);
                  if (!missingRateTypesMap.has(normalizedPosition)) {
                    missingRateTypesMap.set(normalizedPosition, new Set());
                  }
                  missingRateTypesMap.get(normalizedPosition)!.add(rateType);
                }
              });
            }
          } else if (!positionRate) {
            // No rate exists and we can't determine rate type from schedule
            missingPositions.add(normalizedPosition);
            if (!missingRateTypesMap.has(normalizedPosition)) {
              missingRateTypesMap.set(normalizedPosition, new Set());
            }
            missingRateTypesMap.get(normalizedPosition)!.add('position_missing');
          }
        }
      });

      // Then check timesheet entries for actual work times and specific rate types
      // (These take precedence over worker schedules)
      const jobHasVehicles = job.vehicles && job.vehicles.length > 0;
      job.timesheets.forEach((timesheet) => {
        timesheet.entries?.forEach((entry) => {
          if (!entry.position || !entry.worker_id) return;

          // Normalize position to match rate position format (uppercase, replace spaces with underscores)
          const position = entry.position.toUpperCase().replace(/\s+/g, '_');

          // Check if we have shift times from timesheet entry
          if (entry.shift_start && entry.shift_end) {
            // Use total_work_minutes if available, otherwise calculate from shift times
            const totalWorkMinutes = entry.total_work_minutes || entry.shift_total_minutes || null;

            // Get all required rate types based on hour splitting logic
            // Pass shift times for Saturday time-of-day splitting
            const requiredRateTypes = getRequiredRateTypes(
              job.start_time,
              totalWorkMinutes,
              entry.shift_start,
              entry.shift_end
            );

            const positionRate = currentRates.find((r) => {
              const ratePosition = r.position.toUpperCase().replace(/\s+/g, '_');
              return ratePosition === position;
            });

            if (!positionRate) {
              // No rate exists at all for this position
              missingPositions.add(position);
              if (!missingRateTypesMap.has(position)) {
                missingRateTypesMap.set(position, new Set());
              }
              requiredRateTypes.forEach((rt) => missingRateTypesMap.get(position)!.add(rt));
            } else {
              // Check each required rate type
              requiredRateTypes.forEach((rateType) => {
                let isMissing = false;
                switch (rateType) {
                  case 'weekday_regular':
                    isMissing = !positionRate.weekday_regular_service_id;
                    break;
                  case 'weekday_overtime':
                    isMissing = !positionRate.weekday_overtime_service_id;
                    break;
                  case 'weekday_double_time':
                    isMissing = !positionRate.weekday_double_time_service_id;
                    break;
                  case 'saturday_overtime':
                    isMissing = !positionRate.saturday_overtime_service_id;
                    break;
                  case 'saturday_double_time':
                    isMissing = !positionRate.saturday_double_time_service_id;
                    break;
                  case 'sunday_holiday_double_time':
                    isMissing = !positionRate.sunday_holiday_double_time_service_id;
                    break;
                  default:
                    isMissing = false;
                }

                if (isMissing) {
                  missingPositions.add(position);
                  if (!missingRateTypesMap.has(position)) {
                    missingRateTypesMap.set(position, new Set());
                  }
                  missingRateTypesMap.get(position)!.add(rateType);
                }
              });
            }
          }

          // Check for mobilization service only if job has vehicles AND entry has mob=true
          // OR if entry explicitly has mob=true (indicating mobilization was used)
          if (entry.mob === true && jobHasVehicles) {
            const normalizedPosition = entry.position.toUpperCase().replace(/\s+/g, '_');
            // Only check mobilization for positions that can have it (LCT, HWY, Field Supervisor)
            if (['LCT', 'HWY', 'FIELD_SUPERVISOR'].includes(normalizedPosition)) {
              const positionRate = currentRates.find((r) => {
                const ratePosition = r.position.toUpperCase().replace(/\s+/g, '_');
                return ratePosition === normalizedPosition;
              });
              if (!positionRate?.mobilization_service_id) {
                missingPositions.add(normalizedPosition);
                positionsNeedingMobilization.add(normalizedPosition);
                if (!missingRateTypesMap.has(normalizedPosition)) {
                  missingRateTypesMap.set(normalizedPosition, new Set());
                }
                missingRateTypesMap.get(normalizedPosition)!.add('mobilization');
              }
            }
          }
        });
      });

      // Also check for mobilization if job has vehicles assigned to specific workers
      // Only check mobilization for workers who have vehicles assigned to them
      if (job.vehicles && job.vehicles.length > 0) {
        // Create a set of worker IDs who have vehicles assigned
        const workersWithVehicles = new Set(
          job.vehicles.filter((v) => v.operator_id).map((v) => v.operator_id)
        );

        job.workers.forEach((worker) => {
          // Only check mobilization if this worker has a vehicle assigned
          if (
            worker.status === 'accepted' &&
            worker.position &&
            workersWithVehicles.has(worker.user_id)
          ) {
            const position = worker.position.toUpperCase();
            // Only check mobilization for positions that can have it (LCT, HWY, Field Supervisor)
            // Handle both 'FIELD_SUPERVISOR' and 'FIELD SUPERVISOR' formats
            const normalizedPosition = position.replace(/\s+/g, '_');
            if (['LCT', 'HWY', 'FIELD_SUPERVISOR'].includes(normalizedPosition)) {
              const positionRate = currentRates.find((r) => {
                const ratePosition = r.position.toUpperCase().replace(/\s+/g, '_');
                return ratePosition === normalizedPosition;
              });
              if (!positionRate?.mobilization_service_id) {
                missingPositions.add(normalizedPosition);
                positionsNeedingMobilization.add(normalizedPosition);
                if (!missingRateTypesMap.has(normalizedPosition)) {
                  missingRateTypesMap.set(normalizedPosition, new Set());
                }
                missingRateTypesMap.get(normalizedPosition)!.add('mobilization');
              }
            }
          }
        });
      }
    });

    setMissingRates(Array.from(missingPositions));

    // Convert map to array format
    const missingRateTypesArray: Array<{ position: string; rateType: string }> = [];
    missingRateTypesMap.forEach((rateTypes, position) => {
      rateTypes.forEach((rateType) => {
        missingRateTypesArray.push({ position, rateType });
      });
    });
    setMissingRateTypes(missingRateTypesArray);
  }, [jobDetails, currentRates]);

  const handleNext = useCallback(
    (e?: React.MouseEvent<HTMLButtonElement>) => {
      // Prevent form submission and page refresh
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Additional safety: prevent any default behavior
      if (e?.nativeEvent) {
        e.nativeEvent.preventDefault?.();
        e.nativeEvent.stopPropagation?.();
      }

      // Use functional update to get the current step value
      setActiveStep((prevStep) => {
        if (prevStep === 0) {
          // At step 0, Next button should only proceed if jobs are already found
          // The Search button handles the actual search
          if (foundJobs.length === 0) {
            toast.error('Please search for jobs first');
            return prevStep;
          }
          // Jobs found, proceed to step 1
          return prevStep + 1;
        } else if (prevStep === 1) {
          // Load job details and rates
          if (!selectedCustomerId) {
            toast.error('Please select a customer');
            return prevStep;
          }
          if (selectedJobIds.size === 0) {
            toast.error('Please select at least one job');
            return prevStep;
          }

          // Check if any selected jobs are not completed
          const incompleteJobs = foundJobs.filter(
            (job) => selectedJobIds.has(job.id) && job.status !== 'completed'
          );

          if (incompleteJobs.length > 0) {
            // Show confirmation dialog
            setShowIncompleteJobsDialog(true);
            return prevStep;
          }

          // All jobs are completed, proceed
          getJobDetailsMutation.mutate();
          return prevStep; // Don't change step yet, wait for mutation
        } else if (prevStep === 2) {
          // Move from Verify Timesheets to Validate Rates
          return 3;
        } else if (prevStep === 3) {
          // Check if there are missing rates
          if (missingRates.length > 0) {
            toast.error('Please assign missing rates before proceeding');
            return prevStep;
          }
          // Move to confirm invoice items
          return 4;
        } else if (prevStep === 4) {
          // Move to review & generate - generate invoice items first
          setIsGeneratingItems(true);
          // Use requestAnimationFrame to ensure UI updates, then generate items
          requestAnimationFrame(() => {
            setTimeout(() => {
              try {
                // Generate items to ensure they're ready for step 5
                generateInvoiceItems();
                setActiveStep(5);
              } finally {
                setIsGeneratingItems(false);
              }
            }, 100); // Small delay to show loading state
          });
          return prevStep; // Don't change step yet, wait for async operation
        }
        return prevStep;
      });
    },
    [
      selectedCustomerId,
      getJobDetailsMutation,
      missingRates,
      foundJobs,
      selectedJobIds,
      generateInvoiceItems,
    ]
  );

  // Memoize invoice data for step 5 to prevent form reset on every render
  // This ensures the form only resets when actual dependencies change, not on every render
  const invoiceDataForStep5 = useMemo(() => {
    if (activeStep !== 5) return undefined;

    const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
    if (!selectedCustomer) return undefined;

    const generatedItems = generateInvoiceItems();

    return {
      invoiceTo: {
        id: selectedCustomer.id,
        name: selectedCustomer.name,
        company: selectedCustomer.company_name || undefined,
        phoneNumber: selectedCustomer.phone || undefined,
        email: selectedCustomer.email || undefined,
        fullAddress: undefined, // Address would need to be fetched if available
      },
      poNumber: searchType === 'po' ? poNumber : '', // PO Number field (user input)
      networkNumber:
        searchType === 'network' ? networkNumber : searchType === 'po' ? null : networkNumber,
      createDate: new Date(), // Default to today's date
      dueDate: null, // Will be calculated based on terms
      terms: defaultTerm?.id || null, // Set default term (Net 30 or first available)
      approver: null,
      customerMemo: '', // Message on invoice
      privateNote: '', // Message on statement
      items: generatedItems, // Auto-populated from job details
      subtotal: 0,
      totalAmount: 0,
      discount: 0,
      discountType: 'percent' as const,
      invoiceFrom: {
        id: 'eaglegreen',
        name: 'Eagle Green',
        company: 'Traffic Management',
        fullAddress: '#200-100 Park Royal, West Vancouver BC V7T 1A2',
        phoneNumber: 'accounting@eaglegreen.ca',
      },
    };
  }, [
    activeStep,
    selectedCustomerId,
    customers,
    defaultTerm?.id,
    generateInvoiceItems,
    networkNumber,
    poNumber,
    searchType,
  ]);

  const handleBack = useCallback((e?: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent form submission and page refresh
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleReset = useCallback(() => {
    setActiveStep(0);
    setPoNumber('');
    setNetworkNumber('');
    setFoundJobs([]);
    setSelectedJobIds(new Set());
    setSelectedCustomerId('');
    setJobDetails([]);
    setCustomerRates([]);
    setMissingRates([]);
  }, []);

  const handleGenerateInvoice = useCallback(async () => {
    if (!formRef.current) {
      toast.error('Form is not ready. Please wait a moment and try again.');
      return;
    }

    // Force recalculate totals before getting form data
    // This ensures totals are up-to-date even if useEffect hasn't run yet
    const formMethods = formRef.current.formMethods;
    const currentItems = formMethods.getValues('items') || [];
    const currentDiscount = formMethods.getValues('discount') || 0;
    const currentDiscountType = formMethods.getValues('discountType') || 'percent';

    // Calculate subtotal
    const calculatedSubtotal = currentItems.reduce((sum: number, item: any) => sum + (item.quantity || 0) * (item.price || 0), 0);

    // Calculate discount amount
    const discountAmount =
      currentDiscountType === 'percent'
        ? (calculatedSubtotal * (currentDiscount || 0)) / 100
        : currentDiscount || 0;

    // Calculate tax
    const calculatedTax = currentItems.reduce((sum: number) => 
      // Tax calculation would need tax codes - for now use 0
       sum
    , 0);

    // Calculate total
    const calculatedTotal = calculatedSubtotal - discountAmount + calculatedTax;

    // Set calculated values in form
    formMethods.setValue('subtotal', calculatedSubtotal, { shouldValidate: false });
    formMethods.setValue('totalAmount', calculatedTotal, { shouldValidate: false });
    formMethods.setValue('taxes', calculatedTax, { shouldValidate: false });

    // Validate form
    const isValid = await formRef.current.trigger();
    if (!isValid) {
      // Get form errors to display helpful messages
      const formMethodsInstance = formRef.current.formMethods;
      const errors = formMethodsInstance.formState.errors;

      // Log errors for debugging
      console.error('Form validation errors:', errors);

      // Find the first error and display it
      if (errors.items && Array.isArray(errors.items)) {
        const firstItemError = errors.items.find((item: any, index: number) => item);
        if (firstItemError) {
          const errorIndex = errors.items.findIndex((item: any) => item);
          const errorFields = Object.keys(firstItemError);
          if (errorFields.length > 0) {
            const fieldName = errorFields[0];
            const errorMessage = firstItemError[fieldName]?.message || 'Validation error';
            toast.error(`Item ${errorIndex + 1}: ${errorMessage}`);
            return;
          }
        }
      }

      // Check for other common errors and scroll to the first error
      const firstErrorField = Object.keys(errors)[0];

      if (errors.store) {
        // Scroll to store field
        const storeField = document.querySelector('[name="store"]');
        if (storeField) {
          storeField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (storeField as HTMLElement).focus();
        }
        return;
      }

      if (errors.invoiceTo) {
        toast.error('Please select a customer for the invoice.');
        return;
      }
      if (errors.createDate) {
        toast.error('Please set a valid create date.');
        return;
      }
      if (errors.dueDate) {
        toast.error('Please set a valid due date.');
        return;
      }

      // Scroll to first error field if found
      if (firstErrorField) {
        const errorField = document.querySelector(`[name="${firstErrorField}"]`);
        if (errorField) {
          errorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (errorField as HTMLElement).focus();
        }
      }

      // Don't show generic toast - Zod already shows field-specific error messages
      return;
    }

    // Get form data
    const formData = formRef.current.getValues();

    // Initialize progress steps
    const steps: ProgressStep[] = [
      {
        label: 'Validating Invoice Data',
        description: 'Checking invoice details and items',
        status: 'active',
      },
      {
        label: 'Creating Invoice in MySked',
        description: 'Saving invoice to database',
        status: 'pending',
      },
      {
        label: 'Creating Invoice in QuickBooks Online',
        description: 'Generating invoice in QuickBooks Online',
        status: 'pending',
      },
      {
        label: 'Finalizing',
        description: 'Completing invoice generation',
        status: 'pending',
      },
    ];

    // Show progress dialog
    setProgressSteps(steps);
    setCurrentStep(0);
    progressDialog.onTrue();

    try {
      // Step 1: Validate invoice data
      const updatedSteps = [...steps];
      updatedSteps[0].status = 'active';
      setProgressSteps(updatedSteps);

      // Validation is already done above, so mark as completed
      updatedSteps[0].status = 'completed';
      updatedSteps[1].status = 'active';
      setCurrentStep(1);
      setProgressSteps([...updatedSteps]);

      // Step 2: Create invoice in MySked
      const invoicePayload = {
        ...formData,
        job_ids: Array.from(selectedJobIds),
      };

      const response = await fetcher([
        endpoints.invoice.create,
        {
          method: 'POST',
          data: invoicePayload,
        },
      ]);

      // Step 2 completed, move to step 3
      updatedSteps[1].status = 'completed';
      updatedSteps[2].status = 'active';
      setCurrentStep(2);
      setProgressSteps([...updatedSteps]);

      // Step 3: QBO invoice creation happens automatically in backend
      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step 3 completed - check QBO status
      if (response.qbo_status === 'completed') {
        updatedSteps[2].status = 'completed';
        updatedSteps[2].description = 'Invoice created successfully in QuickBooks';
      } else if (response.qbo_status === 'error') {
        updatedSteps[2].status = 'error';
        updatedSteps[2].description = response.qbo_message || 'QuickBooks invoice creation failed';
      } else {
        updatedSteps[2].status = 'completed';
        updatedSteps[2].description =
          response.qbo_message || 'Invoice creation skipped (customer needs email or QBO ID)';
      }

      updatedSteps[3].status = 'active';
      setCurrentStep(3);
      setProgressSteps([...updatedSteps]);

      // Step 4: Finalize
      await new Promise((resolve) => setTimeout(resolve, 1000));

      updatedSteps[3].status = 'completed';
      setProgressSteps([...updatedSteps]);

      // Only show success and redirect if QBO invoice was created successfully
      if (response.qbo_status === 'completed') {
        // Use QBO invoice number if available, otherwise use display_id
        const invoiceNumber = response.data?.qbo_doc_number || response.data?.display_id;
        const successMessage = invoiceNumber
          ? `Invoice created successfully! Invoice #${invoiceNumber}`
          : 'Invoice created successfully!';

        // Close progress dialog after a brief delay
        setTimeout(() => {
          progressDialog.onFalse();
          toast.success(successMessage);
          router.push(paths.management.invoice.list);
        }, 1500);
      } else {
        // QBO creation failed or was skipped - show warning and stay on page
        const warningMessage =
          response.qbo_status === 'error'
            ? `Invoice created in MySked, but QuickBooks creation failed: ${response.qbo_message || 'Unknown error'}`
            : `Invoice created in MySked. ${response.qbo_message || 'QuickBooks invoice creation was skipped'}`;

        setTimeout(() => {
          progressDialog.onFalse();
          toast.warning(warningMessage);
          // Don't redirect - let user see the invoice form
        }, 2000);
      }
    } catch (error: any) {
      // Update current step to error state
      const errorSteps = [...progressSteps];
      if (errorSteps[currentStep]) {
        errorSteps[currentStep].status = 'error';
        errorSteps[currentStep].description =
          error?.response?.data?.error || error?.message || 'An error occurred';
        setProgressSteps(errorSteps);
      }

      // Close progress dialog after showing error
      setTimeout(() => {
        progressDialog.onFalse();
      }, 2000);

      console.error('Error in invoice generation:', error);
      toast.error(error?.response?.data?.error || error?.message || 'Failed to generate invoice');
    }
  }, [selectedJobIds, progressDialog, router, currentStep, progressSteps]);

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={3}>
            <Typography variant="h6">Enter Purchase Order Number or Network Number</Typography>
            <Typography variant="body2" color="text.secondary">
              Please enter either a Purchase Order Number or a Network Number to search for
              associated jobs.
            </Typography>

            <RadioGroup
              value={searchType}
              onChange={(e) => {
                const newSearchType = e.target.value as 'po' | 'network';
                setSearchType(newSearchType);
                // Clear the opposite field when switching
                if (newSearchType === 'po') {
                  setNetworkNumber('');
                } else {
                  setPoNumber('');
                }
                // Clear found jobs and reset search state
                setFoundJobs([]);
                setLastSearchedType(null);
              }}
            >
              <FormControlLabel
                value="po"
                control={<Radio />}
                label="Search by Purchase Order Number"
              />
              <FormControlLabel
                value="network"
                control={<Radio />}
                label="Search by Network Number"
              />
            </RadioGroup>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                sx={{ flex: 1 }}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                minDate={startDate || undefined}
                sx={{ flex: 1 }}
              />
            </Box>
            {searchType === 'po' ? (
              <TextField
                fullWidth
                label="Purchase Order Number"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && poNumber.trim() && !searchJobsMutation.isPending) {
                    e.preventDefault();
                    searchJobsMutation.mutate({
                      searchType,
                      poNumber,
                      networkNumber,
                      startDate,
                      endDate,
                    });
                  }
                }}
                placeholder="Enter Purchase Order Number"
                disabled={searchJobsMutation.isPending}
              />
            ) : (
              <TextField
                fullWidth
                label="Network Number"
                value={networkNumber}
                onChange={(e) => setNetworkNumber(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && networkNumber.trim() && !searchJobsMutation.isPending) {
                    e.preventDefault();
                    searchJobsMutation.mutate({
                      searchType,
                      poNumber,
                      networkNumber,
                      startDate,
                      endDate,
                    });
                  }
                }}
                placeholder="Enter Network Number"
                disabled={searchJobsMutation.isPending}
              />
            )}

            <Button
              variant="contained"
              onClick={() => {
                if (searchType === 'po' && poNumber.trim()) {
                  searchJobsMutation.mutate({
                    searchType,
                    poNumber,
                    networkNumber,
                    startDate,
                    endDate,
                  });
                } else if (searchType === 'network' && networkNumber.trim()) {
                  searchJobsMutation.mutate({
                    searchType,
                    poNumber,
                    networkNumber,
                    startDate,
                    endDate,
                  });
                }
              }}
              disabled={
                searchJobsMutation.isPending ||
                (searchType === 'po' && !poNumber.trim()) ||
                (searchType === 'network' && !networkNumber.trim())
              }
              startIcon={<Iconify icon="eva:search-fill" />}
            >
              Search
            </Button>

            {foundJobs.length > 0 && (
              <Alert severity="success">
                Found {foundJobs.length} job(s) matching your search:
                <Box component="span" sx={{ ml: 1, fontWeight: 600 }}>
                  {foundJobs.map((job) => `#${job.job_number}`).join(', ')}
                </Box>
              </Alert>
            )}

            {searchJobsMutation.isSuccess &&
              foundJobs.length === 0 &&
              lastSearchedType === searchType && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    No jobs found
                  </Typography>
                  <Typography variant="body2">
                    {searchType === 'po'
                      ? 'No jobs were found with the provided Purchase Order Number. Please verify the number and try again.'
                      : 'No jobs were found with the provided Network Number. Please verify the number and try again.'}
                  </Typography>
                </Alert>
              )}

            {searchJobsMutation.isError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Unable to Search
                </Typography>
                <Typography variant="body2">
                  {searchJobsMutation.error?.response?.data?.error ||
                    'A server error occurred while searching. Please check your connection and try again.'}
                </Typography>
              </Alert>
            )}
          </Stack>
        );

      case 1:
        return (
          <Stack spacing={3}>
            <Typography variant="h6">Select Customer</Typography>
            <Typography variant="body2" color="text.secondary">
              {foundJobs.length} job(s) found. Please select which customer the invoice should be
              created for.
            </Typography>

            {/* Display found jobs with selection */}
            {foundJobs.length > 0 && (
              <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Found Jobs ({selectedJobIds.size} of {foundJobs.length} selected):
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedJobIds.size === foundJobs.length && foundJobs.length > 0}
                        indeterminate={
                          selectedJobIds.size > 0 && selectedJobIds.size < foundJobs.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedJobIds(new Set(foundJobs.map((j) => j.id)));
                          } else {
                            setSelectedJobIds(new Set());
                          }
                        }}
                      />
                    }
                    label="Select All"
                    sx={{ m: 0 }}
                  />
                </Box>
                <Stack spacing={2}>
                  {sortedFoundJobs.map((job) => (
                    <Box
                      key={job.id}
                      onClick={() => {
                        const newSelected = new Set(selectedJobIds);
                        if (selectedJobIds.has(job.id)) {
                          newSelected.delete(job.id);
                        } else {
                          newSelected.add(job.id);
                        }
                        setSelectedJobIds(newSelected);
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        width: '100%',
                        p: 2,
                        borderRadius: 1,
                        bgcolor: 'background.paper',
                        border: 1,
                        borderColor: selectedJobIds.has(job.id) ? 'primary.main' : 'divider',
                        borderWidth: selectedJobIds.has(job.id) ? 2 : 1,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <Checkbox
                        checked={selectedJobIds.has(job.id)}
                        onChange={(e) => {
                          e.stopPropagation(); // Prevent double toggle
                          const newSelected = new Set(selectedJobIds);
                          if (e.target.checked) {
                            newSelected.add(job.id);
                          } else {
                            newSelected.delete(job.id);
                          }
                          setSelectedJobIds(newSelected);
                        }}
                        onClick={(e) => e.stopPropagation()} // Prevent double toggle
                        sx={{ mt: 0.5, mr: 2 }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 1.5,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            #{job.job_number}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Job Status:
                            </Typography>
                            <Label
                              variant="soft"
                              color={
                                (job.status === 'draft' && 'info') ||
                                (job.status === 'pending' && 'warning') ||
                                (job.status === 'ready' && 'primary') ||
                                (job.status === 'in_progress' && 'secondary') ||
                                (job.status === 'completed' && 'success') ||
                                (job.status === 'cancelled' && 'error') ||
                                'default'
                              }
                            >
                              {job.status === 'draft' && 'Draft'}
                              {job.status === 'pending' && 'Pending'}
                              {job.status === 'ready' && 'Ready'}
                              {job.status === 'in_progress' && 'In Progress'}
                              {job.status === 'completed' && 'Completed'}
                              {job.status === 'cancelled' && 'Cancelled'}
                              {![
                                'draft',
                                'pending',
                                'ready',
                                'in_progress',
                                'completed',
                                'cancelled',
                              ].includes(job.status) && job.status}
                            </Label>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Timesheet Status:
                            </Typography>
                            <Label
                              variant="soft"
                              color={
                                (job.timesheet_status === 'draft' && 'info') ||
                                (job.timesheet_status === 'submitted' && 'success') ||
                                (job.timesheet_status === 'approved' && 'success') ||
                                (job.timesheet_status === 'rejected' && 'error') ||
                                (!job.timesheet_status && 'warning') ||
                                'default'
                              }
                            >
                              {job.timesheet_status
                                ? job.timesheet_status.charAt(0).toUpperCase() +
                                  job.timesheet_status.slice(1)
                                : 'Missing'}
                            </Label>
                          </Box>
                        </Box>
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={2}
                          sx={{ justifyContent: 'space-between' }}
                        >
                          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 50%' } }}>
                            <Stack spacing={0.75}>
                              {job.po_number && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ minWidth: 80 }}
                                  >
                                    PO Number:
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color={searchType === 'po' ? 'primary.main' : 'text.secondary'}
                                    sx={{ fontWeight: searchType === 'po' ? 600 : 400 }}
                                  >
                                    {job.po_number}
                                  </Typography>
                                </Box>
                              )}
                              {job.network_number && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ minWidth: 80 }}
                                  >
                                    Network Number:
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color={
                                      searchType === 'network' ? 'primary.main' : 'text.secondary'
                                    }
                                    sx={{ fontWeight: searchType === 'network' ? 600 : 400 }}
                                  >
                                    {job.network_number}
                                  </Typography>
                                </Box>
                              )}
                              {job.company_name && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ minWidth: 80 }}
                                  >
                                    Customer:
                                  </Typography>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Avatar
                                      src={job.company_logo_url || undefined}
                                      alt={job.company_name || 'Unknown'}
                                      sx={{ width: 24, height: 24 }}
                                    >
                                      {!job.company_logo_url &&
                                        (job.company_name || 'C').charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Typography variant="body2" color="text.secondary">
                                      {job.company_name}
                                    </Typography>
                                  </Stack>
                                </Box>
                              )}
                              {job.client_name && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ minWidth: 80 }}
                                  >
                                    Client:
                                  </Typography>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Avatar
                                      src={job.client_logo_url || undefined}
                                      alt={job.client_name || 'Unknown'}
                                      sx={{ width: 24, height: 24 }}
                                    >
                                      {!job.client_logo_url &&
                                        (job.client_name || 'C').charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Typography variant="body2" color="text.secondary">
                                      {job.client_name}
                                    </Typography>
                                  </Stack>
                                </Box>
                              )}
                              {job.site_name && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ minWidth: 80 }}
                                  >
                                    Site:
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {job.site_name}
                                  </Typography>
                                </Box>
                              )}
                              {job.site_address && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ minWidth: 80 }}
                                  >
                                    Site Address:
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {job.site_address}
                                  </Typography>
                                </Box>
                              )}
                            </Stack>
                          </Box>
                          <Box
                            sx={{
                              flex: { xs: '1 1 100%', sm: '1 1 50%' },
                              display: 'flex',
                              justifyContent: 'flex-end',
                            }}
                          >
                            <Stack
                              spacing={0.75}
                              sx={{ alignItems: 'flex-end', textAlign: 'right' }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ minWidth: 80 }}
                                >
                                  Job Date:
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {fDate(job.start_time, 'MMM DD YYYY')}
                                </Typography>
                              </Box>
                              {(job.created_by_first_name || job.created_by_last_name) && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ minWidth: 80 }}
                                  >
                                    Created by:
                                  </Typography>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Avatar
                                      src={job.created_by_photo_url || undefined}
                                      alt={
                                        [job.created_by_first_name, job.created_by_last_name]
                                          .filter(Boolean)
                                          .join(' ') || 'Unknown'
                                      }
                                      sx={{ width: 24, height: 24 }}
                                    >
                                      {!job.created_by_photo_url &&
                                        (
                                          [job.created_by_first_name, job.created_by_last_name]
                                            .filter(Boolean)
                                            .join(' ') || 'U'
                                        )
                                          .charAt(0)
                                          .toUpperCase()}
                                    </Avatar>
                                    <Typography variant="body2" color="text.secondary">
                                      {[job.created_by_first_name, job.created_by_last_name]
                                        .filter(Boolean)
                                        .join(' ') || 'Unknown'}
                                    </Typography>
                                  </Stack>
                                </Box>
                              )}
                              {(job.updated_by_first_name || job.updated_by_last_name) && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ minWidth: 80 }}
                                  >
                                    Updated by:
                                  </Typography>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Avatar
                                      src={job.updated_by_photo_url || undefined}
                                      alt={
                                        [job.updated_by_first_name, job.updated_by_last_name]
                                          .filter(Boolean)
                                          .join(' ') || 'Unknown'
                                      }
                                      sx={{ width: 24, height: 24 }}
                                    >
                                      {!job.updated_by_photo_url &&
                                        (
                                          [job.updated_by_first_name, job.updated_by_last_name]
                                            .filter(Boolean)
                                            .join(' ') || 'U'
                                        )
                                          .charAt(0)
                                          .toUpperCase()}
                                    </Avatar>
                                    <Typography variant="body2" color="text.secondary">
                                      {[job.updated_by_first_name, job.updated_by_last_name]
                                        .filter(Boolean)
                                        .join(' ') || 'Unknown'}
                                    </Typography>
                                  </Stack>
                                </Box>
                              )}
                            </Stack>
                          </Box>
                        </Stack>
                      </Box>
                    </Box>
                  ))}
                </Stack>
                {selectedJobIds.size === 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Please select at least one job to continue.
                  </Alert>
                )}
              </Card>
            )}

            {isLoadingCustomers ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : customers.length === 0 ? (
              <Alert severity="warning">
                No customers found for these jobs. Please ensure the jobs are assigned to companies
                that are synced with QuickBooks.
              </Alert>
            ) : (
              <Autocomplete
                fullWidth
                options={customers}
                value={customers.find((c) => c.id === selectedCustomerId) || null}
                onChange={(_, newValue) => {
                  setSelectedCustomerId(newValue?.id || '');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && selectedCustomerId && !getJobDetailsMutation.isPending) {
                    e.preventDefault();
                    getJobDetailsMutation.mutate();
                  }
                }}
                getOptionLabel={(option) => option.name || ''}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search and Select Customer"
                    placeholder="Type to search..."
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <Box component="li" key={key} {...otherProps}>
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {option.name}
                        </Typography>
                        {option.company_name && (
                          <Typography variant="body2" color="text.secondary">
                            {option.company_name}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                          {option.phone && (
                            <Typography variant="caption" color="text.secondary">
                              {option.phone}
                            </Typography>
                          )}
                          {option.email && (
                            <Typography variant="caption" color="text.secondary">
                              {option.email}
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    </Box>
                  );
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            )}
          </Stack>
        );

      case 2: {
        // Sort jobDetails by job date (start_time) - older jobs first
        const sortedJobDetails = [...jobDetails].sort((a, b) => {
          const dateA = new Date(a.start_time).getTime();
          const dateB = new Date(b.start_time).getTime();
          return dateA - dateB; // Ascending order (older first)
        });

        return (
          <Stack spacing={3}>
            <Typography variant="h6">Verify Timesheets</Typography>
            <Typography variant="body2" color="text.secondary">
              Checking timesheet submission status for each job. You can still proceed if timesheets
              are missing - the system will use scheduled hours instead.
            </Typography>

            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Job Number</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Timesheet Manager</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell width={50} />
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedJobDetails.map((job) => {
                  // Get the most recent timesheet (or any timesheet if multiple exist)
                  const timesheet =
                    job.timesheets.length > 0 ? job.timesheets[job.timesheets.length - 1] : null;
                  const timesheetStatus = timesheet?.status || null;
                  const hasSubmittedTimesheet = !!job.timesheets.find(
                    (t) => t.status === 'approved' || t.status === 'submitted'
                  );
                  const isExpanded = expandedRows.has(job.id);
                  // Get the submitted/approved timesheet for entries and notes
                  const submittedTimesheet = hasSubmittedTimesheet
                    ? job.timesheets.find(
                        (t) => t.status === 'approved' || t.status === 'submitted'
                      )
                    : null;
                  const timesheetEntries = submittedTimesheet?.entries || timesheet?.entries || [];
                  // Use submitted timesheet for notes, fallback to most recent timesheet
                  const timesheetForNotes = submittedTimesheet || timesheet;

                  // Check if manager exists - use timesheet_manager_id as primary check
                  let managerName = 'Not assigned';
                  if (job.timesheet_manager_id) {
                    if (job.manager_first_name && job.manager_last_name) {
                      managerName = `${job.manager_first_name} ${job.manager_last_name}`;
                    } else if (job.manager_first_name) {
                      managerName = job.manager_first_name;
                    } else if (job.manager_last_name) {
                      managerName = job.manager_last_name;
                    } else {
                      // Manager ID exists but name fields are null - might be a data issue
                      managerName = 'Manager (name unavailable)';
                    }
                  }

                  // Format time to show only time (8:00 AM) without date
                  const formatTimeOnly = (time: string | null) => {
                    if (!time) return '';
                    try {
                      const date = new Date(time);
                      const hours = date.getHours();
                      const minutes = date.getMinutes();
                      const ampm = hours >= 12 ? 'PM' : 'AM';
                      const displayHours = hours % 12 || 12;
                      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                    } catch {
                      return '';
                    }
                  };

                  const formatHours = (minutes: number | null) => {
                    if (!minutes && minutes !== 0) return '';
                    const decimalHours = minutes / 60;
                    // Round to 2 decimal places to avoid floating point issues
                    return decimalHours.toFixed(2).replace(/\.?0+$/, '');
                  };

                  // Format position using JOB_POSITION_OPTIONS
                  const formatPosition = (position: string | null) => {
                    if (!position) return '';
                    const positionOption = JOB_POSITION_OPTIONS.find(
                      (opt) => opt.value === position
                    );
                    return positionOption?.label || position;
                  };

                  // Format date with day of week
                  const formattedDateWithDay = (() => {
                    const dateStr = job.start_time.includes('T')
                      ? job.start_time.split('T')[0]
                      : job.start_time.split(' ')[0];
                    const [year, month, day] = dateStr.split('-').map(Number);
                    const date = new Date(year, month - 1, day);
                    return date.toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      weekday: 'long',
                    });
                  })();

                  return (
                    <Fragment key={job.id}>
                      <TableRow>
                        <TableCell>
                          <Typography variant="subtitle2">#{job.job_number}</Typography>
                        </TableCell>
                        <TableCell>{formattedDateWithDay}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                              src={job.manager_photo_url || undefined}
                              alt={managerName}
                              sx={{ width: 32, height: 32 }}
                            >
                              {!job.manager_photo_url &&
                              managerName !== 'Not assigned' &&
                              managerName !== 'Manager (name unavailable)'
                                ? managerName.charAt(0).toUpperCase()
                                : ''}
                            </Avatar>
                            <Typography variant="body2">{managerName}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Label
                            variant="soft"
                            color={
                              (timesheetStatus === 'draft' && 'info') ||
                              (timesheetStatus === 'submitted' && 'success') ||
                              (timesheetStatus === 'approved' && 'success') ||
                              (timesheetStatus === 'rejected' && 'error') ||
                              (!timesheetStatus && 'warning') ||
                              'default'
                            }
                          >
                            {timesheetStatus
                              ? timesheetStatus.charAt(0).toUpperCase() + timesheetStatus.slice(1)
                              : 'Missing'}
                          </Label>
                        </TableCell>
                        <TableCell>
                          {timesheetEntries.length > 0 && (
                            <IconButton
                              color={isExpanded ? 'inherit' : 'default'}
                              onClick={() => {
                                const newExpanded = new Set(expandedRows);
                                if (isExpanded) {
                                  newExpanded.delete(job.id);
                                } else {
                                  newExpanded.add(job.id);
                                }
                                setExpandedRows(newExpanded);
                              }}
                              sx={{ ...(isExpanded && { bgcolor: 'action.hover' }) }}
                            >
                              <Iconify
                                icon={
                                  isExpanded
                                    ? 'eva:arrow-ios-upward-fill'
                                    : 'eva:arrow-ios-downward-fill'
                                }
                              />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                      {timesheetEntries.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={5} sx={{ py: 0, border: 0 }}>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box sx={{ margin: 2 }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Employee</TableCell>
                                      <TableCell>Position</TableCell>
                                      <TableCell>Mob</TableCell>
                                      <TableCell>Start</TableCell>
                                      <TableCell>Break (min)</TableCell>
                                      <TableCell>End</TableCell>
                                      <TableCell>Total Hours</TableCell>
                                      <TableCell>Travel Time</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {timesheetEntries.map((entry) => {
                                      const employeeName =
                                        entry.first_name && entry.last_name
                                          ? `${entry.first_name} ${entry.last_name}`
                                          : entry.first_name || entry.last_name || 'Unknown';
                                      const employeeInitial =
                                        entry.first_name?.charAt(0) ||
                                        entry.last_name?.charAt(0) ||
                                        '?';

                                      return (
                                        <TableRow key={entry.id}>
                                          <TableCell>
                                            <Stack
                                              direction="row"
                                              spacing={1.5}
                                              alignItems="center"
                                            >
                                              <Avatar
                                                src={entry.photo_url || undefined}
                                                alt={employeeName}
                                                sx={{ width: 32, height: 32 }}
                                              >
                                                {!entry.photo_url && employeeInitial}
                                              </Avatar>
                                              <Typography variant="body2">
                                                {employeeName}
                                              </Typography>
                                            </Stack>
                                          </TableCell>
                                          <TableCell>{formatPosition(entry.position)}</TableCell>
                                          <TableCell align="center">
                                            {entry.mob && (
                                              <Box
                                                sx={{
                                                  display: 'flex',
                                                  justifyContent: 'flex-start',
                                                  alignItems: 'center',
                                                }}
                                              >
                                                <Iconify
                                                  icon="eva:checkmark-fill"
                                                  width={20}
                                                  sx={{ color: 'success.main' }}
                                                />
                                              </Box>
                                            )}
                                          </TableCell>
                                          <TableCell>{formatTimeOnly(entry.shift_start)}</TableCell>
                                          <TableCell>
                                            {entry.break_minutes || entry.break_total_minutes
                                              ? entry.break_minutes || entry.break_total_minutes
                                              : ''}
                                          </TableCell>
                                          <TableCell>{formatTimeOnly(entry.shift_end)}</TableCell>
                                          <TableCell>
                                            {formatHours(
                                              entry.total_work_minutes || entry.shift_total_minutes
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            {(() => {
                                              // Calculate total travel time from available fields
                                              const travelMinutes =
                                                entry.total_travel_minutes ||
                                                (entry.travel_to_minutes || 0) +
                                                  (entry.travel_from_minutes || 0) +
                                                  (entry.travel_during_minutes || 0);

                                              if (travelMinutes && travelMinutes > 0) {
                                                return formatHours(travelMinutes);
                                              }
                                              return '';
                                            })()}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>

                                {/* Display timesheet notes if available */}
                                {(timesheetForNotes?.notes || timesheetForNotes?.admin_notes) && (
                                  <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                    <Stack spacing={1.5}>
                                      {timesheetForNotes.notes && (
                                        <Box>
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}
                                          >
                                            Timesheet Manager Note:
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            sx={{ whiteSpace: 'pre-wrap' }}
                                          >
                                            {timesheetForNotes.notes}
                                          </Typography>
                                        </Box>
                                      )}
                                      {timesheetForNotes.admin_notes && (
                                        <Box>
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}
                                          >
                                            Admin Note:
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            sx={{ whiteSpace: 'pre-wrap' }}
                                          >
                                            {timesheetForNotes.admin_notes}
                                          </Typography>
                                        </Box>
                                      )}
                                    </Stack>
                                  </Box>
                                )}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>

            {jobDetails.some(
              (job) =>
                !job.timesheets.some((t) => t.status === 'approved' || t.status === 'submitted')
            ) && (
              <Alert severity="warning">
                Some jobs are missing submitted timesheets. The system will calculate hours based on
                worker schedules.
              </Alert>
            )}
          </Stack>
        );
      }

      case 3:
        return (
          <Stack spacing={3}>
            <Typography variant="h6">Validate Customer Rates & Job Details</Typography>
            <Typography variant="body2" color="text.secondary">
              Assign rates for positions used in these jobs. You can assign rates directly below.
            </Typography>

            {missingRates.length > 0 && (
              <Alert severity="warning">
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Missing rates detected:
                </Typography>
                <Stack spacing={0.5}>
                  {Array.from(new Set(missingRates)).map((position) => {
                    // Normalize position to match JOB_POSITION_OPTIONS format (lowercase)
                    const normalizedPosition = position.toLowerCase().replace(/\s+/g, '_');
                    const positionOption = JOB_POSITION_OPTIONS.find((opt) => {
                      const optValue = opt.value.toLowerCase().replace(/\s+/g, '_');
                      return optValue === normalizedPosition;
                    });
                    const positionLabel = positionOption?.label || position;
                    const missingTypesForPosition = missingRateTypes
                      .filter((m) => {
                        // Match positions with normalized format
                        const mPosition = m.position.toLowerCase().replace(/\s+/g, '_');
                        return mPosition === normalizedPosition;
                      })
                      .map((m) => {
                        const rateTypeLabels: Record<string, string> = {
                          weekday_regular: 'Weekday Regular (6am-5pm)',
                          weekday_overtime: 'Weekday Overtime (5pm-10pm)',
                          weekday_double_time: 'Weekday Double Time (10pm-6am)',
                          saturday_overtime: 'Saturday Overtime (6am-5pm)',
                          saturday_double_time: 'Saturday Double Time (5pm-6am)',
                          sunday_holiday_double_time: 'Sunday & Statutory Holidays Double Time',
                          mobilization: 'Mobilization Service',
                          position_missing: 'Position Rates',
                        };
                        return rateTypeLabels[m.rateType] || m.rateType;
                      });
                    return (
                      <Typography key={position} variant="body2">
                        • <strong>{positionLabel}</strong>: {missingTypesForPosition.join(', ')}
                      </Typography>
                    );
                  })}
                </Stack>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Please assign the highlighted rates below before proceeding.
                </Typography>
              </Alert>
            )}

            {missingRates.length === 0 && (
              <Alert severity="success">All required rates are assigned for this customer!</Alert>
            )}

            <Divider />

            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Customer Rate Assignment
            </Typography>

            {selectedCustomerId && (
              <CustomerRateAssignment
                customerId={selectedCustomerId}
                rates={currentRates as any}
                missingRateTypes={missingRateTypes}
                onRateSaved={refetchRates}
              />
            )}
          </Stack>
        );

      case 4: {
        // Confirm Invoice Items - Show preview of what will be generated
        const previewItems = generateInvoiceItems();

        // Group items by job for better display
        const itemsByJob = new Map<
          string,
          Array<{
            item: IInvoiceItem;
            workerName?: string;
            position?: string;
            shiftTimes?: string;
            hasMobilization?: boolean;
          }>
        >();

        jobDetails.forEach((job: JobDetail) => {
          const jobNumber = job.job_number;
          const jobItems: Array<{
            item: IInvoiceItem;
            workerName?: string;
            position?: string;
            shiftTimes?: string;
            hasMobilization?: boolean;
          }> = [];

          // Get workers for this job
          const jobWorkersMap = new Map<string, { name: string; position: string }>();
          job.workers.forEach((worker) => {
            if (worker.user_id) {
              const workerName = job.workers.find((w) => w.user_id === worker.user_id)
                ? `${job.workers.find((w) => w.user_id === worker.user_id)?.first_name || ''} ${job.workers.find((w) => w.user_id === worker.user_id)?.last_name || ''}`.trim()
                : undefined;
              jobWorkersMap.set(worker.user_id, {
                name: workerName || 'Unknown',
                position: worker.position || '',
              });
            }
          });

          // Also check timesheet entries for worker names
          job.timesheets.forEach((timesheet) => {
            timesheet.entries?.forEach((entry) => {
              if (entry.worker_id) {
                const workerName =
                  entry.first_name && entry.last_name
                    ? `${entry.first_name} ${entry.last_name}`
                    : entry.first_name || entry.last_name || 'Unknown';
                jobWorkersMap.set(entry.worker_id, {
                  name: workerName,
                  position: entry.position || '',
                });
              }
            });
          });

          // Find items for this job and match them to workers
          previewItems.forEach((item) => {
            // Match by job number in description
            // Description format: "ServiceName-JobNumber (OT/DT)" or "ServiceName-JobNumber"
            if (item.description?.includes(jobNumber)) {
              const isMobilization = item.position === 'Mobilization';

              jobItems.push({
                item,
                workerName: item.workerName,
                position: isMobilization ? item.vehicleType : item.position,
                shiftTimes: item.shiftTimes,
                hasMobilization: isMobilization,
              });
            }
          });

          if (jobItems.length > 0) {
            itemsByJob.set(jobNumber, jobItems);
          }
        });

        return (
          <Stack spacing={3}>
            <Typography variant="h6">Confirm Invoice Items</Typography>
            <Typography variant="body2" color="text.secondary">
              Review the invoice items that will be generated for each job and worker. Verify that
              all services and rates are correct before proceeding.
            </Typography>

            {Array.from(itemsByJob.entries())
              .sort(([jobNumberA], [jobNumberB]) => {
                // Sort by job date (older jobs first)
                const jobA = jobDetails.find((j) => j.job_number === jobNumberA);
                const jobB = jobDetails.find((j) => j.job_number === jobNumberB);
                if (!jobA || !jobB) return 0;
                return new Date(jobA.start_time).getTime() - new Date(jobB.start_time).getTime();
              })
              .map(([jobNumber, items]) => {
                const job = jobDetails.find((j) => j.job_number === jobNumber);

                // Format date with day of week directly from job.start_time
                const formattedDateWithDay = job?.start_time
                  ? (() => {
                      // Extract date string (YYYY-MM-DD) from start_time
                      const dateStr = job.start_time.includes('T')
                        ? job.start_time.split('T')[0]
                        : job.start_time.split(' ')[0];
                      const [year, month, day] = dateStr.split('-').map(Number);
                      const date = new Date(year, month - 1, day);
                      return date.toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        weekday: 'long',
                      });
                    })()
                  : '';

                return (
                  <Card key={jobNumber} sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Job #{jobNumber}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Service Date: {formattedDateWithDay}
                        </Typography>
                      </Box>

                      <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ width: '18%' }}>Worker / Position</TableCell>
                            <TableCell sx={{ width: '27%' }}>Product/Service</TableCell>
                            <TableCell sx={{ width: '25%' }}>Description</TableCell>
                            <TableCell align="right" sx={{ width: '12%' }}>
                              Rate
                            </TableCell>
                            <TableCell align="center" sx={{ width: '8%' }}>
                              Qty
                            </TableCell>
                            <TableCell align="right" sx={{ width: '13%' }}>
                              Total
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {items.map(
                            (
                              { item, position, hasMobilization, workerName, shiftTimes },
                              index
                            ) => (
                              <TableRow key={`${item.id}-${index}`}>
                                <TableCell sx={{ verticalAlign: 'top' }}>
                                  {hasMobilization ? (
                                    <Stack spacing={0.5}>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontStyle: 'italic',
                                          color: 'text.secondary',
                                          wordBreak: 'break-word',
                                          whiteSpace: 'normal',
                                          mb: 0.5,
                                        }}
                                      >
                                        Mobilization
                                      </Typography>
                                      {workerName && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          sx={{ wordBreak: 'break-word', whiteSpace: 'normal' }}
                                        >
                                          {workerName}
                                        </Typography>
                                      )}
                                      {position && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          sx={{ wordBreak: 'break-word', whiteSpace: 'normal' }}
                                        >
                                          {position}
                                        </Typography>
                                      )}
                                    </Stack>
                                  ) : (
                                    <Stack spacing={0.5}>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontWeight: 600,
                                          wordBreak: 'break-word',
                                          whiteSpace: 'normal',
                                        }}
                                      >
                                        {position || 'N/A'}
                                      </Typography>
                                      {workerName && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          sx={{ wordBreak: 'break-word', whiteSpace: 'normal' }}
                                        >
                                          {workerName}
                                        </Typography>
                                      )}
                                      {shiftTimes && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          sx={{ wordBreak: 'break-word', whiteSpace: 'normal' }}
                                        >
                                          {shiftTimes}
                                        </Typography>
                                      )}
                                    </Stack>
                                  )}
                                </TableCell>
                                <TableCell sx={{ maxWidth: 300, verticalAlign: 'top' }}>
                                  <Typography
                                    variant="body2"
                                    sx={{ wordBreak: 'break-word', whiteSpace: 'normal' }}
                                  >
                                    {item.service || item.title}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ maxWidth: 250, verticalAlign: 'top' }}>
                                  <Typography
                                    variant="body2"
                                    sx={{ wordBreak: 'break-word', whiteSpace: 'normal' }}
                                  >
                                    {/* Strip metadata from description for display */}
                                    {item.description?.replace(/\s*\[.*?\]\s*/, '') ||
                                      item.description}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ verticalAlign: 'top' }}>
                                  {fCurrency(item.price)}
                                </TableCell>
                                <TableCell align="center" sx={{ verticalAlign: 'top' }}>
                                  {item.quantity}
                                </TableCell>
                                <TableCell align="right" sx={{ verticalAlign: 'top' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {fCurrency(item.total)}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </Stack>
                  </Card>
                );
              })}

            {itemsByJob.size === 0 && (
              <Alert severity="info">
                No invoice items to display. Please ensure jobs and rates are properly configured.
              </Alert>
            )}
          </Stack>
        );
      }

      case 5: {
        return (
          <Box>
            {invoiceDataForStep5 ? (
              <InvoiceCreateEditForm
                ref={formRef}
                currentInvoice={invoiceDataForStep5 as any}
                hideActions
                allowCustomerEdit={false}
              />
            ) : (
              <Alert severity="error">Please select a customer first</Alert>
            )}
          </Box>
        );
      }

      default:
        return null;
    }
  };

  const canProceedStep0 = foundJobs.length > 0;
  const canProceedStep1 = selectedCustomerId !== '' && selectedJobIds.size > 0;
  const canProceedStep2 = true; // Verify Timesheets - always can proceed
  const canProceedStep3 = missingRates.length === 0; // Validate Rates - need all rates assigned
  const canProceedStep4 = true; // Confirm Invoice Items - always can proceed (just review)

  // Prevent form submission on the entire page
  useEffect(() => {
    const handleFormSubmit = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };

    document.addEventListener('submit', handleFormSubmit, true);

    return () => {
      document.removeEventListener('submit', handleFormSubmit, true);
    };
  }, []);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Generate Invoice"
        links={[
          { name: 'Management', href: paths.management.root },
          { name: 'Invoice', href: paths.management.invoice.list },
          { name: 'Generate' },
        ]}
        action={
          <Button
            variant="contained"
            onClick={() => router.push(paths.management.invoice.list)}
            startIcon={<Iconify icon="eva:arrowhead-left-fill" />}
          >
            Back
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ p: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 300, mb: 4 }}>{renderStepContent(activeStep)}</Box>

        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Button
            type="button"
            variant="outlined"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleBack(e);
            }}
            disabled={
              activeStep === 0 ||
              searchJobsMutation.isPending ||
              getJobDetailsMutation.isPending ||
              isGeneratingItems
            }
            sx={{ visibility: activeStep === 0 ? 'hidden' : 'visible' }}
          >
            Back
          </Button>

          <Box sx={{ flex: 1 }} />

          {activeStep === STEPS.length - 1 ? (
            <Button
              type="button"
              variant="contained"
              onClick={handleGenerateInvoice}
              disabled={searchJobsMutation.isPending || getJobDetailsMutation.isPending}
            >
              Generate Invoice
            </Button>
          ) : (
            <Button
              type="button"
              variant="contained"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent?.stopImmediatePropagation?.();
                handleNext(e);
                return false;
              }}
              onMouseDown={(e) => {
                // Prevent any default behavior on mouse down
                e.preventDefault();
              }}
              disabled={
                searchJobsMutation.isPending ||
                getJobDetailsMutation.isPending ||
                isGeneratingItems ||
                (activeStep === 0 && !canProceedStep0) ||
                (activeStep === 1 && !canProceedStep1) ||
                (activeStep === 2 && !canProceedStep2) ||
                (activeStep === 3 && !canProceedStep3) ||
                (activeStep === 4 && !canProceedStep4)
              }
              startIcon={
                (searchJobsMutation.isPending ||
                  getJobDetailsMutation.isPending ||
                  isGeneratingItems) && <CircularProgress size={20} color="inherit" />
              }
            >
              {searchJobsMutation.isPending || getJobDetailsMutation.isPending || isGeneratingItems
                ? 'Loading...'
                : 'Next'}
            </Button>
          )}
        </Stack>
      </Card>

      {/* Incomplete Jobs Confirmation Dialog */}
      <Dialog
        open={showIncompleteJobsDialog}
        onClose={() => setShowIncompleteJobsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Incomplete Jobs Detected</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Some of the selected jobs are not completed. Do you still want to continue with invoice
            generation?
          </Typography>
          <Stack spacing={1}>
            {foundJobs
              .filter((job) => selectedJobIds.has(job.id) && job.status !== 'completed')
              .map((job) => (
                <Box key={job.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    #{job.job_number}
                  </Typography>
                  <Label
                    variant="soft"
                    color={
                      (job.status === 'draft' && 'info') ||
                      (job.status === 'pending' && 'warning') ||
                      (job.status === 'ready' && 'primary') ||
                      (job.status === 'in_progress' && 'secondary') ||
                      (job.status === 'cancelled' && 'error') ||
                      'default'
                    }
                  >
                    {job.status === 'draft' && 'Draft'}
                    {job.status === 'pending' && 'Pending'}
                    {job.status === 'ready' && 'Ready'}
                    {job.status === 'in_progress' && 'In Progress'}
                    {job.status === 'cancelled' && 'Cancelled'}
                    {![
                      'draft',
                      'pending',
                      'ready',
                      'in_progress',
                      'completed',
                      'cancelled',
                    ].includes(job.status) && job.status}
                  </Label>
                </Box>
              ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowIncompleteJobsDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowIncompleteJobsDialog(false);
              getJobDetailsMutation.mutate();
            }}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invoice Creation Progress Dialog */}
      <InvoiceCreationProgressDialog
        open={progressDialog.value}
        steps={progressSteps}
        currentStep={currentStep}
        title="Generating Invoice"
        subtitle="Please wait while we process your request. Do not close this window or navigate away."
      />
    </DashboardContent>
  );
}
