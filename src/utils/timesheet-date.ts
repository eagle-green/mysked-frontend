import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

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
      // Parse the datetime string and convert to Vancouver timezone, then get the date
      const vancouverDate = dayjs.tz(trimmed, VANCOUVER_TZ);
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

