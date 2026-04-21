import {
  useRef,
  useEffect,
  forwardRef,
  useCallback,
  useImperativeHandle,
} from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { Iconify } from 'src/components/iconify/iconify';

const CANVAS_W = 500;
const CANVAS_H = 180;

export type PolicyInlineSignaturePadRef = {
  getSignatureDataURL: () => string | null;
  clear: () => void;
  hasStroke: () => boolean;
};

/**
 * Signature capture for policy review dialogs (inline, no modal).
 * Tracks whether the user has drawn so blank pads are rejected on submit.
 */
export const PolicyInlineSignaturePad = forwardRef<PolicyInlineSignaturePadRef, object>(
  function PolicyInlineSignaturePad(_props, ref) {
    const theme = useTheme();
    const isMobile = useMediaQuery('(max-width:768px)');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const hasStrokeRef = useRef(false);

    const setupCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = CANVAS_W;
      canvas.height = CANVAS_H;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = theme.palette.text.secondary;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      hasStrokeRef.current = false;
    }, [theme.palette.text.secondary]);

    useEffect(() => {
      setupCanvas();
    }, [setupCanvas]);

    useImperativeHandle(
      ref,
      () => ({
        getSignatureDataURL: () => {
          const canvas = canvasRef.current;
          return canvas && hasStrokeRef.current ? canvas.toDataURL('image/png') : null;
        },
        clear: () => {
          setupCanvas();
        },
        hasStroke: () => hasStrokeRef.current,
      }),
      [setupCanvas]
    );

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return undefined;

      const ctx = canvas.getContext('2d');
      if (!ctx) return undefined;

      const getXY = (e: MouseEvent | TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        let clientX: number;
        let clientY: number;
        if ('touches' in e && e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else if ('clientX' in e) {
          clientX = e.clientX;
          clientY = e.clientY;
        } else {
          return { x: 0, y: 0 };
        }
        return {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY,
        };
      };

      let drawing = false;
      let lastX = 0;
      let lastY = 0;

      const startDrawing = (e: MouseEvent | TouchEvent) => {
        if ('type' in e && e.type === 'touchstart') {
          e.preventDefault();
        }
        drawing = true;
        hasStrokeRef.current = true;
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

      const draw = (e: MouseEvent | TouchEvent) => {
        if (!drawing) return;
        if ('type' in e && e.type === 'touchmove') {
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

      const stopDrawing = (e: MouseEvent | TouchEvent) => {
        if (!drawing) return;
        if ('type' in e && e.type === 'touchend') {
          e.preventDefault();
        }
        drawing = false;
      };

      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseleave', stopDrawing);
      canvas.addEventListener('touchstart', startDrawing, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      canvas.addEventListener('touchend', stopDrawing, { passive: false });

      return () => {
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', stopDrawing);
        canvas.removeEventListener('mouseleave', stopDrawing);
        canvas.removeEventListener('touchstart', startDrawing);
        canvas.removeEventListener('touchmove', draw);
        canvas.removeEventListener('touchend', stopDrawing);
      };
    }, [theme.palette.text.secondary]);

    return (
      <Stack spacing={1} sx={{ width: '100%' }}>
        <Paper elevation={0} sx={{ p: 1, bgcolor: 'background.paper' }}>
          <Box
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              overflow: 'hidden',
              touchAction: 'none',
            }}
          >
            <Box
              component="canvas"
              ref={canvasRef}
              sx={{
                width: '100%',
                height: { xs: 160, sm: 180 },
                display: 'block',
                cursor: 'crosshair',
                bgcolor: 'common.white',
                userSelect: 'none',
                WebkitUserSelect: 'none',
              }}
            />
          </Box>
        </Paper>
        <Button
          type="button"
          size={isMobile ? 'large' : 'small'}
          variant={isMobile ? 'contained' : 'soft'}
          color="inherit"
          startIcon={<Iconify icon="solar:eraser-bold" width={18} />}
          onClick={() => setupCanvas()}
          sx={{
            alignSelf: 'flex-start',
            px: 1.5,
            borderRadius: 1,
            ...(isMobile
              ? { minHeight: 48, py: 1.25 }
              : {
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: 'background.neutral',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderColor: 'text.disabled',
                  },
                }),
          }}
        >
          Clear
        </Button>
      </Stack>
    );
  }
);
