import type FullCalendar from '@fullcalendar/react';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
import type { EventDropArg, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import type { ICalendarJob, ICalendarView, ICalendarRange } from 'src/types/calendar';

import { useRef, useState, useCallback } from 'react';

import useMediaQuery from '@mui/material/useMediaQuery';

// ----------------------------------------------------------------------

export function useCalendar() {
  const calendarRef = useRef<FullCalendar>(null);
  const calendarEl = calendarRef.current;

  const smUp = useMediaQuery((theme) => theme.breakpoints.up('sm'));

  const [date, setDate] = useState(new Date());

  const [openForm, setOpenForm] = useState(false);

  const [selectJobId, setSelectJobId] = useState('');

  const [selectedRange, setSelectedRange] = useState<ICalendarRange>(null);

  const [view, setView] = useState<ICalendarView>(smUp ? 'dayGridMonth' : 'listWeek');

  const onOpenForm = useCallback(() => {
    setOpenForm(true);
  }, []);

  const onCloseForm = useCallback(() => {
    setOpenForm(false);
    setSelectedRange(null);
    setSelectJobId('');
  }, []);

  const onInitialView = useCallback(() => {
    if (calendarEl) {
      const calendarApi = calendarEl.getApi();

      const newView = smUp ? 'dayGridMonth' : 'listWeek';
      calendarApi.changeView(newView);
      setView(newView);
    }
  }, [calendarEl, smUp]);

  const onChangeView = useCallback(
    (newView: ICalendarView) => {
      if (calendarEl) {
        const calendarApi = calendarEl.getApi();

        calendarApi.changeView(newView);
        setView(newView);
      }
    },
    [calendarEl]
  );

  const onDateToday = useCallback(() => {
    if (calendarEl) {
      const calendarApi = calendarEl.getApi();

      calendarApi.today();
      setDate(calendarApi.getDate());
    }
  }, [calendarEl]);

  const onDatePrev = useCallback(() => {
    if (calendarEl) {
      const calendarApi = calendarEl.getApi();

      calendarApi.prev();
      setDate(calendarApi.getDate());
    }
  }, [calendarEl]);

  const onDateNext = useCallback(() => {
    if (calendarEl) {
      const calendarApi = calendarEl.getApi();

      calendarApi.next();
      setDate(calendarApi.getDate());
    }
  }, [calendarEl]);

  const onSelectRange = useCallback(
    (arg: DateSelectArg) => {
      if (calendarEl) {
        const calendarApi = calendarEl.getApi();

        calendarApi.unselect();
      }

      onOpenForm();
      setSelectedRange({ start: arg.startStr, end: arg.endStr });
    },
    [calendarEl, onOpenForm]
  );

  const onClickJob = useCallback(
    (arg: EventClickArg) => {
      const { event } = arg;

      onOpenForm();
      setSelectJobId(event.id);
    },
    [onOpenForm]
  );

  const onResizeJob = useCallback(
    (arg: EventResizeDoneArg, updateJob: (jobData: Partial<ICalendarJob>) => void) => {
      const { event } = arg;

      updateJob({
        id: event.id,
        allDay: event.allDay,
        start: event.startStr,
        end: event.endStr,
      });
    },
    []
  );

  const onDropJob = useCallback(
    (arg: EventDropArg, updateJob: (jobData: Partial<ICalendarJob>) => void) => {
      const { event } = arg;

      updateJob({
        id: event.id,
        allDay: event.allDay,
        start: event.startStr,
        end: event.endStr,
      });
    },
    []
  );

  const onClickJobInFilters = useCallback(
    (jobId: string) => {
      if (jobId) {
        onOpenForm();
        setSelectJobId(jobId);
      }
    },
    [onOpenForm]
  );

  return {
    calendarRef,
    /********/
    view,
    date,
    /********/
    onDatePrev,
    onDateNext,
    onDateToday,
    onDropJob,
    onClickJob,
    onChangeView,
    onSelectRange,
    onResizeJob,
    onInitialView,
    /********/
    openForm,
    onOpenForm,
    onCloseForm,
    /********/
    selectJobId,
    selectedRange,
    /********/
    onClickJobInFilters,
  };
}
