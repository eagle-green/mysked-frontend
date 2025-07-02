import type { PaperProps } from '@mui/material/Paper';

import { usePopover, useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type SiteRestriction = {
  id: string;
  reason?: string;
  restricted_user: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url?: string | null;
    display_name: string;
  };
};

type SitePreferenceItemProps = {
  restriction: SiteRestriction;
  onDelete: (id: string) => void;
  onEdit: (restriction: SiteRestriction) => void;
  sx?: any;
  [key: string]: any;
};

export function SitePreferenceCardItem({
  restriction,
  onDelete,
  onEdit,
  sx,
  ...other
}: SitePreferenceItemProps) {
  const menuActions = usePopover();
  const confirmDialog = useBoolean();

  const handleDelete = () => {
    menuActions.onClose();
    confirmDialog.onTrue();
  };

  const confirmDelete = () => {
    onDelete(restriction.id);
    confirmDialog.onFalse();
  };

  const handleEdit = () => {
    onEdit(restriction);
    menuActions.onClose();
  };

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
    >
      <MenuList>
        <MenuItem onClick={handleEdit}>
          <Iconify icon="solar:pen-bold" />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Iconify icon="solar:trash-bin-trash-bold" />
          Delete
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    return '?';
  };

  return (
    <>
      <Paper
        variant="outlined"
        sx={[{ p: 2.5, width: 1, position: 'relative' }, ...(Array.isArray(sx) ? sx : [sx])]}
        {...other}
      >
        <Box sx={{ mb: 1, gap: 1, display: 'flex', alignItems: 'center' }}>
          <Avatar
            src={restriction.restricted_user.photo_url || undefined}
            sx={{
              width: 32,
              height: 32,
              fontSize: 14,
              mr: 1,
            }}
          >
            {getInitials(restriction.restricted_user.first_name, restriction.restricted_user.last_name)}
          </Avatar>
          <Typography variant="subtitle2">{restriction.restricted_user.display_name}</Typography>
        </Box>
        {restriction.reason && (
          <Typography variant="body2" color="text.secondary">
            Reason: {restriction.reason}
          </Typography>
        )}
        <IconButton onClick={menuActions.onOpen} sx={{ top: 8, right: 8, position: 'absolute' }}>
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>
      </Paper>

      {renderMenuActions()}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.value} onClose={confirmDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove the restriction for{' '}
            <strong>{restriction.restricted_user.display_name}</strong>?
          </Typography>
          {restriction.reason && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Reason: {restriction.reason}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={confirmDialog.onFalse} color="inherit">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 