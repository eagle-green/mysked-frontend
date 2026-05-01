import { useFormContext } from 'react-hook-form';
import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify/iconify';

//--------------------------------------------------------
type Props = {
  open: boolean;
  openIndex: number | null;
  onClose: () => void;
};
export function AdminDefectModal({ open, openIndex, onClose }: Props) {
  const [inspectionImages, setInspectionImages] = useState<string[]>([]);
  const { setValue, watch, getValues } = useFormContext();

  const inspection = watch(`inspections.${openIndex}`);
  const inspection_image = watch(`inspections.${openIndex}.detect_issues.photo`);

  // Load existing diagram data when component mounts or flraDiagram changes
  useEffect(() => {
    if (inspection_image && typeof inspection_image === 'string') {
      // Try to parse as JSON array first (new format with multiple URLs)
      if (inspection_image.startsWith('[')) {
        try {
          const parsedImages = JSON.parse(inspection_image);
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
                  setInspectionImages(base64Images);
                  setValue(
                    `inspections.${openIndex}.detect_issues.photo`,
                    JSON.stringify(base64Images)
                  );
                })
                .catch((error) => {
                  console.error('Error converting Cloudinary URLs to base64:', error);
                });
            } else {
              // Array of base64 images - use directly
              setInspectionImages(parsedImages);
            }
          }
        } catch (error) {
          console.error('Error parsing existing diagram data:', error);
        }
      } else if (inspection_image.includes('cloudinary.com')) {
        // Single Cloudinary URL (legacy format)
        fetch(inspection_image)
          .then((response) => response.blob())
          .then((blob) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result as string;
              setInspectionImages([base64]);
              setValue('flraDiagram', JSON.stringify([base64]));
            };
            reader.readAsDataURL(blob);
          })
          .catch((error) => {
            console.error('Error converting Cloudinary URL to base64:', error);
          });
      }
    } else if (Array.isArray(inspection_image)) {
      // Handle case where flraDiagram is already an array
      setInspectionImages(inspection_image);
    }
  }, [inspection_image, setValue]);

  if (!open || openIndex === null) return null;

  const inspections = getValues('inspections');

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 3 }}>
        <Typography variant="subtitle1">{inspection?.label}</Typography>

        {/* DETECT TYPE */}
        <Stack spacing={1}>
          <Typography variant="body2" color="text.disabled">
            {inspections[openIndex]?.description}
          </Typography>
        </Stack>

        {/* DETECT TYPE */}
        <Stack spacing={1}>
          <Typography variant="body2" color="text.disabled">
            Detect Type
          </Typography>
          <Typography variant="body2" textTransform="capitalize">
            {inspections[openIndex]?.detect_issues?.detect_type}
          </Typography>
        </Stack>

        {/* Notes */}
        <Stack spacing={1}>
          <Typography variant="body2" color="text.disabled">
            Notes
          </Typography>
          <Typography variant="body2" textTransform="capitalize">
            {inspections[openIndex]?.detect_issues?.notes}
          </Typography>
        </Stack>

        {/* <Field.Select
          name={`inspections.${openIndex}.detect_issues.detect_type`}
          label="Detect Type"
          disabled
        >
          {DETECT_TYPES.map((role, index) => (
            <MenuItem key={`${role.value}-${index}`} value={role.value}>
              {role.label}
            </MenuItem>
          ))}
        </Field.Select> */}

        {/* NOTES
        <Field.Text
          fullWidth
          multiline
          rows={4}
          name={`inspections.${openIndex}.detect_issues.notes`}
          label="Notes"
          disabled
        /> */}

        {/* PHOTO */}
        {inspectionImages.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 1 }}>
            <Box>
              <Grid container spacing={2}>
                {inspectionImages.map((image, index) => (
                  <Grid
                    size={{
                      xs: 12,
                      sm: 6,
                      md: inspectionImages.length < 3 ? 12 / inspectionImages.length : 3,
                    }}
                    key={index}
                  >
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
                        alt={`Photo ${index + 1}`}
                        sx={{
                          width: '100%',
                          height: 200,
                          objectFit: 'contain',
                          borderRadius: 1,
                          bgcolor: 'background.neutral',
                        }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          variant="soft"
          onClick={() => {
            onClose();
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
