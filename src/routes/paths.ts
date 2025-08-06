// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  ACCOUNT: '/account',
  // DASHBOARD: '/dashboard',
  DASHBOARD: '/schedules/list',
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
    list: `${ROOTS.SCHEDULE}/list`,
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
    },
    timesheet: {
      root: `${ROOTS.WORK}/timesheets`,
      list: `${ROOTS.WORK}/timesheets/list`,
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

    company: {
      root: `${ROOTS.MANAGEMENT}/companies`,
      list: `${ROOTS.MANAGEMENT}/companies/list`,
      create: `${ROOTS.MANAGEMENT}/companies/create`,
      edit: (id: string) => `${ROOTS.MANAGEMENT}/companies/edit/${id}`,
      site: {
        root: `${ROOTS.MANAGEMENT}/companies/sites`,
        list: `${ROOTS.MANAGEMENT}/companies/sites/list`,
        create: `${ROOTS.MANAGEMENT}/companies/sites/create`,
        edit: (id: string) => `${ROOTS.MANAGEMENT}/companies/sites/edit/${id}`,
      },
    },

    // Vehicles
    vehicle: {
      root: `${ROOTS.MANAGEMENT}/vehicles`,
      list: `${ROOTS.MANAGEMENT}/vehicles/list`,
      create: `${ROOTS.MANAGEMENT}/vehicles/create`,
      edit: (id: string) => `${ROOTS.MANAGEMENT}/vehicles/edit/${id}`,
    },
    timesheet: {
      root: `${ROOTS.MANAGEMENT}/timesheets`,
      list: `${ROOTS.MANAGEMENT}/timesheets/list`,
      create: `${ROOTS.MANAGEMENT}/timesheets/create`,
      edit: (id: string) => `${ROOTS.MANAGEMENT}/timesheets/edit/${id}`,
      details: (id: string) => `${ROOTS.MANAGEMENT}/timesheets/details/${id}`,
    },
    timeOff: {
      root: `${ROOTS.MANAGEMENT}/time-off`,
      list: `${ROOTS.MANAGEMENT}/time-off/list`,
      edit: (id: string) => `${ROOTS.MANAGEMENT}/time-off/edit/${id}`,
    },
  },
};
