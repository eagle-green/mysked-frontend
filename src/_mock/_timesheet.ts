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
      travelStart: _mock.time(index),
      travelEnd: _mock.time(index),
      shiftStart: _mock.time(index),
      shiftEnd: _mock.time(index),
      breakStart: _mock.time(index),
      breakEnd: _mock.time(index),
      travelToKm: index,
      travelDuringKm: index,
      travelFromKm: index,
      setupTimeHrs: index,
      packupTimeHrs: index,
      shiftTotalHrs: index,
      travelTotalHrs: index,
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
