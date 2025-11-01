import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import ListItemText from '@mui/material/ListItemText';

// ----------------------------------------------------------------------

export function VehicleProfileCover({
  licensePlate,
  info,
  driver,
  ...other
}: BoxProps & {
  licensePlate: string;
  info?: string;
  driver?: {
    first_name: string;
    last_name: string;
    photo_url?: string;
  };
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        left: { md: 24 },
        bottom: { md: 24 },
        zIndex: { md: 10 },
        pt: { xs: 6, md: 0 },
        position: { md: 'absolute' },
        flexDirection: 'column',
        alignItems: { xs: 'center', md: 'flex-start' },
      }}
      {...other}
    >
      <ListItemText
        primary={licensePlate}
        secondary={info || ''}
        slotProps={{
          primary: { sx: { typography: 'h4' } },
          secondary: {
            sx: { mt: 0.5, opacity: 0.48, color: 'inherit', typography: 'body1' },
          },
        }}
        sx={{ mt: 3, textAlign: { xs: 'center', md: 'unset' } }}
      />
      
      {driver && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
          <Box sx={{ typography: 'body2', opacity: 0.64 }}>Assigned Driver:</Box>
          <Avatar 
            alt={driver.first_name}
            {...(driver.photo_url && { src: driver.photo_url })}
            sx={{ width: 32, height: 32 }}
          >
            {driver.first_name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Box sx={{ typography: 'body2' }}>
            {`${driver.first_name} ${driver.last_name}`}
          </Box>
        </Box>
      )}
    </Box>
  );
}

