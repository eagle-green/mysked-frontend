
import { z as zod } from 'zod';

import { TimeCardStatus } from 'src/types/timecard';

import { SCHEMA_VALIDATION_MESSAGE } from '../constant';

export type TimeSheetDetailSchemaType = zod.infer<typeof TimeSheetDetailSchema>;

export const TimeSheetDetailSchema = zod.object({
  jobId: zod.string().uuid({ message: SCHEMA_VALIDATION_MESSAGE.INVALID_ID}),
  workerId: zod.string().uuid({ message: SCHEMA_VALIDATION_MESSAGE.INVALID_ID}),
  timesheetManagerId: zod.string().uuid({ message: SCHEMA_VALIDATION_MESSAGE.INVALID_ID}),
  date: zod.string(),
  travelStart: zod.string(),
  travelEnd: zod.string(),
  shiftStart: zod.string(),
  shiftEnd: zod.string(),
  breakStart: zod.string(),
  breakEnd: zod.string(),
  travelToKm: zod.number(),
  travelDuringKm: zod.number(),
  travelFromKm: zod.number(),
  setupTimeHrs: zod.number(),
  packupTimeHrs: zod.number(),
  workerSignature: zod.string(),
  clientSignature: zod.string(),
  status: zod.string(),
  submittedAt: zod.string(),
  approvedAt: zod.string(),
});


export class TimeCardModel {
   id?: string;
   jobId: string = '';
   workerId: string = '';
   timesheetManagerId: string = '';
   date: string = '';
   travelStart: string = '';
   travelEnd: string = '';
   shiftStart: string = '';
   shiftEnd: string = '';
   breakStart: string = '';
   breakEnd: string = '';
   travelToKm: number = 0;
   travelDuringKm: number = 0;
   travelFromKm: number = 0;
   setupTimeHrs: number = 0;
   packupTimeHrs: number = 0;
   workerSignature: string = '';
   clientSignature: string = '';
   status = TimeCardStatus.DRAFT;
   submittedAt: string = '';
   approvedAt: string = '';
}

