import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { Page, pdfjs, Document } from 'react-pdf';
import { useRef, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBoolean, usePopover } from 'minimal-shared/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Skeleton from '@mui/material/Skeleton';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import useMediaQuery from '@mui/material/useMediaQuery';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormHelperText from '@mui/material/FormHelperText';
import CircularProgress from '@mui/material/CircularProgress';

import { fData } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';
import { sendToVisionAPI } from 'src/utils/vision-ocr';
import { preprocessImageForOCR } from 'src/utils/image-preprocess';
import { isOCRSupported, extractExpirationDate } from 'src/utils/ocr-utils';
import {
  uploadPdfViaBackend,
  deleteFileViaBackend,
} from 'src/utils/backend-storage';
import { type AssetType, deleteUserAsset, uploadUserAsset } from 'src/utils/cloudinary-upload';

import { CONFIG } from 'src/global-config';
import { UploadIllustration } from 'src/assets/illustrations';
import axiosInstance, { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';
import { OCRProcessor } from 'src/components/ocr-processor';
import { CustomPopover } from 'src/components/custom-popover';
import { CameraCapture } from 'src/components/camera-capture';
import { ImageCropDialog } from 'src/components/image-crop-dialog';

// ----------------------------------------------------------------------

const AssetUploadSchema = {
  tcp_certification: zod.instanceof(File).optional().nullable(),
  driver_license: zod.instanceof(File).optional().nullable(),
  other_documents: zod.instanceof(File).optional().nullable(),
  hiring_package: zod.instanceof(File).optional().nullable(),
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

// Document types for Other Documents (default list - fallback only)
const DEFAULT_DOCUMENT_TYPES = [
  'Field Supervisor Manual',
  'Investigation Documentation Checklist',
  'LCT Training & Skills Checklist',
  'Driving History',
];

type DocumentType = string;

// Backend document type interface
interface IDocumentType {
  id: string;
  name: string;
  is_default: boolean;
  company_id?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------

// FileListItem Component for Other Documents
type FileListItemProps = {
  file: AssetFile;
  userName?: string;
  onDelete: (fileId: string) => void;
};

function FileListItem({ file, userName, onDelete }: FileListItemProps) {
  const menuActions = usePopover();
  // Check for PDF in URL (handle both regular URLs and signed URLs with query params)
  const isPdfFile = file.url?.toLowerCase().includes('.pdf') || false;

  const handleBoxClick = (e: React.MouseEvent) => {
    // Prevent opening if clicking anywhere on the menu button or popover
    const target = e.target as HTMLElement;
    if (target.closest('.menu-button') || target.closest('[role="menu"]') || menuActions.open) {
      return;
    }
    window.open(file.url, '_blank');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        backgroundColor: 'background.paper',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          backgroundColor: 'action.hover',
          borderColor: 'primary.main',
        },
      }}
      onClick={handleBoxClick}
    >
      {isPdfFile ? (
        <Box
          component="img"
          src={`${CONFIG.assetsDir}/assets/icons/files/ic-pdf.svg`}
          sx={{ width: 48, height: 48, flexShrink: 0 }}
        />
      ) : (
        <Box
          component="img"
          src={`${CONFIG.assetsDir}/assets/icons/files/ic-img.svg`}
          sx={{ width: 48, height: 48, flexShrink: 0 }}
        />
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {file.documentType || file.name}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
          {file.fileSize && (
            <>
              <Typography variant="caption" color="text.secondary">
                {fData(file.fileSize)}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                •
              </Typography>
            </>
          )}
          <Typography variant="caption" color="text.secondary">
            {fDateTime(file.uploadedAt)}
          </Typography>
        </Stack>
        {(file as any).expiryDate && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Expires: {dayjs((file as any).expiryDate).tz('America/Los_Angeles').format('MMM D, YYYY')}
          </Typography>
        )}
      </Box>
      <IconButton
        className="menu-button"
        size="small"
        color={menuActions.open ? 'inherit' : 'default'}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          menuActions.onOpen(e);
        }}
        sx={{ flexShrink: 0 }}
      >
        <Iconify icon="eva:more-vertical-fill" />
      </IconButton>

      {/* 3-dot Menu Popover */}
      <CustomPopover
        open={menuActions.open}
        anchorEl={menuActions.anchorEl}
        onClose={menuActions.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              menuActions.onClose();
              // Download with custom name: "John Doe - Document Type"
              const downloadName = userName
                ? `${userName} - ${file.documentType || file.name}`
                : file.documentType || file.name;

              fetch(file.url)
                .then((response) => {
                  if (!response.ok) throw new Error('Network response was not ok');
                  return response.blob();
                })
                .then((blob) => {
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${downloadName}.${isPdfFile ? 'pdf' : 'jpg'}`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                })
                .catch((error) => {
                  console.error('Download failed:', error);
                  const link = document.createElement('a');
                  link.href = file.url;
                  link.download = `${downloadName}.${isPdfFile ? 'pdf' : 'jpg'}`;
                  link.target = '_blank';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                });
            }}
          >
            <Iconify icon="solar:download-bold" />
            Download
          </MenuItem>
          <MenuItem
            onClick={() => {
              menuActions.onClose();
              onDelete(file.id);
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </Box>
  );
}

// ----------------------------------------------------------------------

type AssetFile = {
  id: string;
  url: string;
  name: string;
  uploadedAt: Date;
  fileSize?: number; // in bytes
  documentType?: DocumentType; // for other_documents
  expiryDate?: string | null; // for other_documents with expiry dates
  documentPath?: string | null; // Supabase path for PDFs
};

type Props = {
  userId: string;
  userName?: string; // Add userName for download naming
  currentAssets?: {
    tcp_certification?: AssetFile[];
    driver_license?: AssetFile[];
    other_documents?: AssetFile[];
    hiring_package?: AssetFile[];
  };
  onAssetsUpdate?: (assets: {
    tcp_certification?: AssetFile[];
    driver_license?: AssetFile[];
    other_documents?: AssetFile[];
    hiring_package?: AssetFile[];
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
    case 'hiring_package':
      return 'Hiring Package';
    default:
      return assetType.replace('_', ' ');
  }
};

export function UserAssetsUpload({
  userId,
  userName,
  currentAssets,
  onAssetsUpdate,
  isLoading = false,
}: Props) {
  // Internal state to hold current assets (to prevent prop staleness)
  const [internalAssets, setInternalAssets] = useState(currentAssets);
  
  // Track image loading state - initialize as true for all images
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  
  // Update internal state when props change
  useEffect(() => {
    setInternalAssets(currentAssets);
    
    // Preserve existing loading states and only set new images to loading
    setImageLoading((prev) => {
      const newLoadingState: Record<string, boolean> = { ...prev };
      
      // Check all assets and only set loading for new images that aren't already loaded
      Object.values(currentAssets || {}).forEach((assetArray) => {
        if (Array.isArray(assetArray)) {
          assetArray.forEach((asset: any) => {
            if (asset?.id && asset?.url) {
              // Only set to loading if this is a new image (not in prev state)
              // If it's already loaded (false) or already loading (true), preserve that state
              if (!(asset.id in prev)) {
                // Preload image to check if it's already cached
                const img = new Image();
                
                // Set up load handlers
                img.onload = () => {
                  // Image loaded successfully (either from cache or network)
                  setImageLoading((current) => ({
                    ...current,
                    [asset.id]: false,
                  }));
                };
                img.onerror = () => {
                  // Image failed to load
                  setImageLoading((current) => ({
                    ...current,
                    [asset.id]: false,
                  }));
                };
                
                // Start loading the image
                img.src = asset.url;
                
                // Check if image loaded synchronously (cached)
                // If complete is true immediately after setting src, it was cached
                if (img.complete && img.naturalWidth > 0) {
                  // Image was cached and loaded immediately
                  newLoadingState[asset.id] = false;
                } else {
                  // Image needs to load, set loading state to true
                  newLoadingState[asset.id] = true;
                }
              }
            }
          });
        }
      });
      
      // Remove loading states for assets that no longer exist
      Object.keys(prev).forEach((assetId) => {
        const assetExists = Object.values(currentAssets || {}).some((assetArray) => {
          if (Array.isArray(assetArray)) {
            return assetArray.some((asset: any) => asset?.id === assetId);
          }
          return false;
        });
        
        if (!assetExists) {
          delete newLoadingState[assetId];
        }
      });
      
      return newLoadingState;
    });
  }, [currentAssets]);
  
  // Use internal assets instead of props directly
  const activeAssets = internalAssets;
  
  const [uploading, setUploading] = useState<AssetType | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraDocumentType, setCameraDocumentType] = useState<AssetType | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<{ type: AssetType; id: string } | null>(null);
  const [selectedImageIndices, setSelectedImageIndices] = useState<{
    tcp_certification?: number;
    driver_license?: number;
    other_documents?: number;
    hiring_package?: number;
  }>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const confirmDeleteDialog = useBoolean();
  const [showExpirationDialog, setShowExpirationDialog] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{ file: File; assetType: AssetType } | null>(
    null
  );
  
  // Preserve form state between dialog opens/closes
  const preservedFormData = useRef<{ expiration_date?: string }>({});
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
  // State for document type selection
  const [showDocumentTypeDialog, setShowDocumentTypeDialog] = useState(false);
  const [pendingFileForDocType, setPendingFileForDocType] = useState<File | null>(null);
  // State for managing document types
  const [showManageTypesDialog, setShowManageTypesDialog] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  const queryClient = useQueryClient();

  // Fetch document types from backend
  const { data: documentTypesData, isLoading: isLoadingDocTypes } = useQuery({
    queryKey: ['document-types'],
    queryFn: async () => {
      try {
        const response = await fetcher(endpoints.documentTypes.list);
        return response.data as IDocumentType[];
      } catch (error) {
        console.error('Error fetching document types:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const documentTypes = documentTypesData?.map((dt) => dt.name) || DEFAULT_DOCUMENT_TYPES;

  // Create document type mutation
  const createDocTypeMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await axiosInstance.post(endpoints.documentTypes.create, { name });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-types'] });
      toast.success('Document type added successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add document type');
    },
  });

  // Delete document type mutation
  const deleteDocTypeMutation = useMutation({
    mutationFn: async (docTypeId: string) => {
      const response = await axiosInstance.delete(endpoints.documentTypes.delete(docTypeId));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-types'] });
      toast.success('Document type removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove document type');
    },
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const methods = useForm<AssetUploadSchemaType>({
    resolver: zodResolver(zod.object(AssetUploadSchema)),
    defaultValues: {
      tcp_certification: null,
      driver_license: null,
      other_documents: null,
      hiring_package: null,
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
        const response = await fetcher(`${endpoints.management.user}/${userId}`);
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
      setSelectedImageIndices((prev) => {
        const newSelections: { [key: string]: number } = { ...prev };
        let hasChanges = false;

        // Check each asset type
        (
          ['tcp_certification', 'driver_license', 'other_documents', 'hiring_package'] as const
        ).forEach((assetType) => {
          const assetFiles = currentAssets[assetType] || [];
          const currentSelection = prev[assetType];

          // Auto-select first image if there are images but no selection for this type
          if (assetFiles.length > 0 && currentSelection === undefined) {
            newSelections[assetType] = 0;
            hasChanges = true;
          }
        });

        // Return new state only if there are changes
        return hasChanges ? newSelections : prev;
      });
    }
  }, [currentAssets]);

  // Update handleAssetUpload signature
  type HandleAssetUploadFn = (
    file: File,
    assetType: AssetType,
    expirationDate?: string,
    forceOverwrite?: boolean,
    documentType?: DocumentType
  ) => Promise<void>;
  const handleAssetUpload: HandleAssetUploadFn = async (
    file,
    assetType,
    expirationDate,
    forceOverwrite = false,
    documentType
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
      
      // Restore preserved form data if available
      if (preservedFormData.current.expiration_date) {
        methods.setValue('expiration_date', preservedFormData.current.expiration_date);
      }
      return;
    }

    // For hiring_package and other_documents (without expiry requirements), or if not extracting expiry and it's not a certification, upload directly
    if (
      assetType === 'hiring_package' ||
      assetType === 'other_documents' ||
      (!shouldExtractExpiry && !requiresExpiration)
    ) {
      setUploading(assetType);
      const toastId = toast.loading(`Uploading ${formatAssetTypeName(assetType)}...`);
      try {
        // Generate unique ID for the file
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 9);
        const fileId = `${timestamp}_${randomId}`;

        // Check if this is a PDF for hiring_package or other_documents - use Supabase
        const isPdf = file.type === 'application/pdf';
        const useSupabase =
          isPdf && (assetType === 'hiring_package' || assetType === 'other_documents');
        const supabaseConfigured = true; // Backend handles Supabase configuration

        let uploadedUrl: string;
        let uploadedPath: string | undefined;

        if (useSupabase && supabaseConfigured) {
          // For hiring_package, delete old file before uploading new one (single document)
          if (assetType === 'hiring_package') {
            const existingFiles = currentAssets?.[assetType] || [];
            if (existingFiles.length > 0 && existingFiles[0].id.includes('users/')) {
              try {
                await deleteFileViaBackend(existingFiles[0].id, 'user-documents');
              } catch (error) {
                console.warn('Failed to delete old hiring package:', error);
              }
            }
          }

          // Upload via backend API
          const result = await uploadPdfViaBackend({
            file,
            userId,
            assetType: assetType as 'hiring_package' | 'other_documents',
            documentType, // Pass document type for other_documents
          });
          uploadedUrl = result.url;
          uploadedPath = result.path;
        } else {
          // Upload to Cloudinary (fallback or for non-PDFs)
          // Encode document type in filename for other_documents images
          let customFileName: string;
          if (documentType && assetType === 'other_documents') {
            // Format: other_documents_userId_fileId___documentType
            const sanitizedDocType = documentType.replace(/[^a-zA-Z0-9-]/g, '_');
            customFileName = `${assetType}_${userId}_${fileId}___${sanitizedDocType}`;
          } else {
            customFileName = `${assetType}_${userId}_${fileId}`;
          }
          uploadedUrl = await uploadUserAsset({ file, userId, assetType, customFileName });

          // Store the fileId with documentType for Cloudinary other_documents
          if (documentType && assetType === 'other_documents') {
            const sanitizedDocType = documentType.replace(/[^a-zA-Z0-9-]/g, '_');
            uploadedPath = `${fileId}___${sanitizedDocType}`; // Store fileId with documentType
          }
        }

        toast.dismiss(toastId);
        toast.success(`${formatAssetTypeName(assetType)} uploaded successfully!`);

        // Create new asset file object
        const newAssetFile: AssetFile = {
          id: uploadedPath || fileId, // Use Supabase path or fileId with documentType
          url: uploadedUrl,
          name: file.name,
          uploadedAt: new Date(),
          fileSize: file.size, // Add file size in bytes
          documentType, // Add document type for other_documents
        };

        // Update internal state first
        const existingFiles = activeAssets?.[assetType as keyof typeof activeAssets] || [];
        const updatedFiles =
          assetType === 'other_documents' ? [...existingFiles, newAssetFile] : [newAssetFile];

        // Create completely new object with all properties explicitly set to preserve all asset types
        const newAssets = {
          tcp_certification: activeAssets?.tcp_certification || [],
          driver_license: activeAssets?.driver_license || [],
          other_documents: activeAssets?.other_documents || [],
          hiring_package: activeAssets?.hiring_package || [],
          [assetType]: updatedFiles,
        };
        
        setInternalAssets(newAssets);
        
        // Then update the parent component
        if (onAssetsUpdate) {
          onAssetsUpdate(newAssets);
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
      // Store the full customFileName as id so we can reconstruct it correctly for deletion
      const newAssetFile: AssetFile = {
        id: customFileName, // Store full customFileName including _expdate suffix if present
        url: uploadedUrl,
        name: file.name,
        uploadedAt: new Date(),
      };

      // Get existing files and append the new one (don't replace!)
      const existingFiles = activeAssets?.[assetType as keyof typeof activeAssets] || [];
      
      // Create completely new object with all properties explicitly set
      const updatedAssets = {
        tcp_certification: activeAssets?.tcp_certification || [],
        driver_license: activeAssets?.driver_license || [],
        other_documents: activeAssets?.other_documents || [],
        hiring_package: activeAssets?.hiring_package || [],
        [assetType]: [...existingFiles, newAssetFile], // Append instead of replace
      };

      // Update internal state first
      setInternalAssets(updatedAssets);

      // Then update the parent component
      if (onAssetsUpdate) {
        onAssetsUpdate(updatedAssets);
      }

      // Invalidate user queries to ensure job creation pages see updated certification data
      // This is important even without expiration date, as asset existence might affect checks
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'job-creation'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-assets', userId] });

      // Auto-select the first (and only) image
      setSelectedImageIndices((prev) => ({ ...prev, [assetType]: 0 }));

      // Save expiration date if provided
      if (expirationDate && (assetType === 'tcp_certification' || assetType === 'driver_license')) {
        try {
          await fetcher([
            `${endpoints.management.user}/${userId}/certification-expiry`,
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

          // Invalidate user queries to ensure job creation pages see updated certification data
          queryClient.invalidateQueries({ queryKey: ['users'] });
          queryClient.invalidateQueries({ queryKey: ['users', 'job-creation'] });
          queryClient.invalidateQueries({ queryKey: ['user', userId] });

          // Note: Don't call onAssetsUpdate here - the assets haven't changed, only the expiration date
          // The parent will refetch user via the setTimeout in handleAssetsUpdate
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
      // Special handling for other_documents stored in database
      if (assetToDelete.type === 'other_documents') {
        // Delete from database
        const response = await axiosInstance.delete(`${endpoints.management.otherDocuments}/${assetToDelete.id}`);
        
        if (response.data.success) {
          // Clean up the file from storage (Cloudinary or Supabase)
          const fileData = response.data.data;
          
          if (fileData.document_path) {
            // Supabase file - use the stored path
            await deleteFileViaBackend(fileData.document_path, 'user-documents');
          } else if (fileData.document_url && fileData.document_url.includes('cloudinary')) {
            // Cloudinary file - use the stored file_name as is (it's already the customFileName)
            await deleteUserAsset(userId, assetToDelete.type, fileData.file_name);
          }
        }
      } else {
        // Original logic for other asset types
        // Check if this is a Supabase file (ID is the path)
        const isSupabaseFile = assetToDelete.id.includes('users/');

        if (isSupabaseFile) {
          // Delete from Supabase Storage
          await deleteFileViaBackend(assetToDelete.id, 'user-documents');
        } else {
          // Delete from Cloudinary
          // The ID might be:
          // 1. Full customFileName (new format: includes prefix and _expdate suffix if present)
          // 2. Just fileId (old format: needs prefix added)
          // 3. fileId with _expdate suffix (needs prefix added)
          
          let customFileName: string;
          const expectedPrefix = `${assetToDelete.type}_${userId}_`;
          
          // Check if id already includes the full prefix (new format)
          if (assetToDelete.id.startsWith(expectedPrefix)) {
            // Already has full prefix, use it directly
            customFileName = assetToDelete.id;
          } else {
            // Old format or just fileId, construct the full name
            customFileName = `${assetToDelete.type}_${userId}_${assetToDelete.id}`;
          }
          
          // Add retry logic for immediate deletes (Cloudinary might need a moment to process)
          let retries = 3;
          let lastError: Error | null = null;
          
          while (retries > 0) {
            try {
              await deleteUserAsset(userId, assetToDelete.type, customFileName);
              lastError = null;
              break; // Success, exit retry loop
            } catch (error: any) {
              lastError = error;
              // If it's a "not found" error and we have retries left, wait and retry
              if (error.message?.includes('not found') && retries > 1) {
                retries--;
                // Wait 500ms before retrying (exponential backoff: 500ms, 1000ms, 2000ms)
                await new Promise(resolve => setTimeout(resolve, (4 - retries) * 500));
                continue;
              }
              // If it's a different error or no retries left, throw
              throw error;
            }
          }
          
          // If we exhausted retries, throw the last error
          if (lastError) {
            throw lastError;
          }
        }
      }

      toast.dismiss(toastId);
      toast.success(`${formatAssetTypeName(assetToDelete.type)} deleted successfully!`);

      // Update internal state first
      const currentFiles =
        activeAssets?.[assetToDelete.type as keyof typeof activeAssets] || [];
      const updatedFiles = currentFiles.filter((file: AssetFile) => file.id !== assetToDelete.id);

      // Create completely new object with all properties explicitly set
      const updatedAssets = {
        tcp_certification: activeAssets?.tcp_certification || [],
        driver_license: activeAssets?.driver_license || [],
        other_documents: activeAssets?.other_documents || [],
        hiring_package: activeAssets?.hiring_package || [],
        [assetToDelete.type]: updatedFiles,
      };

      setInternalAssets(updatedAssets);

      // Then update the parent component
      if (onAssetsUpdate) {
        onAssetsUpdate(updatedAssets);
      }

      // Update selectedImageIndices if the deleted file was selected
      const currentSelectedIndex =
        selectedImageIndices[assetToDelete.type as keyof typeof selectedImageIndices];

      if (updatedFiles.length === 0) {
        // No files left, clear selection for this type
        setSelectedImageIndices((prev) => ({ ...prev, [assetToDelete.type]: undefined }));
      } else if (
        currentSelectedIndex !== undefined &&
        currentSelectedIndex >= updatedFiles.length
      ) {
        // Selected index is now out of bounds, set to last available index
        setSelectedImageIndices((prev) => ({
          ...prev,
          [assetToDelete.type]: updatedFiles.length - 1,
        }));
      }

      // If this was the last file of a document type that requires expiration date, clear the expiration date
      if (
        updatedFiles.length === 0 &&
        (assetToDelete.type === 'tcp_certification' || assetToDelete.type === 'driver_license')
      ) {
        try {
          // Clear the expiration date in the backend
          await fetcher([
            `${endpoints.management.user}/${userId}/certification-expiry`,
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

          // Note: Don't call onAssetsUpdate here - the assets were already updated above
          // The parent will refetch user via the setTimeout in handleAssetsUpdate

          toast.success(`${formatAssetTypeName(assetToDelete.type)} expiration date cleared.`);
        } catch (error) {
          console.error('Error clearing expiration date:', error);
          // Don't show error toast since the file deletion was successful
        }
      }

      // Close dialog and reset state after successful deletion
      setIsDeleting(false);
      confirmDeleteDialog.onFalse();
      setAssetToDelete(null);
    } catch (error) {
      toast.dismiss(toastId);
      console.error(`Error deleting ${assetToDelete.type}:`, error);
      toast.error(`Failed to delete ${formatAssetTypeName(assetToDelete.type)}. Please try again.`);

      // Reset state even on error
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
    
    // Clear preserved form data after successful submission
    preservedFormData.current = {};
  };

  const handleExpirationCancel = () => {
    setShowExpirationDialog(false);
    setPendingUpload(null);
    setUploading(null);
    // Preserve the form data before closing
    const currentFormData = methods.getValues();
    if (currentFormData.expiration_date) {
      preservedFormData.current.expiration_date = currentFormData.expiration_date;
    }
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
        `${endpoints.management.user}/${userId}/certification-expiry`,
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

      // Note: Don't call onAssetsUpdate here - the assets haven't changed, only the expiration date
      // The refetchUser will be triggered when needed

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
    // For other_documents, show dialog with file preview
    if (assetType === 'other_documents') {
      // Store the file and show dialog with preview
      setPendingFileForDocType(file);
      setShowDocumentTypeDialog(true);
      return;
    }

    // For hiring_package, skip cropping and OCR - upload directly
    if (assetType === 'hiring_package') {
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

  // State for selected document type in dialog
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [documentExpiryDate, setDocumentExpiryDate] = useState<dayjs.Dayjs | null>(null);

  // Handle document upload submission from dialog
  const handleOtherDocumentSubmit = async () => {
    if (!selectedDocumentType) {
      toast.error('Please select a document type');
      return;
    }

    try {
      setShowDocumentTypeDialog(false);
      
      let documentUrl = null;
      let documentPath = null;
      let fileName = null;
      let fileSize = null;

      // Upload file if provided
      if (pendingFileForDocType) {
        const isPdf = pendingFileForDocType.type === 'application/pdf';

        if (isPdf) {
          // Upload PDF to Supabase
          const result = await uploadPdfViaBackend({
            file: pendingFileForDocType,
            userId,
            assetType: 'other_documents',
            documentType: selectedDocumentType,
          });
          documentUrl = result.url; // Signed URL (expires)
          documentPath = result.path; // Path (for refreshing URL)
          fileName = pendingFileForDocType.name;
          fileSize = pendingFileForDocType.size;
        } else {
          // Upload image to Cloudinary
          const customFileName = `other_doc_${Date.now()}`;
          documentUrl = await uploadUserAsset({
            file: pendingFileForDocType,
            userId,
            assetType: 'other_documents',
            customFileName,
          });
          // Store the Cloudinary filename for deletion later
          fileName = customFileName;
          fileSize = pendingFileForDocType.size;
        }
      }

      // Find document type ID
      const documentType = documentTypes.find(dt => dt === selectedDocumentType);
      if (!documentType) {
        toast.error('Invalid document type');
        return;
      }

      // Get document_type_id from the document_types table
      const docTypesResponse = await axiosInstance.get(endpoints.documentTypes.list);
      const docTypeRecord = docTypesResponse.data.data.find((dt: any) => dt.name === selectedDocumentType);
      
      if (!docTypeRecord) {
        toast.error('Document type not found');
        return;
      }

      // Save to database
      const createResponse = await axiosInstance.post(endpoints.management.otherDocuments, {
        user_id: userId,
        document_type_id: docTypeRecord.id,
        expiry_date: documentExpiryDate ? documentExpiryDate.format('YYYY-MM-DD') : null,
        document_url: documentUrl,
        document_path: documentPath,
        file_name: fileName,
        file_size: fileSize,
      });

      toast.success('Document added successfully');
      
      // Refresh the data - invalidate both query keys
      queryClient.invalidateQueries({ queryKey: ['user-assets', userId] });
      queryClient.invalidateQueries({ queryKey: ['cloudinaryAssets', userId] });
      
      // Update the local state immediately to show the new document
      if (createResponse.data.success && documentUrl) {
        const newDoc = {
          id: createResponse.data.data.id,
          url: documentUrl,
          name: fileName || selectedDocumentType,
          documentType: selectedDocumentType,
          expiryDate: documentExpiryDate ? documentExpiryDate.format('YYYY-MM-DD') : null,
          uploadedAt: new Date(),
          fileSize: fileSize || undefined,
          documentPath,
        };

        const updatedOtherDocs = [...(activeAssets?.other_documents || []), newDoc];
        
        const updatedAssets = {
          ...activeAssets,
          tcp_certification: activeAssets?.tcp_certification || [],
          driver_license: activeAssets?.driver_license || [],
          other_documents: updatedOtherDocs,
          hiring_package: activeAssets?.hiring_package || [],
        };

        // Update internal state immediately
        setInternalAssets(updatedAssets);
        
        // Then update parent component
        if (onAssetsUpdate) {
          onAssetsUpdate(updatedAssets);
        }
      }
    } catch (error) {
      console.error('Error adding document:', error);
      toast.error('Failed to add document');
    } finally {
      setPendingFileForDocType(null);
      setSelectedDocumentType('');
      setDocumentExpiryDate(null);
    }
  };

  // Handle opening file picker for upload button click
  const handleOtherDocumentsUploadClick = () => {
    // Open the dialog directly (like Add Orientation workflow)
    setShowDocumentTypeDialog(true);
  };

  // Handle adding new document type
  const handleAddDocumentType = () => {
    if (newTypeName.trim() && !documentTypes.includes(newTypeName.trim())) {
      createDocTypeMutation.mutate(newTypeName.trim());
      setNewTypeName('');
    } else if (documentTypes.includes(newTypeName.trim())) {
      toast.error('Document type already exists');
    }
  };

  // Handle deleting document type
  const handleDeleteDocumentType = (typeName: string) => {
    // Find the document type by name
    const docType = documentTypesData?.find((dt) => dt.name === typeName);
    if (docType) {
      if (docType.is_default) {
        toast.error('Cannot delete default document types');
        return;
      }
      deleteDocTypeMutation.mutate(docType.id);
    }
  };

  const assetConfigs = [
    {
      type: 'tcp_certification' as const,
      label: 'TCP Certification',
      description: 'Upload TCP certification',
      maxSize: 5 * 1024 * 1024, // 5MB
      supportsCamera: true,
      supportsPreview: true,
      acceptedFormats: '.jpeg,.jpg,.png',
      fileTypeLabel: '*.jpeg, *.jpg, *.png',
    },
    {
      type: 'driver_license' as const,
      label: 'Driver License',
      description: 'Upload driver license',
      maxSize: 5 * 1024 * 1024, // 5MB
      supportsCamera: true,
      supportsPreview: true,
      acceptedFormats: '.jpeg,.jpg,.png',
      fileTypeLabel: '*.jpeg, *.jpg, *.png',
    },
    {
      type: 'hiring_package' as const,
      label: 'Hiring Package',
      description: 'Upload hiring package document',
      maxSize: 30 * 1024 * 1024, // 30MB
      supportsCamera: false,
      supportsPreview: true,
      acceptedFormats: '.pdf',
      fileTypeLabel: '*.pdf',
    },
    {
      type: 'other_documents' as const,
      label: 'Other Documents',
      description: 'Upload other relevant documents (images or PDFs)',
      maxSize: 20 * 1024 * 1024, // 20MB (to support PDFs)
      supportsCamera: false,
      supportsPreview: true,
      useListView: true, // Use list format instead of slider
      acceptedFormats: '.jpeg,.jpg,.png,.pdf',
      fileTypeLabel: '*.jpeg, *.jpg, *.png, *.pdf',
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
            <Grid
              key={config.type}
              size={config.type === 'other_documents' ? { xs: 12 } : { xs: 12, md: 6, lg: 4 }}
            >
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
                          {config.type === 'hiring_package' ? (
                            // Hiring Package PDF preview
                            <>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mb: 1, display: 'block' }}
                              >
                                Preview
                              </Typography>

                              {/* PDF Preview */}
                              {assetFiles[0] && (
                                <Box sx={{ mb: 2, textAlign: 'center' }}>
                                  <Box
                                    sx={{
                                      position: 'relative',
                                      display: 'inline-block',
                                      border: 1,
                                      borderColor: 'divider',
                                      borderRadius: 1,
                                      overflow: 'hidden',
                                      backgroundColor: 'background.neutral',
                                    }}
                                  >
                                    <Document
                                      file={assetFiles[0].url}
                                      loading={
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 200,
                                            height: 250,
                                          }}
                                        >
                                          <CircularProgress size={40} />
                                        </Box>
                                      }
                                      error={
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 200,
                                            height: 250,
                                            p: 2,
                                          }}
                                        >
                                          <Iconify
                                            icon={'vscode-icons:file-type-pdf2' as any}
                                            width={60}
                                            sx={{ mb: 1 }}
                                          />
                                          <Typography variant="caption" color="text.secondary">
                                            Hiring Package
                                          </Typography>
                                        </Box>
                                      }
                                    >
                                      <Page
                                        pageNumber={1}
                                        width={200}
                                        renderTextLayer={false}
                                        renderAnnotationLayer={false}
                                      />
                                    </Document>

                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() =>
                                        handleDeleteClick(config.type, assetFiles[0].id)
                                      }
                                      sx={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        backgroundColor: 'background.paper',
                                        '&:hover': { backgroundColor: 'error.lighter' },
                                      }}
                                    >
                                      <Iconify icon="solar:trash-bin-trash-bold" width={20} />
                                    </IconButton>
                                  </Box>

                                  {/* File Info (date, time, size) below Hiring Package preview */}
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    justifyContent="center"
                                    sx={{ mt: 1 }}
                                  >
                                    {assetFiles[0].fileSize && (
                                      <>
                                        <Typography variant="caption" color="text.secondary">
                                          {fData(assetFiles[0].fileSize)}
                                        </Typography>
                                        <Typography variant="caption" color="text.disabled">
                                          •
                                        </Typography>
                                      </>
                                    )}
                                    <Typography variant="caption" color="text.secondary">
                                      {fDateTime(assetFiles[0].uploadedAt)}
                                    </Typography>
                                  </Stack>
                                </Box>
                              )}
                            </>
                          ) : config.type === 'other_documents' ? (
                            // List view for Other Documents (mixed images and PDFs) - Full width with menu
                            <>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mb: 1, display: 'block' }}
                              >
                                Documents ({assetFiles.length})
                              </Typography>

                              <Stack spacing={1}>
                                {assetFiles.map((file) => (
                                  <FileListItem
                                    key={file.id}
                                    file={file}
                                    userName={userName}
                                    onDelete={(fileId) => handleDeleteClick(config.type, fileId)}
                                  />
                                ))}
                              </Stack>
                            </>
                          ) : (
                            // Full image/PDF preview with slider
                            <>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mb: 1, display: 'block' }}
                              >
                                Preview ({assetFiles.length} file
                                {assetFiles.length > 1 ? 's' : ''})
                              </Typography>

                              {/* Main Image/PDF Display */}
                              {selectedImageIndices[config.type] !== undefined &&
                                (() => {
                                  const selectedFile =
                                    assetFiles[selectedImageIndices[config.type]!];
                                  
                                  // Safety check: if file doesn't exist, return null
                                  if (!selectedFile || !selectedFile.url) {
                                    return null;
                                  }
                                  
                                  const isPdfFile = selectedFile.url.toLowerCase().endsWith('.pdf');

                                  return (
                                    <Box sx={{ mb: 2, textAlign: 'center' }}>
                                      <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                        {isPdfFile ? (
                                          // PDF Preview
                                          <Box
                                            sx={{
                                              border: '2px solid',
                                              borderColor: 'primary.main',
                                              borderRadius: 1,
                                              overflow: 'hidden',
                                              backgroundColor: 'background.neutral',
                                              cursor: 'pointer',
                                              '&:hover': {
                                                transform: 'scale(1.02)',
                                                transition: 'all 0.2s ease-in-out',
                                                boxShadow: (themeContext) =>
                                                  themeContext.palette.mode === 'dark'
                                                    ? '0 4px 12px rgba(255,255,255,0.15)'
                                                    : '0 4px 12px rgba(0,0,0,0.15)',
                                              },
                                            }}
                                            onClick={() => window.open(selectedFile.url, '_blank')}
                                          >
                                            <Document
                                              file={selectedFile.url}
                                              loading={
                                                <Box
                                                  sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: 260,
                                                    height: 210,
                                                  }}
                                                >
                                                  <CircularProgress size={40} />
                                                </Box>
                                              }
                                              error={
                                                <Box
                                                  sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: 260,
                                                    height: 210,
                                                    p: 2,
                                                  }}
                                                >
                                                  <Iconify
                                                    icon={'vscode-icons:file-type-pdf2' as any}
                                                    width={60}
                                                    sx={{ mb: 1 }}
                                                  />
                                                  <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                  >
                                                    PDF Document
                                                  </Typography>
                                                </Box>
                                              }
                                            >
                                              <Page
                                                pageNumber={1}
                                                width={260}
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                              />
                                            </Document>
                                          </Box>
                                        ) : (
                                          // Image Preview with loading skeleton
                                          <Box sx={{ position: 'relative' }}>
                                            {imageLoading[selectedFile.id] && (
                                              <Skeleton
                                                variant="rounded"
                                                animation="wave"
                                                sx={{
                                                  width: 260,
                                                  height: 210,
                                                  position: 'absolute',
                                                  top: 0,
                                                  left: 0,
                                                  zIndex: 1,
                                                }}
                                              />
                                            )}
                                            <Avatar
                                              src={selectedFile.url}
                                              variant="rounded"
                                              imgProps={{
                                                onLoad: () => {
                                                  setImageLoading((prev) => ({
                                                    ...prev,
                                                    [selectedFile.id]: false,
                                                  }));
                                                },
                                                onError: () => {
                                                  setImageLoading((prev) => ({
                                                    ...prev,
                                                    [selectedFile.id]: false,
                                                  }));
                                                },
                                              }}
                                              sx={{
                                                width: 260,
                                                height: 210,
                                                cursor: 'pointer',
                                                border: '2px solid',
                                                borderColor: 'primary.main',
                                                opacity: imageLoading[selectedFile.id] ? 0 : 1,
                                                transition: 'opacity 0.3s ease-in-out',
                                                '&:hover': {
                                                  transform: imageLoading[selectedFile.id] ? undefined : 'scale(1.02)',
                                                  transition: 'all 0.2s ease-in-out',
                                                  boxShadow: imageLoading[selectedFile.id] 
                                                    ? undefined 
                                                    : (themeContext) =>
                                                        themeContext.palette.mode === 'dark'
                                                          ? '0 4px 12px rgba(255,255,255,0.15)'
                                                          : '0 4px 12px rgba(0,0,0,0.15)',
                                                },
                                              }}
                                              onClick={() => !imageLoading[selectedFile.id] && window.open(selectedFile.url, '_blank')}
                                            />
                                          </Box>
                                        )}
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
                                  );
                                })()}

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
                                  // Safety check for file
                                  if (!file || !file.url) {
                                    return null;
                                  }
                                  
                                  const isSelected = selectedImageIndices[config.type] === index;
                                  const isPdfFile = file.url.toLowerCase().endsWith('.pdf');

                                  return (
                                    <Box
                                      key={file.id}
                                      sx={{ position: 'relative', flexShrink: 0, pt: 1, pr: 1 }}
                                    >
                                      {isPdfFile ? (
                                        // PDF Thumbnail
                                        <Box
                                          sx={{
                                            width: 80,
                                            height: 60,
                                            cursor: 'pointer',
                                            border: '2px solid',
                                            borderColor: isSelected ? 'primary.main' : 'divider',
                                            opacity: isSelected ? 1 : 0.8,
                                            borderRadius: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: 'background.neutral',
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
                                            setSelectedImageIndices((prev) => ({
                                              ...prev,
                                              [config.type]: index,
                                            }))
                                          }
                                        >
                                          <Iconify
                                            icon={'vscode-icons:file-type-pdf2' as any}
                                            width={30}
                                          />
                                        </Box>
                                      ) : (
                                        // Image Thumbnail
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
                                            setSelectedImageIndices((prev) => ({
                                              ...prev,
                                              [config.type]: index,
                                            }))
                                          }
                                        />
                                      )}
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
                                        setSelectedImageIndices((prev) => ({
                                          ...prev,
                                          [config.type]: Math.max(
                                            0,
                                            selectedImageIndices[config.type]! - 1
                                          ),
                                        }))
                                      }
                                    >
                                      ← Previous
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      disabled={
                                        selectedImageIndices[config.type] === assetFiles.length - 1
                                      }
                                      onClick={() =>
                                        setSelectedImageIndices((prev) => ({
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
                            </>
                          )}
                        </Box>
                      )}

                      <Stack direction="row" spacing={1}>
                        {/* Show View PDF and Download buttons for hiring_package only */}
                        {config.type === 'hiring_package' && (
                          <>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Iconify icon="solar:eye-bold" />}
                              onClick={() => {
                                window.open(assetFiles[0].url, '_blank');
                              }}
                            >
                              View PDF
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Iconify icon="solar:download-bold" />}
                              onClick={() => {
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
                                    link.download = 'Hiring_Package.pdf';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    window.URL.revokeObjectURL(url);
                                  })
                                  .catch((error) => {
                                    console.error('Download failed:', error);
                                    const link = document.createElement('a');
                                    link.href = file.url;
                                    link.download = 'Hiring_Package.pdf';
                                    link.target = '_blank';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  });
                              }}
                            >
                              Download
                            </Button>
                          </>
                        )}
                      </Stack>

                      {/* Upload button - always visible */}
                      <Box sx={{ mt: 2 }}>
                        <input
                          type="file"
                          accept={config.acceptedFormats}
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
                        ) : config.type === 'other_documents' ? (
                          // Special handling for other_documents - show dialog first
                          <Button
                            variant="outlined"
                            disabled={isUploading}
                            startIcon={<Iconify icon="solar:add-circle-bold" />}
                            onClick={handleOtherDocumentsUploadClick}
                            sx={{
                              width: { xs: '100%', sm: 300 },
                            }}
                          >
                            {isUploading ? 'Uploading...' : `Upload New ${config.label}`}
                          </Button>
                        ) : (
                          <label htmlFor={`file-upload-${config.type}`}>
                            <Button
                              component="span"
                              variant="outlined"
                              disabled={isUploading}
                              startIcon={<Iconify icon="solar:add-circle-bold" />}
                              sx={{ width: '100%' }}
                            >
                              {isUploading ? 'Uploading...' : `Upload New ${config.label}`}
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
                          Allowed {config.fileTypeLabel},
                          <br /> max size of {fData(config.maxSize)}
                          {config.type === 'other_documents' ? (
                            <>
                              <br /> 📄 You can upload multiple documents
                            </>
                          ) : (
                            <>
                              <br /> 📋 Single document upload (replaces existing)
                            </>
                          )}
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
                        accept={config.acceptedFormats}
                        multiple={config.type === 'other_documents'}
                        style={{ display: 'none' }}
                        id={`file-upload-${config.type}`}
                        onChange={(event) => {
                          const files = event.target.files;
                          if (files) {
                            if (config.type === 'other_documents') {
                              // For other documents, show dialog first then upload
                              if (files.length > 0) {
                                setPendingFileForDocType(files[0]);
                                setShowDocumentTypeDialog(true);
                              }
                            } else {
                              // For TCP/Driver License, upload directly
                              if (files.length > 0) {
                                handleFileInputChange(files[0], config.type);
                              }
                            }
                          }
                          event.target.value = '';
                        }}
                      />

                      {config.type === 'other_documents' ? (
                        // Special handling for other_documents - show dialog first
                        <Button
                          variant="outlined"
                          disabled={isUploading}
                          startIcon={<Iconify icon="solar:add-circle-bold" />}
                          onClick={handleOtherDocumentsUploadClick}
                          sx={{
                            width: { xs: '100%', sm: 300 },
                          }}
                        >
                          {isUploading ? 'Uploading...' : `Upload ${config.label}`}
                        </Button>
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
                        Allowed {config.fileTypeLabel},
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

      {/* Document Type Selection Dialog for Other Documents */}
      <Dialog
        open={showDocumentTypeDialog}
        onClose={() => {
          setShowDocumentTypeDialog(false);
          setPendingFileForDocType(null);
          setSelectedDocumentType('');
          setDocumentExpiryDate(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add New Other Document</Typography>
            <Button
              size="small"
              variant="text"
              startIcon={<Iconify icon="solar:settings-bold" />}
              onClick={() => {
                setShowDocumentTypeDialog(false);
                setShowManageTypesDialog(true);
              }}
            >
              Manage Types
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            {/* Document Type Dropdown */}
            <FormControl fullWidth required>
              <InputLabel id="document-type-label">Document Type</InputLabel>
              <Select
                labelId="document-type-label"
                id="document-type-select"
                value={selectedDocumentType}
                label="Document Type"
                onChange={(e) => setSelectedDocumentType(e.target.value)}
                disabled={isLoadingDocTypes}
              >
                <MenuItem value="">
                  <em>Select document type</em>
                </MenuItem>
                {documentTypes.map((docType) => (
                  <MenuItem key={docType} value={docType}>
                    {docType}
                  </MenuItem>
                ))}
              </Select>
              {documentTypes.length === 0 && !isLoadingDocTypes && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  No document types found. Click &quot;Manage Types&quot; to add some.
                </Typography>
              )}
            </FormControl>

            {/* Expiry Date */}
            <DatePicker
              label="Expiry Date (Optional)"
              value={documentExpiryDate}
              onChange={(newValue) => setDocumentExpiryDate(newValue)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  helperText: 'Leave blank if document does not expire',
                },
              }}
            />

            {/* File Upload */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Upload Document (Optional)
              </Typography>
              <Box sx={{ width: 1, position: 'relative' }}>
                <input
                  type="file"
                  id="other-doc-upload-input"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPendingFileForDocType(file);
                    }
                  }}
                  style={{ display: 'none' }}
                />
                
                {/* Show preview if file uploaded, otherwise show drag-and-drop */}
                {pendingFileForDocType ? (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: 'background.neutral',
                      border: '1px dashed',
                      borderColor: 'divider',
                      width: '100%',
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: 1,
                          overflow: 'hidden',
                          bgcolor: 'background.paper',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {pendingFileForDocType.type.startsWith('image/') ? (
                          <Box
                            component="img"
                            src={URL.createObjectURL(pendingFileForDocType)}
                            alt={pendingFileForDocType.name}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: 1,
                            }}
                          />
                        ) : (
                          <Box
                            component="img"
                            src={`${CONFIG.assetsDir}/assets/icons/files/ic-pdf.svg`}
                            sx={{ width: 48, height: 48 }}
                          />
                        )}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap>
                          {pendingFileForDocType.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fData(pendingFileForDocType.size)}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => setPendingFileForDocType(null)}
                        sx={{ flexShrink: 0 }}
                      >
                        <Iconify icon="mingcute:close-line" />
                      </IconButton>
                    </Stack>
                  </Box>
                ) : (
                  <Box
                    onClick={() => document.getElementById('other-doc-upload-input')?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        setPendingFileForDocType(file);
                      }
                    }}
                    sx={(themeContext) => ({
                      p: 5,
                      outline: 'none',
                      borderRadius: 1,
                      cursor: 'pointer',
                      overflow: 'hidden',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      bgcolor: `rgba(145, 158, 171, 0.08)`,
                      border: `1px dashed rgba(145, 158, 171, 0.2)`,
                      transition: themeContext.transitions.create(['opacity', 'padding']),
                      '&:hover': { opacity: 0.72 },
                    })}
                  >
                    <UploadIllustration hideBackground sx={{ width: 200 }} />
                    <Box sx={{ display: 'flex', textAlign: 'center', gap: 1, flexDirection: 'column' }}>
                      <Typography variant="h6">Drop or select file</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Drop files here or click to
                        <Box
                          component="span"
                          sx={{
                            mx: 0.5,
                            color: 'primary.main',
                            textDecoration: 'underline',
                          }}
                        >
                          browse
                        </Box>
                        through your machine.
                      </Typography>
                    </Box>
                  </Box>
                )}
                <FormHelperText sx={{ mx: 1.75 }}>
                  Upload orientation certificate or completion document (optional)
                </FormHelperText>
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => {
              setShowDocumentTypeDialog(false);
              setPendingFileForDocType(null);
              setSelectedDocumentType('');
              setDocumentExpiryDate(null);
            }}
          >
            Cancel
          </Button>
          <LoadingButton
            variant="contained"
            onClick={handleOtherDocumentSubmit}
          >
            Add Document
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Manage Document Types Dialog */}
      <Dialog
        open={showManageTypesDialog}
        onClose={() => setShowManageTypesDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Manage Document Types</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {/* Add New Type */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Add New Document Type
              </Typography>
              <Stack direction="row" spacing={1}>
                <Box sx={{ flex: 1 }}>
                  <input
                    type="text"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="Enter document type name"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddDocumentType();
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  />
                </Box>
                <Button
                  variant="contained"
                  onClick={handleAddDocumentType}
                  startIcon={<Iconify icon="mingcute:add-line" />}
                >
                  Add
                </Button>
              </Stack>
            </Box>

            {/* Existing Types List */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Current Document Types ({documentTypes.length})
              </Typography>
              <Stack spacing={1}>
                {documentTypes.map((docType) => (
                  <Box
                    key={docType}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      backgroundColor: 'background.neutral',
                    }}
                  >
                    <Typography variant="body2">{docType}</Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteDocumentType(docType)}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" width={20} />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowManageTypesDialog(false);
              setShowDocumentTypeDialog(true);
            }}
          >
            Back to Selection
          </Button>
          <Button variant="contained" onClick={() => setShowManageTypesDialog(false)}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Form>
  );
}
