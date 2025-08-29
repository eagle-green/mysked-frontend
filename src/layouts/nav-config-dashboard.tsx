import type { NavSectionProps } from 'src/components/nav-section';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  job: icon('ic-job'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  course: icon('ic-course'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  menuItem: icon('ic-menu-item'),
  ecommerce: icon('ic-ecommerce'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
  parameter: icon('ic-parameter'),
  location: icon('ic-baseline-location-on'),
  building: icon('solar--buildings-bold'),
  truck: icon('ic-baseline-fire-truck'),
  timeline: icon('ic-baseline-view-timeline'),
  timesheet: icon('solar--file-text-bold'),
  calendarSearch: icon('solar--calendar-search-bold'),
};

// ----------------------------------------------------------------------

export function getNavData(
  userRole: string,
  pendingTimeOffCount: number = 0
): NavSectionProps['data'] {
  const nav: NavSectionProps['data'] = [
    // {
    //   subheader: 'Overview',
    //   items: [
    //     {
    //       title: 'Dashboard',
    //       path: paths.dashboard.root,
    //       icon: ICONS.dashboard,
    //     },
    //   ],
    // },
    {
      subheader: 'My Schedule',
      items: [
        {
          title: 'Calendar',
          path: paths.schedule.calendar,
          icon: ICONS.calendar,
        },
        {
          title: 'Work',
          path: paths.schedule.list,
          icon: ICONS.job,
        },
        {
          title: 'Timesheet',
          path: paths.schedule.timesheet.root,
          icon: ICONS.timesheet,
        },
        {
          title: 'Time Off Request',
          path: paths.schedule.timeOff.root,
          icon: ICONS.calendarSearch,
          children: [
            {
              title: 'List',
              path: paths.schedule.timeOff.list,
            },
            {
              title: 'Create',
              path: paths.schedule.timeOff.create,
            },
          ],
        },
      ],
    },
  ];

  if (userRole === 'admin') {
    nav.push(
      {
        subheader: 'Work Management',
        items: [
          {
            title: 'Calendar',
            path: paths.work.calendar,
            icon: ICONS.calendar,
          },
          {
            title: 'Timeline',
            path: paths.work.timeline,
            icon: ICONS.timeline,
          },
          {
            title: 'Job',
            path: paths.work.job.root,
            icon: ICONS.job,
            children: [
              {
                title: 'List',
                path: paths.work.job.list,
              },
              {
                title: 'Create',
                path: paths.work.job.create,
              },
            ],
          },
          {
            title: 'Open Job',
            path: paths.work.openJob.root,
            icon: ICONS.job,
            children: [
              {
                title: 'List',
                path: paths.work.openJob.list,
              },
              {
                title: 'Create',
                path: paths.work.openJob.create,
              },
            ],
          },
          {
            title: 'Timesheet',
            path: paths.work.timesheet.list,
            icon: ICONS.timesheet,
          },
        ],
      },
      {
        subheader: 'Management',
        items: [
          {
            title: 'Employee',
            path: paths.management.user.root,
            icon: ICONS.user,
            children: [
              {
                title: 'List',
                path: paths.management.user.list,
              },
              {
                title: 'Create',
                path: paths.management.user.create,
              },
            ],
          },
          {
            title: 'Client',
            path: paths.management.client.root,
            icon: ICONS.user,
            children: [
              {
                title: 'List',
                path: paths.management.client.list,
              },
              {
                title: 'Create',
                path: paths.management.client.create,
              },
            ],
          },
          {
            title: 'Company',
            path: paths.management.company.root,
            icon: ICONS.building,
            children: [
              {
                title: 'List',
                path: paths.management.company.list,
              },
              {
                title: 'Create',
                path: paths.management.company.create,
              },
              {
                title: 'Site',
                path: paths.management.company.site.root,
                children: [
                  {
                    title: 'List',
                    path: paths.management.company.site.list,
                  },
                  {
                    title: 'Create',
                    path: paths.management.company.site.create,
                  },
                ],
              },
            ],
          },

          {
            title: 'Vehicle',
            path: paths.management.vehicle.root,
            icon: ICONS.truck,
            children: [
              {
                title: 'List',
                path: paths.management.vehicle.list,
              },
              {
                title: 'Create',
                path: paths.management.vehicle.create,
              },
            ],
          },
          {
            title: 'Time Off Requests',
            path: paths.management.timeOff.list,
            icon: ICONS.calendarSearch,
          },
        ],
      }
    );
  }

  return nav;
}
