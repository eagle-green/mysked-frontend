import dayjs from 'dayjs';
import { ReactNode, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify/iconify';

//----------------------------------------------------------------------------------------------------

type Props = {
  data: {
    incident_report: {
      id: string;
      jobNumber: string;
      incidentType: string;
      incidentDate: Date;
      incidentTime: Date;
      reportDescription: string;
      reportDate: Date;
      reportedBy: {
        name: string;
        photo_logo_url: string | null;
        role: string;
      };
      incidentSeverity: string;
    };
    job: {
      id: string;
      job_number: string;
      po_number: string;
      site: {
        name: string;
        street_number: string;
        street_name: string;
        city: string;
        province: string;
        postal_code: string;
        country: string;
        display_address: string;
      };
      client: {
        name: string;
        client_logo_url: string | null;
        client_name: string | null;
      };
    };
  };
};

export function AdminIncidentReportDetail({ data }: Props) {
  const { incident_report, job } = data;
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'center',
          alignItems: 'stretch',
          gap: 3,
          width: '100%',
        }}
      >
        <Card sx={{ mt: 3, flex: 2 }}>
          <Box sx={{ p: 3, display: 'flex', gap: 2, flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Job Incident Report Detail
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                gap: 2,
                width: '100%',
              }}
            >
              <TextContent
                title="Date of Incident"
                content={dayjs(incident_report.incidentDate).format('YYYY-MM-DD')}
              />

              <TextContent
                title="Time of Incident"
                content={dayjs(incident_report.incidentTime).format('HH:MM A')}
              />
            </Box>
            <Divider flexItem orientation="horizontal" sx={{ borderStyle: 'dashed', flex: 1 }} />
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                gap: 2,
                width: '100%',
              }}
            >
              <TextContent title="Incident Report Type" content={incident_report.incidentType} />

              <TextContent title="Severity" content={incident_report.incidentSeverity} />
            </Box>

            <Divider flexItem orientation="horizontal" sx={{ borderStyle: 'dashed', flex: 1 }} />
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                gap: 2,
                width: '100%',
              }}
            >
              <TextContent title="Report Description" content={incident_report.reportDescription} />
            </Box>
          </Box>
        </Card>

        <Card sx={{ mt: 3, flex: 1 }}>
          <Box sx={{ p: 3, display: 'flex', gap: 2, flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Job Detail
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                gap: 2,
                width: '100%',
              }}
            >
              <TextContent
                title="Job #"
                content={job.job_number}
                icon={<Iconify icon="solar:case-minimalistic-bold" />}
              />

              <TextContent
                title="Site"
                content={job.site.display_address}
                icon={<Iconify icon="mingcute:location-fill" />}
              />

              <TextContent
                title="CLIENT"
                content={job?.client?.name || 'CLIENT NAME'}
                icon={
                  <Avatar
                    src={job?.client?.client_logo_url || undefined}
                    alt={job?.client?.client_name as string}
                    sx={{ width: 32, height: 32 }}
                  >
                    {job?.client?.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                }
              />
            </Box>
          </Box>
        </Card>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'center',
          alignItems: 'stretch',
          gap: 3,
          width: '100%',
        }}
      >
        <Card sx={{ mt: 3, flex: 2 }}>
          <Box sx={{ p: 3, display: 'flex', gap: 2, flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Evidence / Attachements
            </Typography>

            {!evidenceImages.length ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 150,
                    height: 150,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'action.hover',
                    borderRadius: 1,
                  }}
                >
                  <Box
                    component="svg"
                    xmlns="http://www.w3.org/2000/svg"
                    width={150}
                    height={150}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    sx={{ color: 'text.disabled' }}
                  >
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                  </Box>
                </Box>

                <Box
                  sx={{
                    width: 150,
                    height: 150,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'action.hover',
                    borderRadius: 1,
                  }}
                >
                  <Box
                    component="svg"
                    xmlns="http://www.w3.org/2000/svg"
                    width={150}
                    height={150}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    sx={{ color: 'text.disabled' }}
                  >
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                  </Box>
                </Box>

                <Box
                  sx={{
                    width: 150,
                    height: 150,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'action.hover',
                    borderRadius: 1,
                  }}
                >
                  <Box
                    component="svg"
                    xmlns="http://www.w3.org/2000/svg"
                    width={150}
                    height={150}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    sx={{ color: 'text.disabled' }}
                  >
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                  </Box>
                </Box>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {evidenceImages.map((image, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                    <Box
                      sx={{
                        position: 'relative',
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Box
                        component="img"
                        src={image}
                        alt={`Evidence ${index + 1}`}
                        sx={{
                          width: '100%',
                          height: 200,
                          objectFit: 'contain',
                          borderRadius: 1,
                          bgcolor: 'background.neutral',
                        }}
                      />
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Image {index + 1}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Card>

        <Card sx={{ mt: 3, flex: 1 }}>
          <Box sx={{ p: 3, display: 'flex', gap: 2, flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Reporter Details
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                gap: 2,
                width: '100%',
              }}
            >
              <TextContent
                title="Reported By"
                content={incident_report.reportedBy.name}
                icon={
                  <Avatar
                    src={incident_report.reportedBy.photo_logo_url || undefined}
                    alt={incident_report.reportedBy.name}
                    sx={{ width: 32, height: 32 }}
                  >
                    {job?.client?.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                }
              />

              <TextContent
                title="Role"
                content={incident_report.reportedBy.role}
                icon={<Iconify icon="solar:user-id-bold" />}
              />
            </Box>
          </Box>
        </Card>
      </Box>
    </>
  );
}

type TypeProps = {
  title: string;
  content: string;
  icon?: ReactNode;
};
export function TextContent({ title, content, icon }: TypeProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        flex: 1,
      }}
    >
      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
        {title}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {icon}
        <Box sx={{ flex: 1 }}>{content}</Box>
      </Box>
    </Box>
  );
}
