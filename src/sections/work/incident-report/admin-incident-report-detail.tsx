import dayjs from 'dayjs';
import { ReactNode, useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { Label } from 'src/components/label/label';
import { Iconify } from 'src/components/iconify/iconify';

import { IJob } from 'src/types/job';
import { IIncidentReport } from 'src/types/incident-report';

//----------------------------------------------------------------------------------------------------

type Props = {
  data: {
    incident_report: IIncidentReport;
    job: IJob;
    workers: any[];
    comments: any[];
  };
};

export function AdminIncidentReportDetail({ data }: Props) {
  const { incident_report, job, comments, workers } = data;
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const commentDialog = useBoolean();

  const getSeverityColor = (status: string) => {
    switch (status) {
      case 'minor':
        return 'info';
      case 'moderate':
        return 'warning';
      case 'high':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };
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
        <Card sx={{ mt: 3, flex: 3 }}>
          <Box sx={{ p: 3, display: 'flex', gap: 2, flexDirection: 'column' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexDirection: 'row',
              }}
            >
              <Typography variant="h6">Job Incident Report Detail</Typography>
              <Label variant="soft" color={getStatusColor(incident_report.status)}>
                {incident_report.status}
              </Label>
            </Box>

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
                content={dayjs(incident_report.dateOfIncident).format('YYYY-MM-DD')}
              />

              <TextContent
                title="Time of Incident"
                content={dayjs(incident_report.timeOfIncident).format('HH:MM A')}
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

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  flex: 1,
                }}
              >
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  Severity
                </Typography>
                <Box>
                  <Label variant="soft" color={getSeverityColor(incident_report.incidentSeverity)}>
                    {incident_report.incidentSeverity}
                  </Label>
                </Box>
              </Box>
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
                content={job.site?.display_address || '-'}
                icon={<Iconify icon="mingcute:location-fill" />}
              />

              <TextContent
                title="Client"
                content={job?.client?.name || 'CLIENT NAME'}
                icon={
                  <Avatar
                    src={job?.client?.logo_url || undefined}
                    alt={job?.client?.name as string}
                    sx={{ width: 32, height: 32 }}
                  >
                    {job?.client?.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                }
              />

              <TextContent
                title="Reported By"
                content={incident_report.reportedBy?.name as string}
                icon={
                  <Avatar
                    src={incident_report.reportedBy?.photo_logo_url || undefined}
                    alt={incident_report.reportedBy?.name}
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
        <Card sx={{ mt: 3, flex: 3 }}>
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
            <Typography variant="h6">Workers</Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                gap: 2,
                width: '100%',
              }}
            >
              {workers.map((worker, index) => (
                <Box
                  key={`${worker.id}-${index}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Avatar
                      src={worker?.photo_url || undefined}
                      alt={worker.display_name}
                      sx={{ width: 32, height: 32 }}
                    >
                      {`${worker.first_name} ${worker.last_name}`?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1">
                        {`${worker.first_name} ${worker.last_name} (${worker.position.toUpperCase()})`}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Card>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'center',
          alignItems: 'center',
          gap: 3,
          width: '100%',
        }}
      >
        <Card sx={{ mt: 3, flex: 1 }}>
          <Box
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              gap: 2,
              width: '100%',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <Button variant="contained" onClick={commentDialog.onTrue} color="success">
                Add Comment
              </Button>
            </Box>
            {comments?.map((comment, index) => (
              <Box
                key={`${comment.user.id}-${index}`}
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                  gap: 1,
                  width: '100%',
                  flexDirection: 'row',
                }}
              >
                <Box sx={{ width: 50 }}>
                  <Avatar
                    src={comment?.user.photo_logo || undefined}
                    alt={comment?.user.name as string}
                    sx={{ width: 32, height: 32 }}
                  >
                    {comment.user?.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                </Box>

                <Card sx={{ borderRadius: 1, flex: 1 }}>
                  <Box sx={{ px: 2, pb: 2 }}>
                    <Box sx={{ py: 1 }}>
                      <Typography variant="caption">{comment.user?.name}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2">{comment.description}</Typography>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      <Typography typography="caption" color="text.disabled">
                        Posted Date :
                        {` ${dayjs(comment.posted_date).format('MMM DD YYYY')} at ${dayjs(comment.posted_date).format('hh:mm a')}`}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              </Box>
            ))}
          </Box>
        </Card>
      </Box>

      <Dialog
        fullWidth
        maxWidth={false}
        open={commentDialog.value}
        onClose={commentDialog.onFalse}
        slotProps={{
          paper: {
            sx: { maxWidth: 720 },
          },
        }}
      >
        <DialogTitle>Write a comment</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              p: 3,
            }}
          >
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Add your progress update or comment ..."
              name="comment"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                },
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={commentDialog.onFalse}>
            Close
          </Button>

          <Button type="submit" variant="contained" onClick={commentDialog.onFalse}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
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
