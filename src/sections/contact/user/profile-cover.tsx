import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import ListItemText from '@mui/material/ListItemText';

import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';

// ----------------------------------------------------------------------

export function ProfileCover({
  sx,
  first_name,
  last_name,
  role,
  photo_url,
  email,
  phone_number,
  ...other
}: BoxProps & {
  first_name: string;
  last_name: string;
  role: string;
  photo_url: string | null;
  email: string;
  phone_number: string;
}) {
  const positionLabel = JOB_POSITION_OPTIONS.find((option) => option.value === role)?.label || role;
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
        alt={first_name}
        {...(photo_url && { src: photo_url })}
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
        {first_name?.charAt(0).toUpperCase()}
      </Avatar>

      <ListItemText
        primary={first_name + ' ' + last_name}
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
