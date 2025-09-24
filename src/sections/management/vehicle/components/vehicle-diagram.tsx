import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type VehicleSection = 'front' | 'left_side' | 'right_side' | 'back' | 'inside';

interface VehicleDiagramProps {
  selectedSection?: VehicleSection;
  onSectionSelect?: (section: VehicleSection) => void;
  pictureCounts?: Record<VehicleSection, number>;
  disabled?: boolean;
}

export function VehicleDiagram({ 
  selectedSection, 
  onSectionSelect, 
  pictureCounts = {
    inside: 0,
    front: 0,
    left_side: 0,
    right_side: 0,
    back: 0,
  },
  disabled = false 
}: VehicleDiagramProps) {
  const theme = useTheme();
  const [hoveredSection, setHoveredSection] = useState<VehicleSection | null>(null);

  const sections: Array<{
    id: VehicleSection;
    label: string;
    icon: string;
    description: string;
  }> = [
    {
      id: 'front',
      label: 'Front View',
      icon: 'solar:camera-add-bold',
      description: 'Headlights, grille, bumper'
    },
    {
      id: 'left_side',
      label: 'Left Side',
      icon: 'solar:camera-add-bold',
      description: 'Driver side doors, mirrors'
    },
    {
      id: 'right_side',
      label: 'Right Side',
      icon: 'solar:camera-add-bold',
      description: 'Passenger side doors, mirrors'
    },
    {
      id: 'back',
      label: 'Rear View',
      icon: 'solar:camera-add-bold',
      description: 'Taillights, bumper, license plate'
    },
    {
      id: 'inside',
      label: 'Interior',
      icon: 'solar:camera-add-bold',
      description: 'Dashboard, seats, controls'
    }
  ];

  const handleSectionClick = (section: VehicleSection) => {
    if (!disabled && onSectionSelect) {
      onSectionSelect(section);
    }
  };

  const getSectionColor = (section: VehicleSection) => {
    if (disabled) return theme.palette.grey[300];
    if (selectedSection === section) return theme.palette.primary.main;
    if (hoveredSection === section) return alpha(theme.palette.primary.main, 0.7);
    return theme.palette.grey[400];
  };

  const getSectionBgColor = (section: VehicleSection) => {
    if (disabled) return theme.palette.grey[100];
    if (selectedSection === section) return alpha(theme.palette.primary.main, 0.1);
    if (hoveredSection === section) return alpha(theme.palette.primary.main, 0.05);
    return 'transparent';
  };

  const getVehicleDiagram = () => {
    // Reference images for each section
    const referenceImages: Record<VehicleSection, string> = {
      front: '/assets/images/vehicle/front.png',
      left_side: '/assets/images/vehicle/left-side.png',
      right_side: '/assets/images/vehicle/right-side.png',
      back: '/assets/images/vehicle/back.png',
      inside: '/assets/images/vehicle/inside.png',
    };

    // Only show reference image if a section is selected
    const imageToShow = selectedSection ? referenceImages[selectedSection] : null;

    return (
      <Box sx={{ position: 'relative', width: '100%', height: 400, mb: 4, mx: 'auto', maxWidth: 600 }}>
        {/* Dynamic Reference Image or Placeholder */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            bgcolor: 'grey.50',
          }}
        >
          {imageToShow ? (
            <Box
              component="img"
              src={imageToShow}
              alt={`${selectedSection} reference`}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transition: 'opacity 0.3s ease-in-out',
              }}
            />
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.secondary',
                textAlign: 'center',
                p: 3,
              }}
            >
              <Iconify 
                icon="solar:camera-add-bold" 
                sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} 
              />
              <Typography variant="h6" sx={{ mb: 1, opacity: 0.7 }}>
                Select a section below
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.6 }}>
                to see example photos
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3, textAlign: 'center' }}>
        Vehicle Picture Reference Guide
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
        Select a section below to see example photos of what to capture
      </Typography>
      
      {/* Visual Diagram */}
      {getVehicleDiagram()}
      
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
          gap: 2,
          maxWidth: '600px',
          mx: 'auto',
        }}
      >
        {sections.map((section) => {
          const isSelected = selectedSection === section.id;
          const isHovered = hoveredSection === section.id;
          const pictureCount = pictureCounts[section.id] || 0;

          return (
            <Button
              key={section.id}
              variant={isSelected ? 'contained' : 'outlined'}
              size="large"
              sx={{
                minWidth: 'auto',
                p: 2,
                borderRadius: 2,
                borderColor: getSectionColor(section.id),
                backgroundColor: getSectionBgColor(section.id),
                color: isSelected ? 'white' : getSectionColor(section.id),
                '&:hover': {
                  backgroundColor: getSectionBgColor(section.id),
                  borderColor: getSectionColor(section.id),
                },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                transition: 'all 0.2s ease-in-out',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                position: 'relative',
                minHeight: '120px',
              }}
              onClick={() => handleSectionClick(section.id)}
              onMouseEnter={() => setHoveredSection(section.id)}
              onMouseLeave={() => setHoveredSection(null)}
              disabled={disabled}
            >
              <Iconify
                icon={section.icon as any}
                width={32}
                height={32}
              />
              <Typography
                variant="body2"
                sx={{
                  fontWeight: isSelected ? 600 : 500,
                  textAlign: 'center',
                  mb: 0.5,
                }}
              >
                {section.label}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  textAlign: 'center',
                  opacity: 0.7,
                  fontSize: '0.7rem',
                  lineHeight: 1.2,
                }}
              >
                {section.description}
              </Typography>
              {pictureCount > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: theme.palette.error.main,
                    color: 'white',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {pictureCount}
                </Box>
              )}
            </Button>
          );
        })}
      </Box>
    </Card>
  );
}
