import type { IVehicleItem } from 'src/types/vehicle';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';

import { VEHICLE_TYPE_OPTIONS, VEHICLE_STATUS_OPTIONS } from 'src/assets/data';

// ----------------------------------------------------------------------

type Props = {
  vehicle: IVehicleItem;
};

export function VehicleInfoReadonly({ vehicle }: Props) {
  const getStatusLabel = (status: string) => {
    const statusOption = VEHICLE_STATUS_OPTIONS.find((opt) => opt.value === status);
    return statusOption?.label || status;
  };

  const getTypeLabel = (type: string) => {
    const typeOption = VEHICLE_TYPE_OPTIONS.find((opt) => opt.value === type);
    return typeOption?.label || type;
  };

  return (
    <Card>
      <Box sx={{ p: 3, pb: 2 }}>
        <Box sx={{ typography: 'h4', mb: 3 }}>
          {vehicle.license_plate} - {vehicle.unit_number}
        </Box>
      </Box>

      <Divider />

      <Box sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Basic Information */}
          <Box>
            <Box sx={{ typography: 'subtitle2', mb: 2, color: 'text.primary' }}>
              Basic Information
            </Box>
            <Grid container spacing={3}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 0.5 }}>
                  Status
                </Box>
                <Box sx={{ typography: 'body2' }}>{getStatusLabel(vehicle.status)}</Box>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 0.5 }}>
                  Region
                </Box>
                <Box sx={{ typography: 'body2' }}>{vehicle.region || '-'}</Box>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 0.5 }}>
                  Vehicle Type
                </Box>
                <Box sx={{ typography: 'body2' }}>{getTypeLabel(vehicle.type)}</Box>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 0.5 }}>
                  License Plate
                </Box>
                <Box sx={{ typography: 'body2', fontWeight: 600 }}>{vehicle.license_plate}</Box>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 0.5 }}>
                  Unit Number
                </Box>
                <Box sx={{ typography: 'body2', fontWeight: 600 }}>{vehicle.unit_number}</Box>
              </Grid>
              {vehicle.year && (
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 0.5 }}>
                    Year
                  </Box>
                  <Box sx={{ typography: 'body2' }}>{vehicle.year}</Box>
                </Grid>
              )}
              {vehicle.location && (
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 0.5 }}>
                    Location
                  </Box>
                  <Box sx={{ typography: 'body2' }}>{vehicle.location}</Box>
                </Grid>
              )}
            </Grid>

            {vehicle.info && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 0.5 }}>
                  Vehicle Info
                </Box>
                <Box sx={{ typography: 'body2' }}>{vehicle.info}</Box>
              </Box>
            )}
          </Box>

          {/* Assigned Driver */}
          {vehicle.assigned_driver && (
            <Box>
              <Box sx={{ typography: 'subtitle2', mb: 2, color: 'text.primary' }}>
                Assigned Driver
              </Box>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 0.5 }}>
                    Driver Name
                  </Box>
                  <Box sx={{ typography: 'body2' }}>
                    {vehicle.assigned_driver.first_name} {vehicle.assigned_driver.last_name}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Equipment & Features */}
          <Box>
            <Box sx={{ typography: 'subtitle2', mb: 2, color: 'text.primary' }}>
              Equipment & Features
            </Box>
            <Grid container spacing={3}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 0.5 }}>
                  Spare Key
                </Box>
                <Box sx={{ typography: 'body2' }}>
                  {vehicle.is_spare_key ? 'Yes' : 'No'}
                </Box>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 0.5 }}>
                  Winter Tire
                </Box>
                <Box sx={{ typography: 'body2' }}>
                  {vehicle.is_winter_tire ? 'Yes' : 'No'}
                </Box>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 0.5 }}>
                  Tow Hitch
                </Box>
                <Box sx={{ typography: 'body2' }}>
                  {vehicle.is_tow_hitch ? 'Yes' : 'No'}
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Notes */}
          {vehicle.note && (
            <Box>
              <Box sx={{ typography: 'subtitle2', mb: 2, color: 'text.primary' }}>
                Notes
              </Box>
              <Box sx={{ typography: 'body2', whiteSpace: 'pre-wrap' }}>{vehicle.note}</Box>
            </Box>
          )}
        </Stack>
      </Box>
    </Card>
  );
}

