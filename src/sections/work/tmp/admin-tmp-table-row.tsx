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

export function AdminTmpTableRow({ row, selected, onSelectRow }: Props) {
  const router = useRouter();

  const handleViewTmp = useCallback(() => {
    // Navigate to TMP detail page where users can upload PDF and add notes
    router.push(`/works/jobs/tmp/${row.id}`);
  }, [router, row.id]);

  return (
    <TableRow hover selected={selected}>
      <TableCell>
        <Link
          component="button"
          variant="subtitle2"
          onClick={handleViewTmp}
          sx={{
            textDecoration: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
          title="View TMP Details"
        >
          #{row.job?.job_number}
        </Link>
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar src={row.client?.logo_url} alt={row.client?.name} sx={{ width: 32, height: 32 }}>
            {row.client?.name?.charAt(0)?.toUpperCase() || 'C'}
          </Avatar>
          <Typography variant="body2" noWrap>
            {row.client?.name}
          </Typography>
        </Box>
      </TableCell>

      <TableCell>
        <Typography variant="body2" noWrap>
          {row.job?.start_time ? fDate(row.job.start_time) : '-'}
        </Typography>
      </TableCell>

      <TableCell>
        <Label variant="soft" color={row.all_workers_confirmed ? 'success' : 'warning'}>
          {row.all_workers_confirmed ? 'Confirmed' : 'Pending'}
        </Label>
      </TableCell>
    </TableRow>
  );
}
