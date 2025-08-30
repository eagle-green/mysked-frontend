import { z } from 'zod';

export const TimeSheetUpdateSchema = z.object({
  travel_start: z.string().nullable().optional(),
  travel_end: z.string().nullable().optional(),
  shift_start: z.string().nullable().optional(),
  shift_end: z.string().nullable().optional(),
  break_start: z.string().nullable().optional(),
  break_end: z.string().nullable().optional(),
  travel_to_km: z.number().min(0).optional(),
  travel_during_km: z.number().min(0).optional(),
  travel_from_km: z.number().min(0).optional(),
  worker_notes: z.string().optional(),
  admin_notes: z.string().optional(),
});

export type TimeSheetUpdateType = z.infer<typeof TimeSheetUpdateSchema>;