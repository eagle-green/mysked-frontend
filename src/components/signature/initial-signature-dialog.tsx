import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { Iconify } from 'src/components/iconify/iconify';

// ----------------------------------------------------------------------

type InitialSignatureDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (signature: string) => void;
  title: string;
  currentSignature?: string | null;
};

export function InitialSignatureDialog({
  open,
  onClose,
  onSave,
  title,
  currentSignature,
}: InitialSignatureDialogProps) {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signature, setSignature] = useState<string | null>(currentSignature || null);

  // Sync signature state with currentSignature prop when dialog opens
  useEffect(() => {
    if (open) {
      setSignature(currentSignature || null);
    }
  }, [open, currentSignature]);

  // Simple mobile-first approach - all drawing logic in one useEffect
  useEffect(() => {
    if (!open) return undefined;

    // Wait for canvas to be rendered
    const timeoutId = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return undefined;

      const ctx = canvas.getContext('2d');
      if (!ctx) return undefined;

      // Set canvas size
      canvas.width = 400;
      canvas.height = 150;

      // Set drawing style
      ctx.strokeStyle = theme.palette.text.secondary;
      ctx.fillStyle = theme.palette.text.secondary;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Load existing signature if available
      if (currentSignature) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = currentSignature;
      }

      // Drawing variables (local to this effect)
      let drawing = false;
      let lastX = 0;
      let lastY = 0;

      // Get coordinates from event
      const getXY = (e: any) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          clientX = e.clientX;
          clientY = e.clientY;
        }

        return {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY,
        };
      };

      // Start drawing
      const startDrawing = (e: any) => {
        if (e.type === 'touchstart') {
          e.preventDefault();
        }
        drawing = true;
        const { x, y } = getXY(e);
        lastX = x;
        lastY = y;

        ctx.strokeStyle = theme.palette.text.secondary;
        ctx.fillStyle = theme.palette.text.secondary;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw initial point
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
        ctx.fill();
      };

      // Draw
      const draw = (e: any) => {
        if (!drawing) return;

        if (e.type === 'touchmove') {
          e.preventDefault();
        }

        const { x, y } = getXY(e);

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();

        lastX = x;
        lastY = y;
      };

      // Stop drawing
      const stopDrawing = (e: any) => {
        if (!drawing) return;

        if (e.type === 'touchend') {
          e.preventDefault();
        }

        drawing = false;
      };

      // Add event listeners
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseleave', stopDrawing);

      canvas.addEventListener('touchstart', startDrawing, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      canvas.addEventListener('touchend', stopDrawing, { passive: false });

      // Cleanup
      return () => {
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', stopDrawing);
        canvas.removeEventListener('mouseleave', stopDrawing);

        canvas.removeEventListener('touchstart', startDrawing);
        canvas.removeEventListener('touchmove', draw);
        canvas.removeEventListener('touchend', stopDrawing);
      };
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [open, currentSignature, theme.palette.text.secondary]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the canvas completely
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if canvas is empty
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const isEmpty = imageData.data.every((pixel) => pixel === 0);

    if (isEmpty) {
      setSignature(null);
      onSave('');
    } else {
      const signatureData = canvas.toDataURL('image/png');
      setSignature(signatureData);
      onSave(signatureData);
    }

    onClose();
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitle>Digital Initial</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {title}
        </Typography>

        <Paper elevation={3} sx={{ p: 1 }}>
          <Box
            sx={{
              borderRadius: '6px',
              overflow: 'hidden',
              position: 'relative',
              backgroundColor: 'white',
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: '150px',
                display: 'block',
                touchAction: 'none',
                cursor: 'crosshair',
                backgroundColor: 'white',
                border: '2px solid #ccc',
                borderRadius: '6px',
                // Mobile-specific styles
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none',
                pointerEvents: 'auto',
              }}
            />
          </Box>
        </Paper>

        {signature && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="success.main">
              ✓ Initial captured
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClear} startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}>
          Clear
        </Button>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} startIcon={<Iconify icon="solar:check-circle-bold" />}>
          Save 
        </Button>
      </DialogActions>
    </Dialog>
  );
}
