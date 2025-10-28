import type { IDatePickerControl } from './common';

// ----------------------------------------------------------------------

export type ICalendarFilters = {
  colors: string[];
  startDate: IDatePickerControl;
  endDate: IDatePickerControl;
  searchQuery: string;
};

export type ICalendarDate = string | number;

export type ICalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';

export type ICalendarRange = {
  start: ICalendarDate;
  end: ICalendarDate;
} | null;

export type ICalendarJob = {
  id: string;
  color: string;
  title: string;
  allDay: boolean;
  description: string;
  end: ICalendarDate;
  start: ICalendarDate;
  worker_name?: string;
  position?: string;
  status?: string;
  region?: string;
  type?: 'job' | 'timeoff';
  // Job-specific fields
  jobId?: string;
  workerId?: string;
  client?: any;
  // Time-off specific fields
  timeOffId?: string;
  timeOffType?: string;
  timeOffStatus?: string;
  timeOffReason?: string;
};
