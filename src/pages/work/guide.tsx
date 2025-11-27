import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { getVersionInfo } from 'src/utils/version';

import { CONFIG } from 'src/global-config';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

const metadata = { title: `Admin Guide - ${CONFIG.appName}` };

export default function AdminGuidePage() {
  const theme = useTheme();

  const sections = [
    {
      title: '🎯 Getting Started',
      icon: 'solar:home-smile-bold',
      content: [
        {
          subtitle: 'Admin Dashboard Overview',
          description:
            'As an admin, you have access to Work Management and Management sections. Use the calendar and timeline views to oversee all operations, manage jobs, and coordinate workers.',
        },
        {
          subtitle: 'Key Responsibilities',
          description:
            'Admins manage job creation, worker assignments, customer/client relationships, vehicles, equipment, time-off approvals, timesheet reviews, FLRA oversight, and TMP management.',
        },
      ],
    },
    {
      title: '👥 User Management',
      icon: 'solar:users-group-rounded-bold',
      content: [
        {
          subtitle: 'Creating Workers',
          description: 'Go to Management → Users → Create to add new workers.',
          steps: [
            'Enter basic info (name, email, phone, address)',
            'Select employee role',
            'Upload photo, hiring package, certifications, and other documents',
            'Save the new worker',
          ],
        },
        {
          subtitle: 'Worker Certifications',
          description:
            "In the Certifications tab, manage worker qualifications: TCP Certificate, Driver's License, Hiring Package, and other documents.",
        },
        {
          subtitle: 'Managing Users',
          description:
            'Edit worker details, update certifications, and change status (active/inactive) from the user list page.',
        },
      ],
    },
    {
      title: '🏢 Customers, Clients & Sites',
      icon: 'solar:buildings-bold',
      content: [
        {
          subtitle: 'Customers',
          description:
            'Customers are the main entities you work with. Go to Management → Customers to manage them.',
          steps: [
            'Create customer with details',
            'Upload customer logo',
            'Set calendar color (appears on all calendar events)',
            'Mark as active/inactive',
            'Add sites associated with the customer',
          ],
        },
        {
          subtitle: 'Clients',
          description:
            'Clients are specific contacts within customers or independent clients. Manage them at Management → Clients.',
          steps: [
            'Add client name and contact info',
            'Upload client logo/photo',
            'Link to customers via site associations',
            'Set as active/inactive',
          ],
        },
        {
          subtitle: 'Sites',
          description:
            'Sites are physical work locations. Manage via Management → Customers → [Customer] → Sites.',
          steps: [
            'Add site name and full address',
            'Link to customer',
            'Set region for filtering',
            'Add site-specific notes',
          ],
        },
        {
          subtitle: 'Preferences',
          description:
            'Set worker preferences for customers, sites, and clients. Workers can also set their own preferences. Preferences appear when creating jobs:',
          steps: [
            'Preferred: Worker likes working with this customer/site/client',
            'Not Preferred: Worker prefers to avoid (optional/mandatory)',
            'Mandatory Not Preferred: Worker should never be assigned',
          ],
        },
      ],
    },
    {
      title: '💼 Creating Regular Jobs',
      icon: 'solar:case-round-bold',
      content: [
        {
          subtitle: 'Job Creation Workflow',
          description: 'Go to Work Management → Job → Create to create a new job.',
          steps: [
            'Select Customer, Site, and Client',
            'Set job date, start time, and end time',
            'Add worker positions (LCT, TCP, Field Supervisor)',
            'Select specific workers - system shows preferences and conflicts',
            'Add vehicles (assign operators)',
            'Add equipment if needed',
            'Choose timesheet manager',
            'Add job notes',
            'Review notification preview',
            'Send notifications to workers',
          ],
        },
        {
          subtitle: 'Worker Selection Intelligence',
          description: 'The system helps you select the right workers by showing:',
          steps: [
            '🟢 Green: Preferred workers',
            '🟡 Yellow: Not preferred or has schedule conflicts',
            '🔴 Red: Mandatory not preferred or blocking conflicts',
            'Conflict indicators for time-off, schedule gaps, and overlaps',
          ],
        },
        {
          subtitle: 'Auto-Created Documents',
          description:
            'When you create a job, the system automatically creates: Timesheet (with entries for all workers), FLRA form, and TMP form. Workers can then complete these as needed.',
        },
        {
          subtitle: 'Updating Jobs',
          description:
            'Edit existing jobs from the job list. When you make changes, the system shows what changed and lets you notify affected workers.',
        },
      ],
    },
    {
      title: '🔓 Creating Open Jobs (Shifts)',
      icon: 'solar:clipboard-add-bold',
      content: [
        {
          subtitle: 'What are Open Jobs?',
          description:
            'Open jobs are posted shift opportunities where workers can apply. Use these when you need workers for available positions on a first-come, first-served basis.',
        },
        {
          subtitle: 'Creating Open Jobs',
          description: 'Go to Work Management → Open Job → Create.',
          steps: [
            'Set customer, site, client (same as regular jobs)',
            'Set date, start time, end time',
            'Specify position requirements (e.g., 2 LCT, 1 TCP)',
            'Add vehicles/equipment needed',
            'Add job notes',
            'Send notifications to eligible workers',
          ],
        },
        {
          subtitle: 'Worker Applications',
          description:
            'Workers receive notifications and can apply via email/SMS links. Review applications in the Open Job list page.',
        },
        {
          subtitle: 'After Worker Applies',
          description:
            "When a worker applies, they're automatically added to the job. The job appears in their schedule immediately.",
        },
        {
          subtitle: 'Assigning Timesheet Manager',
          description:
            'Use the "Change Manager" button (3-dot menu) on the open job list to assign a timesheet manager once workers are assigned.',
        },
        {
          subtitle: 'Auto-Created Documents',
          description:
            'FLRA, Timesheet, and TMP are created immediately when you create an open job, even without a manager assigned initially.',
        },
      ],
    },
    {
      title: '⏱️ Managing Timesheets',
      icon: 'solar:clock-circle-bold',
      content: [
        {
          subtitle: 'Viewing Timesheets',
          description:
            'Go to Work Management → Job → Timesheet to see all timesheets. Filter by status, date range, customer, site, or client.',
        },
        {
          subtitle: 'Timesheet Workflow',
          description: 'Timesheets follow this workflow:',
          steps: [
            'Draft: Timesheet manager is filling it out',
            'Submitted: Manager completed and submitted for review',
          ],
        },
        {
          subtitle: 'Exporting Timesheets',
          description: 'Export timesheets for payroll or reporting:',
          steps: [
            'Use filters to select specific timesheets',
            'Click "Export" button',
            'Download Excel file with all timesheet data',
            'Includes worker info, times, breaks, and totals',
          ],
        },
        {
          subtitle: 'Changing Timesheet Manager',
          description:
            'If needed, you can transfer timesheet manager role to another worker on the job using the "Change Manager" option in the timesheet 3-dot menu. Note: You cannot change the manager after the timesheet is submitted. However, as an admin, you can still edit submitted timesheets if needed.',
        },
      ],
    },
    {
      title: '⚠️ Missing Timesheets',
      icon: 'solar:document-text-bold',
      content: [
        {
          subtitle: 'What are Missing Timesheets?',
          description:
            'Missing Timesheets identifies jobs where timesheets have not been submitted or are overdue. This helps you track which timesheet managers need to complete their timesheets and which workers are missing from submitted timesheets.',
        },
        {
          subtitle: 'Accessing Missing Timesheets',
          description:
            'Go to Work Management → Job → Timesheet → Missing Timesheets to view all jobs with missing or overdue timesheets.',
        },
        {
          subtitle: 'Understanding Missing Timesheets',
          description: 'A timesheet is considered missing when:',
          steps: [
            'No timesheet exists for a job (timesheet manager hasn\'t started it)',
            'Timesheet is in "Draft" status (not yet submitted)',
            'Timesheet is submitted but specific workers don\'t have entries',
          ],
        },
        {
          subtitle: 'Viewing Missing Timesheets',
          description:
            'The Missing Timesheets page shows a table with job details including job number, site, client, customer, job date, timesheet manager, and the number of missing workers.',
          steps: [
            'Use the "All" tab to see all missing timesheets',
            'Use the "Overdue" tab to see only overdue timesheets (past due date)',
            'Filter by date range, client, or search by job number, worker name, or other fields',
            'Click the expand arrow to see detailed worker information',
          ],
        },
        {
          subtitle: 'Missing Workers Details',
          description:
            'Expand any row to see which specific workers are missing from the timesheet. The expanded view shows:',
          steps: [
            'Position: Worker\'s role (LCT, TCP, Field Supervisor)',
            'Employee: Worker name with avatar',
            'Start Time: Worker\'s scheduled start time',
            'End Time: Worker\'s scheduled end time',
            'TM label: Shows if the worker is also the timesheet manager',
          ],
        },
        {
          subtitle: 'Exporting Missing Timesheets',
          description:
            'Export missing timesheets to Excel for reporting or follow-up with timesheet managers:',
          steps: [
            'Click the 3-dot menu → "Export Missing Timesheets"',
            'Select date range (or use quick select: Today, Week 1-4)',
            'Click "Export" to download Excel file',
            'Each overdue job is exported as a separate sheet',
            'Each sheet includes job details and list of missing workers',
          ],
        },
        {
          subtitle: 'Search and Filters',
          description:
            'Use the search bar and filters to find specific missing timesheets:',
          steps: [
            'Search by job number, worker name, timesheet manager, client, or site',
            'Filter by date range (defaults to last 90 days if not set)',
            'Filter by client using the autocomplete',
            'Use status tabs to filter by "All" or "Overdue"',
          ],
        },
        {
          subtitle: 'Best Practices',
          description:
            'Regularly check Missing Timesheets to ensure timely submission:',
          steps: [
            'Review overdue timesheets weekly',
            'Follow up with timesheet managers on missing submissions',
            'Export reports for payroll or compliance tracking',
            'Use the expandable rows to identify specific workers who need entries',
          ],
        },
      ],
    },
    {
      title: '🛡️ FLRA Management',
      icon: 'solar:shield-check-bold',
      content: [
        {
          subtitle: 'Monitoring FLRAs',
          description:
            'View all FLRAs at Work Management → Job → Field Level Risk Assessment. Check completion status for each job.',
        },
        {
          subtitle: 'FLRA Status',
          description: 'Track FLRA progress:',
          steps: [
            'Draft: Being completed by timesheet manager',
            'Submitted: Completed and ready for review',
          ],
        },
        {
          subtitle: 'Viewing FLRA PDFs',
          description:
            'Click the PDF icon to view the completed FLRA document. All risk assessments, diagrams, and signatures are included.',
        },
        {
          subtitle: 'FLRA Requirements',
          description:
            'Workers cannot access timesheets until the FLRA is submitted. This ensures safety protocols are followed before work begins.',
        },
      ],
    },
    {
      title: '🚧 Traffic Management Plans (TMP)',
      icon: 'solar:danger-triangle-bold',
      content: [
        {
          subtitle: 'TMP Overview',
          description:
            'Traffic Management Plans are safety documents uploaded as PDFs. Each job can have multiple TMP PDFs.',
        },
        {
          subtitle: 'Managing TMPs',
          description: 'Access TMPs at Work Management → Job → Traffic Management Plan.',
          steps: [
            'Click job number to view TMP detail page',
            'Click "Add TMP" to upload a new PDF',
            'Select PDF file from your computer',
            'Add notes about the TMP in the preview dialog',
            'Save to upload the PDF and notes',
            'Add multiple PDFs as needed (each with its own notes)',
          ],
        },
        {
          subtitle: 'Worker Confirmations',
          description:
            'Workers must confirm each TMP PDF individually before starting work. The carousel shows confirmation status for each worker per PDF.',
        },
        {
          subtitle: 'Deleting TMPs',
          description:
            'You can delete individual TMP PDFs using the delete button in the carousel. The TMP container remains (only deleted when job is deleted).',
        },
        {
          subtitle: 'TMP Status Tracking',
          description:
            'Monitor which workers have confirmed each TMP. Pending and Confirmed tabs help you track completion.',
        },
      ],
    },
    {
      title: '🚗 Vehicle Management',
      icon: 'solar:transmission-square-bold',
      content: [
        {
          subtitle: 'Adding Vehicles',
          description: 'Go to Management → Vehicles to manage your fleet.',
          steps: [
            'Click Create to add a new vehicle',
            'Enter vehicle details (make, model, year)',
            'Set license plate number',
            'Choose vehicle type',
            'Upload vehicle photo',
            'Set status (active/inactive)',
          ],
        },
        {
          subtitle: 'Assigning Vehicles to Jobs',
          description:
            'When creating/editing jobs, assign vehicles in the Vehicles section. Select the vehicle and assign an operator (must be a worker on the job).',
        },
        {
          subtitle: 'Vehicle Status',
          description:
            'Mark vehicles as Active or Inactive. Only active vehicles appear when creating jobs.',
        },
      ],
    },
    {
      title: '🏖️ Time Off Management',
      icon: 'solar:calendar-mark-bold',
      content: [
        {
          subtitle: 'Viewing Requests',
          description:
            'Go to Management → Time Off Requests to see all worker time-off requests. The menu badge shows pending request count.',
        },
        {
          subtitle: 'Approving/Rejecting Requests',
          description: 'Review each request and take action:',
          steps: [
            'View worker name, dates, reason, and notes',
            'Check for job conflicts in the date range',
            'Approve: Worker gets notification, dates block on calendar',
            'Reject: Add reason in admin notes, worker gets notified',
          ],
        },
        {
          subtitle: 'Calendar Integration',
          description:
            'Approved time-off shows as all-day events on worker calendars. The system prevents job assignments during approved time-off.',
        },
        {
          subtitle: 'Deleting Time Off',
          description:
            'You can delete pending and rejected time-off requests. Workers cannot edit approved or rejected requests - only admins can delete them.',
        },
      ],
    },
    {
      title: '📊 Calendar & Timeline',
      icon: 'solar:calendar-bold',
      content: [
        {
          subtitle: 'Admin Calendar',
          description:
            'Work Management → Calendar shows all jobs for all workers. Switch between Month, Week, Day, and List views.',
        },
        {
          subtitle: 'Timeline View',
          description:
            'Work Management → Timeline provides a Gantt-chart style view of all jobs, making it easy to see resource allocation and overlaps.',
        },
        {
          subtitle: 'Calendar Features',
          description:
            'Click any event to see job details. Events are color-coded by customer. Filter by region, worker, or date range.',
        },
      ],
    },
    {
      title: '📈 Reports & Exports',
      icon: 'solar:chart-bold',
      content: [
        {
          subtitle: 'Timesheet Export',
          description: 'Export timesheets to Excel for payroll processing:',
          steps: [
            'Go to Work Management → Job → Timesheet',
            'Apply filters (date range, customer, status, etc.)',
            'Click "Export" button',
            'Excel file downloads with all timesheet data',
            'Includes worker hours, breaks, and totals',
          ],
        },
        {
          subtitle: 'Client Export',
          description: 'Export client lists from Management → Clients with filtering options.',
        },
        {
          subtitle: 'User Export',
          description: 'Export worker data from Management → Users for reporting and analysis.',
        },
      ],
    },
    {
      title: '🎨 Advanced Features',
      icon: 'solar:widget-add-bold',
      content: [
        {
          subtitle: 'Worker Preferences',
          description:
            'Set company, site, and client preferences for workers to improve job assignments:',
          steps: [
            'Preferred: Worker likes working with this entity (green)',
            'Not Preferred: Worker prefers to avoid (yellow)',
            'Mandatory Not Preferred: Worker should never be assigned (red)',
          ],
        },
        {
          subtitle: 'Conflict Detection',
          description: 'When creating jobs, the system automatically detects and warns about:',
          steps: [
            'Time-off conflicts (worker has approved time off)',
            'Schedule overlaps (worker already assigned to another job)',
            '8-hour gap violations (insufficient rest between jobs)',
            'Mandatory restrictions (worker marked as not preferred with mandatory)',
          ],
        },
        {
          subtitle: 'Calendar Colors',
          description:
            'Assign unique colors to each customer (Management → Customers → Edit → Calendar Color). This color appears on all calendar events for that customer.',
        },
        {
          subtitle: 'Notification System',
          description:
            'The system sends automated emails and SMS for job assignments, updates, open shift postings, and time-off responses. Monitor notification delivery in the console.',
        },
        {
          subtitle: 'Job Updates & Notifications',
          description:
            'When editing jobs, the system tracks changes and lets you notify affected workers about:',
          steps: [
            'Date/time changes',
            'Site location changes',
            'Worker additions/removals',
            'Vehicle/equipment changes',
          ],
        },
      ],
    },
    {
      title: '🔧 Job Management Best Practices',
      icon: 'solar:settings-bold',
      content: [
        {
          subtitle: 'Planning Jobs',
          description:
            'Create jobs in advance when possible. This gives workers time to plan and reduces last-minute conflicts.',
        },
        {
          subtitle: 'Timesheet Manager Selection',
          description:
            "Choose an experienced worker as timesheet manager. They'll be responsible for FLRA and timesheet completion.",
        },
        {
          subtitle: 'Open Jobs vs Regular Jobs',
          description:
            'Use regular jobs when you know which workers are needed. Use open jobs when you need to fill positions on a first-come, first-served basis.',
        },
        {
          subtitle: 'Vehicle Assignment',
          description:
            'Always assign an operator to each vehicle. The operator must be a worker assigned to the job.',
        },
        {
          subtitle: 'Worker Conflicts',
          description:
            'Pay attention to conflict warnings. While you can override them, yellow and red warnings indicate potential issues:',
          steps: [
            'Yellow (8-hour gap): Worker may not have enough rest',
            'Red (overlap): Worker is double-booked',
            'Red (time-off): Worker has approved time off',
            'Red (mandatory not preferred): Worker should not be assigned',
          ],
        },
      ],
    },
    {
      title: '📋 Document Management',
      icon: 'solar:document-text-bold',
      content: [
        {
          subtitle: 'FLRA Forms',
          description:
            'Auto-created for each job. Timesheet manager completes them. View PDFs from the FLRA list page.',
        },
        {
          subtitle: 'Timesheets',
          description:
            'Auto-created with entries for each worker. Timesheet manager records times and submits.',
        },
        {
          subtitle: 'TMPs',
          description:
            'Auto-created as a container. You upload actual TMP PDF files. Workers confirm each PDF individually.',
        },
        {
          subtitle: 'Document Workflow',
          description:
            'Each job has FLRA → TMP → Timesheet flow. FLRA must be done before timesheet. All documents remain with the job for compliance.',
        },
      ],
    },
    {
      title: '🔍 Filters & Search',
      icon: 'solar:filter-bold',
      content: [
        {
          subtitle: 'Advanced Filtering',
          description: 'Most list pages support powerful filtering:',
          steps: [
            'Search by name, job number, site, etc.',
            'Filter by date range',
            'Filter by customer, client, site',
            'Filter by status',
            'Combine filters for precise results',
          ],
        },
        {
          subtitle: 'Saving Filter States',
          description:
            'Filters are saved in the URL, so you can bookmark frequently used filter combinations.',
        },
      ],
    },
    {
      title: '❓ Troubleshooting',
      icon: 'solar:help-bold',
      content: [
        {
          subtitle: "Worker Can't See Job",
          description:
            'Check: Is the job status accepted? Is the worker assigned? Did notifications send successfully?',
        },
        {
          subtitle: "Can't Assign Worker",
          description:
            'Check: Does the worker have required certifications? Do they have blocking time-off or schedule conflicts?',
        },
        {
          subtitle: 'Timesheet Not Visible',
          description:
            "Workers can only access timesheets after FLRA is submitted and if they're the timesheet manager.",
        },
        {
          subtitle: 'Notifications Not Sending',
          description:
            'Verify worker email and phone number are correct. Check that worker status is active.',
        },
        {
          subtitle: 'Changes Not Appearing',
          description:
            "Most updates appear instantly. If changes don't appear immediately, try refreshing the page.",
        },
      ],
    },
  ];

  return (
    <>
      <title>{metadata.title}</title>

      <DashboardContent>
        <CustomBreadcrumbs
          heading="Admin Guide"
          links={[{ name: 'Management' }, { name: 'Guide' }]}
          sx={{ mb: 3 }}
        />

        {/* Header */}
        <Card sx={{ p: 4, mb: 3, textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom>
            MySked Admin Guide
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 720, mx: 'auto', mb: 3 }}
          >
            Complete administrator documentation for managing jobs, workers, customers, vehicles,
            and all system operations. Everything you need to know to run MySked efficiently.
          </Typography>
          <Button variant="contained" color="primary" size="large" href="/install" sx={{ mt: 2 }}>
            Install App
          </Button>
        </Card>

        {/* Table of Contents */}
        <Card sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Quick Navigation
          </Typography>
          <Stack spacing={1} sx={{ mt: 2 }}>
            {sections.map((section, index) => (
              <Button
                key={index}
                variant="text"
                color="inherit"
                href={`#section-${index}`}
                sx={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                }}
              >
                {section.title}
              </Button>
            ))}
          </Stack>
        </Card>

        {/* Guide Sections */}
        <Stack spacing={3}>
          {sections.map((section, sectionIndex) => (
            <Card
              key={sectionIndex}
              id={`section-${sectionIndex}`}
              sx={{
                p: 4,
                scrollMarginTop: '100px',
              }}
            >
              <Typography variant="h4" sx={{ mb: 3 }}>
                {section.title}
              </Typography>

              <Stack spacing={3}>
                {section.content.map((item, itemIndex) => (
                  <Box key={itemIndex}>
                    <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
                      {item.subtitle}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      {item.description}
                    </Typography>
                    {item.steps && (
                      <Box
                        component="ul"
                        sx={{
                          pl: 3,
                          mt: 1,
                          '& li': {
                            mb: 0.5,
                            color: 'text.secondary',
                          },
                        }}
                      >
                        {item.steps.map((step, stepIndex) => (
                          <li key={stepIndex}>
                            <Typography variant="body2">{step}</Typography>
                          </li>
                        ))}
                      </Box>
                    )}
                    {itemIndex < section.content.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                ))}
              </Stack>
            </Card>
          ))}
        </Stack>

        {/* Help Footer */}
        <Card
          sx={{
            p: 4,
            mt: 3,
            textAlign: 'center',
            bgcolor: alpha(theme.palette.success.main, 0.08),
          }}
        >
          <Typography variant="h5" gutterBottom>
            Questions or Feedback?
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            This guide covers the main features of MySked. As the system evolves, new features will
            be added.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            💡 Tip: Bookmark this page for quick reference
          </Typography>
          
          {/* Version Info */}
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              MySked {getVersionInfo()} • Last updated: {new Date().toLocaleDateString()}
            </Typography>
          </Box>
        </Card>
      </DashboardContent>
    </>
  );
}


