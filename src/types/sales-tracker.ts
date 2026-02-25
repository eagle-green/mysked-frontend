import type { IDatePickerControl } from './common';

// ----------------------------------------------------------------------

export const SALES_TRACKER_SERVICE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'tcp', label: 'TCP' },
  { value: 'lct', label: 'LCT' },
  { value: 'hwy', label: 'HWY' },
  { value: 'field_supervisor', label: 'Field Supervisor' },
] as const;

export type SalesTrackerServiceValue = (typeof SALES_TRACKER_SERVICE_OPTIONS)[number]['value'];

export type ISalesTrackerTableFilters = {
  query: string;
  service: SalesTrackerServiceValue;
  customer: Array<{ id: string; name: string }>;
  employee: Array<{ id: string; name: string }>;
  startDate: IDatePickerControl;
  endDate: IDatePickerControl;
};

export type ISalesTrackerRow = {
  id: string;
  service: string;
  customer: string;
  date: string | null;
  networkPoNumber: string;
  timeCardNumber: string;
  timesheetStatus: string | null;
  employee: string;
  travelTime: number | null;
  regularHours: number | null;
  overtime8To11: number | null;
  doubleTime11Plus: number | null;
  lateNight: number | null;
  nightShiftRegular: number | null;
  nightShiftOvertime: number | null;
  nightShiftDoubleTime: number | null;
  mob: number | null;
  sub: number | null;
  loa: number | null;
  emergencyCallout: number | null;
};
