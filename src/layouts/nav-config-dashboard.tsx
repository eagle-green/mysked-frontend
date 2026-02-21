import type { NavSectionProps } from 'src/components/nav-section';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';

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

// Authorized users who can always see Invoice section and manage User Access
const AUTHORIZED_INVOICE_ADMINS = [
  'kiwoon@eaglegreen.ca',
  'kesia@eaglegreen.ca',
  'matth@eaglegreen.ca',
  'joec@eaglegreen.ca',
];

export function getNavData(
  userRole: string,
  pendingTimeOffCount: number = 0,
  hasVehicle: boolean = false,
  hasInvoiceAccess: boolean = false,
  userEmail?: string,
  incidentReportPendingCount: number = 0,
  incidentReportInReviewCount: number = 0,
  myIncidentReportPendingCount: number = 0,
  myIncidentReportInReviewCount: number = 0,
  hasVehicleAccess: boolean = false,
  unreadAnnouncementsCount: number = 0,
  pendingJobCount: number = 0
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
          info:
            pendingJobCount > 0 ? (
              <Tooltip title="Jobs needing your response" placement="top">
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 18,
                    height: 18,
                    px: 0.5,
                    borderRadius: 1.5,
                    fontSize: 11,
                    fontWeight: 600,
                    bgcolor: 'warning.main',
                    color: 'warning.contrastText',
                    lineHeight: 1,
                  }}
                >
                  {pendingJobCount}
                </Box>
              </Tooltip>
            ) : undefined,
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
      ],
    },
    {
      title: 'Incident Report',
      path: paths.schedule.incident_report.root,
      icon: ICONS.file,
      info:
        myIncidentReportPendingCount > 0 || myIncidentReportInReviewCount > 0 ? (
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              alignSelf: 'center',
              gap: 0.5,
              flexShrink: 0,
            }}
          >
            {myIncidentReportPendingCount > 0 && (
              <Tooltip title="Pending" placement="top">
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 18,
                    height: 18,
                    px: 0.5,
                    borderRadius: 1.5,
                    fontSize: 11,
                    fontWeight: 600,
                    bgcolor: 'warning.main',
                    color: 'warning.contrastText',
                    lineHeight: 1,
                  }}
                >
                  {myIncidentReportPendingCount}
                </Box>
              </Tooltip>
            )}
            {myIncidentReportInReviewCount > 0 && (
              <Tooltip title="In review" placement="top">
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 18,
                    height: 18,
                    px: 0.5,
                    borderRadius: 1.5,
                    fontSize: 11,
                    fontWeight: 600,
                    bgcolor: 'error.main',
                    color: 'error.contrastText',
                    lineHeight: 1,
                  }}
                >
                  {myIncidentReportInReviewCount}
                </Box>
              </Tooltip>
            )}
          </Box>
        ) : undefined,
      children: [
        {
          title: 'List',
          path: paths.schedule.incident_report.list,
        },
        {
          title: 'Create',
          path: paths.schedule.incident_report.add,
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
      title: 'Traffic Management Manual',
      path: 'https://gkafeyvgddxwgxmwjdnt.supabase.co/storage/v1/object/sign/user-documents/2020-traffic-management-manual-for-work-on-roadways.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV84MmZiYTZlNi0yZDQxLTRhYWUtOTE2MC04NmJmZWJhZTJhYTMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ1c2VyLWRvY3VtZW50cy8yMDIwLXRyYWZmaWMtbWFuYWdlbWVudC1tYW51YWwtZm9yLXdvcmstb24tcm9hZHdheXMucGRmIiwiaWF0IjoxNzY3ODExOTQ4LCJleHAiOjIwODMxNzE5NDh9.eJP2oMQABj2l_CeDCLXohUDXc8tn8khGp0C2xll3UTc',
      icon: ICONS.file,
    },
    {
      title: 'Guide',
      path: paths.schedule.guide,
      icon: ICONS.book,
    }
  );

  const nav: NavSectionProps['data'] = [
    {
      subheader: 'My Schedule',
      items: myScheduleItems,
    },
  ];

  // Company > Announcements: single item; deepMatch so list + detail pages keep menu active; badge for unread
  nav.push({
    subheader: 'Company',
    items: [
      {
        title: 'Announcements',
        path: paths.company.announcements.root,
        icon: ICONS.mail,
        deepMatch: true,
        info:
          unreadAnnouncementsCount > 0 ? (
            <Tooltip title="Unread" placement="top">
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 18,
                  height: 18,
                  px: 0.5,
                  borderRadius: 1.5,
                  fontSize: 11,
                  fontWeight: 600,
                  bgcolor: 'warning.main',
                  color: 'warning.contrastText',
                  lineHeight: 1,
                }}
              >
                {unreadAnnouncementsCount}
              </Box>
            </Tooltip>
          ) : undefined,
      },
    ],
  });

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
                title: 'Dashboard',
                path: paths.work.job.dashboard,
              },
              {
                title: 'Dispatch Note',
                path: paths.work.job.dispatchNote,
              },
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
                title: 'TELUS Reports',
                path: paths.work.job.telusReports.list,
              },
            ],
          },
          {
            title: 'Incident Report',
            path: paths.work.incident_report.root,
            icon: ICONS.file,
            info:
              incidentReportPendingCount > 0 || incidentReportInReviewCount > 0 ? (
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    alignSelf: 'center',
                    gap: 0.5,
                    flexShrink: 0,
                  }}
                >
                  {incidentReportPendingCount > 0 && (
                    <Tooltip title="Pending" placement="top">
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 18,
                          height: 18,
                          px: 0.5,
                          borderRadius: 1.5,
                          fontSize: 11,
                          fontWeight: 600,
                          bgcolor: 'warning.main',
                          color: 'warning.contrastText',
                          lineHeight: 1,
                        }}
                      >
                        {incidentReportPendingCount}
                      </Box>
                    </Tooltip>
                  )}
                  {incidentReportInReviewCount > 0 && (
                    <Tooltip title="In review" placement="top">
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 18,
                          height: 18,
                          px: 0.5,
                          borderRadius: 1.5,
                          fontSize: 11,
                          fontWeight: 600,
                          bgcolor: 'error.main',
                          color: 'error.contrastText',
                          lineHeight: 1,
                        }}
                      >
                        {incidentReportInReviewCount}
                      </Box>
                    </Tooltip>
                  )}
                </Box>
              ) : undefined,
            children: [
              {
                title: 'List',
                path: paths.work.incident_report.list,
              },
              {
                title: 'Create',
                path: paths.work.incident_report.create,
              },
            ],
          },
          // Temporarily hidden - Open Job feature not released yet
          // {
          //   title: 'Open Job',
          //   path: paths.work.openJob.root,
          //   icon: ICONS.job,
          //   children: [
          //     {
          //       title: 'List',
          //       path: paths.work.openJob.list,
          //     },
          //     {
          //       title: 'Create',
          //       path: paths.work.openJob.create,
          //     },
          //   ],
          // },
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
              // Dashboard: admin only (not field_supervisor)
              ...(userRole === 'admin'
                ? [{ title: 'Dashboard', path: paths.management.vehicle.dashboard }]
                : []),
              {
                title: 'List',
                path: paths.management.vehicle.list,
              },
              // Create: admin only (not field_supervisor)
              ...(userRole === 'admin'
                ? [{ title: 'Create', path: paths.management.vehicle.create }]
                : []),
              {
                title: 'Audit Vehicles',
                path: paths.management.vehicle.audit,
              },
              // User Access: only for admin (manage which workers get vehicle access)
              ...(userRole === 'admin'
                ? [
                    {
                      title: 'User Access',
                      path: paths.management.vehicle.userAccess.list,
                    },
                  ]
                : []),
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
          // Only show Invoice menu if user has invoice access or is authorized admin
          ...(hasInvoiceAccess || (userEmail && AUTHORIZED_INVOICE_ADMINS.includes(userEmail.toLowerCase()))
            ? [
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
                    // Only show User Access menu item for authorized admins
                    ...(userEmail && AUTHORIZED_INVOICE_ADMINS.includes(userEmail.toLowerCase())
                      ? [
                          {
                            title: 'User Access',
                            path: paths.management.invoice.userAccess.list,
                          },
                        ]
                      : []),
            ],
          },
              ]
            : []),
          {
            title: 'Announcements',
            path: paths.management.announcements.root,
            icon: ICONS.mail,
            children: [
              { title: 'List', path: paths.management.announcements.list },
              { title: 'Create', path: paths.management.announcements.create },
            ],
          },
          {
            title: 'Updates',
            path: paths.management.updates.root,
            icon: ICONS.blog,
            deepMatch: true,
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
    // Field supervisors: Work Management (FLRA + Incident Report) then Management (Vehicle)
    nav.push({
      subheader: 'Work Management',
      items: [
        {
          title: 'Field Level Risk Assessment',
          path: paths.work.job.flra.list,
          icon: ICONS.fileCheck,
        },
        {
          title: 'Incident Report',
          path: paths.work.incident_report.root,
          icon: ICONS.file,
          info:
            incidentReportPendingCount > 0 || incidentReportInReviewCount > 0 ? (
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  alignSelf: 'center',
                  gap: 0.5,
                  flexShrink: 0,
                }}
              >
                {incidentReportPendingCount > 0 && (
                  <Tooltip title="Pending" placement="top">
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 18,
                        height: 18,
                        px: 0.5,
                        borderRadius: 1.5,
                        fontSize: 11,
                        fontWeight: 600,
                        bgcolor: 'warning.main',
                        color: 'warning.contrastText',
                        lineHeight: 1,
                      }}
                    >
                      {incidentReportPendingCount}
                    </Box>
                  </Tooltip>
                )}
                {incidentReportInReviewCount > 0 && (
                  <Tooltip title="In review" placement="top">
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 18,
                        height: 18,
                        px: 0.5,
                        borderRadius: 1.5,
                        fontSize: 11,
                        fontWeight: 600,
                        bgcolor: 'error.main',
                        color: 'error.contrastText',
                        lineHeight: 1,
                      }}
                    >
                      {incidentReportInReviewCount}
                    </Box>
                  </Tooltip>
                )}
              </Box>
            ) : undefined,
          children: [
            { title: 'List', path: paths.work.incident_report.list },
            { title: 'Create', path: paths.work.incident_report.create },
          ],
        },
      ],
    });
    // Field supervisors: if they have vehicle_access, show full Vehicle menu; otherwise only Audit
    nav.push({
      subheader: 'Management',
      items: [
        {
          title: 'Vehicle',
          path: paths.management.vehicle.root,
          icon: ICONS.truck,
          children: hasVehicleAccess
            ? [
                { title: 'List', path: paths.management.vehicle.list },
                { title: 'Create', path: paths.management.vehicle.create },
                { title: 'Audit Vehicles', path: paths.management.vehicle.audit },
              ]
            : [
                {
                  title: 'Audit Vehicles',
                  path: paths.management.vehicle.audit,
                },
              ],
        },
      ],
    });
  } else if (hasVehicleAccess) {
    // Workers with vehicle_access (LCT, LCT/TCP, HWY, Manager) see only List and Create; Audit is for field_supervisor only
    nav.push({
      subheader: 'Management',
      items: [
        {
          title: 'Vehicle',
          path: paths.management.vehicle.root,
          icon: ICONS.truck,
          children: [
            { title: 'List', path: paths.management.vehicle.list },
          ],
        },
      ],
    });
  }

  return nav;
}
