import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import ListItemText from '@mui/material/ListItemText';

// ----------------------------------------------------------------------

export function CompanyProfileCover({
  name,
  logoURL,
  region,
  email,
  contactNumber,
}: BoxProps & {
  name: string;
  logoURL: string | null;
  region: string;
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
      }}
    >
      <Avatar
        alt={name}
        {...(logoURL && { src: logoURL })}
        sx={[
          (theme) => ({
            mx: 'auto',
            width: { xs: 64, md: 128 },
            height: { xs: 64, md: 128 },
            border: `solid 2px ${theme.vars.palette.common.white}`,
            fontSize: { xs: 32, md: 64 },
          }),
        ]}
      >
        {name?.charAt(0).toUpperCase()}
      </Avatar>

      <ListItemText
        primary={name}
        secondary={region}
        slotProps={{
          primary: { sx: { typography: 'h4' } },
          secondary: {
            sx: { mt: 0.5, opacity: 0.48, color: 'inherit', typography: 'h5' },
          },
        }}
        sx={{ mt: 3, ml: { md: 3 }, textAlign: { xs: 'center', md: 'unset' } }}
      />
    </Box>
  );
} 