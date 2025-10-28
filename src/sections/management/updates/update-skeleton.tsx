import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

// ----------------------------------------------------------------------

type UpdateItemSkeletonProps = BoxProps & {
  itemCount?: number;
  variant?: 'vertical' | 'horizontal';
};

export function UpdateItemSkeleton({
  sx,
  itemCount = 16,
  variant = 'vertical',
  ...other
}: UpdateItemSkeletonProps) {
  if (variant === 'horizontal') {
    return Array.from({ length: itemCount }, (_, index) => (
      <Box
        key={index}
        sx={[
          (theme) => ({
            display: 'flex',
            borderRadius: 2,
            bgcolor: 'background.paper',
            border: `solid 1px ${theme.vars.palette.divider}`,
          }),
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...other}
      >
        <Skeleton variant="rectangular" width={240} height={180} />
        <Box sx={{ p: 3, flexGrow: 1 }}>
          <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="80%" height={32} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="100%" height={20} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="90%" height={20} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="70%" height={20} sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Skeleton variant="rectangular" width={60} height={24} />
            <Skeleton variant="rectangular" width={80} height={24} />
          </Box>
        </Box>
      </Box>
    ));
  }

  return Array.from({ length: itemCount }, (_, index) => (
    <Box
      key={index}
      sx={[
        (theme) => ({
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: `solid 1px ${theme.vars.palette.divider}`,
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Skeleton variant="rectangular" width="100%" height={200} />
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="100%" height={20} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width="90%" height={20} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width="70%" height={20} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Skeleton variant="rectangular" width={60} height={24} />
          <Skeleton variant="rectangular" width={80} height={24} />
        </Box>
      </Box>
    </Box>
  ));
}
