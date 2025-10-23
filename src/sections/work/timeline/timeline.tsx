import type { EventInput } from '@fullcalendar/core';
import type { ICalendarJob, ICalendarFilters } from 'src/types/calendar';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import FullCalendar from '@fullcalendar/react';
import { varAlpha } from 'minimal-shared/utils';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourcePlugin from '@fullcalendar/resource';
import { useState, useEffect, useCallback } from 'react';
import interactionPlugin from '@fullcalendar/interaction';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

// Helper function to convert UTC to user's local timezone
const convertToLocalTimezone = (utcDateString: string): string => {
  if (!utcDateString) return utcDateString;

  try {
    // Parse UTC date and convert to user's local timezone
    // Use format('YYYY-MM-DDTHH:mm:ss') to preserve the exact time without timezone info
    return dayjs.utc(utcDateString).local().format('YYYY-MM-DDTHH:mm:ss');
  } catch (error) {
    console.warn('Failed to convert timezone for date:', utcDateString, error);
    return utcDateString; // Fallback to original
  }
};

import Card from '@mui/material/Card';
import { styled } from '@mui/material/styles';

import { fIsAfter } from 'src/utils/format-time';

import { fetcher, endpoints } from 'src/lib/axios';
import { JOB_COLOR_OPTIONS } from 'src/assets/data/job';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetAllTimeOffRequests } from 'src/actions/timeOff';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CalendarRoot } from 'src/sections/work/calendar/styles';

import { TIME_OFF_TYPES, TIME_OFF_STATUSES } from 'src/types/timeOff';

import { TimelineToolbar } from './timeline-toolbar';
import { TimelineFilters } from './timeline-filters';

// ----------------------------------------------------------------------

