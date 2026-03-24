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
  customerId: string;
  customerLogoUrl: string | null;
  siteName: string;
  siteDisplayAddress: string | null;
  siteUnitNumber: string | null;
  siteStreetNumber: string | null;
  siteStreetName: string | null;
  siteCity: string | null;
  siteProvince: string | null;
  sitePostalCode: string | null;
  siteCountry: string | null;
  date: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
  networkPoNumber: string;
  timeCardNumber: string;
  timesheetId: string;
  timesheetStatus: string | null;
  /** User who submitted the timesheet (or timesheet manager as fallback). Null for draft. */
  submittedBy?: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url?: string | null;
  } | null;
  timesheetUpdatedAt?: string | null;
  employee: string;
  employeeId: string;
  employeePhotoUrl: string | null;
  travelTime: number | null;
  /** Timesheet entry id (for travel approval dialog) */
  timesheetEntryId: string | null;
  /** True when worker submitted travel time and admin has not yet approved */
  travelTimePendingApproval: boolean;
  /** Travel minutes worker submitted (from travel_start/end or travel_*_minutes) */
  travelTimeSubmittedMinutes: number | null;
  /** Admin-approved travel minutes (null until approved) */
  travelTimeApprovedMinutes: number | null;
  /** Who approved travel time (for tooltip) */
  travelApprovedBy?: { first_name: string; last_name: string; photo_url?: string | null } | null;
  /** When travel time was approved */
  travelApprovedAt?: string | null;
  regularHours: number | null;
  overtime8To11: number | null;
  doubleTime11Plus: number | null;
  ns1Regular: number | null;
  ns1Overtime: number | null;
  ns1DoubleTime: number | null;
  ns2Regular: number | null;
  ns2Overtime: number | null;
  ns2DoubleTime: number | null;
  mob: number | null;
  sub: boolean | null;
  loa: boolean | null;
  emergencyCallout: boolean | null;
  cancelledAt: string | null;
  cancelledBy: { first_name: string; last_name: string; photo_url?: string | null } | null;
};
