import type { CardProps } from '@mui/material/Card';
import type { TableHeadCellProps } from 'src/components/table';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import CardHeader from '@mui/material/CardHeader';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';
import { getRoleDisplayInfo } from 'src/utils/format-role';

import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { TableHeadCustom } from 'src/components/table';

import { getConductScoreColor } from './conduct-score-utils';

// ----------------------------------------------------------------------

export type TopWorkerRow = {
  id: string;
  name: string;
  photoUrl: string | null;
  position: string;
  score: number;
  rank: number;
  hireDate: string | null;
  completedJobCount: number;
};

type Props = CardProps & {
  title?: string;
  subheader?: string;
  headCells: TableHeadCellProps[];
  tableData: TopWorkerRow[];
  /** Rank column label prefix, e.g. "TOP" -> "TOP 1", "BOTTOM" -> "BOTTOM 1". Default "TOP". */
  rankPrefix?: string;
  /** When true, rank 1 uses error/warning colors (for "workers needing attention" list). */
  invertRankColors?: boolean;
  /** When true, render only inner content (no Card wrapper) for use inside a parent Card with tabs. */
  noCard?: boolean;
};

export function AttendanceConductDashboardTopWorkers({
  title = 'Top workers',
  subheader,
  tableData,
  headCells,
  rankPrefix = 'TOP',
  invertRankColors = false,
  noCard = false,
  sx,
  ...other
}: Props) {
  const content = (
    <>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 2 }} />

      <Scrollbar sx={{ minHeight: 320 }}>
        <Table sx={{ minWidth: 520 }}>
          <TableHeadCustom headCells={headCells} />

          <TableBody>
            {tableData.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      alt={row.name}
                      src={row.photoUrl ?? undefined}
                      sx={{ width: 40, height: 40, flexShrink: 0 }}
                    >
                      {row.name?.charAt(0)?.toUpperCase() ?? '?'}
                    </Avatar>
                    <Link
                      component={RouterLink}
                      href={`${paths.management.user.edit(row.id)}?tab=attendance-conduct`}
                      color="inherit"
                      underline="hover"
                      sx={{ cursor: 'pointer' }}
                    >
                      {row.name}
                    </Link>
                  </Box>
                </TableCell>

                <TableCell>
                  {(() => {
                    const roleInfo = getRoleDisplayInfo(row.position);
                    return roleInfo.label ? (
                      <Label variant="soft" color={roleInfo.color}>
                        {roleInfo.label}
                      </Label>
                    ) : (
                      '—'
                    );
                  })()}
                </TableCell>

                <TableCell>
                  {row.hireDate ? fDate(row.hireDate, 'MMM DD, YYYY') : ''}
                </TableCell>

                <TableCell align="center">
                  {row.completedJobCount}
                </TableCell>

                <TableCell align="center">
                  <Label variant="soft" color={getConductScoreColor(row.score)}>
                    {row.score}
                  </Label>
                </TableCell>

                <TableCell align="right">
                  <Label
                    variant="soft"
                    color={
                      invertRankColors
                        ? (row.rank === 1 && 'error') ||
                          (row.rank === 2 && 'warning') ||
                          (row.rank === 3 && 'info') ||
                          (row.rank === 4 && 'secondary') ||
                          (row.rank === 5 && 'success') ||
                          'default'
                        : (row.rank === 1 && 'success') ||
                          (row.rank === 2 && 'secondary') ||
                          (row.rank === 3 && 'info') ||
                          (row.rank === 4 && 'warning') ||
                          (row.rank === 5 && 'error') ||
                          'default'
                    }
                  >
                    {rankPrefix} {row.rank}
                  </Label>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Scrollbar>
    </>
  );

  if (noCard) return <Box sx={sx}>{content}</Box>;
  return (
    <Card sx={sx} {...other}>
      {content}
    </Card>
  );
}
