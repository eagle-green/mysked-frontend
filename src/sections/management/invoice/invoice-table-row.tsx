import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components/router-link';

import { Label } from 'src/components/label/label';
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
            Edit Invoice
          </MenuItem>
        </li>
      </MenuList>
    </CustomPopover>
  );

  function RenderInvoiceTable() {
    return (
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
        <TableCell>
          <Link
            component={RouterLink}
            href={recordingLink}
            color="inherit"
            sx={{ cursor: 'pointer' }}
          >
            {row?.invoiceNumber || 'INV-0001'}
          </Link>
        </TableCell>

        <TableCell>{row?.client || 'EG-TEST'}</TableCell>

        <TableCell>
          <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
            <Avatar
              src={row?.customer?.logo ?? undefined}
              alt={row?.customer?.name}
              sx={{ width: 32, height: 32 }}
            >
              {row?.customer?.name?.charAt(0)?.toUpperCase()}
            </Avatar>

            <Typography>{row?.customer || 'CUSTOMER-1'}</Typography>
          </Box>
        </TableCell>

        <TableCell>{row?.poNumber || 'PO-0001'}</TableCell>

        <TableCell>{row?.totalPrice || '$ 970,00'}</TableCell>

        <TableCell>{row?.invoiceDate || '31/10/2025'}</TableCell>

        <TableCell>{row?.createdBy || 'Jerwin Fortillano'}</TableCell>

        <TableCell>{row?.reviewedBy || 'Kiwoon Jung'}</TableCell>

        <TableCell>{row?.sentBy || 'Kessia Pedalino'}</TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={
              (row.status === 'pending' && 'success') ||
              (row.status === 'send' && 'warning') ||
              'default'
            }
          >
            {row.status}
          </Label>
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* <Tooltip title="Quick Edit" placement="top" arrow>
              <IconButton color="default" onClick={() => {}}>
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip> */}

            <IconButton
              color={menuActions.open ? 'inherit' : 'default'}
              onClick={menuActions.onOpen}
            >
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Box>
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
