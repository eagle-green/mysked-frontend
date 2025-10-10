// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  ACCOUNT: '/account',
  // DASHBOARD: '/dashboard',
  DASHBOARD: '/schedules/work/list',
  SCHEDULE: '/schedules',
  WORK: '/works',
  MANAGEMENT: '/management',
  TIMESHEET: '/timesheets',
};

// ----------------------------------------------------------------------

export const paths = {
  // AUTH
  auth: {
    jwt: {
      signIn: `${ROOTS.AUTH}/jwt/sign-in`,
      signUp: `${ROOTS.AUTH}/jwt/sign-up`,
    },
    accessDenied: `${ROOTS.AUTH}/access-denied`,
  },

  // Acount
  account: {
    edit: `${ROOTS.ACCOUNT}/edit`,
  },

  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    two: `${ROOTS.DASHBOARD}/two`,
    three: `${ROOTS.DASHBOARD}/three`,
    group: {
      root: `${ROOTS.DASHBOARD}/group`,
      five: `${ROOTS.DASHBOARD}/group/five`,
      six: `${ROOTS.DASHBOARD}/group/six`,
    },
  },

  // SCHEDULE
  schedule: {
    root: ROOTS.SCHEDULE,
    calendar: `${ROOTS.SCHEDULE}/calendar`,
    list: `${ROOTS.SCHEDULE}/work/list`,
    work: {
      root: `${ROOTS.SCHEDULE}/work`,
      list: `${ROOTS.SCHEDULE}/work/list`,
      job: {
        root: `${ROOTS.SCHEDULE}/work/jobs`,
        list: `${ROOTS.SCHEDULE}/work/jobs/list`,
        create: `${ROOTS.SCHEDULE}/work/jobs/create`,
        edit: (id: string) => `${ROOTS.SCHEDULE}/work/jobs/edit/${id}`,
      },
      timesheet: {
        root: `${ROOTS.SCHEDULE}/work/timesheets`,
        list: `${ROOTS.SCHEDULE}/work/timesheets/list`,
        edit: (id: string) => `${ROOTS.SCHEDULE}/work/timesheets/edit/${id}`,
      },
      flra: {
        root: `${ROOTS.SCHEDULE}/work/flra`,
        list: `${ROOTS.SCHEDULE}/work/flra/list`,
        pdf: (id: string) => `${ROOTS.SCHEDULE}/work/flra/pdf/${id}`,
        edit: (id: string) => `${ROOTS.SCHEDULE}/work/flra/edit/${id}`,
      },
      fieldLevelRiskAssessment: {
        form: `${ROOTS.SCHEDULE}/work/field-level-risk-assessment/form`,
      },
    },
    timeOff: {
      root: `${ROOTS.SCHEDULE}/time-off`,
      list: `${ROOTS.SCHEDULE}/time-off/list`,
      create: `${ROOTS.SCHEDULE}/time-off/create`,
      edit: (id: string) => `${ROOTS.SCHEDULE}/time-off/edit/${id}`,
    },
    timesheet: {
      root: `${ROOTS.SCHEDULE}/timesheet`,
      edit: (id: string) => `${ROOTS.SCHEDULE}/timesheet/edit/${id}`,
    },
    fieldLevelRiskAssessment: {
      root: `${ROOTS.SCHEDULE}/field-level-risk-assessment/form`,
    },
    flra: {
      root: `${ROOTS.SCHEDULE}/flra`,
      list: `${ROOTS.SCHEDULE}/flra/list`,
      form: (id: string) => `${ROOTS.SCHEDULE}/flra-form/${id}`,
      pdf: (id: string) => `${ROOTS.SCHEDULE}/flra/pdf/${id}`,
    },
  },

  // WORK
  work: {
    root: ROOTS.WORK,
    calendar: `${ROOTS.WORK}/calendar`,
    timeline: `${ROOTS.WORK}/timeline`,
    job: {
      root: `${ROOTS.WORK}/jobs`,
      list: `${ROOTS.WORK}/jobs/list`,
      create: `${ROOTS.WORK}/jobs/create`,
      multiCreate: `${ROOTS.WORK}/jobs/multi-create`,
      edit: (id: string) => `${ROOTS.WORK}/jobs/edit/${id}`,
      timesheet: {
        root: `${ROOTS.WORK}/jobs/timesheets`,
        list: `${ROOTS.WORK}/jobs/timesheets/list`,
        edit: (id: string) => `${ROOTS.WORK}/jobs/timesheets/edit/${id}`,
      },
      flra: {
        root: `${ROOTS.WORK}/jobs/flra`,
        list: `${ROOTS.WORK}/jobs/flra/list`,
        pdf: (id: string) => `${ROOTS.WORK}/jobs/flra/pdf/${id}`,
      },
    },
    openJob: {
      root: `${ROOTS.WORK}/open-jobs`,
      list: `${ROOTS.WORK}/open-jobs/list`,
      create: `${ROOTS.WORK}/open-jobs/create`,
      edit: (id: string) => `${ROOTS.WORK}/open-jobs/edit/${id}`,
    },
    flra: {
      root: `${ROOTS.WORK}/flra`,
      list: `${ROOTS.WORK}/flra/list`,
      pdf: (id: string) => `${ROOTS.WORK}/flra/pdf/${id}`,
    },
  },

  // MANAGEMENT
  management: {
    root: ROOTS.MANAGEMENT,
    // Users (previously under contacts)
    user: {
      root: `${ROOTS.MANAGEMENT}/users`,
      list: `${ROOTS.MANAGEMENT}/users/list`,
      create: `${ROOTS.MANAGEMENT}/users/create`,
      edit: (id: string) => `${ROOTS.MANAGEMENT}/users/edit/${id}`,
    },
    // Clients (previously under contacts)
    client: {
      root: `${ROOTS.MANAGEMENT}/clients`,
      list: `${ROOTS.MANAGEMENT}/clients/list`,
      create: `${ROOTS.MANAGEMENT}/clients/create`,
      edit: (id: string) => `${ROOTS.MANAGEMENT}/clients/edit/${id}`,
    },

    customer: {
      root: `${ROOTS.MANAGEMENT}/customers`,
      list: `${ROOTS.MANAGEMENT}/customers/list`,
      create: `${ROOTS.MANAGEMENT}/customers/create`,
      edit: (id: string) => `${ROOTS.MANAGEMENT}/customers/edit/${id}`,
      site: {
        root: `${ROOTS.MANAGEMENT}/customers/sites`,
        list: `${ROOTS.MANAGEMENT}/customers/sites/list`,
        create: `${ROOTS.MANAGEMENT}/customers/sites/create`,
        edit: (id: string) => `${ROOTS.MANAGEMENT}/customers/sites/edit/${id}`,
      },
    },

    // Vehicles
    vehicle: {
      root: `${ROOTS.MANAGEMENT}/vehicles`,
      list: `${ROOTS.MANAGEMENT}/vehicles/list`,
      create: `${ROOTS.MANAGEMENT}/vehicles/create`,
      edit: (id: string) => `${ROOTS.MANAGEMENT}/vehicles/edit/${id}`,
    },
    timeOff: {
      root: `${ROOTS.MANAGEMENT}/time-off`,
      list: `${ROOTS.MANAGEMENT}/time-off/list`,
      edit: (id: string) => `${ROOTS.MANAGEMENT}/time-off/edit/${id}`,
    },
  },
};
