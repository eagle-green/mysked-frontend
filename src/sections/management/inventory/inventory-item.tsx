import type { IInventoryItem } from 'src/types/inventory';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import { RouterLink } from 'src/routes/components';

import { fNumber , fCurrency } from 'src/utils/format-number';

import { CONFIG } from 'src/global-config';

import { Label } from 'src/components/label';
import { Image } from 'src/components/image';

// ----------------------------------------------------------------------

type Props = {
  item: IInventoryItem;
  detailsHref: string;
};

export function InventoryItem({ item, detailsHref }: Props) {
  const { name, coverUrl, quantity, available = 0, status, category, price, unit = 'pcs' } = item;

  const isLowStock = available < quantity * 0.2;
  const isOutOfStock = available === 0;

  const renderStatusLabel = () => {
    if (isOutOfStock) {
      return (
        <Label variant="filled" color="error">
          Out of Stock
        </Label>
      );
    }
    if (isLowStock) {
      return (
        <Label variant="filled" color="warning">
          Low Stock
        </Label>
      );
    }
    if (status) {
      const colorMap: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
        active: 'success',
        inactive: 'default',
        pending: 'warning',
      };
      return (
        <Label variant="filled" color={colorMap[status] || 'default'}>
          {status}
        </Label>
      );
    }
    return null;
  };

  const renderImage = () => (
    <Box sx={{ position: 'relative', p: 1 }}>
      <Tooltip title={isOutOfStock ? 'Out of stock' : `${available} ${unit} available`} placement="bottom-end">
        {coverUrl ? (
          <Image
            alt={name}
            src={coverUrl}
            ratio="1/1"
            sx={{
              borderRadius: 1.5,
              ...(isOutOfStock && { opacity: 0.48, filter: 'grayscale(1)' }),
            }}
          />
        ) : (
          <Box
            sx={{
              pt: '100%',
              borderRadius: 1.5,
              bgcolor: 'action.hover',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ...(isOutOfStock && { opacity: 0.48 }),
            }}
          >
            <Box
              component="img"
              src={`${CONFIG.assetsDir}/assets/icons/files/ic-img.svg`}
              alt="Image placeholder"
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 64,
                height: 64,
              }}
            />
          </Box>
        )}
      </Tooltip>
      {renderStatusLabel() && (
        <Box
          sx={{
            gap: 1,
            top: 16,
            zIndex: 9,
            right: 16,
            display: 'flex',
            position: 'absolute',
            alignItems: 'center',
            flexDirection: 'column',
          }}
        >
          {renderStatusLabel()}
        </Box>
      )}
    </Box>
  );

  const renderContent = () => (
    <Stack spacing={2} sx={{ p: 3, pt: 2 }}>
      <Link component={RouterLink} href={detailsHref} color="inherit" variant="subtitle2" noWrap>
        {name}
      </Link>

      {category && (
        <Box sx={{ typography: 'caption', color: 'text.secondary' }}>
          {category}
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ typography: 'caption', color: 'text.secondary' }}>
            Available: {fNumber(available)} {unit}
          </Box>
          <Box sx={{ typography: 'caption', color: 'text.secondary' }}>
            Total: {fNumber(quantity)} {unit}
          </Box>
        </Box>

        {price !== undefined && (
          <Box sx={{ typography: 'subtitle1', fontWeight: 'fontWeightSemiBold' }}>
            {fCurrency(price)}
          </Box>
        )}
      </Box>
    </Stack>
  );

  return (
    <Card
      sx={{
        '&:hover': {
          boxShadow: (theme) => theme.customShadows.z16,
        },
        transition: (theme) => theme.transitions.create(['box-shadow'], {
          duration: theme.transitions.duration.shortest,
        }),
      }}
    >
      {renderImage()}
      {renderContent()}
    </Card>
  );
}

