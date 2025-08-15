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
   { id: 'companyName', label: 'Company' },
   { id: 'startDate', label: 'Start Date' },
   { id: 'endDate', label: 'End Date' },
   { id: 'manager', label: 'Manager' },
   { id: 'duration', label: 'Duration' },
   { id: 'confirmedBy', label: 'Confirmed By' },
   { id: 'status', label: 'Status' },
   { id: '', width: 50 },
];