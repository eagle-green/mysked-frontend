import type { PaperProps } from '@mui/material/Paper';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';

// ----------------------------------------------------------------------

type InventoryItemSkeletonProps = PaperProps & {
  itemCount?: number;
};

export function InventoryItemSkeleton({ sx, itemCount = 12, ...other }: InventoryItemSkeletonProps) {
  return Array.from({ length: itemCount }, (_, index) => (
    <Paper
      key={index}
      variant="outlined"
      sx={[{ borderRadius: 2 }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...other}
    >
      <Box sx={{ p: 1 }}>
        <Skeleton sx={{ pt: '100%' }} />
      </Box>

      <Stack spacing={2} sx={{ p: 3, pt: 2 }}>
        <Skeleton sx={{ width: 0.75, height: 20 }} />
        <Skeleton sx={{ width: 0.5, height: 16 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Skeleton sx={{ width: 100, height: 14 }} />
            <Skeleton sx={{ width: 80, height: 14 }} />
          </Box>
          <Skeleton sx={{ width: 60, height: 20 }} />
        </Box>
      </Stack>
    </Paper>
  ));
}



