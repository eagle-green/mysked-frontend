import { z as zod } from 'zod';

export type TimeSheetUpdateType = zod.infer<typeof TimeSheetUpdateSchema>;

export const TimeSheetUpdateSchema = zod.object({
  travel_start: zod.string().optional(),
  shift_start: zod.string().nullable(),
  break_minutes: zod.number().min(0).optional().default(0),
  shift_end: zod.string().nullable(),
  travel_end: zod.string().optional(),
  travel_to_km: zod.union([zod.string(), zod.number()]).transform((val) => {
    if (typeof val === 'string') return parseFloat(val) || 0;
    return val;
  }).optional(),
  travel_during_km: zod.union([zod.string(), zod.number()]).transform((val) => {
    if (typeof val === 'string') return parseFloat(val) || 0;
    return val;
  }).optional(),
  travel_from_km: zod.union([zod.string(), zod.number()]).transform((val) => {
    if (typeof val === 'string') return parseFloat(val) || 0;
    return val;
  }).optional(),
  worker_notes: zod.string().nullable().optional().transform((v) => v ?? null),
  admin_notes: zod.string().nullable().optional().transform((v) => v ?? null),
  timesheet_notes: zod.string().nullable().optional().transform((v) => v ?? null),
  mob: zod.boolean().optional().default(false),
  initial: zod.string({ required_error: "Sign Required", invalid_type_error: "Sign Required" }).min(1, "Sign Required").optional(),
}).refine((data) => {
  // If travel_start is set (not empty string), travel_end must also be set
  if (data.travel_start && data.travel_start !== '') {
    return data.travel_end && data.travel_end !== '';
  }
  return true;
}, {
  message: "Travel end time is required when travel start time is set",
  path: ["travel_end"]
}).refine((data) => {
  // If travel_end is set (not empty string), travel_start must also be set
  if (data.travel_end && data.travel_end !== '') {
    return data.travel_start && data.travel_start !== '';
  }
  return true;
}, {
  message: "Travel start time is required when travel end time is set",
  path: ["travel_start"]
})

