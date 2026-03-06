// ----------------------------------------------------------------------

export type IAttendanceConductReportTableFilters = {
  query: string;
  status: 'all' | 'active' | 'inactive';
  employee: Array<{ id: string; name: string }>;
};

export type IAttendanceConductReportRow = {
  id: string;
  employee: string;
  photo_url?: string | null;
  position: string;
  score: number | null;
  noShowUnpaid: number;
  sentHomeNoPpe: number;
  leftEarlyNoNotice: number;
  vacationDayUnpaid: number;
  sickLeaveUnpaid: number;
  personalDayOffUnpaid: number;
  vacationDay10: number;
  refusalOfShifts: number;
  unauthorizedDriving: number;
  unapprovePayoutWithoutDayOff: number;
  unapprovedDaysOffShortNotice: number;
  drivingInfractions: number;
  sickLeave5: number;
  verbalWarningsWriteUp: number;
  status: string;
};
