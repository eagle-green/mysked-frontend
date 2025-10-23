import type { BoxProps } from '@mui/material/Box';
import type { IUpdateItem } from 'src/types/updates';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { fDate } from 'src/utils/format-time';

// ----------------------------------------------------------------------

type Props = BoxProps & {
  update: IUpdateItem;
};

export function UpdateDetailsHero({ update, sx, ...other }: Props) {
  return (
    <Box
      sx={[
        (theme) => ({
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          height: 480,
          overflow: 'hidden',
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Container sx={{ height: 1, position: 'relative' }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{
            zIndex: 9,
            maxWidth: 480,
            position: 'absolute',
            pt: { xs: 2, md: 8 },
            color: 'common.white',
          }}
        >
          {update.title}
        </Typography>

        <Box
          sx={{
            left: 0,
            width: 1,
            bottom: 0,
            position: 'absolute',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: { xs: 2, md: 3 },
              pb: { xs: 3, md: 8 },
            }}
          >
            <Avatar
              alt={update.author.name}
              src={update.author.avatarUrl}
              sx={{ width: 64, height: 64, mr: 2 }}
            />

            <ListItemText
              sx={{ color: 'common.white' }}
              primary={update.author.name}
              secondary={fDate(update.createdAt)}
              slotProps={{
                primary: { sx: { typography: 'subtitle1' } },
                secondary: { sx: { mt: 0.5, opacity: 0.64, color: 'inherit' } },
              }}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}