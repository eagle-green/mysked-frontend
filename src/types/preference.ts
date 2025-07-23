export interface IPreference {
  id: string;
  preference_type: 'preferred' | 'not_preferred';
  is_mandatory?: boolean;
  reason?: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url?: string;
  };
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url?: string;
  };
}

export interface IEmployeePreferences {
  company: {
    type: 'preferred' | 'not_preferred';
    isMandatory: boolean;
    reason?: string;
  } | null;
  site: {
    type: 'preferred' | 'not_preferred';
    isMandatory: boolean;
    reason?: string;
  } | null;
  client: {
    type: 'preferred' | 'not_preferred';
    isMandatory: boolean;
    reason?: string;
  } | null;
}

export interface IEmployeeMetadata {
  preferences: IEmployeePreferences;
  hasMandatoryNotPreferred: boolean;
  hasNotPreferred: boolean;
  hasPreferred: boolean;
  preferredCount: number;
  preferenceIndicators: [boolean, boolean, boolean]; // [Company, Site, Client]
  sortPriority: number;
  backgroundColor?: 'success' | 'warning' | 'error' | 'default';
}

export interface IEnhancedEmployee {
  label: string;
  value: string;
  role: string;
  photo_url: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  // Preference metadata
  preferences: IEmployeePreferences;
  hasMandatoryNotPreferred: boolean;
  hasNotPreferred: boolean;
  hasPreferred: boolean;
  preferredCount: number;
  preferenceIndicators: [boolean, boolean, boolean];
  // Schedule conflict metadata
  hasScheduleConflict: boolean;
  conflictInfo?: {
    user_id: string;
    name: string;
    job_id: string;
    job_number: string;
    start_time: string;
    end_time: string;
    status: string;
  } | null;
  // User preference conflict metadata
  userPreferenceConflicts?: Array<{
    id: string;
    user_id: string;
    employee_id: string;
    preference_type: 'preferred' | 'not_preferred';
    reason: string;
    is_mandatory: boolean;
    employee?: {
      id: string;
      first_name: string;
      last_name: string;
      display_name: string;
      photo_url: string;
    };
  }>;
  hasMandatoryUserConflict: boolean;
  hasRegularUserConflict: boolean;
  sortPriority: number;
  backgroundColor?: 'success' | 'warning' | 'error' | 'default';
}

export interface IWorkerWarningDialog {
  open: boolean;
  employee: {
    name: string;
    id: string;
    photo_url?: string;
  };
  warningType: 'not_preferred' | 'mandatory_not_preferred' | 'worker_conflict' | 'schedule_conflict';
  reasons: string[];
  isMandatory: boolean;
  canProceed: boolean;
  workerFieldNames?: Record<string, string>;
}

export interface IPreferenceCircleProps {
  indicators: [boolean, boolean, boolean]; // [Company, Site, Client]
  size?: 'small' | 'medium';
} 