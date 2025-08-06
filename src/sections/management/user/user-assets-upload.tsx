import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Skeleton from '@mui/material/Skeleton';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import useMediaQuery from '@mui/material/useMediaQuery';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { fData } from 'src/utils/format-number';
import { sendToVisionAPI } from 'src/utils/vision-ocr';
import { preprocessImageForOCR } from 'src/utils/image-preprocess';
import { isOCRSupported, extractExpirationDate } from 'src/utils/ocr-utils';
import { type AssetType, deleteUserAsset, uploadUserAsset } from 'src/utils/cloudinary-upload';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';
import { OCRProcessor } from 'src/components/ocr-processor';
import { CameraCapture } from 'src/components/camera-capture';
import { ImageCropDialog } from 'src/components/image-crop-dialog';

// ----------------------------------------------------------------------

const AssetUploadSchema = {
  tcp_certification: zod.instanceof(File).optional().nullable(),
  driver_license: zod.instanceof(File).optional().nullable(),
  other_documents: zod.instanceof(File).optional().nullable(),
  tcp_expiration_date: zod.string().optional(),
  driver_license_expiration_date: zod.string().optional(),
  expiration_date: zod
    .string()
    .min(1, { message: 'Expiration date is required!' })
    .refine(
      (date) => {
        if (!date) return false;
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day
        return selectedDate >= today;
      },
      { message: 'Expiration date cannot be in the past!' }
    ),
} satisfies zod.ZodRawShape;

const AssetUploadSchemaType = zod.object(AssetUploadSchema);
type AssetUploadSchemaType = zod.infer<typeof AssetUploadSchemaType>;

// ----------------------------------------------------------------------

type AssetFile = {
  id: string;
  url: string;
  name: string;
  uploadedAt: Date;
};

type Props = {
  userId: string;
  currentAssets?: {
    tcp_certification?: AssetFile[];
    driver_license?: AssetFile[];
    other_documents?: AssetFile[];
  };
  onAssetsUpdate?: (assets: {
    tcp_certification?: AssetFile[];
    driver_license?: AssetFile[];
    other_documents?: AssetFile[];
  }) => void;
  isLoading?: boolean;
};

// Helper function to format asset type names
const formatAssetTypeName = (assetType: AssetType): string => {
  switch (assetType) {
    case 'tcp_certification':
      return 'TCP Certification';
    case 'driver_license':
      return 'Driver License';
    case 'other_documents':
      return 'Other Documents';
    default:
      return assetType.replace('_', ' ');
  }
};

