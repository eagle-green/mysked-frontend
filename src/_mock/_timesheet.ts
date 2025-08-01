
import { _jobs } from './_job';
import { _mock } from './_mock';


// ----------------------------------------------------------------------

export const _timesheet = Array.from({ length: 12 }, (_, index) => {
   const status = index % 2 ? 'draft' : index % 3 ? 'submitted' : index % 4 ? 'approved' : 'rejected';

   return {
      id: _mock.id(index),
      job: _jobs[index],
      timesheetManagerId: _mock.id(index),
      jobId: _mock.id(index),
      workerId: _mock.id(index),
      date: _mock.time(index),
      travelStart: null,
      travelEnd: null,
      shiftStart: null,
      shiftEnd: null,
      breakStart: null,
      breakEnd: null,
      travelToKm: null,
      travelDuringKm: null,
      travelFromKm: null,
      setupTimeHrs: null,
      packupTimeHrs: null,
      shiftTotalHrs: null,
      travelTotalHrs: null,
      workerSignature: '',
      clientSignature: '',
      status: status,
      submittedAt: status == 'submitted' ? _mock.time(index) : '',
      approvedAt: status == 'approved' ? _mock.time(index) : '',
      createdAt: _mock.time(index),
      updatedAt: _mock.time(index),
      timesheetManager: null
   }
});