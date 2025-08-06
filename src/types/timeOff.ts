export interface TimeOffRequest {
  id: string;
  user_id: string;
  type: TimeOffType;
  start_date: string;
  end_date: string;
  reason: string;
  status: TimeOffStatus;
  admin_notes?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  // Joined fields from users table
  first_name?: string;
  last_name?: string;
  email?: string;
}

export type TimeOffType = 'vacation' | 'day_off' | 'sick_leave' | 'personal_leave';

export type TimeOffStatus = 'pending' | 'approved' | 'rejected';

export interface CreateTimeOffRequestData {
  type: TimeOffType;
  start_date: string;
  end_date: string;
  reason: string;
}

export interface UpdateTimeOffRequestData {
  type?: TimeOffType;
  start_date?: string;
  end_date?: string;
  reason?: string;
}

export interface TimeOffRequestFilters {
  status?: TimeOffStatus;
  type?: TimeOffType;
  user_id?: string;
}

export const TIME_OFF_TYPES: { value: TimeOffType; label: string; color: string }[] = [
  { value: 'vacation', label: 'Vacation', color: '#2196F3' },
  { value: 'day_off', label: 'Day Off', color: '#4CAF50' },
  { value: 'sick_leave', label: 'Sick Leave', color: '#F44336' },
  { value: 'personal_leave', label: 'Personal Leave', color: '#9C27B0' },
];

export const TIME_OFF_STATUSES: { value: TimeOffStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: '#FF9800' },
  { value: 'approved', label: 'Approved', color: '#4CAF50' },
  { value: 'rejected', label: 'Rejected', color: '#F44336' },
];