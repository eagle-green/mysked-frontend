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
 