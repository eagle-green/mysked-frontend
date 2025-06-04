// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  // DASHBOARD: '/dashboard',
  DASHBOARD: '/schedules/list',
  SCHEDULE: '/schedules',
  CONTACT: '/contacts',
  WORK: '/works',
  USER: '/users',
  CLIENT: '/clients',
  SITE: '/sites',
  RESOURCE: '/resources',
};

// ----------------------------------------------------------------------

export const paths = {
  faqs: '/faqs',
  minimalStore: 'https://mui.com/store/items/minimal-dashboard/',
  // AUTH
  auth: {
    amplify: {
      signIn: `${ROOTS.AUTH}/amplify/sign-in`,
      verify: `${ROOTS.AUTH}/amplify/verify`,
      signUp: `${ROOTS.AUTH}/amplify/sign-up`,
      updatePassword: `${ROOTS.AUTH}/amplify/update-password`,
      resetPassword: `${ROOTS.AUTH}/amplify/reset-password`,
    },
    jwt: {
      signIn: `${ROOTS.AUTH}/jwt/sign-in`,
      signUp: `${ROOTS.AUTH}/jwt/sign-up`,
    },
    firebase: {
      signIn: `${ROOTS.AUTH}/firebase/sign-in`,
      verify: `${ROOTS.AUTH}/firebase/verify`,
      signUp: `${ROOTS.AUTH}/firebase/sign-up`,
      resetPassword: `${ROOTS.AUTH}/firebase/reset-password`,
    },
    auth0: {
      signIn: `${ROOTS.AUTH}/auth0/sign-in`,
    },
    supabase: {
      signIn: `${ROOTS.AUTH}/supabase/sign-in`,
      verify: `${ROOTS.AUTH}/supabase/verify`,
      signUp: `${ROOTS.AUTH}/supabase/sign-up`,
      updatePassword: `${ROOTS.AUTH}/supabase/update-password`,
      resetPassword: `${ROOTS.AUTH}/supabase/reset-password`,
    },
    accessDenied: `${ROOTS.AUTH}/access-denied`,
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
    job: {
      root: `${ROOTS.WORK}/jobs`,
      list: `${ROOTS.WORK}/jobs/list`,
      create: `${ROOTS.WORK}/jobs/create`,
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

  // SITE
  site: {
    root: ROOTS.SITE,
    list: `${ROOTS.SITE}/list`,
    create: `${ROOTS.SITE}/create`,
    edit: (id: string) => `${ROOTS.SITE}/edit/${id}`,
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
