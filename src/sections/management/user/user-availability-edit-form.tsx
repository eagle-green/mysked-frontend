 import type { Dayjs } from 'dayjs';
import type { IUser } from 'src/types/user';
import type FullCalendar from '@fullcalendar/react';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import Calendar from '@fullcalendar/react';
import listPlugin from '@fullcalendar/list';
import timezone from 'dayjs/plugin/timezone';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useRef, useState, useEffect } from 'react';
import timeGridPlugin from '@fullcalendar/timegrid';
import timelinePlugin from '@fullcalendar/timeline';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import interactionPlugin from '@fullcalendar/interaction';
import { useQuery, useQueryClient } from '@tanstack/react-query';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// Helper function to convert UTC to the app's primary timezone (America/Vancouver)
const APP_TIMEZONE = 'America/Vancouver';

const convertToLocalTimezone = (utcDateString: string): string => {
  if (!utcDateString) return utcDateString;

  try {
    // Parse UTC date and convert to the app timezone
    // FullCalendar with timeZone="America/Vancouver" will interpret the date correctly
    // We format as ISO string with timezone offset to ensure the date component is correct
    const converted = dayjs.utc(utcDateString).tz(APP_TIMEZONE);
    
    // Format with timezone offset - this ensures FullCalendar sees the correct date
    // Example: "2025-11-07T16:30:00-08:00" (PST) instead of "2025-11-08T00:30:00Z" (UTC)
    return converted.format();
  } catch (error) {
    console.warn('Failed to convert timezone for date:', utcDateString, error);
    return utcDateString; // Fallback to original
  }
};

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import FormGroup from '@mui/material/FormGroup';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import FormControlLabel from '@mui/material/FormControlLabel';

import { getRoleLabel } from 'src/utils/format-role';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';

import { CalendarRoot } from 'src/sections/schedule/calendar/styles';
import { useCalendar } from 'src/sections/schedule/calendar/hooks/use-calendar';
import { CalendarToolbar } from 'src/sections/schedule/calendar/calendar-toolbar';
import { JobDetailsDialog } from 'src/sections/schedule/calendar/job-details-dialog';

import { TIME_OFF_TYPES, TIME_OFF_STATUSES } from 'src/types/timeOff';

// ----------------------------------------------------------------------

type Props = {
  currentUser?: IUser;
};

