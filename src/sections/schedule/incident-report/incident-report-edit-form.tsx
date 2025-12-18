import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { ReactNode, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import useMediaQuery from '@mui/material/useMediaQuery';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks/use-router';

import { useUpdateIncidentReportRequest } from 'src/actions/incident-report';

import { toast } from 'src/components/snackbar';
import { Label } from 'src/components/label/label';
import { Form, Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify/iconify';

import { IJob, IJobWorker } from 'src/types/job';
import { IIncidentReport } from 'src/types/incident-report';

//------------------------------------------------------------------------------------------------

type Props = {
  data: {
    incident_report: IIncidentReport;
    job: IJob;
    workers: any[];
    comments: any[];
  };
};

const INCIDENT_SEVERITY = [
  { label: 'Minor', caption: '(No injuries, no major disruptions)', value: 'minor' },
  {
    label: 'Moderate',
    caption: '(Injuries reported, traffic flow disrupted temporarily)',
    value: 'moderate',
  },
  {
    label: 'Severe',
    caption: '(Serious injuries or fatalities, major traffic disruption)',
    value: 'severe',
  },
];

const INCIDENT_REPORT_TYPE = [
  { label: 'Traffic Accident', value: 'traffic accident' },
  { label: 'Equipment Malfunction', value: 'equipment malfunction' },
  { label: 'Safety Violation', value: 'safety violation' },
  { label: 'Unauthorized Access', value: 'unauthorized access' },
  { label: 'Construction Site Disruption', value: 'construction site disruption' },
  { label: 'Weather/Environmental Incident', value: 'wetaher incident' },
  { label: 'Personnel Injury/Accident', value: 'personnel accident' },
  { label: 'Traffic Signal Failure', value: 'traffic signal failure' },
  { label: 'Road Blockage/Obstruction', value: 'road obstruction' },
  { label: 'Work Zone Inadequacy', value: 'work zone inadequacy' },
  { label: 'Public Interaction or Dispute', value: 'public interaction' },
  { label: 'Other', value: 'others' },
];

export function EditIncidentReportForm({ data }: Props) {
  const { incident_report, job, workers, comments } = data;
  const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const commentDialog = useBoolean();
  const updateIncidentRequest = useUpdateIncidentReportRequest();

  const methods = useForm<any>({
    mode: 'onSubmit',
    defaultValues: incident_report,
  });

  const {
    handleSubmit,
    setValue,
    formState: { isSubmitting, isValid },
  } = methods;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateIncidentRequest.mutateAsync({ id: incident_report.id as string, data: values });
      toast.success('Incident report udapted successfully!');
      router.push(paths.schedule.work.incident_report.root);
    } catch (error: any) {
      console.error('Error updating incident report:', error);
    }
  });

  const handleRemoveAll = () => {
    setEvidenceImages([]);
    setValue('evidence', null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // Resize if too large (max 1920px on longest side)
          const maxSize = 1920;
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to JPEG with 85% quality for good balance
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressed);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newImages: string[] = [];

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          try {
            const compressed = await compressImage(file);
            newImages.push(compressed);
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
          }
        }

        // Update state with all successfully processed images
        const updatedImages = [...evidenceImages, ...newImages];
        setEvidenceImages(updatedImages);
        setValue('evidence', JSON.stringify(updatedImages));
      } catch (error) {
        console.error('Error in file upload:', error);
      }
    }
  };

  const handleCameraCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        const updatedImages = [...evidenceImages, compressed];
        setEvidenceImages(updatedImages);
        setValue('evidence', JSON.stringify(updatedImages));
      } catch (error) {
        console.error('Error processing camera file:', error);
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = evidenceImages.filter((_, i) => i !== index);
    setEvidenceImages(updatedImages);
    // Store as JSON array string, or null if empty
    setValue('evidence', updatedImages.length > 0 ? JSON.stringify(updatedImages) : null);

    // Clear file inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
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
      <Stack
        divider={
          <Divider
            flexItem
            orientation={mdUp ? 'vertical' : 'horizontal'}
            sx={{ borderStyle: 'dashed' }}
          />
        }
        sx={{ p: 2, gap: { xs: 3, md: 5 }, flexDirection: { xs: 'column', md: 'row' } }}
      >
        <Stack sx={{ flex: 1 }}>
          <TextBoxContainer
            title="JOB #"
            content={job?.job_number}
            icon={<Iconify icon="solar:case-minimalistic-bold" />}
          />

          <TextBoxContainer
            title="PO # | NW #"
            content={job?.po_number}
            icon={<Iconify icon="solar:flag-bold" />}
          />
        </Stack>

        <Stack sx={{ flex: 1 }}>
          <TextBoxContainer
            title="SITE"
            content={job?.site?.display_address}
            icon={<Iconify icon="mingcute:location-fill" />}
          />

          <TextBoxContainer
            title="CLIENT"
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
        </Stack>

        <Stack sx={{ flex: 1 }}>
          <TextBoxContainer
            title="REPORTED BY"
            content={incident_report.reportedBy?.name || ''}
            icon={
              <Avatar
                src={incident_report.reportedBy?.photo_logo_url || undefined}
                alt={incident_report.reportedBy?.name || ''}
                sx={{ width: 32, height: 32 }}
              >
                {job?.client?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
            }
          />

          <TextBoxContainer
            title="ROLE"
            content={incident_report.reportedBy?.role}
            icon={<Iconify icon="solar:user-id-bold" />}
          />
        </Stack>
      </Stack>

      <Form methods={methods} onSubmit={onSubmit}>
        <Card sx={{ mt: 3 }}>
          <Box sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="h6" sx={{ mb: 3 }}>
                Job Incident Report Detail
              </Typography>
              <Typography variant="h6" sx={{ mb: 3 }}>
                <Label variant="soft" color={getStatusColor(incident_report.status)}>
                  {incident_report.status}
                </Label>
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 2,
                width: '100%',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  justifyContent: { xs: 'flex-start', md: 'center' },
                  alignItems: { sm: 'flex-start', md: 'center' },
                  gap: 2,
                  width: '100%',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    gap: 1,
                    width: '100%',
                  }}
                >
                  <Field.DatePicker
                    name="dateOfIncident"
                    label="Date of Incident"
                    disabled
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: false,
                        disabled: true,
                      },
                    }}
                  />

                  <Field.TimePicker
                    name="timeOfIncident"
                    label="Time of Incident"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                      },
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    width: '100%',
                  }}
                >
                  <Field.Select name="incidentType" label="Incident Report Type *">
                    {INCIDENT_REPORT_TYPE.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Field.Select>
                </Box>

                <Box
                  sx={{
                    width: '100%',
                  }}
                >
                  <Field.Select name="incidentSeverity" label="Incident Severity *">
                    {INCIDENT_SEVERITY.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                        <Typography variant="caption" color="text.disabled" sx={{ pl: 1 }}>
                          {option.caption}
                        </Typography>
                      </MenuItem>
                    ))}
                  </Field.Select>
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <Field.Text
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Report Description"
                  name="reportDescription"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'background.paper',
                    },
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Card>

        <Card sx={{ mt: 3 }}>
          <Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 3,
              }}
            >
              <Typography variant="h6" sx={{ my: 1 }}>
                Workers
                <Typography typography="caption" color="text.disabled">
                  List all personnel present or involved in this incident
                </Typography>
              </Typography>
            </Box>

            {workers.map((worker, index) => (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: { xs: 'flex-start', md: 'center' },
                  justifyContent: { xs: 'center', md: 'flex-start' },
                  gap: 2,
                  p: 2,
                }}
                key={`${worker.user_id}-${index}`}
              >
                <Field.AutocompleteWithAvatar
                  fullWidth
                  size="small"
                  name="worker_id"
                  label="Worker"
                  value={worker}
                  options={workers}
                  disabled
                />
                <Field.Text
                  fullWidth
                  size="small"
                  name="worker_email"
                  label="Worker Email"
                  value={worker.email}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'background.paper',
                    },
                  }}
                  disabled
                />
                <Field.Text
                  fullWidth
                  size="small"
                  name="worker_position"
                  label="Position"
                  value={worker?.position?.toUpperCase() || '-'}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'background.paper',
                    },
                  }}
                  disabled
                />
              </Box>
            ))}
          </Box>
        </Card>

        <Card sx={{ mt: 3 }}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Evidence / Attachments
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Please upload any relevant images or take photos that can help validate your
                  report. These images will be important for documenting the incident accurately.
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: 2,
                  alignItems: 'flex-start',
                }}
              >
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="solar:camera-add-bold" />}
                  onClick={() => cameraInputRef.current?.click()}
                  sx={{ minWidth: 200, width: { xs: '100%', md: 200 } }}
                >
                  Take Photo
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="solar:import-bold" />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ minWidth: 200, width: { xs: '100%', md: 200 } }}
                >
                  Upload Images
                </Button>

                {evidenceImages.length > 0 && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                    onClick={handleRemoveAll}
                    sx={{ minWidth: 200, width: { xs: '100%', md: 200 } }}
                  >
                    Remove All ({evidenceImages.length})
                  </Button>
                )}
              </Box>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                style={{ display: 'none' }}
              />

              {/* Images preview in grid */}
              {evidenceImages.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Evidence / Attachments ({evidenceImages.length}):
                  </Typography>
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
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveImage(index)}
                              sx={{ ml: 'auto' }}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" />
                            </IconButton>
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {evidenceImages.length === 0 && (
                <Box
                  sx={{
                    border: 2,
                    borderColor: 'divider',
                    borderStyle: 'dashed',
                    borderRadius: 1,
                    p: 4,
                    textAlign: 'center',
                    color: 'text.secondary',
                  }}
                >
                  <Iconify
                    icon="solar:gallery-add-bold"
                    width={48}
                    height={48}
                    sx={{ mb: 2, opacity: 0.5 }}
                  />
                  <Typography variant="body2">
                    No image added yet. Please take photos or upload images to include in your
                    report.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Card>

        <Card sx={{ mt: 3 }}>
          <Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 3,
              }}
            >
              <Typography variant="h6" sx={{ my: 1 }}>
                Comments
                <Typography typography="caption" color="text.disabled">
                  List all personnel present or involved in this incident
                </Typography>
              </Typography>

              <Button variant="contained" onClick={commentDialog.onTrue} color="success">
                Add Comment
              </Button>
            </Box>

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
          </Box>
        </Card>

        <Box sx={{ pt: 3, display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
          <Button
            variant="outlined"
            size="large"
            onClick={() => router.push(paths.schedule.work.incident_report.root)}
          >
            Cancel
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              size="large"
              variant="contained"
              onClick={onSubmit}
              disabled={!isValid || isSubmitting}
              startIcon={<Iconify icon="solar:check-circle-bold" />}
              color="success"
            >
              {isSubmitting ? 'Updating ...' : 'Update'}
            </Button>
          </Box>
        </Box>
      </Form>

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

          <Button
            type="submit"
            variant="contained"
            loading={isSubmitting}
            onClick={commentDialog.onFalse}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

type TextProps = {
  content: string | ReactNode;
  title?: string;
  icon: ReactNode;
};

export function TextBoxContainer({ content, title, icon }: TextProps) {
  return (
    <Box
      sx={{
        mb: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {title}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        {icon}
        {typeof content === 'string' ? (
          <Typography variant="body1" sx={{ fontSize: '.9rem' }}>
            {content}
          </Typography>
        ) : (
          <Box sx={{ flex: 1 }}>{content}</Box>
        )}
      </Box>
    </Box>
  );
}
