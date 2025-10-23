import type { CardProps } from '@mui/material/Card';
import type { IUpdateItem } from 'src/types/updates';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type UpdateItemProps = CardProps & {
  update: IUpdateItem;
  detailsHref: string;
};

export function UpdateItem({ update, detailsHref, sx, ...other }: UpdateItemProps) {

  return (
    <Card sx={sx} {...other}>
      <Box sx={{ position: 'relative' }}>
        <Box
          sx={{
            height: 200,
            bgcolor: 'grey.100',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1,
          }}
        >
          <Iconify icon="solar:list-bold" width={48} sx={{ color: 'text.secondary' }} />
        </Box>
      </Box>

      <CardContent sx={{ p: 3 }}>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {fDate(update.createdAt)}
        </Typography>

        <Link component={RouterLink} href={detailsHref} color="inherit">
          <Typography
            variant="h6"
            sx={{
              mt: 1,
              mb: 2,
              overflow: 'hidden',
              WebkitLineClamp: 2,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
            }}
          >
            {update.title}
          </Typography>
        </Link>

        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            overflow: 'hidden',
            WebkitLineClamp: 3,
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
          }}
        >
          {update.description}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <Chip
            label={update.category}
            size="small"
            variant="outlined"
            sx={{ mr: 1 }}
          />
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Iconify icon="eva:arrow-ios-forward-fill" width={16} />
        </Box>
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------------

type UpdateItemLatestProps = CardProps & {
  update: IUpdateItem;
  index: number;
  detailsHref: string;
};

export function UpdateItemLatest({ update, index, detailsHref, sx, ...other }: UpdateItemLatestProps) {

  return (
    <Card sx={sx} {...other}>
      <Box sx={{ position: 'relative' }}>
        <Box
          sx={{
            height: index === 0 ? 200 : 150,
            bgcolor: 'grey.100',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1,
          }}
        >
          <Iconify icon="solar:list-bold" width={48} sx={{ color: 'text.secondary' }} />
        </Box>
      </Box>

      <CardContent sx={{ p: 3 }}>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {fDate(update.createdAt)}
        </Typography>

        <Link component={RouterLink} href={detailsHref} color="inherit">
          <Typography
            variant={index === 0 ? 'h5' : 'h6'}
            sx={{
              mt: 1,
              mb: 2,
              overflow: 'hidden',
              WebkitLineClamp: index === 0 ? 2 : 2,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
            }}
          >
            {update.title}
          </Typography>
        </Link>

        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            overflow: 'hidden',
            WebkitLineClamp: index === 0 ? 4 : 3,
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
          }}
        >
          {update.description}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <Chip
            label={update.category}
            size="small"
            variant="outlined"
            sx={{ mr: 1 }}
          />
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Iconify icon="eva:arrow-ios-forward-fill" width={16} />
        </Box>
      </CardContent>
    </Card>
  );
}
