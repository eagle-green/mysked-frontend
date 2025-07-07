import Cropper from 'react-easy-crop';
import React, { useRef, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';

// Utility to get cropped image
function getCroppedImg(imageSrc: string, crop: any, zoom: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = image.naturalWidth / image.width;
      const cropX = crop.x * scale;
      const cropY = crop.y * scale;
      const cropWidth = crop.width * scale;
      const cropHeight = crop.height * scale;
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject('No canvas context');
        return;
      }
      ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject('Failed to crop image');
      }, 'image/jpeg');
    };
    image.onerror = reject;
  });
}

interface ImageCropDialogProps {
  open: boolean;
  imageUrl: string;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
  aspect?: number;
  onUseFullImage?: () => void;
  shouldExtractExpiry?: boolean;
  setShouldExtractExpiry?: (val: boolean) => void;
}

export function ImageCropDialog({
  open,
  imageUrl,
  onClose,
  onCropComplete,
  aspect = 4 / 3,
  onUseFullImage,
  shouldExtractExpiry,
  setShouldExtractExpiry,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [minZoom, setMinZoom] = useState(1);
  const imageSize = useRef<{ width: number; height: number } | null>(null);

  React.useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setMinZoom(1);
  }, [imageUrl]);

  // Calculate minZoom to fit the image in the crop area
  const handleMediaLoaded = useCallback(
    ({ naturalWidth, naturalHeight }: { naturalWidth: number; naturalHeight: number }) => {
      imageSize.current = { width: naturalWidth, height: naturalHeight };
      // Calculate minZoom
      const cropAspect = aspect;
      const imageAspect = naturalWidth / naturalHeight;
      let minZoomCalc = 1;
      if (imageAspect > cropAspect) {
        // Image is wider than crop area
        minZoomCalc = cropAspect / imageAspect;
      } else {
        // Image is taller than crop area
        minZoomCalc = imageAspect / cropAspect;
      }
      // react-easy-crop expects minZoom >= 1, so clamp
      minZoomCalc = Math.max(1, minZoomCalc);
      setMinZoom(minZoomCalc);
      setZoom(minZoomCalc);
    },
    [aspect]
  );

  // Fit to image handler
  const handleFitToImage = useCallback(() => {
    setZoom(minZoom);
  }, [minZoom]);

  const onCropCompleteInternal = useCallback((_: any, areaPixels: any) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels, zoom);
      onCropComplete(croppedBlob);
      onClose();
    } catch (err) {
      alert('Failed to crop image: ' + err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Crop Image</DialogTitle>
      <DialogContent>
        {/* Expiry extraction toggle */}
        {typeof shouldExtractExpiry === 'boolean' && setShouldExtractExpiry && (
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={shouldExtractExpiry}
                  onChange={(e) => setShouldExtractExpiry(e.target.checked)}
                />
              }
              label={<strong>🔍 Auto-extract expiry date</strong>}
            />
          </Box>
        )}
        <Box sx={{ position: 'relative', width: '100%', height: 400, bgcolor: 'grey.900' }}>
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropCompleteInternal}
            minZoom={minZoom}
            onMediaLoaded={handleMediaLoaded}
          />
          <Button
            onClick={handleFitToImage}
            sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}
            variant="contained"
            color="primary"
          >
            Fit to Image
          </Button>
          {onUseFullImage && (
            <Button
              onClick={onUseFullImage}
              sx={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}
              variant="contained"
              color="success"
            >
              Use Full Image
            </Button>
          )}
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography gutterBottom>Zoom</Typography>
          <Slider
            value={zoom}
            min={minZoom}
            max={3}
            step={0.01}
            onChange={(_, value) => setZoom(Number(value))}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={processing}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} variant="contained" disabled={processing}>
          Crop & Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
