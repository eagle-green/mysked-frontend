import type { IJob, IJobWorker, IJobEquipment } from 'src/types/job';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import MenuList from '@mui/material/MenuList';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDate, fTime } from 'src/utils/format-time';

import { provinceList } from 'src/assets/data/assets';
import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: IJob;
  selected: boolean;
  detailsHref: string;
  onSelectRow: () => void;
  onDeleteRow: () => void;
};

// Helper to build full address from site fields
function getFullAddress(site: any) {
  if (site.full_address) return site.full_address;
  // Build the address string from fields
  let addr = [
    site.unit_number,
    site.street_number,
    site.street_name,
    site.city,
    site.province,
    site.postal_code,
    site.country,
  ]
    .filter(Boolean)
    .join(', ');
  // Replace province name with code
  provinceList.forEach(({ value, code }) => {
    addr = addr.replace(value, code);
  });
  return addr;
}

export function JobTableRow(props: Props) {
  const { row, selected, onSelectRow, onDeleteRow, detailsHref } = props;
  const confirmDialog = useBoolean();
  const menuActions = usePopover();
  const collapseRow = useBoolean();
  if (!row || !row.id) return null;

  function renderPrimaryRow() {
    if (!row || !row.id) return null;
    return (
      <TableRow hover selected={selected}>
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

        <TableCell>
          <Link component={RouterLink} href={detailsHref} color="inherit">
            {row.job_number}
          </Link>
        </TableCell>

        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Link component={RouterLink} href={paths.site.edit(row.site.id)} color="inherit">
              {row.site.name}
            </Link>
            <Box component="span" sx={{ color: 'text.disabled' }}>
              {getFullAddress(row.site)}
            </Box>
          </Stack>
        </TableCell>

        <TableCell>{row.site.region}</TableCell>

        <TableCell>
          <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
            <Avatar
              src={row.client.logo_url ?? undefined}
              alt={row.client.name}
              sx={{ width: 28, height: 28 }}
            >
              {row.client.name?.charAt(0).toUpperCase()}
            </Avatar>

            <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
              <Link
                component={RouterLink}
                href={paths.contact.client.edit(row.client.id)}
                color="inherit"
                sx={{ cursor: 'pointer' }}
              >
                {row.client.name}
              </Link>
            </Stack>
          </Box>
        </TableCell>

        <TableCell>
          <ListItemText
            primary={fDate(row.start_time)}
            secondary={fTime(row.start_time)}
            slotProps={{
              primary: {
                noWrap: true,
                sx: { typography: 'body2' },
              },
              secondary: {
                sx: { mt: 0.5, typography: 'caption' },
              },
            }}
          />
        </TableCell>

        <TableCell>
          <ListItemText
            primary={fDate(row.end_time)}
            secondary={fTime(row.end_time)}
            slotProps={{
              primary: {
                noWrap: true,
                sx: { typography: 'body2' },
              },
              secondary: {
                sx: { mt: 0.5, typography: 'caption' },
              },
            }}
          />
        </TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={
              (row.status === 'draft' && 'info') ||
              (row.status === 'ready' && 'primary') ||
              (row.status === 'in_progress' && 'warning') ||
              (row.status === 'completed' && 'success') ||
              (row.status === 'cancelled' && 'error') ||
              'default'
            }
          >
            {row.status}
          </Label>
        </TableCell>

        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <IconButton
            color={collapseRow.value ? 'inherit' : 'default'}
            onClick={collapseRow.onToggle}
            sx={{ ...(collapseRow.value && { bgcolor: 'action.hover' }) }}
          >
            <Iconify icon="eva:arrow-ios-downward-fill" />
          </IconButton>

          <IconButton color={menuActions.open ? 'inherit' : 'default'} onClick={menuActions.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>
    );
  }

  function renderSecondaryRow() {
    if (!row || !row.id) return null;
    return (
      <TableRow>
        <TableCell sx={{ p: 0, border: 'none' }} colSpan={9}>
          <Collapse
            in={collapseRow.value}
            timeout="auto"
            unmountOnExit
            sx={{ bgcolor: 'background.neutral' }}
          >
            <Paper
              sx={{
                m: 1.5,
                mb: 0.1,
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              }}
            >
              <Box
                sx={(theme) => ({
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  alignItems: 'center',
                  p: theme.spacing(1.5, 2, 1.5, 1.5),
                  borderBottom: `solid 2px ${theme.vars.palette.background.neutral}`,
                })}
              >
                <ListItemText primary="Position" />
                <ListItemText primary="Employee" />
                <ListItemText primary="Vehicle Type" />
                <ListItemText primary="Vehicle Number" />
                <ListItemText primary="Start Time" />
                <ListItemText primary="End Time" />
              </Box>
            </Paper>
            <Paper sx={{ m: 1.5, mt: 0, mb: 1, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
              {/* Workers + Vehicle */}
              {row.workers.map((item: IJobWorker) => {
                const vehicle = row.vehicle.find((v) => v.operator === item.employee);
                const positionLabel =
                  JOB_POSITION_OPTIONS.find((option) => option.value === item.position)?.label ||
                  item.position;
                return (
                  <Box
                    key={item.id}
                    sx={(theme) => ({
                      display: 'grid',
                      gridTemplateColumns: 'repeat(6, 1fr)',
                      alignItems: 'center',
                      p: theme.spacing(1.5, 2, 1.5, 1.5),
                      borderBottom: `solid 2px ${theme.vars.palette.background.neutral}`,
                    })}
                  >
                    <ListItemText
                      primary={positionLabel}
                      slotProps={{
                        primary: { sx: { typography: 'body2' } },
                      }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                      <Avatar
                        src={item.photo_url}
                        sx={{ width: 38, height: 38, mr: 1, flexShrink: 0 }}
                      >
                        {!item.photo_url && (item.first_name || item.last_name)
                          ? `${item.first_name?.[0] || ''}${item.last_name?.[0] || ''}`
                          : null}
                      </Avatar>
                      <Link
                        component={RouterLink}
                        href={detailsHref}
                        color="inherit"
                        underline="always"
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block',
                        }}
                      >
                        {`${item.first_name || ''} ${item.last_name || ''}`.trim()}
                      </Link>
                    </Box>
                    <ListItemText
                      primary={vehicle?.type || ''}
                      slotProps={{
                        primary: { sx: { typography: 'body2' } },
                      }}
                    />
                    <ListItemText
                      primary={vehicle?.number || ''}
                      slotProps={{
                        primary: { sx: { typography: 'body2' } },
                      }}
                    />
                    <ListItemText
                      primary={fTime(item.start_time)}
                      slotProps={{
                        primary: { sx: { typography: 'body2' } },
                      }}
                    />
                    <ListItemText
                      primary={fTime(item.end_time)}
                      slotProps={{
                        primary: { sx: { typography: 'body2' } },
                      }}
                    />
                  </Box>
                );
              })}
            </Paper>
            <Paper
              sx={{
                m: 1.5,
                mt: 0,
                mb: 0.1,
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              }}
            >
              <Box
                sx={(theme) => ({
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  alignItems: 'center',
                  p: theme.spacing(1.5, 2, 1.5, 1.5),
                  borderBottom: `solid 2px ${theme.vars.palette.background.neutral}`,
                })}
              >
                <ListItemText primary="Equipment Type" />
                <ListItemText primary="Equipment Name" />
                <ListItemText primary="Quantity" />
              </Box>
            </Paper>
            <Paper sx={{ m: 1.5, mt: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
              {/* Workers + Vehicle */}
              {row.equipment.map((item: IJobEquipment) => (
                // const positionLabel =
                //   JOB_POSITION_OPTIONS.find((option) => option.value === item.position)?.label ||
                //   item.position;
                <Box
                  key={item.id}
                  sx={(theme) => ({
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    alignItems: 'center',
                    p: theme.spacing(1.5, 2, 1.5, 1.5),
                    borderBottom: `solid 2px ${theme.vars.palette.background.neutral}`,
                  })}
                >
                  <ListItemText
                    primary={item.type}
                    slotProps={{
                      primary: { sx: { typography: 'body2' } },
                    }}
                  />

                  <ListItemText
                    primary={item.name}
                    slotProps={{
                      primary: { sx: { typography: 'body2' } },
                    }}
                  />

                  <ListItemText
                    primary={item.quantity}
                    slotProps={{
                      primary: { sx: { typography: 'body2' } },
                    }}
                  />
                </Box>
              ))}
            </Paper>
          </Collapse>
        </TableCell>
      </TableRow>
    );
  }

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
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

        <li>
          <MenuItem component={RouterLink} href={detailsHref} onClick={() => menuActions.onClose()}>
            <Iconify icon="solar:eye-bold" />
            View
          </MenuItem>
        </li>
      </MenuList>
    </CustomPopover>
  );

  const renderConfrimDialog = () => (
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
      {renderPrimaryRow()}
      {renderSecondaryRow()}
      {renderMenuActions()}
      {renderConfrimDialog()}
    </>
  );
}
