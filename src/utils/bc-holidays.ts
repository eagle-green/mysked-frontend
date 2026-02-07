import dayjs from 'dayjs';

/**
 * BC (British Columbia) statutory holidays as FullCalendar-compatible events.
 * Used to display holidays on work and schedule calendars.
 */

/** Anonymous Gregorian algorithm: Easter Sunday for given year (UTC date). */
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** BC statutory holiday definition for one year. */
function getBCHolidaysForYear(year: number): Array<{ title: string; date: string }> {
  const easter = getEasterSunday(year);
  const goodFriday = dayjs(easter).subtract(2, 'day').format('YYYY-MM-DD');

  const nthMonday = (month: number, n: number): string => {
    let d = dayjs(`${year}-${month}-01`);
    let count = 0;
    while (d.month() === month - 1) {
      if (d.day() === 1) {
        count += 1;
        if (count === n) return d.format('YYYY-MM-DD');
      }
      d = d.add(1, 'day');
    }
    return '';
  };

  const mondayOnOrBefore = (month: number, day: number): string => {
    let d = dayjs(`${year}-${month}-${day}`);
    while (d.day() !== 1) d = d.subtract(1, 'day');
    return d.format('YYYY-MM-DD');
  };

  return [
    { title: "New Year's Day", date: `${year}-01-01` },
    { title: 'Family Day', date: nthMonday(2, 3) },
    { title: 'Good Friday', date: goodFriday },
    { title: 'Victoria Day', date: mondayOnOrBefore(5, 24) },
    { title: 'Canada Day', date: `${year}-07-01` },
    { title: 'B.C. Day', date: nthMonday(8, 1) },
    { title: 'Labour Day', date: nthMonday(9, 1) },
    { title: 'National Day for Truth and Reconciliation', date: `${year}-09-30` },
    { title: 'Thanksgiving', date: nthMonday(10, 2) },
    { title: 'Remembrance Day', date: `${year}-11-11` },
    { title: 'Christmas Day', date: `${year}-12-25` },
    { title: 'Boxing Day', date: `${year}-12-26` },
  ];
}

export type BCHolidayEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  display: 'background';
  backgroundColor: string;
  editable: false;
  extendedProps: { type: 'bc-holiday' };
};

/**
 * Returns BC statutory holidays as FullCalendar events (background, non-editable).
 * No cell background — holiday text only (bold styling applied in calendar views).
 */
export function getBCHolidayEvents(startYear: number, endYear: number): BCHolidayEvent[] {
  const events: BCHolidayEvent[] = [];
  for (let y = startYear; y <= endYear; y += 1) {
    const holidays = getBCHolidaysForYear(y);
    for (const h of holidays) {
      if (!h.date) continue;
      events.push({
        id: `bc-holiday-${h.date}`,
        title: h.title,
        start: h.date,
        end: h.date,
        allDay: true,
        display: 'background',
        backgroundColor: 'transparent',
        editable: false,
        extendedProps: { type: 'bc-holiday' },
      });
    }
  }
  return events;
}

/** Default year range for calendar (current year ± 1). */
export function getBCHolidayEventsForCalendar(): BCHolidayEvent[] {
  const year = dayjs().year();
  return getBCHolidayEvents(year - 1, year + 2);
}
