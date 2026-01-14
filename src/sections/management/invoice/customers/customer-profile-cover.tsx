import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import ListItemText from '@mui/material/ListItemText';

// ----------------------------------------------------------------------

export function CustomerProfileCover({
  name,
  companyName,
  ...other
}: BoxProps & {
  name: string;
  companyName?: string | null;
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
        primary={name}
        secondary={companyName || ''}
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
