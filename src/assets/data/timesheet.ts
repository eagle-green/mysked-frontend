export const TIMESHEET_STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export const TIMESHEET_TABLE_HEADER = [
  { id: 'jobNumber', label: 'Job #', width: 100 },
  { id: 'siteName', label: 'Site Name' },
  { id: 'clientName', label: 'Client' },
  { id: 'companyName', label: 'Customer' },
  { id: 'date', label: 'Date' },
  { id: 'timesheetManager', label: 'Timesheet Manager' },
  { id: 'status', label: 'Status' },
  { id: 'confirmedBy', label: 'Confirmed By' },
  { id: '', width: 50 },
];
