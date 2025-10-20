import type { IVehiclePicture } from 'src/types/vehicle-picture';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useBoolean } from 'minimal-shared/hooks';
import React, { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
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

import { uploadVehiclePicture, deleteVehiclePicture } from 'src/utils/vehicle-upload';

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

interface VehiclePictureManagerProps {
  vehicleId: string;
  pictures: IVehiclePicture[];
  onPicturesUpdate: (pictures: IVehiclePicture[]) => void;
  selectedSection?: VehicleSection;
  onSectionSelect?: (section: VehicleSection) => void;
  disabled?: boolean;
}

export function VehiclePictureManager({
  vehicleId,
  pictures = [],
  onPicturesUpdate,
  selectedSection,
  onSectionSelect,
  disabled = false,
}: VehiclePictureManagerProps) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const uploadDialog = useBoolean();
  const previewDialog = useBoolean();
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadNote, setUploadNote] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string>('');

  // Cleanup object URL on unmount
  React.useEffect(() => () => {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
      }
    }, [previewObjectUrl]);

  // Group pictures by section
  const picturesBySection = pictures.reduce(
    (acc, picture) => {
      if (!acc[picture.section]) {
        acc[picture.section] = [];
      }
      acc[picture.section].push(picture);
      return acc;
    },
    {} as Record<VehicleSection, IVehiclePicture[]>
  );


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
      const uploadedUrl = await uploadVehiclePicture({
        file: uploadingFile,
        vehicleId,
        section: selectedSection,
        note: uploadNote.trim() || undefined,
      });

      const newPicture: IVehiclePicture = {
        id: `temp_${Date.now()}`,
        vehicle_id: vehicleId,
        section: selectedSection,
        url: uploadedUrl,
        note: uploadNote.trim() || undefined,
        uploaded_at: new Date().toISOString(),
        file_name: uploadingFile.name,
        file_size: uploadingFile.size,
        mime_type: uploadingFile.type,
      };

      // Add to pictures list
      onPicturesUpdate([...pictures, newPicture]);
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
    } catch (error) {
      console.error('Upload error:', error);
      toast.dismiss(toastId);
      toast.error('Failed to upload picture');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePicture = async (pictureId: string) => {
    const picture = pictures.find((p) => p.id === pictureId);
    if (!picture) return;

    const toastId = toast.loading('Deleting picture...');

    try {
      // Delete from Cloudinary and database
      await deleteVehiclePicture(pictureId);

      // Remove from local state
      const updatedPictures = pictures.filter((p) => p.id !== pictureId);
      onPicturesUpdate(updatedPictures);
      // Invalidate the pictures query to refresh data
      queryClient.invalidateQueries({ queryKey: ['vehicle-pictures', vehicleId] });

      toast.dismiss(toastId);
      toast.success('Picture deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.dismiss(toastId);
      toast.error('Failed to delete picture');
    }
  };


  const handleImagePreview = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
    previewDialog.onTrue();
  };

  const selectedPictures = selectedSection ? picturesBySection[selectedSection] || [] : [];

  return (
    <Box>
      {/* Upload Area */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Iconify icon="solar:camera-add-bold" sx={{ fontSize: 24, color: 'primary.main' }} />
          <Typography variant="h6">Vehicle Pictures</Typography>
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
              : 'Click or drag image here to upload (JPEG, PNG, GIF, WebP, BMP, TIFF)'
          }
          sx={{
            border: `2px dashed ${theme.palette.grey[300]}`,
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            backgroundColor: selectedSection
              ? alpha(theme.palette.primary.main, 0.02)
              : theme.palette.grey[50],
            '&:hover': !disabled && selectedSection ? {
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                borderColor: theme.palette.primary.main,
              } : undefined,
          }}
        />
      </Card>

      {/* Selected Section Pictures */}
      {selectedSection && (
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Iconify icon="solar:gallery-add-bold" sx={{ fontSize: 20 }} />
            <Typography variant="h6">
              {selectedSection.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())} Pictures
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ({selectedPictures.length} picture{selectedPictures.length !== 1 ? 's' : ''})
            </Typography>
          </Stack>

          {selectedPictures.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 4,
                color: 'text.secondary',
                border: `1px dashed ${theme.palette.grey[300]}`,
                borderRadius: 2,
              }}
            >
              <Iconify icon="solar:gallery-add-bold" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="body2">No pictures uploaded for this section yet</Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {selectedPictures.map((picture) => (
                <Grid key={picture.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    sx={{
                      p: 2,
                      position: 'relative',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        boxShadow: theme.shadows[4],
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src={picture.url}
                      alt={picture.note || 'Vehicle picture'}
                      onClick={() => handleImagePreview(picture.url)}
                      sx={{
                        width: '100%',
                        height: 200,
                        objectFit: 'contain',
                        borderRadius: 1,
                        mb: 2,
                        cursor: 'pointer',
                        backgroundColor: theme.palette.grey[100],
                        '&:hover': {
                          opacity: 0.8,
                        },
                      }}
                    />

                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{ mb: 1, fontWeight: 500 }}
                    >
                      {picture.file_name}
                    </Typography>

                    {picture.note && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mb: 1, display: 'block' }}
                      >
                        {picture.note}
                      </Typography>
                    )}

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 1, display: 'block' }}
                    >
                      {formatFileSize(picture.file_size || 0)}
                    </Typography>

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Iconify icon="solar:calendar-date-bold" sx={{ fontSize: 14 }} />
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(picture.uploaded_at).tz('America/Los_Angeles').format('MMM D, YYYY h:mm A')}
                      </Typography>
                    </Stack>

                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                      onClick={() => handleDeletePicture(picture.id)}
                      disabled={disabled}
                      sx={{
                        width: { xs: '100%', sm: 'auto' },
                        minWidth: { sm: 100 },
                      }}
                    >
                      Delete
                    </Button>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Card>
      )}

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
            <Typography variant="h6">Upload Picture</Typography>
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
            disabled={isUploading || !uploadingFile}
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

      {/* Image Preview Dialog */}
      <Dialog open={previewDialog.value} onClose={previewDialog.onFalse} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <Iconify icon="solar:gallery-add-bold" />
            <Typography variant="h6">Image Preview</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Box
            component="img"
            src={previewImageUrl}
            alt="Preview"
            sx={{
              width: '100%',
              height: 'auto',
              maxHeight: '70vh',
              objectFit: 'contain',
              borderRadius: 1,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={previewDialog.onFalse}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
