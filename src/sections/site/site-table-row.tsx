import type { ISiteItem } from 'src/types/site';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { RouterLink } from 'src/routes/components';

import { formatPhoneNumberSimple } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

import { SiteQuickEditForm } from './site-quick-edit-form';
// ----------------------------------------------------------------------

type Props = {
  row: ISiteItem;
  selected: boolean;
  editHref: string;
  onSelectRow: () => void;
  onDeleteRow: () => void;
};

export function SiteTableRow({
  row,
  selected,
  editHref,
  onSelectRow,
  onDeleteRow,
}: Props) {
  const menuActions = usePopover();
  const confirmDialog = useBoolean();
  const quickEditForm = useBoolean();

  const renderQuickEditForm = () => (
    <SiteQuickEditForm
      currentSite={row}
      open={quickEditForm.value}
      onClose={quickEditForm.onFalse}
      onUpdateSuccess={quickEditForm.onFalse}
    />
  );

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <li>
          <MenuItem component={RouterLink} href={editHref} onClick={() => menuActions.onClose()}>
            <Iconify icon="solar:pen-bold" />
            Edit
          </MenuItem>
        </li>

        <MenuItem
          onClick={() => {
            confirmDialog.onTrue();
            menuActions.onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          Delete
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title="Delete"
      content="Are you sure want to delete?"
      action={
        <Button variant="contained" color="error" onClick={onDeleteRow}>
          Delete
        </Button>
      }
    />
  );

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
        <TableCell padding="checkbox">
          <Checkbox
            checked={selected}
            onClick={onSelectRow}
            slotProps={{
              input: {
                id: `${row.id}-checkbox`,
                'aria-label': `${row.id} checkbox`,
              },
            }}
          />
        </TableCell>

        <TableCell sx={{ whiteSpace: 'normal' }}>
          <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
            <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
              <Link
                component={RouterLink}
                href={editHref}
                color="inherit"
                sx={{ cursor: 'pointer' }}
              >
                {row.name}
              </Link>
            </Stack>
          </Box>
        </TableCell>
        <TableCell>{row.region}</TableCell>

        {/* <TableCell sx={{ whiteSpace: 'nowrap' }}>
          {[
            row.unit_number,
            row.street_number,
            row.street_name,
            row.city,
            row.province,
            row.country,
            row.postal_code,
          ]
            .filter(Boolean) // removes null/undefined/empty string
            .join(', ')}
        </TableCell> */}

        <TableCell>
          {row.city && row.province ? (
            <Link
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                [
                  row.unit_number,
                  row.street_number,
                  row.street_name,
                  row.city,
                  row.province,
                  row.postal_code,
                  row.country,
                ]
                  .filter(Boolean)
                  .join(', ')
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
            >
              {[
                row.unit_number,
                row.street_number,
                row.street_name,
                row.city,
                row.province,
                row.postal_code,
              ]
                .filter(Boolean)
                .join(', ')}
            </Link>
          ) : (
            'N/A'
          )}
        </TableCell>

        {/* <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.contact_number}</TableCell> */}

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Link href={`tel:${row.contact_number}`} rel="noopener noreferrer" underline="hover">
            {formatPhoneNumberSimple(row.contact_number)}
          </Link>
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Link href={`mailto:${row.email}`} rel="noopener noreferrer" underline="hover">
            {row.email}
          </Link>
        </TableCell>

        {/* <TableCell>
          <Label
            variant="soft"
            color={
              (row.status === 'active' && 'success') ||
              (row.status === 'pending' && 'warning') ||
              (row.status === 'banned' && 'error') ||
              'default'
            }
          >
            {row.status}
          </Label>
        </TableCell> */}

        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Quick Edit" placement="top" arrow>
              <IconButton
                color={quickEditForm.value ? 'inherit' : 'default'}
                onClick={quickEditForm.onTrue}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>

            <IconButton
              color={menuActions.open ? 'inherit' : 'default'}
              onClick={menuActions.onOpen}
            >
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>

      {renderQuickEditForm()}
      {renderMenuActions()}
      {renderConfirmDialog()}
    </>
  );
}
