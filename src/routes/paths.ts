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
  // PUBLIC
  terms: '/terms',
  privacy: '/privacy',
  install: '/install',

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
    guide: `${ROOTS.SCHEDULE}/guide`,
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
      tmp: {
        root: `${ROOTS.SCHEDULE}/work/tmp`,
        list: `${ROOTS.SCHEDULE}/work/tmp/list`,
        detail: (id: string) => `${ROOTS.SCHEDULE}/work/tmp/${id}`,
      },
      incident_report: {
        root: `${ROOTS.SCHEDULE}/work/incident-report`,
        create: (id: string) => `${ROOTS.SCHEDULE}/work/incident-report/create/${id}`,
        edit: (id: string) => `${ROOTS.SCHEDULE}/work/incident-report/edit/${id}`,
      },
    },
    timeOff: {
      root: `${ROOTS.SCHEDULE}/time-off`,
      list: `${ROOTS.SCHEDULE}/time-off/list`,
      create: `${ROOTS.SCHEDULE}/time-off/create`,
      edit: (id: string) => `${ROOTS.SCHEDULE}/time-off/edit/${id}`,
    },
    vehicle: `${ROOTS.SCHEDULE}/vehicle`,
  },

  // WORK
  work: {
    root: ROOTS.WORK,
    calendar: `${ROOTS.WORK}/calendar`,
    board: `${ROOTS.WORK}/board`,
    timeline: `${ROOTS.WORK}/timeline`,
    job: {
      root: `${ROOTS.WORK}/jobs`,
      list: `${ROOTS.WORK}/jobs/list`,
      create: `${ROOTS.WORK}/jobs/create`,
      multiCreate: `${ROOTS.WORK}/jobs/multi-create`,
      detail: (id: string) => `${ROOTS.WORK}/jobs/${id}`,
      edit: (id: string) => `${ROOTS.WORK}/jobs/edit/${id}`,
      timesheet: {
        root: `${ROOTS.WORK}/jobs/timesheets`,
        list: `${ROOTS.WORK}/jobs/timesheets/list`,
        edit: (id: string) => `${ROOTS.WORK}/jobs/timesheets/edit/${id}`,
      },
      missingTimecards: {
        root: `${ROOTS.WORK}/jobs/missing-timecards`,
        list: `${ROOTS.WORK}/jobs/missing-timecards/list`,
      },
      flra: {
        root: `${ROOTS.WORK}/jobs/flra`,
        list: `${ROOTS.WORK}/jobs/flra/list`,
        pdf: (id: string) => `${ROOTS.WORK}/jobs/flra/pdf/${id}`,
      },
      tmp: {
        root: `${ROOTS.WORK}/jobs/tmp`,
        list: `${ROOTS.WORK}/jobs/tmp/list`,
        detail: (id: string) => `${ROOTS.WORK}/jobs/tmp/${id}`,
        pdf: (id: string) => `${ROOTS.WORK}/jobs/tmp/pdf/${id}`,
      },
      incident_report: {
        root: `${ROOTS.WORK}/jobs/incident-report`,
        detail: (id: string) => `${ROOTS.WORK}/jobs/incident-report/detail/${id}`,
      },
    },
    openJob: {
      root: `${ROOTS.WORK}/open-jobs`,
      list: `${ROOTS.WORK}/open-jobs/list`,
      create: `${ROOTS.WORK}/open-jobs/create`,
      edit: (id: string) => `${ROOTS.WORK}/open-jobs/edit/${id}`,
    },
  },

  // MANAGEMENT
  management: {
    root: ROOTS.MANAGEMENT,
    guide: `${ROOTS.MANAGEMENT}/guide`,
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
      audit: `${ROOTS.MANAGEMENT}/vehicles/audit`,
    },
    // Inventory
    inventory: {
      root: `${ROOTS.MANAGEMENT}/inventory`,
      list: `${ROOTS.MANAGEMENT}/inventory/list`,
      create: `${ROOTS.MANAGEMENT}/inventory/create`,
      detail: (id: string) => `${ROOTS.MANAGEMENT}/inventory/detail/${id}`,
      edit: (id: string) => `${ROOTS.MANAGEMENT}/inventory/edit/${id}`,
    },
    timeOff: {
      root: `${ROOTS.MANAGEMENT}/time-off`,
      list: `${ROOTS.MANAGEMENT}/time-off/list`,
      edit: (id: string) => `${ROOTS.MANAGEMENT}/time-off/edit/${id}`,
    },
    updates: {
      root: `${ROOTS.MANAGEMENT}/updates`,
      list: `${ROOTS.MANAGEMENT}/updates/list`,
      create: `${ROOTS.MANAGEMENT}/updates/create`,
      edit: (id: string) => `${ROOTS.MANAGEMENT}/updates/edit/${id}`,
      details: (id: string) => `${ROOTS.MANAGEMENT}/updates/${id}`,
    },
    invoice: {
      root: `${ROOTS.MANAGEMENT}/invoice`,
      list: `${ROOTS.MANAGEMENT}/invoice/list`,
      generate: `${ROOTS.MANAGEMENT}/invoice/generate`,
      new: `${ROOTS.MANAGEMENT}/invoice/new`,
      edit: (id: string) => `${ROOTS.MANAGEMENT}/invoice/edit/${id}`,
      details: (id: string) => `${ROOTS.MANAGEMENT}/invoice/${id}`,
      qboStatus: `${ROOTS.MANAGEMENT}/invoice/qbo-status`,
      services: {
        root: `${ROOTS.MANAGEMENT}/invoice/services`,
        list: `${ROOTS.MANAGEMENT}/invoice/services/list`,
      },
      customers: {
        root: `${ROOTS.MANAGEMENT}/invoice/customers`,
        list: `${ROOTS.MANAGEMENT}/invoice/customers/list`,
        details: (id: string) => `${ROOTS.MANAGEMENT}/invoice/customers/${id}`,
      },
    },
  },
};
