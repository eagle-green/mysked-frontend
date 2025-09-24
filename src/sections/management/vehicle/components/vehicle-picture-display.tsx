import type { IVehiclePicture } from 'src/types/vehicle-picture';

import { useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { deleteVehiclePicture } from 'src/utils/vehicle-upload';

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

interface VehiclePictureDisplayProps {
  vehicleId: string;
  pictures: IVehiclePicture[];
  onPicturesUpdate: (pictures: IVehiclePicture[]) => void;
  selectedSection?: VehicleSection;
  disabled?: boolean;
}

export function VehiclePictureDisplay({
  vehicleId,
  pictures,
  onPicturesUpdate,
  selectedSection,
  disabled = false,
}: VehiclePictureDisplayProps) {
  const theme = useTheme();
  const previewDialog = useBoolean();
  const deleteDialog = useBoolean();
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [previewPicture, setPreviewPicture] = useState<IVehiclePicture | null>(null);
  const [pictureToDelete, setPictureToDelete] = useState<IVehiclePicture | null>(null);

  // Group pictures by section
  const picturesBySection = pictures.reduce((acc, picture) => {
    if (!acc[picture.section]) {
      acc[picture.section] = [];
    }
    acc[picture.section].push(picture);
    return acc;
  }, {} as Record<VehicleSection, IVehiclePicture[]>);

  const handleDeleteClick = (picture: IVehiclePicture) => {
    setPictureToDelete(picture);
    deleteDialog.onTrue();
  };

  const handleDeleteConfirm = async () => {
    if (!pictureToDelete) return;

    const toastId = toast.loading('Deleting picture...');

    try {
      // Delete from Cloudinary and database
      await deleteVehiclePicture(pictureToDelete.id);
      
      // Remove from local state
      const updatedPictures = pictures.filter(p => p.id !== pictureToDelete.id);
      onPicturesUpdate(updatedPictures);
      
      toast.dismiss(toastId);
      toast.success('Picture deleted');
      
      // Close dialog and reset state
      deleteDialog.onFalse();
      setPictureToDelete(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast.dismiss(toastId);
      toast.error('Failed to delete picture');
    }
  };

  const handleDeleteCancel = () => {
    deleteDialog.onFalse();
    setPictureToDelete(null);
  };

  const handleImagePreview = (picture: IVehiclePicture) => {
    setPreviewImageUrl(picture.url);
    setPreviewPicture(picture);
    previewDialog.onTrue();
  };

  const handleDownload = async (picture: IVehiclePicture) => {
    try {
      const response = await fetch(picture.url);
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = picture.file_name || `vehicle-picture-${picture.id}`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Picture downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download picture');
    }
  };

  const selectedPictures = selectedSection ? picturesBySection[selectedSection] || [] : [];

  return (
    <Box>
      {/* Selected Section Pictures */}
      {selectedSection && (
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Iconify icon="solar:gallery-add-bold" sx={{ fontSize: 20 }} />
            <Typography variant="h6">
              {selectedSection.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Pictures
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
              <Typography variant="body2">
                No pictures uploaded for this section yet
              </Typography>
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
                      onClick={() => handleImagePreview(picture)}
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
                    
                    <Typography variant="body2" color="text.primary" sx={{ mb: 1, fontWeight: 500 }}>
                      {picture.file_name}
                    </Typography>
                    
                    {picture.note && (
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        {picture.note}
                      </Typography>
                    )}
                    
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      {formatFileSize(picture.file_size || 0)}
                    </Typography>
                    
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Iconify icon="solar:calendar-date-bold" sx={{ fontSize: 14 }} />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(picture.uploaded_at).toLocaleString()}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                      <Button
                        size="small"
                        color="primary"
                        variant="outlined"
                        startIcon={<Iconify icon="solar:download-bold" />}
                        onClick={() => handleDownload(picture)}
                        sx={{ 
                          flex: 1,
                          minWidth: 0
                        }}
                      >
                        Download
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                        onClick={() => handleDeleteClick(picture)}
                        disabled={disabled}
                        sx={{ 
                          flex: 1,
                          minWidth: 0
                        }}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Card>
      )}

      {/* Image Preview Dialog */}
      <Dialog
        open={previewDialog.value}
        onClose={previewDialog.onFalse}
        maxWidth="md"
        fullWidth
      >
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
          {previewPicture && (
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:download-bold" />}
              onClick={() => handleDownload(previewPicture)}
            >
              Download
            </Button>
          )}
          <Button onClick={previewDialog.onFalse}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.value}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <Iconify icon="solar:danger-triangle-bold" sx={{ color: 'error.main' }} />
            <Typography variant="h6">Confirm Deletion</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete this picture?
          </Typography>
          {pictureToDelete && (
            <Box sx={{ mb: 3 }}>
              {/* Image Preview */}
              <Box
                component="img"
                src={pictureToDelete.url}
                alt={pictureToDelete.note || 'Vehicle picture'}
                sx={{
                  width: '100%',
                  maxHeight: 400,
                  objectFit: 'contain',
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.grey[300]}`,
                  backgroundColor: theme.palette.grey[50],
                  mb: 2,
                }}
              />
              
              {/* Picture Details */}
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                File: {pictureToDelete.file_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Section: {pictureToDelete.section.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Typography>
              {pictureToDelete.note && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Note: {pictureToDelete.note}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Uploaded: {new Date(pictureToDelete.uploaded_at).toLocaleString()}
              </Typography>
            </Box>
          )}
          <Typography variant="body2" color="error.main">
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
          >
            Delete Picture
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
