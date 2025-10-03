import type { FieldLevelRiskAssessmentType } from 'src/pages/template/field-level-risk-assessment';

import { useFormContext } from 'react-hook-form';
import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

import { Iconify } from 'src/components/iconify/iconify';

//---------------------------------------------------------------
export function SignatureStep() {
  const theme = useTheme();
  const isXsSmMd = useMediaQuery(theme.breakpoints.down('md'));
  const {
    setValue,
    watch,
    formState: { errors },
    clearErrors,
  } = useFormContext<FieldLevelRiskAssessmentType>();

  const [signature, setSignature] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fullName = watch('full_name');

  // Drawing state refs to avoid stale closures
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  const handleAddSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if canvas is empty
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const isEmpty = imageData.data.every((pixel) => pixel === 0);

    const sign = isEmpty ? null : canvas.toDataURL('image/png');
    setSignature(sign);
    setValue('signature', sign);

    // Clear signature error if signature is added
    if (sign) {
      clearErrors('signature');
    }
  };

  const handleClearSignature = useCallback(() => {
    // Reset signature state (this will show the canvas again)
    setSignature(null);
    setValue('signature', null);

    // Clear any signature errors
    clearErrors('signature');

    // Reset drawing state
    isDrawingRef.current = false;
    lastPointRef.current = { x: 0, y: 0 };

    // Clear canvas if it exists (after re-render)
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    }, 100);
  }, [setValue, clearErrors]);

  // Simple mobile-first approach
  useEffect(() => {
    // Only run if there's no signature (canvas should be visible)
    if (signature) return undefined;

    // Wait for canvas to be rendered
    const timeoutId = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const container = canvas.parentElement;
      if (!container) return;

      // Set up canvas
      const containerRect = container.getBoundingClientRect();
      const containerWidth = Math.floor(containerRect.width);
      const containerHeight = isXsSmMd ? 150 : 200;

      canvas.width = containerWidth;
      canvas.height = containerHeight;
      canvas.style.width = `${containerWidth}px`;
      canvas.style.height = `${containerHeight}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Drawing variables
      let isDrawing = false;
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
        // Only preventDefault for touch events, not mouse
        if (e.type === 'touchstart') {
          e.preventDefault();
        }
        isDrawing = true;
        const { x, y } = getXY(e);
        lastX = x;
        lastY = y;

        ctx.strokeStyle = theme.palette.text.primary;
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
        if (!isDrawing) return;

        // Only preventDefault for touch events, not mouse
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
        if (!isDrawing) return;

        // Only preventDefault for touch events, not mouse
        if (e.type === 'touchend') {
          e.preventDefault();
        }

        isDrawing = false;
      };

      // Add event listeners
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);

      canvas.addEventListener('touchstart', startDrawing, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      canvas.addEventListener('touchend', stopDrawing, { passive: false });

      // Store references for cleanup
      canvas.dataset.listenersAttached = 'true';
    }, 100); // Wait 100ms for canvas to render

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
    };
  }, [isXsSmMd, theme.palette.text.primary, signature]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 4 } }}>
      <Box sx={{ px: { xs: 1, md: 0 } }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
          Signature
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Please add your signature to complete the FLRA assessment.
        </Typography>
      </Box>

      <Card sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
          {/* Signature Statement */}
          <Box
            sx={{
              p: { xs: 1.5, md: 2 },
              bgcolor: 'primary.lighter',
              borderRadius: 1,
              border: 1,
              borderColor: 'primary.main',
            }}
          >
            <Typography
              variant="body1"
              sx={{
                lineHeight: 1.6,
                fontWeight: 500,
                fontSize: { xs: '0.875rem', md: '1rem' },
                color: 'info.darker',
              }}
            >
              &ldquo;I hereby certify that this hazard assessment is mandatory as per company policy
              and Worksafe BC and all information on this form is accurate to the best of my
              knowledge.&rdquo;
            </Typography>
          </Box>

          {/* Signature Canvas */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Your Signature:
            </Typography>

            {!signature ? (
              <Box
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  overflow: 'hidden',
                  bgcolor: 'background.paper',
                }}
              >
                <canvas
                  ref={canvasRef}
                  style={{
                    width: '100%',
                    height: isXsSmMd ? '150px' : '200px',
                    display: 'block',
                    touchAction: 'none',
                    cursor: 'crosshair',
                    backgroundColor: 'white',
                  }}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  border: 2,
                  borderColor: 'success.main',
                  borderRadius: 1,
                  p: 2,
                  minHeight: isXsSmMd ? 150 : 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#FFFFFF',
                }}
              >
                <Box
                  component="img"
                  src={signature}
                  alt="Signature"
                  sx={{
                    maxWidth: '100%',
                    maxHeight: isXsSmMd ? 130 : 180,
                    objectFit: 'contain',
                  }}
                />
              </Box>
            )}

            {/* Name Display */}
            {fullName && (
              <Box sx={{ textAlign: 'center', pt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Signed by: <strong>{fullName}</strong>
                </Typography>
              </Box>
            )}

            {/* Action Buttons */}
            <Box
              sx={{
                display: 'flex',
                gap: { xs: 1, md: 2 },
                justifyContent: 'center',
                mt: 2,
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              {!signature ? (
                <>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleClearSignature}
                    startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                    size={isXsSmMd ? 'small' : 'medium'}
                    sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleAddSignature}
                    startIcon={<Iconify icon="solar:check-circle-bold" />}
                    size={isXsSmMd ? 'small' : 'medium'}
                    sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                  >
                    Add Signature
                  </Button>
                </>
              ) : (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleClearSignature}
                  startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                  size={isXsSmMd ? 'small' : 'medium'}
                  sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                >
                  Clear & Re-sign
                </Button>
              )}
            </Box>
          </Box>

          {/* Confirmation Message */}
          {signature && (
            <Box
              sx={{
                p: { xs: 1.5, md: 2 },
                bgcolor: 'success.lighter',
                borderRadius: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Iconify icon="solar:check-circle-bold" sx={{ color: '#000' }} />
                <Typography variant="body2" color="success.darker">
                  Signature added successfully. You can now preview and submit your FLRA assessment.
                </Typography>
              </Box>
            </Box>
          )}

          {/* Error Message */}
          {errors.signature && (
            <Typography
              variant="caption"
              color="error.main"
              sx={{
                display: 'block',
                mt: 1,
                textAlign: 'center',
                fontSize: '0.75rem',
              }}
            >
              {errors.signature.message}
            </Typography>
          )}
        </Box>
      </Card>
    </Box>
  );
}
