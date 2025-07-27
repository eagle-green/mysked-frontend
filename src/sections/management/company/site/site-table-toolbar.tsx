import type { ISiteTableFilters } from 'src/types/site';
import type { UseSetStateReturn } from 'minimal-shared/hooks';

import { useCallback } from 'react';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  filters: UseSetStateReturn<ISiteTableFilters>;
  onResetPage: VoidFunction;
  options: {
    regions: string[];
  };
};

export function SiteTableToolbar({ filters, onResetPage, options }: Props) {
  const menuActions = usePopover();

  const { state: currentFilters, setState: updateFilters } = filters;

  const handleFilterQuery = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onResetPage();
      updateFilters({ query: event.target.value });
    },
    [onResetPage, updateFilters]
  );

  // const handleFilterRegion = useCallback(
  //   (newValue: string[]) => {
  //     onResetPage();
  //     updateFilters({ region: newValue });
  //   },
  //   [onResetPage, updateFilters]
  // );

  return (
    <>
      <Stack
        spacing={2}
        alignItems="center"
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ p: 2.5 }}
      >
        <Box sx={{ width: 1 }}>
          <TextField
            fullWidth
            value={currentFilters.query}
            onChange={handleFilterQuery}
            placeholder="Search site..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Filters">
            <IconButton onClick={menuActions.onOpen}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Tooltip>
        </Box>
      </Stack>

      <CustomPopover
        open={menuActions.open}
        anchorEl={menuActions.anchorEl}
        onClose={menuActions.onClose}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              // Handle region filter
              menuActions.onClose();
            }}
          >
            <Iconify icon="solar:list-bold" />
            Filter by Region
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
} 