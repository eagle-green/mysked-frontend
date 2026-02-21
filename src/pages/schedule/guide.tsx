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

type ContentItem = {
  subtitle: string;
  description: string;
  steps?: string[];
  link?: {
    text: string;
    href: string;
  };
};

type Section = {
  title: string;
  content: ContentItem[];
};

const metadata = { title: `Worker Guide - ${CONFIG.appName}` };

export default function WorkerGuidePage() {
  const theme = useTheme();

  const sections: Section[] = [
    {
      title: '📅 Getting Started',
      content: [
        {
          subtitle: 'Dashboard Overview',
          description:
            'Your dashboard shows your upcoming shifts, pending assignments, and quick access to all features. Use the calendar view to see your schedule at a glance.',
        },
        {
          subtitle: 'Mobile App (PWA)',
          description:
            "MySked works as a Progressive Web App (PWA). Install it on your phone for the best mobile experience - you'll get push notifications, offline access, and it works just like a native app. The app icon will appear on your home screen.",
        },
        {
          subtitle: 'How to Install on Your Phone',
          description:
            'For detailed step-by-step installation instructions for iPhone, iPad, and Android devices, visit the Install App page. The installation process is simple and takes less than a minute.',
          link: {
            text: 'Go to Install App Page →',
            href: '/install',
          },
        },
      ],
    },
    {
      title: '💼 My Jobs',
      content: [
        {
          subtitle: 'Viewing Your Jobs',
          description:
            'Go to My Schedule → Work → List to see all your assigned jobs. Jobs show the site name, address, client, customer, and your shift times.',
        },
        {
          subtitle: 'Job Status',
          description:
            "When assigned to a job, you'll receive an email and SMS notification. You must accept or decline the assignment within the specified timeframe. Accepted jobs appear in your calendar and job list.",
          steps: [
            'Pending: Waiting for your response',
            'Accepted: You confirmed the assignment',
            'Rejected: You rejected the assignment',
          ],
        },
        {
          subtitle: 'Job Details',
          description:
            'Each job shows important information including site location (tap to open in maps), start/end times, your position (LCT, TCP, or Field Supervisor), and the timesheet manager.',
        },
      ],
    },
    {
      title: '🔓 Open Shift Opportunities',
      content: [
        {
          subtitle: 'What are Open Shifts?',
          description:
            "Open shifts are available positions that you can apply for. These appear when the company needs workers for specific positions but hasn't assigned anyone yet.",
        },
        {
          subtitle: 'Applying for Open Shifts',
          description:
            "You'll receive SMS and email notifications about open shifts matching your certifications. Click the link to review details and apply. Open shifts are first-come, first-served.",
          steps: [
            'Review the shift details (date, time, site, position)',
            "Check if you're available",
            'Click "Apply for This Shift"',
            'If successful, the job is yours immediately',
          ],
        },
        {
          subtitle: 'After Applying',
          description:
            'Once you successfully apply, the shift immediately appears in your job list and calendar.',
        },
      ],
    },
    {
      title: '⏱️ Timesheets',
      content: [
        {
          subtitle: 'Accessing Timesheets',
          description:
            'Go to My Schedule → Work → Timesheet to see all your timesheets. Each timesheet corresponds to a job and tracks your work hours.',
        },
        {
          subtitle: 'Recording Your Time',
          description:
            "Only the timesheet manager can edit and submit timesheets. If you're the timesheet manager for a job:",
          steps: [
            'Open the timesheet for your job',
            'For each worker, record: MOB (Mobilization) checkbox if applicable',
            'Record shift start time',
            'Enter break duration in minutes',
            'Record shift end time',
            'Add your initials to confirm',
            'Submit the timesheet for review',
          ],
        },
        {
          subtitle: 'Timesheet Status',
          description: 'Track your timesheet through its lifecycle:',
          steps: [
            'Draft: Being filled out by timesheet manager',
            'Submitted: Sent to admin for review',
          ],
        },
        {
          subtitle: 'Important Notes',
          description:
            'You must complete the FLRA (Field Level Risk Assessment) before accessing the timesheet. Break times are calculated automatically. All times are recorded in your local timezone.',
        },
      ],
    },
    {
      title: '🛡️ Field Level Risk Assessment (FLRA)',
      content: [
        {
          subtitle: 'What is FLRA?',
          description:
            'A Field Level Risk Assessment is a safety form that must be completed before starting work on any job. It identifies potential hazards and control measures.',
        },
        {
          subtitle: 'Completing the FLRA',
          description:
            'Access your FLRA from My Schedule → Work → Field Level Risk Assessment. Only the timesheet manager completes the FLRA for each job.',
          steps: [
            'Fill in Assessment Details (site info, times, hospital)',
            'Complete Description of Work (road type, weather, conditions)',
            'Define Scope of Work (lane closures, traffic control)',
            'Complete the Present Safety section',
            'Assess all Risk Factors (visibility, weather, traffic, etc.)',
            'Add Traffic Control Plans as needed',
            'Review and add any updates',
            'Upload FLRA Diagram if required',
            'Sign and submit',
          ],
        },
        {
          subtitle: 'Risk Assessment',
          description:
            'For each risk factor (visibility, weather, traffic volume, etc.), select High, Medium, or Low. The overall risk level is calculated automatically based on the highest individual risk.',
        },
        {
          subtitle: 'Submission',
          description:
            'After submitting the FLRA, a PDF copy is generated and stored with the job. You can still edit the FLRA if needed by accessing it again from the FLRA list. You must complete the FLRA before accessing the timesheet.',
        },
      ],
    },
    {
      title: '🚧 Traffic Management Plan (TMP)',
      content: [
        {
          subtitle: 'What is TMP?',
          description:
            'A Traffic Management Plan is a safety document that outlines how traffic will be managed during the job. Multiple TMP PDFs can be uploaded for each job.',
        },
        {
          subtitle: 'Viewing TMPs',
          description:
            'Go to My Schedule → Work → Traffic Management Plan to see all jobs with TMPs. Click on a job number to view the TMP details and PDFs.',
        },
        {
          subtitle: 'Confirming TMPs',
          description: 'You must confirm each TMP PDF individually before starting work:',
          steps: [
            'Open the TMP detail page for your job',
            'Review each uploaded PDF in the carousel',
            'Click "Confirm This TMP" for each PDF',
            'Check the acknowledgment box',
            'Click "Confirm" in the dialog',
            'Repeat for each TMP PDF (if multiple)',
          ],
        },
        {
          subtitle: 'TMP Status',
          description:
            'Your confirmation status is tracked per PDF. Tabs show Pending and Confirmed TMPs. Once you confirm a TMP, it shows a "You have confirmed this TMP" badge.',
        },
      ],
    },
    {
      title: '🏖️ Time Off Requests',
      content: [
        {
          subtitle: 'Requesting Time Off',
          description:
            'Go to My Schedule → Time Off Request → Create to submit a new request. You can request time off up to 2 weeks in advance. The system limits time-off requests to ensure adequate staffing (maximum 10% of workers per role can be off simultaneously).',
          steps: [
            'Select the start date and end date (up to 2 weeks in advance)',
            'Choose the reason (vacation, sick leave, personal, etc.)',
            'Add any notes explaining your request',
            'Click "Create Time Off Request"',
            'Wait for admin approval',
          ],
        },
        {
          subtitle: 'Request Status',
          description: 'Track your requests in the Time Off list:',
          steps: [
            'Pending: Waiting for admin review',
            'Approved: Admin accepted your request',
            'Rejected: Admin declined (check notes for reason)',
          ],
        },
        {
          subtitle: 'Calendar Display',
          description:
            "Approved time-off requests appear as all-day events in your calendar, helping you and admins see when you're unavailable for assignments.",
        },
        {
          subtitle: 'Editing Requests',
          description:
            'You can edit or delete pending requests. Once approved or rejected, contact an admin to make changes.',
        },
      ],
    },
    {
      title: '🚗 My Vehicle',
      content: [
        {
          subtitle: 'Accessing Your Vehicle',
          description:
            'If you have a vehicle assigned to you, you\'ll see a "Vehicle" menu item under My Schedule. Click it to view your assigned vehicle information. The menu item only appears when you have a vehicle assigned.',
        },
        {
          subtitle: 'Vehicle Information',
          description:
            'The Vehicle Info tab displays all details about your assigned vehicle in read-only format, including license plate, unit number, vehicle type, region, status, and assigned driver information.',
        },
        {
          subtitle: 'Vehicle Pictures',
          description:
            'The Pictures tab shows all photos associated with your vehicle. You can view pictures organized by section (Front, Back, Left, Right, Inside, Other). Each picture shows the uploader\'s name and avatar, upload date, title, memo, and file size.',
        },
        {
          subtitle: 'Vehicle Inventory',
          description:
            'The Inventory tab displays all inventory items assigned to your vehicle. You can view current quantities, required quantities, and stock status. Use the "Audit Inventory" feature to update multiple item quantities at once, which will be recorded in the vehicle history.',
          steps: [
            'View all inventory items with their current and required quantities',
            'Click on a quantity to edit it inline',
            'Use "Audit Inventory" to update multiple items at once',
            'All changes are tracked in the vehicle history',
          ],
        },
        {
          subtitle: 'Vehicle History',
          description:
            'The History tab shows a complete log of all changes made to your vehicle, including vehicle info updates, picture additions/deletions, inventory changes, and audit records. You can filter by type (All, Vehicle Info, Picture, Inventory, Audit) and navigate through pages for long history lists.',
        },
      ],
    },
    {
      title: '🔍 Auditing Vehicles (Field Supervisors)',
      content: [
        {
          subtitle: 'Vehicle Auditing',
          description:
            'As a Field Supervisor, you can audit inventory for vehicles assigned to other workers. This allows you to verify and update inventory quantities during site visits.',
        },
        {
          subtitle: 'Accessing Audit Vehicles',
          description:
            'Go to Management → Vehicle → Audit Vehicles to see a list of all vehicles assigned to workers. The page is mobile-friendly for on-site auditing.',
        },
        {
          subtitle: 'Auditing Process',
          description: 'To audit a vehicle\'s inventory:',
          steps: [
            'Find the vehicle you want to audit in the list',
            'Click "Audit Inventory" button for that vehicle',
            'Review current quantities for all inventory items',
            'Update quantities as needed in the audit dialog',
            'Click "Save Audit" to record all changes',
            'The audit is logged in the vehicle\'s history',
          ],
        },
        {
          subtitle: 'Mobile Auditing',
          description:
            'The Audit Vehicles page is optimized for mobile devices. On your phone, vehicles are displayed as cards with all key information visible, and the audit dialog is full-screen for easy quantity updates.',
        },
      ],
    },
    {
      title: '📆 Calendar',
      content: [
        {
          subtitle: 'Calendar Views',
          description:
            'Your calendar shows all accepted jobs and approved time-off requests. Switch between different views:',
          steps: [
            'Month: Overview of the entire month',
            'Week: Detailed week view with time slots',
            'Day: Focus on a single day',
            'List: Linear list of all events',
          ],
        },
        {
          subtitle: 'Job Details from Calendar',
          description:
            'Click any job event in the calendar to see a quick detail dialog with site info, client, customer, workers, vehicles, and times.',
        },
        {
          subtitle: 'Color Coding',
          description:
            'Events are color-coded by customer (company). Each customer has a unique calendar color to help you quickly identify which company the job is for.',
        },
      ],
    },
    {
      title: '🔔 Notifications',
      content: [
        {
          subtitle: 'Email Notifications',
          description:
            "You'll receive emails for job assignments, open shift opportunities, and job updates. Emails include direct action links.",
        },
        {
          subtitle: 'SMS Notifications',
          description:
            'Text messages are sent for urgent items like new job assignments and open shift postings. Click the link in the SMS to take action immediately.',
        },
        {
          subtitle: 'Notification Actions',
          description:
            "Most notifications include quick action links that work even when you're not logged in (time-limited for security). You can accept/decline jobs or apply for open shifts directly from the link.",
        },
      ],
    },
    {
      title: '👤 Profile & Settings',
      content: [
        {
          subtitle: 'Updating Your Profile',
          description:
            'Click your avatar in the top right → Profile to update your information, contact details, and photo.',
        },
        {
          subtitle: 'Certifications',
          description:
            "Your certifications (LCT, TCP, Field Supervisor) determine which positions you can work and which open shifts you're notified about. You can upload your certifications and documents in your profile under the Certifications tab.",
        },
      ],
    },
    {
      title: '❓ Tips & Best Practices',
      content: [
        {
          subtitle: 'Response Time',
          description:
            'Respond to job assignments promptly - action links in emails/SMS expire after 48 hours for security.',
        },
        {
          subtitle: 'Check FLRA First',
          description:
            'Always review the FLRA before starting a job to understand site hazards and safety measures.',
        },
        {
          subtitle: 'Accurate Time Recording',
          description:
            "If you're the timesheet manager, record times accurately including shift start/end times and break duration. This affects payroll and billing.",
        },
        {
          subtitle: 'Plan Ahead',
          description:
            'Submit time-off requests well in advance. Check your calendar regularly to avoid scheduling conflicts.',
        },
        {
          subtitle: 'Mobile App',
          description:
            'Install the PWA on your phone for push notifications, offline access, and a native app experience.',
        },
      ],
    },
  ];

  return (
    <>
      <title>{metadata.title}</title>

      <DashboardContent>
        <CustomBreadcrumbs
          heading="Worker Guide"
          links={[{ name: 'My Schedule' }, { name: 'Guide' }]}
          sx={{ mb: 3 }}
        />

        {/* Header */}
        <Card sx={{ p: 4, mb: 3, textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom>
            Welcome to MySked
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 730, mx: 'auto', mb: 3 }}
          >
            Your complete guide to managing your work schedule, timesheets, safety documents, and
            time-off requests. This guide covers everything you need to know to use the MySked
            system effectively.
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
                scrollMarginTop: '100px', // Offset for sticky header
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
                    {item.link && (
                      <Button
                        variant="outlined"
                        color="primary"
                        href={item.link.href}
                        sx={{ mt: 1, mb: 2 }}
                      >
                        {item.link.text}
                      </Button>
                    )}
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
          sx={{ p: 4, mt: 3, textAlign: 'center', bgcolor: alpha(theme.palette.info.main, 0.08) }}
        >
          <Typography variant="h5" gutterBottom>
            Need More Help?
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            If you have questions or encounter any issues, please contact your supervisor or the
            MySked admin team.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            📧 For technical support, check with your company administrator
          </Typography>
          
          {/* Version Info */}
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(theme.palette.info.main, 0.2)}` }}>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              MySked {getVersionInfo()} • Last updated: {new Date().toLocaleDateString()}
            </Typography>
          </Box>
        </Card>
      </DashboardContent>
    </>
  );
}
