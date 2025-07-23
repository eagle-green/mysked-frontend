// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  ACCOUNT: '/account',
  // DASHBOARD: '/dashboard',
  DASHBOARD: '/schedules/list',
  SCHEDULE: '/schedules',
  CONTACT: '/contacts',
  WORK: '/works',
  USER: '/users',
  CLIENT: '/clients',
  COMPANY: '/companies',
  SITE: '/site',
  RESOURCE: '/resources',
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

  // CONTACT
  contact: {
    root: ROOTS.CONTACT,
    user: {
      root: `${ROOTS.CONTACT}/users`,
      list: `${ROOTS.CONTACT}/users/list`,
      create: `${ROOTS.CONTACT}/users/create`,
      edit: (id: string) => `${ROOTS.CONTACT}/users/edit/${id}`,
    },
    client: {
      root: `${ROOTS.CONTACT}/clients`,
      list: `${ROOTS.CONTACT}/clients/list`,
      create: `${ROOTS.CONTACT}/clients/create`,
      edit: (id: string) => `${ROOTS.CONTACT}/clients/edit/${id}`,
    },
  },

  // COMPANY
  company: {
    root: ROOTS.COMPANY,
    list: `${ROOTS.COMPANY}/list`,
    create: `${ROOTS.COMPANY}/create`,
    edit: (id: string) => `${ROOTS.COMPANY}/edit/${id}`,
    site: {
      root: `${ROOTS.COMPANY}/site`,
      list: `${ROOTS.COMPANY}/site/list`,
      create: `${ROOTS.COMPANY}/site/create`,
      edit: (id: string) => `${ROOTS.COMPANY}/site/edit/${id}`,
    },
  },

  // RESOURCE
  resource: {
    root: ROOTS.RESOURCE,
    vehicle: {
      root: `${ROOTS.RESOURCE}/vehicles`,
      list: `${ROOTS.RESOURCE}/vehicles/list`,
      create: `${ROOTS.RESOURCE}/vehicles/create`,
      edit: (id: string) => `${ROOTS.RESOURCE}/vehicles/edit/${id}`,
    },
    equipment: {
      root: `${ROOTS.RESOURCE}/equipments`,
      list: `${ROOTS.RESOURCE}/equipments/list`,
      create: `${ROOTS.RESOURCE}/equipments/create`,
      edit: (id: string) => `${ROOTS.RESOURCE}/equipments/edit/${id}`,
    },
  },
};
