
import type { IJob } from 'src/types/job';

import { z as zod } from 'zod';

import { TimeCardStatus } from 'src/types/timecard';

import { SCHEMA_VALIDATION_MESSAGE } from '../constant';

export type TimeSheetDetailSchemaType = zod.infer<typeof TimeSheetDetailSchema>;

export const TimeSheetDetailSchema = zod.object({
  jobId: zod.string().uuid({ message: SCHEMA_VALIDATION_MESSAGE.INVALID_ID}),
  workerId: zod.string().uuid({ message: SCHEMA_VALIDATION_MESSAGE.INVALID_ID}),
  timesheetManagerId: zod.string().uuid({ message: SCHEMA_VALIDATION_MESSAGE.INVALID_ID}),
  date: zod.string(),
  travelStart: zod.string().optional(),
  travelEnd: zod.string().optional(),
  shiftStart: zod.string().optional(),
  shiftEnd: zod.string().optional(),
  breakStart: zod.string().optional(),
  breakEnd: zod.string().optional(),
  travelToKm: zod.number().optional(),
  travelDuringKm: zod.number().optional(),
  travelFromKm: zod.number().optional(),
  setupTimeHrs: zod.number().optional(),
  packupTimeHrs: zod.number().optional(),
  status: zod.string(),
  workerSignature: zod.string().optional(),
  clientSignature: zod.string().optional(),
  submittedAt: zod.string(),
  approvedAt: zod.string(),
  shiftTotalHrs: zod.number().optional()
});


export class TimeCardModel {
   id?: string;
   jobId: string = '';
   workerId: string = '';
   timesheetManagerId: string = '';
   date: string = '';
   travelStart?: string = '';
   travelEnd?: string = '';
   shiftStart?: string = '';
   shiftEnd?: string = '';
   breakStart?: string = '';
   breakEnd?: string = '';
   travelToKm?: number = 0;
   travelDuringKm?: number = 0;
   travelFromKm?: number = 0;
   setupTimeHrs?: number = 0;
   packupTimeHrs?: number = 0;
   workerSignature?: string = '';
   clientSignature?: string = '';
   status = TimeCardStatus.DRAFT;
   submittedAt: string = '';
   approvedAt: string = '';
   shiftTotalHrs?: number;
   travelTotalHrs?: number;

   job: IJob = {} as IJob;

   UpdateTimeFields(
    travelStart?: string, 
    travelEnd?: string, 
    shiftStart?: string,
    shiftEnd?: string,
    breakStart?: string,
    breakEnd?: string,
    travelToKm?: number,
    travelDuringKm?: number,
    setupTimeHrs?: number,
    packupTimeHrs?: number) {
    
      this.travelStart = travelStart;
      this.travelEnd = travelEnd;
      this.shiftStart = shiftStart;
      this.shiftEnd = shiftEnd;
      this.breakStart = breakStart;
      this.breakEnd = breakEnd;
      this.travelToKm = travelToKm;
      this.travelDuringKm = travelDuringKm;
      this.setupTimeHrs = setupTimeHrs;
      this.packupTimeHrs = packupTimeHrs;
   }

   UpdateStatus(status: TimeCardStatus) {
    this.status = status;
   }

   AddJob(job: IJob) {
    this.job = job
   }
}

