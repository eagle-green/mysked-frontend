import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  row: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    photo_url?: string;
    invoice_access?: boolean;
  };
  onEdit: () => void;
};

export function UserAccessTableRow({ row, onEdit }: Props) {
  return (
    <TableRow hover>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={row.photo_url ?? undefined}
            alt={`${row.first_name} ${row.last_name}`}
            sx={{ width: 40, height: 40 }}
          >
            {row.first_name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {row.first_name} {row.last_name}
            </Typography>
          </Box>
        </Box>
      </TableCell>

      <TableCell>
        <Typography variant="body2">{row.email}</Typography>
      </TableCell>

      <TableCell>
        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
          {row.role}
        </Typography>
      </TableCell>

      <TableCell>
        {row.invoice_access ? (
          <Label variant="soft" color="success" sx={{ fontSize: '0.75rem' }}>
            Enabled
          </Label>
        ) : (
          <Label variant="soft" color="default" sx={{ fontSize: '0.75rem' }}>
            Disabled
          </Label>
        )}
      </TableCell>

      <TableCell align="right">
        <IconButton 
          onClick={onEdit} 
          color="primary"
          title="Edit user access"
        >
          <Iconify icon="solar:pen-bold" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}

