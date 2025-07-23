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
    timesheet: `${ROOTS.SCHEDULE}/timesheet`,
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
    // Companies
    company: {
      root: `${ROOTS.MANAGEMENT}/companies`,
      list: `${ROOTS.MANAGEMENT}/companies/list`,
      create: `${ROOTS.MANAGEMENT}/companies/create`,
      edit: (id: string) => `${ROOTS.MANAGEMENT}/companies/edit/${id}`,
    },
    // Sites (previously under companies)
    site: {
      root: `${ROOTS.MANAGEMENT}/sites`,
      list: `${ROOTS.MANAGEMENT}/sites/list`,
      create: `${ROOTS.MANAGEMENT}/sites/create`,
      edit: (id: string) => `${ROOTS.MANAGEMENT}/sites/edit/${id}`,
    },
    // Vehicles (previously under resources)
    vehicle: {
      root: `${ROOTS.MANAGEMENT}/vehicles`,
      list: `${ROOTS.MANAGEMENT}/vehicles/list`,
      create: `${ROOTS.MANAGEMENT}/vehicles/create`,
      edit: (id: string) => `${ROOTS.MANAGEMENT}/vehicles/edit/${id}`,
    },
    timesheet: {
      root: `${ROOTS.MANAGEMENT}/timesheets`,
      list: `${ROOTS.MANAGEMENT}/timesheets/list`,
    },
  },

  // Legacy paths for backward compatibility (can be removed after full migration)
  contact: {
    user: {
      root: `${ROOTS.MANAGEMENT}/users`,
      list: `${ROOTS.MANAGEMENT}/users/list`,
      create: `${ROOTS.MANAGEMENT}/users/create`,
      edit: (id: string) => `${ROOTS.MANAGEMENT}/users/edit/${id}`,
    },
    client: {
      root: `${ROOTS.MANAGEMENT}/clients`,
      list: `${ROOTS.MANAGEMENT}/clients/list`,
      create: `${ROOTS.MANAGEMENT}/clients/create`,
      edit: (id: string) => `${ROOTS.MANAGEMENT}/clients/edit/${id}`,
    },
  },

  company: {
    root: `${ROOTS.MANAGEMENT}/companies`,
    list: `${ROOTS.MANAGEMENT}/companies/list`,
    create: `${ROOTS.MANAGEMENT}/companies/create`,
    edit: (id: string) => `${ROOTS.MANAGEMENT}/companies/edit/${id}`,
    site: {
      root: `${ROOTS.MANAGEMENT}/sites`,
      list: `${ROOTS.MANAGEMENT}/sites/list`,
      create: `${ROOTS.MANAGEMENT}/sites/create`,
      edit: (id: string) => `${ROOTS.MANAGEMENT}/sites/edit/${id}`,
    },
  },

  resource: {
    vehicle: {
      root: `${ROOTS.MANAGEMENT}/vehicles`,
      list: `${ROOTS.MANAGEMENT}/vehicles/list`,
      create: `${ROOTS.MANAGEMENT}/vehicles/create`,
      edit: (id: string) => `${ROOTS.MANAGEMENT}/vehicles/edit/${id}`,
    },
  },
};
