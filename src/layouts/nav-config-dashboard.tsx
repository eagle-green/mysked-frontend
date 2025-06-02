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
  truck: icon('ic-baseline-fire-truck'),
};

// ----------------------------------------------------------------------

export function getNavData(userRole: string): NavSectionProps['data'] {
  const nav: NavSectionProps['data'] = [
    {
      subheader: 'Overview',
      items: [
        {
          title: 'Dashboard',
          path: paths.dashboard.root,
          icon: ICONS.dashboard,
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
        ],
      },
      {
        subheader: 'Management',
        items: [
          {
            title: 'Contact',
            path: paths.contact.root,
            icon: ICONS.user,
            children: [
              {
                title: 'Employee',
                path: paths.contact.user.root,
                children: [
                  {
                    title: 'List',
                    path: paths.contact.user.list,
                  },
                  {
                    title: 'Create',
                    path: paths.contact.user.create,
                  },
                ],
              },
              {
                title: 'Client',
                path: paths.contact.client.root,
                children: [
                  {
                    title: 'List',
                    path: paths.contact.client.list,
                  },
                  {
                    title: 'Create',
                    path: paths.contact.client.create,
                  },
                ],
              },
            ],
          },
          {
            title: 'Site',
            path: paths.site.root,
            icon: ICONS.location,
            children: [
              {
                title: 'List',
                path: paths.site.list,
              },
              {
                title: 'Create',
                path: paths.site.create,
              },
            ],
          },
          {
            title: 'Resource',
            path: paths.resource.root,
            icon: ICONS.truck,
            children: [
              {
                title: 'Vehicle',
                path: paths.resource.vehicle.root,
                children: [
                  {
                    title: 'List',
                    path: paths.resource.vehicle.list,
                  },
                  {
                    title: 'Create',
                    path: paths.resource.vehicle.create,
                  },
                ],
              },
            ],
          },
        ],
      }
    );
  }

  return nav;
}
