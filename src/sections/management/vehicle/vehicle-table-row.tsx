import type { IVehicleItem } from 'src/types/vehicle';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { RouterLink } from 'src/routes/components';

import { fetcher , endpoints } from 'src/lib/axios';
import { VEHICLE_TYPE_OPTIONS } from 'src/assets/data';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

import { VehicleQuickEditForm } from './vehicle-quick-edit-form';

// ----------------------------------------------------------------------

type InventoryIssueItem = {
  id: string;
  name: string;
  type: string;
  available: number;
  requiredQty: number;
  statusLabel: string;
  statusColor: 'error' | 'warning' | 'secondary' | 'success' | 'default';
  coverUrl?: string;
  typical_application?: string;
  sku?: string;
};

const TABLE_COLUMN_COUNT = 11;

function InventoryItemImage({
  coverUrl,
  name,
  isOutOfStock,
}: {
  coverUrl?: string;
  name: string;
  isOutOfStock: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const hasImage = coverUrl && coverUrl.trim() !== '' && !imageError;
  return hasImage ? (
    <Box
      component="img"
      src={coverUrl}
      alt={name}
      onError={() => setImageError(true)}
      sx={{
        width: 64,
        height: 64,
        flexShrink: 0,
        borderRadius: 1,
        objectFit: 'cover',
        ...(isOutOfStock && { opacity: 0.48, filter: 'grayscale(1)' }),
      }}
    />
  ) : (
    <Box
      sx={{
        width: 64,
        height: 64,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'action.hover',
        borderRadius: 1,
        ...(isOutOfStock && { opacity: 0.48 }),
      }}
    >
      <Box
        component="svg"
        xmlns="http://www.w3.org/2000/svg"
        width={32}
        height={32}
        viewBox="0 0 24 24"
        fill="currentColor"
        sx={{ color: 'text.disabled' }}
      >
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
      </Box>
    </Box>
  );
}

type Props = {
  row: IVehicleItem;
  editHref: string;
  onDeleteRow: () => Promise<void>;
  /** When true and row has inadequate inventory, show expand icon to display issue items. */
  showExpandableInventory?: boolean;
};

function getStockStatus(
  available: number,
  required: number
): { label: string; color: 'error' | 'warning' | 'secondary' | 'success' | 'default' } {
  if (available === 0) return { label: 'Out of Stock', color: 'error' };
  if (available < required) return { label: 'Low Stock', color: 'warning' };
  if (available === required) return { label: 'Adequate', color: 'success' };
  if (available > required) return { label: 'Excess', color: 'secondary' };
  return { label: 'Unknown', color: 'default' };
}

export function VehicleTableRow({ row, editHref, onDeleteRow, showExpandableInventory = false }: Props) {
  const menuActions = usePopover();
  const confirmDialog = useBoolean();
  const quickEditForm = useBoolean();
  const expanded = useBoolean(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteRow();
      confirmDialog.onFalse();
      setDeleteErrorMessage(null);
    } catch (error: any) {
      // Close the confirm dialog if deletion failed
      confirmDialog.onFalse();
      if (error?.__vehicleDeleteError && error.message) {
        setDeleteErrorMessage(error.message);
      } else {
        setDeleteErrorMessage('Failed to delete the vehicle.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const renderQuickEditForm = () => (
    <VehicleQuickEditForm
      currentData={row}
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
        <MenuItem
          onClick={() => {
            quickEditForm.onTrue();
            menuActions.onClose();
          }}
        >
          <Iconify icon="solar:pen-bold" />
          Edit
        </MenuItem>

        {row.status === 'inactive' && (
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
        )}
      </MenuList>
    </CustomPopover>
  );

  const renderConfirmDialog = () => (
    <Dialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Delete Vehicle</DialogTitle>
      <DialogContent>
        Are you sure you want to delete <strong>{row.license_plate}</strong>?
      </DialogContent>
      <DialogActions>
        <Button
          onClick={confirmDialog.onFalse}
          disabled={isDeleting}
          sx={{ mr: 1 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={isDeleting}
          startIcon={isDeleting ? <CircularProgress size={16} /> : null}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderErrorDialog = () =>
    deleteErrorMessage ? (
      <Dialog
        open={Boolean(deleteErrorMessage)}
        onClose={() => setDeleteErrorMessage(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Cannot Delete Vehicle</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>{deleteErrorMessage}</Box>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setDeleteErrorMessage(null)}>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    ) : null;

  const hasInadequateInventory =
    row.inventory_item_status != null &&
    String(row.inventory_item_status).toLowerCase() !== 'adequate';

  const shouldFetchInventory =
    showExpandableInventory && hasInadequateInventory && expanded.value;
  const { data: vehicleInventoryData } = useQuery({
    queryKey: ['vehicle-inventory', row.id],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.management.vehicle}/${row.id}/inventory`);
      const rows = response.data?.data ?? response.data ?? [];
      return rows as any[];
    },
    enabled: !!shouldFetchInventory,
  });

  const isLCT =
    row.type?.toLowerCase().includes('lane') || row.type?.toLowerCase() === 'lct';
  const inventoryIssueItems: InventoryIssueItem[] = useMemo(() => {
    if (!vehicleInventoryData) return [];
    return vehicleInventoryData
      .map((r: any) => {
        const requiredQty = isLCT
          ? Number(r.lct_required_qty ?? 0)
          : Number(r.hwy_required_qty ?? 0);
        const available = Number(r.vehicle_quantity ?? 0);
        const status = getStockStatus(available, requiredQty);
        return {
          id: r.id,
          name: r.name ?? '-',
          type: r.type ?? '-',
          available,
          requiredQty,
          statusLabel: status.label,
          statusColor: status.color,
          coverUrl: r.cover_url ?? r.coverUrl,
          typical_application: r.typical_application,
          sku: r.sku,
        };
      })
      .filter(
        (item: InventoryIssueItem) =>
          item.statusLabel !== 'Adequate'
      );
  }, [vehicleInventoryData, isLCT]);

  const summary = row.inventory_item_status_summary;
  const tooltipParts: string[] = [];
  if (summary) {
    if (summary.out_of_stock > 0) {
      tooltipParts.push(
        `${summary.out_of_stock} item${summary.out_of_stock === 1 ? '' : 's'} out of stock`
      );
    }
    if (summary.low_stock > 0) {
      tooltipParts.push(
        `${summary.low_stock} item${summary.low_stock === 1 ? '' : 's'} low stock`
      );
    }
    if (summary.excess > 0) {
      tooltipParts.push(
        `${summary.excess} item${summary.excess === 1 ? '' : 's'} in excess`
      );
    }
  }
  const tooltipContent =
    tooltipParts.length > 0 ? (
      <Box component="span" sx={{ display: 'block', fontSize: '14px', lineHeight: 1.5 }}>
        <Box component="span" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
          Inventory:
        </Box>
        {tooltipParts.map((text) => (
          <Box key={text} component="span" sx={{ display: 'block', pl: 1 }}>
            • {text}
          </Box>
        ))}
      </Box>
    ) : (
      <Box component="span" sx={{ fontSize: '14px' }}>
        Inventory: Not adequate.
      </Box>
    );

  return (
    <>
      <TableRow
        hover
        tabIndex={-1}
        sx={
          hasInadequateInventory
            ? {
                backgroundColor: 'rgba(var(--palette-warning-mainChannel) / 0.12)',
                color: 'var(--palette-text-primary)',
                '& .MuiTableCell-root': {
                  color: 'var(--palette-text-primary)',
                },
                '& .MuiTableCell-root:nth-of-type(2) a': {
                  color: 'var(--palette-primary-main) !important',
                },
                '&:hover': {
                  backgroundColor: 'rgba(var(--palette-warning-mainChannel) / 0.16)',
                },
                '& .MuiTableCell-root:nth-of-type(2) a:hover': {
                  color: 'var(--palette-primary-dark) !important',
                },
              }
            : undefined
        }
      >
        <TableCell>
          {(() => {
            switch (row.type) {
              case 'highway_truck':
                return 'HWY';
              case 'lane_closure_truck':
                return 'LCT';
              default:
                return VEHICLE_TYPE_OPTIONS.find((option) => option.value === row.type)?.label || row.type;
            }
          })()}
        </TableCell>

        <TableCell>
          <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
            <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
              <Link
                component={RouterLink}
                href={editHref}
                color="primary"
                sx={{ cursor: 'pointer', fontWeight: 'bold' }}
              >
                {row.license_plate}
              </Link>
              <Box sx={{ typography: 'caption', color: 'text.secondary' }}>
                {row.info} {row.year && `(${row.year})`}
              </Box>
            </Stack>
          </Box>
        </TableCell>

        <TableCell>
          <Stack sx={{ typography: 'body2', alignItems: 'flex-start' }}>
            <Box>{row.unit_number}</Box>
            {row.location && (
              <Box sx={{ typography: 'caption', color: 'text.secondary' }}>
                {row.location}
              </Box>
            )}
          </Stack>
        </TableCell>

        <TableCell>
          {row.assigned_driver && (
            <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
              <Avatar
                src={row.assigned_driver.photo_url ?? undefined}
                alt={row.assigned_driver.first_name}
                sx={{ width: 32, height: 32 }}
              >
                {row.assigned_driver.first_name?.charAt(0).toUpperCase()}
              </Avatar>

              <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
                {`${row.assigned_driver.first_name} ${row.assigned_driver.last_name}`}
              </Stack>
            </Box>
          )}
        </TableCell>

        <TableCell>{row.region}</TableCell>

        <TableCell align="center">
          {row.is_spare_key && (
            <Iconify icon="eva:checkmark-fill" sx={{ color: 'success.main' }} />
          )}
        </TableCell>

        <TableCell align="center">
          {row.is_winter_tire && (
            <Iconify icon="eva:checkmark-fill" sx={{ color: 'success.main' }} />
          )}
        </TableCell>

        <TableCell align="center">
          {row.is_tow_hitch && (
            <Iconify icon="eva:checkmark-fill" sx={{ color: 'success.main' }} />
          )}
        </TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={
              (row.status === 'active' && 'success') ||
              (row.status === 'inactive' && 'error') ||
              (row.status === 'repair' && 'warning') ||
              'default'
            }
          >
            {row.status}
          </Label>
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48 }}>
            {hasInadequateInventory && (
              <Tooltip
                title={tooltipContent}
                placement="left"
                arrow
                componentsProps={{
                  tooltip: {
                    sx: {
                      fontSize: '14px',
                      maxWidth: 320,
                      '& .MuiTooltip-arrow': {
                        color: 'grey.800',
                      },
                    },
                  },
                }}
              >
                <IconButton
                  size="small"
                  sx={{
                    color: 'warning.main',
                    backgroundColor: 'warning.lighter',
                    '&:hover': {
                      backgroundColor: 'warning.light',
                    },
                  }}
                >
                  <Iconify icon="solar:info-circle-bold" width={20} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {showExpandableInventory && hasInadequateInventory && (
              <IconButton
                size="small"
                color={expanded.value ? 'inherit' : 'default'}
                onClick={(e) => {
                  e.stopPropagation();
                  expanded.onToggle();
                }}
                aria-label={expanded.value ? 'Collapse inventory issues' : 'Expand inventory issues'}
                sx={{ ...(expanded.value && { bgcolor: 'action.hover' }) }}
              >
                <Iconify
                  icon={expanded.value ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
                  width={20}
                />
              </IconButton>
            )}
            <IconButton
              color={menuActions.open ? 'inherit' : 'default'}
              onClick={menuActions.onOpen}
            >
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>

      {showExpandableInventory && hasInadequateInventory && (
        <TableRow sx={{ whiteSpace: 'nowrap' }}>
          <TableCell sx={{ p: 0, border: 'none', width: '100%' }} colSpan={TABLE_COLUMN_COUNT}>
            <Collapse
              in={expanded.value}
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
                    gridTemplateColumns: '1fr 160px 100px 100px 100px',
                    alignItems: 'center',
                    p: theme.spacing(1.5, 2, 1.5, 1.5),
                    borderBottom: `solid 2px ${theme.vars.palette.background.neutral}`,
                    width: '100%',
                    '& .MuiTypography-root': { fontWeight: 600 },
                  })}
                >
                  <Typography variant="subtitle2">Product</Typography>
                  <Typography variant="subtitle2">Type</Typography>
                  <Typography variant="subtitle2" sx={{ textAlign: 'center' }}>
                    Current Qty
                  </Typography>
                  <Typography variant="subtitle2" sx={{ textAlign: 'center' }}>
                    Required Qty
                  </Typography>
                  <Typography variant="subtitle2" sx={{ textAlign: 'center' }}>
                    Status
                  </Typography>
                </Box>
              </Paper>
              <Paper
                sx={{
                  m: 1.5,
                  mt: 0,
                  mb: 1,
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                }}
              >
                {inventoryIssueItems.length === 0 && !vehicleInventoryData ? (
                  <Box sx={{ py: 3, px: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Loading…
                    </Typography>
                  </Box>
                ) : inventoryIssueItems.length === 0 ? (
                  <Box sx={{ py: 3, px: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No inventory issues
                    </Typography>
                  </Box>
                ) : (
                  inventoryIssueItems.map((item) => (
                    <Box
                      key={item.id}
                      sx={(theme) => ({
                        display: 'grid',
                        gridTemplateColumns: '1fr 160px 100px 100px 100px',
                        alignItems: 'center',
                        p: theme.spacing(1.5, 2, 1.5, 1.5),
                        borderBottom: `solid 2px ${theme.vars.palette.background.neutral}`,
                        width: '100%',
                        '&:last-of-type': { borderBottom: 'none' },
                      })}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <InventoryItemImage
                          coverUrl={item.coverUrl}
                          name={item.name}
                          isOutOfStock={item.available === 0}
                        />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {item.name}
                          </Typography>
                          {item.typical_application && (
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {item.typical_application}
                            </Typography>
                          )}
                          {item.sku && (
                            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                              SKU: {item.sku}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {item.type
                          ? String(item.type)
                              .split('_')
                              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                              .join(' ')
                          : '-'}
                      </Typography>
                      <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 500 }}>
                        {item.available}
                      </Typography>
                      <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
                        {item.requiredQty}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Label variant="soft" color={item.statusColor}>
                          {item.statusLabel}
                        </Label>
                      </Box>
                    </Box>
                  ))
                )}
              </Paper>
            </Collapse>
          </TableCell>
        </TableRow>
      )}

      {renderQuickEditForm()}
      {renderMenuActions()}
      {renderConfirmDialog()}
      {renderErrorDialog()}
    </>
  );
}
