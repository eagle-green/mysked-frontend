import type { AnnouncementTrackingItem } from 'src/actions/announcements';

import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Input from '@mui/material/Input';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import ListItem from '@mui/material/ListItem';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import ListItemButton from '@mui/material/ListItemButton';
import CircularProgress from '@mui/material/CircularProgress';

import { getRoleLabel } from 'src/utils/format-role';

import { useGetUsersForAnnouncements } from 'src/actions/announcements';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (recipientUserIds: string[]) => Promise<void>;
  existingRecipients: AnnouncementTrackingItem[];
  mode: 'resend' | 'add';
};

const ROLE_ALL = '__all__';

export function AnnouncementResendDialog({ open, onClose, onConfirm, existingRecipients, mode }: Props) {
  const { data: allUsers = [], isLoading } = useGetUsersForAnnouncements();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [roleFilter, setRoleFilter] = useState<string>(ROLE_ALL);
  const [search, setSearch] = useState('');
  const [isSending, setIsSending] = useState(false);

  const existingRecipientIds = useMemo(
    () => new Set(existingRecipients.map((r) => r.userId)),
    [existingRecipients]
  );

  // Filter users based on mode
  const users = useMemo(() => {
    if (mode === 'resend') {
      // Show only existing recipients
      return allUsers.filter((u) => existingRecipientIds.has(u.id));
    }
    // mode === 'add': Show only users who are NOT already recipients
    return allUsers.filter((u) => !existingRecipientIds.has(u.id));
  }, [allUsers, existingRecipientIds, mode]);

  const roleOptions = useMemo(() => {
    const roles = new Set(users.map((u) => u.role).filter(Boolean));
    return Array.from(roles).sort();
  }, [users]);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchRole = roleFilter === ROLE_ALL || user.role === roleFilter;
        const q = search.trim().toLowerCase();
        const matchSearch =
          !q ||
          `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(q) ||
          (user.email || '').toLowerCase().includes(q);
        return matchRole && matchSearch;
      }),
    [users, roleFilter, search]
  );

  const filteredIds = useMemo(() => filteredUsers.map((u) => u.id), [filteredUsers]);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const handleSend = useCallback(async () => {
    setIsSending(true);
    try {
      await onConfirm(Array.from(selectedIds));
      setSelectedIds(new Set());
      setRoleFilter(ROLE_ALL);
      setSearch('');
      onClose();
    } catch (error) {
      console.error('Error sending:', error);
    } finally {
      setIsSending(false);
    }
  }, [selectedIds, onConfirm, onClose]);

  const handleClose = () => {
    if (isSending) return;
    setSelectedIds(new Set());
    setRoleFilter(ROLE_ALL);
    setSearch('');
    onClose();
  };

  const selectedCount = selectedIds.size;
  const totalCount = users.length;

  const title = mode === 'resend' ? 'Resend to existing recipients' : 'Add new recipients';
  const buttonText = mode === 'resend' ? 'Resend' : 'Send to new recipients';

  // For resend mode, show recipient status
  const recipientStatusMap = useMemo(() => {
    const map = new Map<string, AnnouncementTrackingItem>();
    existingRecipients.forEach((r) => map.set(r.userId, r));
    return map;
  }, [existingRecipients]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {title}
        {!isLoading && totalCount > 0 && (
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1, fontWeight: 'normal' }}>
            ({selectedCount}/{totalCount})
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : users.length === 0 ? (
          <Typography color="text.secondary">
            {mode === 'resend'
              ? 'No existing recipients found.'
              : 'All active employees are already recipients of this announcement.'}
          </Typography>
        ) : (
          <>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, mt: 1 }}>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel id="recipient-role-label">Role</InputLabel>
                <Select
                  labelId="recipient-role-label"
                  value={roleFilter}
                  label="Role"
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <MenuItem value={ROLE_ALL}>All roles</MenuItem>
                  {roleOptions.map((role) => (
                    <MenuItem key={role} value={role}>
                      {getRoleLabel(role) || role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Input
                size="small"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" width={20} sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                }
                sx={{ flex: 1, minWidth: 200 }}
              />
            </Box>
            <ListItemButton onClick={handleSelectAll} dense>
              <Checkbox
                edge="start"
                checked={allFilteredSelected}
                indeterminate={!allFilteredSelected && filteredIds.some((id) => selectedIds.has(id))}
                disableRipple
              />
              <ListItemText
                primary={allFilteredSelected ? 'Deselect all' : 'Select all'}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItemButton>
            <List dense disablePadding>
              {filteredUsers.map((user) => {
                const status = recipientStatusMap.get(user.id);
                return (
                  <ListItem
                    key={user.id}
                    disablePadding
                    secondaryAction={
                      <Checkbox
                        edge="end"
                        checked={selectedIds.has(user.id)}
                        onChange={() => handleToggle(user.id)}
                        disableRipple
                      />
                    }
                  >
                    <ListItemButton onClick={() => handleToggle(user.id)}>
                      <Avatar
                        src={user.photo_url ?? undefined}
                        alt={`${user.first_name} ${user.last_name}`.trim()}
                        sx={{ width: 40, height: 40, mr: 1.5 }}
                      >
                        {(user.first_name?.charAt(0) || user.email?.charAt(0) || '?').toUpperCase()}
                      </Avatar>
                      <ListItemText
                        primary={`${user.first_name} ${user.last_name}`.trim() || user.email || user.id}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25, flexWrap: 'wrap' }}>
                            {user.email && (
                              <Typography component="span" variant="caption" color="text.secondary">
                                {user.email}
                              </Typography>
                            )}
                            {user.role && (
                              <Typography component="span" variant="caption" color="text.secondary">
                                • {getRoleLabel(user.role) || user.role}
                              </Typography>
                            )}
                            {mode === 'resend' && status && (
                              <>
                                {status.readAt && (
                                  <Label variant="soft" color="success" sx={{ fontSize: '0.65rem', height: 18 }}>
                                    Read
                                  </Label>
                                )}
                                {!status.readAt && (
                                  <Label variant="soft" color="warning" sx={{ fontSize: '0.65rem', height: 18 }}>
                                    Unread
                                  </Label>
                                )}
                                {status.signedAt && (
                                  <Label variant="soft" color="info" sx={{ fontSize: '0.65rem', height: 18 }}>
                                    Signed
                                  </Label>
                                )}
                              </>
                            )}
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
            {filteredUsers.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                No employees match the filters.
              </Typography>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={isLoading || users.length === 0 || selectedIds.size === 0 || isSending}
          startIcon={isSending ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isSending ? 'Sending…' : buttonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
