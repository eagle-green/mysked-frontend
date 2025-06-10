import type { Theme, SxProps } from '@mui/material/styles';
import type { ICalendarJob, ICalendarFilters } from 'src/types/calendar';

import dayjs from 'dayjs';
import Calendar from '@fullcalendar/react';
import { useLocation } from 'react-router';
import listPlugin from '@fullcalendar/list';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import timelinePlugin from '@fullcalendar/timeline';
import interactionPlugin from '@fullcalendar/interaction';
import { useRef, useEffect, startTransition } from 'react';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';

import { paths } from 'src/routes/paths';

import { fDate, fIsAfter, fIsBetween } from 'src/utils/format-time';

import { JOB_COLOR_OPTIONS } from 'src/assets/data/job';
import { DashboardContent } from 'src/layouts/dashboard';
import { updateJob, useGetJobs, useGetUserJobs } from 'src/actions/calendar';

import { Iconify } from 'src/components/iconify';

import { CalendarRoot } from '../styles';
import { useJob } from '../hooks/use-event';
import { CalendarForm } from '../calendar-form';
import { useCalendar } from '../hooks/use-calendar';
import { CalendarToolbar } from '../calendar-toolbar';
import { CalendarFilters } from '../calendar-filters';
import { CalendarFiltersResult } from '../calendar-filters-result';

// ----------------------------------------------------------------------

export function CalendarView() {
  const theme = useTheme();
  const location = useLocation();
  const openFilters = useBoolean();
  const isScheduleView = location.pathname.startsWith('/schedules');

  // Always call both hooks, but use the appropriate data based on the view
  const { jobs: userJobs, jobsLoading: isUserJobsLoading } = useGetUserJobs();
  const { jobs: allJobs, jobsLoading: isAllJobsLoading } = useGetJobs();

  // Use the appropriate data based on the view
  const jobListData = isScheduleView ? userJobs : allJobs;
  const isLoading = isScheduleView ? isUserJobsLoading : isAllJobsLoading;

  // Use the fetched data or fallback to empty array
  const tableData = jobListData || [];

  const calendarRef = useRef<Calendar>(null);

  const filters = useSetState<ICalendarFilters>({ colors: [], startDate: null, endDate: null });
  const { state: currentFilters } = filters;

  const dateError = fIsAfter(currentFilters.startDate, currentFilters.endDate);

  const {
    view,
    date,
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
    inputData: tableData.map((job: any) => ({
      ...job,
      // status and color are already set by useGetJobs
    })),
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
          <Typography variant="h4">Calendar</Typography>
          {!isScheduleView && (
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              href={paths.work.job.create}
            >
              New Job
            </Button>
          )}
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
              date={fDate(date)}
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
        jobs={dataFiltered}
        filters={filters}
        canReset={canReset}
        dateError={dateError}
        open={openFilters.value}
        onClose={openFilters.onFalse}
        onClickJob={onClickJobInFilters}
        colorOptions={JOB_COLOR_OPTIONS}
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

  return inputData.filter((job) => {
    // Only filter out draft and cancelled jobs (already done in useGetJobs, but safe to keep)
    if (job.status === 'draft' || job.status === 'cancelled') {
      return false;
    }

    // Use the color property from the job (set in useGetJobs)
    const eventColor = job.color;
    const matchesColor = colors.length === 0 || colors.includes(eventColor);
    const matchesDateRange =
      !startDate || !endDate ||
      fIsBetween(job.start, startDate.toDate(), dayjs(endDate).endOf('day').toDate());

    return matchesColor && matchesDateRange;
  });
}