const StyledCalendarRoot = styled(CalendarRoot)(({ theme }) => ({
  '& .fc-datagrid-cell-frame': {
    display: 'flex',
    alignItems: 'center',
  },
  // Override calendar styles that don't apply to timeline
  '& .fc-daygrid-day': {
    borderRight: 'none',
    borderBottom: 'none',
    backgroundColor: 'transparent',
  },
  '& .fc-daygrid-day.fc-day-other': {
    backgroundColor: 'transparent',
  },
  // Apply calendar's event styling to timeline events
  '& .fc-event': {
    borderWidth: 0,
    borderRadius: 6,
    boxShadow: 'none',
    border: 'none !important', // Force remove any border
    padding: 0, // Remove padding to eliminate border color
    '& .fc-event-main': {
      padding: '2px 6px',
      borderRadius: 'inherit',
      border: 'none !important', // Force remove any border
      borderWidth: 0,
      transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
      backgroundColor: varAlpha(
        theme.vars.palette.common.whiteChannel,
        0.76 // Same as calendar
      ),
      '&:hover': {
        backgroundColor: varAlpha(
          theme.vars.palette.common.whiteChannel,
          0.64 // Same as calendar
        ),
      },
    },
    '& .fc-event-main-frame': {
      lineHeight: 20 / 13,
      filter: 'brightness(0.48)', // This darkens the text color to match calendar
      color: 'inherit', // Ensure text color is inherited from the event
    },
    '& .fc-event-title': {
      textOverflow: 'ellipsis',
      color: 'inherit', // Ensure title color is inherited from the event
    },
    '& .fc-event-time': {
      overflow: 'unset',
      fontWeight: 600,
      color: 'inherit', // Ensure time color is inherited from the event
    },
  },
  '& .fc-resource-timeline-event': {
    borderWidth: 0,
    borderRadius: 6,
    boxShadow: 'none',
    border: 'none !important', // Force remove any border
    padding: 0, // Remove padding to eliminate border color
    '& .fc-event-main': {
      padding: '10px',
      borderRadius: 'inherit',
      border: 'none !important', // Force remove any border
      borderWidth: 0,
      transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
      backgroundColor: varAlpha(
        theme.vars.palette.common.whiteChannel,
        0.76 // Same as calendar
      ),
      '&:hover': {
        backgroundColor: varAlpha(
          theme.vars.palette.common.whiteChannel,
          0.64 // Same as calendar
        ),
      },
    },
    '& .fc-event-main-frame': {
      lineHeight: 20 / 13,
      filter: 'brightness(0.48)', // This darkens the text color to match calendar
      color: 'inherit', // Ensure text color is inherited from the event
    },
    '& .fc-event-title': {
      textOverflow: 'ellipsis',
      color: 'inherit', // Ensure title color is inherited from the event
    },
    '& .fc-event-time': {
      overflow: 'unset',
      fontWeight: 600,
      color: 'inherit', // Ensure time color is inherited from the event
    },
  },
  // Additional selectors for resource timeline events
  '& .fc-timeline-event': {
    borderWidth: 0,
    borderRadius: 6,
    boxShadow: 'none',
    border: 'none !important', // Force remove any border
    padding: 0, // Remove padding to eliminate border color
    '& .fc-event-main': {
      padding: '4px 6px',
      borderRadius: 'inherit',
      border: 'none !important', // Force remove any border
      borderWidth: 0,
      transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
      backgroundColor: varAlpha(
        theme.vars.palette.common.whiteChannel,
        0.76 // Same as calendar
      ),
      '&:hover': {
        backgroundColor: varAlpha(
          theme.vars.palette.common.whiteChannel,
          0.64 // Same as calendar
        ),
      },
    },
    '& .fc-event-main-frame': {
      lineHeight: 20 / 13,
      filter: 'brightness(0.48)', // This darkens the text color to match calendar
      color: 'inherit', // Ensure text color is inherited from the event
    },
    '& .fc-event-title': {
      textOverflow: 'ellipsis',
      color: 'inherit', // Ensure title color is inherited from the event
    },
    '& .fc-event-time': {
      overflow: 'unset',
      fontWeight: 600,
      color: 'inherit', // Ensure time color is inherited from the event
    },
    // Special styling for time off events - using same approach as job events
    '&.timeoff-event .fc-event-main': {
      padding: '2px 6px',
      borderRadius: 'inherit',
      border: 'none !important',
      borderWidth: 0,
      transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
      backgroundColor: varAlpha(
        theme.vars.palette.common.whiteChannel,
        0.76 // Same as calendar
      ),
      '&:hover': {
        backgroundColor: varAlpha(
          theme.vars.palette.common.whiteChannel,
          0.64 // Same as calendar
        ),
      },
    },
    '&.timeoff-event .fc-event-main-frame': {
      lineHeight: 20 / 13,
      filter: 'brightness(0.48)', // Same as job events - darkens the text
      color: 'inherit', // Same as job events - uses event textColor
    },
    '&.timeoff-event .fc-event-title': {
      textOverflow: 'ellipsis',
      color: 'inherit', // Same as job events - uses event textColor
    },
    '&.timeoff-event .fc-event-time': {
      overflow: 'unset',
      fontWeight: 600,
      color: 'inherit', // Same as job events - uses event textColor
    },
  },
  // Timeline-specific background fixes
  '& .fc-resource-timeline': {
    backgroundColor: 'transparent',
  },
  // Additional border removal for timeline events
  '& .fc-event, & .fc-resource-timeline-event, & .fc-timeline-event': {
    border: 'none !important',
    borderWidth: '0 !important',
    outline: 'none !important',
    '& *': {
      border: 'none !important',
      borderWidth: '0 !important',
      outline: 'none !important',
    },
  },
  '& .fc-resource-area': {
    backgroundColor: 'transparent',
  },
  '& .fc-resource-timeline-lane': {
    backgroundColor: 'transparent',
  },
  '& .fc-resource-timeline-slot': {
    backgroundColor: 'transparent',
  },
  '& .fc-resource-area-lane': {
    backgroundColor: 'transparent',
  },
  '& .fc-resource-area-cell': {
    backgroundColor: 'transparent',
  },
}));

// ----------------------------------------------------------------------

