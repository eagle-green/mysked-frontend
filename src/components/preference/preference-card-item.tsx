import { useState } from 'react';
import { usePopover, useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
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

// type PaletteColor = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'grey';

type PreferenceContext = 'client' | 'user' | 'company' | 'site';

type PreferenceCardItemProps = {
  restriction: {
    id: string;
    preference_type?: string;
    reason?: string;
    is_mandatory?: boolean;
    employee?: {
      id: string;
      first_name: string;
      last_name: string;
      photo_url?: string | null;
      display_name: string;
    };
    user?: {
      id: string;
      first_name: string;
      last_name: string;
      photo_url?: string | null;
      display_name: string;
    };
  };
  context: PreferenceContext;
  onDelete: (id: string) => void;
  onEdit: (restriction: any) => void;
  sx?: any;
  [key: string]: any;
};

export function PreferenceCardItem({
  restriction,
  context,
  onDelete,
  onEdit,
  sx,
  ...other
}: PreferenceCardItemProps) {
  const menuActions = usePopover();
  const confirmDialog = useBoolean();
  const [isDeleting, setIsDeleting] = useState(false);

  const isPreferred = restriction.preference_type === 'preferred' || restriction.id === 'preferred';
  const preferenceLabel = isPreferred ? 'Preferred' : 'Not Preferred';

  const handleEdit = () => {
    onEdit(restriction);
    menuActions.onClose();
  };

  const handleDelete = () => {
    confirmDialog.onTrue();
    menuActions.onClose();
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(restriction.id);
      confirmDialog.onFalse();
    } catch (error) {
      console.error('Error deleting preference:', error);
    } finally {
      setIsDeleting(false);
    }
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
        <Box
          sx={{
            mb: 1,
            gap: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              src={(restriction.employee || restriction.user)?.photo_url ?? undefined}
              alt={(restriction.employee || restriction.user)?.first_name}
            >
              {(restriction.employee || restriction.user)?.first_name?.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="subtitle2">
              {(restriction.employee || restriction.user)?.first_name} {(restriction.employee || restriction.user)?.last_name}
            </Typography>
          </Box>

          {/* Mandatory Chip for "not preferred" preferences */}
          {restriction.is_mandatory && !isPreferred && (
            <Chip
              label="Mandatory"
              size="small"
              color="error"
              variant="filled"
              sx={{
                height: 20,
                fontSize: 11,
                fontWeight: 600,
                mr: 5, // Add margin to avoid conflict with menu icon
              }}
            />
          )}
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
            Are you sure you want to remove this <strong>{preferenceLabel}</strong> preference
            {(restriction.employee || restriction.user) && (
              <>
                {' '}
                for <strong>{(restriction.employee || restriction.user)?.display_name || `${(restriction.employee || restriction.user)?.first_name} ${(restriction.employee || restriction.user)?.last_name}`}</strong>
              </>
            )}
            ?
          </Typography>
          {restriction.reason && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Reason: {restriction.reason}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={confirmDialog.onFalse} color="inherit" disabled={isDeleting}>
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
