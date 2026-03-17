import type { Theme, SxProps, CSSObject } from '@mui/material/styles';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import TableSortLabel from '@mui/material/TableSortLabel';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const visuallyHidden: CSSObject = {
  border: 0,
  padding: 0,
  width: '1px',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  position: 'absolute',
  whiteSpace: 'nowrap',
  clip: 'rect(0 0 0 0)',
};

// ----------------------------------------------------------------------

export type TableHeadCellProps = {
  id: string;
  label?: string;
  /** Optional tooltip (e.g. info icon) to clarify column meaning */
  tooltip?: string;
  width?: CSSObject['width'];
  align?: 'left' | 'center' | 'right';
  /** If false, column header is not sortable (default true when onSort is provided) */
  sortable?: boolean;
  sx?: SxProps<Theme>;
};

export type TableHeadCustomProps = {
  orderBy?: string;
  rowCount?: number;
  sx?: SxProps<Theme>;
  numSelected?: number;
  order?: 'asc' | 'desc';
  headCells: TableHeadCellProps[];
  onSort?: (id: string) => void;
  onSelectAllRows?: (checked: boolean) => void;
  /** When provided, non-sortable column headers are clickable (e.g. for column filter). */
  onColumnClick?: (columnId: string, event: React.MouseEvent<HTMLElement>) => void;
};

export function TableHeadCustom({
  sx,
  order,
  onSort,
  orderBy,
  headCells,
  rowCount = 0,
  numSelected = 0,
  onSelectAllRows,
  onColumnClick,
}: TableHeadCustomProps) {
  return (
    <TableHead sx={sx}>
      <TableRow>
        {onSelectAllRows && (
          <TableCell padding="checkbox">
            <Checkbox
              indeterminate={!!numSelected && numSelected < rowCount}
              checked={!!rowCount && numSelected === rowCount}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                onSelectAllRows(event.target.checked)
              }
              slotProps={{
                input: {
                  id: `all-row-checkbox`,
                  'aria-label': `All row Checkbox`,
                },
              }}
            />
          </TableCell>
        )}

        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.align || 'left'}
            sortDirection={orderBy === headCell.id ? order : false}
            sx={[
              {
                width: headCell.width,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              },
              ...(Array.isArray(headCell.sx) ? headCell.sx : [headCell.sx]),
            ]}
          >
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              {onSort && headCell.sortable !== false ? (
                <TableSortLabel
                  hideSortIcon
                  active={orderBy === headCell.id}
                  direction={orderBy === headCell.id ? order : 'asc'}
                  onClick={() => onSort(headCell.id)}
                >
                  {headCell.label}
                  {orderBy === headCell.id ? (
                    <Box component="span" sx={visuallyHidden}>
                      {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                    </Box>
                  ) : null}
                </TableSortLabel>
              ) : onColumnClick ? (
                <Box
                  component="span"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => onColumnClick(headCell.id, e)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onColumnClick(headCell.id, e as unknown as React.MouseEvent<HTMLElement>);
                    }
                  }}
                  sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                >
                  {headCell.label}
                </Box>
              ) : (
                headCell.label
              )}
              {headCell.tooltip ? (
                <Tooltip title={headCell.tooltip} placement="top" arrow>
                  <IconButton
                    size="small"
                    sx={{ p: 0.25 }}
                    aria-label="Column info"
                  >
                    <Iconify icon="eva:info-outline" width={16} />
                  </IconButton>
                </Tooltip>
              ) : null}
            </Box>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}