export function UserAvailabilityEditForm({ currentUser }: Props) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const calendarRef = useRef<FullCalendar | null>(null);

  // State for dialogs
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [jobDetailsOpen, setJobDetailsOpen] = useState(false);
  const [timeOffDetailsOpen, setTimeOffDetailsOpen] = useState(false);
  const [selectedTimeOff, setSelectedTimeOff] = useState<any>(null);
  const [overlapErrorOpen, setOverlapErrorOpen] = useState(false);
  const [overlapErrorMessage, setOverlapErrorMessage] = useState(
    'There is already a scheduled job or time-off request in this time period. Please choose a different time slot.'
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<any>(null);
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [recurringLoading, setRecurringLoading] = useState(false);
  const [removeRecurringDialogOpen, setRemoveRecurringDialogOpen] = useState(false);
  const [removeRecurringLoading, setRemoveRecurringLoading] = useState(false);
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<any>(null);
  const [unavailabilityReason, setUnavailabilityReason] = useState('Unavailable');

  // State for recurring unavailability form
  const [recurringDays, setRecurringDays] = useState({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
  });
  const [recurringStartDate, setRecurringStartDate] = useState<Dayjs | null>(null);
  const [recurringEndDate, setRecurringEndDate] = useState<Dayjs | null>(null);
  const [recurringReason, setRecurringReason] = useState('Recurring unavailability');

  // State for remove recurring unavailability form
  const [removeRecurringDays, setRemoveRecurringDays] = useState({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
  });
  const [removeRecurringStartDate, setRemoveRecurringStartDate] = useState<Dayjs | null>(null);
  const [removeRecurringEndDate, setRemoveRecurringEndDate] = useState<Dayjs | null>(null);
  const [removeRecurringReason, setRemoveRecurringReason] = useState('');

  // Fetch user's scheduled jobs and time-off requests
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['user-availability-schedule-v2', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;

      // Fetch both jobs and time-off requests
      try {
        const [jobsResponse, timeOffResponse] = await Promise.all([
          // Use workerId query param so admins can see this employee's jobs, not just their own
          fetcher(`${endpoints.work.job}?is_open_job=false&workerId=${currentUser.id}`),
          fetcher(`/api/time-off/admin/all`).catch(() => ({ data: { timeOffRequests: [] } })), // Use admin endpoint
        ]);

        // Filter time-off requests for this specific user
        const allTimeOff = timeOffResponse.data?.timeOffRequests || [];
        const userTimeOff = allTimeOff.filter((timeOff: any) => timeOff.user_id === currentUser.id);

        return {
          jobs: jobsResponse.data.jobs || [],
          timeOff: userTimeOff,
        };
      } catch (error) {
        console.error('Error fetching user schedule:', error);
        return {
          jobs: [],
          timeOff: [],
        };
      }
    },
    enabled: !!currentUser?.id,
    staleTime: 0, // Don't use cached data
    gcTime: 0, // Don't keep data in memory
    refetchOnMount: 'always', // Always fetch fresh data on mount
    retry: false, // Don't retry failed requests
  });

  // Process jobs - filter for this specific user and convert to calendar events
  const jobEvents = (jobsData?.jobs || []).flatMap((job: any) => {
    const region = typeof job.site?.region === 'string' ? job.site.region : '';

    // Find this user's assignments in the job (pending or accepted)
    const userAssignments =
      job.workers?.filter(
        (worker: any) =>
          worker.id === currentUser?.id && ['pending', 'accepted'].includes(worker.status)
      ) || [];

    return userAssignments.map((worker: any) => {
      let color = '';

      // Use company color if available, otherwise fall back to status-based colors
      if (job.company?.color) {
        color = job.company.color;
      } else if (worker.status === 'pending') {
        color = '#fb8c00'; // warning/orange
      } else {
        color = '#3788d8'; // info/blue
      }

      // Format: #123 8a customer_name - client_name (position)
      const startTime = worker.start_time
        ? new Date(worker.start_time)
            .toLocaleTimeString('en-US', {
              hour: 'numeric',
              hour12: true,
            })
            .toLowerCase()
            .replace(' ', '')
        : '';

      const customerName = job.company?.name || '';
      const clientName = job.client?.name || '';
      const position = getRoleLabel(worker.position) || '';
      const eventTitle =
        `#${job.job_number} ${startTime} ${customerName}${clientName ? ` - ${clientName}` : ''} (${position})`.trim();

      // Convert times to Vancouver timezone
      const startTimeConverted = convertToLocalTimezone(worker.start_time);
      const endTimeConverted = convertToLocalTimezone(worker.end_time);
      
      // Jobs are never all-day events - they always have specific start/end times
      // Setting allDay to false ensures FullCalendar displays them correctly as timed events
      // This prevents the 2-day display issue where jobs appear to span multiple days
      const isAllDay = false;

      return {
        id: `${job.id}-${worker.id}`,
        color,
        textColor: color,
        title: eventTitle,
        allDay: isAllDay, // Only true if explicitly all-day and times are at midnight
        description: job.description ?? '',
        start: startTimeConverted, // Convert UTC to Vancouver timezone
        end: endTimeConverted, // Convert UTC to Vancouver timezone
        extendedProps: {
          type: 'job',
          jobId: job.id,
          workerId: worker.id,
          status: worker.status,
          region,
        },
        editable: false,
      };
    });
  });

  // Process time-off requests
  const timeOffEvents = (jobsData?.timeOff || [])
    .filter((timeOff: any) => timeOff.status === 'pending' || timeOff.status === 'approved')
    .map((timeOff: any) => {
      // Get color based on type and status
      let color = '#9E9E9E';
      const typeConfig = TIME_OFF_TYPES.find((t) => t.value === timeOff.type);
      if (typeConfig) {
        color = typeConfig.color;
      }

      // For all-day events in FullCalendar, backend now sends dates as YYYY-MM-DD strings
      // We need to append 'T00:00:00' to ensure they're parsed as midnight local time
      const startDate = timeOff.start_date + 'T00:00:00';

      // Add one day for FullCalendar's exclusive end date
      const endDateObj = new Date(timeOff.end_date + 'T00:00:00');
      endDateObj.setDate(endDateObj.getDate() + 1);
      const adjustedEndDate = endDateObj.toISOString().split('T')[0] + 'T00:00:00';

      return {
        id: `timeoff-${timeOff.id}`,
        color,
        textColor: color,
        title: `${typeConfig?.label || timeOff.type} - ${timeOff.status.charAt(0).toUpperCase() + timeOff.status.slice(1)}`,
        allDay: true,
        description: timeOff.reason,
        start: startDate,
        end: adjustedEndDate,
        className: 'timeoff-event',
        extendedProps: {
          type: 'timeoff',
          timeOffId: timeOff.id,
          timeOffType: timeOff.type,
          timeOffStatus: timeOff.status,
          timeOffReason: timeOff.reason,
          originalStartDate: timeOff.start_date,
          originalEndDate: timeOff.end_date,
        },
        editable: false,
      };
    });

  // Combine job and time-off events
  const scheduledEvents = [...jobEvents, ...timeOffEvents];

  // Fetch user's unavailability periods
  const { data: unavailabilityData, refetch: refetchUnavailability } = useQuery({
    queryKey: ['user-unavailability', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;

      try {
        const response = await fetcher(endpoints.unavailability.user(currentUser.id));
        return response.data?.unavailability || [];
      } catch (error) {
        console.error('Error fetching unavailability:', error);
        return [];
      }
    },
    enabled: !!currentUser?.id,
  });

  // Convert unavailability data to calendar events
  const unavailabilityEvents = (unavailabilityData || []).map((unavail: any) => {
    // For all-day events, normalize the dates to prevent timezone issues
    let eventStart = unavail.start_time;
    let eventEnd = unavail.end_time;
    let startDateStr = null;

    if (unavail.all_day) {
      // For all-day events, use only the date portion in Vancouver timezone
      const startDate = dayjs.tz(unavail.start_time, 'America/Vancouver').format('YYYY-MM-DD');
      // End should be the next day (exclusive) for FullCalendar
      const endDate = dayjs
        .tz(unavail.start_time, 'America/Vancouver')
        .add(1, 'day')
        .format('YYYY-MM-DD');
      eventStart = startDate;
      eventEnd = endDate;
      startDateStr = startDate; // Store the date string for display
    }

    return {
      id: unavail.id,
      title: 'Unavailable',
      start: eventStart,
      end: eventEnd,
      allDay: unavail.all_day,
      color: '#ef4444',
      textColor: '#ef4444',
      className: 'unavailable-event',
      editable: false, // Disable dragging for unavailability events
      extendedProps: {
        type: 'availability',
        reason: unavail.reason,
        notes: unavail.notes,
        created_by_first_name: unavail.created_by_first_name,
        created_by_last_name: unavail.created_by_last_name,
        created_by_photo_url: unavail.created_by_photo_url,
        created_at: unavail.created_at,
        startDateStr, // Store the original date string for display
      },
    };
  });

  // Local state for newly added (not yet saved) availability events
  const [availabilityEvents, setAvailabilityEvents] = useState<any[]>([]);

  // Combine all events: scheduled jobs, time-off, saved unavailability, and new unavailability
  const allEvents = [...scheduledEvents, ...unavailabilityEvents, ...availabilityEvents];

  const {
    view,
    date,
    title,
    onDateNext,
    onDatePrev,
    onDateToday,
    onChangeView,
    onSelectRange,
    onInitialView,
  } = useCalendar(calendarRef, { events: allEvents });

  // Initialize calendar view on mount
  useEffect(() => {
    onInitialView();
  }, [onInitialView]);

  // Handle view changes
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(view);
    }
  }, [view]);

  const handleSelectRange = async (arg: any) => {
    // Handle date range selection
    onSelectRange(arg);

    // Normalize dates to Vancouver timezone for accurate comparison
    // If it's an all-day event, use the date at midnight Vancouver time
    let selectedStart: Date;
    let selectedEnd: Date;

    if (arg.allDay) {
      // For all-day events, normalize to midnight Vancouver time
      selectedStart = dayjs.tz(arg.startStr, 'America/Vancouver').startOf('day').toDate();
      selectedEnd = dayjs.tz(arg.endStr, 'America/Vancouver').startOf('day').toDate();
    } else {
      selectedStart = new Date(arg.start);
      selectedEnd = new Date(arg.end);
    }

    const hasOverlap = scheduledEvents.some((event: any) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      // Check for overlap: events overlap if one starts before the other ends
      return selectedStart < eventEnd && selectedEnd > eventStart;
    });

    if (hasOverlap) {
      setOverlapErrorOpen(true);
      return;
    }

    // Check if there's already an unavailability period in this time range
    // Use the current unavailabilityData directly to avoid stale state
    const currentUnavailability = unavailabilityData || [];
    const hasUnavailabilityOverlap = currentUnavailability.some((unavail: any) => {
      // For all-day events, compare only the date portion (not time)
      if (arg.allDay && unavail.all_day) {
        // For all-day events, we only care about the start date
        // The end_time in the DB is 23:59:59 which can cause timezone confusion
        const eventDate = dayjs.tz(unavail.start_time, 'America/Vancouver').format('YYYY-MM-DD');
        const selectedDate = dayjs.tz(selectedStart, 'America/Vancouver').format('YYYY-MM-DD');

        // For single-day all-day events, just check if the dates match
        return eventDate === selectedDate;
      } else {
        // For time-specific events, use the original logic
        const eventStart = dayjs.tz(unavail.start_time, 'America/Vancouver').toDate();
        const eventEnd = dayjs.tz(unavail.end_time, 'America/Vancouver').toDate();

        // Check for overlap: events overlap if one starts before the other ends
        return selectedStart < eventEnd && selectedEnd > eventStart;
      }
    });

    if (hasUnavailabilityOverlap) {
      return;
    }

    if (!currentUser?.id) {
      console.error('No user ID available');
      return;
    }

    // Open dialog to get reason before saving
    setSelectedDateRange(arg);
    setUnavailabilityReason('Unavailable');
    setReasonDialogOpen(true);
  };

  const handleReasonDialogClose = () => {
    setReasonDialogOpen(false);
    setSelectedDateRange(null);
    setUnavailabilityReason('Unavailable');
  };

  const handleReasonDialogSubmit = async () => {
    if (!selectedDateRange || !currentUser?.id) return;

    try {
      // For all-day events, use the date string to ensure correct timezone handling
      let startTime: string;
      let endTime: string;

      if (selectedDateRange.allDay) {
        // Use startStr/endStr which are date strings like "2025-11-20"
        // Convert to Vancouver timezone at midnight
        startTime = dayjs
          .tz(selectedDateRange.startStr, 'America/Vancouver')
          .startOf('day')
          .toISOString();
        endTime = dayjs
          .tz(selectedDateRange.endStr, 'America/Vancouver')
          .startOf('day')
          .toISOString();
      } else {
        startTime = selectedDateRange.start.toISOString();
        endTime = selectedDateRange.end.toISOString();
      }

      await fetcher([
        endpoints.unavailability.create,
        {
          method: 'POST',
          data: {
            user_id: currentUser.id,
            start_time: startTime,
            end_time: endTime,
            all_day: selectedDateRange.allDay,
            reason: unavailabilityReason,
          },
        },
      ]);

      // Refetch unavailability data
      await refetchUnavailability();

      // Show success message
      toast.success('Unavailability period added successfully');

      handleReasonDialogClose();
    } catch (error: any) {
      console.error('Error creating unavailability:', error);
      const backendMessage =
        error?.response?.data?.error || error?.message || 'Please try again.';

      // If this is a schedule conflict error, show the overlap dialog instead of a toast
      if (
        typeof backendMessage === 'string' &&
        backendMessage.toLowerCase().includes('cannot mark as unavailable')
      ) {
        setOverlapErrorMessage(backendMessage);
        setOverlapErrorOpen(true);
      } else {
        toast.error(`Failed to mark as unavailable: ${backendMessage}`);
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (eventToDelete) {
      try {
        // Delete from backend if it's a saved unavailability (has a UUID)
        if (eventToDelete.id && !eventToDelete.id.startsWith('avail-')) {
      await fetcher([
            endpoints.unavailability.delete(eventToDelete.id),
            {
              method: 'DELETE',
            },
          ]);

          // Optimistically update the cache by removing the deleted item
          queryClient.setQueryData(['user-unavailability', currentUser?.id], (oldData: any) => {
            if (!oldData) return oldData;
            const newData = oldData.filter((item: any) => item.id !== eventToDelete.id);
            return newData;
          });

          // Also refetch in the background to ensure consistency
          queryClient.invalidateQueries({
            queryKey: ['user-unavailability', currentUser?.id],
          });
        } else {
          // Remove from local state if it's a temporary event
          setAvailabilityEvents(
            availabilityEvents.filter((event) => event.id !== eventToDelete?.id)
          );
        }

        setDeleteConfirmOpen(false);
        setEventToDelete(null);

        // Show success message
        toast.success('Unavailability period removed successfully');
      } catch (error: any) {
        console.error('Error deleting unavailability:', error);
        console.error('Error details:', error.response?.data);
        toast.error('Failed to delete unavailability period. Please try again.');
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setEventToDelete(null);
  };

  const handleEventClick = (arg: any) => {
    const eventType = arg.event.extendedProps?.type;

    // Only allow deleting availability events, not scheduled jobs or time-off
    if (eventType === 'availability') {
      // Store the event with its reason for display in delete dialog
      // Extract plain data from FullCalendar Event object
      const eventWithDetails = {
        id: arg.event.id,
        title: arg.event.title,
        start: arg.event.start,
        end: arg.event.end,
        allDay: arg.event.allDay,
        reason: arg.event.extendedProps?.reason || 'No reason provided',
        notes: arg.event.extendedProps?.notes,
        created_by_first_name: arg.event.extendedProps?.created_by_first_name,
        created_by_last_name: arg.event.extendedProps?.created_by_last_name,
        created_by_photo_url: arg.event.extendedProps?.created_by_photo_url,
        created_at: arg.event.extendedProps?.created_at,
        startDateStr: arg.event.extendedProps?.startDateStr, // Get the stored date string
      };

      setEventToDelete(eventWithDetails);
      setDeleteConfirmOpen(true);
    } else if (eventType === 'job') {
      // Open job details dialog
      const jobId = arg.event.extendedProps?.jobId;
      if (jobId) {
        setSelectedJobId(jobId);
        setJobDetailsOpen(true);
      }
    } else if (eventType === 'timeoff') {
      // Open time-off details dialog
      const timeOffData = {
        id: arg.event.extendedProps?.timeOffId,
        type: arg.event.extendedProps?.timeOffType,
        status: arg.event.extendedProps?.timeOffStatus,
        reason: arg.event.extendedProps?.timeOffReason,
        start_date: arg.event.extendedProps?.originalStartDate || arg.event.start,
        end_date: arg.event.extendedProps?.originalEndDate || arg.event.end,
      };
      setSelectedTimeOff(timeOffData);
      setTimeOffDetailsOpen(true);
    }
  };

  const handleOpenRecurringDialog = () => {
    setRecurringDialogOpen(true);
  };

  const handleCloseRecurringDialog = () => {
    setRecurringDialogOpen(false);
    // Reset form
    setRecurringDays({
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    });
    setRecurringStartDate(null);
    setRecurringEndDate(null);
    setRecurringReason('Recurring unavailability');
  };

  const handleRecurringDayChange = (day: string) => {
    setRecurringDays((prev) => ({
      ...prev,
      [day]: !prev[day as keyof typeof prev],
    }));
  };

  const handleRecurringSubmit = async () => {
    if (!currentUser?.id) {
      toast.error('No user selected');
      return;
    }

    if (!recurringStartDate || !recurringEndDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    if (recurringEndDate.isBefore(recurringStartDate)) {
      toast.error('End date must be after start date');
      return;
    }

    // Check if at least one day is selected
    const selectedDays = Object.entries(recurringDays)
      .filter(([_, isSelected]) => isSelected)
      .map(([day, _]) => day);

    if (selectedDays.length === 0) {
      toast.error('Please select at least one day of the week');
      return;
    }

    setRecurringLoading(true);

    try {
      // Generate all dates for the selected days within the date range
      const unavailabilityPeriods = [];
      const dayToNumber: { [key: string]: number } = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
      };

      const selectedDayNumbers = selectedDays.map((day) => dayToNumber[day]);

      // Convert Dayjs to Date objects
      const currentDate = recurringStartDate.toDate();
      const endDate = recurringEndDate.toDate();

      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();

        if (selectedDayNumbers.includes(dayOfWeek)) {
          // Create all-day unavailability for this date
          const startOfDay = new Date(currentDate);
          startOfDay.setHours(0, 0, 0, 0);

          const endOfDay = new Date(currentDate);
          endOfDay.setHours(23, 59, 59, 999);

          unavailabilityPeriods.push({
            start_time: startOfDay.toISOString(),
            end_time: endOfDay.toISOString(),
            all_day: true,
            reason: recurringReason,
          });
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (unavailabilityPeriods.length === 0) {
        toast.error('No matching dates found for the selected days');
        setRecurringLoading(false);
        return;
      }

      // Create all unavailability periods using batch endpoint
      const response = await fetcher([
        endpoints.unavailability.createBatch,
        {
          method: 'POST',
          data: {
            user_id: currentUser.id,
            periods: unavailabilityPeriods,
          },
        },
      ]);

      // Refetch unavailability data
      await refetchUnavailability();

      // Show detailed success/failure message
      const successCount = response.data?.successful || 0;
      const failedCount = response.data?.failed || 0;

      if (successCount > 0 && failedCount === 0) {
        toast.success(
          `Successfully created ${successCount} recurring unavailability period${successCount > 1 ? 's' : ''}`
        );
      } else if (successCount > 0 && failedCount > 0) {
        toast.warning(
          `Created ${successCount} period${successCount > 1 ? 's' : ''}, but ${failedCount} failed (may overlap with existing schedules)`
        );
      } else {
        toast.error('No periods were created. They may overlap with existing schedules.');
      }

      handleCloseRecurringDialog();
    } catch (error: any) {
      console.error('Error creating recurring unavailability:', error);
      toast.error(
        `Failed to create recurring unavailability: ${error.response?.data?.error || error.message || 'Please try again.'}`
      );
    } finally {
      setRecurringLoading(false);
    }
  };

  const handleRemoveRecurringDayChange = (day: string) => {
    setRemoveRecurringDays((prev) => ({
      ...prev,
      [day]: !prev[day as keyof typeof prev],
    }));
  };

  const handleRemoveRecurringSubmit = async () => {
    if (!currentUser?.id) {
      toast.error('No user selected');
      return;
    }

    if (!removeRecurringStartDate || !removeRecurringEndDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    if (removeRecurringEndDate.isBefore(removeRecurringStartDate)) {
      toast.error('End date must be after start date');
      return;
    }

    // Check if at least one day is selected
    const selectedDays = Object.entries(removeRecurringDays)
      .filter(([_, isSelected]) => isSelected)
      .map(([day, _]) => day);

    if (selectedDays.length === 0) {
      toast.error('Please select at least one day of the week');
      return;
    }

    setRemoveRecurringLoading(true);

    try {
      const response = await fetcher([
        endpoints.unavailability.deleteBatch,
        {
          method: 'POST',
          data: {
            user_id: currentUser.id,
            days: selectedDays,
            start_date: removeRecurringStartDate.format('YYYY-MM-DD'),
            end_date: removeRecurringEndDate.format('YYYY-MM-DD'),
            reason: removeRecurringReason.trim() || undefined, // Only include if provided
          },
        },
      ]);

      const deletedCount = response.data?.deleted || 0;
      const failedCount = response.data?.failed || 0;

      if (deletedCount > 0) {
        // Refetch the calendar data to show updated availability
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ['user-availability-schedule-v2', currentUser.id],
          }),
          queryClient.invalidateQueries({
            queryKey: ['user-unavailability', currentUser.id],
          }),
        ]);

        if (failedCount === 0) {
          toast.success(
            `Successfully removed ${deletedCount} unavailability period${deletedCount > 1 ? 's' : ''}!`
          );
        } else {
          toast.warning(
            `Removed ${deletedCount} period${deletedCount > 1 ? 's' : ''}, but ${failedCount} failed`
          );
        }
      } else {
        toast.info('No matching unavailability periods found to remove.');
      }

      handleCloseRemoveRecurringDialog();
    } catch (error: any) {
      console.error('Error removing recurring unavailability:', error);
      toast.error(
        `Failed to remove recurring unavailability: ${error.response?.data?.error || error.message || 'Please try again.'}`
      );
    } finally {
      setRemoveRecurringLoading(false);
    }
  };

  const handleOpenRemoveRecurringDialog = () => {
    setRemoveRecurringDialogOpen(true);
  };

  const handleCloseRemoveRecurringDialog = () => {
    setRemoveRecurringDialogOpen(false);
    // Reset form
    setRemoveRecurringDays({
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    });
    setRemoveRecurringStartDate(null);
    setRemoveRecurringEndDate(null);
    setRemoveRecurringReason('');
  };

  return (
    <Card>
      <Box sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Typography variant="h4">Employee Availability</Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleOpenRemoveRecurringDialog}
                  size="medium"
                >
                  Remove Recurring
                </Button>
                <Button variant="contained" onClick={handleOpenRecurringDialog} size="medium">
                  Set Recurring
                </Button>
              </Stack>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              View employee&apos;s scheduled jobs and manage their availability. Click on the
              calendar to mark unavailable periods. Click on unavailable periods to remove them.
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" component="div">
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                <li>
                  <strong>Job events</strong> show scheduled work assignments.
                </li>
                <li>
                  <strong>Time-off events</strong> show approved/pending time-off requests.
                </li>
                <li>
                  <strong>Red events</strong> are unavailable periods that can be added or removed.
                </li>
              </Box>
            </Typography>
          </Alert>

          <Card
            sx={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CalendarRoot
              sx={{
                flex: '1 1 auto',
                '.fc.fc-media-screen': {
                  flex: '1 1 auto',
                  height: 'auto !important',
                },
                '.fc-view-harness': {
                  height: 'auto !important',
                },
                '.fc-daygrid-body': {
                  height: 'auto !important',
                },
                '.fc': {
                  height: 'auto !important',
                },
                // Remove background from header row
                '.fc-col-header': {
                  backgroundColor: 'transparent !important',
                },
                '.fc-col-header-cell': {
                  backgroundColor: 'transparent !important',
                },
                '.fc-scrollgrid-section-header': {
                  backgroundColor: 'transparent !important',
                },
                '.fc-scrollgrid-section-header > *': {
                  backgroundColor: 'transparent !important',
                },
                thead: {
                  backgroundColor: 'transparent !important',
                },
                'thead tr': {
                  backgroundColor: 'transparent !important',
                },
                'thead th': {
                  backgroundColor: 'transparent !important',
                },
                // Make all events clickable with pointer cursor
                '& .fc-event': {
                  cursor: 'pointer !important',
                },
                // Override event styles to make time-off and unavailable events bold
                '& .timeoff-event': {
                  '& .fc-event-title': {
                    fontWeight: `${theme.typography.fontWeightBold} !important`,
                  },
                  '& .fc-event-main-frame': {
                    fontWeight: `${theme.typography.fontWeightBold} !important`,
                  },
                },
                '& .unavailable-event': {
                  '& .fc-event-title': {
                    fontWeight: `${theme.typography.fontWeightBold} !important`,
                  },
                  '& .fc-event-main-frame': {
                    fontWeight: `${theme.typography.fontWeightBold} !important`,
                  },
                },
              }}
            >
              <CalendarToolbar
                title={title}
                view={view}
                canReset={false}
                loading={jobsLoading}
                onNextDate={onDateNext}
                onPrevDate={onDatePrev}
                onToday={onDateToday}
                onChangeView={onChangeView}
                onOpenFilters={() => {}}
              />

              <Calendar
                weekends
                selectable
                editable
                firstDay={1}
                rerenderDelay={10}
                allDayMaintainDuration
                eventResizableFromStart
                ref={calendarRef}
                initialDate={date}
                initialView={view}
                dayMaxEventRows={10}
                events={allEvents}
                headerToolbar={false}
                eventDisplay="block"
                select={handleSelectRange}
                eventClick={handleEventClick}
                height="auto"
                contentHeight="auto"
                timeZone="America/Vancouver"
                plugins={[
                  listPlugin,
                  dayGridPlugin,
                  timelinePlugin,
                  timeGridPlugin,
                  interactionPlugin,
                ]}
              />
            </CalendarRoot>
          </Card>
        </Stack>
      </Box>

      {/* Job Details Dialog */}
      <JobDetailsDialog
        open={jobDetailsOpen}
        onClose={() => setJobDetailsOpen(false)}
        jobId={selectedJobId}
      />

      {/* Time-Off Details Dialog */}
      <Dialog
        fullWidth
        maxWidth="sm"
        open={timeOffDetailsOpen}
        onClose={() => setTimeOffDetailsOpen(false)}
        transitionDuration={{
          enter: theme.transitions.duration.shortest,
          exit: theme.transitions.duration.shortest - 80,
        }}
      >
        <DialogTitle>Time Off Request Details</DialogTitle>

        <DialogContent>
          {selectedTimeOff && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    backgroundColor:
                      TIME_OFF_TYPES.find((t) => t.value === selectedTimeOff.type)?.color ||
                      '#9E9E9E',
                  }}
                />
                <Typography variant="h6">
                  {TIME_OFF_TYPES.find((t) => t.value === selectedTimeOff.type)?.label ||
                    selectedTimeOff.type}
                </Typography>
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    backgroundColor:
                      TIME_OFF_STATUSES.find((s) => s.value === selectedTimeOff.status)?.color ||
                      '#9E9E9E',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  {TIME_OFF_STATUSES.find((s) => s.value === selectedTimeOff.status)?.label ||
                    selectedTimeOff.status}
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Date Range
                </Typography>
                <Typography variant="body1">
                  {selectedTimeOff.start_date
                    ? dayjs(selectedTimeOff.start_date).format('MMM DD, YYYY')
                    : 'Invalid Date'}{' '}
                  -{' '}
                  {selectedTimeOff.end_date
                    ? dayjs(selectedTimeOff.end_date).format('MMM DD, YYYY')
                    : 'Invalid Date'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Reason
                </Typography>
                <Typography variant="body1">
                  {selectedTimeOff.reason || 'No reason provided'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setTimeOffDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Overlap Error Dialog */}
      <Dialog
        open={overlapErrorOpen}
        onClose={() => setOverlapErrorOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cannot Mark as Unavailable</DialogTitle>
        <DialogContent>
          <Typography>{overlapErrorMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOverlapErrorOpen(false)} variant="contained">
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Remove Unavailable Period</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography>Do you want to remove this unavailable period?</Typography>
            {eventToDelete && (
              <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {eventToDelete.allDay ? 'Date' : 'Date Range'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1.5 }}>
                  {eventToDelete.start && eventToDelete.end
                    ? eventToDelete.allDay
                      ? // For all-day events, use the stored date string if available
                        eventToDelete.startDateStr
                        ? dayjs(eventToDelete.startDateStr).format('MMM DD, YYYY')
                        : dayjs.tz(eventToDelete.start, 'America/Vancouver').format('MMM DD, YYYY')
                      : // For time-specific events, show range
                        `${dayjs(eventToDelete.start).format('MMM DD, YYYY h:mm A')} - ${dayjs(eventToDelete.end).format('MMM DD, YYYY h:mm A')}`
                    : 'N/A'}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Reason
                </Typography>
                <Typography variant="body2" sx={{ mb: 1.5 }}>
                  {eventToDelete.reason || 'No reason provided'}
                </Typography>
                {eventToDelete.created_by_first_name && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Added by
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        component="img"
                        src={eventToDelete.created_by_photo_url || '/assets/placeholder.svg'}
                        alt={`${eventToDelete.created_by_first_name} ${eventToDelete.created_by_last_name}`}
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Box component="span" sx={{ fontWeight: 600 }}>
                          {eventToDelete.created_by_first_name} {eventToDelete.created_by_last_name}
                        </Box>
                        {eventToDelete.created_at && (
                          <Box component="span" sx={{ color: 'text.secondary' }}>
                            {dayjs
                              .utc(eventToDelete.created_at)
                              .tz('America/Vancouver')
                              .format('MMM DD, YYYY h:mm A')}
                          </Box>
                        )}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Recurring Unavailability Dialog */}
      <Dialog
        open={recurringDialogOpen}
        onClose={handleCloseRecurringDialog}
        maxWidth="sm"
        fullWidth
        transitionDuration={{
          enter: theme.transitions.duration.shortest,
          exit: theme.transitions.duration.shortest - 80,
        }}
      >
        <DialogTitle>Set Recurring Unavailability</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Select Days of Week
              </Typography>
              <FormGroup>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {[
                    { key: 'monday', label: 'Mon' },
                    { key: 'tuesday', label: 'Tue' },
                    { key: 'wednesday', label: 'Wed' },
                    { key: 'thursday', label: 'Thu' },
                    { key: 'friday', label: 'Fri' },
                    { key: 'saturday', label: 'Sat' },
                    { key: 'sunday', label: 'Sun' },
                  ].map((day) => (
                    <FormControlLabel
                      key={day.key}
                      control={
                        <Checkbox
                          checked={recurringDays[day.key as keyof typeof recurringDays]}
                          onChange={() => handleRecurringDayChange(day.key)}
                        />
                      }
                      label={day.label}
                    />
                  ))}
                </Stack>
              </FormGroup>
            </Box>

            <DatePicker
              label="Start Date"
              value={recurringStartDate}
              onChange={(newValue) => setRecurringStartDate(newValue)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                },
              }}
            />

            <DatePicker
              label="End Date"
              value={recurringEndDate}
              onChange={(newValue) => setRecurringEndDate(newValue)}
              minDate={recurringStartDate || undefined}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                },
              }}
            />

            <TextField
              label="Reason"
              value={recurringReason}
              onChange={(e) => setRecurringReason(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="e.g., Regular day off, School schedule, etc."
            />

            <Alert severity="info">
              <Typography variant="body2">
                This will create unavailability periods for all selected days between the start and
                end dates. For example, selecting Wednesday and Thursday from Jan 1 to Dec 31 will
                mark every Wednesday and Thursday as unavailable for the entire year.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRecurringDialog} color="inherit" disabled={recurringLoading}>
            Cancel
          </Button>
          <LoadingButton
            onClick={handleRecurringSubmit}
            variant="contained"
            loading={recurringLoading}
          >
            Create Recurring Unavailability
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Add Unavailability Reason Dialog */}
      <Dialog open={reasonDialogOpen} onClose={handleReasonDialogClose} maxWidth="xs" fullWidth>
        <DialogTitle>Add Unavailability</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {selectedDateRange && (
              <Alert severity="info" sx={{ mb: 1 }}>
                <Typography variant="body2">
                  {selectedDateRange.allDay
                    ? // For all-day events, use startStr which is the correct date string
                      dayjs
                        .tz(selectedDateRange.startStr, 'America/Vancouver')
                        .format('MMM DD, YYYY')
                    : `${dayjs(selectedDateRange.start).format('MMM DD, YYYY h:mm A')} - ${dayjs(selectedDateRange.end).format('MMM DD, YYYY h:mm A')}`}
                </Typography>
              </Alert>
            )}
            <TextField
              select
              label="Reason"
              value={unavailabilityReason}
              onChange={(e) => setUnavailabilityReason(e.target.value)}
              fullWidth
            >
              <MenuItem value="Unavailable">Unavailable</MenuItem>
              <MenuItem value="Sick Leave">Sick Leave</MenuItem>
              <MenuItem value="Personal Day">Personal Day</MenuItem>
              <MenuItem value="Vacation">Vacation</MenuItem>
              <MenuItem value="Training">Training</MenuItem>
              <MenuItem value="Appointment">Appointment</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
            {unavailabilityReason === 'Other' && (
              <TextField
                label="Custom Reason"
                placeholder="Enter custom reason"
                fullWidth
                multiline
                rows={2}
                onChange={(e) => setUnavailabilityReason(e.target.value || 'Other')}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReasonDialogClose} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleReasonDialogSubmit} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Recurring Unavailability Dialog */}
      <Dialog
        open={removeRecurringDialogOpen}
        onClose={handleCloseRemoveRecurringDialog}
        maxWidth="sm"
        fullWidth
        transitionDuration={{
          enter: theme.transitions.duration.shortest,
          exit: theme.transitions.duration.shortest - 80,
        }}
      >
        <DialogTitle>Remove Recurring Unavailability</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Select Days of Week
              </Typography>
              <FormGroup>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {[
                    { key: 'monday', label: 'Mon' },
                    { key: 'tuesday', label: 'Tue' },
                    { key: 'wednesday', label: 'Wed' },
                    { key: 'thursday', label: 'Thu' },
                    { key: 'friday', label: 'Fri' },
                    { key: 'saturday', label: 'Sat' },
                    { key: 'sunday', label: 'Sun' },
                  ].map((day) => (
                    <FormControlLabel
                      key={day.key}
                      control={
                        <Checkbox
                          checked={removeRecurringDays[day.key as keyof typeof removeRecurringDays]}
                          onChange={() => handleRemoveRecurringDayChange(day.key)}
                        />
                      }
                      label={day.label}
                    />
                  ))}
                </Stack>
              </FormGroup>
            </Box>

            <DatePicker
              label="Start Date"
              value={removeRecurringStartDate}
              onChange={(newValue) => setRemoveRecurringStartDate(newValue)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                },
              }}
            />

            <DatePicker
              label="End Date"
              value={removeRecurringEndDate}
              onChange={(newValue) => setRemoveRecurringEndDate(newValue)}
              minDate={removeRecurringStartDate || undefined}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                },
              }}
            />

            <TextField
              label="Reason (Optional)"
              value={removeRecurringReason}
              onChange={(e) => setRemoveRecurringReason(e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="Filter by reason (leave empty to remove all matching days)"
              helperText="If provided, only unavailability periods with this exact reason will be removed"
            />

            <Alert severity="warning">
              <Typography variant="body2">
                This will permanently delete unavailability periods matching the selected days and
                date range.
                {removeRecurringReason.trim()
                  ? ' Only periods with the specified reason will be removed.'
                  : ' All matching all-day unavailability periods will be removed.'}
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseRemoveRecurringDialog}
            color="inherit"
            disabled={removeRecurringLoading}
          >
            Cancel
          </Button>
          <LoadingButton
            onClick={handleRemoveRecurringSubmit}
            variant="contained"
            color="error"
            loading={removeRecurringLoading}
          >
            Remove
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
