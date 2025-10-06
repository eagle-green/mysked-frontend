import { usePopover } from 'minimal-shared/hooks';

import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components/router-link';

import { Iconify } from 'src/components/iconify/iconify';
import { CustomPopover } from 'src/components/custom-popover/custom-popover';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

type Props = {
  row: any;
  selected: boolean;
  recordingLink: string;
};
export function InvoiceTableRow({ row, selected, recordingLink }: Props) {
  const menuActions = usePopover();
  const { user } = useAuthContext();

  if (!row) return null;

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <li>
          <MenuItem
            component={RouterLink}
            href={recordingLink}
            onClick={() => menuActions.onClose()}
          >
            <Iconify icon="solar:pen-bold" />
            View Invoice
          </MenuItem>
        </li>
      </MenuList>
    </CustomPopover>
  );

  function RenderInvoiceTable() {
    return (
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
        <TableCell>
          {row.timesheet_manager_id === user?.id ? (
            <Link
              component={RouterLink}
              href={recordingLink}
              color="inherit"
              sx={{ cursor: 'pointer' }}
            >
              1
            </Link>
          ) : (
            <Typography variant="body2" noWrap sx={{ color: 'text.disabled' }}>
              Job Number
            </Typography>
          )}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {renderMenuActions()}
      {RenderInvoiceTable()}
    </>
  );
}
