import { z as zod } from 'zod';
import { useRef, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Form } from 'src/components/hook-form';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const CameraCaptureSchema = {
  expirationDate: zod.string().optional(),
  documentType: zod.enum(['tcp_certification', 'driver_license']),
} satisfies zod.ZodRawShape;

const CameraCaptureSchemaType = zod.object(CameraCaptureSchema);
type CameraCaptureSchemaType = zod.infer<typeof CameraCaptureSchemaType>;

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File, expirationDate?: string) => void;
  documentType: 'tcp_certification' | 'driver_license';
  title: string;
};

export function CameraCapture({ open, onClose, onCapture, documentType, title }: Props) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const methods = useForm<CameraCaptureSchemaType>({
    defaultValues: {
      expirationDate: '',
      documentType,
    },
  });

  const { control, handleSubmit, reset } = methods;

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      // Request camera permissions with more specific constraints
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // Prefer back camera
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setCameraError(null);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
    
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast.error('Camera access denied. Please allow camera permissions in your browser settings and try again.');
        } else if (error.name === 'NotFoundError') {
          toast.error('No camera found on this device.');
        } else if (error.name === 'NotSupportedError') {
          toast.error('Camera not supported in this browser. Please use a modern browser.');
        } else if (error.name === 'NotReadableError') {
          toast.error('Camera is already in use by another application.');
        } else {
          toast.error(`Camera error: ${error.message}`);
        }
      } else {
        toast.error('Unable to access camera. Please check permissions and try again.');
      }
      setCameraError(error instanceof Error ? error.message : 'Camera access failed');
    }
  }, []);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Handle dialog open/close
  const handleOpen = () => {
    startCamera();
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setCameraError(null);
    setIsRetrying(false);
    reset();
    onClose();
  };

  // Capture image from camera
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        setIsCapturing(false);
      }
    }, 'image/jpeg', 0.8);
  };

  // Handle form submission
  const onSubmit = handleSubmit((data) => {
    if (capturedImage) {
      // Convert captured image back to file
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `${documentType}_${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          onCapture(file, data.expirationDate);
          handleClose();
        });
    }
  });

  const handleRetry = async () => {
    setIsRetrying(true);
    setCameraError(null);
    await startCamera();
    setIsRetrying(false);
  };

  // Auto-start camera when dialog opens
  if (open && !stream && !cameraError) {
    handleOpen();
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">{title}</Typography>
          <IconButton onClick={handleClose}>
            <Iconify icon="solar:close-circle-bold" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 0, position: 'relative' }}>
        {!capturedImage ? (
          cameraError ? (
            // Camera error state
            <Box sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Iconify icon="solar:camera-add-bold" width={64} sx={{ mb: 2, color: 'error.main' }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Camera Access Error
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {cameraError}
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>To fix this:</strong>
                  <br />• Make sure you&apos;re using HTTPS (required for camera access)
                  <br />• Allow camera permissions when prompted
                  <br />• Check if camera is being used by another app
                  <br />• Try refreshing the page and try again
                </Typography>
              </Alert>
              
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  startIcon={<Iconify icon="solar:restart-bold" />}
                >
                  {isRetrying ? 'Retrying...' : 'Try Again'}
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={handleClose}
                >
                  Use File Upload Instead
                </Button>
              </Stack>
            </Box>
          ) : (
            // Camera view with overlay
            <Box sx={{ position: 'relative', height: '100%' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              
              {/* Card border overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '85%',
                  height: '60%',
                  border: '3px solid #00ab55',
                  borderRadius: 2,
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                  pointerEvents: 'none',
                }}
              >
                {/* Corner indicators */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -2,
                    left: -2,
                    width: 20,
                    height: 20,
                    borderTop: '4px solid #00ab55',
                    borderLeft: '4px solid #00ab55',
                    borderTopLeftRadius: 8,
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 20,
                    height: 20,
                    borderTop: '4px solid #00ab55',
                    borderRight: '4px solid #00ab55',
                    borderTopRightRadius: 8,
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -2,
                    left: -2,
                    width: 20,
                    height: 20,
                    borderBottom: '4px solid #00ab55',
                    borderLeft: '4px solid #00ab55',
                    borderBottomLeftRadius: 8,
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 20,
                    height: 20,
                    borderBottom: '4px solid #00ab55',
                    borderRight: '4px solid #00ab55',
                    borderBottomRightRadius: 8,
                  }}
                />
              </Box>

              {/* Instructions */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 20,
                  left: 20,
                  right: 20,
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  p: 2,
                  borderRadius: 2,
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2">
                  Position the {documentType === 'driver_license' ? 'driver license' : 'certification'} within the green border
                </Typography>
              </Box>

              {/* Hidden canvas for capture */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </Box>
          )
        ) : (
          // Captured image preview with expiration form
          <Box sx={{ p: 2 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Preview
                </Typography>
                <Box
                  component="img"
                  src={capturedImage}
                  alt="Captured document"
                  sx={{
                    width: '100%',
                    height: 200,
                    objectFit: 'contain',
                    border: '1px solid #ddd',
                    borderRadius: 1,
                  }}
                />
              </Box>

              <Form methods={methods} onSubmit={onSubmit}>
                <Stack spacing={2}>
                  <Controller
                    name="documentType"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Document Type</InputLabel>
                        <Select {...field} label="Document Type">
                          <MenuItem value="tcp_certification">TCP Certification</MenuItem>
                          <MenuItem value="driver_license">Driver License</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />

                  <Controller
                    name="expirationDate"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        label="Expiration Date (Optional)"
                        type="date"
                        fullWidth
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                  />
                </Stack>
              </Form>
            </Stack>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {!capturedImage ? (
          <>
            <Button onClick={handleClose} color="inherit">
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={captureImage}
              disabled={isCapturing || !!cameraError}
              startIcon={<Iconify icon="solar:camera-add-bold" />}
            >
              {isCapturing ? 'Capturing...' : 'Capture'}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => setCapturedImage(null)} color="inherit">
              Retake
            </Button>
            <Button
              variant="contained"
              onClick={onSubmit}
              startIcon={<Iconify icon="solar:check-circle-bold" />}
            >
              Use Photo
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
} 