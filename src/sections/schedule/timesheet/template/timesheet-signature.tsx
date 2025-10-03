import type { UseBooleanReturn } from 'minimal-shared/hooks';

import { useRef, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
//-----------------------------------------------------------------------
type TimeSheetSignatureProps = {
  title: string;
  dialog: UseBooleanReturn;
  onSave: (signature: string | null, type: string) => void;
  type: string;
};

export function TimeSheetSignatureDialog({ dialog, type, title, onSave }: TimeSheetSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useTheme();

  // Drawing state refs to avoid stale closures
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });


  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Reset drawing state
    isDrawingRef.current = false;
    lastPointRef.current = { x: 0, y: 0 };
  }, []);

  // Check if canvas is empty
  const isCanvasEmpty = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return true;

    const ctx = canvas.getContext('2d');
    if (!ctx) return true;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return imageData.data.every((pixel) => pixel === 0);
  }, []);

  // Get signature as data URL
  const getSignatureDataURL = useCallback(() => {
    const canvas = canvasRef.current;
    return canvas ? canvas.toDataURL('image/png') : null;
  }, []);

  // Initialize canvas - separate useEffect for setup
  useEffect(() => {
    if (dialog.value && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Set canvas size
        canvas.width = 400;
        canvas.height = 200;

        // Set drawing style
        ctx.strokeStyle = theme.palette.text.secondary;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [dialog.value, theme.palette.text.secondary]);

  // Simple mobile-first approach
  useEffect(() => {
    if (!dialog.value) return undefined;

    // Wait for canvas to be rendered
    const timeoutId = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let drawing = false;
      let lastX = 0;
      let lastY = 0;

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

      const startDrawing = (e: any) => {
        if (e.type === 'touchstart') {
          e.preventDefault();
        }
        drawing = true;
        const { x, y } = getXY(e);
        lastX = x;
        lastY = y;

        ctx.strokeStyle = theme.palette.text.secondary;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
        ctx.fill();
      };

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

      const stopDrawing = (e: any) => {
        if (!drawing) return;

        if (e.type === 'touchend') {
          e.preventDefault();
        }

        drawing = false;
      };

      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);

      canvas.addEventListener('touchstart', startDrawing, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      canvas.addEventListener('touchend', stopDrawing, { passive: false });
    }, 100); // Wait 100ms for canvas to render

    return () => {
      clearTimeout(timeoutId);
    };
  }, [dialog.value, theme.palette.text.secondary]);

  return (
    <Dialog fullWidth maxWidth="xs" open={dialog.value} onClose={dialog.onFalse}>
      <DialogTitle sx={{ pb: 2 }}>Signature</DialogTitle>
      <DialogContent sx={{ typography: 'body2' }}>
        <Typography variant="body1" sx={{ flexGrow: 1, py: 2 }}>
          {title}
        </Typography>

        {/* Client Signature Message */}
        {type === 'client' && (
          <Paper
            elevation={1}
            sx={{
              p: 2,
              mb: 2,
              bgcolor: 'info.lighter',
              border: '1px solid',
              borderColor: 'info.main',
              borderRadius: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'info.darker',
                fontWeight: 'medium',
                textAlign: 'center',
                lineHeight: 1.5,
              }}
            >
              By signing this invoice as a representative of the customer, you confirm that the
              hours recorded are accurate and were performed by the named employee(s) in a
              satisfactory manner.
            </Typography>
          </Paper>
        )}

        <Paper elevation={3} sx={{ p: 1 }}>
          <Box
            sx={{
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              borderColor: `${theme.palette.text.secondary}`,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: '200px',
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
              onMouseDown={(e) => {
                e.preventDefault();
                const canvas = canvasRef.current;
                if (!canvas) return;

                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const x = (e.clientX - rect.left) * scaleX;
                const y = (e.clientY - rect.top) * scaleY;

                // Start drawing
                isDrawingRef.current = true;
                lastPointRef.current = { x, y };

                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                ctx.strokeStyle = theme.palette.text.secondary;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                // Draw initial point
                ctx.beginPath();
                ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
                ctx.fill();
              }}
              onMouseMove={(e) => {
                if (!isDrawingRef.current) return;
                e.preventDefault();

                const canvas = canvasRef.current;
                if (!canvas) return;

                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const x = (e.clientX - rect.left) * scaleX;
                const y = (e.clientY - rect.top) * scaleY;

                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                ctx.strokeStyle = theme.palette.text.secondary;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                // Draw line from last point to current point
                ctx.beginPath();
                ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
                ctx.lineTo(x, y);
                ctx.stroke();

                // Update last point
                lastPointRef.current = { x, y };
              }}
              onMouseUp={(e) => {
                e.preventDefault();
                isDrawingRef.current = false;
              }}
            />
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={clearCanvas}>
          Clear
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => {
            dialog.onFalse();
            clearCanvas();
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            const signature = isCanvasEmpty() ? null : getSignatureDataURL();
            dialog.onFalse();
            onSave(signature, type);
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