export function UserAssetsUpload({
  userId,
  currentAssets,
  onAssetsUpdate,
  isLoading = false,
}: Props) {
  const [uploading, setUploading] = useState<AssetType | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraDocumentType, setCameraDocumentType] = useState<AssetType | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<{ type: AssetType; id: string } | null>(null);
  const [selectedImageIndices, setSelectedImageIndices] = useState<{
    tcp_certification?: number;
    driver_license?: number;
    other_documents?: number;
  }>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const confirmDeleteDialog = useBoolean();
  const [showExpirationDialog, setShowExpirationDialog] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{ file: File; assetType: AssetType } | null>(
    null
  );
  const [expirationDates, setExpirationDates] = useState<{
    tcp_certification?: string;
    driver_license?: string;
  }>({});
  const [showEditExpirationDialog, setShowEditExpirationDialog] = useState(false);
  const [editingExpirationFor, setEditingExpirationFor] = useState<AssetType | null>(null);
  const [showOCRDialog, setShowOCRDialog] = useState(false);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrDocumentType, setOcrDocumentType] = useState<string>('');
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingAssetType, setPendingAssetType] = useState<AssetType | null>(null);
  const [ocrText, setOcrText] = useState<string>('');
  const [extractedDate, setExtractedDate] = useState<string>('');
  // Add state for expiry extraction toggle
  const [shouldExtractExpiry, setShouldExtractExpiry] = useState(true);
  // Add state for overwrite confirmation dialog
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [pendingOverwrite, setPendingOverwrite] = useState<{
    file: File;
    assetType: AssetType;
    expirationDate?: string;
    fileId?: string;
  } | null>(null);
  const [isProcessingCrop, setIsProcessingCrop] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const methods = useForm<AssetUploadSchemaType>({
    resolver: zodResolver(zod.object(AssetUploadSchema)),
    defaultValues: {
      tcp_certification: null,
      driver_license: null,
      other_documents: null,
      tcp_expiration_date: '',
      driver_license_expiration_date: '',
      expiration_date: '',
    },
  });

  // Fetch expiration dates on component mount
  useEffect(() => {
    const fetchExpirationDates = async () => {
      if (!userId) return;

      try {
        const response = await fetcher(`${endpoints.user}/${userId}`);
        // The backend returns data in a nested structure: { data: { user: { ... } } }
        const userData = response.data?.user || response;

        if (userData.tcp_certification_expiry || userData.driver_license_expiry) {
          setExpirationDates({
            tcp_certification: userData.tcp_certification_expiry,
            driver_license: userData.driver_license_expiry,
          });
        }
      } catch (error) {
        console.error('Error fetching expiration dates:', error);
      }
    };

    fetchExpirationDates();
  }, [userId]);

  // Auto-select first image for each document type when assets are loaded
  useEffect(() => {
    if (currentAssets) {
      const newSelections: { [key: string]: number } = {};
      let hasChanges = false;

      // Check each asset type
      (['tcp_certification', 'driver_license', 'other_documents'] as const).forEach((assetType) => {
        const assetFiles = currentAssets[assetType] || [];
        const currentSelection = selectedImageIndices[assetType];
        
        // Auto-select first image if there are images but no selection for this type
        if (assetFiles.length > 0 && currentSelection === undefined) {
          newSelections[assetType] = 0;
          hasChanges = true;
        }
      });

      // Update selections if needed
      if (hasChanges) {
        setSelectedImageIndices(prev => ({ ...prev, ...newSelections }));
      }
    }
  }, [currentAssets, selectedImageIndices]);

  // Update handleAssetUpload signature
  type HandleAssetUploadFn = (
    file: File,
    assetType: AssetType,
    expirationDate?: string,
    forceOverwrite?: boolean
  ) => Promise<void>;
  const handleAssetUpload: HandleAssetUploadFn = async (
    file,
    assetType,
    expirationDate,
    forceOverwrite = false
  ) => {
    if (!userId) {
      toast.error('User ID is required');
      return;
    }

    // Check if this is the first upload for TCP certification or driver license
    const currentFiles = currentAssets?.[assetType as keyof typeof currentAssets] || [];
    const isFirstUpload = currentFiles.length === 0;
    const requiresExpiration =
      (assetType === 'tcp_certification' || assetType === 'driver_license') && isFirstUpload;

    // Always require expiration date for certifications, regardless of shouldExtractExpiry
    if (requiresExpiration && !expirationDate) {
      // Try OCR first if supported and auto-extract is enabled
      if (
        shouldExtractExpiry &&
        isOCRSupported() &&
        (assetType === 'tcp_certification' || assetType === 'driver_license')
      ) {
        setOcrFile(file);
        setOcrDocumentType(
          assetType === 'tcp_certification' ? 'TCP Certification' : 'Driver License'
        );
        setShowOCRDialog(true);
        return;
      }

      // Fallback to manual entry (always show for certifications without expiry)
      setPendingUpload({ file, assetType });
      setShowExpirationDialog(true);
      return;
    }

    // If not extracting expiry and it's not a certification, upload directly with no dialogs
    if (!shouldExtractExpiry && !requiresExpiration) {
      setUploading(assetType);
      const toastId = toast.loading(`Uploading ${formatAssetTypeName(assetType)}...`);
      try {
        // Generate unique ID for the file
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 9);
        const fileId = `${timestamp}_${randomId}`;
        const customFileName = `${assetType}_${userId}_${fileId}`;

        await uploadUserAsset({ file, userId, assetType, customFileName });
        toast.dismiss(toastId);
        toast.success(`${formatAssetTypeName(assetType)} uploaded successfully!`);
        if (onAssetsUpdate) {
          onAssetsUpdate(await fetcher(`${endpoints.cloudinaryUserAssets}/${userId}`));
        }
      } catch (error) {
        toast.dismiss(toastId);
        console.error(`Error uploading ${assetType}:`, error);
        toast.error(`Failed to upload ${formatAssetTypeName(assetType)}. Please try again.`);
      } finally {
        setUploading(null);
      }
      return;
    }

    // In handleAssetUpload, only check expirationDates for cert/license
    if (
      shouldExtractExpiry &&
      expirationDate &&
      (assetType === 'tcp_certification' || assetType === 'driver_license') &&
      expirationDates[assetType as 'tcp_certification' | 'driver_license'] &&
      !forceOverwrite
    ) {
      setPendingOverwrite({ file, assetType, expirationDate });
      setShowOverwriteDialog(true);
      return;
    }

    setUploading(assetType);
    const toastId = toast.loading(`Uploading ${formatAssetTypeName(assetType)}...`);

    try {
      // Generate unique ID for the file
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const fileId = `${timestamp}_${randomId}`;

      // Use the correct naming pattern that the backend expects
      const customFileName = expirationDate
        ? `${assetType}_${userId}_${fileId}_expdate`
        : `${assetType}_${userId}_${fileId}`;

      const uploadedUrl = await uploadUserAsset({
        file,
        userId,
        assetType,
        customFileName,
      });

      toast.dismiss(toastId);
      toast.success(`${formatAssetTypeName(assetType)} uploaded successfully!`);

      // Create new asset file object
      const newAssetFile: AssetFile = {
        id: fileId,
        url: uploadedUrl,
        name: file.name,
        uploadedAt: new Date(),
      };

      // Update the parent component
      if (onAssetsUpdate) {
        const updatedFiles = [...currentFiles, newAssetFile];
        onAssetsUpdate({
          ...currentAssets,
          [assetType as keyof typeof currentAssets]: updatedFiles,
        });

        // Auto-select the first image if no image is currently selected for this type
        if (selectedImageIndices[assetType as keyof typeof selectedImageIndices] === undefined) {
          setSelectedImageIndices(prev => ({ ...prev, [assetType]: 0 }));
        }
      }

      // Save expiration date if provided
      if (expirationDate && (assetType === 'tcp_certification' || assetType === 'driver_license')) {
        try {
          await fetcher([
            `${endpoints.user}/${userId}/certification-expiry`,
            {
              method: 'PATCH',
              data: {
                documentType: assetType,
                expirationDate,
              },
            },
          ]);
          toast.success(`${formatAssetTypeName(assetType)} expiration date saved successfully!`);

          // Update local state with the new expiration date
          setExpirationDates((prev) => ({
            ...prev,
            [assetType]: expirationDate,
          }));

          // Trigger user refetch immediately to update badge
          if (onAssetsUpdate) {
            // This will trigger refetchUser in the parent component
            onAssetsUpdate(currentAssets || {});
          }
        } catch (error) {
          console.error('Error saving expiration date:', error);
          toast.error('Failed to save expiration date, but document was uploaded successfully.');
        }
      }

      // Clear the form field
      methods.setValue(assetType as keyof AssetUploadSchemaType, null);
    } catch (error) {
      toast.dismiss(toastId);
      console.error(`Error uploading ${assetType}:`, error);
      toast.error(`Failed to upload ${formatAssetTypeName(assetType)}. Please try again.`);
    } finally {
      setUploading(null);
    }
  };

  const handleDeleteClick = (assetType: AssetType, fileId: string) => {
    setAssetToDelete({ type: assetType, id: fileId });
    confirmDeleteDialog.onTrue();
  };

  const handleAssetDelete = async () => {
    if (!userId || !assetToDelete) {
      toast.error('User ID or asset type is required');
      return;
    }

    setIsDeleting(true);
    const toastId = toast.loading(`Deleting ${formatAssetTypeName(assetToDelete.type)}...`);

    try {
      // Find the file to get its custom file name
      const currentFiles = currentAssets?.[assetToDelete.type as keyof typeof currentAssets] || [];
      const fileToDelete = currentFiles.find((file: AssetFile) => file.id === assetToDelete.id);

      if (!fileToDelete) {
        throw new Error('File not found');
      }

      // Extract the custom file name from the URL or use the ID
      const customFileName = `${assetToDelete.type}_${userId}_${assetToDelete.id}`;

      await deleteUserAsset(userId, assetToDelete.type, customFileName);

      // We should only clear expiration dates when it's the last file AND there's an expiration date set
      // Don't try to track individual files with expiration dates - just check if this is the last file

      toast.dismiss(toastId);
      toast.success(`${formatAssetTypeName(assetToDelete.type)} deleted successfully!`);

      // Update the parent component
      if (onAssetsUpdate) {
        const updatedFiles = currentFiles.filter((file: AssetFile) => file.id !== assetToDelete.id);
        onAssetsUpdate({
          ...currentAssets,
          [assetToDelete.type as keyof typeof currentAssets]: updatedFiles,
        });
      }

      // Update selectedImageIndices if the deleted file was selected
      const currentSelectedIndex = selectedImageIndices[assetToDelete.type as keyof typeof selectedImageIndices];
      if (currentSelectedIndex !== undefined) {
        const remainingFiles = currentFiles.filter(
          (file: AssetFile) => file.id !== assetToDelete.id
        );

        if (remainingFiles.length === 0) {
          // No files left, clear selection for this type
          setSelectedImageIndices(prev => ({ ...prev, [assetToDelete.type]: undefined }));
        } else if (currentSelectedIndex >= remainingFiles.length) {
          // Selected index is now out of bounds, set to last available index
          setSelectedImageIndices(prev => ({ 
            ...prev, 
            [assetToDelete.type]: remainingFiles.length - 1 
          }));
        }
        // If selected index is still valid, keep it as is
      }

      // If this was the last file of a document type that requires expiration date, clear the expiration date
      const updatedFiles = currentFiles.filter((file: AssetFile) => file.id !== assetToDelete.id);
      if (
        updatedFiles.length === 0 &&
        (assetToDelete.type === 'tcp_certification' || assetToDelete.type === 'driver_license')
      ) {
        try {
          // Clear the expiration date in the backend
          await fetcher([
            `${endpoints.user}/${userId}/certification-expiry`,
            {
              method: 'PATCH',
              data: {
                documentType: assetToDelete.type,
                expirationDate: null,
              },
            },
          ]);

          // Clear the expiration date in local state
          setExpirationDates((prev) => ({
            ...prev,
            [assetToDelete.type]: undefined,
          }));

          // Trigger user refetch immediately to update badge
          if (onAssetsUpdate) {
            onAssetsUpdate(currentAssets || {});
          }

          toast.success(`${formatAssetTypeName(assetToDelete.type)} expiration date cleared.`);
        } catch (error) {
          console.error('Error clearing expiration date:', error);
          // Don't show error toast since the file deletion was successful
        }
      }
    } catch (error) {
      toast.dismiss(toastId);
      console.error(`Error deleting ${assetToDelete.type}:`, error);
      toast.error(`Failed to delete ${formatAssetTypeName(assetToDelete.type)}. Please try again.`);
    } finally {
      setIsDeleting(false);
      confirmDeleteDialog.onFalse();
      setAssetToDelete(null);
    }
  };

  const handleCameraCapture = (assetType: AssetType) => {
    if (assetType === 'tcp_certification' || assetType === 'driver_license') {
      setCameraDocumentType(assetType);
      setCameraOpen(true);
    }
  };

  const handleCameraClose = () => {
    setCameraOpen(false);
    setCameraDocumentType(null);
  };

  const handleExpirationSubmit = async (data: AssetUploadSchemaType) => {
    if (!pendingUpload) return;

    if (!data.expiration_date) {
      toast.error('Please select an expiration date');
      return;
    }

    setShowExpirationDialog(false);
    await handleAssetUpload(pendingUpload.file, pendingUpload.assetType, data.expiration_date);
    setPendingUpload(null);
  };

  const handleExpirationCancel = () => {
    setShowExpirationDialog(false);
    setPendingUpload(null);
    setUploading(null);
    // Reset the expiration date form field
    methods.setValue('expiration_date', '');
    // Clear the form field that was selected
    if (pendingUpload) {
      methods.setValue(pendingUpload.assetType as keyof AssetUploadSchemaType, null);
      // Reset the file input element so the user can select the same file again
      const fileInput = document.getElementById(
        `file-upload-${pendingUpload.assetType}`
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
    // Reset upload-related state
    setPendingFile(null);
    setPendingAssetType(null);
    setFullImageFile(null);
  };

  const handleCameraCaptureComplete = async (file: File, expirationDate?: string) => {
    if (!cameraDocumentType) return;

    // Open crop dialog with the captured image
    setPendingFile(file);
    setPendingAssetType(cameraDocumentType);
    const dataUrl = await fileToDataUrl(file);
    setCropImageUrl(dataUrl);
    setShowCropDialog(true);
    setFullImageFile(file);
  };

  const handleEditExpirationClick = (assetType: AssetType) => {
    setEditingExpirationFor(assetType);
    setShowEditExpirationDialog(true);
    // Set the current expiration date in the form
    const currentDate = expirationDates[assetType as keyof typeof expirationDates];
    methods.setValue('expiration_date', currentDate || '');
  };

  const handleEditExpirationSubmit = async (data: AssetUploadSchemaType) => {
    if (!editingExpirationFor || !data.expiration_date) return;

    try {
      await fetcher([
        `${endpoints.user}/${userId}/certification-expiry`,
        {
          method: 'PATCH',
          data: {
            documentType: editingExpirationFor,
            expirationDate: data.expiration_date,
          },
        },
      ]);

      // Update local state with the new expiration date
      setExpirationDates((prev) => ({
        ...prev,
        [editingExpirationFor]: data.expiration_date,
      }));

      // Trigger user refetch immediately to update badge
      if (onAssetsUpdate) {
        // This will trigger refetchUser in the parent component
        onAssetsUpdate(currentAssets || {});
      }

      toast.success(
        `${formatAssetTypeName(editingExpirationFor)} expiration date updated successfully!`
      );
      setShowEditExpirationDialog(false);
      setEditingExpirationFor(null);
      methods.setValue('expiration_date', '');
    } catch (error) {
      console.error('Error updating expiration date:', error);
      toast.error('Failed to update expiration date. Please try again.');
    }
  };

  const handleEditExpirationCancel = () => {
    setShowEditExpirationDialog(false);
    setEditingExpirationFor(null);
    methods.setValue('expiration_date', '');
  };

  const handleOCRConfirm = (expirationDate: string) => {
    if (ocrFile && ocrDocumentType) {
      const assetType =
        ocrDocumentType === 'TCP Certification' ? 'tcp_certification' : 'driver_license';
      handleAssetUpload(ocrFile, assetType, expirationDate);
    }
  };

  const handleOCRClose = () => {
    setShowOCRDialog(false);
    setOcrFile(null);
    setOcrDocumentType('');
    setOcrText('');
    setExtractedDate('');
  };

  // Helper to convert File to data URL
  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // New handler for file input change
  const handleFileInputChange = async (file: File, assetType: AssetType) => {
    // For other documents, skip cropping and OCR - upload directly
    if (assetType === 'other_documents') {
      await handleAssetUpload(file, assetType);
      return;
    }

    // For TCP certification and driver license, go through cropping flow
    setPendingFile(file);
    setPendingAssetType(assetType);
    const dataUrl = await fileToDataUrl(file);
    setCropImageUrl(dataUrl);
    setShowCropDialog(true);
    // Store the original file for "Use Full Image"
    setFullImageFile(file);
  };

  // Add state for full image mode
  const [fullImageFile, setFullImageFile] = useState<File | null>(null);

  // Called when cropping is done or full image is used
  const handleCropComplete = async (croppedBlob: Blob, isFullImage = false) => {
    setShowCropDialog(false);
    setCropImageUrl(null);
    setIsProcessingCrop(true);
    
    try {
      let fileToUse: File;
      if (isFullImage && fullImageFile) {
        fileToUse = fullImageFile;
      } else {
        fileToUse = new File([croppedBlob], pendingFile?.name || 'cropped.jpg', {
          type: 'image/jpeg',
        });
      }
      
      if (fileToUse && pendingAssetType) {
        if (
          shouldExtractExpiry &&
          (pendingAssetType === 'tcp_certification' || pendingAssetType === 'driver_license')
        ) {
          // Preprocess for OCR only for certification documents
          const preprocessedBlob = await preprocessImageForOCR(fileToUse);
          let ocrTextResult = '';
          let extractedDateResult = '';
          try {
            ocrTextResult = await sendToVisionAPI(preprocessedBlob);
            if (ocrTextResult) {
              extractedDateResult = extractExpirationDate(ocrTextResult) || '';
            }
          } catch {
            toast.error('Cloud OCR failed. Please enter the date manually.');
          }
          if (ocrTextResult) {
            setOcrFile(fileToUse);
            setOcrDocumentType(
              pendingAssetType === 'tcp_certification' ? 'TCP Certification' : 'Driver License'
            );
            setOcrText(ocrTextResult);
            setExtractedDate(extractedDateResult);
            setShowOCRDialog(true);
          } else {
            handleAssetUpload(fileToUse, pendingAssetType);
          }
        } else {
          // Skip OCR, go straight to upload/manual entry
          handleAssetUpload(fileToUse, pendingAssetType);
        }
      }
    } catch (error) {
      console.error('Error processing cropped image:', error);
      toast.error('Error processing image. Please try again.');
    } finally {
      setIsProcessingCrop(false);
      setPendingFile(null);
      setPendingAssetType(null);
      setFullImageFile(null);
    }
  };

  const assetConfigs = [
    {
      type: 'tcp_certification' as const,
      label: 'TCP Certification',
      description: 'Upload TCP (Traffic Control Person) certification',
      maxSize: 5 * 1024 * 1024, // 5MB
      supportsCamera: true,
      supportsPreview: true,
    },
    {
      type: 'driver_license' as const,
      label: 'Driver License',
      description: 'Upload driver license',
      maxSize: 5 * 1024 * 1024, // 5MB
      supportsCamera: true,
      supportsPreview: true,
    },
    {
      type: 'other_documents' as const,
      label: 'Other Documents',
      description: 'Upload other relevant documents',
      maxSize: 10 * 1024 * 1024, // 10MB
      supportsCamera: false,
      supportsPreview: true,
    },
  ] as const;

  const handleConfirmOverwrite = async () => {
    if (!pendingOverwrite) return;
    setShowOverwriteDialog(false);
    await handleAssetUpload(
      pendingOverwrite.file,
      pendingOverwrite.assetType,
      pendingOverwrite.expirationDate,
      true
    );
    setPendingOverwrite(null);
  };
  const handleCancelOverwrite = () => {
    setShowOverwriteDialog(false);
    setPendingOverwrite(null);
  };

  return (
    <Form methods={methods}>
      <Grid container spacing={3}>
        {assetConfigs.map((config) => {
          const assetFiles = currentAssets?.[config.type] || [];
          const isUploading = uploading === config.type;

          return (
            <Grid key={config.type} size={{ xs: 12, md: 6, lg: 4 }}>
              <Box sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6">{config.label}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {config.description}
                  </Typography>

                  {isLoading ? (
                    <Box>
                      <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
                      <Skeleton variant="rectangular" height={32} width="60%" />
                    </Box>
                  ) : assetFiles.length > 0 ? (
                    <Box>
                      <Typography variant="body2" color="success.main" sx={{ mb: 1 }}>
                        ✓ {assetFiles.length} file{assetFiles.length > 1 ? 's' : ''} uploaded
                        successfully
                      </Typography>

                      {/* Display expiration date for TCP certification and driver license */}
                      {(config.type === 'tcp_certification' || config.type === 'driver_license') &&
                        expirationDates[config.type] && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              📅 Expires:{' '}
                              {(() => {
                                // Handle different possible date formats
                                const dateStr = expirationDates[config.type]!;

                                // If it's already a Date object or ISO string, convert it properly
                                if (dateStr.includes('T') || dateStr.includes('Z')) {
                                  // It's an ISO date string, parse it safely
                                  const date = new Date(dateStr);
                                  const year = date.getFullYear();
                                  const month = String(date.getMonth() + 1).padStart(2, '0');
                                  const day = String(date.getDate()).padStart(2, '0');
                                  return `${month}/${day}/${year}`;
                                } else if (dateStr.includes('-')) {
                                  // It's in YYYY-MM-DD format
                                  const [year, month, day] = dateStr.split('-');
                                  return `${month}/${day}/${year}`;
                                } else {
                                  // Fallback to original method
                                  return new Date(dateStr).toLocaleDateString('en-US', {
                                    month: '2-digit',
                                    day: '2-digit',
                                    year: 'numeric',
                                  });
                                }
                              })()}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleEditExpirationClick(config.type)}
                              sx={{
                                p: 0.5,
                                '&:hover': {
                                  backgroundColor: 'action.hover',
                                },
                              }}
                            >
                              <Iconify icon="solar:pen-bold" width={16} />
                            </IconButton>
                          </Box>
                        )}

                      {config.supportsPreview && (
                        <Box sx={{ mb: 2 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mb: 1, display: 'block' }}
                          >
                            Preview ({assetFiles.length} image{assetFiles.length > 1 ? 's' : ''})
                          </Typography>

                          {/* Main Image Display */}
                          {selectedImageIndices[config.type] !== undefined && (
                            <Box sx={{ mb: 2, textAlign: 'center' }}>
                              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                <Avatar
                                  src={assetFiles[selectedImageIndices[config.type]!].url}
                                  variant="rounded"
                                  sx={{
                                    width: 260,
                                    height: 210,
                                    cursor: 'pointer',
                                    border: '2px solid',
                                    borderColor: 'primary.main',
                                    '&:hover': {
                                      transform: 'scale(1.02)',
                                      transition: 'all 0.2s ease-in-out',
                                      boxShadow: (themeContext) => 
                                        themeContext.palette.mode === 'dark' 
                                          ? '0 4px 12px rgba(255,255,255,0.15)' 
                                          : '0 4px 12px rgba(0,0,0,0.15)',
                                    },
                                  }}
                                  onClick={() =>
                                    window.open(assetFiles[selectedImageIndices[config.type]!].url, '_blank')
                                  }
                                />
                                <Chip
                                  label={`${selectedImageIndices[config.type]! + 1} of ${assetFiles.length}`}
                                  size="small"
                                  sx={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    backgroundColor: 'rgba(0,0,0,0.8)',
                                    color: 'white !important',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    zIndex: 2,
                                    pointerEvents: 'none',
                                    '& .MuiChip-label': {
                                      color: 'white !important',
                                    },
                                  }}
                                />
                              </Box>
                            </Box>
                          )}

                          {/* Thumbnail Slider */}
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 1,
                              overflowX: 'auto',
                              pb: 2,
                              pt: 1,
                              '&::-webkit-scrollbar': {
                                height: 6,
                              },
                              '&::-webkit-scrollbar-track': {
                                backgroundColor: (themeContext) => 
                                  themeContext.palette.mode === 'dark' 
                                    ? 'rgba(255,255,255,0.1)' 
                                    : 'rgba(0,0,0,0.1)',
                                borderRadius: 3,
                              },
                              '&::-webkit-scrollbar-thumb': {
                                backgroundColor: (themeContext) => 
                                  themeContext.palette.mode === 'dark' 
                                    ? 'rgba(255,255,255,0.3)' 
                                    : 'rgba(0,0,0,0.3)',
                                borderRadius: 3,
                              },
                            }}
                          >
                            {assetFiles.map((file, index) => {
                              const isSelected =
                                selectedImageIndices[config.type] === index;

                              return (
                                <Box
                                  key={file.id}
                                  sx={{ position: 'relative', flexShrink: 0, pt: 1, pr: 1 }}
                                >
                                  <Avatar
                                    src={file.url}
                                    variant="rounded"
                                    sx={{
                                      width: 80,
                                      height: 60,
                                      cursor: 'pointer',
                                      border: '2px solid',
                                      borderColor: isSelected ? 'primary.main' : 'divider',
                                      opacity: isSelected ? 1 : 0.8,
                                      '&:hover': {
                                        borderColor: 'primary.main',
                                        opacity: 1,
                                        transform: 'scale(1.05)',
                                        transition: 'all 0.2s ease-in-out',
                                        boxShadow: (themeContext) => 
                                          themeContext.palette.mode === 'dark' 
                                            ? '0 2px 8px rgba(255,255,255,0.2)' 
                                            : '0 2px 8px rgba(0,0,0,0.2)',
                                      },
                                    }}
                                    onClick={() =>
                                      setSelectedImageIndices(prev => ({ ...prev, [config.type]: index }))
                                    }
                                  />
                                  <Chip
                                    label="×"
                                    size="small"
                                    sx={{
                                      position: 'absolute',
                                      top: 0,
                                      right: 0,
                                      backgroundColor: 'error.main',
                                      color: 'white',
                                      width: 17,
                                      height: 17,
                                      fontSize: '1rem',
                                      fontWeight: 'bold',
                                      cursor: 'pointer',
                                      zIndex: 1,
                                      '& .MuiChip-label': {
                                        padding: 0,
                                        lineHeight: 1,
                                      },
                                      '&:hover': {
                                        backgroundColor: 'error.dark',
                                        transform: 'scale(1.1)',
                                      },
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteClick(config.type, file.id);
                                    }}
                                  />
                                </Box>
                              );
                            })}
                          </Box>

                          {/* Navigation Buttons for Multiple Images */}
                          {assetFiles.length > 1 &&
                            selectedImageIndices[config.type] !== undefined && (
                              <Stack
                                direction="row"
                                spacing={1}
                                justifyContent="center"
                                sx={{ mt: 1 }}
                              >
                                <Button
                                  size="small"
                                  variant="outlined"
                                  disabled={selectedImageIndices[config.type] === 0}
                                  onClick={() =>
                                    setSelectedImageIndices(prev => ({
                                      ...prev,
                                      [config.type]: Math.max(0, selectedImageIndices[config.type]! - 1),
                                    }))
                                  }
                                >
                                  ← Previous
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  disabled={selectedImageIndices[config.type] === assetFiles.length - 1}
                                  onClick={() =>
                                    setSelectedImageIndices(prev => ({
                                      ...prev,
                                      [config.type]: Math.min(
                                        assetFiles.length - 1,
                                        selectedImageIndices[config.type]! + 1
                                      ),
                                    }))
                                  }
                                >
                                  Next →
                                </Button>
                              </Stack>
                            )}
                        </Box>
                      )}

                      <Stack direction="row" spacing={1}>
                        {assetFiles.length > 1 &&
                          selectedImageIndices[config.type] !== undefined && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                // Download selected file
                                const selectedFile = assetFiles[selectedImageIndices[config.type]!];
                                if (!selectedFile) {
                                  console.error('Selected file not found');
                                  return;
                                }

                                // Use fetch to get the file as blob for better compatibility
                                fetch(selectedFile.url)
                                  .then((response) => {
                                    if (!response.ok) {
                                      throw new Error('Network response was not ok');
                                    }
                                    return response.blob();
                                  })
                                  .then((blob) => {
                                    const url = window.URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    // Create a cleaner filename
                                    const cleanName = `${config.label.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
                                    link.download = cleanName;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    window.URL.revokeObjectURL(url);
                                  })
                                  .catch((error) => {
                                    console.error('Download failed:', error);
                                    // Fallback to direct download
                                    const link = document.createElement('a');
                                    link.href = selectedFile.url;
                                    // Create a cleaner filename
                                    const cleanName = `${config.label.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
                                    link.download = cleanName;
                                    link.target = '_blank';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  });
                              }}
                              startIcon={<Iconify icon="solar:download-bold" />}
                            >
                              Download Current
                            </Button>
                          )}
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            // Download all files as zip or show list
                            if (assetFiles.length === 1) {
                              // Single file download
                              const file = assetFiles[0];
                              fetch(file.url)
                                .then((response) => {
                                  if (!response.ok) {
                                    throw new Error('Network response was not ok');
                                  }
                                  return response.blob();
                                })
                                .then((blob) => {
                                  const url = window.URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = file.name;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  window.URL.revokeObjectURL(url);
                                })
                                .catch((error) => {
                                  console.error('Download failed:', error);
                                  // Fallback to direct download
                                  const link = document.createElement('a');
                                  link.href = file.url;
                                  link.download = file.name;
                                  link.target = '_blank';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                });
                            } else {
                              // Multiple files - download each
                              assetFiles.forEach((file, index) => {
                                setTimeout(() => {
                                  fetch(file.url)
                                    .then((response) => {
                                      if (!response.ok) {
                                        throw new Error('Network response was not ok');
                                      }
                                      return response.blob();
                                    })
                                    .then((blob) => {
                                      const url = window.URL.createObjectURL(blob);
                                      const link = document.createElement('a');
                                      link.href = url;
                                      link.download = `${config.type}_${index + 1}_${file.name}`;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                      window.URL.revokeObjectURL(url);
                                    })
                                    .catch((error) => {
                                      console.error('Download failed:', error);
                                      // Fallback to direct download
                                      const link = document.createElement('a');
                                      link.href = file.url;
                                      link.download = `${config.type}_${index + 1}_${file.name}`;
                                      link.target = '_blank';
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    });
                                }, index * 100);
                              });
                            }
                          }}
                          startIcon={<Iconify icon="solar:download-bold" />}
                        >
                          Download All
                        </Button>
                      </Stack>

                      {/* Upload button - always visible */}
                      <Box sx={{ mt: 2 }}>
                        <input
                          type="file"
                          accept=".jpeg,.jpg,.png"
                          style={{ display: 'none' }}
                          id={`file-upload-${config.type}`}
                          onChange={(event) => {
                            const files = event.target.files;
                            if (files && files.length > 0) {
                              handleFileInputChange(files[0], config.type);
                            }
                            event.target.value = '';
                          }}
                        />

                        {isMobile && config.supportsCamera ? (
                          <Stack spacing={1}>
                            <Button
                              variant="outlined"
                              disabled={isUploading}
                              startIcon={<Iconify icon="solar:camera-add-bold" />}
                              onClick={() => handleCameraCapture(config.type)}
                              sx={{ width: '100%' }}
                            >
                              Take Photo
                            </Button>
                            <Typography
                              variant="caption"
                              sx={{ textAlign: 'center', color: 'text.secondary' }}
                            >
                              or
                            </Typography>
                            <label htmlFor={`file-upload-${config.type}`}>
                              <Button
                                component="span"
                                variant="outlined"
                                disabled={isUploading}
                                startIcon={<Iconify icon="solar:add-circle-bold" />}
                                sx={{ width: '100%' }}
                              >
                                Choose File
                              </Button>
                            </label>
                            <Typography
                              variant="caption"
                              sx={{
                                textAlign: 'center',
                                color: 'warning.main',
                                fontSize: '0.7rem',
                              }}
                            >
                              💡 Camera requires HTTPS. Use &quot;Choose Files&quot; for
                              development.
                            </Typography>
                          </Stack>
                        ) : (
                          <label htmlFor={`file-upload-${config.type}`}>
                            <Button
                              component="span"
                              variant="outlined"
                              disabled={isUploading}
                              startIcon={<Iconify icon="solar:add-circle-bold" />}
                              sx={{ width: '100%' }}
                            >
                              {isUploading ? 'Uploading...' : `Upload More ${config.label}`}
                            </Button>
                          </label>
                        )}

                        <Typography
                          variant="caption"
                          sx={{
                            mt: 1,
                            display: 'block',
                            color: 'text.disabled',
                          }}
                        >
                          Allowed *.jpeg, *.jpg, *.png,
                          <br /> max size of {fData(config.maxSize)}
                          {isOCRSupported() &&
                            (config.type === 'tcp_certification' ||
                              config.type === 'driver_license') && (
                              <>
                                <br /> 💡 OCR will automatically extract expiration dates from clear
                                images
                              </>
                            )}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Box>
                      <input
                        type="file"
                        accept=".jpeg,.jpg,.png"
                        multiple
                        style={{ display: 'none' }}
                        id={`file-upload-${config.type}`}
                        onChange={(event) => {
                          const files = event.target.files;
                          if (files) {
                            Array.from(files).forEach((file) => {
                              handleFileInputChange(file, config.type);
                            });
                          }
                          event.target.value = '';
                        }}
                      />

                      {isMobile && config.supportsCamera ? (
                        <Stack spacing={1}>
                          <Button
                            variant="outlined"
                            disabled={isUploading}
                            startIcon={<Iconify icon="solar:camera-add-bold" />}
                            onClick={() => handleCameraCapture(config.type)}
                            sx={{ width: '100%' }}
                          >
                            Take Photo
                          </Button>
                          <Typography
                            variant="caption"
                            sx={{ textAlign: 'center', color: 'text.secondary' }}
                          >
                            or
                          </Typography>
                          <label htmlFor={`file-upload-${config.type}`}>
                            <Button
                              component="span"
                              variant="outlined"
                              disabled={isUploading}
                              startIcon={<Iconify icon="solar:add-circle-bold" />}
                              sx={{ width: '100%' }}
                            >
                              Choose File
                            </Button>
                          </label>
                          <Typography
                            variant="caption"
                            sx={{ textAlign: 'center', color: 'warning.main', fontSize: '0.7rem' }}
                          >
                            💡 Camera requires HTTPS. Use &quot;Choose Files&quot; for development.
                          </Typography>
                        </Stack>
                      ) : (
                        <label htmlFor={`file-upload-${config.type}`}>
                          <Button
                            component="span"
                            variant="outlined"
                            disabled={isUploading}
                            startIcon={<Iconify icon="solar:add-circle-bold" />}
                            sx={{ width: '100%' }}
                          >
                            {isUploading ? 'Uploading...' : `Upload ${config.label}`}
                          </Button>
                        </label>
                      )}

                      <Typography
                        variant="caption"
                        sx={{
                          mt: 1,
                          display: 'block',
                          color: 'text.disabled',
                        }}
                      >
                        Allowed *.jpeg, *.jpg, *.png,
                        <br /> max size of {fData(config.maxSize)}
                        {isOCRSupported() &&
                          (config.type === 'tcp_certification' ||
                            config.type === 'driver_license') && (
                            <>
                              <br /> 💡 OCR will automatically extract expiration dates from clear
                              images
                            </>
                          )}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* Camera Capture Dialog */}
      {cameraDocumentType &&
        (cameraDocumentType === 'tcp_certification' || cameraDocumentType === 'driver_license') && (
          <CameraCapture
            open={cameraOpen}
            onClose={handleCameraClose}
            onCapture={handleCameraCaptureComplete}
            documentType={cameraDocumentType as 'tcp_certification' | 'driver_license'}
            title={`Capture ${cameraDocumentType.replace('_', ' ')}`}
          />
        )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        fullWidth
        maxWidth="xs"
        open={confirmDeleteDialog.value}
        onClose={confirmDeleteDialog.onFalse}
      >
        <DialogTitle sx={{ pb: 2 }}>Delete Document</DialogTitle>

        <DialogContent sx={{ typography: 'body2' }}>
          {assetToDelete ? (
            <>
              Are you sure you want to delete this{' '}
              <strong>{formatAssetTypeName(assetToDelete.type)}</strong> document?
            </>
          ) : (
            'Are you sure you want to delete this document?'
          )}
        </DialogContent>

        <DialogActions>
          <Button
            variant="outlined"
            color="inherit"
            onClick={confirmDeleteDialog.onFalse}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleAssetDelete}
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Expiration Date Dialog */}
      <Dialog fullWidth maxWidth="sm" open={showExpirationDialog} onClose={handleExpirationCancel}>
        <DialogTitle sx={{ pb: 2 }}>Expiration Date Required</DialogTitle>

        <DialogContent sx={{ typography: 'body2' }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This is the first time uploading a{' '}
            <strong>
              {pendingUpload?.assetType === 'tcp_certification'
                ? 'TCP Certification'
                : pendingUpload?.assetType.replace('_', ' ')}
            </strong>{' '}
            document. Please provide the expiration date.
          </Typography>

          <Form methods={methods} onSubmit={methods.handleSubmit(handleExpirationSubmit)}>
            <Field.DatePicker
              name="expiration_date"
              label="Expiration Date *"
              disablePast
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                },
              }}
            />
          </Form>
        </DialogContent>

        <DialogActions>
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleExpirationCancel}
            disabled={uploading === pendingUpload?.assetType}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={methods.handleSubmit(handleExpirationSubmit)}
            disabled={uploading === pendingUpload?.assetType}
            startIcon={
              uploading === pendingUpload?.assetType ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
          >
            {uploading === pendingUpload?.assetType
              ? 'Uploading...'
              : 'Upload with Expiration Date'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Expiration Date Dialog */}
      <Dialog
        fullWidth
        maxWidth="sm"
        open={showEditExpirationDialog}
        onClose={handleEditExpirationCancel}
      >
        <DialogTitle sx={{ pb: 2 }}>Edit Expiration Date</DialogTitle>

        <DialogContent sx={{ typography: 'body2' }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Update the expiration date for{' '}
            <strong>
              {editingExpirationFor === 'tcp_certification'
                ? 'TCP Certification'
                : editingExpirationFor?.replace('_', ' ')}
            </strong>{' '}
            document.
          </Typography>

          <Form methods={methods} onSubmit={methods.handleSubmit(handleEditExpirationSubmit)}>
            <Field.DatePicker
              name="expiration_date"
              label="Expiration Date *"
              disablePast
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                },
              }}
            />
          </Form>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={handleEditExpirationCancel}>
            Cancel
          </Button>
          <Button variant="contained" onClick={methods.handleSubmit(handleEditExpirationSubmit)}>
            Update Expiration Date
          </Button>
        </DialogActions>
      </Dialog>

      {/* OCR Processor Dialog */}
      <OCRProcessor
        open={showOCRDialog}
        onClose={handleOCRClose}
        onConfirm={handleOCRConfirm}
        file={ocrFile}
        documentType={ocrDocumentType}
        ocrText={ocrText}
        extractedDate={extractedDate}
      />

      {/* Image Crop Dialog */}
      <ImageCropDialog
        open={showCropDialog}
        imageUrl={cropImageUrl || ''}
        onClose={() => setShowCropDialog(false)}
        onCropComplete={handleCropComplete}
        aspect={4 / 3}
        onUseFullImage={async () => {
          if (fullImageFile) {
            const arrayBuffer = await fullImageFile.arrayBuffer();
            const blob = new Blob([arrayBuffer], { type: fullImageFile.type });
            handleCropComplete(blob, true);
          }
        }}
        shouldExtractExpiry={shouldExtractExpiry}
        setShouldExtractExpiry={setShouldExtractExpiry}
      />

      {/* Overwrite Confirmation Dialog */}
      {showOverwriteDialog && (
        <Dialog open={showOverwriteDialog} onClose={handleCancelOverwrite}>
          <DialogTitle>Overwrite Expiration Date?</DialogTitle>
          <DialogContent>
            <Typography>
              There is already a{' '}
              {pendingOverwrite?.assetType === 'tcp_certification'
                ? 'TCP Certification'
                : 'Driver License'}{' '}
              image with an expiration date. Uploading a new image with an expiration date will
              overwrite the existing date. Continue?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelOverwrite} color="inherit">
              Cancel
            </Button>
            <Button onClick={handleConfirmOverwrite} color="error" variant="contained">
              Overwrite
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Processing Loading Dialog */}
      <Dialog
        open={isProcessingCrop}
        PaperProps={{
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            backgroundColor: 'background.paper',
            borderRadius: 2,
            boxShadow: (themeContext) => themeContext.shadows[8],
          }}
        >
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Processing image...
          </Typography>
        </Box>
      </Dialog>
    </Form>
  );
}
