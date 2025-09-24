
import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { useRouter } from 'src/routes/hooks';

import { fDate } from 'src/utils/format-time';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

type Props = {
  row: any;
  selected: boolean;
  onSelectRow: (checked: boolean) => void;
};

export function AdminFlraTableRow({ row, selected, onSelectRow }: Props) {
  const router = useRouter();

  const handleViewFlra = useCallback(() => {
    if (row.status === 'submitted') {
      // Navigate to PDF preview for submitted FLRAs
      router.push(`/works/flra/pdf/${row.id}`);
    }
    // Only allow clicking on submitted FLRAs
  }, [router, row.id, row.status]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'info';
      case 'submitted':
        return 'success';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <TableRow hover selected={selected}>
      <TableCell>
        {row.status === 'submitted' ? (
          <Link
            component="button"
            variant="subtitle2"
            onClick={handleViewFlra}
            sx={{ 
              textDecoration: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              '&:hover': {
                textDecoration: 'underline',
              }
            }}
            title="View PDF Preview"
          >
            #{row.job?.job_number}
          </Link>
        ) : (
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.disabled' }}>
            #{row.job?.job_number}
          </Typography>
        )}
      </TableCell>

      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            src={row.client?.logo_url}
            alt={row.client?.name}
            sx={{ width: 32, height: 32 }}
          >
            {row.client?.name?.charAt(0)?.toUpperCase() || 'C'}
          </Avatar>
          <Typography variant="body2" noWrap>
            {row.client?.name}
          </Typography>
        </Box>
      </TableCell>

      <TableCell>
        <Box>
          <Typography variant="body2" noWrap>
            {row.site?.name}
          </Typography>
          {row.site?.display_address && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {row.site.display_address}
            </Typography>
          )}
        </Box>
      </TableCell>

      <TableCell>
        <Typography variant="body2" noWrap>
          {row.job?.start_time ? fDate(row.job.start_time) : '-'}
        </Typography>
      </TableCell>

      <TableCell>
        <Label variant="soft" color={getStatusColor(row.status)}>
          {row.status?.charAt(0).toUpperCase() + row.status?.slice(1)}
        </Label>
      </TableCell>

      <TableCell>
        {row.submitted_by && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              alt={`${row.submitted_by.first_name} ${row.submitted_by.last_name}`}
              sx={{ width: 32, height: 32 }}
            >
              {row.submitted_by.first_name?.charAt(0)?.toUpperCase() || 
               row.submitted_by.last_name?.charAt(0)?.toUpperCase() || 
               row.submitted_by.email?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            <Typography variant="body2" noWrap>
              {`${row.submitted_by.first_name || ''} ${row.submitted_by.last_name || ''}`.trim() || row.submitted_by.email}
            </Typography>
          </Box>
        )}
      </TableCell>
    </TableRow>
  );
}
