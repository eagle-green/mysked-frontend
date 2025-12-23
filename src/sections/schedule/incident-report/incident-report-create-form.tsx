import type { ReactNode} from 'react';
import type { IJob } from 'src/types/job';

import { z } from 'zod';
import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { useBoolean } from 'minimal-shared/hooks';
import { useRef, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import useMediaQuery from '@mui/material/useMediaQuery';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks/use-router';

import { fTime } from 'src/utils/format-time';
import { getPositionColor } from 'src/utils/format-role';

import { fetcher, endpoints } from 'src/lib/axios';
import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';
import { VEHICLE_TYPE_OPTIONS } from 'src/assets/data/vehicle';
import { useCreateIncidentReportRequest } from 'src/actions/incident-report';

import { toast } from 'src/components/snackbar';
import { Label } from 'src/components/label/label';
import { Form, Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify/iconify';

// Helper function to generate UUID v4
const generateUUID = (): string => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r % 4) + 8;
    return v.toString(16);
  });

// Helper function to upload incident image to Cloudinary
const uploadIncidentImage = async (file: File, incidentFolderId: string): Promise<string> => {
  const timestamp = Math.floor(Date.now() / 1000);
  const fileName = `image_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const public_id = fileName;
  const folder = `incidents/${incidentFolderId}`;

  const query = new URLSearchParams({
    public_id,
    timestamp: timestamp.toString(),
    folder,
    action: 'upload',
  }).toString();

  const { signature, api_key, cloud_name } = await fetcher([
    `${endpoints.cloudinary.upload}/signature?${query}`,
    { method: 'GET' },
  ]);

  // Upload file with signed params
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', api_key);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('public_id', public_id);
  formData.append('overwrite', 'true');
  formData.append('folder', folder);

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`;

  const uploadRes = await fetch(cloudinaryUrl, {
    method: 'POST',
    body: formData,
  });

  const uploadData = await uploadRes.json();

  if (!uploadRes.ok) {
    throw new Error(uploadData?.error?.message || 'Cloudinary upload failed');
  }

  return uploadData.secure_url;
};
//------------------------------------------------------------------------------------------------

type Props = {
  job: IJob;
  workers: any[];
};

