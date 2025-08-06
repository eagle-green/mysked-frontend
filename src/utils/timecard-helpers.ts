/**
 * Utility functions for timecard calculations and formatting
 */

import { provinceList } from "src/assets/data/assets";

// Format time from 24-hour to 12-hour format
export function formatTime12Hour(time24: string): string {
  if (!time24) return '';
  
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Format duration in hours to HH:MM format
export function formatDuration(hours: number): string {
  if (!hours || hours < 0) return '0:00';
  
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  return `${wholeHours}:${minutes.toString().padStart(2, '0')}`;
}

// Calculate time difference in hours
export function calculateTimeDifference(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  
  const diffMs = end.getTime() - start.getTime();
  return diffMs / (1000 * 60 * 60); // Convert to hours
}

// Validate time format (HH:MM)
export function isValidTimeFormat(time: string): boolean {
  if (!time) return false;
  
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

// Get current time in HH:MM format
export function getCurrentTime(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Round time to nearest 15 minutes
export function roundToQuarterHour(time: string): string {
  if (!time) return '';
  
  const [hours, minutes] = time.split(':').map(Number);
  const roundedMinutes = Math.round(minutes / 15) * 15;
  
  let finalHours = hours;
  let finalMinutes = roundedMinutes;
  
  if (finalMinutes >= 60) {
    finalHours += 1;
    finalMinutes = 0;
  }
  
  return `${finalHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
}

// Calculate overtime hours (over 8 hours)
export function calculateOvertime(totalHours: number): number {
  return Math.max(0, totalHours - 8);
}

// Format distance with units
export function formatDistance(km: number): string {
  if (!km || km < 0) return '0 km';
  return `${km.toFixed(1)} km`;
}

// Validate positive number
export function isPositiveNumber(value: any): boolean {
  const num = Number(value);
  return !isNaN(num) && num >= 0;
}

// String lookup
export function findInString(lookup: string, value?: string | number) {

  if (typeof value === 'number') {
    return String(value).toLowerCase().includes(lookup);
  }
  return value?.toLowerCase().includes(lookup);
}

// Helper to build full address from site fields
export function getFullAddress(site: any) {
  if (site.display_address) return site.display_address;
  // Build the address string from fields
  let addr = [
    site.unit_number,
    site.street_number,
    site.street_name,
    site.city,
    site.province,
    site.postal_code,
    site.country,
  ]
    .filter(Boolean)
    .join(', ');
  // Replace province name with code
  provinceList.forEach(({ value, code }) => {
    addr = addr.replace(value, code);
  });
  return addr;
}

// Override this method in production mode
export function isDevMode() {
  return true;
}

