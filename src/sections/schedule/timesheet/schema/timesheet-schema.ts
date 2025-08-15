import { z as zod } from 'zod';

export type TimeSheetUpdateType = zod.infer<typeof TimeSheetUpdateSchema>;

export const TimeSheetUpdateSchema = zod.object({
  travel_start: zod.string(),
  shift_start: zod.string(),
  break_start: zod.string(),
  break_end: zod.string(),
  shift_end: zod.string(),
  travel_end: zod.string(),
  travel_to_km: zod.number(),
  travel_during_km: zod.number(),
  travel_from_km: zod.number(),
  worker_notes: zod.string().nullable().optional().transform((v) => v ?? null),
  admin_notes: zod.string().nullable().optional().transform((v) => v ?? null)
})

