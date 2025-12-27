import React, { useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify/iconify';

//---------------------------------------------------------------

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

export function FlraDiagramForm() {
  const { setValue, watch, formState: { errors } } = useFormContext();

  const [diagramImages, setDiagramImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Watch for changes in flraDiagram field
  const flraDiagram = watch('flraDiagram');

  // Load existing diagram data when component mounts or flraDiagram changes
  React.useEffect(() => {
    if (flraDiagram && typeof flraDiagram === 'string') {
      // Try to parse as JSON array first (new format with multiple URLs)
      if (flraDiagram.startsWith('[')) {
        try {
          const parsedImages = JSON.parse(flraDiagram);
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
                  setDiagramImages(base64Images);
                  setValue('flraDiagram', JSON.stringify(base64Images));
                })
                .catch((error) => {
                  console.error('Error converting Cloudinary URLs to base64:', error);
                });
            } else {
              // Array of base64 images - use directly
              setDiagramImages(parsedImages);
            }
          }
        } catch (error) {
          console.error('Error parsing existing diagram data:', error);
        }
      } else if (flraDiagram.includes('cloudinary.com')) {
        // Single Cloudinary URL (legacy format)
        fetch(flraDiagram)
          .then((response) => response.blob())
          .then((blob) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result as string;
              setDiagramImages([base64]);
              setValue('flraDiagram', JSON.stringify([base64]));
            };
            reader.readAsDataURL(blob);
          })
          .catch((error) => {
            console.error('Error converting Cloudinary URL to base64:', error);
          });
      }
    } else if (Array.isArray(flraDiagram)) {
      // Handle case where flraDiagram is already an array
      setDiagramImages(flraDiagram);
    }
  }, [flraDiagram, setValue]);

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
        const updatedImages = [...diagramImages, ...newImages];
        setDiagramImages(updatedImages);
        setValue('flraDiagram', JSON.stringify(updatedImages));
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
        const updatedImages = [...diagramImages, compressed];
        setDiagramImages(updatedImages);
        setValue('flraDiagram', JSON.stringify(updatedImages));
      } catch (error) {
        console.error('Error processing camera file:', error);
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = diagramImages.filter((_, i) => i !== index);
    setDiagramImages(updatedImages);
    // Store as JSON array string, or null if empty
    setValue('flraDiagram', updatedImages.length > 0 ? JSON.stringify(updatedImages) : null);

    // Clear file inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleRemoveAll = () => {
    setDiagramImages([]);
    setValue('flraDiagram', null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Typography variant="h4">
          FLRA Diagram <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Add diagrams or photos to illustrate the work site setup, traffic control measures, or
          safety considerations. You can upload multiple images. <strong>Required</strong>
        </Typography>
        {errors.flraDiagram && (
          <Typography variant="caption" sx={{ color: 'error.main', mt: 1, display: 'block' }}>
            {errors.flraDiagram.message as string}
          </Typography>
        )}
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
          startIcon={<Iconify icon="solar:camera-add-bold" />}
          onClick={() => cameraInputRef.current?.click()}
          sx={{ 
            minWidth: { xs: '100%', md: 200 },
            width: { xs: '100%', md: 'auto' },
          }}
        >
          Take Photo
        </Button>

        <Button
          variant="contained"
          size="large"
          startIcon={<Iconify icon="solar:import-bold" />}
          onClick={() => fileInputRef.current?.click()}
          sx={{ 
            minWidth: { xs: '100%', md: 200 },
            width: { xs: '100%', md: 'auto' },
          }}
        >
          Upload Images
        </Button>

        {diagramImages.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            onClick={handleRemoveAll}
            sx={{ minWidth: 200 }}
          >
            Remove All ({diagramImages.length})
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
                    alt={`FLRA Diagram ${index + 1}`}
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
            No diagrams added yet. Take photos or upload images to include in your FLRA.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
