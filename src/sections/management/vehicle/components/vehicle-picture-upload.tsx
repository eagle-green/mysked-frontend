import { useBoolean } from 'minimal-shared/hooks';
import React, { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import { alpha, useTheme } from '@mui/material/styles';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { uploadVehiclePicture } from 'src/utils/vehicle-upload';

import { Upload } from 'src/components/upload';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import type { VehicleSection } from './vehicle-diagram';

// ----------------------------------------------------------------------

// Utility function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// ----------------------------------------------------------------------

interface VehiclePictureUploadProps {
  vehicleId: string;
  selectedSection?: VehicleSection;
  onUploadSuccess: () => void;
  disabled?: boolean;
}

export function VehiclePictureUpload({
  vehicleId,
  selectedSection,
  onUploadSuccess,
  disabled = false,
}: VehiclePictureUploadProps) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const uploadDialog = useBoolean();
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadNote, setUploadNote] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string>('');

  // Cleanup object URL on unmount
  React.useEffect(() => () => {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
      }
    }, [previewObjectUrl]);

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!file) return;

      // Validate file type - only allow common image formats
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
        'image/tiff',
      ];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        toast.error('Please select a valid image file (JPEG, PNG, GIF, WebP, BMP, or TIFF)');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Clean up previous object URL
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
      }

      // Create new object URL for preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewObjectUrl(objectUrl);
      setUploadingFile(file);
      uploadDialog.onTrue();
    },
    [uploadDialog, previewObjectUrl]
  );

  const handleUpload = async () => {
    if (!uploadingFile || !selectedSection) return;

    setIsUploading(true);
    const toastId = toast.loading('Uploading picture...');

    try {
      // Upload to Cloudinary
      await uploadVehiclePicture({
        file: uploadingFile,
        vehicleId,
        section: selectedSection,
        note: uploadNote.trim() || undefined,
      });

      // Invalidate the pictures query to refresh data
      queryClient.invalidateQueries({ queryKey: ['vehicle-pictures', vehicleId] });

      toast.dismiss(toastId);
      toast.success('Picture uploaded successfully!');

      // Reset form
      setUploadingFile(null);
      setUploadNote('');
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        setPreviewObjectUrl('');
      }
      uploadDialog.onFalse();

      // Notify parent component
      onUploadSuccess();
    } catch (error) {
      console.error('❌ Upload error:', error);
      toast.dismiss(toastId);
      toast.error('Failed to upload picture');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box>
      {/* Upload Area */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Iconify icon="solar:camera-add-bold" sx={{ fontSize: 24, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ color: 'text.primary' }}>
            Upload Pictures
          </Typography>
        </Stack>

        <Upload
          value={null}
          accept={{
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.bmp', '.tiff'],
          }}
          onDrop={(acceptedFiles) => {
            if (acceptedFiles.length > 0) {
              handleFileSelect(acceptedFiles[0]);
            }
          }}
          onDelete={() => {}}
          disabled={disabled || !selectedSection}
          helperText={
            !selectedSection
              ? 'Please select a vehicle section first'
              : 'Click to take photo with camera or select from gallery (JPEG, PNG, GIF, WebP, BMP, TIFF)'
          }
          sx={{
            border: `2px dashed ${selectedSection ? theme.palette.primary.main : theme.palette.grey[300]}`,
            borderRadius: 2,
            p: { xs: 2, sm: 3 },
            textAlign: 'center',
            backgroundColor: selectedSection
              ? alpha(theme.palette.primary.main, 0.02)
              : theme.palette.action.hover,
            color: 'text.primary',
            minHeight: { xs: 120, sm: 140 },
            '&:hover': !disabled && selectedSection ? {
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                borderColor: theme.palette.primary.main,
              } : undefined,
          }}
        />
      </Card>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialog.value}
        onClose={isUploading ? undefined : uploadDialog.onFalse}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown={isUploading}
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <Iconify icon="solar:camera-add-bold" />
            <Typography variant="h6" sx={{ color: 'text.primary' }}>
              Upload Picture
            </Typography>
            {isUploading && (
              <Box sx={{ ml: 'auto' }}>
                <CircularProgress size={20} />
              </Box>
            )}
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* File Info */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Selected File
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {uploadingFile?.name} ({formatFileSize(uploadingFile?.size || 0)})
              </Typography>
            </Box>

            {/* Image Preview */}
            {uploadingFile && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Preview
                </Typography>
                <Box
                  component="img"
                  src={previewObjectUrl}
                  alt="Preview"
                  sx={{
                    width: '100%',
                    maxHeight: 300,
                    objectFit: 'contain',
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.grey[300]}`,
                    backgroundColor: theme.palette.grey[50],
                  }}
                />
              </Box>
            )}

            {/* Note Input */}
            <TextField
              fullWidth
              label="Note (optional)"
              placeholder="Add a note about this picture..."
              value={uploadNote}
              onChange={(e) => setUploadNote(e.target.value)}
              multiline
              rows={3}
              disabled={isUploading}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              if (previewObjectUrl) {
                URL.revokeObjectURL(previewObjectUrl);
                setPreviewObjectUrl('');
              }
              setUploadingFile(null);
              setUploadNote('');
              uploadDialog.onFalse();
            }}
            disabled={isUploading}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={disabled || isUploading || !uploadingFile}
            startIcon={
              isUploading ? (
                <Iconify icon="solar:add-circle-bold" />
              ) : (
                <Iconify icon="eva:cloud-upload-fill" />
              )
            }
          >
            {isUploading ? 'Uploading...' : 'Upload Picture'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
