import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import ListItemText from '@mui/material/ListItemText';

// ----------------------------------------------------------------------

export function SiteProfileCover({
  name,
  companyName,
  address,
  ...other
}: BoxProps & {
  name: string;
  companyName?: string;
  address?: string;
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
        alignItems: { xs: 'center', md: 'flex-end' },
      }}
      {...other}
    >
      <ListItemText
        primary={name}
        secondary={companyName ? `${companyName}${address ? ` • ${address}` : ''}` : address}
        slotProps={{
          primary: { sx: { typography: 'h4' } },
          secondary: {
            sx: { mt: 0.5, opacity: 0.48, color: 'inherit', typography: 'body1' },
          },
        }}
        sx={{ mt: 3, textAlign: { xs: 'center', md: 'unset' } }}
      />
    </Box>
  );
} 