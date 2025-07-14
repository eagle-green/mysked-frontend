import type { ICalendarJob, ICalendarRange } from 'src/types/calendar';

import dayjs from 'dayjs';
import { useMemo } from 'react';

import { CALENDAR_COLOR_OPTIONS } from 'src/_mock/_calendar';

// ----------------------------------------------------------------------

export function useEvent(
  events: ICalendarJob[],
  selectedEventId: string,
  selectedRange: ICalendarRange,
  openForm: boolean
): ICalendarJob | undefined {
  const currentEvent = events.find((event) => event.id === selectedEventId);

  const defaultValues: ICalendarJob = useMemo(
    () => ({
      id: '',
      title: '',
      description: '',
      color: CALENDAR_COLOR_OPTIONS[1],
      allDay: false,
      start: selectedRange ? selectedRange.start : dayjs(new Date()).format(),
      end: selectedRange ? selectedRange.end : dayjs(new Date()).format(),
    }),
    [selectedRange]
  );

  if (!openForm) {
    return undefined;
  }

  if (currentEvent || selectedRange) {
    return { ...defaultValues, ...currentEvent };
  }

  return defaultValues;
}
