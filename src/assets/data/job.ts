import { info, success } from 'src/theme/core';

// ----------------------------------------------------------------------

export const JOB_COLOR_OPTIONS = [
  info.main,
  success.main,
  // primary.main,
  // secondary.main,
  // info.darker,
  // warning.main,
  // error.main,
  // error.darker,
];

export const JOB_COLOR_REGION_MAP: Record<string, string> = {
  [info.main]: 'Metro Vancouver',
  [success.main]: 'Vancouver Island',
  // Add more mappings if you add more colors
};

// export const JOB_COLOR_OPTIONS = [
//   primary.main,
//   secondary.main,
//   info.main,
//   info.darker,
//   success.main,
//   warning.main,
//   error.main,
//   error.darker,
// ];

export const JOB_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'ready', label: 'Ready' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const JOB_POSITION_OPTIONS = [
  { value: 'lct', label: 'LCT' },
  { value: 'tcp', label: 'TCP' },
  { value: 'field_supervisor', label: 'Field Supervisor' },
];

export const JOB_VEHICLE_OPTIONS = [
  { value: 'highway_truck', label: 'Highway Truck' },
  { value: 'lane_closure_truck', label: 'Lane Closure Truck' },
];
export const JOB_EQUIPMENT_OPTIONS = [
  { value: 'arrowboard_trailer', label: 'Arrowboard Trailer' },
  { value: 'mobilization', label: 'Mobilization' },
];
