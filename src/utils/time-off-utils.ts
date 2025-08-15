import dayjs from 'dayjs';

// ----------------------------------------------------------------------

export type TimeOffRequest = {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  type: string;
};

export type JobAssignment = {
  id: string;
  job_number?: string;
  start_time?: string;
  end_time?: string;
  job_status?: string;
  worker_status?: string;
  // New format from getUserJobDates
  start_date?: string;
  end_date?: string;
  status?: string;
};

// ----------------------------------------------------------------------

/**
 * Generates an array of disabled dates from time-off requests and job assignments
 * @param timeOffRequests Array of time-off requests
 * @param jobAssignments Array of job assignments
 * @param excludeTimeOffId ID of time-off request to exclude (for editing)
 * @returns Array of dayjs objects representing disabled dates
 */
export function generateDisabledDates(
  timeOffRequests: TimeOffRequest[],
  jobAssignments: JobAssignment[] = [],
  excludeTimeOffId?: string
): dayjs.Dayjs[] {
  const disabledDates: dayjs.Dayjs[] = [];
  
  // Add time-off request dates
  timeOffRequests.forEach((request) => {
    // Skip the request being edited
    if (excludeTimeOffId && request.id === excludeTimeOffId) {
      return;
    }
    
    const startDate = dayjs(request.start_date);
    const endDate = dayjs(request.end_date);
    
    // Generate all dates between start and end (inclusive)
    let currentDate = startDate;
    while (currentDate.isSame(endDate) || currentDate.isBefore(endDate)) {
      disabledDates.push(currentDate);
      currentDate = currentDate.add(1, 'day');
    }
  });
  
  // Add job assignment dates
  jobAssignments.forEach((job) => {
    // Handle both old format (start_time/end_time) and new format (start_date/end_date)
    const workerStatus = job.worker_status || job.status;
    const startTime = job.start_time || job.start_date;
    const endTime = job.end_time || job.end_date;
    
    // Only include pending and accepted jobs (rejected jobs shouldn't block time-off requests)
    if (workerStatus === 'pending' || workerStatus === 'accepted') {
      const startDate = dayjs(startTime);
      const endDate = dayjs(endTime);
      
      // Generate all dates between start and end (inclusive)
      let currentDate = startDate;
      while (currentDate.isSame(endDate) || currentDate.isBefore(endDate)) {
        disabledDates.push(currentDate);
        currentDate = currentDate.add(1, 'day');
      }
    }
  });
  
  return disabledDates;
}

/**
 * Checks if a specific date is disabled based on time-off requests and job assignments
 * @param date Date to check
 * @param timeOffRequests Array of time-off requests
 * @param jobAssignments Array of job assignments
 * @param excludeTimeOffId ID of time-off request to exclude (for editing)
 * @returns True if date should be disabled
 */
export function isDateDisabled(
  date: dayjs.Dayjs,
  timeOffRequests: TimeOffRequest[],
  jobAssignments: JobAssignment[] = [],
  excludeTimeOffId?: string
): boolean {
  // Check time-off requests
  const hasTimeOffConflict = timeOffRequests.some((request) => {
    // Skip the request being edited
    if (excludeTimeOffId && request.id === excludeTimeOffId) {
      return false;
    }
    
    const startDate = dayjs(request.start_date);
    const endDate = dayjs(request.end_date);
    
    return (date.isSame(startDate) || date.isAfter(startDate)) && (date.isSame(endDate) || date.isBefore(endDate));
  });
  
  if (hasTimeOffConflict) return true;
  
  // Check job assignments
  return jobAssignments.some((job) => {
    // Handle both old format (start_time/end_time) and new format (start_date/end_date)
    const workerStatus = job.worker_status || job.status;
    const startTime = job.start_time || job.start_date;
    const endTime = job.end_time || job.end_date;
    
    // Only include pending and accepted jobs (rejected jobs shouldn't block time-off requests)
    if (workerStatus === 'pending' || workerStatus === 'accepted') {
      const startDate = dayjs(startTime);
      const endDate = dayjs(endTime);
      
      return (date.isSame(startDate) || date.isAfter(startDate)) && (date.isSame(endDate) || date.isBefore(endDate));
    }
    return false;
  });
} 
 
