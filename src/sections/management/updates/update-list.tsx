import type { IUpdateItem } from 'src/types/updates';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';

// ----------------------------------------------------------------------

type Props = {
  updates: IUpdateItem[];
  loading?: boolean;
};

export function UpdateList({ updates, loading }: Props) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'feature':
        return 'primary'; // Blue - New features
      case 'bug fix':
        return 'error'; // Red - Bug fixes
      case 'improvement':
        return 'info'; // Light blue - Improvements
      case 'announcement':
        return 'success'; // Green - Announcements
      case 'maintenance':
        return 'warning'; // Orange - Maintenance
      default:
        return 'default'; // Gray - Uncategorized
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const renderLoading = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
      <CircularProgress />
    </Box>
  );

  const renderTable = () => {
    const paginatedUpdates = updates.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    if (updates.length === 0) {
      return (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No updates found
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      );
    }

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Author</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUpdates.map((update) => (
              <TableRow key={update.id} hover>
                <TableCell>
                  <Link
                    component={RouterLink}
                    href={paths.management.updates.details(update.id)}
                    color="inherit"
                    sx={{ textDecoration: 'none' }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {update.title}
                    </Typography>
                  </Link>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                    {update.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {update.category ? (
                      update.category.split(', ').map((cat, index) => (
                        <Chip
                          key={index}
                          label={cat}
                          color={getCategoryColor(cat)}
                          size="small"
                        />
                      ))
                    ) : (
                      <Chip label="Uncategorized" color="default" size="small" />
                    )}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={update.author.avatarUrl} sx={{ width: 32, height: 32 }}>
                      {update.author.name.charAt(0)}
                    </Avatar>
                    <Typography variant="body2">{update.author.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{fDate(update.createdAt)}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={updates.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    );
  };

  if (loading) {
    return renderLoading();
  }

  return renderTable();
}
