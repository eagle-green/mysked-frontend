import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

// Interface for schedule conflict data
export interface ScheduleConflict {
  user_id: string;
  name: string;
  job_id: string;
  job_number: number;
  scheduled_start_time: Date;
  scheduled_end_time: Date;
  worker_start_time: Date;
  worker_end_time: Date;
  status: string;
  site_name?: string;
  client_name?: string;
  conflict_type: 'direct_overlap' | 'insufficient_gap' | 'gap_violation';
  gap_hours: number;
  can_assign_with_actual_end_time: boolean;
  required_actual_end_time?: Date | null;
}

// Interface for conflict summary
export interface ConflictSummary {
  hasConflicts: boolean;
  directOverlaps: ScheduleConflict[];
  gapViolations: ScheduleConflict[];
  totalConflicts: number;
}

// Interface for gap calculation result
export interface GapCalculation {
  hasGapViolation: boolean;
  gapHours: number;
  canResolveWithEarlyFinish: boolean;
  requiredEarlyFinishTime?: dayjs.Dayjs;
  conflictDescription: string;
}

/**
 * Calculate the gap between two time periods
 * @param start1 Start time of first period
 * @param end1 End time of first period
 * @param start2 Start time of second period
 * @param end2 End time of second period
 * @returns Gap in hours (positive if there's a gap, negative if overlapping)
 */
export function calculateGapBetweenShifts(
  start1: dayjs.Dayjs | Date | string,
  end1: dayjs.Dayjs | Date | string,
  start2: dayjs.Dayjs | Date | string,
  end2: dayjs.Dayjs | Date | string
): number {
  const period1Start = dayjs(start1);
  const period1End = dayjs(end1);
  const period2Start = dayjs(start2);
  const period2End = dayjs(end2);

  // Check for overlap first
  if (period1Start.isBefore(period2End) && period1End.isAfter(period2Start)) {
    // Overlapping - return negative gap
    const overlapStart = period1Start.isAfter(period2Start) ? period1Start : period2Start;
    const overlapEnd = period1End.isBefore(period2End) ? period1End : period2End;
    return -overlapEnd.diff(overlapStart, 'hour', true);
  }

  // Calculate gap between periods
  let gap: number;
  if (period1End.isSameOrBefore(period2Start)) {
    // Period 1 ends before period 2 starts
    gap = period2Start.diff(period1End, 'hour', true);
  } else {
    // Period 2 ends before period 1 starts
    gap = period1Start.diff(period2End, 'hour', true);
  }

  return gap;
}

/**
 * Check if there's an 8-hour gap violation between a new job and existing schedule
 * @param newJobStart Start time of new job
 * @param newJobEnd End time of new job
 * @param existingStart Start time of existing job
 * @param existingEnd End time of existing job
 * @returns Gap calculation result
 */
export function checkEightHourGap(
  newJobStart: dayjs.Dayjs | Date | string,
  newJobEnd: dayjs.Dayjs | Date | string,
  existingStart: dayjs.Dayjs | Date | string,
  existingEnd: dayjs.Dayjs | Date | string
): GapCalculation {
  const newStart = dayjs(newJobStart);
  const newEnd = dayjs(newJobEnd);
  const existingStartTime = dayjs(existingStart);
  const existingEndTime = dayjs(existingEnd);

  const gap = calculateGapBetweenShifts(existingStartTime, existingEndTime, newStart, newEnd);
  const hasGapViolation = gap >= 0 && gap < 8; // No overlap but less than 8 hours gap
  
  let canResolveWithEarlyFinish = false;
  let requiredEarlyFinishTime: dayjs.Dayjs | undefined;
  let conflictDescription = '';

  if (hasGapViolation) {
    if (existingEndTime.isSameOrBefore(newStart)) {
      // Existing job ends before new job starts
      const requiredGap = 8;
      requiredEarlyFinishTime = newStart.subtract(requiredGap, 'hour');
      canResolveWithEarlyFinish = requiredEarlyFinishTime.isSameOrAfter(existingStartTime);
      
      conflictDescription = canResolveWithEarlyFinish 
        ? `Only ${gap.toFixed(1)} hours between shifts. Worker needs to finish by ${requiredEarlyFinishTime.format('h:mm A')} to maintain 8-hour gap.`
        : `Only ${gap.toFixed(1)} hours between shifts. Cannot maintain 8-hour gap even with early finish.`;
    } else {
      // New job ends before existing job starts
      conflictDescription = `Only ${gap.toFixed(1)} hours between shifts. 8-hour gap required between consecutive shifts.`;
      canResolveWithEarlyFinish = false;
    }
  } else if (gap < 0) {
    conflictDescription = 'Shifts overlap directly. Worker cannot be assigned to both.';
  } else {
    conflictDescription = `${gap.toFixed(1)} hours between shifts. Adequate gap maintained.`;
  }

  return {
    hasGapViolation,
    gapHours: gap,
    canResolveWithEarlyFinish,
    requiredEarlyFinishTime,
    conflictDescription,
  };
}

/**
 * Analyze schedule conflicts for a worker
 * @param conflicts Array of schedule conflicts from API
 * @returns Conflict summary
 */
