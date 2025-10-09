import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import ListItemText from '@mui/material/ListItemText';

import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';

// ----------------------------------------------------------------------

export function ProfileCover({
  firstName,
  lastName,
  role,
  photoURL,
}: BoxProps & {
  firstName: string;
  lastName: string;
  role: string;
  photoURL: string | null;
  email: string;
  phone_number: string;
}) {
  // Handle special case for "lct/tcp" role
  let positionLabel = role;
  if (role === 'lct/tcp') {
    positionLabel = 'LCT/TCP';
  } else {
    const foundOption = JOB_POSITION_OPTIONS.find((option) => option.value === role);
    positionLabel = foundOption?.label || role.charAt(0).toUpperCase() + role.slice(1);
  }
  
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
        alt={firstName}
        {...(photoURL && { src: photoURL })}
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
        {firstName?.charAt(0).toUpperCase()}
      </Avatar>

      <ListItemText
        primary={firstName + ' ' + lastName}
        secondary={positionLabel}
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
