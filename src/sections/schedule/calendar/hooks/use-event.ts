import type { ICalendarJob, ICalendarRange } from 'src/types/calendar';

import dayjs from 'dayjs';
import { useMemo } from 'react';

import { JOB_COLOR_OPTIONS } from 'src/assets/data/job';

// ----------------------------------------------------------------------

export function useJob(
  jobs: ICalendarJob[],
  selectJobId: string,
  selectedRange: ICalendarRange,
  openForm: boolean
) {
  const currentJob = jobs.find((job) => job.id === selectJobId);

  const defaultValues: ICalendarJob = useMemo(
    () => ({
      id: '',
      title: '',
      description: '',
      color: JOB_COLOR_OPTIONS[0],
      allDay: false,
      start: selectedRange ? selectedRange.start : dayjs(new Date()).format(),
      end: selectedRange ? selectedRange.end : dayjs(new Date()).format(),
    }),
    [selectedRange]
  );

  if (!openForm) {
    return undefined;
  }

  if (currentJob || selectedRange) {
    return { ...defaultValues, ...currentJob };
  }

  return defaultValues;
}
