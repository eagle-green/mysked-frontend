import type { ProgressStep } from 'src/components/progress-dialog/types';

import { useBoolean } from 'minimal-shared/hooks';
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

import { Iconify } from 'src/components/iconify';
import { InvoiceCreationProgressDialog } from 'src/components/progress-dialog';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (recipientUserIds: string[]) => Promise<void>;
};

const ROLE_ALL = '__all__';

export function AnnouncementRecipientDialog({ open, onClose, onConfirm }: Props) {
  const { data: users = [], isLoading } = useGetUsersForAnnouncements();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [roleFilter, setRoleFilter] = useState<string>(ROLE_ALL);
  const [search, setSearch] = useState('');
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [currentProgressStep, setCurrentProgressStep] = useState(0);
  const progressDialog = useBoolean();

  const roleOptions = useMemo(() => {
    const roles = new Set(users.map((u) => u.role).filter(Boolean));
    return Array.from(roles).sort();
  }, [users]);

  const filteredUsers = useMemo(() => users.filter((user) => {
      const matchRole = roleFilter === ROLE_ALL || user.role === roleFilter;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        `${(user.first_name || '')} ${(user.last_name || '')}`.toLowerCase().includes(q) ||
        (user.email || '').toLowerCase().includes(q);
      return matchRole && matchSearch;
    }), [users, roleFilter, search]);

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

  const handleCreateAndSend = useCallback(async () => {
    const steps: ProgressStep[] = [
      { label: 'Creating announcement', description: 'Saving announcement and recipients', status: 'active' },
      { label: 'Sending to recipients', description: `Sending to ${selectedIds.size} employee(s)`, status: 'pending' },
    ];
    setProgressSteps(steps);
    setCurrentProgressStep(0);
    progressDialog.onTrue();

    try {
      await onConfirm(Array.from(selectedIds));
      setProgressSteps((prev) => {
        const next = [...prev];
        next[0] = { ...next[0], status: 'completed' };
        next[1] = { ...next[1], status: 'active', description: 'Sending emails and notifications…' };
        return next;
      });
      setCurrentProgressStep(1);
      setProgressSteps((prev) => {
        const next = [...prev];
        next[1] = { ...next[1], status: 'completed', description: `Sent to ${selectedIds.size} recipient(s)` };
        return next;
      });
      setTimeout(() => {
        progressDialog.onFalse();
        setSelectedIds(new Set());
        setRoleFilter(ROLE_ALL);
        setSearch('');
        onClose();
      }, 800);
    } catch (error: any) {
      setProgressSteps((prev) => {
        const next = [...prev];
        const activeIndex = next.findIndex((s) => s.status === 'active');
        if (activeIndex >= 0) {
          next[activeIndex] = {
            ...next[activeIndex],
            status: 'error',
            description: error?.message || error?.response?.data?.error || 'Something went wrong',
          };
        }
        return next;
      });
      setTimeout(() => progressDialog.onFalse(), 2500);
      throw error;
    }
  }, [selectedIds, onConfirm, onClose, progressDialog]);

  const handleClose = () => {
    if (progressDialog.value) return; // don't close while sending
    setSelectedIds(new Set());
    setRoleFilter(ROLE_ALL);
    setSearch('');
    onClose();
  };

  const selectedCount = selectedIds.size;
  const totalCount = users.length;

  return (
    <>
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Select employees to send announcement to
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
          <Typography color="text.secondary">No employees available.</Typography>
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
              <Checkbox edge="start" checked={allFilteredSelected} indeterminate={!allFilteredSelected && filteredIds.some((id) => selectedIds.has(id))} disableRipple />
              <ListItemText primary={allFilteredSelected ? 'Deselect all (visible)' : 'Select all (visible)'} primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
            <List dense disablePadding>
              {filteredUsers.map((user) => (
                <ListItem key={user.id} disablePadding secondaryAction={
                  <Checkbox edge="end" checked={selectedIds.has(user.id)} onChange={() => handleToggle(user.id)} disableRipple />
                }>
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                          {user.email && <Typography component="span" variant="caption" color="text.secondary">{user.email}</Typography>}
                          {user.role && (
                            <Typography component="span" variant="caption" color="text.secondary">
                              • {getRoleLabel(user.role) || user.role}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
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
        <Button onClick={handleClose} disabled={progressDialog.value}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleCreateAndSend}
          disabled={isLoading || users.length === 0 || selectedIds.size === 0 || progressDialog.value}
          startIcon={progressDialog.value ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {progressDialog.value ? 'Sending…' : 'Create and Send'}
        </Button>
      </DialogActions>
    </Dialog>

    <InvoiceCreationProgressDialog
      open={progressDialog.value}
      title="Sending Announcement"
      subtitle="Please wait while we create the announcement and send it to the selected recipients. Do not close this window."
      steps={progressSteps}
      currentStep={currentProgressStep}
    />
    </>
  );
}
