import { useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify/iconify';

//---------------------------------------------------------------
export function FlraDiagramForm() {
  const { setValue } = useFormContext();
  
  const [diagramImage, setDiagramImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setDiagramImage(result);
        setValue('flraDiagram', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setDiagramImage(result);
        setValue('flraDiagram', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveDiagram = () => {
    setDiagramImage(null);
    setValue('flraDiagram', null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Typography variant="h4">FLRA Diagram</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Add a diagram or photo to illustrate the work site setup, traffic control measures, or safety considerations.
        </Typography>
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
          variant="outlined"
          startIcon={<Iconify icon="solar:camera-add-bold" />}
          onClick={() => cameraInputRef.current?.click()}
          sx={{ minWidth: 200 }}
        >
          Take Photo
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<Iconify icon="solar:import-bold" />}
          onClick={() => fileInputRef.current?.click()}
          sx={{ minWidth: 200 }}
        >
          Upload Image
        </Button>

        {diagramImage && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            onClick={handleRemoveDiagram}
            sx={{ minWidth: 200 }}
          >
            Remove
          </Button>
        )}
      </Box>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
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

      {/* Image preview */}
      {diagramImage && (
        <Box
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="subtitle2">Diagram Preview:</Typography>
          <Box
            component="img"
            src={diagramImage}
            alt="FLRA Diagram"
            sx={{
              maxWidth: '100%',
              maxHeight: 400,
              objectFit: 'contain',
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
            }}
          />
        </Box>
      )}

      {!diagramImage && (
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
          <Iconify icon="solar:gallery-add-bold" width={48} height={48} sx={{ mb: 2, opacity: 0.5 }} />
          <Typography variant="body2">
            No diagram added yet. Take a photo or upload an image to include in your FLRA.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
