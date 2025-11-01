import type { GridCellParams } from '@mui/x-data-grid';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import ListItemText from '@mui/material/ListItemText';

import { RouterLink } from 'src/routes/components';

import { fDate, fTime } from 'src/utils/format-time';
import {  fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

type ParamsProps = {
  params: GridCellParams;
};

export function RenderCellPrice({ params }: ParamsProps) {
  if (params.row.price === undefined) return null;
  return fCurrency(params.row.price);
}

export function RenderCellStatus({ params }: ParamsProps) {
  const status = params.row.status;
  const colorMap: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
    active: 'success',
    inactive: 'default',
    pending: 'warning',
  };

  return (
    <Label variant="soft" color={colorMap[status] || 'default'}>
      {status}
    </Label>
  );
}

export function RenderCellCreatedAt({ params }: ParamsProps) {
  if (!params.row.createdAt) return null;
  return (
    <Box sx={{ gap: 0.5, display: 'flex', flexDirection: 'column' }}>
      <span>{fDate(params.row.createdAt)}</span>
      <Box component="span" sx={{ typography: 'caption', color: 'text.secondary' }}>
        {fTime(params.row.createdAt)}
      </Box>
    </Box>
  );
}

export function RenderCellStock({ params }: ParamsProps) {
  const { quantity } = params.row;
  const available = quantity || 0;

  return (
    <Box sx={{ typography: 'body2', fontWeight: 500 }}>
      {available}
    </Box>
  );
}

export function RenderCellInventory({ params, href }: ParamsProps & { href: string }) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = params.row.cover_url || params.row.coverUrl;
  const hasImage = imageUrl && imageUrl.trim() !== '' && !imageError;

  return (
    <Box
      sx={{
        py: 2,
        gap: 2,
        width: 1,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {hasImage ? (
        <Box
          component="img"
          src={imageUrl}
          alt={params.row.name}
          onError={() => setImageError(true)}
          sx={{
            width: 64,
            height: 64,
            flexShrink: 0,
            borderRadius: 1,
            objectFit: 'cover',
          }}
        />
      ) : (
        <Box
          sx={{
            width: 64,
            height: 64,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'action.hover',
            borderRadius: 1,
          }}
        >
          <Box
            component="svg"
            xmlns="http://www.w3.org/2000/svg"
            width={32}
            height={32}
            viewBox="0 0 24 24"
            fill="currentColor"
            sx={{ color: 'text.disabled' }}
          >
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </Box>
        </Box>
      )}

      <ListItemText
        primary={
          <Link component={RouterLink} href={href} color="inherit">
            {params.row.name}
          </Link>
        }
        secondary={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
            {params.row.typical_application && (
              <Box component="span" sx={{ typography: 'caption', color: 'text.disabled' }}>
                {params.row.typical_application}
              </Box>
            )}
            {params.row.sku && (
              <Box component="span" sx={{ typography: 'caption', color: 'text.disabled' }}>
                SKU: {params.row.sku}
              </Box>
            )}
          </Box>
        }
        slotProps={{
          primary: { noWrap: true },
        }}
      />
    </Box>
  );
}

