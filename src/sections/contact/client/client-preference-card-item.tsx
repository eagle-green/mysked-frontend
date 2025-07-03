
import { useState } from 'react';
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
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type ClientRestriction = {
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

type ClientPreferenceItemProps = {
  restriction: ClientRestriction;
  onDelete: (id: string) => void;
  onEdit: (restriction: ClientRestriction) => void;
  sx?: any;
  [key: string]: any;
};

export function ClientPreferenceCardItem({
  restriction,
  onDelete,
  onEdit,
  sx,
  ...other
}: ClientPreferenceItemProps) {

  const menuActions = usePopover();
  const confirmDialog = useBoolean();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    menuActions.onClose();
    confirmDialog.onTrue();
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(restriction.id);
    } finally {
      setIsDeleting(false);
      confirmDialog.onFalse();
    }
  };

  const handleEdit = () => {
    onEdit(restriction);
    menuActions.onClose();
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    return '?';
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
          <Button 
            onClick={confirmDialog.onFalse} 
            color="inherit"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 