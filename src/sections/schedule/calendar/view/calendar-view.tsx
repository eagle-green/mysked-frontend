import type { Theme, SxProps } from '@mui/material/styles';
import type { ICalendarJob, ICalendarFilters } from 'src/types/calendar';

import dayjs from 'dayjs';
import { Icon } from '@iconify/react';
import Calendar from '@fullcalendar/react';
import listPlugin from '@fullcalendar/list';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useRef, useState, useEffect, startTransition } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { fIsAfter, fIsBetween } from 'src/utils/format-time';

import { JOB_COLOR_OPTIONS } from 'src/assets/data/job';
import { DashboardContent } from 'src/layouts/dashboard';
import { updateJob, useGetWorkerCalendarJobs } from 'src/actions/calendar';

import { TIME_OFF_TYPES, TIME_OFF_STATUSES } from 'src/types/timeOff';

import { CalendarRoot } from '../styles';
import { useJob } from '../hooks/use-event';
import { CalendarForm } from '../calendar-form';
import { useCalendar } from '../hooks/use-calendar';
import { CalendarToolbar } from '../calendar-toolbar';
import { CalendarFilters } from '../calendar-filters';
import { JobDetailsDialog } from '../job-details-dialog';
import { TimeOffRequestForm } from '../time-off-request-form';
import { CalendarFiltersResult } from '../calendar-filters-result';

// ----------------------------------------------------------------------

export function WorkerCalendarView() {
  const theme = useTheme();
  const openFilters = useBoolean();
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [jobDetailsOpen, setJobDetailsOpen] = useState(false);
  const [timeOffFormOpen, setTimeOffFormOpen] = useState(false);
  const [timeOffDetailsOpen, setTimeOffDetailsOpen] = useState(false);
  const [selectedTimeOff, setSelectedTimeOff] = useState<any>(null);

  const { jobs: userJobs, jobsLoading: isLoading } = useGetWorkerCalendarJobs();
  const tableData = userJobs || [];

  const calendarRef = useRef<Calendar>(null);

  const filters = useSetState<ICalendarFilters>({ colors: [], startDate: null, endDate: null, searchQuery: '' });
  const { state: currentFilters } = filters;

  const dateError = fIsAfter(currentFilters.startDate, currentFilters.endDate);

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
  } = useCalendar(calendarRef, {
    events: dataFiltered,
  });

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
          <Typography variant="h4">My Calendar</Typography>
          <Button
            variant="contained"
            startIcon={<Icon icon="solar:calendar-bold" />}
            onClick={() => setTimeOffFormOpen(true)}
          >
            Request Time Off
          </Button>
        </Box>

        {canReset && renderResults()}

        <Card sx={{ ...flexStyles, minHeight: '50vh' }}>
          <CalendarRoot sx={{ 
            ...flexStyles,
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
              'thead': {
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
              // Override event styles to make time-off events bold
              '& .timeoff-event': {
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
              firstDay={1}
              rerenderDelay={10}
              allDayMaintainDuration
              eventResizableFromStart
              aspectRatio={3}
              ref={calendarRef}
              initialDate={date}
              initialView={view}
              dayMaxEventRows={10}
              events={dataFiltered}
              headerToolbar={false}
              eventDisplay="block"
              select={onSelectRange}
              eventClick={(arg) => {
                const eventType = arg.event.extendedProps?.type;

                if (eventType === 'timeoff') {
                  // Handle time-off request click
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
                } else {
                  // Handle job click
                  const jobId = arg.event.extendedProps?.jobId;
                  if (jobId) {
                    setSelectedJobId(jobId);
                    setJobDetailsOpen(true);
                  }
                }
              }}
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
              plugins={[listPlugin, dayGridPlugin, interactionPlugin]}
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

      <TimeOffRequestForm open={timeOffFormOpen} onClose={() => setTimeOffFormOpen(false)} />

      {/* Time-off Details Dialog */}
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
                <Typography variant="body1">{selectedTimeOff.reason}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setTimeOffDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
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
    // Handle time-off requests
    if (event.type === 'timeoff') {
      return event.color; // Use the color already set in the calendar hook
    }

    // Handle jobs
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

  const filteredEvents = inputData.filter((event) => {
    // Filter out draft jobs
    if (event.type === 'job' && event.status === 'draft') {
      return false;
    }

    const eventColor = getEventColor(event);

    const matchesColor = colors.length === 0 || colors.includes(eventColor);

    const matchesDateRange =
      !startDate ||
      !endDate ||
      fIsBetween(event.start, startDate.toDate(), dayjs(endDate).endOf('day').toDate());

    return matchesColor && matchesDateRange;
  });

  return filteredEvents;
}
