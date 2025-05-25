// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
  CONTACT: '/contacts',
  JOB: '/jobs',
  USER: '/users',
  CLIENT: '/clients',
  SITE: '/sites',
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

  // JOB SCHEDULE
  jobSchedule: {
    root: ROOTS.JOB,
    calendar: `${ROOTS.JOB}/calendar`,
    job: {
      root: `${ROOTS.JOB}/job`,
      list: `${ROOTS.JOB}/job/list`,
      create: `${ROOTS.JOB}/job/create`,
    },
  },

  // CONTACT
  contact: {
    root: ROOTS.CONTACT,
    employee: {
      root: `${ROOTS.CONTACT}/employeeses`,
      list: `${ROOTS.CONTACT}/employeeees/list`,
      create: `${ROOTS.CONTACT}/employeeses/create`,
    },
    client: {
      root: `${ROOTS.CONTACT}/clients`,
      list: `${ROOTS.CONTACT}/clients/list`,
      create: `${ROOTS.CONTACT}/clients/create`,
      edit: (id: string) => `${ROOTS.CONTACT}/clients/edit/${id}`,
    },
  },

  // USER
  user: {
    root: ROOTS.USER,
    list: `${ROOTS.USER}/list`,
    create: `${ROOTS.USER}/create`,
    edit: (id: string) => `${ROOTS.USER}/edit/${id}`,
  },

  // CLIENT
  client: {
    root: ROOTS.CLIENT,
    list: `${ROOTS.CLIENT}/list`,
    create: `${ROOTS.CLIENT}/create`,
    edit: (id: string) => `${ROOTS.CLIENT}/edit/${id}`,
  },

  // SITE
  site: {
    root: ROOTS.SITE,
    list: `${ROOTS.SITE}/list`,
    create: `${ROOTS.SITE}/create`,
    edit: (id: string) => `${ROOTS.SITE}/edit/${id}`,
  },
};
