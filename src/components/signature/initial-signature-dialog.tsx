import { useRef, useState, useEffect, useCallback } from 'react';

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
  
  // Drawing state refs to avoid stale closures
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  // Initialize canvas when dialog opens
  useEffect(() => {
    if (!open) return undefined;

    const timeoutId = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size - fixed dimensions like timesheet
      canvas.width = 400;
      canvas.height = 150;

      // Set drawing styles
      ctx.strokeStyle = theme.palette.text.secondary;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Load existing signature if available
      if (currentSignature) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = currentSignature;
      }
    }, 100); // Wait 100ms for canvas to render

    return () => {
      clearTimeout(timeoutId);
    };
  }, [open, currentSignature, theme.palette.text.secondary]);

  const getXY = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number;
    let clientY: number;

    if ('touches' in e && e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      const mouseEvent = e as MouseEvent;
      clientX = mouseEvent.clientX;
      clientY = mouseEvent.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const startDrawing = useCallback((e: MouseEvent | TouchEvent) => {
    if ('type' in e && e.type === 'touchstart') {
      e.preventDefault();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    const { x, y } = getXY(e);
    lastPointRef.current = { x, y };

    ctx.strokeStyle = theme.palette.text.secondary;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw initial point
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
    ctx.fill();
  }, [getXY, theme.palette.text.secondary]);

  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDrawingRef.current) return;

    if ('type' in e && e.type === 'touchmove') {
      e.preventDefault();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getXY(e);

    ctx.strokeStyle = theme.palette.text.secondary;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastPointRef.current = { x, y };
  }, [getXY, theme.palette.text.secondary]);

  const stopDrawing = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDrawingRef.current) return;

    if ('type' in e && e.type === 'touchend') {
      e.preventDefault();
    }

    isDrawingRef.current = false;
  }, []);

  // Add event listeners - second useEffect for event handling
  useEffect(() => {
    if (!open) return undefined;

    // Capture canvas ref value
    const canvas = canvasRef.current;
    
    const timeoutId = setTimeout(() => {
      if (!canvas) return;

      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);

      canvas.addEventListener('touchstart', startDrawing, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      canvas.addEventListener('touchend', stopDrawing, { passive: false });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (canvas) {
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', stopDrawing);

        canvas.removeEventListener('touchstart', startDrawing);
        canvas.removeEventListener('touchmove', draw);
        canvas.removeEventListener('touchend', stopDrawing);
      }
    };
  }, [open, startDrawing, draw, stopDrawing]);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  }, []);

  const handleSave = useCallback(() => {
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
  }, [onSave, onClose]);

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
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              borderColor: theme.palette.text.secondary,
              overflow: 'hidden',
              position: 'relative',
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
                border: '1px solid #ccc',
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
          Save Initial
        </Button>
      </DialogActions>
    </Dialog>
  );
}
