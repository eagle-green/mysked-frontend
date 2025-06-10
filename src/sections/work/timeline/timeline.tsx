import type { EventInput } from '@fullcalendar/core';
import type { ICalendarJob, ICalendarFilters } from 'src/types/calendar';

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';

import Card from '@mui/material/Card';

import { fIsAfter } from 'src/utils/format-time';
import { getRoleLabel } from 'src/utils/format-role';

import { fetcher, endpoints } from 'src/lib/axios';
import { info, success, warning } from 'src/theme/core';
import { JOB_COLOR_OPTIONS } from 'src/assets/data/job';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CalendarRoot } from 'src/sections/work/calendar/styles';

import { TimelineToolbar } from './timeline-toolbar';
import { TimelineFilters } from './timeline-filters';
import { TimelineFiltersResult } from './timeline-filters-result';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch active users (employees)
        const usersResponse = await fetcher(`${endpoints.user}?status=active`);
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
                return {
                  id: `${job.id}-${worker.id}`,
                  resourceId: worker.id,
                  title: `${job.job_number} - ${job.site.name}`,
                  start: worker.start_time,
                  end: worker.end_time,
                  extendedProps: {
                    jobId: job.id,
                    status: worker.status,
                    position: worker.position,
                    region: job.site.region,
                    worker_name: workerName || 'Unknown Worker',
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
          color: getEventColor(job.extendedProps?.status, job.extendedProps?.region),
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

  const getEventColor = (status: string, region: string) => {
    if (status === 'accepted') {
      return region === 'Metro Vancouver' ? info.main : success.main;
    }
    return warning.main; // For pending status
  };

  const canReset =
    currentFilters.colors.length > 0 || (!!currentFilters.startDate && !!currentFilters.endDate);

  const dataFiltered = events.filter((event) => {
    const eventColor = getEventColor(event.extendedProps?.status, event.extendedProps?.region);

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
        <CalendarRoot
          sx={{
            display: 'flex',
            flexDirection: 'column',
            '.fc.fc-media-screen': { flex: '1 1 auto' },
          }}
        >
          <TimelineToolbar loading={false} canReset={canReset} onOpenFilters={openFilters.onTrue} />

          <FullCalendar
            plugins={[resourceTimelinePlugin, dayGridPlugin, timeGridPlugin, interactionPlugin]}
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
            eventContent={(eventInfo) => (
              <div
                style={{
                  padding: '2px 4px',
                  backgroundColor: getEventColor(
                    eventInfo.event.extendedProps.status,
                    eventInfo.event.extendedProps.region
                  ),
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                {'#' + eventInfo.event.title}
                <br />
                <small>{getRoleLabel(eventInfo.event.extendedProps.position)}</small>
              </div>
            )}
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
        </CalendarRoot>
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
