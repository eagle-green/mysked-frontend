import type { UserType } from 'src/auth/types';
import type {
  TimeSheetDetails,
  IJobVehicleInventory,
  IEquipmentLeftAtSite,
} from 'src/types/timesheet';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { pdf } from '@react-pdf/renderer';
import timezone from 'dayjs/plugin/timezone';
import { useBoolean } from 'minimal-shared/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useEffect, useCallback } from 'react';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { formatPositionDisplay } from 'src/utils/format-role';
import { getTimesheetDateInVancouver } from 'src/utils/timesheet-date';

import { fetcher, endpoints } from 'src/lib/axios';
import TimesheetPDF from 'src/pages/template/timesheet-pdf';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { TimeSheetSignatureDialog } from '../../../sections/schedule/timesheet/template/timesheet-signature';
import { TimeSheetDetailHeader } from '../../../sections/schedule/timesheet/template/timesheet-detail-header';
import { TimesheetManagerChangeDialog } from '../../../sections/schedule/timesheet/template/timesheet-manager-change-dialog';
import { TimesheetEquipmentLeftSection } from '../../../sections/schedule/timesheet/template/timesheet-equipment-left-section';
import { TimesheetManagerSelectionDialog } from '../../../sections/schedule/timesheet/template/timesheet-manager-selection-dialog';

// ----------------------------------------------------------------------

// Helper function to extract public_id from Cloudinary URL
const extractPublicIdFromUrl = (url: string): string | null => {
  if (!url.includes('cloudinary.com') || !url.includes('/image/upload/')) {
    return null;
  }

  // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{ext}
  const uploadIndex = url.indexOf('/image/upload/');
  const afterUpload = url.substring(uploadIndex + 14); // '/image/upload/' is 14 characters

  // Remove version prefix if present (v{number}/)
  let pathWithoutVersion = afterUpload;
  if (afterUpload.startsWith('v') && afterUpload.includes('/')) {
    const parts = afterUpload.split('/');
    pathWithoutVersion = parts.slice(1).join('/'); // Remove version part
  }

  // Remove file extension
  return pathWithoutVersion.replace(/\.[^/.]+$/, '');
};

