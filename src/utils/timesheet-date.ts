import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const hasUtcOffset =
  (s: string) => s.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(s);

type TimesheetDateInput = string | Date | Dayjs | null | undefined;

const VANCOUVER_TZ = 'America/Vancouver';

function extractDateString(input: TimesheetDateInput): string | null {
  if (!input) return null;

  if (dayjs.isDayjs(input)) {
    const formatted = input.tz(VANCOUVER_TZ).format('YYYY-MM-DD');
    return formatted || null;
  }

  if (input instanceof Date) {
    const formatted = dayjs(input).tz(VANCOUVER_TZ).format('YYYY-MM-DD');
    return formatted || null;
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return null;
    
    // If the string contains a time component, convert to Vancouver timezone first
    // then extract the date part to get the correct local date
    if (trimmed.includes('T') || trimmed.includes(' ')) {
      // ISO with Z/offset = absolute instant → convert to Vancouver calendar date (matches invoice line items)
      const vancouverDate = hasUtcOffset(trimmed)
        ? dayjs.utc(trimmed).tz(VANCOUVER_TZ)
        : dayjs.tz(trimmed, VANCOUVER_TZ);
      if (vancouverDate.isValid()) {
        return vancouverDate.format('YYYY-MM-DD');
      }
    }
    
    // If it's just a date string (YYYY-MM-DD), use it as-is
    return trimmed.split('T')[0];
  }

  return null;
}

export function getTimesheetDateInVancouver(input: TimesheetDateInput): Dayjs {
  const dateString = extractDateString(input);

  if (!dateString) {
    return dayjs().tz(VANCOUVER_TZ);
  }

  return dayjs.tz(dateString, VANCOUVER_TZ);
}

/**
 * Calendar date of job start in Pacific, same logic as invoice items (overnight jobs use start day, not end).
 */
export function getJobStartCalendarDatePacific(
  jobStartTime: string | Date | null | undefined
): string | null {
  if (jobStartTime == null || jobStartTime === '') return null;
  const d = jobStartTime instanceof Date ? jobStartTime : new Date(jobStartTime);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-CA', { timeZone: VANCOUVER_TZ });
}

