import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  loading: boolean;
  canReset: boolean;
  searchQuery: string;
  onOpenFilters: () => void;
  onSearchChange: (query: string) => void;
};

export function TimelineToolbar({ loading, canReset, searchQuery, onOpenFilters, onSearchChange }: Props) {
  return (
    <Box
      sx={{
        p: 2.5,
        pr: 2,
        display: 'flex',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      <TextField
        size="small"
        placeholder="Search customers, sites, workers..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ minWidth: 300 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" />
            </InputAdornment>
          ),
        }}
      />

      {/* Filter button hidden as requested */}
      {/* <IconButton onClick={onOpenFilters}>
        <Badge color="error" variant="dot" invisible={!canReset}>
          <Iconify icon="ic:round-filter-list" />
        </Badge>
      </IconButton> */}

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
