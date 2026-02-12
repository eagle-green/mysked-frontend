import type { TableRowProps } from '@mui/material/TableRow';

import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

// ----------------------------------------------------------------------

export type TableEmptyRowsProps = TableRowProps & {
  height?: number;
  emptyRows: number;
};

export function TableEmptyRows({ emptyRows, height, sx, ...other }: TableEmptyRowsProps) {
  if (!emptyRows) {
    return null;
  }

  const rowHeight = height !== undefined && height !== null ? height * emptyRows : undefined;
  const isCollapsed = rowHeight === 0;

  return (
    <TableRow
      sx={[
        () => ({
          ...(rowHeight !== undefined && { height: rowHeight }),
          ...(isCollapsed && {
            minHeight: 0,
            '& td': { py: 0, lineHeight: 0, border: 0 },
          }),
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <TableCell colSpan={9} />
    </TableRow>
  );
}
