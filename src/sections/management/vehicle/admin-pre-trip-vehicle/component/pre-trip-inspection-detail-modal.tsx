import { useFormContext } from 'react-hook-form';
import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify/iconify';

//--------------------------------------------------------
type Props = {
  open: boolean;
  openIndex: number | null;
  onClose: () => void;
};
export function AdminDefectModal({ open, openIndex, onClose }: Props) {
  const [inspectionImages, setInspectionImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { setValue, watch } = useFormContext();

  const inspection = watch(`inspections.${openIndex}`);
  const inspection_image = watch(`inspections.${openIndex}.detect_issues.photo`);

  const DETECT_TYPES = [
    { label: 'Major', value: 'major' },
    { label: 'Minor', value: 'minor' },
    { label: 'Not Sure', value: 'not_sure' },
  ];

  // Load existing diagram data when component mounts or flraDiagram changes
  useEffect(() => {
    if (inspection_image && typeof inspection_image === 'string') {
      // Try to parse as JSON array first (new format with multiple URLs)
      if (inspection_image.startsWith('[')) {
        try {
          const parsedImages = JSON.parse(inspection_image);
          if (Array.isArray(parsedImages)) {
            // Check if array contains Cloudinary URLs or base64 data
            if (parsedImages.length > 0 && parsedImages[0].includes('cloudinary.com')) {
              // Array of Cloudinary URLs - convert all to base64
              const conversionPromises = parsedImages.map((url: string) =>
                fetch(url)
                  .then((response) => response.blob())
                  .then(
                    (blob) =>
                      new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                      })
                  )
              );

              Promise.all(conversionPromises)
                .then((base64Images) => {
                  setInspectionImages(base64Images);
                  setValue(
                    `inspections.${openIndex}.detect_issues.photo`,
                    JSON.stringify(base64Images)
                  );
                })
                .catch((error) => {
                  console.error('Error converting Cloudinary URLs to base64:', error);
                });
            } else {
              // Array of base64 images - use directly
              setInspectionImages(parsedImages);
            }
          }
        } catch (error) {
          console.error('Error parsing existing diagram data:', error);
        }
      } else if (inspection_image.includes('cloudinary.com')) {
        // Single Cloudinary URL (legacy format)
        fetch(inspection_image)
          .then((response) => response.blob())
          .then((blob) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result as string;
              setInspectionImages([base64]);
              setValue('flraDiagram', JSON.stringify([base64]));
            };
            reader.readAsDataURL(blob);
          })
          .catch((error) => {
            console.error('Error converting Cloudinary URL to base64:', error);
          });
      }
    } else if (Array.isArray(inspection_image)) {
      // Handle case where flraDiagram is already an array
      setInspectionImages(inspection_image);
    }
  }, [inspection_image, setValue]);

  if (!open || openIndex === null) return null;

  // Helper function to compress and resize images for better mobile compatibility
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
        const updatedImages = [...inspectionImages, ...newImages];
        setInspectionImages(updatedImages);
        setValue(`inspections.${openIndex}.detect_issues.photo`, JSON.stringify(updatedImages));
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
        const updatedImages = [...inspectionImages, compressed];
        setInspectionImages(updatedImages);
        setValue(`inspections.${openIndex}.detect_issues.photo`, JSON.stringify(updatedImages));
      } catch (error) {
        console.error('Error processing camera file:', error);
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = inspectionImages.filter((_, i) => i !== index);
    setInspectionImages(updatedImages);
    // Store as JSON array string, or null if empty
    setValue(
      `inspections.${openIndex}.detect_issues.photo`,
      updatedImages.length > 0 ? JSON.stringify(updatedImages) : null
    );

    // Clear file inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleRemoveAll = () => {
    setInspectionImages([]);
    setValue(`inspections.${openIndex}.detect_issues.photo`, null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 3 }}>
        <Typography variant="subtitle1">{inspection?.label}</Typography>
        {/* DETECT TYPE */}
        <Field.Select
          name={`inspections.${openIndex}.detect_issues.detect_type`}
          label="Detect Type"
          disabled
        >
          {DETECT_TYPES.map((role, index) => (
            <MenuItem key={`${role.value}-${index}`} value={role.value}>
              {role.label}
            </MenuItem>
          ))}
        </Field.Select>

        {/* NOTES */}
        <Field.Text
          fullWidth
          multiline
          rows={4}
          name={`inspections.${openIndex}.detect_issues.notes`}
          label="Notes"
          disabled
        />

        {/* PHOTO */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 1 }}>
          {/* Images preview in grid */}
          {inspectionImages.length > 0 && (
            <Box>
              <Stack
                spacing={1}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ p: 2 }}
              >
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Photos ({inspectionImages.length}):
                </Typography>
              </Stack>
              <Grid container spacing={2}>
                {inspectionImages.map((image, index) => (
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
                        alt={`Photo ${index + 1}`}
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

          {inspectionImages.length === 0 && (
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
                No photo added yet. Take photos or upload images to include in your inspection
                details.
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button
          variant="soft"
          onClick={() => {
            onClose();
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
