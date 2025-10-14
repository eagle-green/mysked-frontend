import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import type { AccountDrawerProps } from './components/account-drawer';

// ----------------------------------------------------------------------

export const _account: AccountDrawerProps['data'] = [
  // { label: 'Home', href: '/', icon: <Iconify icon="solar:home-angle-bold-duotone" /> },
  {
    label: 'Profile',
    href: paths.account.edit,
    icon: <Iconify icon="custom:profile-duotone" />,
  },
  {
    label: 'Calendar',
    href: paths.schedule.calendar,
    icon: <Iconify icon="solar:calendar-date-bold" />,
    // info: '3',
  },
  {
    label: 'Shift',
    href: paths.schedule.work.list,
    icon: <Iconify icon="solar:notes-bold-duotone" />,
    // info: '3',
  },
  // {
  //   label: 'Account Settings',
  //   href: paths.schedule.work.list,
  //   icon: <Iconify icon="solar:notes-bold-duotone" />,
  //   // info: '3',
  // },
  // {
  //   label: 'Subscription',
  //   href: '#',
  //   icon: <Iconify icon="custom:invoice-duotone" />,
  // },
  // { label: 'Security', href: '#', icon: <Iconify icon="solar:shield-keyhole-bold-duotone" /> },
  // { label: 'Account settings', href: '#', icon: <Iconify icon="solar:settings-bold-duotone" /> },
];