// Helper function to delete timesheet image from Cloudinary
const deleteTimesheetImage = async (imageUrl: string): Promise<void> => {
  const publicId = extractPublicIdFromUrl(imageUrl);
  if (!publicId) {
    console.warn('Not a valid Cloudinary URL, skipping deletion:', imageUrl);
    return;
  }

  const timestamp = Math.floor(Date.now() / 1000);

  const query = new URLSearchParams({
    public_id: publicId,
    timestamp: timestamp.toString(),
    action: 'destroy',
  }).toString();

  const { signature, api_key, cloud_name } = await fetcher([
    `${endpoints.cloudinary.upload}/signature?${query}`,
    { method: 'GET' },
  ]);

  const deleteUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/image/destroy`;

  const formData = new FormData();
  formData.append('public_id', publicId);
  formData.append('api_key', api_key);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);

  const res = await fetch(deleteUrl, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();

  if (data.result !== 'ok' && data.result !== 'not found') {
    console.error('Failed to delete image from Cloudinary:', publicId, data);
    throw new Error(data.result || 'Failed to delete from Cloudinary');
  }
};

// Helper function to upload timesheet image to Cloudinary
const uploadTimesheetImage = async (file: File, timesheetId: string): Promise<string> => {
  const timestamp = Math.floor(Date.now() / 1000);
  const fileName = `image_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const public_id = fileName;
  const folder = `timesheets/${timesheetId}`;

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

// ----------------------------------------------------------------------
type TimeSheetEditProps = {
  timesheet: TimeSheetDetails;
  user?: UserType;
};

export function AdminTimeSheetEditForm({ timesheet, user }: TimeSheetEditProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const loadingSend = useBoolean();
  const submitDialog = useBoolean();
  const signatureDialog = useBoolean();

  const [workerData, setWorkerData] = useState<Record<string, any>>({});
  const [workerInitials, setWorkerInitials] = useState<Record<string, string>>({});
  const [workerConfirmations, setWorkerConfirmations] = useState<Record<string, boolean>>({});
  const [currentWorkerIdForSignature, setCurrentWorkerIdForSignature] = useState<string | null>(
    null
  );
  const [managerNotes] = useState<string>(timesheet.notes || '');
  const [adminNotes, setAdminNotes] = useState<string>(timesheet.admin_notes || '');
  const [clientSignature] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>(
    (timesheet as any).images && Array.isArray((timesheet as any).images)
      ? (timesheet as any).images
      : []
  );
  // Track original images to detect deletions
  const [originalImages] = useState<string[]>(
    (timesheet as any).images && Array.isArray((timesheet as any).images)
      ? (timesheet as any).images
      : []
  );
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageDialog, setImageDialog] = useState<{ open: boolean; imageUrl: string | null }>({
    open: false,
    imageUrl: null,
  });

  // Equipment left at site state
  const [jobVehiclesInventory, setJobVehiclesInventory] = useState<IJobVehicleInventory[]>([]);
  const [equipmentLeftAtSite, setEquipmentLeftAtSite] = useState<IEquipmentLeftAtSite[]>([]);
  const [equipmentLeftAnswer, setEquipmentLeftAnswer] = useState<'yes' | 'no' | ''>('');
  const [currentEquipmentLeft, setCurrentEquipmentLeft] = useState<any[]>([]);

  // Image validation
  const validateImageFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      toast.error(`Invalid file type. Please upload a JPEG, PNG, or WebP image.`);
      return false;
    }

    if (file.size > maxSize) {
      toast.error(`File size too large. Please upload an image smaller than 10MB.`);
      return false;
    }

    return true;
  };

  // Compress image
  const compressImage = (file: File): Promise<File> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 1920;
          const maxHeight = 1920;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Image compression failed'));
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
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });

  // Handle file upload
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

            // Upload to Cloudinary with timesheet folder
            const imageUrl = await uploadTimesheetImage(compressedFile, timesheet.id);
            newImageUrls.push(imageUrl);
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            toast.error(`Failed to upload ${file.name}. Please try again.`);
          }
        }

        // Update state with Cloudinary URLs (will be saved when user clicks Submit/Update)
        const updatedImages = [...uploadedImages, ...newImageUrls];
        setUploadedImages(updatedImages);

        toast.success(`Successfully uploaded ${newImageUrls.length} image(s)`);
      } catch (error) {
        console.error('Error in file upload:', error);
        toast.error('Error uploading images. Please try again.');
      } finally {
        setUploadingImages(false);
        // Reset input
        if (event.target) {
          event.target.value = '';
        }
      }
    }
  };

  // Handle image deletion (will be saved when user clicks Submit/Update)
  const handleDeleteImage = (imageUrl: string) => {
    setUploadedImages((prev) => prev.filter((url) => url !== imageUrl));
    toast.success('Image removed from list (will be saved when you submit/update)');
  };

  const [timesheetManagerChangeDialog, setTimesheetManagerChangeDialog] = useState<{
    open: boolean;
    newManager: any;
  }>({
    open: false,
    newManager: null,
  });

  const [timesheetManagerSelectionDialog, setTimesheetManagerSelectionDialog] = useState<{
    open: boolean;
  }>({
    open: false,
  });

  const { entries } = timesheet;

  // Fetch job workers for timesheet manager change
  const { data: jobWorkersData } = useQuery({
    queryKey: ['job-workers', timesheet.job.id],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.work.job}/${timesheet.job.id}/workers`);
      return response.data;
    },
    enabled: !!timesheet.job.id,
  });

  const jobWorkers = jobWorkersData || { workers: [] };

  // Fetch job vehicles inventory
  const { data: jobVehiclesData, refetch: refetchJobVehicles } = useQuery({
    queryKey: ['job-vehicles-inventory', timesheet.id],
    queryFn: async () => {
      const response = await fetcher(endpoints.timesheet.jobVehiclesInventory(timesheet.id));
      return response.data;
    },
    enabled: !!timesheet.id,
    staleTime: 0, // Always consider data stale to get fresh inventory
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // Fetch equipment left at site
  const { data: equipmentLeftData } = useQuery({
    queryKey: ['equipment-left', timesheet.id],
    queryFn: async () => {
      const response = await fetcher(endpoints.timesheet.equipmentLeft(timesheet.id));
      return response.data;
    },
    enabled: !!timesheet.id,
  });

  // Update state when data is fetched
  useMemo(() => {
    if (jobVehiclesData?.vehicles) {
      setJobVehiclesInventory(jobVehiclesData.vehicles);
    }
  }, [jobVehiclesData]);

  useMemo(() => {
    if (equipmentLeftData?.equipment_left) {
      setEquipmentLeftAtSite(equipmentLeftData.equipment_left);
      const equipmentItems = equipmentLeftData.equipment_left.map((item: any) => ({
        vehicle_id: item.vehicle_id,
        inventory_id: item.inventory_id,
        quantity: item.quantity,
        notes: item.notes || '',
        vehicle_type: item.vehicle_type,
        license_plate: item.license_plate,
        unit_number: item.unit_number,
        inventory_name: item.inventory_name,
        sku: item.sku,
        cover_url: item.cover_url,
        inventory_type: item.inventory_type,
        typical_application: item.typical_application,
        created_at: item.created_at, // Include created_at for grouping logic
      }));
      setCurrentEquipmentLeft(equipmentItems);
      if (equipmentLeftData.equipment_left.length > 0) {
        setEquipmentLeftAnswer('yes');
      }
    }
  }, [equipmentLeftData]);

  // Handle save equipment left at site
  const handleSaveEquipmentLeft = useCallback(
    async (equipment: any[]) => {
      try {
        const response = await fetcher([
          endpoints.timesheet.equipmentLeft(timesheet.id),
          {
            method: 'POST',
            data: { equipment },
          },
        ]);
        // Refetch equipment left data to get updated created_at timestamps
        await queryClient.refetchQueries({ queryKey: ['equipment-left', timesheet.id] });
        // Refresh job vehicles inventory to update available quantities
        await queryClient.refetchQueries({ queryKey: ['job-vehicles-inventory', timesheet.id] });
        if (response.data?.equipment_left) {
          setEquipmentLeftAtSite(response.data.equipment_left);
          if (response.data.equipment_left.length > 0) {
            setEquipmentLeftAnswer('yes');
          } else {
            setEquipmentLeftAnswer('no');
          }
        }
        toast.success('Equipment left at site saved successfully');
      } catch (error: any) {
        console.error('Error saving equipment left:', error);
        toast.error(error?.error || 'Failed to save equipment left at site');
      }
    },
    [timesheet.id, queryClient]
  );

  // Handle equipment left answer change
  const handleEquipmentLeftChange = useCallback((value: 'yes' | 'no' | '') => {
    setEquipmentLeftAnswer(value);
    if (value === 'no') {
      setCurrentEquipmentLeft([]);
    }
  }, []);

  // Handle equipment change
  const handleEquipmentChange = useCallback((equipment: any[]) => {
    setCurrentEquipmentLeft(equipment);
  }, []);

  // Check if current user has access to this timesheet
  const hasTimesheetAccess = useMemo(() => {
    if (!user?.id) return false;
    // Admin users can access any timesheet
    if (user.role === 'admin') return true;
    // Only the current timesheet manager can access and edit the timesheet
    if (user.id === timesheet.timesheet_manager_id) return true;
    return false;
  }, [user, timesheet.timesheet_manager_id]);

  // Check if timesheet is read-only
  const isTimesheetReadOnly = useMemo(() => {
    if (!user?.id) return true;
    // Admins can edit submitted/confirmed timesheets
    if (user.role === 'admin') return false;
    // Timesheet manager can only edit if not submitted/confirmed
    return ['submitted', 'confirmed', 'approved'].includes(timesheet.status);
  }, [user, timesheet.status]);

  // Check if user can edit timesheet manager
  const canEditTimesheetManager = useMemo(
    () => user?.role === 'admin' || user?.id === timesheet.timesheet_manager_id,
    [user, timesheet.timesheet_manager_id]
  );

  // Filter out workers who haven't accepted the job
  // Include entries where worker has 'accepted' status OR where worker is the timesheet manager
  const acceptedEntries = useMemo(
    () =>
      entries.filter(
        (entry) =>
          entry.job_worker_status === 'accepted' ||
          entry.worker_id === timesheet.timesheet_manager_id
      ),
    [entries, timesheet.timesheet_manager_id]
  );

  // Initialize worker data when entries change
  useEffect(() => {
    const initialData: Record<string, any> = {};
    const initialInitials: Record<string, string> = {};

    acceptedEntries.forEach((entry) => {
      // Calculate travel time from total_travel_minutes or sum of travel minutes
      let travelTimeMinutes: number | null = null;
      if (entry.total_travel_minutes) {
        travelTimeMinutes = entry.total_travel_minutes;
      } else if (
        entry.travel_to_minutes ||
        entry.travel_during_minutes ||
        entry.travel_from_minutes
      ) {
        const toMinutes = parseInt(entry.travel_to_minutes as string) || 0;
        const duringMinutes = parseInt(entry.travel_during_minutes as string) || 0;
        const fromMinutes = parseInt(entry.travel_from_minutes as string) || 0;
        const total = toMinutes + duringMinutes + fromMinutes;
        travelTimeMinutes = total > 0 ? total : null;
      }

      initialData[entry.id] = {
        mob: entry.mob || false,
        break_minutes: entry.break_total_minutes || 0,
        shift_start: entry.shift_start || entry.original_start_time,
        shift_end: entry.shift_end || entry.original_end_time,
        travel_time_hours: travelTimeMinutes !== null ? Math.floor(travelTimeMinutes / 60) : null,
        travel_time_minutes: travelTimeMinutes !== null ? travelTimeMinutes % 60 : null,
        worker_notes: entry.worker_notes || '',
        admin_notes: entry.admin_notes || '',
      };

      if (entry.initial) {
        initialInitials[entry.id] = entry.initial;
      }
    });

    setWorkerData(initialData);
    setWorkerInitials(initialInitials);
  }, [acceptedEntries]);

  // Calculate total hours for each entry (reactive to workerData changes)
  const entryTotalHours = useMemo(() => {
    const hoursMap: Record<string, number> = {};
    acceptedEntries.forEach((entry) => {
      const data = workerData[entry.id];
      if (!data) {
        hoursMap[entry.id] = 0;
        return;
      }

      // Calculate from shift times if available, otherwise use API value
      if (data.shift_start && data.shift_end) {
        const start = dayjs(data.shift_start);
        const end = dayjs(data.shift_end);
        let minutes = end.diff(start, 'minute');
        // Subtract break minutes
        minutes -= data.break_minutes || 0;
        // Convert to decimal hours with 2 decimal places
        hoursMap[entry.id] = Math.round((minutes / 60) * 100) / 100;
      } else if (entry.shift_total_minutes !== undefined && entry.shift_total_minutes !== null) {
        // Use the corrected value from backend (handles date correction for multi-day shifts)
        hoursMap[entry.id] = Math.round((entry.shift_total_minutes / 60) * 100) / 100;
      } else {
        hoursMap[entry.id] = 0;
      }
    });
    return hoursMap;
  }, [acceptedEntries, workerData]);

  // Update worker field
  const updateWorkerField = useCallback((workerId: string, field: string, value: any) => {
    setWorkerData((prev) => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        [field]: value,
      },
    }));
  }, []);

  // Handle initial signature
  const handleInitialSignature = useCallback(
    (signature: string) => {
      if (currentWorkerIdForSignature) {
        setWorkerInitials((prev) => ({
          ...prev,
          [currentWorkerIdForSignature]: signature,
        }));
        setCurrentWorkerIdForSignature(null);
        signatureDialog.onFalse();
      }
    },
    [currentWorkerIdForSignature, signatureDialog]
  );

  // Handle timesheet manager change
  const handleConfirmTimesheetManagerChange = useCallback(async () => {
    if (!timesheetManagerChangeDialog.newManager) return;

    try {
      const response = await fetcher([
        `${endpoints.timesheet.list}/${timesheet.id}`,
        {
          method: 'PUT',
          data: {
            timesheet_manager_id: timesheetManagerChangeDialog.newManager.user_id,
          },
        },
      ]);

      if (response.success) {
        toast.success('Timesheet manager updated successfully');
        await queryClient.invalidateQueries({ queryKey: ['timesheet-detail-query', timesheet.id] });
        await queryClient.invalidateQueries({ queryKey: ['timesheet-list-query'] });
        setTimesheetManagerChangeDialog({ open: false, newManager: null });
        router.push(paths.work.job.timesheet.list);
      } else {
        toast.error('Failed to update timesheet manager');
      }
    } catch (error) {
      console.error('Error updating timesheet manager:', error);
      toast.error('Failed to update timesheet manager');
    }
  }, [timesheetManagerChangeDialog.newManager, timesheet.id, queryClient, router]);

  // Close timesheet manager change dialog
  const handleCloseTimesheetManagerChange = useCallback(() => {
    setTimesheetManagerChangeDialog({ open: false, newManager: null });
  }, []);

  // Handle worker confirmation
  const handleWorkerConfirmation = useCallback((workerId: string, confirmed: boolean) => {
    setWorkerConfirmations((prev) => ({
      ...prev,
      [workerId]: confirmed,
    }));
  }, []);

  // Check if all workers are confirmed
  const allWorkersConfirmed = useMemo(
    () =>
      acceptedEntries.length > 0 && acceptedEntries.every((entry) => workerConfirmations[entry.id]),
    [acceptedEntries, workerConfirmations]
  );

  // Get list of workers missing signatures
  const workersMissingSignatures = useMemo(
    () =>
      acceptedEntries.filter(
        (entry) => !workerInitials[entry.id] || workerInitials[entry.id].trim() === ''
      ),
    [acceptedEntries, workerInitials]
  );

  // Save all worker entries
  const saveAllEntries = useCallback(async () => {
    const savePromises = acceptedEntries.map((entry) => {
      const data = workerData[entry.id];
      if (!data) return Promise.resolve();

      // Calculate total travel minutes from hours and minutes
      const hours =
        data.travel_time_hours === '' ||
        data.travel_time_hours === null ||
        data.travel_time_hours === undefined
          ? 0
          : Number(data.travel_time_hours) || 0;
      const minutes =
        data.travel_time_minutes === '' ||
        data.travel_time_minutes === null ||
        data.travel_time_minutes === undefined
          ? 0
          : Number(data.travel_time_minutes) || 0;
      const travelTimeMinutes = hours * 60 + minutes;

      const processedData = {
        shift_start: data.shift_start || null,
        shift_end: data.shift_end || null,
        mob: data.mob || false,
        break_minutes: data.break_minutes || 0,
        travel_to_minutes: travelTimeMinutes > 0 ? travelTimeMinutes : undefined,
        initial: workerInitials[entry.id] || null,
        worker_notes: data?.worker_notes || null,
        admin_notes: data?.admin_notes || null,
      };

      return fetcher([
        `${endpoints.timesheet.entries}/${entry.id}`,
        { method: 'PUT', data: processedData },
      ]);
    });

    await Promise.all(savePromises);
  }, [acceptedEntries, workerData, workerInitials]);

  // Validate timesheet data before opening submit dialog
  // For admins: allow submission even if signatures are missing (but show warning)
  const validateTimesheetData = useCallback(() => {
    const newValidationErrors: Record<string, string> = {};
    let hasErrors = false;

    for (const entry of acceptedEntries) {
      const data = workerData[entry.id];
      if (!data) continue;

      // Check if initial is missing
      // For admins, we allow submission without signatures (just show warning)
      // For non-admins, signatures are required
      if (!workerInitials[entry.id] || workerInitials[entry.id].trim() === '') {
        // Only mark as error for non-admins
        if (user?.role !== 'admin') {
          newValidationErrors[entry.id] = 'Sign Required';
          hasErrors = true;
        } else {
          // For admins, just track it but don't block
          newValidationErrors[entry.id] = 'Sign Missing (Admin can submit on behalf)';
        }
      } else {
        delete newValidationErrors[entry.id];
      }
    }

    // Admins can always proceed (even with missing signatures)
    if (user?.role === 'admin') {
      return true;
    }

    return !hasErrors;
  }, [acceptedEntries, workerData, workerInitials, user?.role]);

  // Handle opening submit dialog with validation
  const handleOpenSubmitDialog = useCallback(() => {
    // Admins can always open the dialog (validation will show warnings but not block)
    if (user?.role === 'admin' || validateTimesheetData()) {
      submitDialog.onTrue();
    }
  }, [validateTimesheetData, submitDialog, user?.role]);

  // Handle timesheet submission
  const handleSubmitTimesheet = useCallback(async () => {
    if (!allWorkersConfirmed) {
      toast.error('Please confirm all workers before submitting');
      return;
    }

    const toastId = toast.loading('Submitting timesheet...');
    loadingSend.onTrue();

    try {
      // Save all entries first
      await saveAllEntries();

      // Delete removed images from Cloudinary
      const removedImages = originalImages.filter((img) => !uploadedImages.includes(img));
      for (const imageUrl of removedImages) {
        try {
          await deleteTimesheetImage(imageUrl);
        } catch (error) {
          console.error('Error deleting image from Cloudinary:', error);
          // Continue even if deletion fails
        }
      }

      // Update timesheet notes, admin notes, and images
      await fetcher([
        `${endpoints.timesheet.list}/${timesheet.id}`,
        {
          method: 'PUT',
          data: {
            notes: managerNotes,
            admin_notes: adminNotes,
            images: uploadedImages,
          },
        },
      ]);

      // Refetch to get updated calculations
      await queryClient.refetchQueries({ queryKey: ['timesheet-detail-query', timesheet.id] });

      // Submit timesheet
      const submitData = {
        timesheet_manager_signature: null,
        client_signature: clientSignature || null,
        notes: managerNotes,
        images: uploadedImages,
      };

      const response = await fetcher([
        `${endpoints.timesheet.submit.replace(':id', timesheet.id)}`,
        {
          method: 'POST',
          data: submitData,
        },
      ]);

      queryClient.invalidateQueries({ queryKey: ['timesheet-detail-query', timesheet.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-timesheets'] });

      toast.success(response?.message ?? 'Timesheet submitted successfully.');
      submitDialog.onFalse();

      setTimeout(() => {
        router.push(paths.work.job.timesheet.list);
      }, 1000);
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error?.response?.data?.error || 'Failed to submit timesheet');
    } finally {
      toast.dismiss(toastId);
      loadingSend.onFalse();
    }
  }, [
    allWorkersConfirmed,
    saveAllEntries,
    timesheet.id,
    managerNotes,
    adminNotes,
    clientSignature,
    queryClient,
    router,
    submitDialog,
    loadingSend,
    uploadedImages,
    originalImages,
  ]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    router.push(paths.work.job.timesheet.list);
  }, [router]);

  // Validate confirmations before opening signature dialog
  // Note: This function is kept for potential future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const validateConfirmations = useCallback(() => {
    const newConfirmationErrors: Record<string, string> = {};
    let hasErrors = false;

    for (const entry of acceptedEntries) {
      if (!workerConfirmations[entry.id]) {
        newConfirmationErrors[entry.id] = 'Confirm is required';
        hasErrors = true;
      } else {
        delete newConfirmationErrors[entry.id];
      }
    }

    return !hasErrors;
  }, [acceptedEntries, workerConfirmations]);

  // Render submit dialog
  const renderSubmitDialog = () => (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={submitDialog.value}
      onClose={submitDialog.onFalse}
      PaperProps={{
        sx: {
          m: { xs: 1, sm: 2 },
          maxHeight: { xs: '90vh', sm: '80vh' },
          borderRadius: { xs: 2, sm: 1 },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
        Confirm Timesheet Submission
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 2 } }}>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          Please review and confirm all worker timesheets before submission.
        </Typography>

        {/* Warning for missing signatures (admin only) */}
        {workersMissingSignatures.length > 0 && user?.role === 'admin' && (
          <Card
            sx={{
              p: 2,
              mb: 2,
              bgcolor: 'warning.lighter',
              border: '1px solid',
              borderColor: 'warning.main',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Iconify
                icon="solar:danger-triangle-bold"
                width={24}
                sx={{ color: 'warning.main', mt: 0.5 }}
              />
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 0.5, color: 'warning.darker', fontWeight: 600 }}
                >
                  Some workers haven&apos;t signed
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                  {workersMissingSignatures.length} worker
                  {workersMissingSignatures.length > 1 ? 's' : ''}{' '}
                  {workersMissingSignatures.length > 1 ? 'are' : 'is'} missing{' '}
                  {workersMissingSignatures.length > 1 ? 'signatures' : 'a signature'}:
                </Typography>
                <Stack spacing={0.5}>
                  {workersMissingSignatures.map((entry) => (
                    <Typography
                      key={entry.id}
                      variant="body2"
                      sx={{ color: 'text.secondary', pl: 1 }}
                    >
                      • {entry.worker_first_name} {entry.worker_last_name}
                    </Typography>
                  ))}
                </Stack>
                <Typography
                  variant="body2"
                  sx={{ mt: 1.5, color: 'warning.darker', fontWeight: 500 }}
                >
                  You are submitting this timesheet on their behalf. The timesheet will be submitted
                  without their signatures.
                </Typography>
              </Box>
            </Box>
          </Card>
        )}

        {/* Workers Summary */}
        <Card sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            All Workers - Please Confirm Each Worker
          </Typography>
          <Stack spacing={2}>
            {acceptedEntries.map((entry) => {
              const data = workerData[entry.id];

              // Calculate total hours from current form data
              let totalHours = 0;
              if (data?.shift_start && data?.shift_end) {
                const start = dayjs(data.shift_start);
                const end = dayjs(data.shift_end);
                let minutes = end.diff(start, 'minute');

                // Subtract break minutes
                minutes -= data.break_minutes || 0;

                // Convert to decimal hours with 2 decimal places
                totalHours = Math.round((minutes / 60) * 100) / 100;
              }

              return (
                <Box
                  key={entry.id}
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1.5,
                      flexWrap: 'wrap',
                      gap: 1,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1, minWidth: 0 }}>
                      {entry.worker_first_name} {entry.worker_last_name}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          p: 0.5,
                          borderRadius: 1,
                          flexShrink: 0,
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                        onClick={() => {
                          handleWorkerConfirmation(entry.id, !workerConfirmations[entry.id]);
                        }}
                      >
                        <Checkbox
                          checked={workerConfirmations[entry.id] || false}
                          onChange={(e) => {
                            handleWorkerConfirmation(entry.id, e.target.checked);
                          }}
                          size="small"
                          sx={{ p: 0.5 }}
                        />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            cursor: 'pointer',
                            userSelect: 'none',
                            ml: 0.5,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Confirm
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Time Information */}
                  <Stack spacing={1.5} sx={{ mb: 1 }}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={{ xs: 0.5, sm: 3 }}
                      sx={{ mb: 1 }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ minWidth: 'fit-content' }}
                      >
                        Start:{' '}
                        {data?.shift_start ? dayjs(data.shift_start).format('h:mm A') : 'Not set'}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ minWidth: 'fit-content' }}
                      >
                        End: {data?.shift_end ? dayjs(data.shift_end).format('h:mm A') : 'Not set'}
                      </Typography>
                    </Stack>

                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={{ xs: 0.5, sm: 2 }}
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      flexWrap="wrap"
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ minWidth: 'fit-content' }}
                      >
                        Total Hours: {totalHours.toFixed(2).replace(/\.?0+$/, '')}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ minWidth: 'fit-content' }}
                      >
                        Break: {data?.break_minutes || 0} min
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          flexWrap: 'wrap',
                        }}
                      >
                        <Typography
                          variant="body2"
                          color={workerInitials[entry.id] ? 'success.main' : 'error.main'}
                          sx={{ fontWeight: 'medium', whiteSpace: 'nowrap' }}
                        >
                          Initial:
                        </Typography>
                        {workerInitials[entry.id] ? (
                          <Box
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 0.5,
                              p: 0.5,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: 'background.neutral',
                              height: '32px',
                              minWidth: '32px',
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={workerInitials[entry.id]}
                              alt="Initial"
                              style={{
                                height: '28px',
                                width: 'auto',
                                maxWidth: '80px',
                                objectFit: 'contain',
                                display: 'block',
                              }}
                            />
                          </Box>
                        ) : (
                          <Typography
                            variant="body2"
                            color="error.main"
                            sx={{ fontWeight: 'medium', whiteSpace: 'nowrap' }}
                          >
                            ✗ Missing
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Card>

        {/* Client Signature Preview */}
        {clientSignature && (
          <Card sx={{ p: { xs: 1.5, sm: 2 }, mt: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>
              Client Signature
            </Typography>
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'success.main',
                borderRadius: 1,
                p: { xs: 1, sm: 2 },
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                bgcolor: 'background.paper',
                minHeight: '80px',
              }}
            >
              <img
                src={clientSignature}
                alt="Client Signature"
                style={{
                  height: '80px',
                  width: 'auto',
                  maxWidth: '100%',
                  objectFit: 'contain',
                }}
              />
            </Box>
          </Card>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1.5, sm: 1 },
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 3 },
          justifyContent: { xs: 'stretch', sm: 'flex-end' },
          alignItems: 'center',
        }}
      >
        <Button
          onClick={submitDialog.onFalse}
          size="small"
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="success"
          size="small"
          onClick={handleSubmitTimesheet}
          disabled={!allWorkersConfirmed}
          startIcon={<Iconify icon="solar:check-circle-bold" />}
          sx={{
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          Submit Timesheet
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Check access before rendering
  if (hasTimesheetAccess === false) {
    return (
      <Card sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Access denied. Redirecting...
        </Typography>
      </Card>
    );
  }

  // Render the timesheet edit form
  return (
    <Box>
      {/* Read-only Banner */}
      {isTimesheetReadOnly && (
        <Card sx={{ mb: 2, p: 2, bgcolor: '#e3f2fd', border: '1px solid #bbdefb' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Iconify icon="solar:info-circle-bold" color="#000000" />
            <Typography variant="body1" color="info.dark">
              This timesheet is currently <strong>{timesheet.status}</strong> and cannot be edited.
              {timesheet.status === 'submitted' && ' It has been submitted for approval.'}
              {timesheet.status === 'confirmed' && ' It has been confirmed and approved.'}
              {timesheet.status === 'approved' && ' It has been approved and is now final.'}
            </Typography>
          </Box>
        </Card>
      )}

      {/* Rejected Timesheet Warning Banner */}
      {timesheet.status === 'rejected' && (
        <Card sx={{ mb: 2, p: 2, bgcolor: '#fff3cd', border: '1px solid #ffeaa7' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Iconify icon="solar:info-circle-bold" color="#000000" />
              <Typography variant="body1" color="warning.dark">
                This timesheet has been <strong>rejected</strong>. Please review the feedback, make
                necessary corrections, and resubmit for approval.
              </Typography>
            </Box>

            {timesheet.rejection_reason && (
              <Box sx={{ ml: 4, pl: 2, borderLeft: '3px solid #ffc107' }}>
                <Typography variant="subtitle2" color="#637381" sx={{ mb: 1 }}>
                  <strong>Rejection Reason:</strong>
                </Typography>
                <Typography variant="body2" color="#000000">
                  {timesheet.rejection_reason}
                </Typography>
              </Box>
            )}
          </Box>
        </Card>
      )}

      <Card sx={{ mb: 2 }}>
        {/* Timesheet detail header section */}
        <TimeSheetDetailHeader
          job_number={timesheet.job.job_number}
          po_number={(timesheet.job.po_number || '').trim()}
          full_address={timesheet.site.display_address}
          client_name={timesheet.client.name}
          client_logo_url={timesheet.client.logo_url}
          worker_name="All Workers"
          worker_photo_url={null}
          confirmed_by={timesheet.confirmed_by || null}
          timesheet_manager_id={timesheet.timesheet_manager_id}
          timesheet_manager={timesheet.timesheet_manager}
          current_user_id={user?.id || ''}
          job_id={timesheet.job.id}
          onTimesheetManagerChange={() => setTimesheetManagerSelectionDialog({ open: true })}
          canEditTimesheetManager={canEditTimesheetManager}
          workerOptions={jobWorkers.workers.map((worker: any) => ({
            value: worker.user_id,
            label: `${worker.first_name} ${worker.last_name}`,
            photo_url: worker.photo_url || '',
            first_name: worker.first_name,
            last_name: worker.last_name,
          }))}
          disabled={isTimesheetReadOnly}
          timesheet_status={timesheet.status}
          submitted_at={timesheet.updated_at}
          submitted_by={timesheet.submitted_by || null}
        />
      </Card>

      <Card sx={{ mt: 3 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Worker Timesheets
          </Typography>

          {/* Desktop Table View */}
          <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Worker</TableCell>
                  <TableCell align="center">MOB</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>Break (min)</TableCell>
                  <TableCell>End Time</TableCell>
                  <TableCell>Total Hours</TableCell>
                  <TableCell>Travel Time</TableCell>
                  <TableCell>Initial</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {acceptedEntries.map((entry) => {
                  const data = workerData[entry.id] || {
                    mob: false,
                    shift_start: null,
                    break_minutes: 0,
                    shift_end: null,
                    initial: null,
                  };

                  // Get total hours from memoized calculation (reactive to workerData changes)
                  const totalHours = entryTotalHours[entry.id] || 0;

                  return (
                    <TableRow key={entry.id}>
                      {/* Worker Name */}
                      <TableCell>
                        <Stack spacing={1}>
                          {entry.position && (
                            <Chip
                              label={formatPositionDisplay(entry.position)}
                              size="small"
                              variant="soft"
                              color={
                                entry.position.toLowerCase().includes('lct')
                                  ? 'info'
                                  : entry.position.toLowerCase().includes('tcp')
                                    ? 'secondary'
                                    : 'primary'
                              }
                              sx={{ height: 20, fontSize: '0.75rem', width: 'fit-content' }}
                            />
                          )}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              src={entry.worker_photo_url || undefined}
                              alt={`${entry.worker_first_name} ${entry.worker_last_name}`}
                              sx={{ width: 32, height: 32 }}
                            >
                              {entry.worker_first_name?.charAt(0)}
                            </Avatar>
                            <Typography variant="subtitle2">
                              {entry.worker_first_name} {entry.worker_last_name}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* MOB Checkbox */}
                      <TableCell align="center">
                        <Checkbox
                          checked={data.mob}
                          onChange={(e) => updateWorkerField(entry.id, 'mob', e.target.checked)}
                          disabled={isTimesheetReadOnly}
                        />
                      </TableCell>

                      {/* Start Time */}
                      <TableCell>
                        <TimePicker
                          value={
                            data.shift_start
                              ? dayjs(data.shift_start).tz('America/Vancouver')
                              : null
                          }
                          onChange={(newValue) => {
                            if (newValue && entry.original_start_time) {
                              const baseDate = dayjs(entry.original_start_time).tz(
                                'America/Vancouver'
                              );
                              const newDateTime = baseDate
                                .hour(newValue.hour())
                                .minute(newValue.minute())
                                .second(0)
                                .millisecond(0);
                              updateWorkerField(entry.id, 'shift_start', newDateTime.toISOString());
                            }
                          }}
                          disabled={isTimesheetReadOnly}
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                            },
                          }}
                        />
                      </TableCell>

                      {/* Break Minutes */}
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          fullWidth
                          value={data.break_minutes || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                            updateWorkerField(entry.id, 'break_minutes', Math.max(0, value || 0));
                          }}
                          disabled={isTimesheetReadOnly}
                          inputProps={{ min: 0, step: 1 }}
                          sx={{ maxWidth: '100px' }}
                        />
                      </TableCell>

                      {/* End Time */}
                      <TableCell>
                        <TimePicker
                          value={
                            data.shift_end ? dayjs(data.shift_end).tz('America/Vancouver') : null
                          }
                          onChange={(newValue) => {
                            if (newValue && entry.original_end_time) {
                              const baseDate = dayjs(entry.original_end_time).tz(
                                'America/Vancouver'
                              );
                              const newDateTime = baseDate
                                .hour(newValue.hour())
                                .minute(newValue.minute())
                                .second(0)
                                .millisecond(0);
                              updateWorkerField(entry.id, 'shift_end', newDateTime.toISOString());
                            }
                          }}
                          disabled={isTimesheetReadOnly}
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                            },
                          }}
                        />
                      </TableCell>

                      {/* Total Hours */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {totalHours.toFixed(2).replace(/\.?0+$/, '')}
                        </Typography>
                      </TableCell>

                      {/* Travel Time */}
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TextField
                            type="number"
                            size="small"
                            label="Hrs"
                            value={data.travel_time_hours ?? ''}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              if (inputValue === '') {
                                updateWorkerField(entry.id, 'travel_time_hours', '');
                              } else {
                                const value = parseInt(inputValue, 10);
                                if (!isNaN(value) && value >= 0) {
                                  updateWorkerField(entry.id, 'travel_time_hours', value);
                                }
                              }
                            }}
                            disabled={isTimesheetReadOnly}
                            inputProps={{ min: 0, step: 1 }}
                            sx={{ width: 70 }}
                          />
                          <TextField
                            type="number"
                            size="small"
                            label="Min"
                            value={data.travel_time_minutes ?? ''}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              if (inputValue === '') {
                                updateWorkerField(entry.id, 'travel_time_minutes', '');
                              } else {
                                const value = parseInt(inputValue, 10);
                                if (!isNaN(value) && value >= 0) {
                                  // Ensure minutes are between 0 and 59
                                  const clampedValue = Math.max(0, Math.min(59, value));
                                  updateWorkerField(entry.id, 'travel_time_minutes', clampedValue);
                                }
                              }
                            }}
                            disabled={isTimesheetReadOnly}
                            inputProps={{ min: 0, max: 59, step: 1 }}
                            sx={{ width: 70 }}
                          />
                        </Stack>
                      </TableCell>

                      {/* Initial Signature - Read Only */}
                      <TableCell>
                        {workerInitials[entry.id] ? (
                          <Box
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 0.5,
                              p: 0.5,
                              height: 32,
                              display: 'flex',
                              alignItems: 'center',
                              bgcolor: 'background.paper',
                            }}
                          >
                            <img
                              src={workerInitials[entry.id]}
                              alt="Initial"
                              style={{ height: '24px', width: 'auto' }}
                            />
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Not signed
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Mobile Card View */}
          <Stack spacing={2} sx={{ display: { xs: 'block', md: 'none' } }}>
            {acceptedEntries.map((entry) => {
              const data = workerData[entry.id] || {
                mob: false,
                shift_start: null,
                break_minutes: 0,
                shift_end: null,
                initial: null,
              };

              // Get total hours from memoized calculation (reactive to workerData changes)
              const totalHours = entryTotalHours[entry.id] || 0;

              return (
                <Card key={entry.id} sx={{ p: 2 }}>
                  <Stack spacing={2}>
                    {/* Worker Header */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        mb: 2,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Avatar
                        src={entry.worker_photo_url || undefined}
                        alt={`${entry.worker_first_name} ${entry.worker_last_name}`}
                        sx={{ width: 32, height: 32 }}
                      >
                        {entry.worker_first_name?.charAt(0)}
                      </Avatar>
                      <Typography variant="subtitle2">
                        {entry.worker_first_name} {entry.worker_last_name}
                      </Typography>
                      {entry.position && (
                        <Chip
                          label={formatPositionDisplay(entry.position)}
                          size="small"
                          variant="soft"
                          color={
                            entry.position.toLowerCase().includes('lct')
                              ? 'info'
                              : entry.position.toLowerCase().includes('tcp')
                                ? 'secondary'
                                : 'primary'
                          }
                          sx={{ height: 20, fontSize: '0.75rem' }}
                        />
                      )}
                    </Box>

                    {/* MOB Checkbox */}
                    <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Checkbox
                          checked={data.mob}
                          onChange={(e) => updateWorkerField(entry.id, 'mob', e.target.checked)}
                          disabled={isTimesheetReadOnly}
                        />
                        <Typography variant="body2">MOB</Typography>
                      </Box>
                    </Box>

                    {/* Time Inputs */}
                    <Stack spacing={2} sx={{ mb: 2 }}>
                      <TimePicker
                        label="Start Time"
                        value={
                          data.shift_start ? dayjs(data.shift_start).tz('America/Vancouver') : null
                        }
                        onChange={(newValue) => {
                          if (newValue && entry.original_start_time) {
                            const baseDate = dayjs(entry.original_start_time).tz(
                              'America/Vancouver'
                            );
                            const newDateTime = baseDate
                              .hour(newValue.hour())
                              .minute(newValue.minute())
                              .second(0)
                              .millisecond(0);
                            updateWorkerField(entry.id, 'shift_start', newDateTime.toISOString());
                          }
                        }}
                        disabled={isTimesheetReadOnly}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                          },
                        }}
                      />

                      <TextField
                        label="Break Minutes"
                        type="number"
                        value={data.break_minutes || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                          updateWorkerField(entry.id, 'break_minutes', Math.max(0, value || 0));
                        }}
                        disabled={isTimesheetReadOnly}
                        fullWidth
                        inputProps={{
                          min: 0,
                          step: 1,
                        }}
                      />

                      <TimePicker
                        label="End Time"
                        value={
                          data.shift_end ? dayjs(data.shift_end).tz('America/Vancouver') : null
                        }
                        onChange={(newValue) => {
                          if (newValue && entry.original_end_time) {
                            const baseDate = dayjs(entry.original_end_time).tz('America/Vancouver');
                            const newDateTime = baseDate
                              .hour(newValue.hour())
                              .minute(newValue.minute())
                              .second(0)
                              .millisecond(0);
                            updateWorkerField(entry.id, 'shift_end', newDateTime.toISOString());
                          }
                        }}
                        disabled={isTimesheetReadOnly}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                          },
                        }}
                      />
                    </Stack>

                    {/* Total Hours Display */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        Total: {totalHours.toFixed(2).replace(/\.?0+$/, '')}
                      </Typography>
                    </Box>

                    {/* Travel Time */}
                    <Stack spacing={2} sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 'medium' }}
                      >
                        Travel Time
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <TextField
                          type="number"
                          size="small"
                          label="Hours"
                          value={data.travel_time_hours ?? ''}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            if (inputValue === '') {
                              updateWorkerField(entry.id, 'travel_time_hours', '');
                            } else {
                              const value = parseInt(inputValue, 10);
                              if (!isNaN(value) && value >= 0) {
                                updateWorkerField(entry.id, 'travel_time_hours', value);
                              }
                            }
                          }}
                          disabled={isTimesheetReadOnly}
                          inputProps={{ min: 0, step: 1 }}
                          sx={{ flex: 1 }}
                          fullWidth
                        />
                        <TextField
                          type="number"
                          size="small"
                          label="Minutes"
                          value={data.travel_time_minutes ?? ''}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            if (inputValue === '') {
                              updateWorkerField(entry.id, 'travel_time_minutes', '');
                            } else {
                              const value = parseInt(inputValue, 10);
                              if (!isNaN(value) && value >= 0) {
                                // Ensure minutes are between 0 and 59
                                const clampedValue = Math.max(0, Math.min(59, value));
                                updateWorkerField(entry.id, 'travel_time_minutes', clampedValue);
                              }
                            }
                          }}
                          disabled={isTimesheetReadOnly}
                          inputProps={{ min: 0, max: 59, step: 1 }}
                          sx={{ flex: 1 }}
                          fullWidth
                        />
                      </Stack>
                    </Stack>

                    {/* Initial Signature - Read Only */}
                    <Stack spacing={1}>
                      <Button
                        variant="outlined"
                        fullWidth
                        disabled
                        startIcon={
                          workerInitials[entry.id] ? (
                            <Iconify icon="solar:check-circle-bold" color="success.main" />
                          ) : (
                            <Iconify icon="solar:pen-bold" />
                          )
                        }
                        sx={{
                          borderColor: workerInitials[entry.id] ? 'success.main' : 'divider',
                          color: workerInitials[entry.id] ? 'success.main' : 'text.secondary',
                        }}
                      >
                        {workerInitials[entry.id] ? 'Signed' : 'Not Signed'}
                      </Button>
                      {workerInitials[entry.id] && (
                        <Box
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            p: 1,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            bgcolor: 'background.paper',
                          }}
                        >
                          <img
                            src={workerInitials[entry.id]}
                            alt="Initial Signature"
                            style={{ height: '40px', width: 'auto', maxWidth: '100%' }}
                          />
                        </Box>
                      )}
                    </Stack>
                  </Stack>
                </Card>
              );
            })}
          </Stack>
        </Box>

        {/* Timesheet Manager Note Section */}
        {managerNotes && (
          <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Timesheet Manager Note
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary' }}>
              {managerNotes}
            </Typography>
          </Box>
        )}

        {/* Admin Note Section */}
        <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Admin Note
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Add admin notes for this timesheet..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            disabled={isTimesheetReadOnly}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.paper',
              },
            }}
          />
        </Box>

        {/* Equipment Left at Site Section */}
        <TimesheetEquipmentLeftSection
          timesheetId={timesheet.id}
          jobVehiclesInventory={jobVehiclesInventory}
          existingEquipmentLeft={equipmentLeftAtSite}
          onSave={handleSaveEquipmentLeft}
          isReadOnly={isTimesheetReadOnly}
          onEquipmentLeftChange={handleEquipmentLeftChange}
          onEquipmentChange={handleEquipmentChange}
          onRefreshInventory={refetchJobVehicles}
        />

        {/* Upload Timesheet Images Section */}
        <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Timesheet Images
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload photos of the completed timesheet for record keeping.
          </Typography>

          {/* Upload Button */}
          {!isTimesheetReadOnly && (
            <Box sx={{ mb: 2 }}>
              <input
                accept="image/jpeg,image/jpg,image/png,image/webp"
                style={{ display: 'none' }}
                id="admin-timesheet-image-upload"
                multiple
                type="file"
                onChange={handleFileUpload}
                disabled={uploadingImages}
              />
              <label htmlFor="admin-timesheet-image-upload">
                <Button
                  variant="contained"
                  component="span"
                  fullWidth
                  startIcon={<Iconify icon="solar:gallery-add-bold" />}
                  disabled={uploadingImages}
                  sx={{
                    mb: 2,
                    display: { xs: 'flex', sm: 'inline-flex' },
                    width: { xs: '100%', sm: 'auto' },
                    py: { xs: 1.5, sm: 0.5 },
                    px: { xs: 2, sm: 1.5 },
                    fontSize: { xs: '1rem', sm: '0.875rem' },
                    minHeight: { xs: '48px', sm: 'auto' },
                  }}
                >
                  {uploadingImages ? 'Uploading...' : 'Upload Images'}
                </Button>
              </label>
            </Box>
          )}

          {/* Image Gallery */}
          {uploadedImages.length > 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, 1fr)',
                  sm: 'repeat(3, 1fr)',
                  md: 'repeat(4, 1fr)',
                },
                gap: 2,
              }}
            >
              {uploadedImages.map((imageUrl, index) => (
                <Box
                  key={index}
                  sx={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    '&:hover': {
                      '& .image-overlay': {
                        opacity: 1,
                      },
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={imageUrl}
                    alt={`Timesheet image ${index + 1}`}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      bgcolor: 'background.neutral',
                    }}
                    onClick={() => setImageDialog({ open: true, imageUrl })}
                  />
                  {!isTimesheetReadOnly && (
                    <Box
                      className="image-overlay"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        p: 1,
                      }}
                    >
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          handleDeleteImage(imageUrl);
                        }}
                        sx={{
                          bgcolor: 'rgba(0, 0, 0, 0.5)',
                          color: 'error.main',
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.7)',
                          },
                        }}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" width={20} />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}

          {uploadedImages.length === 0 && !uploadingImages && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No images uploaded yet.
            </Typography>
          )}
        </Box>

        {/* Client Signature Section - Only show if timesheet is not in draft status */}
        {timesheet.status !== 'draft' && (
          <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Client Signature
            </Typography>

            {/* Client Signature Message */}
            <Paper
              elevation={1}
              sx={{
                p: 2,
                mb: 2,
                bgcolor: 'info.lighter',
                border: '1px solid',
                borderColor: 'info.main',
                borderRadius: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: 'info.darker',
                  fontWeight: 'medium',
                  lineHeight: 1.5,
                }}
              >
                By signing this invoice as a representative of the customer confirms that the hours
                recorded are accurate and were performed by the name of the employee(s) in a
                satisfactory manner.
              </Typography>
            </Paper>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              {(() => {
                // Find client signature from signatures array
                const foundClientSignature = (timesheet.signatures as any)?.find((sig: any) => {
                  try {
                    const signatureData = JSON.parse(sig.signature_data || '{}');
                    return signatureData.client;
                  } catch {
                    return false;
                  }
                });

                const clientSignatureData = foundClientSignature
                  ? JSON.parse((foundClientSignature as any).signature_data).client
                  : null;

                return clientSignatureData ? (
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      bgcolor: 'background.paper',
                      minHeight: '120px',
                      minWidth: '300px',
                      maxWidth: '400px',
                    }}
                  >
                    <img
                      src={clientSignatureData}
                      alt="Client Signature"
                      style={{
                        height: 'auto',
                        width: 'auto',
                        maxHeight: '100px',
                        maxWidth: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      bgcolor: 'background.neutral',
                      minHeight: '120px',
                      minWidth: '300px',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Client signature not provided
                    </Typography>
                  </Box>
                );
              })()}
            </Box>
          </Box>
        )}

        {/* Action Buttons */}
        <Box
          sx={{ p: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}
        >
          <Button variant="outlined" onClick={handleCancel}>
            Cancel
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={async () => {
                try {
                  // Fetch the complete timesheet data from the backend
                  const response = await fetcher(
                    endpoints.timesheet.exportPDF.replace(':id', timesheet.id)
                  );

                  if (response.success && response.data) {
                    // Create PDF with the real data from backend
                    try {
                      const blob = await pdf(
                        <TimesheetPDF timesheetData={response.data} />
                      ).toBlob();
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;

                      // Generate filename with safety checks
                      const clientName = response.data?.client?.name || 'unknown';
                      const jobNumber = response.data?.job?.job_number || 'unknown';
                      const timesheetDate =
                        response.data?.job?.start_time ||
                        response.data?.timesheet?.timesheet_date ||
                        response.data?.timesheet_date ||
                        new Date();

                      // Format client name: remove spaces, convert to lowercase
                      const formattedClientName = clientName.replace(/\s+/g, '-').toLowerCase();

                      const filename = `timesheet-job-${jobNumber}-${formattedClientName}-${getTimesheetDateInVancouver(timesheetDate).format('MM-DD-YYYY')}.pdf`;

                      link.download = filename;
                      document.body.appendChild(link);
                      link.click();

                      // Cleanup after downloading the file
                      setTimeout(() => {
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                      }, 300);

                      toast.success('Timesheet PDF exported successfully');
                    } catch (pdfError) {
                      console.error('Error generating PDF:', pdfError);
                      toast.error('Failed to generate PDF');
                    }
                  } else {
                    console.error('Failed to fetch timesheet data for PDF export');
                    toast.error('Failed to fetch timesheet data');
                  }
                } catch (error: any) {
                  console.error('Error exporting timesheet PDF:', error);
                  toast.error('Failed to export timesheet PDF');
                }
              }}
              startIcon={<Iconify icon="solar:download-bold" />}
            >
              Export Timesheet
            </Button>
            {timesheet.status === 'draft' ? (
              <Button
                variant="contained"
                color="success"
                onClick={handleOpenSubmitDialog}
                disabled={isTimesheetReadOnly}
                startIcon={<Iconify icon="solar:check-circle-bold" />}
              >
                Submit
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={async () => {
                  const toastId = toast.loading('Saving timesheet...');
                  try {
                    // Save all worker entries
                    const savePromises = acceptedEntries.map((entry) => {
                      const data = workerData[entry.id];
                      // Calculate total travel minutes from hours and minutes
                      const hours =
                        data?.travel_time_hours === '' ||
                        data?.travel_time_hours === null ||
                        data?.travel_time_hours === undefined
                          ? 0
                          : Number(data.travel_time_hours) || 0;
                      const minutes =
                        data?.travel_time_minutes === '' ||
                        data?.travel_time_minutes === null ||
                        data?.travel_time_minutes === undefined
                          ? 0
                          : Number(data.travel_time_minutes) || 0;
                      const travelTimeMinutes = hours * 60 + minutes;

                      const processedData = {
                        shift_start: data?.shift_start || null,
                        shift_end: data?.shift_end || null,
                        mob: data?.mob || false,
                        break_minutes: data?.break_minutes || 0,
                        travel_to_minutes: travelTimeMinutes > 0 ? travelTimeMinutes : undefined,
                        initial: workerInitials[entry.id] || null,
                        worker_notes: data?.worker_notes || null,
                        admin_notes: data?.admin_notes || null,
                      };

                      return fetcher([
                        `${endpoints.timesheet.entries}/${entry.id}`,
                        { method: 'PUT', data: processedData },
                      ]);
                    });

                    await Promise.all(savePromises);

                    // Save Equipment Left at Site before updating notes/images - ONLY if changed
                    const normalizeEquipment = (items: any[]) =>
                      (items || [])
                        .map((it) => ({
                          vehicle_id: it.vehicle_id,
                          inventory_id: it.inventory_id,
                          quantity: Number(it.quantity) || 0,
                          notes: it.notes || '',
                        }))
                        .sort((a, b) =>
                          a.vehicle_id === b.vehicle_id
                            ? a.inventory_id.localeCompare(b.inventory_id)
                            : a.vehicle_id.localeCompare(b.vehicle_id)
                        );

                    const existingNormalized = normalizeEquipment(equipmentLeftAtSite);
                    const currentNormalized =
                      equipmentLeftAnswer === 'yes' ? normalizeEquipment(currentEquipmentLeft) : [];

                    const hasEquipmentChanges =
                      JSON.stringify(existingNormalized) !== JSON.stringify(currentNormalized);

                    if (hasEquipmentChanges) {
                      // Preflight check against latest inventory to avoid backend insufficient errors
                      const latestInvRes = await fetcher(
                        endpoints.timesheet.jobVehiclesInventory(timesheet.id)
                      );
                      const latestVehicles: IJobVehicleInventory[] =
                        latestInvRes.data?.vehicles || latestInvRes.vehicles || [];

                      // Build availability map: key = `${vehicle_id}:${inventory_id}` -> available_quantity and sku/name
                      const availability = new Map<
                        string,
                        { available: number; sku?: string; name?: string }
                      >();
                      latestVehicles.forEach((v) => {
                        (v.inventory || []).forEach((inv) => {
                          availability.set(`${v.vehicle_id}:${inv.inventory_id}`, {
                            available: Number(inv.available_quantity) || 0,
                            sku: inv.sku,
                            name: inv.name,
                          });
                        });
                      });

                      // Send ALL current equipment items to backend (with id for existing items)
                      // Backend will handle inserts, updates, and deletes based on id presence
                      const requested = (equipmentLeftAnswer === 'yes' ? currentEquipmentLeft : [])
                        .filter((it: any) => it.quantity > 0)
                        .map((it: any) => ({
                          id: it.id, // Include id if present (for existing items)
                          vehicle_id: it.vehicle_id,
                          inventory_id: it.inventory_id,
                          quantity: Number(it.quantity) || 0,
                          notes: it.notes || '',
                        }));

                      const insufficient = requested.find((it: any) => {
                        const key = `${it.vehicle_id}:${it.inventory_id}`;
                        const avail = availability.get(key)?.available ?? 0;
                        const requestedQty = Number(it.quantity) || 0;
                        if (requestedQty > avail) {
                          console.warn('Insufficient inventory detected:', {
                            vehicle_id: it.vehicle_id,
                            inventory_id: it.inventory_id,
                            requested: requestedQty,
                            available: avail,
                            key,
                          });
                        }
                        return requestedQty > avail;
                      });

                      if (insufficient) {
                        const key = `${insufficient.vehicle_id}:${insufficient.inventory_id}`;
                        const info = availability.get(key);
                        const vehicle = latestVehicles.find(
                          (v) => v.vehicle_id === insufficient.vehicle_id
                        );
                        const vehicleDisplay = vehicle
                          ? `${vehicle.license_plate}${vehicle.unit_number ? ` ${vehicle.unit_number}` : ''}`
                          : 'Unknown Vehicle';
                        const display = info?.sku || info?.name || insufficient.inventory_id;
                        toast.error(
                          `Insufficient inventory for ${display} on vehicle ${vehicleDisplay}: requested ${insufficient.quantity}, available ${info?.available ?? 0}`
                        );
                        throw new Error('Insufficient inventory preflight');
                      }

                      if (requested.length > 0) {
                        await handleSaveEquipmentLeft(requested);
                      }
                    }

                    // Delete removed images from Cloudinary
                    const removedImages = originalImages.filter(
                      (img) => !uploadedImages.includes(img)
                    );
                    for (const imageUrl of removedImages) {
                      try {
                        await deleteTimesheetImage(imageUrl);
                      } catch (error) {
                        console.error('Error deleting image from Cloudinary:', error);
                        // Continue even if deletion fails
                      }
                    }

                    // Update timesheet notes, admin notes, and images
                    await fetcher([
                      `${endpoints.timesheet.list}/${timesheet.id}`,
                      {
                        method: 'PUT',
                        data: {
                          notes: managerNotes,
                          admin_notes: adminNotes,
                          images: uploadedImages,
                        },
                      },
                    ]);

                    await queryClient.refetchQueries({
                      queryKey: ['timesheet-detail-query', timesheet.id],
                    });
                    // Refresh job vehicles inventory to update available quantities after timesheet update
                    await queryClient.refetchQueries({
                      queryKey: ['job-vehicles-inventory', timesheet.id],
                    });
                    toast.success('Timesheet updated successfully');
                  } catch {
                    toast.error('Failed to update timesheet');
                  } finally {
                    toast.dismiss(toastId);
                  }
                }}
                disabled={isTimesheetReadOnly}
                startIcon={<Iconify icon="solar:pen-bold" />}
              >
                Update Timesheet
              </Button>
            )}
          </Box>
        </Box>
      </Card>

      {/* Signature Dialog for Initial Only (Admins cannot edit client signature) */}
      <TimeSheetSignatureDialog
        title="Worker Initial Signature"
        type="initial"
        dialog={signatureDialog}
        onSave={(signature, type) => {
          if (signature && currentWorkerIdForSignature) {
            handleInitialSignature(signature);
          }
        }}
      />

      {/* Submit Dialog */}
      {renderSubmitDialog()}

      {/* Timesheet Manager Selection Dialog */}
      <TimesheetManagerSelectionDialog
        open={timesheetManagerSelectionDialog.open}
        onClose={() => setTimesheetManagerSelectionDialog({ open: false })}
        currentManager={{
          id: timesheet.timesheet_manager_id,
          name: `${timesheet.timesheet_manager?.first_name || ''} ${timesheet.timesheet_manager?.last_name || ''}`.trim(),
          photo_url: null,
        }}
        workerOptions={jobWorkers.workers.map((worker: any) => ({
          value: worker.user_id,
          label: `${worker.first_name} ${worker.last_name}`,
          photo_url: worker.photo_url || null,
          first_name: worker.first_name,
          last_name: worker.last_name,
        }))}
        onConfirm={(selectedWorkerId) => {
          const selectedWorker = jobWorkers.workers.find(
            (w: any) => w.user_id === selectedWorkerId
          );
          if (selectedWorker) {
            setTimesheetManagerChangeDialog({
              open: true,
              newManager: selectedWorker,
            });
            setTimesheetManagerSelectionDialog({ open: false });
          }
        }}
      />

      {/* Image Preview Dialog */}
      <Dialog
        open={imageDialog.open}
        onClose={() => setImageDialog({ open: false, imageUrl: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography variant="h6">Timesheet Image</Typography>
          <IconButton
            onClick={() => setImageDialog({ open: false, imageUrl: null })}
            sx={{ color: 'text.secondary' }}
          >
            <Iconify icon="solar:close-circle-bold" width={24} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {imageDialog.imageUrl && (
            <Box
              component="img"
              src={imageDialog.imageUrl}
              alt="Timesheet image preview"
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: '70vh',
                objectFit: 'contain',
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Timesheet Manager Change Confirmation Dialog */}
      {timesheetManagerChangeDialog.newManager && (
        <TimesheetManagerChangeDialog
          open={timesheetManagerChangeDialog.open}
          onClose={handleCloseTimesheetManagerChange}
          onConfirm={handleConfirmTimesheetManagerChange}
          currentManager={{
            id: timesheet.timesheet_manager_id,
            name: `${timesheet.timesheet_manager?.first_name || ''} ${timesheet.timesheet_manager?.last_name || ''}`.trim(),
            photo_url: null,
          }}
          newManager={{
            id: timesheetManagerChangeDialog.newManager.user_id,
            name: `${timesheetManagerChangeDialog.newManager.first_name} ${timesheetManagerChangeDialog.newManager.last_name}`,
            photo_url: timesheetManagerChangeDialog.newManager.photo_url || null,
          }}
        />
      )}
    </Box>
  );
}
