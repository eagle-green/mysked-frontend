import { z as zod } from 'zod';

export type TimeSheetUpdateType = zod.infer<typeof TimeSheetUpdateSchema>;

export const TimeSheetUpdateSchema = zod.object({
  travel_start: zod.string().nullable().optional(),
  shift_start: zod.string().nullable().optional(),
  break_start: zod.string().nullable().optional(),
  break_end: zod.string().nullable().optional(),
  shift_end: zod.string().nullable().optional(),
  travel_end: zod.string().nullable().optional(),
  travel_to_km: zod.number().nullable().optional(),
  travel_during_km: zod.number().nullable().optional(),
  travel_from_km: zod.number().nullable().optional(),
  worker_notes: zod.string().nullable().optional(),
  admin_notes: zod.string().nullable().optional()
})