export function TimelinePage() {
  const openFilters = useBoolean();
  const [resources, setResources] = useState<any[]>([]);
  const [events, setEvents] = useState<EventInput[]>([]);
  const [filteredCalendarJobs, setFilteredCalendarJobs] = useState<ICalendarJob[]>([]);
  const [calendarDateRange, setCalendarDateRange] = useState<{ start: Date; end: Date } | null>(
    null
  );

  // Fetch all time off requests
  const { allTimeOffRequests, allTimeOffRequestsLoading } = useGetAllTimeOffRequests();

  const filters = useSetState<ICalendarFilters>({
    colors: [],
    startDate: null,
    endDate: null,
    searchQuery: '',
  });

  // Don't set default date range - let FullCalendar manage the date range
  // useEffect(() => {
  //   const today = dayjs();
  //   filters.setState({
  //     startDate: today,
  //     endDate: today,
  //   });
  // }, []);


  const { state: currentFilters } = filters;
  const dateError = fIsAfter(currentFilters.startDate, currentFilters.endDate);

  const getEventColor = (status: string, region: string, client?: any) => {
    // Use client color if available
    if (client?.color) {
      return client.color;
    }

    // Fall back to status-based colors (same as calendar)
    if (status === 'accepted') {
      return JOB_COLOR_OPTIONS[0]; // info.main
    }
    return JOB_COLOR_OPTIONS[2]; // warning.main
  };

  const getTimeOffEventColor = (type: string, status: string) => {
    // Get the base color for the time off type
    const typeConfig = TIME_OFF_TYPES.find((t) => t.value === type);
    const baseColor = typeConfig?.color || '#9C27B0'; // Default purple

    // For pending status, use a lighter/more muted version
    if (status === 'pending') {
      return '#FF9800'; // Orange for pending
    }

    return baseColor;
  };

  const formatTimeOffAsEvent = useCallback((timeOff: any, resourceList: any[]) => {
    const color = getTimeOffEventColor(timeOff.type, timeOff.status);

    // Find the matching resource (employee) for this time off request
    const matchingResource = resourceList.find((resource) => resource.id === timeOff.user_id);

    // Skip time off requests for employees not in the resources list
    if (!matchingResource) {
      console.warn(
        `Time off request for user ${timeOff.user_id} (${timeOff.first_name} ${timeOff.last_name}) not found in resources`
      );
      return null;
    }

    // For multi-day events, we need to add one day to the end date to include the full end day
    // FullCalendar treats end dates as exclusive, so we need to add one day
    const endDate = new Date(timeOff.end_date);
    endDate.setDate(endDate.getDate() + 1);
    const adjustedEndDate = endDate.toISOString().split('T')[0];

    return {
      id: `timeoff-${timeOff.id}`,
      resourceId: timeOff.user_id, // This should match the resource.id
      title: `${TIME_OFF_TYPES.find((t) => t.value === timeOff.type)?.label || timeOff.type} - ${timeOff.status.charAt(0).toUpperCase() + timeOff.status.slice(1)}`,
      start: timeOff.start_date,
      end: adjustedEndDate,
      color,
      textColor: color, // Same as job events - use the event color as textColor
      allDay: true,
      display: 'block', // Changed from 'background' to 'block' for better text visibility
      className: 'timeoff-event', // Add class for styling
      extendedProps: {
        type: 'timeoff',
        timeOffId: timeOff.id,
        timeOffType: timeOff.type,
        timeOffStatus: timeOff.status,
        timeOffReason: timeOff.reason,
        originalStartDate: timeOff.start_date,
        originalEndDate: timeOff.end_date,
        employee_name:
          `${timeOff.first_name || ''} ${timeOff.last_name || ''}`.trim() || 'Unknown Employee',
      },
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch active users (employees)
        const usersResponse = await fetcher(`${endpoints.management.user}/job-creation`);
        const users = usersResponse.data.users
          .map((user: any) => ({
            id: user.id,
            title: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            avatar: user.photo_url,
          }))
          .filter((user: any) => user.title) // Filter out users with empty names
          .sort((a: any, b: any) => a.title.localeCompare(b.title, undefined, { numeric: true })); // Sort alphabetically by name

        setResources(users);

        // Fetch jobs
        const jobsResponse = await fetcher(endpoints.work.job);
        const allJobs = jobsResponse.data.jobs;

        const filteredJobs = allJobs.filter(
          (job: any) => job.status !== 'draft' && job.status !== 'cancelled'
        );

        const jobs = filteredJobs.flatMap((job: any) => job.workers
            .filter(
              (worker: any) => worker.status !== 'draft' && worker.status !== 'rejected' // Filter out draft and rejected worker statuses
            )
            .map((worker: any) => {
              const workerName = `${worker.first_name || ''} ${worker.last_name || ''}`.trim();
              const eventColor = getEventColor(worker.status, job.company?.region, job.client);
              return {
                id: `${job.id}-${worker.id}`,
                resourceId: worker.id,
                title: (() => {
                  const baseTitle = `#${job.job_number}`;
                  const customerName = job.company?.name ? ` ${job.company.name}` : '';
                  const clientName = job.client?.name ? ` - ${job.client.name}` : '';
                  const siteName = job.site?.name ? ` - ${job.site.name}` : '';
                  return `${baseTitle}${customerName}${clientName}${siteName}` || 'Untitled Job';
                })(),
                start: convertToLocalTimezone(worker.start_time),
                end: convertToLocalTimezone(worker.end_time),
                color: eventColor,
                textColor: eventColor,
                extendedProps: {
                  jobId: job.id,
                  status: worker.status,
                  position: worker.position,
                  region: job.company?.region,
                  worker_name: workerName || 'Unknown Worker',
                  client: job.client, // Include client information
                  company: job.company, // Include company information
                  site: job.site, // Include site information
                },
              };
            }));

        // Process time off requests as events
        const timeOffRequests = allTimeOffRequests?.timeOffRequests || [];
        const timeOffEvents = timeOffRequests
          .filter((timeOff: any) => timeOff.status === 'pending' || timeOff.status === 'approved')
          .map((timeOff: any) => formatTimeOffAsEvent(timeOff, users))
          .filter(Boolean); // Remove null values

        // Combine job events and time off events
        const allEvents = [...jobs, ...timeOffEvents];
        setEvents(allEvents);

        // Create calendar jobs with worker information (for filtering)
        const calendarJobs: ICalendarJob[] = allEvents.map((event: EventInput) => ({
          id: event.id as string,
          title: event.title as string,
          start: event.start as string,
          end: event.end as string,
          allDay: event.allDay || false,
          color:
            event.extendedProps?.type === 'timeoff'
              ? getTimeOffEventColor(
                  event.extendedProps?.timeOffType,
                  event.extendedProps?.timeOffStatus
                )
              : getEventColor(
                  event.extendedProps?.status,
                  event.extendedProps?.region,
                  event.extendedProps?.client
                ),
          description: event.extendedProps?.position || event.extendedProps?.timeOffReason || '',
          worker_name: event.extendedProps?.worker_name || event.extendedProps?.employee_name,
          position: event.extendedProps?.position,
          type: event.extendedProps?.type || 'job',
        }));
        setFilteredCalendarJobs(calendarJobs);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [allTimeOffRequests, formatTimeOffAsEvent]);

  const canReset =
    currentFilters.colors.length > 0 ||
    (!!currentFilters.startDate && !!currentFilters.endDate) ||
    currentFilters.searchQuery.length > 0;

  // Filter resources based on search query
  const filteredResources = resources.filter((resource) => {
    const searchQuery = currentFilters.searchQuery.toLowerCase();
    if (!searchQuery) return true;

    // Check if employee name matches
    const nameMatch = resource.title?.toLowerCase().includes(searchQuery);

    // Check if employee has any events that match the search AND are within the current date range
    const hasMatchingEvents = events.some((event) => {
      if (event.resourceId !== resource.id) return false;

      // Check if the event matches the search query
      const matchesSearch =
        (event.title as string)?.toLowerCase().includes(searchQuery) ||
        event.extendedProps?.worker_name?.toLowerCase().includes(searchQuery) ||
        event.extendedProps?.employee_name?.toLowerCase().includes(searchQuery) ||
        event.extendedProps?.position?.toLowerCase().includes(searchQuery) ||
        event.extendedProps?.timeOffReason?.toLowerCase().includes(searchQuery) ||
        (event.extendedProps?.client?.name &&
          event.extendedProps.client.name.toLowerCase().includes(searchQuery)) ||
        (event.extendedProps?.company?.name &&
          event.extendedProps.company.name.toLowerCase().includes(searchQuery)) ||
        (event.extendedProps?.site?.name &&
          event.extendedProps.site.name.toLowerCase().includes(searchQuery)) ||
        (event.extendedProps?.client?.display_name &&
          event.extendedProps.client.display_name.toLowerCase().includes(searchQuery)) ||
        (event.extendedProps?.company?.display_name &&
          event.extendedProps.company.display_name.toLowerCase().includes(searchQuery)) ||
        (event.extendedProps?.site?.display_name &&
          event.extendedProps.site.display_name.toLowerCase().includes(searchQuery));

      // When searching, only show employees who have matching events within the calendar's current date range
      if (calendarDateRange) {
        const eventStart = new Date(event.start as string);
        const eventEnd = new Date(event.end as string);
        const rangeStart = new Date(calendarDateRange.start);
        const rangeEnd = new Date(calendarDateRange.end);

        // Check if event overlaps with the calendar's date range
        const isInRange = eventStart <= rangeEnd && eventEnd >= rangeStart;

        return matchesSearch && isInRange;
      }

      return matchesSearch;
    });

    return nameMatch || hasMatchingEvents;
  });

  const dataFiltered = events.filter((event) => {
    // Search functionality - search across multiple fields (declare first)
    const searchQuery = currentFilters.searchQuery.toLowerCase();

    // Get the appropriate color based on event type
    const eventColor =
      event.extendedProps?.type === 'timeoff'
        ? getTimeOffEventColor(event.extendedProps?.timeOffType, event.extendedProps?.timeOffStatus)
        : getEventColor(
            event.extendedProps?.status,
            event.extendedProps?.region,
            event.extendedProps?.client
          );

    const matchesColor =
      currentFilters.colors.length === 0 || currentFilters.colors.includes(eventColor);

    // When searching, ignore date range filtering to show all matching events
    const matchesDateRange = searchQuery
      ? true
      : !currentFilters.startDate ||
        !currentFilters.endDate ||
        (new Date(event.start as string).getTime() >= currentFilters.startDate.toDate().getTime() &&
          new Date(event.end as string).getTime() <= currentFilters.endDate.toDate().getTime());


    const matchesSearch =
      !searchQuery ||
      // Primary search - event title contains all the important info
      (event.title as string)?.toLowerCase().includes(searchQuery) ||
      // Worker/Employee search
      event.extendedProps?.worker_name?.toLowerCase().includes(searchQuery) ||
      event.extendedProps?.employee_name?.toLowerCase().includes(searchQuery) ||
      event.extendedProps?.position?.toLowerCase().includes(searchQuery) ||
      event.extendedProps?.timeOffReason?.toLowerCase().includes(searchQuery) ||
      // Customer/Client search with null checks
      (event.extendedProps?.client?.name &&
        event.extendedProps.client.name.toLowerCase().includes(searchQuery)) ||
      (event.extendedProps?.company?.name &&
        event.extendedProps.company.name.toLowerCase().includes(searchQuery)) ||
      (event.extendedProps?.site?.name &&
        event.extendedProps.site.name.toLowerCase().includes(searchQuery)) ||
      // Additional customer/client fields with null checks
      (event.extendedProps?.client?.display_name &&
        event.extendedProps.client.display_name.toLowerCase().includes(searchQuery)) ||
      (event.extendedProps?.company?.display_name &&
        event.extendedProps.company.display_name.toLowerCase().includes(searchQuery)) ||
      (event.extendedProps?.site?.display_name &&
        event.extendedProps.site.display_name.toLowerCase().includes(searchQuery));

    // When searching, show all events that match the search, regardless of resource filtering
    const matchesResource = !searchQuery || true; // Always show events when searching

    return matchesColor && matchesDateRange && matchesSearch && matchesResource;
  });

  // Debug: Log total filtered results
  if (currentFilters.searchQuery && currentFilters.searchQuery.length > 0) {
    // Show sample events that match the search
    events.filter((event) => {
      const searchQuery = currentFilters.searchQuery.toLowerCase();
      return (
        (event.title as string)?.toLowerCase().includes(searchQuery) ||
        event.extendedProps?.worker_name?.toLowerCase().includes(searchQuery) ||
        event.extendedProps?.employee_name?.toLowerCase().includes(searchQuery) ||
        event.extendedProps?.position?.toLowerCase().includes(searchQuery) ||
        event.extendedProps?.timeOffReason?.toLowerCase().includes(searchQuery) ||
        (event.extendedProps?.client?.name &&
          event.extendedProps.client.name.toLowerCase().includes(searchQuery)) ||
        (event.extendedProps?.company?.name &&
          event.extendedProps.company.name.toLowerCase().includes(searchQuery)) ||
        (event.extendedProps?.site?.name &&
          event.extendedProps.site.name.toLowerCase().includes(searchQuery)) ||
        (event.extendedProps?.client?.display_name &&
          event.extendedProps.client.display_name.toLowerCase().includes(searchQuery)) ||
        (event.extendedProps?.company?.display_name &&
          event.extendedProps.company.display_name.toLowerCase().includes(searchQuery)) ||
        (event.extendedProps?.site?.display_name &&
          event.extendedProps.site.display_name.toLowerCase().includes(searchQuery))
      );
    });
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Employee Timeline"
        links={[{ name: 'Work Management' }, { name: 'Timeline' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Filter results hidden as requested */}
      {/* {canReset && (
        <TimelineFiltersResult
          filters={filters}
          totalResults={dataFiltered.length}
          sx={{ mb: 3 }}
        />
      )} */}

      <Card
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '50vh',
        }}
      >
        <StyledCalendarRoot
          sx={{
            display: 'flex',
            flexDirection: 'column',
            '.fc.fc-media-screen': { flex: '1 1 auto' },
          }}
        >
          <TimelineToolbar
            loading={allTimeOffRequestsLoading}
            canReset={canReset}
            searchQuery={currentFilters.searchQuery}
            onOpenFilters={() => {}} // No-op since filter button is hidden
            onSearchChange={(query) => filters.setState({ searchQuery: query })}
          />

          <FullCalendar
            plugins={[
              resourcePlugin,
              resourceTimelinePlugin,
              dayGridPlugin,
              timeGridPlugin,
              interactionPlugin,
            ]}
            initialView="resourceTimelineDay"
            schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
            headerToolbar={{
              left: 'prev,next',
              center: 'title',
              right:
                'resourceTimelineDay,resourceTimelineWeek,resourceTimelineTwoWeek,resourceTimelineMonth',
            }}
            views={{
              resourceTimelineTwoWeek: {
                type: 'resourceTimeline',
                duration: { days: 14 },
                buttonText: '2 week',
              },
            }}
            resources={filteredResources}
            events={dataFiltered}
            resourceAreaWidth="15%"
            resourceAreaHeaderContent="Employees"
            resourceOrder="title"
            resourceAreaColumns={[
              {
                field: 'title',
                headerContent: 'Name',
              },
            ]}
            datesSet={(dateInfo) => {
              // Update the calendar date range when the view changes
              setCalendarDateRange({
                start: dateInfo.start,
                end: dateInfo.end,
              });
            }}
            // Remove custom eventContent to let FullCalendar handle text colors naturally
            height="auto"
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
            slotDuration="00:30:00"
            slotLabelInterval="01:00"
            nowIndicator
            selectMirror
            dayMaxEvents
            weekends
            eventClick={() => {
              // Event click handler
            }}
          />
        </StyledCalendarRoot>
      </Card>

      <TimelineFilters
        open={openFilters.value}
        onClose={openFilters.onFalse}
        filters={{
          state: currentFilters,
          setState: filters.setState,
          resetState: filters.resetState,
          setField: filters.setField,
        }}
        dateError={dateError}
        canReset={canReset}
        colorOptions={[
          ...JOB_COLOR_OPTIONS,
          ...TIME_OFF_TYPES.map((type) => type.color),
          ...TIME_OFF_STATUSES.map((status) => status.color),
        ]}
        jobs={filteredCalendarJobs}
        onClickJob={() => {}}
      />
    </DashboardContent>
  );
}
