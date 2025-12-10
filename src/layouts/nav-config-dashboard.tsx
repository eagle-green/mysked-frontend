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
  fileCheck: icon('solar--file-check-bold'),
  book: icon('solar--book-bold'),
  garage: icon('solar--garage-bold'),
};

// ----------------------------------------------------------------------

export function getNavData(
  userRole: string,
  pendingTimeOffCount: number = 0,
  hasVehicle: boolean = false
): NavSectionProps['data'] {
  const myScheduleItems: NavSectionProps['data'][0]['items'] = [
    {
      title: 'Calendar',
      path: paths.schedule.calendar,
      icon: ICONS.calendar,
    },
    {
      title: 'Work',
      path: paths.schedule.work.root,
      icon: ICONS.job,
      children: [
        {
          title: 'List',
          path: paths.schedule.work.list,
        },
        {
          title: 'Field Level Risk Assessment',
          path: paths.schedule.work.flra.list,
        },
        {
          title: 'Traffic Management Plan',
          path: paths.schedule.work.tmp.list,
        },
        {
          title: 'Timesheet',
          path: paths.schedule.work.timesheet.list,
        },
        {
          title: 'Incident Report',
          path: paths.schedule.work.incident_report.root,
        },
      ],
    },
  ];

  // Add Vehicle menu item if worker has a vehicle assigned
  if (hasVehicle) {
    myScheduleItems.push({
      title: 'Vehicle',
      path: paths.schedule.vehicle,
      icon: ICONS.truck,
    });
  }

  myScheduleItems.push(
    {
      title: 'Time Off Request',
      path: paths.schedule.timeOff.list,
      icon: ICONS.calendarSearch,
    },
    {
      title: 'Guide',
      path: paths.schedule.guide,
      icon: ICONS.book,
    }
  );

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
      items: myScheduleItems,
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
            title: 'Board',
            path: paths.work.board,
            icon: ICONS.kanban,
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
              {
                title: 'Field Level Risk Assessment',
                path: paths.work.job.flra.list,
              },
              {
                title: 'Traffic Management Plan',
                path: paths.work.job.tmp.list,
              },
              {
                title: 'Timesheet',
                path: paths.work.job.timesheet.root,
                children: [
                  {
                    title: 'List',
                    path: paths.work.job.timesheet.list,
                  },
                  {
                    title: 'Missing Timesheets',
                    path: paths.work.job.missingTimecards.list,
                  },
                ],
              },
              {
                title: 'Incident Report',
                path: paths.work.job.incident_report.root,
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
            title: 'Customer',
            path: paths.management.customer.root,
            icon: ICONS.building,
            children: [
              {
                title: 'List',
                path: paths.management.customer.list,
              },
              {
                title: 'Create',
                path: paths.management.customer.create,
              },
              {
                title: 'Site',
                path: paths.management.customer.site.root,
                children: [
                  {
                    title: 'List',
                    path: paths.management.customer.site.list,
                  },
                  {
                    title: 'Create',
                    path: paths.management.customer.site.create,
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
              {
                title: 'Audit Vehicles',
                path: paths.management.vehicle.audit,
              },
            ],
          },
          {
            title: 'Inventory',
            path: paths.management.inventory.root,
            icon: ICONS.garage,
            children: [
              {
                title: 'List',
                path: paths.management.inventory.list,
              },
              {
                title: 'Create',
                path: paths.management.inventory.create,
              },
            ],
          },
          {
            title: 'Inventory',
            path: paths.management.inventory.root,
            icon: ICONS.garage,
            children: [
              {
                title: 'List',
                path: paths.management.inventory.list,
              },
              {
                title: 'Create',
                path: paths.management.inventory.create,
              },
            ],
          },
          {
            title: 'Time Off Requests',
            path: paths.management.timeOff.list,
            icon: ICONS.calendarSearch,
          },
          {
            title: 'Invoice',
            path: paths.management.invoice.root,
            icon: ICONS.invoice,
            children: [
              {
                title: 'List',
                path: paths.management.invoice.list,
              },
              {
                title: 'Generate',
                path: paths.management.invoice.generate,
              },
              {
                title: 'Products & Services',
                path: paths.management.invoice.services.list,
              },
              {
                title: 'Customers',
                path: paths.management.invoice.customers.list,
              },
              {
                title: 'QBO Status',
                path: paths.management.invoice.qboStatus,
              },
            ],
          },
          {
            title: 'Updates',
            path: paths.management.updates.list,
            icon: ICONS.blog,
          },
          {
            title: 'Admin Guide',
            path: paths.management.guide,
            icon: ICONS.book,
          },
        ],
      }
    );
  } else if (userRole === 'field_supervisor') {
    // Field supervisors get limited Management access - only Vehicle Audit
    nav.push({
      subheader: 'Management',
      items: [
        {
          title: 'Vehicle',
          path: paths.management.vehicle.root,
          icon: ICONS.truck,
          children: [
            {
              title: 'Audit Vehicles',
              path: paths.management.vehicle.audit,
            },
          ],
        },
      ],
    });
  }

  return nav;
}
