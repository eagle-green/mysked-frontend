import type FullCalendar from '@fullcalendar/react';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
import type { ICalendarJob, ICalendarView, ICalendarRange } from 'src/types/calendar';
import type { ViewApi, EventDropArg, DateSelectArg, EventClickArg } from '@fullcalendar/core';

import { useState, useCallback } from 'react';

import useMediaQuery from '@mui/material/useMediaQuery';

// ----------------------------------------------------------------------

export function useCalendar(calendarRef: React.RefObject<FullCalendar | null>) {
  const smUp = useMediaQuery((theme) => theme.breakpoints.up('sm'));

  const [date, setDate] = useState(new Date());
  const [title, setTitle] = useState<ViewApi['title']>('');
  const [openForm, setOpenForm] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
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

  const onOpenDetailsDialog = useCallback(() => {
    setOpenDetailsDialog(true);
  }, []);

  const onCloseDetailsDialog = useCallback(() => {
    setOpenDetailsDialog(false);
    // Delay clearing the jobId to prevent flash during closing animation
    setTimeout(() => {
      setSelectJobId('');
    }, 150);
  }, []);

  const onInitialView = useCallback(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const newView = smUp ? 'dayGridMonth' : 'listWeek';
      calendarApi.changeView(newView);
      setView(newView);
      setDate(calendarApi.getDate());
      setTitle(calendarApi.view.title);
    }
  }, [calendarRef, smUp]);

  const onChangeView = useCallback(
    (newView: ICalendarView) => {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.changeView(newView);
        setView(newView);
        setDate(calendarApi.getDate());
        setTitle(calendarApi.view.title);
      }
    },
    [calendarRef]
  );

  const onDateToday = useCallback(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.today();
      setDate(calendarApi.getDate());
      setTitle(calendarApi.view.title);
    }
  }, [calendarRef]);

  const onDatePrev = useCallback(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.prev();
      setDate(calendarApi.getDate());
      setTitle(calendarApi.view.title);
    }
  }, [calendarRef]);

  const onDateNext = useCallback(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.next();
      setDate(calendarApi.getDate());
      setTitle(calendarApi.view.title);
    }
  }, [calendarRef]);

  const onSelectRange = useCallback(
    (arg: DateSelectArg) => {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.unselect();
      }
      onOpenForm();
      setSelectedRange({ start: arg.startStr, end: arg.endStr });
    },
    [calendarRef, onOpenForm]
  );

  const onClickJob = useCallback(
    (arg: EventClickArg) => {
      const { event } = arg;
      setSelectJobId(event.id);
      onOpenDetailsDialog();
    },
    [onOpenDetailsDialog]
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
    view,
    date,
    title,
    onDatePrev,
    onDateNext,
    onDateToday,
    onDropJob,
    onClickJob,
    onChangeView,
    onSelectRange,
    onResizeJob,
    onInitialView,
    openForm,
    onOpenForm,
    onCloseForm,
    openDetailsDialog,
    onOpenDetailsDialog,
    onCloseDetailsDialog,
    selectJobId,
    selectedRange,
    onClickJobInFilters,
  };
}