export function analyzeScheduleConflicts(conflicts: ScheduleConflict[]): ConflictSummary {
  const directOverlaps = conflicts.filter(c => c.conflict_type === 'direct_overlap');
  const gapViolations = conflicts.filter(c => c.conflict_type === 'insufficient_gap' || c.conflict_type === 'gap_violation');

  return {
    hasConflicts: conflicts.length > 0,
    directOverlaps,
    gapViolations,
    totalConflicts: conflicts.length,
  };
}

/**
 * Generate human-readable conflict messages
 * @param conflict Schedule conflict data
 * @returns Array of descriptive messages
 */
export function generateConflictMessages(conflict: ScheduleConflict): string[] {
  const messages: string[] = [];
  const workerStartTime = dayjs(conflict.worker_start_time);
  const workerEndTime = dayjs(conflict.worker_end_time);

  // Basic conflict info
  const jobInfo = `Job #${conflict.job_number}${conflict.site_name ? ` at ${conflict.site_name}` : ''}${conflict.client_name ? ` (${conflict.client_name})` : ''}`;
  const timeInfo = `${workerStartTime.format('MMM D, YYYY h:mm A')} - ${workerEndTime.format('MMM D, h:mm A')}`;
  
  messages.push(`${conflict.name} is scheduled for ${jobInfo}`);
  messages.push(`Time: ${timeInfo}`);

  if (conflict.conflict_type === 'direct_overlap') {
    messages.push('⚠️ This shift directly overlaps with the new assignment');
  } else if (conflict.conflict_type === 'insufficient_gap') {
    // Gap violation message is shown separately in the dialog, so we don't duplicate it here
    
    if (conflict.can_assign_with_actual_end_time && conflict.required_actual_end_time) {
      const requiredEndTime = dayjs(conflict.required_actual_end_time);
      messages.push(`💡 Worker could finish by ${requiredEndTime.format('h:mm A')} to maintain 8-hour gap`);
    }
  }

  return messages;
}

/**
 * Check if a worker can be assigned considering all their existing schedules
 * @param workerId Worker ID to check
 * @param newJobStart New job start time
 * @param newJobEnd New job end time
 * @param existingSchedules Array of worker's existing schedule conflicts
 * @returns Whether assignment is possible and any warnings
 */
export function canAssignWorker(
  workerId: string,
  newJobStart: dayjs.Dayjs | Date | string,
  newJobEnd: dayjs.Dayjs | Date | string,
  existingSchedules: ScheduleConflict[]
): {
  canAssign: boolean;
  hasWarnings: boolean;
  conflicts: ScheduleConflict[];
  warnings: string[];
} {
  const workerConflicts = existingSchedules.filter(s => s.user_id === workerId);
  const conflictSummary = analyzeScheduleConflicts(workerConflicts);

  const warnings: string[] = [];
  let canAssign = true;

  // Check direct overlaps - these prevent assignment
  if (conflictSummary.directOverlaps.length > 0) {
    canAssign = false;
    warnings.push(`Worker has ${conflictSummary.directOverlaps.length} direct schedule conflict(s)`);
  }

  // Check gap violations - these are warnings but might be resolvable
  if (conflictSummary.gapViolations.length > 0) {
    const resolvableViolations = conflictSummary.gapViolations.filter(v => v.can_assign_with_actual_end_time);
    
    if (resolvableViolations.length > 0) {
      warnings.push(`Worker has ${resolvableViolations.length} gap violation(s) that could be resolved with early finish`);
    }
    
    const unresolvableViolations = conflictSummary.gapViolations.filter(v => !v.can_assign_with_actual_end_time);
    if (unresolvableViolations.length > 0) {
      warnings.push(`Worker has ${unresolvableViolations.length} unresolvable gap violation(s)`);
    }
  }

  return {
    canAssign,
    hasWarnings: warnings.length > 0,
    conflicts: workerConflicts,
    warnings,
  };
}

/**
 * Format time for display in conflict messages
 * @param time Time to format
 * @param includeDate Whether to include date
 * @returns Formatted time string
 */
export function formatConflictTime(time: dayjs.Dayjs | Date | string, includeDate = false): string {
  const dt = dayjs(time);
  return includeDate ? dt.format('MMM D, YYYY h:mm A') : dt.format('h:mm A');
}

/**
 * Calculate the earliest time a worker can start a new shift given their existing schedule
 * @param existingSchedules Worker's existing schedules
 * @param proposedStartTime Proposed start time for new job
 * @returns Earliest possible start time with 8-hour gap
 */
export function calculateEarliestAvailableTime(
  existingSchedules: ScheduleConflict[],
  proposedStartTime: dayjs.Dayjs | Date | string
): dayjs.Dayjs | null {
  const proposedStart = dayjs(proposedStartTime);
  let earliestTime = proposedStart;

  for (const schedule of existingSchedules) {
    const existingEnd = dayjs(schedule.worker_end_time);
    
    // If existing job ends after proposed start, calculate minimum start time
    if (existingEnd.isAfter(proposedStart)) {
      const minStartTime = existingEnd.add(8, 'hour');
      if (minStartTime.isAfter(earliestTime)) {
        earliestTime = minStartTime;
      }
    }
  }

  return earliestTime.isAfter(proposedStart) ? earliestTime : null;
}
