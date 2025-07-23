// Digital Timecard Type Definitions

export interface TimecardEntry {
  id: string;
  jobId: string;
  workerId: string;
  timesheetManagerId: string;
  date: string;
  
  // Time fields
  travelStart?: string;
  travelEnd?: string;
  shiftStart?: string;
  shiftEnd?: string;
  breakStart?: string;
  breakEnd?: string;
  
  // Distance fields (in kilometers)
  travelToKm?: number;
  travelDuringKm?: number;
  travelFromKm?: number;
  
  // Time fields (in hours)
  setupTimeHrs?: number;
  packupTimeHrs?: number;
  
  // Calculated fields
  shiftTotalHrs?: number;
  travelTotalHrs?: number;
  
  // Signatures
  workerSignature?: string;
  clientSignature?: string;
  
  // Status and metadata
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimesheetManager {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export interface TimecardFormData {
  travelStart?: string;
  travelEnd?: string;
  shiftStart?: string;
  shiftEnd?: string;
  breakStart?: string;
  breakEnd?: string;
  travelToKm?: number;
  travelDuringKm?: number;
  travelFromKm?: number;
  setupTimeHrs?: number;
  packupTimeHrs?: number;
}

export interface TimecardValidationErrors {
  travelStart?: string;
  travelEnd?: string;
  shiftStart?: string;
  shiftEnd?: string;
  breakStart?: string;
  breakEnd?: string;
  travelToKm?: string;
  travelDuringKm?: string;
  travelFromKm?: string;
  setupTimeHrs?: string;
  packupTimeHrs?: string;
}

export interface TimecardApiResponse {
  success: boolean;
  data?: TimecardEntry;
  error?: string;
  errors?: TimecardValidationErrors;
}
