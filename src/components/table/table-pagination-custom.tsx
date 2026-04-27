import type { Theme, SxProps } from '@mui/material/styles';
import type { TablePaginationProps } from '@mui/material/TablePagination';

import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import TablePagination from '@mui/material/TablePagination';
import FormControlLabel from '@mui/material/FormControlLabel';

// ----------------------------------------------------------------------

export type TablePaginationCustomProps = TablePaginationProps & {
  dense?: boolean;
  sx?: SxProps<Theme>;
  onChangeDense?: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export function TablePaginationCustom({
  sx,
  dense,
  onChangeDense,
  rowsPerPageOptions = [10, 25, 50, 100],
  ...other
}: TablePaginationCustomProps) {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={[
        { position: 'relative', overflow: 'visible', width: 1, minWidth: 0 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        {...other}
        sx={[
          {
            borderTopColor: 'transparent',
            width: 1,
            minWidth: 0,
            overflow: 'visible',
            /* Mobile: keep rows-per-page + range on the first row; put < > on the next row only. */
            ...(isSmDown && {
              '& .MuiTablePagination-toolbar': {
                flexWrap: 'wrap',
                rowGap: 1,
              },
              '& .MuiTablePagination-actions': {
                marginLeft: '0 !important',
                flexBasis: '100%',
                width: '100%',
                display: 'flex',
                justifyContent: 'flex-end',
                flexShrink: 0,
                gap: 0.5,
              },
            }),
          },
        ]}
      />

      {onChangeDense && (
        <FormControlLabel
          label="Dense"
          control={
            <Switch
              checked={dense}
              onChange={onChangeDense}
              slotProps={{ input: { id: 'dense-switch' } }}
            />
          }
          sx={{
            pl: 2,
            py: 1.5,
            top: 0,
            position: { sm: 'absolute' },
          }}
        />
      )}
    </Box>
  );
}