/**
 * Checks if two time-off requests have overlapping dates
 * @param request1 First time-off request
 * @param request2 Second time-off request
 * @returns True if there's an overlap
 */
export function hasTimeOffOverlap(request1: TimeOffRequest, request2: TimeOffRequest): boolean {
  const start1 = dayjs(request1.start_date);
  const end1 = dayjs(request1.end_date);
  const start2 = dayjs(request2.start_date);
  const end2 = dayjs(request2.end_date);

  // Check if there's any overlap
  return start1.isBefore(end2) && start2.isBefore(end1);
}

/**
 * Calculates the overlap percentage between two time-off requests
 * @param request1 First time-off request
 * @param request2 Second time-off request
 * @returns Overlap percentage (0-100)
 */
export function calculateTimeOffOverlapPercentage(request1: TimeOffRequest, request2: TimeOffRequest): number {
  if (!hasTimeOffOverlap(request1, request2)) {
    return 0;
  }

  const start1 = dayjs(request1.start_date);
  const end1 = dayjs(request1.end_date);
  const start2 = dayjs(request2.start_date);
  const end2 = dayjs(request2.end_date);

  // Calculate the overlap period
  const overlapStart = start1.isAfter(start2) ? start1 : start2;
  const overlapEnd = end1.isBefore(end2) ? end1 : end2;
  
  // Calculate overlap duration in days
  const overlapDays = overlapEnd.diff(overlapStart, 'day') + 1;
  
  // Calculate total duration of the shorter request
  const duration1 = end1.diff(start1, 'day') + 1;
  const duration2 = end2.diff(start2, 'day') + 1;
  const shorterDuration = Math.min(duration1, duration2);
  
  // Calculate overlap percentage
  return (overlapDays / shorterDuration) * 100;
}

/**
 * Enhanced conflict checking that includes role-based overlap rules
 * @param newRequest New time-off request being created/updated
 * @param sameRoleRequests Array of time-off requests from users with the same role
 * @param currentUserRequests Array of current user's existing time-off requests
 * @param userRole User's role (e.g., 'lct', 'tcp', 'lct/tcp', 'field_supervisor', etc.)
 * @param excludeId ID of request to exclude (for updates)
 * @returns Object with conflict information
 */
export function checkTimeOffConflicts(
  newRequest: TimeOffRequest,
  sameRoleRequests: TimeOffRequest[],
  currentUserRequests: TimeOffRequest[],
  userRole: string,
  excludeId?: string
): { hasConflict: boolean; conflictDetails?: string; overlapPercentage?: number } {
  // Check for overlaps within the same role (10% rule applies)
  const hasSameRoleOverlap = sameRoleRequests.some(request => {
    if (hasTimeOffOverlap(newRequest, request)) {
      const overlapPercentage = calculateTimeOffOverlapPercentage(newRequest, request);
      if (overlapPercentage > 10) {
        return true; // Conflict if overlap > 10% within same role
      }
    }
    return false; // No conflict if overlap <= 10%
  });

  // Check for overlaps with current user's own requests (no overlap allowed)
  const hasSelfOverlap = currentUserRequests.some(request => {
    if (request.id === excludeId) return false;
    return hasTimeOffOverlap(newRequest, request);
  });

  if (hasSameRoleOverlap) {
    // Find the conflicting request to get overlap percentage
    for (const request of sameRoleRequests) {
      if (hasTimeOffOverlap(newRequest, request)) {
        const overlapPercentage = calculateTimeOffOverlapPercentage(newRequest, request);
        if (overlapPercentage > 10) {
          return {
            hasConflict: true,
            conflictDetails: `You can only have up to 10% overlap with other ${userRole.toUpperCase()} employees' time-off requests. Current overlap: ${overlapPercentage.toFixed(1)}%`,
            overlapPercentage
          };
        }
      }
    }
  }

  if (hasSelfOverlap) {
    return {
      hasConflict: true,
      conflictDetails: 'You already have a time-off request for this date range'
    };
  }

  return { hasConflict: false };
} 
 