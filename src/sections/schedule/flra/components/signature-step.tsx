import type { FieldLevelRiskAssessmentType } from 'src/pages/template/field-level-risk-assessment';

import { useFormContext } from 'react-hook-form';
import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

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
  const { setValue, watch } = useFormContext<FieldLevelRiskAssessmentType>();
  
  const [signature, setSignature] = useState<string | null>(null);
  const sigCanvas = useRef<SignatureCanvas | null>(null);
  const fullName = watch('full_name');

  const handleAddSignature = () => {
    const sign = sigCanvas.current?.isEmpty()
      ? null
      : (sigCanvas.current?.getCanvas().toDataURL('image/png') as string);
    setSignature(sign);
    setValue('signature', sign);
  };

  const handleClearSignature = () => {
    sigCanvas.current?.clear();
    setSignature(null);
    setValue('signature', null);
  };

  // Fix canvas positioning issues
  useEffect(() => {
    const updateCanvasSize = () => {
      if (sigCanvas.current) {
        const canvas = sigCanvas.current.getCanvas();
        const container = canvas.parentElement;
        
        if (container) {
          // Get the actual container dimensions
          const containerRect = container.getBoundingClientRect();
          const containerWidth = Math.floor(containerRect.width);
          const containerHeight = isXsSmMd ? 150 : 200;
          
          // Set canvas internal size (actual pixels)
          canvas.width = containerWidth;
          canvas.height = containerHeight;
          
          // Set canvas display size (CSS size)
          canvas.style.width = `${containerWidth}px`;
          canvas.style.height = `${containerHeight}px`;
          canvas.style.display = 'block';
          canvas.style.position = 'relative';
          canvas.style.zIndex = '3';
          canvas.style.maxWidth = '100%';
          canvas.style.margin = '0 auto';
          
          // Get the context and set up proper scaling
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Clear any existing transformations
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            
            // Set line properties for better drawing
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 2;
          }
          
          // Clear the canvas after resizing
          sigCanvas.current.clear();
        }
      }
    };

    // Add a small delay to ensure the container is fully rendered
    const timeoutId = setTimeout(() => {
      updateCanvasSize();
    }, 100);

    // Set up resize observer
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });

    if (sigCanvas.current) {
      const canvas = sigCanvas.current.getCanvas();
      const container = canvas.parentElement;
      if (container) {
        resizeObserver.observe(container);
      }
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [isXsSmMd]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 4 } }}>
      <Box sx={{ px: { xs: 1, md: 0 } }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>Signature</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Please add your signature to complete the FLRA assessment.
        </Typography>
      </Box>

      <Card sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
          {/* Signature Statement */}
          <Box sx={{ 
            p: { xs: 1.5, md: 2 }, 
            bgcolor: 'primary.lighter', 
            borderRadius: 1, 
            border: 1, 
            borderColor: 'primary.main' 
          }}>
            <Typography variant="body1" sx={{ 
              lineHeight: 1.6, 
              fontWeight: 500,
              fontSize: { xs: '0.875rem', md: '1rem' }
            }}>
              &ldquo;I hereby certify that this hazard assessment is mandatory as per company policy and Worksafe BC
              and all information on this form is accurate to the best of my knowledge.&rdquo;
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
                  border: 2,
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: { xs: 1, md: 3 },
                  bgcolor: 'background.paper',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: isXsSmMd ? 180 : 230,
                }}
              >
                {/* Signature area border/guide */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: { xs: 8, md: 12 },
                    left: { xs: 8, md: 12 },
                    right: { xs: 8, md: 12 },
                    bottom: { xs: 8, md: 12 },
                    border: 1,
                    borderColor: 'grey.300',
                    borderStyle: 'dashed',
                    borderRadius: 1,
                    pointerEvents: 'none',
                    zIndex: 1,
                  }}
                />
                
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor={theme.palette.text.primary}
                  minWidth={2}
                  maxWidth={3}
                  backgroundColor="transparent"
                  canvasProps={{
                    className: 'signature-canvas',
                    style: { 
                      display: 'block',
                      cursor: 'crosshair',
                      touchAction: 'none',
                      border: 'none',
                      position: 'relative',
                      zIndex: 3,
                    }
                  }}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  border: 2,
                  borderColor: 'success.main',
                  borderRadius: 1,
                  p: { xs: 1, md: 3 },
                  minHeight: isXsSmMd ? 180 : 230,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'success.lighter',
                  position: 'relative',
                }}
              >
                {/* Success border indicator */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: { xs: 8, md: 12 },
                    left: { xs: 8, md: 12 },
                    right: { xs: 8, md: 12 },
                    bottom: { xs: 8, md: 12 },
                    border: 1,
                    borderColor: 'success.main',
                    borderStyle: 'solid',
                    borderRadius: 1,
                    pointerEvents: 'none',
                  }}
                />
                
                <Box
                  component="img"
                  src={signature}
                  alt="Signature"
                  sx={{
                    maxWidth: '100%',
                    maxHeight: isXsSmMd ? 140 : 200,
                    objectFit: 'contain',
                    position: 'relative',
                    zIndex: 2,
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
            <Box sx={{ 
              display: 'flex', 
              gap: { xs: 1, md: 2 }, 
              justifyContent: 'center', 
              mt: 2,
              flexDirection: { xs: 'column', sm: 'row' }
            }}>
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
            <Box sx={{ 
              p: { xs: 1.5, md: 2 }, 
              bgcolor: 'success.lighter', 
              borderRadius: 1 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Iconify icon="solar:check-circle-bold" color="success.main" />
                <Typography variant="body2" color="success.darker">
                  Signature added successfully. You can now preview and submit your FLRA assessment.
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );
}
