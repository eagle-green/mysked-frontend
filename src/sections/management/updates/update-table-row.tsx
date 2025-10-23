import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';
import { getCategoryColor } from 'src/utils/category-colors';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

type Props = {
  row: any;
  selected: boolean;
  onSelectRow: (checked: boolean) => void;
  onView: (update: any) => void;
  onDelete: (updateId: string) => void;
};

export function UpdateTableRow({ row, selected, onSelectRow, onView, onDelete }: Props) {

  return (
    <TableRow hover>

        <TableCell sx={{ maxWidth: { xs: 200, sm: 300, md: 400 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Link
                component={RouterLink}
                href={paths.management.updates.details(row.id)}
                color="inherit"
                sx={{ textDecoration: 'none' }}
              >
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 0.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {row.title}
                </Typography>
              </Link>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {row.description}
              </Typography>
            </Box>
          </Box>
        </TableCell>

        <TableCell sx={{ maxWidth: { xs: 150, sm: 200 } }}>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {row.category?.split(', ').map((category: string, index: number) => (
              <Label 
                key={index}
                variant="soft" 
                color={getCategoryColor(category.trim())}
                sx={{ fontSize: '0.75rem' }}
              >
                {category.trim()}
              </Label>
            ))}
          </Stack>
        </TableCell>

        <TableCell sx={{ maxWidth: { xs: 100, sm: 120 } }}>
          <Typography variant="body2" color="text.secondary">
            {fDate(row.createdAt)}
          </Typography>
        </TableCell>
      </TableRow>
  );
}
