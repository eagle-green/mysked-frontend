import type { Theme, SxProps } from '@mui/material/styles';
import type { ICalendarJob, ICalendarFilters } from 'src/types/calendar';

import dayjs from 'dayjs';
import Calendar from '@fullcalendar/react';
import listPlugin from '@fullcalendar/list';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import timelinePlugin from '@fullcalendar/timeline';
import interactionPlugin from '@fullcalendar/interaction';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useRef, useState, useEffect, startTransition } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Dialog from '@mui/material/Dialog';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';

import { fIsAfter, fIsBetween } from 'src/utils/format-time';

import { JOB_COLOR_OPTIONS } from 'src/assets/data/job';
import { DashboardContent } from 'src/layouts/dashboard';
import { updateJob, useGetWorkerCalendarJobs } from 'src/actions/calendar';

import { CalendarRoot } from '../styles';
import { useJob } from '../hooks/use-event';
import { CalendarForm } from '../calendar-form';
import { useCalendar } from '../hooks/use-calendar';
import { CalendarToolbar } from '../calendar-toolbar';
import { CalendarFilters } from '../calendar-filters';
import { JobDetailsDialog } from '../job-details-dialog';
import { CalendarFiltersResult } from '../calendar-filters-result';

// ----------------------------------------------------------------------

export function WorkerCalendarView() {
  const theme = useTheme();
  const openFilters = useBoolean();
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [jobDetailsOpen, setJobDetailsOpen] = useState(false);

  const { jobs: userJobs, jobsLoading: isLoading } = useGetWorkerCalendarJobs();
  const tableData = userJobs || [];

  const calendarRef = useRef<Calendar>(null);

  const filters = useSetState<ICalendarFilters>({ colors: [], startDate: null, endDate: null });
  const { state: currentFilters } = filters;

  const dateError = fIsAfter(currentFilters.startDate, currentFilters.endDate);

  const {
    view,
    date,
    title,
    onDatePrev,
    onDateNext,
    onDateToday,
    onDropJob,
    onChangeView,
    onSelectRange,
    onResizeJob,
    onInitialView,
    openForm,
    onCloseForm,
    selectJobId,
    selectedRange,
    onClickJobInFilters,
  } = useCalendar(calendarRef);

  const currentJob = useJob(tableData, selectJobId, selectedRange, openForm);

  // Initialize calendar when component mounts
  useEffect(() => {
    if (calendarRef.current) {
      onInitialView();
    }
  }, [onInitialView]);

  // Handle view changes
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(view);
    }
  }, [view]);

  const canReset =
    currentFilters.colors.length > 0 || (!!currentFilters.startDate && !!currentFilters.endDate);

  const dataFiltered = applyFilter({
    inputData: tableData.map((job: any) => {
      // For worker calendar, the status is the worker's status, not the job status
      const workerStatus = job.status; // This is already the worker status from the API

      return {
        ...job,
        status: workerStatus,
        region: job.site?.region || 'Other',
        client: job.client, // Make sure client info is included
      };
    }),
    filters: currentFilters,
    dateError,
  });

  const renderResults = () => (
    <CalendarFiltersResult
      filters={filters}
      totalResults={dataFiltered.length}
      sx={{ mb: { xs: 3, md: 5 } }}
    />
  );

  const flexStyles: SxProps<Theme> = {
    flex: '1 1 auto',
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <>
      <DashboardContent maxWidth="xl" sx={{ ...flexStyles }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: { xs: 3, md: 5 },
          }}
        >
          <Typography variant="h4">My Schedule</Typography>
        </Box>

        {canReset && renderResults()}

        <Card
          sx={{
            ...flexStyles,
            minHeight: '50vh',
          }}
        >
          <CalendarRoot
            sx={{
              ...flexStyles,
              '.fc.fc-media-screen': { flex: '1 1 auto' },
            }}
          >
            <CalendarToolbar
              title={title}
              view={view}
              canReset={canReset}
              loading={isLoading}
              onNextDate={onDateNext}
              onPrevDate={onDatePrev}
              onToday={onDateToday}
              onChangeView={onChangeView}
              onOpenFilters={openFilters.onTrue}
            />

            <Calendar
              weekends
              editable
              firstDay={1}
              rerenderDelay={10}
              allDayMaintainDuration
              eventResizableFromStart
              ref={calendarRef}
              initialDate={date}
              initialView={view}
              dayMaxEventRows={10}
              eventDisplay="block"
              events={dataFiltered}
              headerToolbar={false}
              select={onSelectRange}
              eventClick={(arg) => {
                // Use the jobId property from the event extended props
                const jobId = arg.event.extendedProps?.jobId;
                if (jobId) {
                  setSelectedJobId(jobId);
                  setJobDetailsOpen(true);
                }
              }}
              aspectRatio={3}
              eventDrop={(arg) => {
                startTransition(() => {
                  onDropJob(arg, updateJob);
                });
              }}
              eventResize={(arg) => {
                startTransition(() => {
                  onResizeJob(arg, updateJob);
                });
              }}
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
      </DashboardContent>

      <Dialog
        fullWidth
        maxWidth="xs"
        open={openForm}
        onClose={onCloseForm}
        transitionDuration={{
          enter: theme.transitions.duration.shortest,
          exit: theme.transitions.duration.shortest - 80,
        }}
        slotProps={{
          paper: {
            sx: {
              display: 'flex',
              overflow: 'hidden',
              flexDirection: 'column',
              '& form': {
                ...flexStyles,
                minHeight: 0,
              },
            },
          },
        }}
      >
        <DialogTitle sx={{ minHeight: 76 }}>
          {openForm && <> {currentJob?.id ? 'Edit' : 'Add'} event</>}
        </DialogTitle>

        <CalendarForm
          currentJob={currentJob}
          colorOptions={JOB_COLOR_OPTIONS}
          onClose={onCloseForm}
        />
      </Dialog>

      <CalendarFilters
        jobs={tableData}
        filters={filters}
        canReset={canReset}
        dateError={dateError}
        open={openFilters.value}
        onClose={openFilters.onFalse}
        onClickJob={onClickJobInFilters}
        colorOptions={JOB_COLOR_OPTIONS}
      />

      <JobDetailsDialog
        open={jobDetailsOpen}
        onClose={() => setJobDetailsOpen(false)}
        jobId={selectedJobId}
      />
    </>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  dateError: boolean;
  filters: ICalendarFilters;
  inputData: ICalendarJob[];
};

function applyFilter({ inputData, filters, dateError }: ApplyFilterProps) {
  const { colors, startDate, endDate } = filters;

  const getEventColor = (event: any) => {
    // Use client color if available
    if (event.client?.color) {
      return event.client.color;
    }

    // Fall back to status-based colors
    if (event.status === 'draft') {
      return 'warning.main'; // This won't be used since draft jobs are filtered out
    }
    if (event.status === 'pending') {
      return 'warning.main';
    }
    if (event.status === 'accepted') {
      return 'info.main';
    }
    // Default to warning color for any other status
    return 'warning.main';
  };

  return inputData.filter((job) => {
    // Filter out draft jobs
    if (job.status === 'draft') {
      return false;
    }

    const eventColor = getEventColor(job);

    const matchesColor = colors.length === 0 || colors.includes(eventColor);

    const matchesDateRange =
      !startDate ||
      !endDate ||
      fIsBetween(job.start, startDate.toDate(), dayjs(endDate).endOf('day').toDate());

    return matchesColor && matchesDateRange;
  });
}
