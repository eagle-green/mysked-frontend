import type { IVehiclePicture } from 'src/types/vehicle-picture';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

import { fetcher, endpoints } from 'src/lib/axios';

import { VehicleDiagram, VehiclePictureUpload, VehiclePictureDisplay } from './components';

import type { VehicleSection } from './components';

// ----------------------------------------------------------------------

type Props = {
  vehicleId: string;
};

export function VehiclePictureTab({ vehicleId }: Props) {
  const queryClient = useQueryClient();
  const [vehiclePictures, setVehiclePictures] = useState<IVehiclePicture[]>([]);
  const [selectedSection, setSelectedSection] = useState<VehicleSection | undefined>();

  // Fetch vehicle pictures
  const { data: vehiclePicturesData } = useQuery({
    queryKey: ['vehicle-pictures', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return { pictures: [] };
      try {
        const response = await fetcher(`${endpoints.management.vehiclePictures}/${vehicleId}`);
        return response;
      } catch (error) {
        console.error('❌ Error fetching vehicle pictures:', error);
        return { pictures: [] };
      }
    },
    enabled: !!vehicleId,
  });

  // Update vehicle pictures when data is fetched
  useEffect(() => {
    if (vehiclePicturesData?.pictures) {
      setVehiclePictures(vehiclePicturesData.pictures);
    }
  }, [vehiclePicturesData]);

  return (
    <Grid container>
      {/* Vehicle Picture Display */}
      <Grid size={{ xs: 16, md: 12 }}>
        <VehiclePictureDisplay
          vehicleId={vehicleId}
          pictures={vehiclePictures}
          onPicturesUpdate={(pictures) => {
            setVehiclePictures(pictures);
            queryClient.invalidateQueries({ queryKey: ['vehicle-pictures', vehicleId] });
          }}
          selectedSection={selectedSection}
          disabled={!vehicleId}
        />
      </Grid>

      {/* Vehicle Diagram Section */}
      <Grid size={{ xs: 16, md: 12 }}>
        <Box>
          <VehicleDiagram
            selectedSection={selectedSection}
            onSectionSelect={setSelectedSection}
            pictureCounts={vehiclePictures.reduce(
              (acc, picture) => {
                acc[picture.section] = (acc[picture.section] || 0) + 1;
                return acc;
              },
              {} as Record<VehicleSection, number>
            )}
            disabled={!vehicleId}
          />
        </Box>
      </Grid>

      {/* Vehicle Picture Upload */}
      <Grid size={{ xs: 16, md: 12 }}>
        <Box sx={{ mt: 3 }}>
          <VehiclePictureUpload
            vehicleId={vehicleId}
            selectedSection={selectedSection}
            onUploadSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['vehicle-pictures', vehicleId] });
            }}
            disabled={!vehicleId}
          />
        </Box>
      </Grid>
    </Grid>
  );
}