const INCIDENT_SEVERITY = [
  { label: 'Minor', caption: '(No injuries, no major disruptions)', value: 'minor' },
  {
    label: 'Moderate',
    caption: '(Injuries reported, traffic flow disrupted temporarily)',
    value: 'moderate',
  },
  {
    label: 'High',
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

const formatVehicleType = (type: string) => {
  const option = VEHICLE_TYPE_OPTIONS.find((opt) => opt.value === type);
  return option?.label || type;
};

const formatMinutesToHours = (minutes: number | null | undefined): string => {
  if (!minutes && minutes !== 0) return '0h';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export function CreateIncidentReportForm({ job, workers }: Props) {
  const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const [diagramImages, setDiagramImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  // Generate a unique folder ID for this incident report session
  const [incidentFolderId] = useState(() => generateUUID());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const hasErrorTimeIncidentReport = useBoolean();
  const createIncidentRequest = useCreateIncidentReportRequest();

  // Fetch timesheet data for the job
  const { data: timesheetData } = useQuery({
    queryKey: ['timesheet', job.id],
    queryFn: async () => {
      try {
        const response = await fetcher(`${endpoints.timesheet.list}?job_id=${job.id}`);
        // The API returns { success: true, data: { timesheets: [...] } }
        const timesheets = response.data?.data?.timesheets || response.data?.timesheets || [];
        
        if (timesheets.length === 0) {
          return { timesheets: [], timesheetStatus: null };
        }
        
        // Get the first timesheet (usually there's one per job)
        const timesheet = timesheets[0];
        
        // Fetch entries for the timesheet
        try {
          const entryResponse = await fetcher(`/api/timesheets/${timesheet.id}`);
          // The detail endpoint returns { success: true, data: { ...timesheet, entries: [...] } }
          const entries = entryResponse.data?.data?.entries || entryResponse.data?.entries || [];
          
          return {
            timesheets: [{
              ...timesheet,
              entries,
            }],
            timesheetStatus: timesheet.status,
          };
        } catch (error) {
          console.error(`Error fetching entries for timesheet ${timesheet.id}:`, error);
          return {
            timesheets: [timesheet],
            timesheetStatus: timesheet.status,
          };
        }
      } catch (error) {
        console.error('Error fetching timesheet:', error);
        return { timesheets: [], timesheetStatus: null };
      }
    },
    enabled: !!job.id,
  });

  // Get overall timesheet status
  const timesheetStatus = timesheetData?.timesheetStatus || null;
  const isTimesheetSubmitted = timesheetStatus === 'submitted' || timesheetStatus === 'confirmed' || timesheetStatus === 'approved';

  // Create a map of worker_id to timesheet entry
  const workerTimesheetMap = useMemo(() => {
    const map = new Map();
    if (timesheetData?.timesheets && Array.isArray(timesheetData.timesheets)) {
      timesheetData.timesheets.forEach((timesheet: any) => {
        if (timesheet.entries && Array.isArray(timesheet.entries)) {
          timesheet.entries.forEach((entry: any) => {
            const workerId = entry.worker_id;
            if (workerId) {
              map.set(workerId, {
                ...entry,
                timesheetStatus: timesheet.status || timesheetData.timesheetStatus,
                timesheetId: timesheet.id,
              });
            }
          });
        }
      });
    }
    
    // Debug: Log the map to see what data we have
    if (process.env.NODE_ENV === 'development') {
      console.log('Worker timesheet map:', Array.from(map.entries()));
    }
    
    return map;
  }, [timesheetData]);

  const defaultFormValue = {
    incidentType: '',
    dateOfIncident: dayjs(job.start_time).format('YYYY-MM-DD'),
    timeOfIncident: '',
    reportDescription: '',
    incidentSeverity: '',
    evidence: null,
    status: 'pending',
  };

  const IncidentReportRequestSchema = z.object({
    dateOfIncident: z.string().min(1, 'Date of incident field is required.'),
    timeOfIncident: z.string(),
    incidentType: z.string().min(1, 'Please select type of incident.'),
    incidentSeverity: z.string().min(1, 'Please select incident severity.'),
    reportDescription: z.string().min(1, 'Incident description is required.'),
    evidence: z.string().optional().nullable(),
    status: z.string(),
  });

  type IncidentReportRequestSchemaType = z.infer<typeof IncidentReportRequestSchema>;

  const methods = useForm<IncidentReportRequestSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(IncidentReportRequestSchema),
    defaultValues: defaultFormValue,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    setValue,
    getValues,
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Validate that timeOfIncident is provided
      if (!data.timeOfIncident) {
        hasErrorTimeIncidentReport.onTrue();
        toast.error('Time of incident is required.');
        return;
      }

      // Transform form data to match backend expectations
      // Include incidentFolderId as id so Cloudinary folder matches incident report ID
      const submitData = {
        id: incidentFolderId, // Use the folder ID as the incident report ID
        job_id: job.id,
        dateOfIncident: data.dateOfIncident,
        timeOfIncident: data.timeOfIncident,
        incidentType: data.incidentType,
        incidentSeverity: data.incidentSeverity,
        reportDescription: data.reportDescription,
        evidence: data.evidence,
        status: data.status || 'pending',
      };
      
      await createIncidentRequest.mutateAsync(submitData);
      toast.success('Incident report created successfully!');
      router.push(`${paths.schedule.work.incident_report.root}?status=pending`);
    } catch (error: any) {
      console.error('Error submitting incident report:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to create incident report';
      toast.error(errorMessage);
    }
  });

  const handleRemoveAll = () => {
    setDiagramImages([]);
    setValue('evidence', null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Validate that file is an image
  const validateImageFile = (file: File): boolean => {
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      toast.error(`Invalid file type. Please upload only image files (JPEG, PNG, GIF, WebP).`);
      return false;
    }
    return true;
  };

  // Compress and convert image to File for upload
  const compressImage = (file: File): Promise<File> =>
    new Promise((resolve, reject) => {
      if (!validateImageFile(file)) {
        reject(new Error('Invalid file type'));
        return;
      }

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

          // Convert to Blob then File for upload
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'));
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            0.85
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setUploadingImages(true);
      const newImageUrls: string[] = [];

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          // Validate file type
          if (!validateImageFile(file)) {
            continue;
          }

          try {
            // Compress image
            const compressedFile = await compressImage(file);
            
            // Upload to Cloudinary with incident folder ID
            const imageUrl = await uploadIncidentImage(compressedFile, incidentFolderId);
            newImageUrls.push(imageUrl);
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            toast.error(`Failed to upload ${file.name}. Please try again.`);
          }
        }

        // Update state with Cloudinary URLs
        const updatedImages = [...diagramImages, ...newImageUrls];
        setDiagramImages(updatedImages);
        setValue('evidence', JSON.stringify(updatedImages));
      } catch (error) {
        console.error('Error in file upload:', error);
        toast.error('Error uploading images. Please try again.');
      } finally {
        setUploadingImages(false);
      }
    }
  };

  const handleCameraCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!validateImageFile(file)) {
        return;
      }

      setUploadingImages(true);
      try {
        // Compress image
        const compressedFile = await compressImage(file);
        
        // Upload to Cloudinary with incident folder ID
        const imageUrl = await uploadIncidentImage(compressedFile, incidentFolderId);
        
        const updatedImages = [...diagramImages, imageUrl];
        setDiagramImages(updatedImages);
        setValue('evidence', JSON.stringify(updatedImages));
      } catch (error) {
        console.error('Error processing camera file:', error);
        toast.error('Failed to upload image. Please try again.');
      } finally {
        setUploadingImages(false);
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = diagramImages.filter((_, i) => i !== index);
    setDiagramImages(updatedImages);
    // Store as JSON array string, or null if empty
    setValue('evidence', updatedImages.length > 0 ? JSON.stringify(updatedImages) : null);

    // Clear file inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <>
      <Stack sx={{ p: 2, gap: 3 }}>
        {/* First Row: Job #, Customer, Site, Client */}
        <Stack
          divider={
            <Divider
              flexItem
              orientation={mdUp ? 'vertical' : 'horizontal'}
              sx={{ borderStyle: 'dashed' }}
            />
          }
          sx={{ gap: { xs: 3, md: 5 }, flexDirection: { xs: 'column', md: 'row' } }}
        >
          <Stack sx={{ flex: 1 }}>
            <TextBoxContainer
              title="JOB #"
              content={job?.job_number || ''}
              icon={null}
            />
          </Stack>

          <Stack sx={{ flex: 1 }}>
            <TextBoxContainer
              title="CUSTOMER"
              content={job?.company?.name || ''}
              icon={
                job?.company?.logo_url ? (
                  <Avatar
                    src={job.company.logo_url}
                    alt={job.company.name}
                    sx={{ width: 32, height: 32 }}
                  >
                    {job?.company?.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                ) : null
              }
            />
          </Stack>

          <Stack sx={{ flex: 1 }}>
            <TextBoxContainer
              title="SITE"
              content={job?.site?.display_address || ''}
              icon={null}
            />
          </Stack>

          <Stack sx={{ flex: 1 }}>
            <TextBoxContainer
              title="CLIENT"
              content={job?.client?.name || ''}
              icon={
                job?.client ? (
                  <Avatar
                    src={job.client.logo_url || undefined}
                    alt={job.client.name}
                    sx={{ width: 32, height: 32 }}
                  >
                    {job?.client?.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                ) : null
              }
            />
          </Stack>
        </Stack>

        {/* Second Row: Job Date, PO | NW, Approver, Timesheet Manager */}
        <Stack
          divider={
            <Divider
              flexItem
              orientation={mdUp ? 'vertical' : 'horizontal'}
              sx={{ borderStyle: 'dashed' }}
            />
          }
          sx={{ gap: { xs: 3, md: 5 }, flexDirection: { xs: 'column', md: 'row' } }}
        >
          <Stack sx={{ flex: 1 }}>
            <TextBoxContainer
              title="JOB DATE"
              content={
                job?.start_time
                  ? dayjs(job.start_time).format('MMM DD, YYYY')
                  : ''
              }
              icon={null}
            />
          </Stack>

          <Stack sx={{ flex: 1 }}>
            <TextBoxContainer
              title="PO | NW"
              content={
                [job?.po_number, (job as any)?.network_number]
                  .filter(Boolean)
                  .join(' | ') || ''
              }
              icon={null}
            />
          </Stack>

          <Stack sx={{ flex: 1 }}>
            <TextBoxContainer
              title="APPROVER"
              content={(job as any)?.approver || ''}
              icon={null}
            />
          </Stack>

          <Stack sx={{ flex: 1 }}>
            <TextBoxContainer
              title="TIMESHEET MANAGER"
              content={
                job?.timesheet_manager
                  ? `${job.timesheet_manager.first_name || ''} ${job.timesheet_manager.last_name || ''}`.trim()
                  : ''
              }
              icon={
                job?.timesheet_manager ? (
                  <Avatar
                    src={job.timesheet_manager.photo_url || undefined}
                    alt={`${job.timesheet_manager.first_name} ${job.timesheet_manager.last_name}`}
                    sx={{ width: 32, height: 32 }}
                  >
                    {job.timesheet_manager.first_name?.charAt(0)?.toUpperCase() || ''}
                  </Avatar>
                ) : null
              }
            />
          </Stack>
        </Stack>
      </Stack>

      <Form methods={methods} onSubmit={onSubmit}>
        <Card sx={{ mt: 3 }}>
          <Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 3,
                pt: 3,
              }}
            >
              <Typography variant="h6">
                Workers
                <Typography typography="caption" color="text.disabled" display="block">
                  List all personnel present or involved in this incident
                </Typography>
              </Typography>
              {timesheetStatus && (
                <Label
                  variant="soft"
                  color={
                    isTimesheetSubmitted
                      ? 'success'
                      : timesheetStatus === 'draft'
                      ? 'warning'
                      : 'default'
                  }
                >
                  Timesheet: {timesheetStatus.charAt(0).toUpperCase() + timesheetStatus.slice(1)}
                </Label>
              )}
            </Box>

            {workers.length > 0 ? (
              <Box sx={{ p: 3 }}>
                <Stack spacing={1}>
                  {[...workers]
                    .sort((a, b) => {
                      const aIsTM = a.id === job?.timesheet_manager_id || a.user_id === job?.timesheet_manager_id;
                      const bIsTM = b.id === job?.timesheet_manager_id || b.user_id === job?.timesheet_manager_id;
                      if (aIsTM && !bIsTM) return -1;
                      if (!aIsTM && bIsTM) return 1;
                      return 0;
                    })
                    .map((worker, index) => {
                    const positionLabel =
                      JOB_POSITION_OPTIONS.find((option) => option.value === worker.position)
                        ?.label ||
                      worker.position ||
                      'Unknown Position';

                    const isTimesheetManager = worker.id === job?.timesheet_manager_id || worker.user_id === job?.timesheet_manager_id;

                    return (
                      <Box
                        key={`${worker.id || worker.user_id}-${index}`}
                        sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', md: 'row' },
                          gap: 1,
                          p: { xs: 1.5, md: 1 },
                          border: { xs: '1px solid', md: 'none' },
                          borderColor: { xs: 'divider', md: 'transparent' },
                          borderRadius: 1,
                          bgcolor: { xs: 'background.neutral', md: 'transparent' },
                          alignItems: { xs: 'flex-start', md: 'center' },
                        }}
                      >

                        {/* Position Label and Worker Info */}
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.5,
                            minWidth: 0,
                            flex: { md: 1 },
                          }}
                        >
                          {/* Position Label */}
                          <Chip
                            label={positionLabel}
                            size="small"
                            variant="soft"
                            color={getPositionColor(worker.position)}
                            sx={{ 
                              minWidth: 60, 
                              flexShrink: 0,
                              alignSelf: 'flex-start',
                            }}
                          />

                          {/* Avatar, Worker Name, and Timesheet Manager Label */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              minWidth: 0,
                            }}
                          >
                            <Avatar
                              src={worker?.photo_url ?? undefined}
                              alt={worker?.first_name}
                              sx={{
                                width: { xs: 28, md: 32 },
                                height: { xs: 28, md: 32 },
                                flexShrink: 0,
                              }}
                            >
                              {worker?.first_name?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                minWidth: 0,
                              }}
                            >
                              {worker.first_name} {worker.last_name}
                            </Typography>
                            {/* Timesheet Manager Label */}
                            {isTimesheetManager && (
                              <Chip
                                label="Timesheet Manager"
                                size="small"
                                color="info"
                                variant="soft"
                                sx={{ 
                                  height: 18,
                                  fontSize: '0.625rem',
                                  flexShrink: 0,
                                }}
                              />
                            )}
                          </Box>
                        </Box>

                        {/* Time Info */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: 'wrap',
                          }}
                        >
                          {(() => {
                            const workerId = worker.id || worker.user_id;
                            const timesheetEntry = workerTimesheetMap.get(workerId);

                            // Show timesheet details if submitted, otherwise show job times
                            if (isTimesheetSubmitted && timesheetEntry) {
                              // Calculate total travel time - try multiple methods
                              let totalTravelMinutes = 0;
                              
                              // Method 1: Use total_travel_minutes if available
                              if (timesheetEntry.total_travel_minutes !== null && timesheetEntry.total_travel_minutes !== undefined && timesheetEntry.total_travel_minutes > 0) {
                                totalTravelMinutes = timesheetEntry.total_travel_minutes;
                              }
                              // Method 2: Calculate from travel_start and travel_end
                              else if (timesheetEntry.travel_start && timesheetEntry.travel_end) {
                                const travelStart = dayjs(timesheetEntry.travel_start);
                                const travelEnd = dayjs(timesheetEntry.travel_end);
                                if (travelStart.isValid() && travelEnd.isValid()) {
                                  let diff = travelEnd.diff(travelStart, 'minute');
                                  // Handle next day scenario
                                  if (diff < 0 && travelEnd.hour() < 6) {
                                    diff = travelEnd.add(1, 'day').diff(travelStart, 'minute');
                                  }
                                  totalTravelMinutes = Math.abs(diff);
                                }
                              }
                              // Method 3: Sum individual travel components
                              if (totalTravelMinutes === 0) {
                                const travelTo = Number(timesheetEntry.travel_to_minutes) || 0;
                                const travelDuring = Number(timesheetEntry.travel_during_minutes) || 0;
                                const travelFrom = Number(timesheetEntry.travel_from_minutes) || 0;
                                totalTravelMinutes = travelTo + travelDuring + travelFrom;
                              }

                              // Debug: Log travel time calculation
                              console.log('Travel time calculation for worker:', {
                                workerId,
                                workerName: `${worker.first_name} ${worker.last_name}`,
                                total_travel_minutes: timesheetEntry.total_travel_minutes,
                                travel_start: timesheetEntry.travel_start,
                                travel_end: timesheetEntry.travel_end,
                                travel_to_minutes: timesheetEntry.travel_to_minutes,
                                travel_during_minutes: timesheetEntry.travel_during_minutes,
                                travel_from_minutes: timesheetEntry.travel_from_minutes,
                                calculated: totalTravelMinutes,
                                willShow: totalTravelMinutes > 0,
                                fullEntry: timesheetEntry,
                              });

                              return (
                                <>
                                  <Typography variant="body2" color="text.secondary">
                                    {timesheetEntry.shift_start ? fTime(timesheetEntry.shift_start) : 'N/A'} - {timesheetEntry.shift_end ? fTime(timesheetEntry.shift_end) : 'N/A'}
                                  </Typography>
                                  {timesheetEntry.break_total_minutes !== null && timesheetEntry.break_total_minutes !== undefined && (
                                    <Typography variant="body2" color="text.secondary">
                                      Break: {formatMinutesToHours(timesheetEntry.break_total_minutes)}
                                    </Typography>
                                  )}
                                  {timesheetEntry.shift_total_minutes !== null && timesheetEntry.shift_total_minutes !== undefined && (
                                    <Typography variant="body2" color="text.secondary">
                                      Work: {formatMinutesToHours(timesheetEntry.shift_total_minutes)}
                                    </Typography>
                                  )}
                                  {totalTravelMinutes > 0 && (
                                    <Typography variant="body2" color="text.secondary">
                                      Travel: {formatMinutesToHours(totalTravelMinutes)}
                                    </Typography>
                                  )}
                                </>
                              );
                            } else {
                              return (
                                <>
                                  <Iconify icon="solar:clock-circle-bold" width={16} />
                                  <Typography variant="body2">
                                    {worker.start_time ? fTime(worker.start_time) : ''} -{' '}
                                    {worker.end_time ? fTime(worker.end_time) : ''}
                                  </Typography>
                                </>
                              );
                            }
                          })()}
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No workers assigned to this job
                </Typography>
              </Box>
            )}
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
                pt: 3,
              }}
            >
              <Typography variant="h6">
                Vehicles
                <Typography typography="caption" color="text.disabled" display="block">
                  List all vehicles assigned to this job
                </Typography>
              </Typography>
            </Box>

            {job.vehicles && job.vehicles.length > 0 ? (
              <Box sx={{ p: 3 }}>
                <Stack spacing={1.5}>
                  {job.vehicles.map((vehicle: any, index: number) => (
                    <Box
                      key={vehicle.id || index}
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'stretch', sm: 'center' },
                        justifyContent: { xs: 'flex-start', sm: 'space-between' },
                        gap: { xs: 1, sm: 2 },
                        p: { xs: 1.5, md: 0 },
                        border: { xs: '1px solid', md: 'none' },
                        borderColor: { xs: 'divider', md: 'transparent' },
                        borderRadius: 1,
                      }}
                    >
                      {/* Vehicle Info */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          minWidth: 0,
                          flex: { xs: 'none', sm: 1 },
                          mb: { xs: vehicle.operator ? 1 : 0, sm: 0 },
                        }}
                      >
                        <Chip
                          label={formatVehicleType(vehicle.type)}
                          size="medium"
                          variant="outlined"
                          sx={{ minWidth: 80, flexShrink: 0 }}
                        />
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 500,
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          {vehicle.license_plate} - {vehicle.unit_number}
                        </Typography>
                      </Box>

                      {/* Operator Info */}
                      {vehicle.operator && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flexShrink: 0,
                            ml: { xs: 1, sm: 0 },
                          }}
                        >
                          <Avatar
                            src={vehicle.operator?.photo_url ?? undefined}
                            alt={vehicle.operator?.first_name}
                            sx={{
                              width: { xs: 28, sm: 32 },
                              height: { xs: 28, sm: 32 },
                              flexShrink: 0,
                            }}
                          >
                            {vehicle.operator?.first_name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 500,
                            }}
                          >
                            {vehicle.operator.first_name} {vehicle.operator.last_name}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Box>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No vehicles assigned to this job
                </Typography>
              </Box>
            )}
          </Box>
        </Card>

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
                  alignItems: { sm: 'flex-start', md: 'stretch' },
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
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                      },
                    }}
                  />

                  <Field.TimePicker
                    name="timeOfIncident"
                    label="Time of Incident"
                    value={
                      defaultFormValue.timeOfIncident
                        ? dayjs(defaultFormValue.timeOfIncident)
                        : null
                    }
                    onChange={(newValue) => {
                      if (newValue) {
                        if (!newValue) {
                          hasErrorTimeIncidentReport.onTrue();
                        } else {
                          hasErrorTimeIncidentReport.onFalse();
                        }
                        setValue('timeOfIncident', newValue.toISOString());
                      }
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: hasErrorTimeIncidentReport.value,
                        helperText: hasErrorTimeIncidentReport.value
                          ? 'Time of incident is required.'
                          : '',
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
                  placeholder="Report Description*"
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
                  variant="contained"
                  size="large"
                  disabled={uploadingImages}
                  startIcon={<Iconify icon="solar:camera-add-bold" />}
                  onClick={() => cameraInputRef.current?.click()}
                  sx={{ 
                    minWidth: 200, 
                    width: { xs: '100%', md: 200 },
                    display: { xs: 'flex', md: 'none' },
                    py: { xs: 1.5, md: 1 },
                    fontSize: { xs: '1rem', md: '0.875rem' }
                  }}
                >
                  {uploadingImages ? 'Uploading...' : 'Take Photo'}
                </Button>

                <Button
                  variant="contained"
                  size="large"
                  disabled={uploadingImages}
                  startIcon={<Iconify icon="solar:import-bold" />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ 
                    minWidth: 200, 
                    width: { xs: '100%', md: 200 },
                    py: { xs: 1.5, md: 1 },
                    fontSize: { xs: '1rem', md: '0.875rem' }
                  }}
                >
                  {uploadingImages ? 'Uploading...' : 'Upload Images'}
                </Button>

                {diagramImages.length > 0 && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="large"
                    startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                    onClick={handleRemoveAll}
                    sx={{ 
                      minWidth: 200, 
                      width: { xs: '100%', md: 200 },
                      py: { xs: 1.5, md: 1 },
                      fontSize: { xs: '1rem', md: '0.875rem' }
                    }}
                  >
                    Remove All ({diagramImages.length})
                  </Button>
                )}
              </Box>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                capture="environment"
                onChange={handleCameraCapture}
                style={{ display: 'none' }}
              />

              {/* Images preview in grid */}
              {diagramImages.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Diagrams ({diagramImages.length}):
                  </Typography>
                  <Grid container spacing={2}>
                    {diagramImages.map((image, index) => (
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

              {diagramImages.length === 0 && (
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

        <Box sx={{ pt: 3, display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => router.push(paths.schedule.work.list)}
            size="large"
          >
            Cancel
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              size="large"
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              color="success"
              startIcon={<Iconify icon="solar:check-circle-bold" />}
              onClick={() => {
                const { timeOfIncident } = getValues();
                if (!timeOfIncident) {
                  hasErrorTimeIncidentReport.onTrue();
                } else {
                  hasErrorTimeIncidentReport.onFalse();
                }
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </Box>
        </Box>
      </Form>
    </>
  );
}

type TextProps = {
  content: string | ReactNode;
  title?: string;
  icon: ReactNode | null;
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

      {icon ? (
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
      ) : (
        typeof content === 'string' ? (
          <Typography variant="body1" sx={{ fontSize: '.9rem' }}>
            {content}
          </Typography>
        ) : (
          <Box sx={{ flex: 1 }}>{content}</Box>
        )
      )}
    </Box>
  );
}
