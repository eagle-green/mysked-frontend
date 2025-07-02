import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import ListItemText from '@mui/material/ListItemText';

// ----------------------------------------------------------------------

export function SiteProfileCover({
  name,
  region,
  display_address,
  email,
  contactNumber,
}: BoxProps & {
  name: string;
  region: string;
  display_address?: string;
  email: string;
  contactNumber: string;
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
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'center', md: 'flex-start' },
      }}
    >
      <ListItemText
        primary={name}
        secondary={display_address ? `${display_address} • ${region}` : region}
        slotProps={{
          primary: { sx: { typography: 'h4' } },
          secondary: {
            sx: { mt: 0.5, opacity: 0.48, color: 'inherit', typography: 'h5' },
          },
        }}
        sx={{ textAlign: { xs: 'center', md: 'unset' } }}
      />
    </Box>
  );
} 