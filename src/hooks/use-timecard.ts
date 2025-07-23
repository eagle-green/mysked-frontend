import { useState, useCallback } from 'react';
import type { TimecardEntry, TimecardFormData, TimecardValidationErrors } from '../types/timecard';

interface UseTimecardOptions {
  onSuccess?: (timecard: TimecardEntry) => void;
  onError?: (error: string) => void;
}

export function useTimecard(options: UseTimecardOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<TimecardValidationErrors>({});

  const validateTimecard = useCallback((data: TimecardFormData): TimecardValidationErrors => {
    const errors: TimecardValidationErrors = {};

    // Basic time validation
    if (data.shiftStart && data.shiftEnd && data.shiftStart >= data.shiftEnd) {
      errors.shiftEnd = 'Shift end time must be after start time';
    }

    if (data.breakStart && data.breakEnd && data.breakStart >= data.breakEnd) {
      errors.breakEnd = 'Break end time must be after start time';
    }

    if (data.travelStart && data.travelEnd && data.travelStart >= data.travelEnd) {
      errors.travelEnd = 'Travel end time must be after start time';
    }

    // Validate numeric fields
    if (data.travelToKm !== undefined && data.travelToKm < 0) {
      errors.travelToKm = 'Travel distance cannot be negative';
    }

    if (data.setupTimeHrs !== undefined && data.setupTimeHrs < 0) {
      errors.setupTimeHrs = 'Setup time cannot be negative';
    }

    if (data.packupTimeHrs !== undefined && data.packupTimeHrs < 0) {
      errors.packupTimeHrs = 'Pack-up time cannot be negative';
    }

    return errors;
  }, []);

  const calculateTotals = useCallback((data: TimecardFormData) => {
    const totals = {
      shiftTotalHrs: 0,
      travelTotalHrs: 0,
    };

    // Calculate shift total (excluding break time)
    if (data.shiftStart && data.shiftEnd) {
      const start = new Date(`1970-01-01T${data.shiftStart}`);
      const end = new Date(`1970-01-01T${data.shiftEnd}`);
      let shiftMs = end.getTime() - start.getTime();

      // Subtract break time if provided
      if (data.breakStart && data.breakEnd) {
        const breakStart = new Date(`1970-01-01T${data.breakStart}`);
        const breakEnd = new Date(`1970-01-01T${data.breakEnd}`);
        const breakMs = breakEnd.getTime() - breakStart.getTime();
        shiftMs -= breakMs;
      }

      totals.shiftTotalHrs = Math.round((shiftMs / (1000 * 60 * 60)) * 100) / 100;
    }

    // Calculate travel total
    if (data.travelStart && data.travelEnd) {
      const start = new Date(`1970-01-01T${data.travelStart}`);
      const end = new Date(`1970-01-01T${data.travelEnd}`);
      const travelMs = end.getTime() - start.getTime();
      totals.travelTotalHrs = Math.round((travelMs / (1000 * 60 * 60)) * 100) / 100;
    }

    return totals;
  }, []);

  const submitTimecard = useCallback(async (data: TimecardFormData, jobId: string) => {
    setIsLoading(true);
    setError(null);
    setValidationErrors({});

    try {
      // Validate data
      const errors = validateTimecard(data);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setIsLoading(false);
        return;
      }

      // Calculate totals
      const totals = calculateTotals(data);

      // TODO: Replace with actual API call
      const response = await fetch('/api/timecards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          ...totals,
          jobId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit timecard');
      }

      const result = await response.json();
      options.onSuccess?.(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      options.onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [validateTimecard, calculateTotals, options]);

  return {
    isLoading,
    error,
    validationErrors,
    validateTimecard,
    calculateTotals,
    submitTimecard,
  };
}
