import type { EventInput } from '@fullcalendar/core';
import type { ICalendarJob, ICalendarFilters } from 'src/types/calendar';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useState, useEffect } from 'react';
import timezone from 'dayjs/plugin/timezone';
import FullCalendar from '@fullcalendar/react';
import { varAlpha } from 'minimal-shared/utils';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourcePlugin from '@fullcalendar/resource';
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

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CalendarRoot } from 'src/sections/work/calendar/styles';

import { TimelineToolbar } from './timeline-toolbar';
import { TimelineFilters } from './timeline-filters';
import { TimelineFiltersResult } from './timeline-filters-result';

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

  const filters = useSetState<ICalendarFilters>({
    colors: [],
    startDate: null,
    endDate: null,
  });

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch active users (employees)
        const usersResponse = await fetcher(`${endpoints.management.user}?status=active`);
        const users = usersResponse.data.users.map((user: any) => ({
          id: user.id,
          title: `${user.first_name} ${user.last_name}`,
          avatar: user.photo_url,
        }));
        setResources(users);

        // Fetch jobs
        const jobsResponse = await fetcher(endpoints.work.job);
        const jobs = jobsResponse.data.jobs
          .filter((job: any) => job.status !== 'draft') // Filter out draft jobs
          .flatMap((job: any) =>
            job.workers
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
                    const clientName = job.client?.name ? ` - ${job.client.name}` : '';
                    const siteName = job.site?.name ? ` - ${job.site.name}` : '';
                    return `${baseTitle}${clientName}${siteName}` || 'Untitled Job';
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
                  },
                };
              })
          );
        setEvents(jobs);

        // Create calendar jobs with worker information
        const calendarJobs: ICalendarJob[] = jobs.map((job: EventInput) => ({
          id: job.id as string,
          title: job.title as string,
          start: job.start as string,
          end: job.end as string,
          allDay: false,
          color: getEventColor(job.extendedProps?.status, job.extendedProps?.region, job.extendedProps?.client),
          description: job.extendedProps?.position || '',
          worker_name: job.extendedProps?.worker_name,
          position: job.extendedProps?.position,
        }));
        setFilteredCalendarJobs(calendarJobs);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const canReset =
    currentFilters.colors.length > 0 || (!!currentFilters.startDate && !!currentFilters.endDate);

  const dataFiltered = events.filter((event) => {
    const eventColor = getEventColor(event.extendedProps?.status, event.extendedProps?.region, event.extendedProps?.client);

    const matchesColor =
      currentFilters.colors.length === 0 || currentFilters.colors.includes(eventColor);

    const matchesDateRange =
      !currentFilters.startDate ||
      !currentFilters.endDate ||
      (new Date(event.start as string).getTime() >= currentFilters.startDate.toDate().getTime() &&
        new Date(event.end as string).getTime() <= currentFilters.endDate.toDate().getTime());

    return matchesColor && matchesDateRange;
  });

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Employee Timeline"
        links={[{ name: 'Work Management' }, { name: 'Timeline' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {canReset && (
        <TimelineFiltersResult
          filters={filters}
          totalResults={dataFiltered.length}
          sx={{ mb: 3 }}
        />
      )}

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
          <TimelineToolbar loading={false} canReset={canReset} onOpenFilters={openFilters.onTrue} />

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
            resources={resources}
            events={dataFiltered}
            resourceAreaWidth="15%"
            resourceAreaHeaderContent="Employees"
            resourceAreaColumns={[
              {
                field: 'title',
                headerContent: 'Name',
              },
            ]}
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
        colorOptions={JOB_COLOR_OPTIONS}
        jobs={filteredCalendarJobs}
        onClickJob={() => {}}
      />
    </DashboardContent>
  );
}