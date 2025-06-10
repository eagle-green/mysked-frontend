import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  loading: boolean;
  canReset: boolean;
  onOpenFilters: () => void;
};

export function TimelineToolbar({ loading, canReset, onOpenFilters }: Props) {
  return (
    <Box
      sx={{
        p: 2.5,
        pr: 2,
        display: 'flex',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      <IconButton onClick={onOpenFilters}>
        <Badge color="error" variant="dot" invisible={!canReset}>
          <Iconify icon="ic:round-filter-list" />
        </Badge>
      </IconButton>

      {loading && (
        <LinearProgress
          color="inherit"
          sx={{
            left: 0,
            width: 1,
            height: 2,
            bottom: 0,
            borderRadius: 0,
            position: 'absolute',
          }}
        />
      )}
    </Box>
  );
}
