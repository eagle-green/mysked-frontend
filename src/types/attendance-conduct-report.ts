// ----------------------------------------------------------------------

export type IAttendanceConductReportTableFilters = {
  query: string;
  status: 'all' | 'active' | 'inactive';
  employee: Array<{ id: string; name: string }>;
  /** Score range (applies to current page) */
  scoreMin?: number;
  scoreMax?: number;
  /** Show only rows where these columns have value >= 1 (column id from Score through Unapprove Payout) */
  columnAtLeastOne?: string[];
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
  lateOnSite: number;
  vacationDayUnpaid: number;
  sickLeaveUnpaid: number;
  personalDayOffUnpaid: number;
  vacationDay10: number;
  sickLeave5: number;
  calledInSick: number;
  refusalOfShifts: number;
  unapprovedDaysOffShortNotice: number;
  unauthorizedDriving: number;
  drivingInfractions: number;
  unapprovePayoutWithoutDayOff: number;
  verbalWarningsWriteUp: number;
  status: string;
};
